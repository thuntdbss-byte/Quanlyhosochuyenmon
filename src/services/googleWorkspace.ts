import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Department, TeachingAssignment, GiaoAnItem, BaoGiangEntry, WeeklyBaoGiangFile } from '../types';

// Supported OAuth scopes configured for Google Workspace
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

// Target Google Drive Folder specified for Teacher Records
export const DEFAULT_DRIVE_FOLDER_ID = '1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq';
export const DEFAULT_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq?usp=drive_link';

/**
 * Extracts Google Drive Folder ID from a full Drive URL or returns trimmed raw ID.
 */
export const extractDriveFolderId = (input: string): string => {
  if (!input) return DEFAULT_DRIVE_FOLDER_ID;
  const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const idMatch = input.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return input.trim();
};

// Fallback / environment configuration support for GitHub clones & custom deployments
export const getEffectiveFirebaseConfig = () => {
  return {
    projectId: rawFirebaseConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0063576688',
    appId: rawFirebaseConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '1:559070527306:web:80f80cd6a4c90c79ec4bb3',
    apiKey: rawFirebaseConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDFKp8hjHFfA6aIdk1EZMs7GfcCJG1Hows',
    authDomain: rawFirebaseConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0063576688.firebaseapp.com',
    storageBucket: rawFirebaseConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0063576688.firebasestorage.app',
    messagingSenderId: rawFirebaseConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '559070527306',
    oAuthClientId: rawFirebaseConfig?.oAuthClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '559070527306-6vqhml1312cdc5n9e49jp30ardkmjagh.apps.googleusercontent.com'
  };
};

const firebaseConfig = getEffectiveFirebaseConfig();

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Workspace scopes
const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (never stored in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;
let cachedManualUser: { displayName: string; email: string; photoURL?: string } | null = null;
let isSigningIn = false;

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  fileId?: string;
  fileUrl?: string;
  message: string;
}

/**
 * Diagnostic helper: Translates raw Google/Firebase error codes into actionable Vietnamese guidance.
 */
export const translateGoogleAuthError = (error: any): { title: string; detail: string; solution: string } => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    const currentOrigin = window.location.origin;
    return {
      title: 'Tên miền chưa được xác thực (Authorized Domain)',
      detail: `Tên miền hiện tại (${currentOrigin}) chưa được thêm vào mục Authorized Domains của Firebase / Google Cloud Project.`,
      solution: `1. Mở Firebase Console > Authentication > Settings > Authorized Domains và thêm: ${currentOrigin}\n2. Hoặc sử dụng tính năng "Đăng nhập Google Identity (GIS)" hoặc "Nhập Access Token trực tiếp" ở bên dưới.`
    };
  }

  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return {
      title: 'Cửa sổ đăng nhập bị trình duyệt chặn (Popup Blocked)',
      detail: 'Trình duyệt đang chặn cửa sổ bật lên đăng nhập của Google.',
      solution: 'Vui lòng nhấn vào biểu tượng ổ khóa hoặc chặn popup trên thanh địa chỉ trình duyệt, chọn "Luôn cho phép cửa sổ bật lên" rồi thử lại.'
    };
  }

  if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
    return {
      title: 'Cửa sổ đăng nhập bị đóng',
      detail: 'Bạn đã đóng cửa sổ xác thực Google trước khi hoàn tất cấp quyền.',
      solution: 'Vui lòng bấm lại nút "Đăng nhập với Google" và chọn tài khoản để tiếp tục.'
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Phương thức Google Sign-in chưa được kích hoạt',
      detail: 'Dự án Firebase chưa bật Sign-in provider "Google".',
      solution: 'Vào Firebase Console > Authentication > Sign-in method > Bật Google provider.'
    };
  }

  if (message.includes('403') || message.includes('The caller does not have permission')) {
    return {
      title: 'Thiếu quyền truy cập Google API',
      detail: 'Tài khoản chưa cấp quyền Google Drive hoặc Google Sheets API.',
      solution: 'Vui lòng đăng xuất và đăng nhập lại, đảm bảo tích chọn cấp quyền xem/sửa Google Sheets và Google Drive khi Google hỏi.'
    };
  }

  return {
    title: 'Lỗi xác thực Google',
    detail: message || 'Đã xảy ra sự cố trong quá trình kết nối với Google Workspace.',
    solution: 'Kiểm tra kết nối mạng hoặc thử phương thức đăng nhập Google Identity (GIS) / Token trực tiếp.'
  };
};

/**
 * Initialize auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: { displayName?: string | null; email?: string | null; photoURL?: string | null }, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (cachedManualUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(cachedManualUser, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-In with popup via Firebase Auth.
 */
