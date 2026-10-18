import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TeachingAssignment } from '../../types';
import { exportTeachersToCSV } from '../../utils/exportTeachers';
import {
  CalendarDays,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  X,
  FileSpreadsheet,
  Download,
  Users
} from 'lucide-react';

export const TeachingAssignmentView: React.FC = () => {
  const {
    assignments,
    teachers,
    departments,
    addAssignment,
    deleteAssignment,
    currentRole,
    addToast,
    academicYear,
    openGoogleSync
  } = useApp();

  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new assignment
  const [form, setForm] = useState({
    teacherId: teachers[0]?.id || '',
    subject: teachers[0]?.subject || 'Tin học',
    className: 'DB-A1',
    periodsPerWeek: 4,
    semester: 'CA_NAM' as 'HK1' | 'HK2' | 'CA_NAM',
    academicYear: academicYear || '2026 - 2027',
    notes: ''
  });

  const filteredAssignments = assignments.filter(item => {
    if (filterDept !== 'ALL' && item.departmentId !== filterDept) return false;
    return true;
  });

  // Calculate teacher quotas summary
  const teacherQuotas = teachers.map(teacher => {
    const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
    const totalPeriods = teacherAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
    const requiredPeriods = teacher.standardPeriods - teacher.reductionPeriods;
    const diff = totalPeriods - requiredPeriods;

    return {
      teacher,
      totalPeriods,
      requiredPeriods,
      diff,
      classes: teacherAssignments.map(a => `${a.className} (${a.periodsPerWeek}t)`).join(', ')
    };
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === form.teacherId);
    if (!teacher) return;

    addAssignment({
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      subject: form.subject,
      className: form.className.toUpperCase().trim(),
      periodsPerWeek: Number(form.periodsPerWeek),
      semester: form.semester,
      academicYear: form.academicYear || academicYear,
      notes: form.notes
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Phân Công Chuyên Môn & Định Mức Giờ Dạy</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
              Năm học {academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý phân công số tiết giảng dạy, kiêm nhiệm, tính thừa/thiếu tiết theo Thông tư 28/2009 & TT 15/2017/BGDĐT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportTeachersToCSV(teachers, departments, assignments, filterDept, academicYear);
              addToast('Đã tải xuống file danh sách giáo viên thành công!', 'success');
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            Tải DS giáo viên (Excel)
          </button>

          <button
            onClick={() => openGoogleSync('sheets')}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Đồng bộ phân công chuyên môn lên Google Sheets & Google Drive"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Google Sheets & Drive
          </button>

          {currentRole !== 'GIAO_VIEN' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm phân công lớp dạy
            </button>
          )}
        </div>
      </div>

      {/* Quota overview cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Bảng theo dõi định mức tiết dạy của Giáo viên
            </h3>
            <p className="text-xs text-slate-500">
              Chuẩn giáo viên THPT: 19 tiết/tuần. Giảm trừ: Chủ nhiệm (-4 tiết), Tổ trưởng (-3 tiết), Tổ phó (-1 tiết).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2.5 rounded-l-lg">Giáo viên</th>
                <th className="p-2.5">Tổ bộ môn</th>
                <th className="p-2.5">Chức vụ & Giảm trừ</th>
                <th className="p-2.5 text-center">Định mức cần dạy</th>
                <th className="p-2.5 text-center">Thực dạy</th>
                <th className="p-2.5 text-center">Thừa / Thiếu</th>
                <th className="p-2.5 rounded-r-lg">Lớp phụ trách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherQuotas.map(item => (
                <tr key={item.teacher.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900">
                    <div>{item.teacher.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{item.teacher.code} - {item.teacher.subject}</div>
                  </td>
                  <td className="p-2.5 text-slate-600 font-medium">{item.teacher.departmentName}</td>
                  <td className="p-2.5 text-slate-600">
                    <span className="font-semibold text-slate-800">{item.teacher.position}</span>
                    {item.teacher.reductionPeriods > 0 && (
                      <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Giảm {item.teacher.reductionPeriods} tiết
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-700">
                    {item.requiredPeriods} tiết/tuần
                  </td>
                  <td className="p-2.5 text-center font-extrabold text-indigo-700">
                    {item.totalPeriods} tiết
                  </td>
                  <td className="p-2.5 text-center">
                    {item.diff === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Đủ định mức
                      </span>
                    ) : item.diff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        +{item.diff} tiết (Vượt giờ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3 h-3" /> Thiếu {Math.abs(item.diff)} tiết
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600 text-[11px] max-w-xs truncate">
                    {item.classes || 'Chưa phân công lớp'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment List Table with Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            Chi tiết các lớp giảng dạy ({filteredAssignments.length} phân công)
          </h3>

          <div className="flex items-center gap-2">
            {/* Filter by Department */}
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2.5 rounded-l-lg">Lớp</th>
                <th className="p-2.5">Môn học</th>
                <th className="p-2.5">Giáo viên giảng dạy</th>
                <th className="p-2.5 text-center">Số tiết/tuần</th>
                <th className="p-2.5">Học kỳ</th>
                <th className="p-2.5">Ghi chú chuyên môn</th>
                {currentRole !== 'GIAO_VIEN' && <th className="p-2.5 rounded-r-lg text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-extrabold text-indigo-700">
                    <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-md">
                      {item.className}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-800">{item.subject}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{item.teacherName}</td>
                  <td className="p-2.5 text-center font-bold text-indigo-600">{item.periodsPerWeek} tiết</td>
                  <td className="p-2.5 text-slate-600">
                    {item.semester === 'CA_NAM' ? 'Cả năm' : item.semester === 'HK1' ? 'Học kỳ I' : 'Học kỳ II'}
                  </td>
                  <td className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate">{item.notes || '—'}</td>
                  {currentRole !== 'GIAO_VIEN' && (
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => deleteAssignment(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Xóa phân công này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Assignment */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Thêm phân công chuyên môn giảng dạy
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giáo viên phụ trách *</label>
                <select
                  value={form.teacherId}
                  onChange={e => {
                    const t = teachers.find(tch => tch.id === e.target.value);
                    setForm({
                      ...form,
                      teacherId: e.target.value,
                      subject: t?.subject || form.subject
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject} - {t.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Môn học *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="VD: Tin học, Ngữ văn, Sinh học..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên lớp dạy *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 12A1, 10D2..."
                    value={form.className}
                    onChange={e => setForm({ ...form, className: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tiết/tuần *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={form.periodsPerWeek}
                    onChange={e => setForm({ ...form, periodsPerWeek: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú chuyên môn</label>
                <input
                  type="text"
                  placeholder="VD: Lớp định hướng KHTN, ôn thi tốt nghiệp THPT..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
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
                  Lưu phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
