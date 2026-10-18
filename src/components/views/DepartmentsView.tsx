import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Department, UserProfile } from '../../types';
import { exportTeachersToCSV, downloadTeacherTemplateCSV, parseTeacherCSV } from '../../utils/exportTeachers';
import {
  Users,
  Calendar,
  BookOpen,
  Plus,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  UserCheck,
  ChevronRight,
  Sparkles,
  X,
  Download,
  Upload,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  AlertCircle,
  Building2
} from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const {
    departments,
    teachers,
    assignments,
    addTeacher,
    deleteTeacher,
    deleteTeachersByDepartment,
    resetTeachersToCore,
    importTeachers,
    addToast,
    currentRole,
    openGoogleSync
  } = useApp();
  
  // Special view mode: specific department OR "BGH"
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || 'dep-toan-tin');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [showResetDemoModal, setShowResetDemoModal] = useState(false);
  const [deptToClear, setDeptToClear] = useState<Department | 'BGH' | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<UserProfile | null>(null);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [importTargetDept, setImportTargetDept] = useState<string>('ALL');
  const [parsedPreview, setParsedPreview] = useState<UserProfile[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // New Teacher / BGH Form State
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    code: '',
    departmentId: 'dep-toan-tin',
    subject: 'Toán học',
    position: 'Giáo viên bộ môn',
    role: 'GIAO_VIEN' as 'BGH' | 'TO_TRUONG' | 'GIAO_VIEN',
    homeroomClass: '',
    standardPeriods: 19,
    reductionPeriods: 0,
    phone: '',
    email: ''
  });

  // Minutes mock state
  const [minutes, setMinutes] = useState([
    {
      id: 'bb-01',
      deptId: 'dep-toan-tin',
      title: 'Sinh hoạt chuyên môn theo Nghiên cứu bài học: Dạy học tích hợp STEM môn Toán 12',
      date: '2026-03-05',
      author: 'Cô Nguyễn Thị Thu',
      content: 'Thống nhất tiến trình 4 hoạt động bài học Tích phân; phân tích sản phẩm học tập của học sinh lớp 12A1.',
      attendees: '20/20 đồng chí'
    },
    {
      id: 'bb-02',
      deptId: 'dep-toan-tin',
      title: 'Kiểm tra chéo Hồ sơ chuyên môn & Giáo án đợt giữa Học kỳ II (28 tuần)',
      date: '2026-02-26',
      author: 'Cô Nguyễn Thị Thu',
      content: '100% giáo viên nộp đúng hạn. Đề nghị bổ sung rubrics đánh giá năng lực ở các bài thực hành Tin học.',
      attendees: '20/20 đồng chí'
    },
    {
      id: 'bb-03',
      deptId: 'dep-van-nn',
      title: 'Thống nhất ma trận, đặc tả đề kiểm tra Đánh giá giữa kỳ II môn Ngữ văn & Tiếng Anh',
      date: '2026-03-03',
      author: 'Cô Trần Thị Phương Hoa',
      content: 'Định dạng câu hỏi trắc nghiệm đúng/sai và tự luận nghị luận văn học theo cấu trúc mới của Bộ GD&ĐT.',
      attendees: '18/18 đồng chí'
    }
  ]);

  // New minute form
  const [minuteForm, setMinuteForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    attendees: 'Đủ thành viên trong tổ'
  });

  const isAllDepts = selectedDeptId === 'ALL';
  const isBghSelected = selectedDeptId === 'BGH';
  const selectedDept = departments.find(d => d.id === selectedDeptId);

  // Filter members and sort so Tổ trưởng is always first, then Tổ phó, then teachers
  const rawMembers = isAllDepts
    ? teachers.filter(t => t.role !== 'BGH' && t.departmentId !== 'dep-bgh')
    : isBghSelected
    ? teachers.filter(t => t.role === 'BGH' || t.departmentId === 'dep-bgh')
    : teachers.filter(t => t.departmentId === selectedDeptId);

  const deptMembers = [...rawMembers].sort((a, b) => {
    // Tổ trưởng always top
    if (a.role === 'TO_TRUONG' && b.role !== 'TO_TRUONG') return -1;
    if (b.role === 'TO_TRUONG' && a.role !== 'TO_TRUONG') return 1;
    // Then Tổ phó
    const aIsDeputy = a.position?.toLowerCase().includes('tổ phó');
    const bIsDeputy = b.position?.toLowerCase().includes('tổ phó');
    if (aIsDeputy && !bIsDeputy) return -1;
    if (bIsDeputy && !aIsDeputy) return 1;
    // If viewing ALL, sort by department first
    if (isAllDepts && a.departmentName !== b.departmentName) {
      return (a.departmentName || '').localeCompare(b.departmentName || '');
    }
    return a.code.localeCompare(b.code);
  });

  const deptMinutes = isAllDepts
    ? minutes
    : minutes.filter(m => m.deptId === selectedDeptId);

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      const { success, data, errors } = parseTeacherCSV(text, departments, importTargetDept);
      if (success) {
        setParsedPreview(data);
        setImportErrors([]);
      } else {
        setParsedPreview([]);
        setImportErrors(errors.length > 0 ? errors : ['Không tìm thấy dữ liệu hợp lệ trong file']);
      }
    };
    reader.readAsText(file);
  };

  const handleTargetDeptChange = (newTarget: string) => {
    setImportTargetDept(newTarget);
    if (rawCsvText) {
      const { success, data, errors } = parseTeacherCSV(rawCsvText, departments, newTarget);
      if (success) {
        setParsedPreview(data);
        setImportErrors([]);
      } else {
        setParsedPreview([]);
        setImportErrors(errors.length > 0 ? errors : ['Không tìm thấy dữ liệu hợp lệ trong file']);
      }
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    importTeachers(parsedPreview);
    setShowImportModal(false);
    setImportFile(null);
    setRawCsvText('');
    setParsedPreview([]);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name) return;

    let role = teacherForm.role;
    let deptName = 'Ban Giám Hiệu';
    if (teacherForm.departmentId !== 'dep-bgh') {
      const d = departments.find(dep => dep.id === teacherForm.departmentId);
      deptName = d ? d.name : 'Tổ chuyên môn';
    }

    if (teacherForm.departmentId === 'dep-bgh') {
      role = 'BGH';
    } else if (teacherForm.position.toLowerCase().includes('tổ trưởng')) {
      role = 'TO_TRUONG';
    }

    addTeacher({
      name: teacherForm.name,
      code: teacherForm.code || `GV-${Date.now().toString().slice(-4)}`,
      role,
      departmentId: teacherForm.departmentId,
      departmentName: deptName,
      subject: teacherForm.subject,
      position: teacherForm.position,
      homeroomClass: teacherForm.homeroomClass || undefined,
      standardPeriods: Number(teacherForm.standardPeriods) || 19,
      reductionPeriods: Number(teacherForm.reductionPeriods) || 0,
      actualPeriods: 0,
      phone: teacherForm.phone || '0912345678',
      email: teacherForm.email || 'giaovien@dbss.edu.vn',
      avatar: `https://images.unsplash.com/photo-1534528741775?w=120&auto=format&fit=crop&q=80`
    });

    setShowAddTeacherModal(false);
    setTeacherForm({
      name: '',
      code: '',
      departmentId: selectedDeptId === 'BGH' ? 'dep-bgh' : selectedDeptId,
      subject: 'Toán học',
      position: 'Giáo viên bộ môn',
      role: 'GIAO_VIEN',
      homeroomClass: '',
      standardPeriods: 19,
      reductionPeriods: 0,
      phone: '',
      email: ''
    });
  };

  const handleCreateMinute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !minuteForm.title) return;
    const newM = {
      id: `bb-${Date.now()}`,
      deptId: selectedDept.id,
      title: minuteForm.title,
      date: minuteForm.date,
      author: selectedDept.leaderName,
      content: minuteForm.content,
      attendees: minuteForm.attendees
    };
    setMinutes([newM, ...minutes]);
    setShowMinuteModal(false);
    setMinuteForm({ title: '', date: new Date().toISOString().split('T')[0], content: '', attendees: 'Đủ thành viên' });
    addToast('Đã lưu Biên bản sinh hoạt chuyên môn của tổ', 'success');
  };

  const bghCount = teachers.filter(t => t.role === 'BGH' || t.departmentId === 'dep-bgh').length;
  const canManage = currentRole === 'BGH' || currentRole === 'TO_TRUONG';
  const canResetDemo = currentRole === 'BGH';

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Quản lý Cán bộ & Tổ Chuyên Môn</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-md border border-indigo-100">
              {departments.length} Tổ bộ môn • {teachers.length} Cán bộ, GV
            </span>
            {!canManage && (
              <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
                Quyền xem: Giáo viên
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Trường Dự bị Đại học Dân tộc Sầm Sơn • Quy mô 28 tuần học thực tế • Quản lý nhân sự và hồ sơ sinh hoạt
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canResetDemo && (
            <button
              onClick={() => setShowResetDemoModal(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Xóa danh sách giáo viên demo và khôi phục nòng cốt (3 BGH + 4 Tổ trưởng)"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Xóa hết DS đề mô
            </button>
          )}

          <button
            onClick={() => downloadTeacherTemplateCSV(selectedDeptId === 'BGH' ? 'dep-bgh' : selectedDeptId, departments)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Tải file mẫu để nhập danh sách"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Tải file mẫu CSV
          </button>

          {canManage && (
            <>
              <button
                onClick={() => {
                  setImportTargetDept(selectedDeptId === 'BGH' ? 'dep-bgh' : selectedDeptId);
                  setShowImportModal(true);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                Tải DS giáo viên lên (CSV)
              </button>

              <button
                onClick={() => {
                  setTeacherForm(prev => ({
                    ...prev,
                    departmentId: selectedDeptId === 'BGH' ? 'dep-bgh' : selectedDeptId,
                    role: selectedDeptId === 'BGH' ? 'BGH' : 'GIAO_VIEN',
                    position: selectedDeptId === 'BGH' ? 'Phó Hiệu trưởng' : 'Giáo viên bộ môn'
                  }));
                  setShowAddTeacherModal(true);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Thêm GV / BGH mới
              </button>
            </>
          )}

          <button
            onClick={() => {
              exportTeachersToCSV(teachers, departments, assignments, 'ALL');
              addToast('Đã tải xuống file danh sách toàn bộ cán bộ, giáo viên (Excel)!', 'success');
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất DS giáo viên (Excel)
          </button>

          <button
            onClick={() => openGoogleSync('sheets')}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Đồng bộ trực tiếp với Google Sheets & Google Drive"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Đồng bộ Google Sheets & Drive
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Organization List (BGH + 4 Departments), Right is Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization Units */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Đơn vị chuyên môn & Ban Giám hiệu
          </div>

          {/* Tất cả các tổ chuyên môn Card */}
          <div
            onClick={() => setSelectedDeptId('ALL')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
              isAllDepts
                ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                TOÀN TRƯỜNG
              </span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {teachers.filter(t => t.role !== 'BGH').length} giáo viên (4 tổ)
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-2">Tất cả các tổ chuyên môn</h3>
            <p className="text-xs text-slate-500 mt-1">
              Xem danh sách toàn bộ giáo viên và tổ trưởng của cả 4 tổ chuyên môn trong trường.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Đầy đủ 4 tổ trưởng & các bộ môn</span>
              <ChevronRight className={`w-4 h-4 ${isAllDepts ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Ban Giám Hiệu Card */}
          <div
            onClick={() => setSelectedDeptId('BGH')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
              isBghSelected
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                BGH
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                {bghCount} cán bộ lãnh đạo
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-2">Ban Giám Hiệu Nhà Trường</h3>
            <p className="text-xs text-slate-500 mt-1">
              Chỉ đạo chuyên môn toàn trường, phê duyệt kế hoạch giáo dục, duyệt hồ sơ và phân công giảng dạy 28 tuần.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Q. Hiệu trưởng: <strong>TS. Lê Lâm</strong></span>
              <ChevronRight className={`w-4 h-4 ${isBghSelected ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Department Cards */}
          {departments.map(dept => {
            const isSelected = selectedDeptId === dept.id;
            const currentCount = teachers.filter(t => t.departmentId === dept.id).length;
            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-2xs">
                    {dept.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {currentCount} giáo viên
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-0.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>
                      Tổ trưởng: <strong className="text-indigo-900">{dept.leaderName}</strong>
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  {dept.deputyName && (
                    <div className="text-[10px] text-slate-500 truncate">
                      Tổ phó: <span className="font-semibold text-slate-700">{dept.deputyName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Unit Details (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header info of selected unit */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {isAllDepts ? 'Tổng hợp 4 tổ chuyên môn' : isBghSelected ? 'Cơ quan Quản lý Điều hành' : 'Thông tin chi tiết tổ chuyên môn'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {isAllDepts
                    ? 'Danh sách Cán bộ - Giáo viên Các Tổ Chuyên Môn Toàn Trường'
                    : isBghSelected
                    ? 'Ban Giám Hiệu - Trường Dự bị Đại học Dân tộc Sầm Sơn'
                    : selectedDept?.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  {isAllDepts
                    ? 'Bao gồm 4 tổ chuyên môn (Toán - Tin, Ngữ Văn - Ngoại Ngữ, Tự nhiên, Xã hội), đầy đủ Tổ trưởng, Tổ phó và Giáo viên bộ môn theo định mức giảng dạy 28 tuần.'
                    : isBghSelected
                    ? 'Chỉ đạo toàn diện hoạt động giảng dạy 28 tuần, duyệt phân phối chương trình, thời khóa biểu và kiểm tra hồ sơ chuyên môn định kỳ.'
                    : selectedDept?.description}
                </p>
              </div>

              {!isBghSelected && !isAllDepts && selectedDept && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs shrink-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <strong>Lịch sinh hoạt:</strong>
                  </div>
                  <div className="text-slate-600 pl-5 font-medium">{selectedDept.regularMeetingDay}</div>
                </div>
              )}
            </div>

            {/* Leadership tags for specific dept */}
            {!isBghSelected && !isAllDepts && selectedDept && (() => {
              const deputies = deptMembers.filter(m => m.position?.toLowerCase().includes('tổ phó'));
              return (
                <div className={`grid grid-cols-1 ${deputies.length > 1 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 mt-4 pt-4 border-t border-slate-100`}>
                  <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      TT
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-600">TỔ TRƯỞNG CHUYÊN MÔN</div>
                      <div className="text-xs font-bold text-slate-900">{selectedDept.leaderName}</div>
                      <div className="text-[10px] text-slate-500">
                        {deptMembers.find(m => m.role === 'TO_TRUONG')?.subject ? `Môn ${deptMembers.find(m => m.role === 'TO_TRUONG')?.subject}` : ''}
                      </div>
                    </div>
                  </div>

                  {deputies.length > 0 ? (
                    deputies.map((dep, idx) => (
                      <div key={dep.id} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          TP
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-blue-700">
                            TỔ PHÓ CHUYÊN MÔN {deputies.length > 1 ? `(${idx + 1})` : ''}
                          </div>
                          <div className="text-xs font-bold text-slate-900">{dep.name}</div>
                          <div className="text-[10px] text-slate-500">Giáo viên {dep.subject}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        TP
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500">TỔ PHÓ CHUYÊN MÔN</div>
                        <div className="text-xs font-bold text-slate-900">
                          {selectedDept.deputyName || 'Đang cập nhật'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {isAllDepts
                  ? 'Danh sách giáo viên các tổ chuyên môn'
                  : isBghSelected
                  ? 'Danh sách Ban Giám Hiệu'
                  : `Danh sách giáo viên ${selectedDept?.name}`} ({deptMembers.length} đồng chí)
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {canManage && (
                  <>
                    <button
                      onClick={() => {
                        setImportTargetDept(isBghSelected ? 'dep-bgh' : (selectedDept?.id || 'ALL'));
                        setShowImportModal(true);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Nạp danh sách giáo viên bằng file CSV"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Tải DS CSV
                    </button>

                    <button
                      onClick={() => downloadTeacherTemplateCSV(isBghSelected ? 'dep-bgh' : (selectedDept?.id || 'ALL'), departments)}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Tải mẫu CSV chuẩn"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Mẫu CSV
                    </button>

                    {deptMembers.length > 1 && !isAllDepts && (
                      <button
                        onClick={() => setDeptToClear(isBghSelected ? 'BGH' : (selectedDept || null))}
                        className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Xóa danh sách giáo viên thêm mới, chỉ giữ lại cán bộ phụ trách nòng cốt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Làm sạch DS
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    exportTeachersToCSV(teachers, departments, assignments, isBghSelected ? 'dep-bgh' : (selectedDept?.id || 'ALL'));
                    addToast(`Đã xuất file danh sách ${isAllDepts ? 'toàn trường' : isBghSelected ? 'BGH' : selectedDept?.name} (Excel)!`, 'success');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Excel
                </button>
              </div>
            </div>

            {/* Complete Table with Requested Columns: STT, Mã.GV, Họ và tên, Bộ môn, Lớp giảng day, Lớp chủ nhiệm, Thực dạy, Định mức cần dạy, Thừa/Thiếu */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-12 rounded-l-lg">STT</th>
                    <th className="p-3 text-center w-20">Mã.GV</th>
                    <th className="p-3 min-w-[200px]">Họ và tên</th>
                    <th className="p-3 min-w-[110px]">Bộ môn</th>
                    <th className="p-3 min-w-[160px]">Lớp giảng dạy</th>
                    <th className="p-3 text-center min-w-[100px]">Lớp chủ nhiệm</th>
                    <th className="p-3 text-center min-w-[85px]">Thực dạy</th>
                    <th className="p-3 text-center min-w-[110px]">Định mức cần dạy</th>
                    <th className="p-3 text-center min-w-[125px]">Thừa/Thiếu</th>
                    {canManage && <th className="p-3 rounded-r-lg text-center w-16">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptMembers.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 10 : 9} className="p-8 text-center text-slate-400">
                        Chưa có dữ liệu thành viên trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    deptMembers.map((member, idx) => {
                      const teacherAssignments = assignments.filter(a => a.teacherId === member.id);
                      const assignedPeriods = teacherAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
                      const actualTaught = assignedPeriods > 0 ? assignedPeriods : member.actualPeriods;
                      const quota = Math.max(0, member.standardPeriods - member.reductionPeriods);
                      const diff = actualTaught - quota;

                      const isToTruong = member.role === 'TO_TRUONG';
                      const isToPho = member.position?.toLowerCase().includes('tổ phó');
                      const isBGH = member.role === 'BGH';

                      return (
                        <tr key={member.id} className={`hover:bg-slate-50/90 transition-colors ${isToTruong ? 'bg-indigo-50/20' : ''}`}>
                          {/* STT */}
                          <td className="p-3 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Mã.GV */}
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {member.code}
                            </span>
                          </td>

                          {/* Họ và tên */}
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={member.avatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span>{member.name}</span>
                                  {isToTruong && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                                      Tổ trưởng
                                    </span>
                                  )}
                                  {isToPho && (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                      Tổ phó
                                    </span>
                                  )}
                                  {isBGH && (
                                    <span className="bg-amber-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                                      {member.position}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {isAllDepts ? `${member.departmentName} • ${member.phone}` : member.phone}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Bộ môn */}
                          <td className="p-3 font-bold text-slate-800">
                            {member.subject}
                          </td>

                          {/* Lớp giảng day */}
                          <td className="p-3 text-slate-700">
                            {teacherAssignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {teacherAssignments.map(a => (
                                  <span
                                    key={a.id}
                                    className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[11px] font-medium inline-flex items-center gap-0.5"
                                  >
                                    <span>{a.className}</span>
                                    <strong className="text-indigo-900 font-bold">({a.periodsPerWeek}t)</strong>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa phân công</span>
                            )}
                          </td>

                          {/* Lớp chủ nhiệm */}
                          <td className="p-3 text-center">
                            {member.homeroomClass ? (
                              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs inline-block">
                                {member.homeroomClass}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs">—</span>
                            )}
                          </td>

                          {/* Thực dạy */}
                          <td className="p-3 text-center">
                            <span className="font-extrabold text-indigo-700 text-xs">
                              {actualTaught} tiết
                            </span>
                          </td>

                          {/* Định mức cần dạy */}
                          <td className="p-3 text-center">
                            <span className="font-semibold text-slate-700 text-xs">
                              {quota} tiết
                            </span>
                          </td>

                          {/* Thừa/Thiếu */}
                          <td className="p-3 text-center">
                            {diff === 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đủ định mức (0)
                              </span>
                            ) : diff > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] inline-flex items-center gap-1">
                                Thừa +{diff} tiết
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1">
                                Thiếu {Math.abs(diff)} tiết
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          {canManage && (
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setTeacherToDelete(member)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Xóa cán bộ / giáo viên này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Meeting minutes (Biên bản sinh hoạt chuyên môn) for departments */}
          {!isBghSelected && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Biên bản sinh hoạt chuyên môn theo NCBH ({deptMinutes.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Theo quy định tại Công văn 5555/BGDĐT về đổi mới sinh hoạt tổ chuyên môn
                  </p>
                </div>

                {currentRole !== 'GIAO_VIEN' && (
                  <button
                    onClick={() => setShowMinuteModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ghi Biên bản mới
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {deptMinutes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Chưa có biên bản sinh hoạt nào của tổ.</p>
                ) : (
                  deptMinutes.map(m => (
                    <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-slate-900">{m.title}</h5>
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {m.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{m.content}</p>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Người chủ trì: <strong>{m.author}</strong></span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Thành phần: {m.attendees}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tải danh sách giáo viên lên (CSV) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Tải lên danh sách giáo viên & Ban Giám hiệu</h3>
                  <p className="text-xs text-slate-500">Hỗ trợ định dạng file CSV chuẩn UTF-8</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              {/* Target Department Selection */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    1. Chọn đơn vị / Tổ chuyên môn nhận danh sách:
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">Tự động hoặc chỉ định</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={importTargetDept}
                    onChange={e => handleTargetDeptChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="ALL">Tự động nhận diện từ cột "Tổ chuyên môn" trong file CSV</option>
                    <option value="dep-toan-tin">Gán tất cả vào: Tổ Toán - Tin</option>
                    <option value="dep-van-nn">Gán tất cả vào: Tổ Ngữ Văn - Ngoại Ngữ</option>
                    <option value="dep-tu-nhien">Gán tất cả vào: Tổ Tự nhiên</option>
                    <option value="dep-xa-hoi">Gán tất cả vào: Tổ Xã hội</option>
                    <option value="dep-bgh">Gán tất cả vào: Ban Giám Hiệu</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => downloadTeacherTemplateCSV(importTargetDept, departments)}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors"
                    title="Tải file mẫu định dạng chuẩn cho tổ này"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải mẫu CSV {importTargetDept === 'ALL' ? 'toàn trường' : (importTargetDept === 'dep-bgh' ? 'BGH' : (departments.find(d => d.id === importTargetDept)?.code || 'tổ'))}
                  </button>
                </div>
                {importTargetDept !== 'ALL' && (
                  <p className="text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-md border border-blue-100">
                    💡 <strong>Chế độ tải theo tổ:</strong> Tất cả giáo viên trong file sẽ được gán trực tiếp vào <strong>{importTargetDept === 'dep-bgh' ? 'Ban Giám Hiệu' : departments.find(d => d.id === importTargetDept)?.name}</strong> kể cả khi file tải lên không ghi rõ tên tổ.
                  </p>
                )}
              </div>

              {/* Instructions and Download Template */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
                <div className="text-slate-700">
                  <p className="font-bold">2. Hướng dẫn cấu trúc file CSV</p>
                  <p className="text-[11px] text-slate-500">Các cột chuẩn: Mã GV, Họ và tên, Tổ chuyên môn, Môn giảng dạy, Chức vụ, Lớp chủ nhiệm, Định mức...</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTeacherTemplateCSV(importTargetDept, departments)}
                  className="px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg font-bold hover:bg-indigo-50 shrink-0 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file mẫu
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Nhấn vào đây để chọn file CSV từ máy tính</p>
                <p className="text-slate-400 text-[11px] mt-1">Hỗ trợ file .csv (phân cách bằng dấu phẩy)</p>
                {importFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã chọn: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Có lỗi khi đọc file CSV:
                  </div>
                  <ul className="list-disc pl-5 text-[11px]">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Xem trước dữ liệu ({parsedPreview.length} cán bộ/giáo viên):
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Định dạng hợp lệ</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Họ và tên</th>
                          <th className="p-2">Mã GV</th>
                          <th className="p-2">Đơn vị</th>
                          <th className="p-2">Môn</th>
                          <th className="p-2">Chức vụ</th>
                          <th className="p-2 text-center">Định mức</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.name}</td>
                            <td className="p-2 text-slate-500">{item.code}</td>
                            <td className="p-2 text-slate-700">{item.departmentName}</td>
                            <td className="p-2 text-slate-700">{item.subject}</td>
                            <td className="p-2 text-slate-600">{item.position}</td>
                            <td className="p-2 text-center">{item.standardPeriods} tiết</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg hover:bg-blue-700 font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận nạp {parsedPreview.length} giáo viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Giáo viên / BGH mới thủ công */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Thêm Cán bộ, Giáo viên mới</h3>
              </div>
              <button onClick={() => setShowAddTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên cán bộ/giáo viên *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: TS. Nguyễn Văn Hùng hoặc Cô Trần Thị Mai"
                  value={teacherForm.name}
                  onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã giáo viên / CB</label>
                  <input
                    type="text"
                    placeholder="VD: GV-TT21"
                    value={teacherForm.code}
                    onChange={e => setTeacherForm({ ...teacherForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ chuyên môn / Đơn vị *</label>
                  <select
                    value={teacherForm.departmentId}
                    onChange={e => setTeacherForm({ ...teacherForm, departmentId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="dep-bgh">Ban Giám Hiệu</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn giảng dạy / Lĩnh vực</label>
                  <input
                    type="text"
                    placeholder="VD: Toán học, Ngữ văn, Tin học..."
                    value={teacherForm.subject}
                    onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chức vụ / Vị trí công tác</label>
                  <input
                    type="text"
                    placeholder="VD: Giáo viên bộ môn, Tổ phó, Phó Hiệu trưởng..."
                    value={teacherForm.position}
                    onChange={e => setTeacherForm({ ...teacherForm, position: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp chủ nhiệm (nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: DB-A1"
                    value={teacherForm.homeroomClass}
                    onChange={e => setTeacherForm({ ...teacherForm, homeroomClass: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Định mức chuẩn (tiết)</label>
                  <input
                    type="number"
                    value={teacherForm.standardPeriods}
                    onChange={e => setTeacherForm({ ...teacherForm, standardPeriods: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết giảm trừ</label>
                  <input
                    type="number"
                    value={teacherForm.reductionPeriods}
                    onChange={e => setTeacherForm({ ...teacherForm, reductionPeriods: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email công vụ</label>
                  <input
                    type="email"
                    placeholder="gv@dbss.edu.vn"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Xóa giáo viên */}
      {teacherToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận xóa cán bộ/giáo viên</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ gỡ bỏ giáo viên khỏi hệ thống</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Bạn có chắc chắn muốn xóa <strong>{teacherToDelete.name}</strong> ({teacherToDelete.code} - {teacherToDelete.position}) khỏi danh sách? Phân công giảng dạy liên quan cũng sẽ được cập nhật.
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTeacher(teacherToDelete.id);
                  setTeacherToDelete(null);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa hết dữ liệu giáo viên đề mô */}
      {showResetDemoModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận xóa hết DS giáo viên đề mô?</h3>
                <p className="text-xs text-slate-500">Làm sạch hệ thống & chỉ giữ lại nhân sự nòng cốt</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 mb-4">
              <p className="font-bold text-amber-950">
                Hệ thống sẽ xóa tất cả giáo viên đề mô và giữ lại danh sách chính thức gồm:
              </p>
              <div className="space-y-1 text-[11px] bg-white/70 p-2.5 rounded-lg border border-amber-200">
                <div className="font-bold text-slate-900 border-b border-amber-200/50 pb-1">Ban Giám Hiệu nhà trường (3 cán bộ):</div>
                <div>• <strong>TS. Lê Lâm:</strong> Hiệu trưởng nhà trường</div>
                <div>• <strong>TS. Trịnh Thị Hoa:</strong> Phó Hiệu trưởng nhà trường</div>
                <div>• <strong>TS. Lê Văn Sơn:</strong> Phó Hiệu trưởng nhà trường</div>
                <div className="font-bold text-slate-900 border-b border-amber-200/50 pt-2 pb-1">Tổ trưởng chuyên môn (4 tổ):</div>
                <div>• <strong>Cô Nguyễn Thị Thu:</strong> Tổ trưởng Tổ Toán - Tin</div>
                <div>• <strong>Cô Trần Thị Phương Hoa:</strong> Tổ trưởng Tổ Ngữ Văn - Ngoại Ngữ</div>
                <div>• <strong>Cô Nguyễn Thị Hiền:</strong> Tổ trưởng Tổ Tự nhiên</div>
                <div>• <strong>Cô Mai Thị Thanh:</strong> Tổ trưởng Tổ Xã hội</div>
              </div>
              <p className="text-[11px] text-amber-800">
                Sau khi làm sạch, Quý trường có thể tải lên danh sách giáo viên chuẩn theo từng tổ chuyên môn bằng file CSV hoặc nhập thủ công.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetDemoModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  resetTeachersToCore();
                  setShowResetDemoModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác nhận xóa & làm sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa danh sách giáo viên theo tổ */}
      {deptToClear && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Làm sạch DS {deptToClear === 'BGH' ? 'Ban Giám Hiệu' : deptToClear.name}?
                </h3>
                <p className="text-xs text-slate-500">Chỉ giữ lại cán bộ lãnh đạo nòng cốt</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              Thao tác này sẽ xóa danh sách giáo viên đã thêm vào <strong>{deptToClear === 'BGH' ? 'Ban Giám Hiệu' : deptToClear.name}</strong> và chỉ giữ lại {deptToClear === 'BGH' ? '3 cán bộ Ban Giám Hiệu' : `Tổ trưởng (${deptToClear.leaderName})`}. Bạn có chắc chắn muốn tiếp tục?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeptToClear(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTeachersByDepartment(deptToClear === 'BGH' ? 'dep-bgh' : deptToClear.id);
                  setDeptToClear(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác nhận làm sạch tổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ghi biên bản họp tổ */}
      {showMinuteModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Ghi Biên bản sinh hoạt {selectedDept?.name}
              </h3>
              <button onClick={() => setShowMinuteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMinute} className="space-y-3.5 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chủ đề sinh hoạt chuyên môn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thống nhất giáo án STEM theo CV 5512 hoặc Đánh giá giữa kỳ..."
                  value={minuteForm.title}
                  onChange={e => setMinuteForm({ ...minuteForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày sinh hoạt</label>
                  <input
                    type="date"
                    value={minuteForm.date}
                    onChange={e => setMinuteForm({ ...minuteForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thành phần tham dự</label>
                  <input
                    type="text"
                    value={minuteForm.attendees}
                    onChange={e => setMinuteForm({ ...minuteForm, attendees: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung & Kết luận cuộc họp</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi tóm tắt nội dung thảo luận, các giải pháp sư phạm và phân công nhiệm vụ cụ thể..."
                  value={minuteForm.content}
                  onChange={e => setMinuteForm({ ...minuteForm, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMinuteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs"
                >
                  Lưu Biên bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