export const googleSignIn = async (): Promise<{ user: { displayName?: string | null; email?: string | null; photoURL?: string | null }; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được access token từ Google Authentication');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Workspace (Firebase Auth):', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Perform Google Sign-In with Google Identity Services (GIS) TokenClient.
 * Provides high compatibility across iframes and custom domains.
 */
export const googleSignInWithGIS = async (
  emailHint: string = 'ThuntDBSS@gmail.com'
): Promise<{ user: { displayName: string; email: string; photoURL?: string }; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    // Check if GIS library is loaded
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.oauth2) {
      return reject(new Error('Thư viện Google Identity Services chưa tải xong. Vui lòng thử lại sau 2 giây.'));
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      return reject(new Error('Chưa cấu hình OAuth Client ID trong dự án.'));
    }

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: WORKSPACE_SCOPES.join(' '),
        hint: emailHint,
        callback: async (response: any) => {
          if (response.error) {
            return reject(new Error(`Lỗi Google OAuth: ${response.error_description || response.error}`));
          }
          if (!response.access_token) {
            return reject(new Error('Không nhận được access token từ Google.'));
          }

          cachedAccessToken = response.access_token;

          // Fetch user profile info from Google UserInfo endpoint
          let userInfo = {
            displayName: 'Tài khoản Google',
            email: 'google-user@edu.vn',
            photoURL: ''
          };

          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${cachedAccessToken}` }
            });
            if (userRes.ok) {
              const uData = await userRes.json();
              userInfo = {
                displayName: uData.name || uData.email || 'Người dùng Google',
                email: uData.email || '',
                photoURL: uData.picture || ''
              };
            }
          } catch (e) {
            console.warn('Không thể lấy chi tiết userinfo:', e);
          }

          cachedManualUser = userInfo;
          resolve({ user: userInfo, accessToken: response.access_token });
        }
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
};

/**
 * Manually set an OAuth access token (useful for local development, testing, or restricted networks).
 */
export const setManualAccessToken = async (token: string): Promise<{ user: { displayName: string; email: string }; accessToken: string }> => {
  if (!token.trim()) throw new Error('Token không được để trống');
  cachedAccessToken = token.trim();

  // Test token by querying Google UserInfo
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });
    if (userRes.ok) {
      const uData = await userRes.json();
      const user = {
        displayName: uData.name || uData.email || 'Google User',
        email: uData.email || 'token-user@gmail.com'
      };
      cachedManualUser = user;
      return { user, accessToken: cachedAccessToken };
    }
  } catch (err) {
    console.warn('Không thể kiểm tra userinfo của token:', err);
  }

  const fallbackUser = { displayName: 'Người dùng Google (Manual Token)', email: 'direct-token@edu.vn' };
  cachedManualUser = fallbackUser;
  return { user: fallbackUser, accessToken: cachedAccessToken };
};

/**
 * Get the in-memory cached access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out and clear in-memory token.
 */
export const googleLogout = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
  cachedManualUser = null;
};

// ==========================================
// GOOGLE DRIVE API FUNCTIONS
// ==========================================

/**
 * List files created or accessible by the app in Google Drive.
 */
export const listDriveFiles = async (mimeTypeFilter?: string): Promise<DriveFileInfo[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

  let q = "trashed = false";
  if (mimeTypeFilter) {
    q += ` and mimeType = '${mimeTypeFilter}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&pageSize=50&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải danh sách tệp Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Create a folder in Google Drive.
 */
export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<DriveFileInfo> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tạo thư mục Google Drive (${res.status})`);
  }

  return await res.json();
};

/**
 * Searches for a subfolder by name inside parentFolderId.
 * If not found, creates it and returns the subfolder ID.
 */
export const getOrCreateSubfolder = async (parentFolderId: string, folderName: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) return parentFolderId;

  try {
    const q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Subfolder does not exist yet; create it
    const created = await createDriveFolder(folderName, parentFolderId);
    return created.id;
  } catch (err) {
    console.warn(`Không thể tạo thư mục con "${folderName}", lưu trực tiếp vào thư mục cha:`, err);
    return parentFolderId;
  }
};

/**
 * Upload a file (binary File/Blob or string) to Google Drive safely without byte corruption.
 */
export const uploadFileToDrive = async (
  fileName: string,
  mimeType: string,
  content: string | Blob | File,
  folderId?: string
): Promise<DriveFileInfo> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng đăng nhập Google trước.');

  const metadata: any = {
    name: fileName,
    mimeType: mimeType || 'application/octet-stream'
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = new Blob(
    [
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: ${mimeType}\r\n\r\n`
    ],
    { type: 'text/plain' }
  );

  const filePart = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const endPart = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartRequestBody = new Blob([metaPart, filePart, endPart]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải tệp lên Google Drive (${res.status})`);
  }

  return await res.json();
};

/**
 * List all files in a specific Google Drive folder (defaults to teacher records folder).
 */
export const listFilesInTargetFolder = async (
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveFileInfo[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const q = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&pageSize=100&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      return data.files || [];
    }
  } catch (err) {
    console.warn('Lỗi đọc danh sách tệp từ folder đích:', err);
  }
  return [];
};

export type TeacherRecordCategory = 'SO_BAO_GIANG' | 'KE_HOACH_BAI_DAY' | 'KE_HOACH_CHUYEN_MON' | 'TONG_HOP';

export interface UploadTeacherRecordParams {
  fileName: string;
  category: TeacherRecordCategory;
  content: string | Blob | File;
  mimeType?: string;
  teacherName?: string;
  week?: number | string;
  folderId?: string;
}

/**
 * Upload a teacher record (Sổ báo giảng, Kế hoạch bài dạy, v.v.)
 * directly into the target folder (https://drive.google.com/drive/folders/1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq)
 * organized cleanly into categorized subfolders.
 */
export const uploadTeacherRecordToTargetDrive = async ({
  fileName,
  category,
  content,
  mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  teacherName,
  week,
  folderId = DEFAULT_DRIVE_FOLDER_ID
}: UploadTeacherRecordParams): Promise<DriveFileInfo> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng đăng nhập Google trước khi lưu hồ sơ.');

  // Determine subfolder category name
  const subfolderMap: Record<TeacherRecordCategory, string> = {
    SO_BAO_GIANG: '01_So_Bao_Giang',
    KE_HOACH_BAI_DAY: '02_Ke_Hoach_Bai_Day_KHBD',
    KE_HOACH_CHUYEN_MON: '03_Ke_Hoach_Chuyen_Mon',
    TONG_HOP: '04_Sao_Luu_Chuyen_Mon'
  };

  const subfolderName = subfolderMap[category] || '01_Ho_So_Chuyen_Mon';
  
  // Resolve subfolder in target Google Drive folder
  const targetSubfolderId = await getOrCreateSubfolder(folderId, subfolderName);

  // Clean filename if needed
  let finalFileName = fileName;
  if (teacherName && !finalFileName.includes(teacherName.replace(/\s+/g, ''))) {
    const extIdx = finalFileName.lastIndexOf('.');
    if (extIdx !== -1) {
      finalFileName = `${finalFileName.slice(0, extIdx)}_${teacherName.replace(/\s+/g, '')}${week ? `_Tuan${week}` : ''}${finalFileName.slice(extIdx)}`;
    }
  }

  // Detect mimeType
  let resolvedMimeType = mimeType;
  if (finalFileName.endsWith('.docx')) {
    resolvedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (finalFileName.endsWith('.xlsx')) {
    resolvedMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (finalFileName.endsWith('.pdf')) {
    resolvedMimeType = 'application/pdf';
  } else if (finalFileName.endsWith('.json')) {
    resolvedMimeType = 'application/json';
  } else if (finalFileName.endsWith('.txt')) {
    resolvedMimeType = 'text/plain; charset=UTF-8';
  }

  return await uploadFileToDrive(finalFileName, resolvedMimeType, content, targetSubfolderId);
};

export interface BatchSyncTeacherRecordsResult {
  total: number;
  successCount: number;
  failedCount: number;
  uploadedFiles: { id: string; name: string; url?: string; category: string }[];
}

/**
 * Batch sync / upload all teacher records (Sổ báo giảng, Kế hoạch bài dạy KHBD, Kế hoạch giáo dục)
 * directly into the target Google Drive folder (1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq).
 */
export const batchSyncAllTeacherRecordsToDrive = async (
  giaoAnList: GiaoAnItem[],
  weeklyBaoGiangFiles: WeeklyBaoGiangFile[],
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<BatchSyncTeacherRecordsResult> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng đăng nhập Google trước.');

  const results: { id: string; name: string; url?: string; category: string }[] = [];
  let failedCount = 0;

  // 1. Upload Sổ báo giảng files
  for (const bg of weeklyBaoGiangFiles) {
    try {
      const content = `TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN\nSỔ BÁO GIẢNG VÀ KẾ HOẠCH DẠY HỌC\n\nGiáo viên: ${bg.teacherName}\nTổ chuyên môn: ${bg.departmentName}\nTuần thực hiện: Tuần ${bg.week}\nNgày nộp: ${bg.uploadDate}\nTrạng thái phê duyệt: ${bg.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chờ duyệt'}\nGhi chú / Tiến độ: ${bg.notes || 'Đúng tiến độ PPCT'}\n\nĐã xác nhận và lưu trữ tại Google Drive.`;
      const uploaded = await uploadTeacherRecordToTargetDrive({
        fileName: bg.fileName.endsWith('.docx') || bg.fileName.endsWith('.txt') ? bg.fileName : `${bg.fileName}.docx`,
        category: 'SO_BAO_GIANG',
        content,
        teacherName: bg.teacherName,
        week: bg.week,
        folderId
      });
      results.push({
        id: uploaded.id,
        name: uploaded.name,
        url: uploaded.webViewLink,
        category: 'Sổ báo giảng'
      });
    } catch (e) {
      console.warn('Lỗi đồng bộ sổ báo giảng:', e);
      failedCount++;
    }
  }

  // 2. Upload Giáo án / KHBD
  for (const ga of giaoAnList) {
    try {
      const content = `TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN\nKẾ HOẠCH BÀI DẠY (CV 5512/BGDĐT)\n\nMôn học: ${ga.subject} | ${ga.grade ? `Khối/Lớp: ${ga.grade}` : 'Hệ Dự bị'}\nGiáo viên: ${ga.teacherName} (${ga.departmentName})\nTuần: ${ga.week} | Tiết PPCT: ${ga.curriculumPeriods}\nBài dạy: ${ga.lessonTitle}\nChương/Chủ đề: ${ga.unitName}\n\nI. MỤC TIÊU DẠY HỌC:\n- Năng lực cần phát triển: ${ga.competencies?.join(', ') || 'Tự chủ, giải quyết vấn đề'}\n- Phẩm chất: Yêu nước, chăm chỉ, trách nhiệm\n\nII. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CV 5512):\n1. Khởi động / Mở đầu\n2. Hình thành kiến thức mới\n3. Luyện tập\n4. Vận dụng\n\nNgày nộp: ${ga.uploadDate}\nNgười duyệt: ${ga.reviewerName || 'Tổ trưởng chuyên môn'}\nTrạng thái: ${ga.status === 'DA_DUYET' ? 'Đã phê duyệt' : 'Đang xử lý'}`;
      const uploaded = await uploadTeacherRecordToTargetDrive({
        fileName: ga.fileName.endsWith('.docx') || ga.fileName.endsWith('.txt') ? ga.fileName : `${ga.fileName}.docx`,
        category: 'KE_HOACH_BAI_DAY',
        content,
        teacherName: ga.teacherName,
        week: ga.week,
        folderId
      });
      results.push({
        id: uploaded.id,
        name: uploaded.name,
        url: uploaded.webViewLink,
        category: 'Kế hoạch bài dạy (KHBD)'
      });
    } catch (e) {
      console.warn('Lỗi đồng bộ KHBD:', e);
      failedCount++;
    }
  }

  return {
    total: results.length + failedCount,
    successCount: results.length,
    failedCount,
    uploadedFiles: results
  };
};

