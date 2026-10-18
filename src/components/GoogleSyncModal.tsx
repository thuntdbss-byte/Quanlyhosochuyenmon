import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  googleSignInWithGIS,
  setManualAccessToken,
  googleLogout,
  translateGoogleAuthError,
  exportTeachersToGoogleSheet,
  exportGiaoAnToGoogleSheet,
  exportAllSchoolDataToGoogleSheets,
  backupDatabaseToGoogleDrive,
  listDriveFiles,
  listDriveSpreadsheets,
  createDriveFolder,
  readGoogleSheetValues,
  syncAllDataToExistingSheet,
  parseSheetToTeachers,
  parseSheetToGiaoAn,
  parseSheetToBaoGiang,
  DriveFileInfo,
  GoogleSyncResult,
  getEffectiveFirebaseConfig,
  listFilesInTargetFolder,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_URL
} from '../services/googleWorkspace';
import { useApp } from '../context/AppContext';
import {
  X,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FolderPlus,
  Upload,
  Download,
  ShieldCheck,
  FileText,
  Users,
  KeyRound,
  GitBranch,
  Copy,
  Check,
  Table,
  Sparkles,
  Link2,
  Unlink,
  ArrowDownToLine,
  ArrowUpFromLine,
  HelpCircle,
  FileCode,
  Folder
} from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sheets' | 'drive' | 'github' | 'guide';
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'sheets'
}) => {
  const {
    teachers,
    departments,
    assignments,
    giaoAnList,
    baoGiangList,
    weeklyBaoGiangFiles,
    academicYear,
    addToast,
    connectedSheet,
    setConnectedSheet,
    importTeachers,
    importGiaoAnList,
    importBaoGiangList,
    targetDriveFolderId,
    targetDriveFolderUrl,
    setTargetDriveFolder,
    resetTargetDriveFolder,
    syncAllRecordsToGoogleDrive
  } = useApp();

  const [currentUser, setCurrentUser] = useState<{ displayName?: string | null; email?: string | null; photoURL?: string | null } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive' | 'github' | 'guide'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GoogleSyncResult | null>(null);

  // Diagnostic error state
  const [authError, setAuthError] = useState<{ title: string; detail: string; solution: string } | null>(null);
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [manualToken, setManualToken] = useState('');

  // Drive files & sheets state
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [driveSheets, setDriveSheets] = useState<DriveFileInfo[]>([]);
  const [loadingDriveSheets, setLoadingDriveSheets] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Hồ sơ Chuyên môn DBSS');

  // Import / Connect from Sheets state
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [importingSheet, setImportingSheet] = useState(false);
  const [previewSheetData, setPreviewSheetData] = useState<any[][] | null>(null);
  const [previewSheetId, setPreviewSheetId] = useState<string | null>(null);

  // Copied helper state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fbConfig = getEffectiveFirebaseConfig();

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const [folderFiles, setFolderFiles] = useState<DriveFileInfo[]>([]);
  const [loadingFolderFiles, setLoadingFolderFiles] = useState(false);
  const [customFolderInput, setCustomFolderInput] = useState(targetDriveFolderId);

  useEffect(() => {
    setCustomFolderInput(targetDriveFolderId);
  }, [targetDriveFolderId]);

  // Fetch Drive spreadsheets & files when user is authenticated
  useEffect(() => {
    if (currentUser && isOpen) {
      loadDriveSpreadsheets();
      if (activeTab === 'drive') {
        loadDriveFiles();
        loadFolderFiles();
      }
    }
  }, [currentUser, activeTab, isOpen, targetDriveFolderId]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    addToast(`Đã sao chép vào bộ nhớ tạm: ${keyName}`, 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadDriveSpreadsheets = async () => {
    if (!currentUser) return;
    setLoadingDriveSheets(true);
    try {
      const sheets = await listDriveSpreadsheets();
      setDriveSheets(sheets);
    } catch (err: any) {
      console.warn('Lỗi tải danh sách Google Sheets:', err);
    } finally {
      setLoadingDriveSheets(false);
    }
  };

  const loadFolderFiles = async () => {
    if (!currentUser) return;
    setLoadingFolderFiles(true);
    try {
      const files = await listFilesInTargetFolder(targetDriveFolderId);
      setFolderFiles(files);
    } catch (err: any) {
      console.warn('Lỗi tải tệp trong thư mục chỉ định:', err);
    } finally {
      setLoadingFolderFiles(false);
    }
  };

  const loadDriveFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
      await loadFolderFiles();
    } catch (err: any) {
      console.error('Lỗi tải tệp Drive:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSyncAllTeacherRecordsToDrive = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage('Đang lưu toàn bộ Sổ báo giảng và Kế hoạch bài dạy vào Google Drive...');
    try {
      await syncAllRecordsToGoogleDrive();
      await loadFolderFiles();
      await loadDriveFiles();
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 1. Google Sign In with GIS (Direct & Seamless for ThuntDBSS@gmail.com)
  const handleGISSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    setActionMessage('Đang kết nối tài khoản Google qua Google Identity Services...');
    try {
      const res = await googleSignInWithGIS('ThuntDBSS@gmail.com');
      setCurrentUser(res.user);
      setAccessToken(res.accessToken);
      addToast(`Đăng nhập Google thành công: ${res.user.email || 'ThuntDBSS@gmail.com'}`, 'success');
      loadDriveSpreadsheets();
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 2. Primary Firebase Sign-In
  const handleFirebaseSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    setActionMessage('Đang mở cửa sổ xác thực Google...');
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        addToast(`Đăng nhập Google thành công: ${res.user.email || 'Google User'}`, 'success');
        loadDriveSpreadsheets();
      }
    } catch (err: any) {
      // Auto try GIS if popup or domain issues occur
      try {
        setActionMessage('Đang kết nối qua Google Identity Services...');
        const gisRes = await googleSignInWithGIS('ThuntDBSS@gmail.com');
        setCurrentUser(gisRes.user);
        setAccessToken(gisRes.accessToken);
        addToast(`Đăng nhập Google (GIS) thành công: ${gisRes.user.email}`, 'success');
        setAuthError(null);
        loadDriveSpreadsheets();
      } catch (gisErr: any) {
        const diag = translateGoogleAuthError(err);
        setAuthError(diag);
        addToast(diag.title, 'error');
      }
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 3. Manual Token Submission
  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    try {
      const res = await setManualAccessToken(manualToken.trim());
      setCurrentUser(res.user);
      setAccessToken(res.accessToken);
      setShowManualTokenInput(false);
      setAuthError(null);
      addToast('Đã áp dụng Access Token Google thành công!', 'success');
      loadDriveSpreadsheets();
    } catch (err: any) {
      addToast(err.message || 'Token không hợp lệ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      setCurrentUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setDriveSheets([]);
      setLastResult(null);
      setAuthError(null);
      addToast('Đã đăng xuất tài khoản Google', 'info');
    } catch (err: any) {
      addToast('Lỗi khi đăng xuất', 'error');
    }
  };

  // Helper to extract sheet ID from URL or raw ID
  const extractSpreadsheetId = (input: string): string => {
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  // CREATE NEW SHEET IN USER'S DRIVE & CONNECT
  const handleCreateAndConnectSheet = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage('Đang khởi tạo Google Sheet đồng bộ trong Google Drive của bạn...');
    try {
      const res = await exportAllSchoolDataToGoogleSheets(
        teachers,
        departments,
        assignments,
        giaoAnList,
        baoGiangList,
        academicYear
      );
      setLastResult(res);
      if (res.spreadsheetId && res.spreadsheetUrl) {
        setConnectedSheet({
          id: res.spreadsheetId,
          name: `Hồ sơ Chuyên môn DBSS (${academicYear})`,
          url: res.spreadsheetUrl,
          lastSynced: new Date().toLocaleString('vi-VN')
        });
      }
      loadDriveSpreadsheets();
      addToast(res.message, 'success');
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // SYNC CURRENT DATA TO CONNECTED SHEET
  const handleSyncToConnectedSheet = async () => {
    if (!connectedSheet) {
      addToast('Chưa có Google Sheet nào được kết nối', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage(`Đang cập nhật toàn bộ dữ liệu vào Google Sheet "${connectedSheet.name}" trên Drive...`);
    try {
      const res = await syncAllDataToExistingSheet(
        connectedSheet.id,
        teachers,
        departments,
        assignments,
        giaoAnList,
        baoGiangList
      );
      setLastResult(res);
      setConnectedSheet({
        ...connectedSheet,
        lastSynced: new Date().toLocaleString('vi-VN')
      });
      addToast(res.message, 'success');
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // CONNECT AN EXISTING DRIVE SHEET
  const handleConnectExistingSheet = (file: DriveFileInfo) => {
    setConnectedSheet({
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      lastSynced: new Date().toLocaleString('vi-VN')
    });
    addToast(`Đã kết nối thành công với Google Sheet: "${file.name}"`, 'success');
  };

  // Read Google Sheet preview (supports both authenticated and public links)
  const handleReadSheet = async (customId?: string) => {
    const targetId = customId || extractSpreadsheetId(sheetInputUrl);
    if (!targetId) {
      addToast('Vui lòng dán liên kết Google Sheet hoặc ID bảng tính', 'warning');
      return;
    }

    setImportingSheet(true);
    try {
      const values = await readGoogleSheetValues(targetId, 'A1:Z50');
      if (!values || values.length === 0) {
        addToast('Bảng tính trống hoặc không đọc được dữ liệu', 'warning');
        setPreviewSheetData(null);
      } else {
        setPreviewSheetData(values);
        setPreviewSheetId(targetId);
        addToast(`Đã đọc thành công ${values.length} dòng từ Google Sheet!`, 'success');
      }
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.detail || 'Không thể đọc Google Sheet', 'error');
    } finally {
      setImportingSheet(false);
    }
  };

  // Import from preview data to AppContext
  const handleImportTeachersFromPreview = () => {
    if (!previewSheetData) return;
    const imported = parseSheetToTeachers(previewSheetData);
    if (imported.length === 0) {
      addToast('Không tìm thấy dòng dữ liệu cán bộ/giáo viên hợp lệ', 'warning');
      return;
    }
    importTeachers(imported);
  };

  const handleImportGiaoAnFromPreview = () => {
    if (!previewSheetData) return;
    const imported = parseSheetToGiaoAn(previewSheetData);
    if (imported.length === 0) {
      addToast('Không tìm thấy dữ liệu giáo án/KHBD hợp lệ', 'warning');
      return;
    }
    importGiaoAnList(imported);
  };

  const handleImportBaoGiangFromPreview = () => {
    if (!previewSheetData) return;
    const imported = parseSheetToBaoGiang(previewSheetData);
    if (imported.length === 0) {
      addToast('Không tìm thấy dữ liệu sổ báo giảng hợp lệ', 'warning');
      return;
    }
    importBaoGiangList(imported);
  };

  // Set previewed sheet as connected sheet
  const handleSetPreviewAsConnected = () => {
    if (!previewSheetId) return;
    setConnectedSheet({
      id: previewSheetId,
      name: `Google Sheet (${previewSheetId.slice(0, 8)}...)`,
      url: `https://docs.google.com/spreadsheets/d/${previewSheetId}/edit`,
      lastSynced: new Date().toLocaleString('vi-VN')
    });
    addToast('Đã lưu làm Bảng tính Google Sheet liên kết chính', 'success');
  };

  // Individual exports
  const handleExportTeachers = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước khi xuất dữ liệu', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage('Đang tạo Google Spreadsheet danh sách giáo viên & định mức...');
    try {
      const res = await exportTeachersToGoogleSheet(teachers, departments, assignments, academicYear);
      setLastResult(res);
      loadDriveSpreadsheets();
      addToast(res.message, 'success');
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  const handleExportGiaoAn = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước khi xuất dữ liệu', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage('Đang tạo Google Spreadsheet quản lý giáo án & KHBD...');
    try {
      const res = await exportGiaoAnToGoogleSheet(giaoAnList, academicYear);
      setLastResult(res);
      loadDriveSpreadsheets();
      addToast(res.message, 'success');
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  const handleBackupToDrive = async () => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước khi sao lưu', 'warning');
      return;
    }
    setLoading(true);
    setActionMessage('Đang sao lưu bản ghi hệ thống lên Google Drive...');
    try {
      const fullSnapshot = {
        exportedAt: new Date().toISOString(),
        school: 'Trường Dự bị Đại học Dân tộc Sầm Sơn',
        academicYear,
        teachers,
        departments,
        assignments,
        giaoAnList,
        baoGiangList
      };
      const res = await backupDatabaseToGoogleDrive(fullSnapshot, academicYear);
      setLastResult(res);
      loadDriveFiles();
      addToast(res.message, 'success');
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (!currentUser) {
      addToast('Vui lòng đăng nhập Google trước khi tạo thư mục', 'warning');
      return;
    }
    setLoading(true);
    try {
      const folder = await createDriveFolder(newFolderName.trim());
      addToast(`Đã tạo thư mục Google Drive: "${folder.name}"`, 'success');
      loadDriveFiles();
    } catch (err: any) {
      const diag = translateGoogleAuthError(err);
      setAuthError(diag);
      addToast(diag.title, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Kết nối Dữ liệu Google Sheets & Google Drive
              </h3>
              <p className="text-xs text-white/80">
                Đồng bộ hồ sơ cán bộ, giáo án KHBD CV 5512 và sổ báo giảng trường DBĐH Dân tộc Sầm Sơn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth status bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {currentUser.displayName?.slice(0, 1) || 'T'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {currentUser.displayName || 'Tài khoản Google Giáo dục'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã liên kết Drive & Sheets
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono font-medium">
                  {currentUser.email || 'ThuntDBSS@gmail.com'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Chưa kết nối tài khoản Google Drive (ThuntDBSS@gmail.com)
                </div>
                <div className="text-[11px] text-slate-500">
                  Nhấn đăng nhập để cấp quyền đọc/ghi bảng tính Google Sheets và lưu trữ trên Google Drive
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Ngắt kết nối
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* GIS Sign-In (Direct, fast & reliable) */}
                <button
                  onClick={handleGISSignIn}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow"
                >
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  {loading ? 'Đang kết nối...' : 'Đăng nhập Google'}
                </button>

                {/* Firebase Auth Popup option */}
                <button
                  onClick={handleFirebaseSignIn}
                  disabled={loading}
                  title="Đăng nhập qua cửa sổ Popup Firebase"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Popup Auth
                </button>

                {/* Manual Token button */}
                <button
                  onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Nhập Access Token thủ công"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Token Input Dropdown */}
        {showManualTokenInput && !currentUser && (
          <form onSubmit={handleManualTokenSubmit} className="p-4 bg-amber-50/70 border-b border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Nhập OAuth Access Token trực tiếp
              </span>
              <button
                type="button"
                onClick={() => setShowManualTokenInput(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Dán OAuth Access Token (ya29....) tại đây..."
                className="flex-1 px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                Xác thực
              </button>
            </div>
          </form>
        )}

        {/* Diagnostic error box */}
        {authError && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError.title}</span>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="text-rose-400 hover:text-rose-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-rose-700">{authError.detail}</p>
            <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200 text-slate-800 text-[11px] space-y-1">
              <span className="font-bold text-rose-900 block">Hướng dẫn khắc phục:</span>
              <pre className="whitespace-pre-wrap font-sans text-slate-700">{authError.solution}</pre>
            </div>
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handleGISSignIn}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold"
              >
                Đăng nhập lại qua Google GIS
              </button>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-white">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Đồng bộ Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 text-indigo-600" />
            Quản lý Google Drive
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4 text-violet-600" />
            Đẩy lên GitHub & Cấu hình Cloud
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            Tra cứu Link & Thông số
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Action indicator */}
          {loading && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-800 text-xs font-medium animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{actionMessage || 'Đang xử lý đồng bộ với Google...'}</span>
            </div>
          )}

          {/* Connected Sheet Card */}
          {connectedSheet && (
            <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-xl shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-emerald-950">
                        {connectedSheet.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                        Bảng tính đang liên kết
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Đồng bộ gần nhất: <span className="font-semibold text-slate-700">{connectedSheet.lastSynced || 'Vừa xong'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={connectedSheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở Sheet
                  </a>
                  <button
                    onClick={() => setConnectedSheet(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hủy liên kết bảng tính này"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sync Action Buttons */}
              <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-2">
                <button
                  onClick={handleSyncToConnectedSheet}
                  disabled={loading}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  Cập nhật dữ liệu từ App lên Sheet này
                </button>
                <button
                  onClick={() => handleReadSheet(connectedSheet.id)}
                  disabled={importingSheet}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-600" />
                  Đọc & Tải dữ liệu từ Sheet vào App
                </button>
              </div>
            </div>
          )}

          {/* Last result banner */}
          {lastResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {lastResult.message}
              </div>
              {(lastResult.spreadsheetUrl || lastResult.fileUrl) && (
                <div className="pt-2">
                  <a
                    href={lastResult.spreadsheetUrl || lastResult.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở trên Google {lastResult.spreadsheetUrl ? 'Sheets' : 'Drive'}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              {/* Quick Action: Create & Connect All Data */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-teal-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Tạo mới & Kết nối Google Sheet trên Drive của tôi
                  </div>
                  <p className="text-[11px] text-teal-800">
                    Tạo ngay bảng tính 4 sheet tiêu chuẩn (GV, KHBD 5512, Phân công, Sổ báo giảng) lưu trong Drive tài khoản Google của bạn.
                  </p>
                </div>
                <button
                  onClick={handleCreateAndConnectSheet}
                  disabled={loading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Tạo & Kết nối Sheet
                </button>
              </div>

              {/* Browse existing sheets in Google Drive */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    Bảng tính Google Sheets trong Drive của bạn ({driveSheets.length})
                  </span>
                  <button
                    onClick={loadDriveSpreadsheets}
                    disabled={!currentUser || loadingDriveSheets}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDriveSheets ? 'animate-spin' : ''}`} />
                    Làm mới Drive
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-48 overflow-y-auto">
                  {driveSheets.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400">
                      {currentUser
                        ? 'Chưa tìm thấy bảng tính Google Sheets trong Drive của bạn. Nhấn "Tạo & Kết nối Sheet" ở trên!'
                        : 'Vui lòng đăng nhập Google để hiển thị bảng tính từ Google Drive.'}
                    </div>
                  ) : (
                    driveSheets.map(sheet => {
                      const isThisConnected = connectedSheet?.id === sheet.id;
                      return (
                        <div
                          key={sheet.id}
                          className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                            isThisConnected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {sheet.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Sửa đổi: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString('vi-VN') : 'Không rõ'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isThisConnected ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                Đang chọn
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConnectExistingSheet(sheet)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold transition-colors"
                              >
                                Kết nối Sheet này
                              </button>
                            )}
                            {sheet.webViewLink && (
                              <a
                                href={sheet.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="Mở trên Google Sheets"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Read / Import from existing Google Sheet link */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                  Đọc / Nhập dữ liệu từ liên kết Google Sheet trong Drive
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetInputUrl}
                    onChange={e => setSheetInputUrl(e.target.value)}
                    placeholder="Dán link Google Sheet từ Drive của bạn (ví dụ: https://docs.google.com/spreadsheets/d/...)"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleReadSheet()}
                    disabled={importingSheet || !sheetInputUrl.trim()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    {importingSheet ? 'Đang đọc...' : 'Đọc dữ liệu'}
                  </button>
                </div>

                {/* Preview Sheet Data Table & Import Buttons */}
                {previewSheetData && previewSheetData.length > 0 && (
                  <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden space-y-2 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-emerald-600" />
                        Đã đọc {previewSheetData.length} dòng từ Google Sheet:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSetPreviewAsConnected}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold hover:bg-emerald-700"
                        >
                          Đặt làm Sheet kết nối
                        </button>
                        <button
                          onClick={() => setPreviewSheetData(null)}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          Đóng xem trước
                        </button>
                      </div>
                    </div>

                    {/* Quick Import Actions into App */}
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-900">
                        Chọn loại dữ liệu để nạp vào hệ thống:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={handleImportTeachersFromPreview}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[11px] font-bold shadow-2xs"
                        >
                          Nạp vào Cán bộ - GV
                        </button>
                        <button
                          onClick={handleImportGiaoAnFromPreview}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-md text-[11px] font-bold shadow-2xs"
                        >
                          Nạp vào Kế hoạch bài dạy (KHBD)
                        </button>
                        <button
                          onClick={handleImportBaoGiangFromPreview}
                          className="px-2.5 py-1 bg-white hover:bg-violet-50 text-violet-800 border border-violet-300 rounded-md text-[11px] font-bold shadow-2xs"
                        >
                          Nạp vào Sổ báo giảng
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-auto border border-slate-200 rounded-lg bg-white text-[11px]">
                      <table className="w-full text-left divide-y divide-slate-200">
                        <thead className="bg-slate-100 font-bold sticky top-0">
                          <tr>
                            {previewSheetData[0]?.map((col: any, idx: number) => (
                              <th key={idx} className="p-1.5 border-r border-slate-200 whitespace-nowrap">
                                {col || `Cột ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                          {previewSheetData.slice(1, 8).map((row: any[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {row.map((val: any, cIdx: number) => (
                                <td key={cIdx} className="p-1.5 border-r border-slate-100 truncate max-w-[150px]">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Export Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 transition-all space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Danh sách Cán bộ - GV</div>
                      <div className="text-[10px] text-slate-500">Đầy đủ Tổ trưởng, Tổ phó & Định mức</div>
                    </div>
                  </div>
                  <button
                    onClick={handleExportTeachers}
                    disabled={loading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Tạo Sheet Giáo viên ({teachers.length} GV)
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-all space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Quản lý Giáo án & KHBD</div>
                      <div className="text-[10px] text-slate-500">Tiết dạy, tên bài, chuẩn CV 5512</div>
                    </div>
                  </div>
                  <button
                    onClick={handleExportGiaoAn}
                    disabled={loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Tạo Sheet Giáo án ({giaoAnList.length} KHBD)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE TARGET FOLDER & TEACHER RECORDS */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {/* PRIMARY TARGET FOLDER CARD */}
              <div className="p-4 rounded-xl border-2 border-indigo-500 bg-linear-to-br from-indigo-50 via-white to-amber-50/40 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-600 text-white tracking-wider">
                      <Folder className="w-3 h-3" /> Thư mục chỉ định của bạn
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      Thư mục Lưu Toàn Bộ Hồ Sơ Giáo Viên
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Tất cả hồ sơ gồm <strong>Sổ báo giảng tuần</strong>, <strong>Kế hoạch bài dạy (KHBD / Giáo án CV 5512)</strong>, kế hoạch bộ môn sẽ được lưu trực tiếp vào folder này.
                    </p>
                  </div>

                  <a
                    href={targetDriveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                    Mở Folder trên Drive
                  </a>
                </div>

                {/* Folder details banner */}
                <div className="p-2.5 bg-white/80 rounded-lg border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Folder ID đích:</span>
                    <span className="font-mono font-bold text-indigo-900 text-[11px] truncate block select-all">
                      {targetDriveFolderId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                      ✓ Đã kết nối sẵn sàng
                    </span>
                    <button
                      onClick={() => copyToClipboard(targetDriveFolderUrl, 'Folder-URL')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                      title="Sao chép liên kết thư mục"
                    >
                      {copiedKey === 'Folder-URL' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Subfolder structure preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      01
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">01_So_Bao_Giang</div>
                      <div className="text-[10px] text-slate-400">{weeklyBaoGiangFiles.length} file tuần</div>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      02
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">02_Ke_Hoach_Bai_Day</div>
                      <div className="text-[10px] text-slate-400">{giaoAnList.length} bài dạy KHBD</div>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      03
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">03_Ke_Hoach_Chuyen_Mon</div>
                      <div className="text-[10px] text-slate-400">Kế hoạch & Báo cáo</div>
                    </div>
                  </div>
                </div>

                {/* BIG ONE-CLICK SAVE ACTION BUTTON */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={handleSyncAllTeacherRecordsToDrive}
                    disabled={loading || !currentUser}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <Upload className="w-4 h-4" />
                    LƯU TOÀN BỘ HỒ SƠ GIÁO VIÊN VÀO FOLDER NÀY NGAY ({giaoAnList.length + weeklyBaoGiangFiles.length} tệp)
                  </button>

                  <button
                    onClick={loadFolderFiles}
                    disabled={!currentUser || loadingFolderFiles}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFolderFiles ? 'animate-spin text-indigo-600' : ''}`} />
                    Kiểm tra Folder
                  </button>
                </div>

                {/* Custom Folder ID Configuration dropdown/toggle */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <input
                    type="text"
                    value={customFolderInput}
                    onChange={e => setCustomFolderInput(e.target.value)}
                    placeholder="Dán link hoặc ID Folder Drive khác nếu muốn đổi..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                  />
                  <button
                    onClick={() => setTargetDriveFolder(customFolderInput)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    Đổi Folder
                  </button>
                  {targetDriveFolderId !== DEFAULT_DRIVE_FOLDER_ID && (
                    <button
                      onClick={() => {
                        resetTargetDriveFolder();
                        setCustomFolderInput(DEFAULT_DRIVE_FOLDER_ID);
                      }}
                      className="px-2.5 py-1.5 text-[11px] text-rose-600 hover:underline shrink-0"
                    >
                      Đặt lại mặc định
                    </button>
                  )}
                </div>
              </div>

              {/* FILES IN TARGET FOLDER LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-amber-500" />
                    Tệp & Thư mục con trong Folder 1dZzgmUm... ({folderFiles.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Cập nhật tự động khi giáo viên tải lên
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-52 overflow-y-auto">
                  {folderFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                      <p>Chưa có tệp nào được lưu trực tiếp vào thư mục này.</p>
                      <p className="text-[11px] text-slate-500">
                        Nhấn nút <strong>"LƯU TOÀN BỘ HỒ SƠ GIÁO VIÊN VÀO FOLDER NÀY NGAY"</strong> ở trên để đẩy toàn bộ Sổ báo giảng và Kế hoạch bài dạy lên!
                      </p>
                    </div>
                  ) : (
                    folderFiles.map(file => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {file.mimeType.includes('folder') ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : file.mimeType.includes('spreadsheet') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('vi-VN') : ''}
                            </div>
                          </div>
                        </div>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            Mở
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECONDARY BACKUP & FOLDER CREATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs text-slate-900">Sao lưu Snapshot JSON</div>
                    <div className="text-[10px] text-slate-500">Lưu bản sao dự phòng toàn trường</div>
                  </div>
                  <button
                    onClick={handleBackupToDrive}
                    disabled={loading || !currentUser}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    Sao lưu
                  </button>
                </div>

                <form onSubmit={handleCreateFolder} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Tên thư mục con mới..."
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !currentUser}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    Tạo
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB PUSH & GOOGLE CLOUD CONFIGURATION */}
          {activeTab === 'github' && (
            <div className="space-y-4 text-xs text-slate-700">
              {/* Instructions banner */}
              <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/60 space-y-2">
                <div className="font-bold text-sm text-violet-950 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-violet-600" />
                  Hướng dẫn Đẩy mã nguồn lên GitHub (Push to GitHub)
                </div>
                <p className="text-[11px] text-violet-800 leading-relaxed">
                  Để đưa toàn bộ dự án lên GitHub cá nhân/tổ chức, bạn chỉ cần thực hiện 4 bước lệnh Git chuẩn sau trên máy tính của mình:
                </p>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] space-y-1 relative group">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git init\ngit add .\ngit commit -m "feat: he thong quan ly ho so chuyen mon DBSS voi ket noi Google Sheets & Drive"\ngit branch -M main\ngit remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git\ngit push -u origin main`,
                        'git-commands'
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                  >
                    {copiedKey === 'git-commands' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Sao chép lệnh
                  </button>
                  <p className="text-slate-400"># 1. Khởi tạo và commit mã nguồn:</p>
                  <p className="text-emerald-400">git init</p>
                  <p className="text-emerald-400">git add .</p>
                  <p className="text-emerald-400">git commit -m "feat: he thong ho so chuyen mon DBSS"</p>
                  <p className="text-slate-400 pt-1"># 2. Đổi nhánh chính sang main:</p>
                  <p className="text-emerald-400">git branch -M main</p>
                  <p className="text-slate-400 pt-1"># 3. Gắn URL kho lưu trữ GitHub của bạn:</p>
                  <p className="text-amber-300">git remote add origin https://github.com/&lt;ten-tai-khoan&gt;/&lt;ten-repo&gt;.git</p>
                  <p className="text-slate-400 pt-1"># 4. Đẩy mã nguồn lên GitHub:</p>
                  <p className="text-emerald-400">git push -u origin main</p>
                </div>
              </div>

              {/* Google Cloud Console configuration guide */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Cấu hình Google Cloud Console để chạy trên GitHub Pages, Vercel hoặc Localhost:
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      1
                    </span>
                    <div>
                      <strong>Bật API:</strong> Truy cập Google Cloud Console &gt; <em>APIs & Services</em> &gt; <em>Library</em> &gt; Bật <strong>Google Sheets API</strong> và <strong>Google Drive API</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      2
                    </span>
                    <div>
                      <strong>Cấu hình OAuth Client ID:</strong> Tại <em>Credentials</em> &gt; <em>OAuth 2.0 Client IDs</em> &gt; Thêm các nguồn gốc JavaScript được phép (Authorized JavaScript origins):
                      <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">http://localhost:3000</code>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">http://localhost:5173</code>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">{window.location.origin}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      3
                    </span>
                    <div>
                      <strong>Authorized Domains (Firebase):</strong> Tại Firebase Console &gt; <em>Authentication</em> &gt; <em>Settings</em> &gt; <em>Authorized domains</em> &gt; Thêm tên miền triển khai hoặc localhost.
                    </div>
                  </div>
                </div>

                {/* Current Project Credentials */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800">Thông tin cấu hình dự án hiện tại:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500">Project ID:</span>
                      <span className="font-bold text-slate-800 truncate ml-2">{fbConfig.projectId}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500">OAuth Client ID:</span>
                      <span className="font-bold text-slate-800 truncate ml-2">{fbConfig.oAuthClientId.slice(0, 15)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPREHENSIVE PARAMETERS & LINKS GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5 text-xs text-slate-700">
              {/* Quick .env copy banner */}
              <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-sm text-blue-950">
                        Toàn bộ tệp cấu hình biến môi trường (.env)
                      </h4>
                      <p className="text-[11px] text-blue-700">
                        Sao chép toàn bộ khối này dán vào tệp <code className="font-mono bg-blue-100 px-1 rounded">.env</code> hoặc biến môi trường trên GitHub Secrets / Vercel:
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
`VITE_GOOGLE_CLIENT_ID="559070527306-6vqhml1312cdc5n9e49jp30ardkmjagh.apps.googleusercontent.com"
VITE_FIREBASE_API_KEY="AIzaSyDFKp8hjHFfA6aIdk1EZMs7GfcCJG1Hows"
VITE_FIREBASE_AUTH_DOMAIN="gen-lang-client-0063576688.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="gen-lang-client-0063576688"
VITE_FIREBASE_STORAGE_BUCKET="gen-lang-client-0063576688.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="559070527306"
VITE_FIREBASE_APP_ID="1:559070527306:web:80f80cd6a4c90c79ec4bb3"
VITE_GOOGLE_DRIVE_FOLDER_ID="1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq"`,
                        'full-env'
                      )
                    }
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    {copiedKey === 'full-env' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'full-env' ? 'Đã sao chép!' : 'Sao chép toàn bộ .env'}
                  </button>
                </div>
              </div>

              {/* Table of all environment variables with 1-click copy */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Bảng tra cứu từng thông số (Biến môi trường)</span>
                  <span className="text-[11px] font-normal text-slate-500">Bấm nút sao chép bên phải từng dòng</span>
                </div>
                <div className="divide-y divide-slate-100 font-mono text-[11px]">
                  {[
                    {
                      key: 'VITE_GOOGLE_DRIVE_FOLDER_ID',
                      val: '1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq',
                      desc: 'Mã định danh Folder lưu toàn bộ hồ sơ giáo viên (Sổ báo giảng, KHBD)',
                      tag: 'Google Drive Đích'
                    },
                    {
                      key: 'GOOGLE_DRIVE_FOLDER_URL',
                      val: 'https://drive.google.com/drive/folders/1dZzgmUmO3QPN5Uk0H94uWl6p-vXpYfqq?usp=drive_link',
                      desc: 'Đường dẫn liên kết trực tiếp mở thư mục trên Google Drive',
                      tag: 'Google Drive Link'
                    },
                    {
                      key: 'VITE_GOOGLE_CLIENT_ID',
                      val: '559070527306-6vqhml1312cdc5n9e49jp30ardkmjagh.apps.googleusercontent.com',
                      desc: 'OAuth 2.0 Client ID (Google Cloud Console)',
                      tag: 'Google Workspace'
                    },
                    {
                      key: 'VITE_FIREBASE_API_KEY',
                      val: 'AIzaSyDFKp8hjHFfA6aIdk1EZMs7GfcCJG1Hows',
                      desc: 'Khóa Web API của dự án Firebase',
                      tag: 'Firebase'
                    },
                    {
                      key: 'VITE_FIREBASE_AUTH_DOMAIN',
                      val: 'gen-lang-client-0063576688.firebaseapp.com',
                      desc: 'Tên miền xác thực người dùng',
                      tag: 'Firebase'
                    },
                    {
                      key: 'VITE_FIREBASE_PROJECT_ID',
                      val: 'gen-lang-client-0063576688',
                      desc: 'Mã định danh dự án Google Cloud / Firebase',
                      tag: 'Google Cloud'
                    },
                    {
                      key: 'VITE_FIREBASE_STORAGE_BUCKET',
                      val: 'gen-lang-client-0063576688.firebasestorage.app',
                      desc: 'Kho lưu trữ Cloud Storage',
                      tag: 'Firebase'
                    },
                    {
                      key: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
                      val: '559070527306',
                      desc: 'Mã số dự án Cloud (Project Number)',
                      tag: 'Google Cloud'
                    },
                    {
                      key: 'VITE_FIREBASE_APP_ID',
                      val: '1:559070527306:web:80f80cd6a4c90c79ec4bb3',
                      desc: 'Mã ứng dụng Web Firebase',
                      tag: 'Firebase'
                    }
                  ].map(item => (
                    <div key={item.key} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.key}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-sans font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.tag}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans truncate">{item.desc}</div>
                        <div className="text-[11px] text-indigo-700 truncate select-all">{item.val}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.val, item.key)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-sans font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        {copiedKey === item.key ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                        {copiedKey === item.key ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-step guides */}
              <div className="space-y-3 font-sans">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Hướng dẫn chi tiết cách lấy từng liên kết & thông số từ Google
                </h4>

                {/* Step 1: Google OAuth Client ID */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">1</span>
                      Cách lấy Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID)
                    </div>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Mở Google Cloud Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                    <li>Đăng nhập <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> bằng tài khoản của bạn.</li>
                    <li>Ở thanh trên cùng, chọn dự án hiện tại (hoặc chọn <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">gen-lang-client-0063576688</code>).</li>
                    <li>Vào mục <strong>APIs & Services</strong> &gt; <strong>Credentials</strong>.</li>
                    <li>Tại mục <strong>OAuth 2.0 Client IDs</strong>, nhấp vào tên Client ID hoặc nút sao chép để lấy chuỗi có đuôi <code className="font-mono bg-slate-100 px-1 rounded">...apps.googleusercontent.com</code>.</li>
                    <li><strong>Lưu ý quan trọng:</strong> Bấm chỉnh sửa Client ID đó và thêm <code className="font-mono bg-slate-100 px-1 rounded">http://localhost:3000</code> vào mục <em>Authorized JavaScript origins</em> để không bị lỗi đăng nhập khi chạy localhost.</li>
                  </ol>
                </div>

                {/* Step 2: Firebase Credentials */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">2</span>
                      Cách lấy 6 thông số Firebase (API Key, Project ID, App ID...)
                    </div>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Mở Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                    <li>Vào <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">Firebase Console</a> &gt; Chọn dự án của bạn.</li>
                    <li>Bấm vào biểu tượng <strong>Bánh răng cưa</strong> ở góc trên bên trái &gt; Chọn <strong>Project settings</strong> (Cài đặt dự án).</li>
                    <li>Trong tab <strong>General</strong> (Chung), cuộn xuống phần <strong>Your apps</strong> (Ứng dụng của bạn).</li>
                    <li>Chọn ứng dụng web (biểu tượng <code className="font-mono bg-slate-100 px-1 rounded">&lt;/&gt;</code>) và chọn mục <strong>Config</strong>.</li>
                    <li>Bạn sẽ thấy đầy đủ: <code className="font-mono">apiKey</code>, <code className="font-mono">authDomain</code>, <code className="font-mono">projectId</code>, <code className="font-mono">storageBucket</code>, <code className="font-mono">messagingSenderId</code>, <code className="font-mono">appId</code>.</li>
                  </ol>
                </div>

                {/* Step 3: Google Sheets Link */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">3</span>
                      Cách lấy Liên kết Google Sheet trên Drive để dán vào ứng dụng
                    </div>
                    <a
                      href="https://docs.google.com/spreadsheets"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Mở Google Sheets <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                    <li>Mở tệp Google Sheet trên Google Drive của bạn (ví dụ: file kế hoạch bài dạy hoặc danh sách giáo viên).</li>
                    <li>Bấm nút <strong>Chia sẻ (Share)</strong> màu xanh ở góc trên bên phải màn hình.</li>
                    <li>Chọn quyền truy cập: Chọn <em>"Bất kỳ ai có đường liên kết"</em> (Người xem hoặc Người chỉnh sửa), hoặc chia sẻ cho tài khoản <code className="font-mono bg-slate-100 px-1 rounded">ThuntDBSS@gmail.com</code>.</li>
                    <li>Nhấn nút <strong>Sao chép đường liên kết (Copy link)</strong>.</li>
                    <li>Liên kết có định dạng: <code className="font-mono bg-slate-100 text-[10px] px-1 rounded select-all">https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit</code></li>
                    <li>Quay lại ứng dụng, chuyển sang tab <strong>Đồng bộ Google Sheets</strong>, dán link vào ô <em>"Liên kết Google Sheet"</em> rồi bấm <strong>Đọc dữ liệu</strong>!</li>
                  </ol>
                </div>

                {/* Step 4: GitHub Repository Link */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center font-bold text-[10px]">4</span>
                      Cách lấy Liên kết kho lưu trữ GitHub (Repository Clone URL)
                    </div>
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-violet-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Tạo Repository mới <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                    <li>Đăng nhập vào <a href="https://github.com" target="_blank" rel="noreferrer" className="text-violet-600 underline">GitHub.com</a> &gt; Bấm dấu <strong>+</strong> ở góc trên bên phải &gt; Chọn <strong>New repository</strong>.</li>
                    <li>Đặt tên kho (ví dụ: <code className="font-mono bg-slate-100 px-1 rounded">hscm-dbss-samsun</code>), chọn <em>Public</em> hoặc <em>Private</em> &gt; Bấm <strong>Create repository</strong>.</li>
                    <li>Tại trang repository vừa tạo, bấm nút <strong>Code</strong> màu xanh &gt; chọn tab <strong>HTTPS</strong> &gt; Bấm biểu tượng <strong>Copy</strong> để lấy link có đuôi <code className="font-mono bg-slate-100 px-1 rounded">.git</code>.</li>
                    <li>Định dạng link: <code className="font-mono bg-slate-100 text-[10px] px-1 rounded select-all">https://github.com/&lt;ten-tai-khoan&gt;/&lt;ten-repo&gt;.git</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Phạm vi Google Drive & Sheets (ThuntDBSS@gmail.com - CV 5512/BGDĐT)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
