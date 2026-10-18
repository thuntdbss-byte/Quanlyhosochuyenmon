import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Department, TeachingAssignment, GiaoAnItem, BaoGiangEntry } from '../types';

// Supported OAuth scopes configured for Google Workspace
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Workspace scopes
const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (never stored in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;
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
 * Initialize auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-In with popup.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
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
    console.error('Lỗi đăng nhập Google Workspace:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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
  await auth.signOut();
  cachedAccessToken = null;
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
export const createDriveFolder = async (folderName: string): Promise<DriveFileInfo> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

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
 * Upload a text / JSON / CSV file to Google Drive.
 */
export const uploadFileToDrive = async (
  fileName: string,
  mimeType: string,
  content: string | Blob,
  folderId?: string
): Promise<DriveFileInfo> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

  const metadata: any = {
    name: fileName,
    mimeType
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyContent = typeof content === 'string' ? content : await content.text();

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    bodyContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size',
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
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

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
 */
export const readGoogleSheetValues = async (
  spreadsheetId: string,
  range: string
): Promise<any[][]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google Workspace');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi đọc dữ liệu Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
};

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