// ==========================================
// GOOGLE SHEETS API FUNCTIONS
// ==========================================

export interface SheetDataPayload {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Create a new Google Spreadsheet with one or more sheets and populated data.
 */
export const createGoogleSpreadsheet = async (
  title: string,
  sheetsData: SheetDataPayload[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng bấm Đăng nhập với Google trước.');

  // 1. Create spreadsheet structure
  const createResource = {
    properties: {
      title
    },
    sheets: sheetsData.map(s => ({
      properties: {
        title: s.title,
        gridProperties: {
          rowCount: Math.max(s.rows.length + 5, 20),
          columnCount: Math.max(s.headers.length + 2, 10),
          frozenRowCount: 1
        }
      }
    }))
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createResource)
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tạo Google Sheet (${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate values into each sheet
  const dataPayload = sheetsData.map(s => {
    return {
      range: `${s.title}!A1`,
      values: [s.headers, ...s.rows]
    };
  });

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload
      })
    }
  );

  if (!updateRes.ok) {
    console.warn('Lỗi ghi dữ liệu vào Google Sheet, nhưng bảng tính đã được tạo.');
  }

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Read values from an existing Google Spreadsheet range.
 * Supports both Authenticated Google Sheets API v4 AND Public CSV/gviz fallback.
 */
export const readGoogleSheetValues = async (
  spreadsheetId: string,
  range: string = 'A1:Z100'
): Promise<any[][]> => {
  const token = await getAccessToken();

  // If token is available, attempt official Sheets API first
  if (token) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.values || [];
      }
    } catch (e) {
      console.warn('Sheets API v4 call failed, attempting public fallback:', e);
    }
  }

  // Fallback: Read public or shared Google Sheet via CSV export
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const csvText = await res.text();
      return parseCSVRows(csvText);
    }
  } catch (err) {
    console.warn('CSV export read failed, trying gviz endpoint:', err);
  }

  // Fallback 2: Google Visualization API endpoint (works with shared link)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      // Google returns `/*O_o*/ google.visualization.Query.setResponse({...});`
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        const table = parsed.table;
        const rows: any[][] = [];
        if (table && table.cols && table.rows) {
          const headerRow = table.cols.map((c: any) => c.label || c.id || '');
          rows.push(headerRow);
          table.rows.forEach((r: any) => {
            const rowValues = (r.c || []).map((cell: any) => (cell ? cell.v ?? cell.f ?? '' : ''));
            rows.push(rowValues);
          });
          return rows;
        }
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc bảng tính Google:', err);
  }

  if (!token) {
    throw new Error('Chưa đăng nhập Google Workspace hoặc bảng tính không ở chế độ công khai ("Bất kỳ ai có liên kết"). Vui lòng đăng nhập Google hoặc chia sẻ quyền xem.');
  }

  throw new Error('Không thể đọc dữ liệu từ Google Sheet. Vui lòng kiểm tra quyền truy cập hoặc ID bảng tính.');
};

