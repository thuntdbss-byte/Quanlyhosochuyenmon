import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { KeHoachItem, KeHoachType } from '../../types';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Eye,
  X,
  Building,
  User,
  Upload,
  Trash2,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  FolderOpen,
  Layers,
  Award
} from 'lucide-react';

export const KeHoachView: React.FC = () => {
  const {
    keHoachList,
    departments,
    addKeHoach,
    deleteKeHoach,
    currentUser,
    currentRole,
    addToast,
    targetDriveFolderUrl,
    openGoogleSync
  } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewDetail, setViewDetail] = useState<KeHoachItem | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Form state for uploading department dossier
  const [form, setForm] = useState({
    title: '',
    type: 'TO_CHUYEN_MON' as KeHoachType,
    docNumber: '15/KH-TCM',
    departmentId: currentUser.departmentId || 'dep-toan-tin',
    academicYear: '2026-2027',
    semester: 'Học kỳ II',
    summary: '',
    fileName: 'KeHoachChuyenMon_2026_2027.docx',
    fileSize: '1.4 MB'
  });

  const filteredPlans = keHoachList.filter(item => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterDept !== 'ALL' && item.departmentId !== filterDept) return false;
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeFormatted = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${sizeKB} KB`;
      setForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeFormatted
      }));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const dept = departments.find(d => d.id === form.departmentId);

    addKeHoach({
      title: form.title,
      type: form.type,
      docNumber: form.docNumber,
      authorId: currentUser.id,
      authorName: `${currentUser.name} (${currentUser.position})`,
      departmentId: dept?.id,
      departmentName: dept?.name,
      academicYear: form.academicYear,
      semester: form.semester,
      status: 'DA_BAN_HANH',
      signDate: new Date().toISOString().split('T')[0],
      summary: form.summary,
      fileName: form.fileName
    });

    setShowAddModal(false);
    setSelectedFileObj(null);
    setForm({
      title: '',
      type: 'TO_CHUYEN_MON',
      docNumber: '',
      departmentId: currentUser.departmentId || 'dep-toan-tin',
      academicYear: '2026-2027',
      semester: 'Học kỳ II',
      summary: '',
      fileName: 'KeHoachChuyenMon_2026_2027.docx',
      fileSize: '1.4 MB'
    });
  };

  const downloadFile = (plan: KeHoachItem) => {
    const content = `TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN\nHỒ SƠ CHUYÊN MÔN: ${plan.title}\nSố hiệu: ${plan.docNumber || 'Đang cập nhật'}\nĐơn vị: ${plan.departmentName || 'Nhà trường'}\nNgười ký ban hành: ${plan.authorName}\nNăm học: ${plan.academicYear} (${plan.semester})\nNgày ký: ${plan.signDate}\nTệp đính kèm: ${plan.fileName}\n\nNỘI DUNG TÓM TẮT:\n${plan.summary}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = plan.fileName.endsWith('.txt') ? plan.fileName : `${plan.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Đã tải tệp hồ sơ: ${plan.fileName}`, 'success');
  };

  const getTypeBadge = (type: KeHoachType) => {
    switch (type) {
      case 'LICH_TRINH_GIANG_DAY':
        return { label: 'Lịch trình 28 tuần', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'TO_CHUYEN_MON':
        return { label: 'Kế hoạch Tổ (CV 5512)', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'BIEN_BAN_TO':
        return { label: 'Biên bản sinh hoạt tổ', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'HO_SO_TO':
        return { label: 'Hồ sơ chuyên môn tổ', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'TRUONG':
        return { label: 'Kế hoạch Cấp trường', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'CHU_DE_STEM':
        return { label: 'Chuyên đề STEM', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      default:
        return { label: 'Hồ sơ chuyên môn', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const canUpload = currentRole === 'BGH' || currentRole === 'TO_TRUONG';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Kế Hoạch Giáo Dục & Hồ Sơ Tổ Chuyên Môn</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
              Phụ lục 1, 2, 3 - CV 5512
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
              Trường DBĐH Dân tộc Sầm Sơn (28 tuần)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ trưởng tải hồ sơ tổ: Lịch trình giảng dạy 28 tuần, Kế hoạch chuyên môn của tổ, Biên bản sinh hoạt và các hồ sơ tổ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={targetDriveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Mở thư mục lưu trữ hồ sơ trên Google Drive"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            Folder Drive Hồ Sơ
          </a>

          <button
            onClick={() => openGoogleSync('drive')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Đồng bộ Drive
          </button>

          <button
            onClick={() => {
              setForm(prev => ({
                ...prev,
                departmentId: currentUser.departmentId || 'dep-toan-tin',
                type: 'LICH_TRINH_GIANG_DAY',
                title: `Lịch trình giảng dạy 28 tuần - ${currentUser.departmentName || 'Tổ chuyên môn'}`,
                fileName: `LichTrinhGiangDay_28Tuan_${(currentUser.departmentName || 'TCM').replace(/\s+/g, '')}.xlsx`
              }));
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            Tải Hồ Sơ Tổ Chuyên Môn Lên
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'Tất cả hồ sơ', count: keHoachList.length },
          { id: 'LICH_TRINH_GIANG_DAY', label: 'Lịch trình 28 tuần', count: keHoachList.filter(k => k.type === 'LICH_TRINH_GIANG_DAY').length },
          { id: 'TO_CHUYEN_MON', label: 'Kế hoạch Tổ (CV 5512)', count: keHoachList.filter(k => k.type === 'TO_CHUYEN_MON').length },
          { id: 'BIEN_BAN_TO', label: 'Biên bản sinh hoạt tổ', count: keHoachList.filter(k => k.type === 'BIEN_BAN_TO').length },
          { id: 'HO_SO_TO', label: 'Hồ sơ khác của tổ', count: keHoachList.filter(k => k.type === 'HO_SO_TO').length },
          { id: 'TRUONG', label: 'Cấp Nhà trường (BGH)', count: keHoachList.filter(k => k.type === 'TRUONG').length },
          { id: 'CHU_DE_STEM', label: 'Chuyên đề STEM', count: keHoachList.filter(k => k.type === 'CHU_DE_STEM').length }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterType(cat.id)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              filterType === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterType === cat.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Tổ bộ môn:
            </span>

            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả tổ chuyên môn</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.leaderName} - Tổ trưởng)
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <strong>{filteredPlans.length}</strong> văn bản / hồ sơ lưu trữ
          </div>
        </div>

        {/* Dossiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPlans.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">Chưa có hồ sơ nào trong mục này</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tổ trưởng có thể nhấn "Tải Hồ Sơ Tổ Chuyên Môn Lên" để đăng tải lịch trình và kế hoạch của tổ.
              </p>
            </div>
          ) : (
            filteredPlans.map(plan => {
              const badge = getTypeBadge(plan.type);
              const isAuthorOrBgh = plan.authorId === currentUser.id || currentRole === 'BGH' || currentRole === 'TO_TRUONG';

              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {plan.signDate || 'Đã ban hành'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug hover:text-indigo-600 transition-colors">
                      {plan.title}
                    </h4>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Đơn vị: <strong>{plan.departmentName || 'Toàn trường'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Người lập / ký: {plan.authorName}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 bg-white/80 p-2 rounded-lg border border-slate-100">
                      {plan.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate max-w-[170px]" title={plan.fileName}>
                        {plan.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadFile(plan)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 transition-colors"
                        title="Tải văn bản về máy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải về
                      </button>

                      <button
                        onClick={() => setViewDetail(plan)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>

                      {isAuthorOrBgh && (
                        <button
                          onClick={() => deleteKeHoach(plan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Xóa hồ sơ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Add Department Dossier */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Tải Hồ Sơ / Kế Hoạch Tổ Chuyên Môn
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại hồ sơ chuyên môn *</label>
                <select
                  value={form.type}
                  onChange={e => {
                    const newType = e.target.value as KeHoachType;
                    const dept = departments.find(d => d.id === form.departmentId);
                    let sampleTitle = form.title;
                    let sampleFile = form.fileName;
                    if (newType === 'LICH_TRINH_GIANG_DAY') {
                      sampleTitle = `Lịch trình giảng dạy 28 tuần - ${dept?.name || 'Tổ chuyên môn'}`;
                      sampleFile = `LichTrinhGiangDay_28Tuan_${(dept?.name || 'TCM').replace(/\s+/g, '')}.xlsx`;
                    } else if (newType === 'TO_CHUYEN_MON') {
                      sampleTitle = `Kế hoạch giáo dục dạy học môn học của ${dept?.name || 'Tổ chuyên môn'} (Phụ lục 1, 2 - CV 5512)`;
                      sampleFile = `KeHoachChuyenMon_CV5512_${(dept?.name || 'TCM').replace(/\s+/g, '')}.docx`;
                    } else if (newType === 'BIEN_BAN_TO') {
                      sampleTitle = `Biên bản sinh hoạt chuyên môn theo Nghiên cứu bài học - ${dept?.name || 'Tổ'}`;
                      sampleFile = `BienBanSinhHoatTo_${(dept?.name || 'TCM').replace(/\s+/g, '')}.docx`;
                    } else if (newType === 'HO_SO_TO') {
                      sampleTitle = `Hồ sơ kiểm tra chuyên môn & bồi dưỡng giáo viên - ${dept?.name || 'Tổ'}`;
                      sampleFile = `HoSoChuyenMonTo_${(dept?.name || 'TCM').replace(/\s+/g, '')}.docx`;
                    }

                    setForm({
                      ...form,
                      type: newType,
                      title: sampleTitle,
                      fileName: sampleFile
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700"
                >
                  <option value="LICH_TRINH_GIANG_DAY">📅 Lịch trình giảng dạy 28 tuần</option>
                  <option value="TO_CHUYEN_MON">📋 Kế hoạch dạy học môn học của Tổ (Phụ lục 1, 2 - CV 5512)</option>
                  <option value="BIEN_BAN_TO">📝 Biên bản sinh hoạt tổ chuyên môn (Nghiên cứu bài học)</option>
                  <option value="HO_SO_TO">📁 Hồ sơ chuyên môn khác của tổ (Kiểm tra, dự giờ, bồi dưỡng)</option>
                  <option value="CHU_DE_STEM">🧪 Kế hoạch Chuyên đề STEM / Trải nghiệm</option>
                  <option value="TRUONG">🏛️ Kế hoạch Giáo dục Nhà trường (Cấp BGH)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên hồ sơ / kế hoạch *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lịch trình giảng dạy 28 tuần năm học 2026-2027..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ chuyên môn quản lý</label>
                  <select
                    value={form.departmentId}
                    onChange={e => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.leaderName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số hiệu văn bản</label>
                  <input
                    type="text"
                    placeholder="VD: 15/KH-TCM"
                    value={form.docNumber}
                    onChange={e => setForm({ ...form, docNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn file đính kèm (Word .docx, Excel .xlsx, PDF) *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx,.doc,.xlsx,.xls,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-700">Nhấn để chọn file tài liệu từ máy tính của Tổ</p>
                  <p className="text-slate-400 text-[11px]">Hỗ trợ file: .docx, .xlsx, .pdf</p>
                  {selectedFileObj ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã chọn: {selectedFileObj.name} ({form.fileSize})
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      Tệp dự kiến: {form.fileName}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tóm tắt nội dung & giải pháp thực hiện</label>
                <textarea
                  rows={3}
                  placeholder="Khung phân phối thời gian 28 tuần, chỉ tiêu chất lượng, chuyên đề đổi mới PPDH và kiểm tra đánh giá..."
                  value={form.summary}
                  onChange={e => setForm({ ...form, summary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Ban hành & Lưu Hồ Sơ Tổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail */}
      {viewDetail && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Văn Bản Hồ Sơ Chuyên Môn Tổ
              </h3>
              <button onClick={() => setViewDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="font-extrabold text-base text-slate-900">{viewDetail.title}</div>
              <div className="text-slate-500">Số hiệu: {viewDetail.docNumber || 'Đang cập nhật'}</div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div>Đơn vị / Tổ: <strong>{viewDetail.departmentName || 'Trường DBĐH Dân tộc Sầm Sơn'}</strong></div>
                <div>Người ký ban hành: <strong>{viewDetail.authorName}</strong></div>
                <div>Năm học: <strong>{viewDetail.academicYear} ({viewDetail.semester})</strong></div>
                <div>Ngày ban hành: <strong>{viewDetail.signDate}</strong></div>
                <div>Tệp đính kèm: <strong>{viewDetail.fileName}</strong></div>
              </div>
              <div className="pt-2 text-slate-700 leading-relaxed bg-indigo-50/30 p-3 rounded-lg border border-indigo-100">
                <strong className="block text-slate-900 mb-1">Tóm tắt nội dung:</strong>
                {viewDetail.summary}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => downloadFile(viewDetail)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Tải tệp văn bản
              </button>
              <button
                type="button"
                onClick={() => setViewDetail(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
