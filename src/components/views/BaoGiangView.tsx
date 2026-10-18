import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BaoGiangEntry, RecordStatus, WeeklyBaoGiangFile } from '../../types';
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Check,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Upload,
  Download,
  Trash2,
  FileText,
  Clock,
  User,
  CheckCircle,
  FileCheck2,
  ListOrdered
} from 'lucide-react';

export const BaoGiangView: React.FC = () => {
  const {
    baoGiangList,
    weeklyBaoGiangFiles,
    selectedWeek,
    setSelectedWeek,
    teachers,
    departments,
    currentUser,
    currentRole,
    approveBaoGiang,
    rejectBaoGiang,
    addBaoGiangEntry,
    deleteBaoGiangEntry,
    addWeeklyBaoGiangFile,
    approveWeeklyBaoGiangFile,
    deleteWeeklyBaoGiangFile,
    addToast,
    openGoogleSync
  } = useApp();

  // Tab mode: FILES (Nộp & Quản lý file Sổ Báo Giảng hàng tuần) or PERIODS (Kê khai chi tiết từng tiết dạy)
  const [activeTab, setActiveTab] = useState<'FILES' | 'PERIODS'>('FILES');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [onlyMyFiles, setOnlyMyFiles] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; currentNotes?: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Weekly File Upload Form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [weeklyUploadForm, setWeeklyUploadForm] = useState({
    teacherId: currentUser.id,
    week: selectedWeek,
    notes: '',
    fileName: `SoBaoGiang_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
    fileSize: '185 KB'
  });
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Period Entry Form state
  const [entryForm, setEntryForm] = useState({
    teacherId: currentUser.id,
    dayOfWeek: 'Thứ 2',
    date: '2026-03-16',
    period: 1,
    session: 'SANG' as 'SANG' | 'CHIEU',
    className: '12A1',
    subject: currentUser.subject || 'Toán học',
    curriculumPeriod: 63,
    lessonTitle: '',
    equipment: 'Máy chiếu, SGK, phiếu học tập',
    notes: ''
  });

  // Filtered files for weekly tab
  const filteredFiles = weeklyBaoGiangFiles.filter(item => {
    if (item.week !== selectedWeek) return false;
    if (onlyMyFiles && item.teacherId !== currentUser.id) return false;
    if (filterTeacher !== 'ALL' && item.teacherId !== filterTeacher) return false;
    if (filterDept !== 'ALL' && item.departmentId !== filterDept) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  // Filtered entries for detailed periods tab
  const filteredEntries = baoGiangList.filter(item => {
    if (item.week !== selectedWeek) return false;
    if (onlyMyFiles && item.teacherId !== currentUser.id) return false;
    if (filterTeacher !== 'ALL' && item.teacherId !== filterTeacher) return false;
    if (filterDept !== 'ALL' && item.departmentId !== filterDept) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  const handleApproveAllWeek = () => {
    const unapproved = filteredEntries.filter(e => e.status !== 'DA_DUYET');
    unapproved.forEach(e => approveBaoGiang(e.id));
    addToast(`Đã ký duyệt toàn bộ ${unapproved.length} tiết báo giảng trong tuần`, 'success');
  };

  const handleWeeklyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeFormatted = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${sizeKB} KB`;
      setWeeklyUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeFormatted
      }));
    }
  };

  const handleWeeklyFileUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === weeklyUploadForm.teacherId) || currentUser;

    addWeeklyBaoGiangFile({
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      departmentName: teacher.departmentName,
      week: Number(weeklyUploadForm.week),
      fileName: weeklyUploadForm.fileName || `SoBaoGiang_Tuan${weeklyUploadForm.week}_${teacher.name}.docx`,
      fileSize: weeklyUploadForm.fileSize || '245 KB',
      notes: weeklyUploadForm.notes || undefined
    });

    setShowUploadFileModal(false);
    setSelectedFileObj(null);
    setWeeklyUploadForm({
      teacherId: currentUser.id,
      week: selectedWeek,
      notes: '',
      fileName: `SoBaoGiang_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
      fileSize: '185 KB'
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.lessonTitle) return;

    const teacher = teachers.find(t => t.id === entryForm.teacherId) || currentUser;

    addBaoGiangEntry({
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      week: selectedWeek,
      date: entryForm.date,
      dayOfWeek: entryForm.dayOfWeek,
      period: Number(entryForm.period),
      session: entryForm.session,
      className: entryForm.className.toUpperCase(),
      subject: entryForm.subject,
      curriculumPeriod: Number(entryForm.curriculumPeriod),
      lessonTitle: entryForm.lessonTitle,
      equipment: entryForm.equipment,
      notes: entryForm.notes,
      status: 'CHO_DUYET'
    });

    setShowAddModal(false);
    setEntryForm({
      ...entryForm,
      lessonTitle: '',
      curriculumPeriod: entryForm.curriculumPeriod + 1
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModal) return;
    rejectBaoGiang(feedbackModal.id, feedbackText);
    setFeedbackModal(null);
    setFeedbackText('');
  };

  const downloadSampleFile = (fileName: string) => {
    const content = `TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN\nSỔ BÁO GIẢNG VÀ TIẾN ĐỘ GIẢNG DẠY TUẦN ${selectedWeek} (NĂM HỌC 2026 - 2027)\nFile: ${fileName}\nTrạng thái: Đã cập nhật trên hệ thống`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Đang tải file ${fileName}...`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Sổ Báo Giảng Hàng Tuần & Tiến Độ Dạy Học</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
              Tuần {selectedWeek}/28
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
              Trường DBĐH Dân tộc Sầm Sơn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi giáo viên tự tải Sổ báo giảng cá nhân lên hàng tuần (Word/Excel) • Kê khai và ký duyệt tiến độ giảng dạy 28 tuần
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Week switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
              disabled={selectedWeek <= 1}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-800">Tuần {selectedWeek}/28</span>
            <button
              onClick={() => setSelectedWeek(Math.min(28, selectedWeek + 1))}
              disabled={selectedWeek >= 28}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Teacher Upload Weekly File Button */}
          <button
            onClick={() => {
              setWeeklyUploadForm({
                teacherId: currentUser.id,
                week: selectedWeek,
                notes: '',
                fileName: `SoBaoGiang_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
                fileSize: '190 KB'
              });
              setShowUploadFileModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            Tải Sổ Báo Giảng lên
          </button>

          <button
            onClick={() => openGoogleSync('sheets')}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Đồng bộ sổ báo giảng sang Google Sheets & Google Drive"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Google Sheets & Drive
          </button>

          {activeTab === 'PERIODS' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Kê khai tiết dạy
            </button>
          )}

          {currentRole !== 'GIAO_VIEN' && activeTab === 'PERIODS' && (
            <button
              onClick={handleApproveAllWeek}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Ký duyệt cả tuần
            </button>
          )}
        </div>
      </div>

      {/* Tab switchers: File Sổ báo giảng vs Kê khai tiết dạy */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('FILES')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'FILES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          File Sổ Báo Giảng Hàng Tuần ({filteredFiles.length} file Tuần {selectedWeek})
        </button>

        <button
          onClick={() => setActiveTab('PERIODS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'PERIODS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          Bảng Kê Khai Chi Tiết Từng Tiết ({filteredEntries.length} tiết)
        </button>
      </div>

      {/* Filter and summary bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </span>

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả tổ chuyên môn</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={filterTeacher}
            onChange={e => setFilterTeacher(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả giáo viên</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subject})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DA_DUYET">Đã ký duyệt</option>
            <option value="CHO_DUYET">Đang chờ duyệt</option>
            <option value="YEU_CAU_CHINH_SUA">Yêu cầu chỉnh sửa</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyMyFiles(!onlyMyFiles)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
              onlyMyFiles
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Của tôi ({currentUser.name})
          </button>
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-3">
          <span>
            {activeTab === 'FILES' ? (
              <>Đã nộp: <strong>{filteredFiles.length} file</strong></>
            ) : (
              <>Tổng số: <strong>{filteredEntries.length} tiết dạy</strong></>
            )}
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {activeTab === 'FILES'
              ? `${filteredFiles.filter(f => f.status === 'DA_DUYET').length} đã duyệt`
              : `${filteredEntries.filter(e => e.status === 'DA_DUYET').length} đã duyệt`}
          </span>
        </div>
      </div>

      {/* TAB 1: FILE SỔ BÁO GIẢNG HÀNG TUẦN */}
      {activeTab === 'FILES' && (
        <div className="space-y-4">
          {/* Quick upload banner for current teacher */}
          <div className="bg-linear-to-r from-indigo-50 via-white to-blue-50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Nộp Sổ Báo Giảng Cá Nhân - Tuần {selectedWeek} (Năm học 2026 - 2027)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Định dạng khuyến nghị: file Microsoft Word (.docx), Excel (.xlsx) hoặc PDF theo mẫu quy định của nhà trường.
                  Hạn nộp vào 17h00 thứ Bảy hàng tuần.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setWeeklyUploadForm({
                  teacherId: currentUser.id,
                  week: selectedWeek,
                  notes: '',
                  fileName: `SoBaoGiang_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
                  fileSize: '190 KB'
                });
                setShowUploadFileModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              Tải file Sổ báo giảng lên ngay
            </button>
          </div>

          {/* List of uploaded files */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                Danh sách File Sổ Báo Giảng đã nộp - Tuần {selectedWeek} ({filteredFiles.length} file)
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Quy mô: 28 tuần • Đã duyệt bởi Tổ trưởng & BGH
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Giáo viên nộp</th>
                    <th className="p-3">Tổ chuyên môn</th>
                    <th className="p-3">Tên file & Dung lượng</th>
                    <th className="p-3">Thời gian nộp</th>
                    <th className="p-3">Trạng thái duyệt</th>
                    <th className="p-3">Người ký duyệt</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">Chưa có file Sổ báo giảng nào được nộp cho Tuần {selectedWeek}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Hãy nhấn nút "Tải Sổ Báo Giảng lên" để nộp hồ sơ giảng dạy tuần của bạn.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map(file => {
                      const isOwner = file.teacherId === currentUser.id;
                      const canApprove = currentRole === 'BGH' || currentRole === 'TO_TRUONG';
                      const isApproved = file.status === 'DA_DUYET';

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{file.teacherName}</div>
                            {file.notes && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5">Ghi chú: {file.notes}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                              {file.departmentName}
                            </span>
                          </td>
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[240px]" title={file.fileName}>
                                {file.fileName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">{file.fileSize}</span>
                          </td>
                          <td className="p-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {file.uploadDate}
                            </div>
                          </td>
                          <td className="p-3">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px] border border-emerald-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Đã ký duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-bold text-[11px] border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                Chờ duyệt
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {file.approvedBy ? (
                              <div>
                                <div className="font-bold text-[11px] text-slate-800">{file.approvedBy}</div>
                                <div className="text-[10px] text-slate-400">{file.approvalDate}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa ký</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Download button */}
                              <button
                                onClick={() => downloadSampleFile(file.fileName)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                                title="Tải file về máy tính"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Tải về
                              </button>

                              {/* Approve button for Department Head / BGH */}
                              {canApprove && !isApproved && (
                                <button
                                  onClick={() => approveWeeklyBaoGiangFile(file.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                                  title="Ký duyệt Sổ báo giảng tuần này"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Ký duyệt
                                </button>
                              )}

                              {/* Delete button (owner or BGH) */}
                              {(isOwner || currentRole === 'BGH') && (
                                <button
                                  onClick={() => deleteWeeklyBaoGiangFile(file.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Xóa file này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG KÊ KHAI CHI TIẾT TỪNG TIẾT DẠY */}
      {activeTab === 'PERIODS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Buổi / Tiết</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Giáo viên</th>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Tiết PPCT</th>
                  <th className="p-3">Tên bài dạy / Hoạt động chuyên môn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(entry => {
                  const isApproved = entry.status === 'DA_DUYET';
                  const isRejected = entry.status === 'YEU_CAU_CHINH_SUA';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{entry.dayOfWeek}</div>
                        <div className="text-[10px] text-slate-400">{entry.date}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            entry.session === 'SANG'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {entry.session === 'SANG' ? 'Sáng' : 'Chiều'} • Tiết {entry.period}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {entry.className}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{entry.teacherName}</td>
                      <td className="p-3 text-slate-600">{entry.subject}</td>
                      <td className="p-3 font-bold text-center text-slate-800">{entry.curriculumPeriod}</td>
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={entry.lessonTitle}>
                          {entry.lessonTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={entry.equipment}>
                          TB: {entry.equipment}
                        </div>
                        {entry.feedback && (
                          <div className="mt-1 p-1.5 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-800">
                            <strong>Góp ý:</strong> {entry.feedback}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã duyệt
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[10px] border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Cần sửa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {currentRole !== 'GIAO_VIEN' && (
                            <>
                              {!isApproved && (
                                <button
                                  onClick={() => approveBaoGiang(entry.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors"
                                  title="Ký duyệt tiết dạy này"
                                >
                                  Duyệt
                                </button>
                              )}
                              <button
                                onClick={() => setFeedbackModal({ id: entry.id, currentNotes: entry.feedback })}
                                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                                title="Góp ý hoặc yêu cầu chỉnh sửa"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(entry.teacherId === currentUser.id || currentRole === 'BGH') && (
                            <button
                              onClick={() => deleteBaoGiangEntry(entry.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Xóa tiết kê khai này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs">Chưa có dữ liệu sổ báo giảng cho tuần {selectedWeek}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tải Sổ Báo Giảng hàng tuần lên (Word/Excel/PDF) */}
      {showUploadFileModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Nộp Sổ Báo Giảng Cá Nhân Hàng Tuần
              </h3>
              <button onClick={() => setShowUploadFileModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWeeklyFileUploadSubmit} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giáo viên nộp</label>
                  <select
                    disabled={currentRole === 'GIAO_VIEN'}
                    value={weeklyUploadForm.teacherId}
                    onChange={e => setWeeklyUploadForm({ ...weeklyUploadForm, teacherId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần thực dạy (1 - 28)</label>
                  <select
                    value={weeklyUploadForm.week}
                    onChange={e => setWeeklyUploadForm({ ...weeklyUploadForm, week: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>
                        Tuần {w} / 28
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn file Sổ báo giảng (Word / Excel / PDF) *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-xl p-5 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx,.doc,.xlsx,.xls,.pdf"
                    onChange={handleWeeklyFileSelect}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-700">Nhấn để chọn file từ máy tính của bạn</p>
                  <p className="text-slate-400 text-[11px]">Định dạng: .docx, .xlsx, .pdf (Dung lượng &lt; 25MB)</p>
                  {selectedFileObj ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã chọn: {selectedFileObj.name} ({weeklyUploadForm.fileSize})
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      File mặc định: {weeklyUploadForm.fileName}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú gửi Tổ trưởng / Ban Giám Hiệu</label>
                <input
                  type="text"
                  placeholder="VD: Đã cập nhật lịch dạy bù tiết 3 thứ Năm..."
                  value={weeklyUploadForm.notes}
                  onChange={e => setWeeklyUploadForm({ ...weeklyUploadForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Quy định nộp Sổ Báo Giảng tại Trường DBĐH Dân tộc Sầm Sơn:
                </div>
                <p>• Tuần học: Tổng cộng 28 tuần giảng dạy chính thức.</p>
                <p>• Hồ sơ sau khi nộp sẽ được Tổ trưởng chuyên môn thẩm định và ký số điện tử.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadFileModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs"
                >
                  Nộp Sổ Báo Giảng Tuần {weeklyUploadForm.week}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm tiết báo giảng chi tiết */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Đăng ký tiết dạy Sổ Báo Giảng (Tuần {selectedWeek})
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ trong tuần</label>
                  <select
                    value={entryForm.dayOfWeek}
                    onChange={e => setEntryForm({ ...entryForm, dayOfWeek: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Thứ 2">Thứ 2</option>
                    <option value="Thứ 3">Thứ 3</option>
                    <option value="Thứ 4">Thứ 4</option>
                    <option value="Thứ 5">Thứ 5</option>
                    <option value="Thứ 6">Thứ 6</option>
                    <option value="Thứ 7">Thứ 7</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày dạy</label>
                  <input
                    type="date"
                    value={entryForm.date}
                    onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buổi</label>
                  <select
                    value={entryForm.session}
                    onChange={e => setEntryForm({ ...entryForm, session: e.target.value as 'SANG' | 'CHIEU' })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="SANG">Sáng</option>
                    <option value="CHIEU">Chiều</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết thứ</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={entryForm.period}
                    onChange={e => setEntryForm({ ...entryForm, period: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp giảng dạy</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 12A1"
                    value={entryForm.className}
                    onChange={e => setEntryForm({ ...entryForm, className: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    required
                    value={entryForm.subject}
                    onChange={e => setEntryForm({ ...entryForm, subject: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết PPCT</label>
                  <input
                    type="number"
                    required
                    value={entryForm.curriculumPeriod}
                    onChange={e => setEntryForm({ ...entryForm, curriculumPeriod: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học / Chuyên đề *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Ôn tập Nguyên hàm và Tích phân..."
                  value={entryForm.lessonTitle}
                  onChange={e => setEntryForm({ ...entryForm, lessonTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đồ dùng, thiết bị, phần mềm dạy học</label>
                <input
                  type="text"
                  placeholder="VD: Máy chiếu, phiếu bài tập, phòng máy tính..."
                  value={entryForm.equipment}
                  onChange={e => setEntryForm({ ...entryForm, equipment: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs"
                >
                  Lưu vào Báo giảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gửi phản hồi / Yêu cầu sửa */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                Góp ý & Yêu cầu chỉnh sửa tiết dạy
              </h3>
              <button onClick={() => setFeedbackModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung phản hồi sư phạm *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Kiểm tra lại tiết PPCT bị trùng, bổ sung thiết bị thực hành..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white rounded font-bold hover:bg-amber-700"
                >
                  Gửi phản hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