/**
 * Basic CSV string parser for spreadsheet fallback.
 */
function parseCSVRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());
    return row;
  });
}

// ==========================================
// SPECIALIZED EXPORT HELPERS FOR SCHOOL DATA
// ==========================================

/**
 * 1. Export Danh sách Giáo viên & Định mức giảng dạy to Google Sheets.
 */
export const exportTeachersToGoogleSheet = async (
  teachers: UserProfile[],
  departments: Department[],
  assignments: TeachingAssignment[],
  academicYear: string
): Promise<GoogleSyncResult> => {
  // Sort teachers: Tổ trưởng first, then Tổ phó, then by department
  const sorted = [...teachers].sort((a, b) => {
    if (a.role === 'TO_TRUONG' && b.role !== 'TO_TRUONG') return -1;
    if (b.role === 'TO_TRUONG' && a.role !== 'TO_TRUONG') return 1;
    const aIsDep = a.position?.toLowerCase().includes('tổ phó');
    const bIsDep = b.position?.toLowerCase().includes('tổ phó');
    if (aIsDep && !bIsDep) return -1;
    if (bIsDep && !aIsDep) return 1;
    return (a.departmentName || '').localeCompare(b.departmentName || '');
  });

  const headers = [
    'STT',
    'Mã GV',
    'Họ và tên',
    'Tổ chuyên môn',
    'Chức vụ',
    'Bộ môn',
    'Lớp giảng dạy',
    'Lớp chủ nhiệm',
    'Thực dạy (tiết/tuần)',
    'Định mức cần dạy',
    'Giảm trừ (tiết)',
    'Thừa/Thiếu (tiết)',
    'Số điện thoại',
    'Email công vụ'
  ];

  const rows = sorted.map((t, idx) => {
    const tAssigns = assignments.filter(a => a.teacherId === t.id);
    const assignedPeriods = tAssigns.reduce((sum, a) => sum + a.periodsPerWeek, 0);
    const actualTaught = assignedPeriods > 0 ? assignedPeriods : t.actualPeriods;
    const quota = Math.max(0, t.standardPeriods - t.reductionPeriods);
    const diff = actualTaught - quota;
    const taughtClasses = Array.from(new Set(tAssigns.map(a => a.className))).join(', ') || '-';

    return [
      idx + 1,
      t.code,
      t.name,
      t.departmentName,
      t.position,
      t.subject,
      taughtClasses,
      t.homeroomClass || '-',
      actualTaught,
      quota,
      t.reductionPeriods,
      diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0 (Đủ)',
      t.phone || '-',
      t.email || '-'
    ];
  });

  const title = `DS_GiaoVien_DinhMuc_DBSS_${academicYear.replace(/[^0-9-]/g, '')}_${new Date().toISOString().slice(0, 10)}`;

  const res = await createGoogleSpreadsheet(title, [
    {
      title: 'DS_GiaoVien_DinhMuc',
      headers,
      rows
    }
  ]);

  return {
    success: true,
    spreadsheetId: res.spreadsheetId,
    spreadsheetUrl: res.spreadsheetUrl,
    message: `Đã xuất thành công ${teachers.length} cán bộ, giáo viên ra Google Sheets!`
  };
};

