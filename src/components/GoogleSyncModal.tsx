import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  exportTeachersToGoogleSheet,
  exportGiaoAnToGoogleSheet,
  exportAllSchoolDataToGoogleSheets,
  backupDatabaseToGoogleDrive,
  listDriveFiles,
  createDriveFolder,
  readGoogleSheetValues,
  DriveFileInfo,
  GoogleSyncResult
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
  Users
} from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sheets' | 'drive';
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
    academicYear,
    addToast
  } = useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GoogleSyncResult | null>(null);

  // Drive files state
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Hồ sơ Chuyên môn DBSS');

  // Import from Sheets state
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [importingSheet, setImportingSheet] = useState(false);

  // Confirmation modal state for destructive operations
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch drive files when authenticated and drive tab active
  useEffect(() => {
    if (currentUser && activeTab === 'drive' && isOpen) {
      loadDriveFiles();
    }
  }, [currentUser, activeTab, isOpen]);

  const loadDriveFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Lỗi tải tệp Drive:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setActionMessage('Đang mở cửa sổ đăng nhập Google...');
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        addToast(`Đăng nhập Google thành công: ${res.user.email}`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Không thể đăng nhập Google Workspace', 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      setCurrentUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setLastResult(null);
      addToast('Đã đăng xuất tài khoản Google', 'info');
    } catch (err: any) {
      addToast('Lỗi khi đăng xuất', 'error');
    }
  };

  // 1. Export Teachers to Google Sheets
  const handleExportTeachers = async () => {
    if (!currentUser) return;
    setLoading(true);
    setActionMessage('Đang tạo Google Spreadsheet danh sách giáo viên...');
    try {
      const res = await exportTeachersToGoogleSheet(teachers, departments, assignments, academicYear);
      setLastResult(res);
      addToast(res.message, 'success');
    } catch (err: any) {
      addToast(err.message || 'Lỗi xuất danh sách giáo viên ra Google Sheets', 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 2. Export Giao An to Google Sheets
  const handleExportGiaoAn = async () => {
    if (!currentUser) return;
    setLoading(true);
    setActionMessage('Đang tạo Google Spreadsheet quản lý giáo án & KHBD...');
    try {
      const res = await exportGiaoAnToGoogleSheet(giaoAnList, academicYear);
      setLastResult(res);
      addToast(res.message, 'success');
    } catch (err: any) {
      addToast(err.message || 'Lỗi xuất giáo án ra Google Sheets', 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 3. Export Comprehensive Workbook
  const handleExportAll = async () => {
    if (!currentUser) return;
    setLoading(true);
    setActionMessage('Đang tổng hợp 4 Sheet vào bảng tính Google...');
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
      addToast(res.message, 'success');
    } catch (err: any) {
      addToast(err.message || 'Lỗi xuất bảng tính Google Sheets', 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 4. Backup Database to Google Drive
  const handleBackupToDrive = async () => {
    if (!currentUser) return;
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
      addToast(err.message || 'Lỗi sao lưu lên Google Drive', 'error');
    } finally {
      setLoading(false);
      setActionMessage(null);
    }
  };

  // 5. Create Drive Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !currentUser) return;
    setLoading(true);
    try {
      const folder = await createDriveFolder(newFolderName.trim());
      addToast(`Đã tạo thư mục Google Drive: "${folder.name}"`, 'success');
      loadDriveFiles();
    } catch (err: any) {
      addToast(err.message || 'Lỗi tạo thư mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract sheet ID from URL or raw ID
  const extractSpreadsheetId = (input: string): string => {
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  // Read Google Sheet preview
  const handleReadSheet = async () => {
    const sheetId = extractSpreadsheetId(sheetInputUrl);
    if (!sheetId) {
      addToast('Vui lòng dán liên kết Google Sheet hoặc ID bảng tính', 'warning');
      return;
    }

    setImportingSheet(true);
    try {
      const values = await readGoogleSheetValues(sheetId, 'A1:Z50');
      if (!values || values.length === 0) {
        addToast('Bảng tính trống hoặc không đọc được dữ liệu', 'warning');
      } else {
        addToast(`Đã đọc thành công ${values.length} dòng từ Google Sheet!`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi đọc Google Sheet. Hãy kiểm tra quyền truy cập!', 'error');
    } finally {
      setImportingSheet(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
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
                Đồng bộ hồ sơ cán bộ, giáo án KHBD và sổ sách trường DBĐH Dân tộc Sầm Sơn
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
                  {currentUser.displayName?.slice(0, 1) || 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {currentUser.displayName || 'Tài khoản Google'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đã kết nối
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Chưa liên kết tài khoản Google</div>
                <div className="text-[11px] text-slate-500">
                  Đăng nhập để cho phép ứng dụng đọc và ghi bảng tính Google Sheets & tệp Google Drive
                </div>
              </div>
            </div>
          )}

          <div>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Ngắt kết nối
              </button>
            ) : (
              /* Official Google Sign-In Button as required by Google Workspace integration guidelines */
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
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
                {loading ? 'Đang xác thực...' : 'Đăng nhập với Google'}
              </button>
            )}
          </div>
        </div>

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
            Lưu trữ Google Drive
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
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Xuất trực tiếp dữ liệu đang quản lý tại trường Dự bị ĐH Dân tộc Sầm Sơn thành các bảng tính Google Sheets tiêu chuẩn:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export Teachers */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all space-y-2.5">
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
                    disabled={!currentUser || loading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Tạo Google Sheet ({teachers.length} GV)
                  </button>
                </div>

                {/* Export Giao An */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all space-y-2.5">
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
                    disabled={!currentUser || loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Tạo Google Sheet ({giaoAnList.length} KHBD)
                  </button>
                </div>
              </div>

              {/* Comprehensive All-in-one export */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Xuất Bảng tính Tổng hợp 4 Sheet
                  </div>
                  <div className="text-[11px] text-teal-700">
                    Bao gồm 4 Tab: DS Giáo viên, Giáo án KHBD, Phân công giảng dạy, Sổ báo giảng tuần
                  </div>
                </div>
                <button
                  onClick={handleExportAll}
                  disabled={!currentUser || loading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Xuất toàn bộ Workbook
                </button>
              </div>

              {/* Read / Import from existing Google Sheet */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  Đọc / Nhập dữ liệu từ liên kết Google Sheet có sẵn
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetInputUrl}
                    onChange={e => setSheetInputUrl(e.target.value)}
                    placeholder="Dán link Google Sheet hoặc ID bảng tính tại đây..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleReadSheet}
                    disabled={!currentUser || importingSheet || !sheetInputUrl.trim()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    {importingSheet ? 'Đang đọc...' : 'Kiểm tra Sheet'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Ví dụ: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    Sao lưu Snapshot Toàn Trường lên Google Drive
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    Tạo tệp JSON backup lưu trữ vĩnh viễn trên Drive cá nhân với thời gian và dấu mốc
                  </div>
                </div>
                <button
                  onClick={handleBackupToDrive}
                  disabled={!currentUser || loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Sao lưu lên Drive
                </button>
              </div>

              {/* Create Drive Folder form */}
              <form onSubmit={handleCreateFolder} className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Tên thư mục mới..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!currentUser || loading}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
                  Tạo Thư mục Drive
                </button>
              </form>

              {/* Drive files list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Tệp & Thư mục trên Google Drive ({driveFiles.length})
                  </span>
                  <button
                    onClick={loadDriveFiles}
                    disabled={!currentUser || loadingFiles}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                    Làm mới
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-56 overflow-y-auto">
                  {driveFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {currentUser
                        ? 'Chưa có tệp nào được tạo bởi ứng dụng. Hãy bấm "Tạo Google Sheet" hoặc "Sao lưu lên Drive" ở trên!'
                        : 'Vui lòng đăng nhập Google để xem danh sách tệp.'}
                    </div>
                  ) : (
                    driveFiles.map(file => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {file.mimeType.includes('spreadsheet') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : file.mimeType.includes('folder') ? (
                            <FolderPlus className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : ''}
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
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                            Mở
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Phạm vi: Google Sheets & Google Drive (CV 5512/BGDĐT)</span>
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
