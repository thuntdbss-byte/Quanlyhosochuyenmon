import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { GiaoAnItem } from '../../types';
import {
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Award,
  Filter,
  Eye,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Download,
  Clock,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Table,
  LayoutGrid,
  FileSpreadsheet,
  HardDrive
} from 'lucide-react';

export const GiaoAnView: React.FC = () => {
  const {
    giaoAnList,
    selectedWeek,
    setSelectedWeek,
    teachers,
    departments,
    currentUser,
    currentRole,
    approveGiaoAn,
    requestGiaoAnRevision,
    addGiaoAn,
    addToast,
    openGoogleSync
  } = useApp();

  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterWeek, setFilterWeek] = useState<number | 'ALL'>('ALL');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [onlyMyGiaoAn, setOnlyMyGiaoAn] = useState<boolean>(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<GiaoAnItem | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<GiaoAnItem | null>(null);

  // Review form
  const [reviewRating, setReviewRating] = useState<'XUAT_SAC' | 'TOT' | 'KHA' | 'DAT'>('TOT');
  const [reviewNotes, setReviewNotes] = useState('');

  // Upload form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    teacherId: currentUser.id,
    subject: currentUser.subject || 'Toán học',
    grade: '',
    week: selectedWeek,
    curriculumPeriods: 'Tiết 64 - 65',
    unitName: 'Chương IV: Nguyên hàm và Tích phân',
    lessonTitle: '',
    fileName: `KHBD_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
    fileSize: '1.8 MB',
    has4Steps: true,
    competencies: 'Năng lực tự chủ và tự học, Năng lực giải quyết vấn đề toán học, Tư duy logic'
  });

  const filteredGiaoAn = giaoAnList.filter(item => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterDept !== 'ALL' && item.departmentId !== filterDept) return false;
    if (filterWeek !== 'ALL' && item.week !== filterWeek) return false;
    if (onlyMyGiaoAn && item.teacherId !== currentUser.id) return false;
    if (filterTeacher !== 'ALL' && item.teacherId !== filterTeacher) return false;
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeFormatted = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${sizeKB} KB`;
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeFormatted
      }));
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.lessonTitle) return;

    const teacher = teachers.find(t => t.id === uploadForm.teacherId) || currentUser;

    addGiaoAn({
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      departmentName: teacher.departmentName,
      subject: uploadForm.subject,
      grade: uploadForm.grade.trim(),
      week: Number(uploadForm.week),
      curriculumPeriods: uploadForm.curriculumPeriods,
      unitName: uploadForm.unitName,
      lessonTitle: uploadForm.lessonTitle,
      formatType: 'CV_5512',
      fileName: uploadForm.fileName,
      fileSize: uploadForm.fileSize,
      has4Steps: uploadForm.has4Steps,
      competencies: uploadForm.competencies.split(',').map(s => s.trim()).filter(Boolean)
    });

    setShowUploadModal(false);
    setSelectedFileObj(null);
    setUploadForm({
      teacherId: currentUser.id,
      subject: currentUser.subject || 'Toán học',
      grade: '',
      week: selectedWeek,
      curriculumPeriods: 'Tiết 66 - 67',
      unitName: '',
      lessonTitle: '',
      fileName: `KHBD_Tuan${selectedWeek}_${currentUser.name.replace(/\s+/g, '')}.docx`,
      fileSize: '1.8 MB',
      has4Steps: true,
      competencies: 'Năng lực tự chủ và tự học, Năng lực giải quyết vấn đề toán học'
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;
    approveGiaoAn(reviewModal.id, reviewRating, reviewNotes);
    setReviewModal(null);
    setReviewNotes('');
  };

  const handleRejectReview = () => {
    if (!reviewModal) return;
    if (!reviewNotes) {
      addToast('Vui lòng nhập lý do sư phạm cần chỉnh sửa', 'warning');
      return;
    }
    requestGiaoAnRevision(reviewModal.id, reviewNotes);
    setReviewModal(null);
    setReviewNotes('');
  };

  const downloadGiaoAnFile = (item: GiaoAnItem) => {
    const content = `TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN\nKẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ - CV 5512)\nMôn: ${item.subject}${item.grade ? ` - Lớp/Khóa: ${item.grade}` : ''}\nTuần thực dạy: Tuần ${item.week}/28\nTiết PPCT: ${item.curriculumPeriods}\nBài học: ${item.lessonTitle}\nChương / Chủ đề: ${item.unitName}\nGiáo viên soạn: ${item.teacherName} (${item.departmentName})\nNgày nộp: ${item.uploadDate}\nTrạng thái: ${item.status === 'DA_DUYET' ? 'Đã ký duyệt' : 'Đang chờ duyệt'}\n\nI. MỤC TIÊU DẠY HỌC\n1. Về kiến thức\n2. Về năng lực: ${item.competencies.join(', ')}\n3. Về phẩm chất: Trách nhiệm, chăm chỉ, trung thực\n\nII. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU\n\nIII. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG THEO CV 5512)\n1. Hoạt động 1: Mở đầu / Khởi động\n2. Hoạt động 2: Hình thành kiến thức mới\n3. Hoạt động 3: Luyện tập\n4. Hoạt động 4: Vận dụng`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName.endsWith('.txt') ? item.fileName : `${item.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Đã tải xuống file giáo án: ${item.fileName}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Quản Lý Giáo Án & Kế Hoạch Bài Dạy (KHBD)</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
              Công văn 5512/BGDĐT
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
              28 tuần học thực tế
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi giáo viên tự tải giáo án cá nhân lên hàng tuần • Thẩm định, duyệt giáo án điện tử định kỳ theo chuẩn 4 chuỗi hoạt động học
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setUploadForm(prev => ({
                ...prev,
                teacherId: currentUser.id,
                subject: currentUser.subject || 'Toán học',
                week: selectedWeek
              }));
              setShowUploadModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Tải Giáo án lên ngay
          </button>

          <button
            onClick={() => openGoogleSync('sheets')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Đồng bộ giáo án sang Google Sheets & Google Drive"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Google Sheets & Drive
          </button>
        </div>
      </div>

      {/* Standard highlights: 4 chuỗi hoạt động 5512 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
            1
          </div>
          <div>
            <div className="font-bold text-indigo-900">Hoạt động Khởi động</div>
            <div className="text-[11px] text-indigo-700">Tạo tình huống có vấn đề, kích thích tư duy học sinh</div>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
            2
          </div>
          <div>
            <div className="font-bold text-blue-900">Khám phá kiến thức</div>
            <div className="text-[11px] text-blue-700">Học sinh làm việc với học liệu, nhóm, hình thành khái niệm</div>
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs text-purple-950 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
            3
          </div>
          <div>
            <div className="font-bold text-purple-900">Hoạt động Luyện tập</div>
            <div className="text-[11px] text-purple-700">Giải bài tập, củng cố kỹ năng và đánh giá thường xuyên</div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
            4
          </div>
          <div>
            <div className="font-bold text-emerald-900">Hoạt động Vận dụng</div>
            <div className="text-[11px] text-emerald-700">Liên hệ thực tiễn đời sống, dự án nhỏ hoặc bài tập mở</div>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Bộ lọc:
            </span>

            {/* Department Filter */}
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả tổ chuyên môn</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Week Filter */}
            <select
              value={filterWeek}
              onChange={e => setFilterWeek(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả tuần (1-28)</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>

            {/* Teacher Filter */}
            <select
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả giáo viên</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DA_DUYET">Đã ký duyệt</option>
              <option value="CHO_DUYET">Đang chờ thẩm định</option>
              <option value="YEU_CAU_CHINH_SUA">Yêu cầu chỉnh sửa</option>
            </select>

            {/* Only My Plans Toggle */}
            <button
              type="button"
              onClick={() => setOnlyMyGiaoAn(!onlyMyGiaoAn)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                onlyMyGiaoAn
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Giáo án của tôi
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Table / Cards */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị dạng bảng (theo quy định)"
              >
                <Table className="w-3.5 h-3.5" />
                Dạng bảng
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị dạng danh thiếp / thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Dạng thẻ
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Hiển thị <strong>{filteredGiaoAn.length}</strong> / {giaoAnList.length} giáo án
            </div>
          </div>
        </div>

        {/* List or Table of Lesson Plans */}
        {filteredGiaoAn.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Không tìm thấy giáo án nào phù hợp với bộ lọc</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hãy nhấn nút "Tải Giáo án lên ngay" để nộp Kế hoạch bài dạy mới.
            </p>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* Table View: STT, Tên giáo viên, Tên chủ đề, Nội dung giáo án (tên bài), Tiết (theo nội dung giáo án) */
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12 rounded-tl-xl">STT</th>
                  <th className="p-3 min-w-[180px]">Tên giáo viên</th>
                  <th className="p-3 min-w-[200px]">Tên chủ đề</th>
                  <th className="p-3 min-w-[280px]">Nội dung giáo án (tên bài)</th>
                  <th className="p-3 text-center min-w-[130px]">Tiết (theo nội dung giáo án)</th>
                  <th className="p-3 text-center min-w-[140px] rounded-tr-xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGiaoAn.map((item, idx) => {
                  const isApproved = item.status === 'DA_DUYET';
                  const isPending = item.status === 'CHO_DUYET';
                  const isRejected = item.status === 'YEU_CAU_CHINH_SUA';
                  const canReview = currentRole === 'BGH' || currentRole === 'TO_TRUONG';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* STT */}
                      <td className="p-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Tên giáo viên */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.teacherName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.departmentName}
                          </span>
                        </div>
                      </td>

                      {/* Tên chủ đề */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 leading-snug">
                          {item.unitName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            Tuần {item.week}/28
                          </span>
                          {item.grade && (
                            <span className="text-slate-400">
                              Lớp: {item.grade}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nội dung giáo án (tên bài) */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {item.lessonTitle}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã ký duyệt
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Chờ thẩm duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3 h-3 text-rose-600" /> Yêu cầu sửa
                            </span>
                          )}

                          {item.has4Steps && (
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Chuẩn CV 5512
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.fileName}
                          </span>
                        </div>

                        {isRejected && item.reviewNotes && (
                          <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px]">
                            <strong>Góp ý:</strong> {item.reviewNotes}
                          </div>
                        )}
                      </td>

                      {/* Tiết (theo nội dung giáo án) */}
                      <td className="p-3 text-center">
                        <span className="font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100 inline-block text-xs">
                          {item.curriculumPeriods}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => downloadGiaoAnFile(item)}
                            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
                            title="Tải tệp giáo án về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewDetailModal(item)}
                            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
                            title="Xem chi tiết giáo án"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canReview && (
                            <button
                              onClick={() => {
                                setReviewModal(item);
                                setReviewNotes(item.reviewNotes || '');
                              }}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              title={isApproved ? 'Đánh giá lại' : 'Thẩm định'}
                            >
                              <Award className="w-3 h-3" />
                              {isApproved ? 'Đánh giá lại' : 'Thẩm định'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="space-y-3">
            {filteredGiaoAn.map(item => {
              const isApproved = item.status === 'DA_DUYET';
              const isPending = item.status === 'CHO_DUYET';
              const isRejected = item.status === 'YEU_CAU_CHINH_SUA';
              const canReview = currentRole === 'BGH' || currentRole === 'TO_TRUONG';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800 uppercase">
                          {item.subject}{item.grade ? ` • ${item.grade}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                          {item.curriculumPeriods}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Tuần {item.week}/28
                        </span>

                        {item.has4Steps ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Chuẩn 4 hoạt động 5512
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Thiếu bước hoạt động
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {item.lessonTitle}
                      </h3>
                      <p className="text-xs text-slate-500">{item.unitName}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 flex-wrap">
                        <span>
                          Giáo viên: <strong className="text-slate-900">{item.teacherName}</strong>
                        </span>
                        <span>Tổ: {item.departmentName}</span>
                        <span className="text-slate-400">Nộp: {item.uploadDate}</span>
                        <span className="text-slate-500 font-medium">Tệp: {item.fileName} ({item.fileSize})</span>
                      </div>

                      {/* Competencies */}
                      {item.competencies && item.competencies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.competencies.map((comp, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                            >
                              🎯 {comp}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Reviewer Feedback Notes if rejected */}
                      {isRejected && item.reviewNotes && (
                        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                          <strong>Ý kiến yêu cầu chỉnh sửa từ Tổ trưởng:</strong> {item.reviewNotes}
                        </div>
                      )}
                    </div>

                    {/* Right Status & Actions */}
                    <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                      <div>
                        {isApproved ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã ký duyệt
                            </span>
                            {item.rating && (
                              <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
                                Xếp loại: {item.rating === 'XUAT_SAC' ? 'Xuất sắc' : item.rating === 'TOT' ? 'Tốt' : 'Khá'}
                              </div>
                            )}
                            {item.reviewerName && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Ký bởi: {item.reviewerName}
                              </div>
                            )}
                          </div>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Chờ thẩm duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <X className="w-3.5 h-3.5" /> Yêu cầu sửa
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-end">
                        <button
                          onClick={() => downloadGiaoAnFile(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Tải tệp giáo án về máy tính"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          Tải về
                        </button>

                        <button
                          onClick={() => setViewDetailModal(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>

                        {canReview && (
                          <button
                            onClick={() => {
                              setReviewModal(item);
                              setReviewNotes(item.reviewNotes || '');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            {isApproved ? 'Đánh giá lại' : 'Thẩm định'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Thẩm định & Ký duyệt Giáo án */}
      {reviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Thẩm Định Kế Hoạch Bài Dạy (CV 5512)
              </h3>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">{reviewModal.lessonTitle}</div>
              <div className="text-slate-500">
                Giáo viên: <strong>{reviewModal.teacherName}</strong> • {reviewModal.departmentName}
              </div>
              <div className="text-slate-500">
                Tiến độ: {reviewModal.curriculumPeriods} (Tuần {reviewModal.week}/28)
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Xếp loại chất lượng giáo án *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 'XUAT_SAC', label: 'Xuất sắc' },
                    { val: 'TOT', label: 'Tốt' },
                    { val: 'KHA', label: 'Khá' },
                    { val: 'DAT', label: 'Đạt' }
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setReviewRating(r.val as any)}
                      className={`p-2 rounded-lg font-bold border text-center transition-all ${
                        reviewRating === r.val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhận xét, góp ý sư phạm</label>
                <textarea
                  rows={3}
                  placeholder="Đánh giá về tính logic của 4 hoạt động học, tính phân hóa bài tập, câu hỏi gợi mở..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRejectReview}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold border border-rose-200"
                >
                  Yêu cầu chỉnh sửa lại
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewModal(null)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                  >
                    Ký duyệt Giáo án
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tải giáo án lên mới */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                Nộp Kế hoạch bài dạy (Giáo án CV 5512)
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giáo viên nộp</label>
                  <select
                    disabled={currentRole === 'GIAO_VIEN'}
                    value={uploadForm.teacherId}
                    onChange={e => {
                      const t = teachers.find(teach => teach.id === e.target.value);
                      setUploadForm({
                        ...uploadForm,
                        teacherId: e.target.value,
                        subject: t?.subject || uploadForm.subject
                      });
                    }}
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp / Khóa học <span className="text-[11px] font-normal text-slate-500">(Để trống hoặc tự nhập)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống hoặc tự nhập (VD: Lớp DB1, K50...)"
                    value={uploadForm.grade}
                    onChange={e => setUploadForm({ ...uploadForm, grade: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần thực dạy (1 - 28)</label>
                  <select
                    value={uploadForm.week}
                    onChange={e => setUploadForm({ ...uploadForm, week: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>
                        Tuần {w} / 28
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết PPCT</label>
                  <input
                    type="text"
                    placeholder="VD: Tiết 61 - 63"
                    value={uploadForm.curriculumPeriods}
                    onChange={e => setUploadForm({ ...uploadForm, curriculumPeriods: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chương / Chủ đề</label>
                <input
                  type="text"
                  placeholder="VD: Chương 4: Nguyên hàm và Tích phân"
                  value={uploadForm.unitName}
                  onChange={e => setUploadForm({ ...uploadForm, unitName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kế hoạch bài dạy: Phương pháp tích phân từng phần..."
                  value={uploadForm.lessonTitle}
                  onChange={e => setUploadForm({ ...uploadForm, lessonTitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white"
                />
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn file Giáo án (Word .docx / .doc hoặc PDF) *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx,.doc,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-700">Nhấn để chọn file giáo án từ máy tính</p>
                  <p className="text-slate-400 text-[11px]">Hỗ trợ .docx, .doc, .pdf (CV 5512)</p>
                  {selectedFileObj ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã chọn: {selectedFileObj.name} ({uploadForm.fileSize})
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      File đính kèm: {uploadForm.fileName}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Năng lực trọng tâm cần phát triển</label>
                <input
                  type="text"
                  placeholder="VD: Tự học, giải quyết vấn đề toán học, tư duy logic..."
                  value={uploadForm.competencies}
                  onChange={e => setUploadForm({ ...uploadForm, competencies: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex items-center justify-between">
                <span className="font-bold text-indigo-900">
                  Đã cấu trúc đủ 4 hoạt động học theo Công văn 5512:
                </span>
                <input
                  type="checkbox"
                  checked={uploadForm.has4Steps}
                  onChange={e => setUploadForm({ ...uploadForm, has4Steps: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Nộp Giáo Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Chi tiết Kế hoạch bài dạy
              </h3>
              <button onClick={() => setViewDetailModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-base font-extrabold text-slate-900">{viewDetailModal.lessonTitle}</div>
              <div className="text-slate-500 font-medium">{viewDetailModal.unitName}</div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>Giáo viên: <strong>{viewDetailModal.teacherName}</strong></div>
                <div>Tổ bộ môn: <strong>{viewDetailModal.departmentName}</strong></div>
                <div>Khối lớp: <strong>Khối {viewDetailModal.grade}</strong></div>
                <div>Tiến độ: <strong>{viewDetailModal.curriculumPeriods} (Tuần {viewDetailModal.week}/28)</strong></div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1.5">
              <div className="font-bold text-indigo-900">4 Hoạt động học theo Công văn 5512:</div>
              <ol className="list-decimal pl-4 text-slate-700 space-y-1">
                <li><strong>Hoạt động 1: Mở đầu/Khởi động:</strong> Tạo tâm thế và xác định vấn đề bài học.</li>
                <li><strong>Hoạt động 2: Hình thành kiến thức mới:</strong> Đọc hiểu học liệu, làm việc nhóm và thảo luận.</li>
                <li><strong>Hoạt động 3: Luyện tập:</strong> Giải hệ thống bài tập trắc nghiệm và tự luận phân hóa.</li>
                <li><strong>Hoạt động 4: Vận dụng:</strong> Giải quyết bài toán thực tiễn cuộc sống.</li>
              </ol>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-slate-600">Tệp đính kèm: <strong>{viewDetailModal.fileName}</strong> ({viewDetailModal.fileSize})</div>
              <div className="text-slate-600">Ngày nộp: <strong>{viewDetailModal.uploadDate}</strong></div>
              {viewDetailModal.rating && (
                <div className="text-indigo-700 font-bold">
                  Xếp loại: {viewDetailModal.rating === 'XUAT_SAC' ? 'Xuất sắc' : viewDetailModal.rating === 'TOT' ? 'Tốt' : 'Khá'}
                </div>
              )}
              {viewDetailModal.reviewNotes && (
                <div className="text-slate-700 pt-1">
                  <strong>Ý kiến thẩm định:</strong> {viewDetailModal.reviewNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => downloadGiaoAnFile(viewDetailModal)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Tải tệp về máy
              </button>
              <button
                type="button"
                onClick={() => setViewDetailModal(null)}
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