/**
 * 2. Export Quản lý Giáo án & Kế hoạch bài dạy (KHBD) to Google Sheets.
 */
export const exportGiaoAnToGoogleSheet = async (
  giaoAnList: GiaoAnItem[],
  academicYear: string
): Promise<GoogleSyncResult> => {
  const headers = [
    'STT',
    'Mã KHBD',
    'Tên giáo viên',
    'Tổ chuyên môn',
    'Bộ môn',
    'Tên chủ đề / Chương',
    'Nội dung giáo án (Tên bài)',
    'Tiết (theo KHBD)',
    'Tuần thực dạy',
    'Trạng thái phê duyệt',
    'Chuẩn cấu trúc',
    'Người thẩm định / duyệt',
    'Tên tệp đính kèm',
    'Ngày nộp'
  ];

  const rows = giaoAnList.map((g, idx) => [
    idx + 1,
    g.id.toUpperCase(),
    g.teacherName,
    g.departmentName,
    g.subject,
    g.unitName || '-',
    g.lessonTitle,
    g.curriculumPeriods || '-',
    `Tuần ${g.week}`,
    g.status === 'DA_DUYET'
      ? 'Đã duyệt'
      : g.status === 'CHO_DUYET'
      ? 'Chờ duyệt'
      : 'Yêu cầu sửa',
    g.has4Steps ? 'Đủ 4 hoạt động CV 5512' : 'Chưa chuẩn',
    g.reviewerName || '-',
    g.fileName || '-',
    g.uploadDate || '-'
  ]);

  const title = `QuanLy_GiaoAn_KHBD_DBSS_${academicYear.replace(/[^0-9-]/g, '')}_${new Date().toISOString().slice(0, 10)}`;

  const res = await createGoogleSpreadsheet(title, [
    {
      title: 'QuanLy_GiaoAn_KHBD',
      headers,
      rows
    }
  ]);

  return {
    success: true,
    spreadsheetId: res.spreadsheetId,
    spreadsheetUrl: res.spreadsheetUrl,
    message: `Đã xuất ${giaoAnList.length} giáo án / KHBD ra Google Sheets!`
  };
};

/**
 * 3. Export Comprehensive Multi-Sheet Workbook to Google Sheets.
 */
export const exportAllSchoolDataToGoogleSheets = async (
  teachers: UserProfile[],
  departments: Department[],
  assignments: TeachingAssignment[],
  giaoAnList: GiaoAnItem[],
  baoGiangList: BaoGiangEntry[],
  academicYear: string
): Promise<GoogleSyncResult> => {
  // 1. Teachers Sheet
  const teacherHeaders = [
    'STT',
    'Mã GV',
    'Họ và tên',
    'Tổ chuyên môn',
    'Chức vụ',
    'Bộ môn',
    'Lớp giảng dạy',
    'Lớp chủ nhiệm',
    'Thực dạy (tiết)',
    'Định mức cần dạy',
    'Thừa/Thiếu'
  ];
  const teacherRows = teachers.map((t, idx) => {
    const tAssigns = assignments.filter(a => a.teacherId === t.id);
    const actualTaught = tAssigns.length > 0
      ? tAssigns.reduce((sum, a) => sum + a.periodsPerWeek, 0)
      : t.actualPeriods;
    const quota = Math.max(0, t.standardPeriods - t.reductionPeriods);
    const diff = actualTaught - quota;
    return [
      idx + 1,
      t.code,
      t.name,
      t.departmentName,
      t.position,
      t.subject,
      Array.from(new Set(tAssigns.map(a => a.className))).join(', ') || '-',
      t.homeroomClass || '-',
      actualTaught,
      quota,
      diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'
    ];
  });

  // 2. Giao An Sheet
  const giaoAnHeaders = [
    'STT',
    'Tên giáo viên',
    'Tổ bộ môn',
    'Tên chủ đề / Chương',
    'Nội dung giáo án (Tên bài)',
    'Tiết (theo KHBD)',
    'Tuần',
    'Trạng thái',
    'Chuẩn 5512'
  ];
  const giaoAnRows = giaoAnList.map((g, idx) => [
    idx + 1,
    g.teacherName,
    g.departmentName,
    g.unitName || '-',
    g.lessonTitle,
    g.curriculumPeriods || '-',
    `Tuần ${g.week}`,
    g.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chờ duyệt',
    g.has4Steps ? 'Đạt' : 'Cần bổ sung'
  ]);

  // 3. Phân công giảng dạy Sheet
  const assignmentHeaders = [
    'STT',
    'Giáo viên',
    'Tổ chuyên môn',
    'Môn học',
    'Lớp phụ trách',
    'Số tiết/tuần',
    'Học kỳ',
    'Năm học'
  ];
  const assignmentRows = assignments.map((a, idx) => [
    idx + 1,
    a.teacherName,
    departments.find(d => d.id === a.departmentId)?.name || a.departmentId,
    a.subject,
    a.className,
    a.periodsPerWeek,
    a.semester === 'CA_NAM' ? 'Cả năm' : a.semester,
    a.academicYear
  ]);

  // 4. Sổ Báo Giảng Sheet
  const baoGiangHeaders = [
    'STT',
    'Tuần',
    'Thứ',
    'Ngày dạy',
    'Tiết',
    'Lớp',
    'Môn',
    'Tên bài dạy (KHBD)',
    'Giáo viên',
    'Trạng thái'
  ];
  const baoGiangRows = baoGiangList.map((b, idx) => [
    idx + 1,
    `Tuần ${b.week}`,
    b.dayOfWeek,
    b.date,
    b.period,
    b.className,
    b.subject,
    b.lessonTitle,
    b.teacherName,
    b.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chờ duyệt'
  ]);

  const title = `DuBiDaiHoc_SamSon_DongBo_Google_${academicYear.replace(/[^0-9-]/g, '')}_${new Date().toISOString().slice(0, 10)}`;

  const res = await createGoogleSpreadsheet(title, [
    { title: 'DS_GiaoVien_DinhMuc', headers: teacherHeaders, rows: teacherRows },
    { title: 'QuanLy_GiaoAn_KHBD', headers: giaoAnHeaders, rows: giaoAnRows },
    { title: 'PhanCong_GiangDay', headers: assignmentHeaders, rows: assignmentRows },
    { title: 'SoBaoGiang_Tuan', headers: baoGiangHeaders, rows: baoGiangRows }
  ]);

  return {
    success: true,
    spreadsheetId: res.spreadsheetId,
    spreadsheetUrl: res.spreadsheetUrl,
    message: `Đã đồng bộ toàn bộ cơ sở dữ liệu chuyên môn sang Google Sheets!`
  };
};

/**
 * 4. Backup entire school database snapshot into Google Drive.
 */
export const backupDatabaseToGoogleDrive = async (
  fullDatabaseState: any,
  academicYear: string
): Promise<GoogleSyncResult> => {
  const jsonContent = JSON.stringify(fullDatabaseState, null, 2);
  const fileName = `SaoLuu_ChuyenMon_DBSS_${academicYear.replace(/[^0-9-]/g, '')}_${Date.now()}.json`;

  const driveFile = await uploadFileToDrive(fileName, 'application/json', jsonContent);

  return {
    success: true,
    fileId: driveFile.id,
    fileUrl: driveFile.webViewLink,
    message: `Đã sao lưu toàn bộ dữ liệu lên Google Drive thành công (${driveFile.name})!`
  };
};

/**
 * 5. List all Google Spreadsheets from user's Google Drive.
 */
export const listDriveSpreadsheets = async (): Promise<DriveFileInfo[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng đăng nhập Google trước.');

  const q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&pageSize=30&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải danh sách Google Sheets từ Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * 6. Update/Overwrite existing Google Spreadsheet with updated data.
 */
export const syncAllDataToExistingSheet = async (
  spreadsheetId: string,
  teachers: UserProfile[],
  departments: Department[],
  assignments: TeachingAssignment[],
  giaoAnList: GiaoAnItem[],
  baoGiangList: BaoGiangEntry[]
): Promise<GoogleSyncResult> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace. Vui lòng đăng nhập Google trước.');

  // 1. Teachers Sheet
  const teacherHeaders = [
    'STT', 'Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Chức vụ', 'Bộ môn',
    'Lớp giảng dạy', 'Lớp chủ nhiệm', 'Thực dạy (tiết)', 'Định mức cần dạy', 'Thừa/Thiếu'
  ];
  const teacherRows = teachers.map((t, idx) => {
    const tAssigns = assignments.filter(a => a.teacherId === t.id);
    const actualTaught = tAssigns.length > 0
      ? tAssigns.reduce((sum, a) => sum + a.periodsPerWeek, 0)
      : t.actualPeriods;
    const quota = Math.max(0, t.standardPeriods - t.reductionPeriods);
    const diff = actualTaught - quota;
    return [
      idx + 1, t.code, t.name, t.departmentName, t.position, t.subject,
      Array.from(new Set(tAssigns.map(a => a.className))).join(', ') || '-',
      t.homeroomClass || '-', actualTaught, quota, diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'
    ];
  });

  // 2. Giao An Sheet
  const giaoAnHeaders = [
    'STT', 'Tên giáo viên', 'Tổ bộ môn', 'Tên chủ đề / Chương', 'Nội dung giáo án (Tên bài)',
    'Tiết (theo KHBD)', 'Tuần', 'Trạng thái', 'Chuẩn 5512'
  ];
  const giaoAnRows = giaoAnList.map((g, idx) => [
    idx + 1, g.teacherName, g.departmentName, g.unitName || '-', g.lessonTitle,
    g.curriculumPeriods || '-', `Tuần ${g.week}`,
    g.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chờ duyệt',
    g.has4Steps ? 'Đạt' : 'Cần bổ sung'
  ]);

  // 3. Sổ Báo Giảng Sheet
  const baoGiangHeaders = [
    'STT', 'Tuần', 'Thứ', 'Ngày dạy', 'Tiết', 'Lớp', 'Môn', 'Tên bài dạy (KHBD)', 'Giáo viên', 'Trạng thái'
  ];
  const baoGiangRows = baoGiangList.map((b, idx) => [
    idx + 1, `Tuần ${b.week}`, b.dayOfWeek, b.date, b.period, b.className, b.subject,
    b.lessonTitle, b.teacherName, b.status === 'DA_DUYET' ? 'Đã duyệt' : 'Chờ duyệt'
  ]);

  const dataPayload = [
    { range: 'DS_GiaoVien_DinhMuc!A1', values: [teacherHeaders, ...teacherRows] },
    { range: 'QuanLy_GiaoAn_KHBD!A1', values: [giaoAnHeaders, ...giaoAnRows] },
    { range: 'SoBaoGiang_Tuan!A1', values: [baoGiangHeaders, ...baoGiangRows] }
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload
      })
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi cập nhật bảng tính (${updateRes.status})`);
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    message: `Đã cập nhật dữ liệu thành công vào Google Sheet liên kết trên Drive!`
  };
};

/**
 * 7. Parse raw spreadsheet rows to Teacher profiles.
 */
export const parseSheetToTeachers = (rows: any[][]): UserProfile[] => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  const nameIdx = headers.findIndex(h => h.includes('họ và tên') || h.includes('tên') || h.includes('name'));
  const codeIdx = headers.findIndex(h => h.includes('mã') || h.includes('code'));
  const deptIdx = headers.findIndex(h => h.includes('tổ') || h.includes('department'));
  const posIdx = headers.findIndex(h => h.includes('chức vụ') || h.includes('position'));
  const subIdx = headers.findIndex(h => h.includes('bộ môn') || h.includes('môn') || h.includes('subject'));
  const quotaIdx = headers.findIndex(h => h.includes('định mức') || h.includes('quota'));
  const actualIdx = headers.findIndex(h => h.includes('thực dạy') || h.includes('tiết'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const phoneIdx = headers.findIndex(h => h.includes('thoại') || h.includes('phone') || h.includes('sđt'));

  return rows.slice(1).filter(r => r.some(c => c && String(c).trim())).map((row, idx) => {
    const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Giáo viên ${idx + 1}`;
    const code = codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : `GV${String(idx + 1).padStart(3, '0')}`;
    const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : 'Tổ Toán - Tin';
    const position = posIdx !== -1 && row[posIdx] ? String(row[posIdx]).trim() : 'Giáo viên bộ môn';
    const subject = subIdx !== -1 && row[subIdx] ? String(row[subIdx]).trim() : 'Toán';
    const quota = quotaIdx !== -1 && !isNaN(Number(row[quotaIdx])) ? Number(row[quotaIdx]) : 17;
    const actual = actualIdx !== -1 && !isNaN(Number(row[actualIdx])) ? Number(row[actualIdx]) : 17;
    const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : `${code.toLowerCase()}@edu.vn`;
    const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '0912345678';

    return {
      id: `gv-sheet-${Date.now()}-${idx}`,
      code,
      name,
      email,
      phone,
      departmentId: dept.includes('Toán') ? 'dep-toan-tin' : dept.includes('Văn') ? 'dep-van-nn' : dept.includes('Nhiên') ? 'dep-tu-nhien' : 'dep-xa-hoi',
      departmentName: dept,
      role: position.toLowerCase().includes('trưởng') ? 'TO_TRUONG' : 'GIAO_VIEN',
      position,
      subject,
      standardPeriods: quota,
      reductionPeriods: 0,
      actualPeriods: actual,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      status: 'DANG_CONG_TAC'
    } as UserProfile;
  });
};

/**
 * 8. Parse raw spreadsheet rows to GiaoAn items.
 */
export const parseSheetToGiaoAn = (rows: any[][]): GiaoAnItem[] => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  const teacherIdx = headers.findIndex(h => h.includes('giáo viên') || h.includes('tên gv'));
  const deptIdx = headers.findIndex(h => h.includes('tổ'));
  const subjectIdx = headers.findIndex(h => h.includes('bộ môn') || h.includes('môn'));
  const titleIdx = headers.findIndex(h => h.includes('bài') || h.includes('tiêu đề') || h.includes('nội dung'));
  const unitIdx = headers.findIndex(h => h.includes('chủ đề') || h.includes('chương'));
  const periodIdx = headers.findIndex(h => h.includes('tiết'));
  const weekIdx = headers.findIndex(h => h.includes('tuần'));

  return rows.slice(1).filter(r => r.some(c => c && String(c).trim())).map((row, idx) => {
    const teacherName = teacherIdx !== -1 && row[teacherIdx] ? String(row[teacherIdx]).trim() : 'Giáo viên bộ môn';
    const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : 'Tổ Chuyên Môn';
    const subject = subjectIdx !== -1 && row[subjectIdx] ? String(row[subjectIdx]).trim() : 'Toán học';
    const lessonTitle = titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]).trim() : `Kế hoạch bài dạy số ${idx + 1}`;
    const unitName = unitIdx !== -1 && row[unitIdx] ? String(row[unitIdx]).trim() : 'Chương I';
    const period = periodIdx !== -1 && row[periodIdx] ? String(row[periodIdx]).trim() : 'Tiết 1';
    const rawWeek = weekIdx !== -1 && row[weekIdx] ? String(row[weekIdx]).replace(/[^0-9]/g, '') : '24';
    const week = parseInt(rawWeek, 10) || 24;

    return {
      id: `ga-sheet-${Date.now()}-${idx}`,
      teacherId: 'gv-sheet',
      teacherName,
      departmentId: 'dep-toan-tin',
      departmentName: dept,
      subject,
      grade: 10,
      lessonTitle,
      unitName,
      curriculumPeriods: period,
      week,
      uploadDate: new Date().toISOString().substring(0, 10),
      status: 'DA_DUYET',
      has4Steps: true,
      rating: 'TOT',
      reviewerName: 'Tổ trưởng Chuyên môn'
    } as GiaoAnItem;
  });
};

/**
 * 9. Parse raw spreadsheet rows to BaoGiang entries.
 */
export const parseSheetToBaoGiang = (rows: any[][]): BaoGiangEntry[] => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  const weekIdx = headers.findIndex(h => h.includes('tuần'));
  const dayIdx = headers.findIndex(h => h.includes('thứ'));
  const dateIdx = headers.findIndex(h => h.includes('ngày'));
  const periodIdx = headers.findIndex(h => h.includes('tiết'));
  const classIdx = headers.findIndex(h => h.includes('lớp'));
  const subjectIdx = headers.findIndex(h => h.includes('môn'));
  const titleIdx = headers.findIndex(h => h.includes('bài') || h.includes('tên bài'));
  const teacherIdx = headers.findIndex(h => h.includes('giáo viên'));

  return rows.slice(1).filter(r => r.some(c => c && String(c).trim())).map((row, idx) => {
    const rawWeek = weekIdx !== -1 && row[weekIdx] ? String(row[weekIdx]).replace(/[^0-9]/g, '') : '24';
    const week = parseInt(rawWeek, 10) || 24;
    const dayOfWeek = dayIdx !== -1 && row[dayIdx] ? String(row[dayIdx]).trim() : 'Thứ 2';
    const date = dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : '2026-03-02';
    const period = periodIdx !== -1 && !isNaN(Number(row[periodIdx])) ? Number(row[periodIdx]) : 1;
    const className = classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : '10A1';
    const subject = subjectIdx !== -1 && row[subjectIdx] ? String(row[subjectIdx]).trim() : 'Toán';
    const lessonTitle = titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]).trim() : `Tiết ${period} - Bài giảng`;
    const teacherName = teacherIdx !== -1 && row[teacherIdx] ? String(row[teacherIdx]).trim() : 'Giáo viên bộ môn';

    return {
      id: `bg-sheet-${Date.now()}-${idx}`,
      teacherId: 'gv-sheet',
      teacherName,
      departmentId: 'dep-toan-tin',
      subject,
      week,
      dayOfWeek,
      date,
      period,
      className,
      lessonTitle,
      status: 'DA_DUYET'
    } as BaoGiangEntry;
  });
};
