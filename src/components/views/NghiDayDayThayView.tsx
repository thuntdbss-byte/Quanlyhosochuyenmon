import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AbsenceAndSwapRequest, RequestType } from '../../types';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Check,
  X,
  UserCheck,
  Calendar,
  DollarSign,
  Send
} from 'lucide-react';

export const NghiDayDayThayView: React.FC = () => {
  const {
    requests,
    teachers,
    currentUser,
    currentRole,
    approveRequest,
    rejectRequest,
    createRequest,
    addToast
  } = useApp();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form state for creating request
  const [form, setForm] = useState({
    type: 'DAY_THAY' as RequestType,
    date: new Date().toISOString().split('T')[0],
    periods: [1, 2],
    session: 'SANG' as 'SANG' | 'CHIEU',
    className: '12A1',
    subject: currentUser.subject || 'Toán học',
    curriculumPeriod: 62,
    lessonTitle: '',
    reason: '',
    substituteTeacherId: teachers[1]?.id || '',
    swapDate: new Date().toISOString().split('T')[0],
    swapPeriod: 3,
    swapClass: '12A3',
    swapWithTeacherId: teachers[2]?.id || '',
    isPaidSubstitute: true
  });

  const filteredRequests = requests.filter(r => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason || !form.lessonTitle) {
      addToast('Vui lòng nhập đầy đủ tên bài học và lý do', 'warning');
      return;
    }

    const subTeacher = teachers.find(t => t.id === form.substituteTeacherId);
    const swapTeacher = teachers.find(t => t.id === form.swapWithTeacherId);

    createRequest({
      type: form.type,
      requestTeacherId: currentUser.id,
      requestTeacherName: currentUser.name,
      departmentId: currentUser.departmentId,
      date: form.date,
      periods: form.periods,
      session: form.session,
      className: form.className.toUpperCase(),
      subject: form.subject,
      curriculumPeriod: Number(form.curriculumPeriod),
      lessonTitle: form.lessonTitle,
      reason: form.reason,
      substituteTeacherId: form.type === 'DAY_THAY' ? subTeacher?.id : undefined,
      substituteTeacherName: form.type === 'DAY_THAY' ? subTeacher?.name : undefined,
      swapDate: form.type === 'DOI_GIO' ? form.swapDate : undefined,
      swapPeriod: form.type === 'DOI_GIO' ? Number(form.swapPeriod) : undefined,
      swapClass: form.type === 'DOI_GIO' ? form.swapClass : undefined,
      swapWithTeacherId: form.type === 'DOI_GIO' ? swapTeacher?.id : undefined,
      swapWithTeacherName: form.type === 'DOI_GIO' ? swapTeacher?.name : undefined,
      isPaidSubstitute: form.isPaidSubstitute
    });

    setShowAddModal(false);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    rejectRequest(rejectModal, rejectReason);
    setRejectModal(null);
    setRejectReason('');
  };

  // Calculate substitute count for all teachers
  const substituteStats = teachers.map(t => {
    const subs = requests.filter(r => r.substituteTeacherId === t.id && r.status === 'DA_DUYET');
    const totalPeriods = subs.reduce((sum, r) => sum + r.periods.length, 0);
    return { teacher: t, count: subs.length, totalPeriods };
  }).filter(s => s.totalPeriods > 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Quản Lý Nghỉ Dạy, Dạy Thay & Đổi Giờ</h2>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200">
              Điều phối chuyên môn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảo đảm nền nếp không trống tiết; quy trình phê duyệt điện tử nhanh chóng giữa Giáo viên, Tổ trưởng và Ban Giám hiệu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo đơn xin nghỉ / đổi giờ / dạy thay
          </button>
        </div>
      </div>

      {/* Substitute Teaching Allowance Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Bảng theo dõi số tiết dạy thay được duyệt (Thanh toán thù lao thừa giờ)
          </h3>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            Tháng 03/2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {substituteStats.map(s => (
            <div key={s.teacher.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">{s.teacher.name}</div>
                <div className="text-[11px] text-slate-500">{s.teacher.departmentName}</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-700">+{s.totalPeriods} tiết</span>
                <div className="text-[10px] text-slate-400">({s.count} lượt dạy thay)</div>
              </div>
            </div>
          ))}
          {substituteStats.length === 0 && (
            <div className="col-span-3 text-center py-3 text-xs text-slate-400">
              Chưa có tiết dạy thay phát sinh được phê duyệt trong tháng
            </div>
          )}
        </div>
      </div>

      {/* Filter and List of Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc theo:
            </span>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="DAY_THAY">Dạy thay</option>
              <option value="DOI_GIO">Đổi giờ</option>
              <option value="NGHI_DAY">Nghỉ dạy</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHO_DUYET">Chờ phê duyệt</option>
              <option value="DA_DUYET">Đã phê duyệt</option>
              <option value="TU_CHOI">Từ chối</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Tổng số: <strong>{filteredRequests.length} yêu cầu</strong>
          </div>
        </div>

        {/* Requests Cards */}
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const isPending = req.status === 'CHO_DUYET';
            const isApproved = req.status === 'DA_DUYET';
            const isRejected = req.status === 'TU_CHOI';

            return (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {req.code}
                      </span>

                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          req.type === 'DAY_THAY'
                            ? 'bg-blue-100 text-blue-800'
                            : req.type === 'DOI_GIO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.type === 'DAY_THAY'
                          ? 'Dạy thay'
                          : req.type === 'DOI_GIO'
                          ? 'Đổi giờ dạy'
                          : 'Nghỉ dạy'}
                      </span>

                      <span className="text-xs font-bold text-slate-900">
                        {req.requestTeacherName}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({req.subject} - Lớp {req.className})
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      <strong>Nội dung tiết:</strong> Tiết {req.curriculumPeriod} - {req.lessonTitle}
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Lý do xin nghỉ/đổi:</strong> {req.reason}
                    </p>

                    {/* Specific details for substitute or swap */}
                    <div className="p-2.5 bg-slate-100/70 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1 mt-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>
                          📅 Thời gian: <strong>{req.date}</strong> (Tiết {req.periods.join(', ')} -{' '}
                          {req.session === 'SANG' ? 'Buổi sáng' : 'Buổi chiều'})
                        </span>

                        {req.type === 'DAY_THAY' && req.substituteTeacherName && (
                          <span className="text-indigo-700 font-bold">
                            👨‍🏫 Giáo viên dạy thay: {req.substituteTeacherName}
                          </span>
                        )}

                        {req.type === 'DOI_GIO' && (
                          <span className="text-purple-700 font-bold">
                            🔄 Đổi với {req.swapWithTeacherName}: Tiết {req.swapPeriod} ngày {req.swapDate} (Lớp {req.swapClass})
                          </span>
                        )}
                      </div>
                    </div>

                    {req.notes && (
                      <div className="text-[11px] text-slate-500 italic">
                        Ý kiến phê duyệt: {req.notes}
                      </div>
                    )}
                  </div>

                  {/* Right Status and Action buttons */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                    <div>
                      {isApproved ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Người duyệt: {req.approvedBy}
                          </div>
                        </div>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Chờ BGH & Tổ duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </span>
                      )}
                    </div>

                    {currentRole !== 'GIAO_VIEN' && isPending && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Phê duyệt
                        </button>
                        <button
                          onClick={() => setRejectModal(req.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Thêm đơn */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                Tạo Đơn Nghỉ dạy / Dạy thay / Đổi giờ
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại đề nghị *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DAY_THAY', 'DOI_GIO', 'NGHI_DAY'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`py-2 rounded-lg font-bold border text-center transition-all ${
                        form.type === type
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type === 'DAY_THAY' ? 'Dạy thay' : type === 'DOI_GIO' ? 'Đổi giờ' : 'Nghỉ dạy'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày vắng / đổi *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buổi</label>
                  <select
                    value={form.session}
                    onChange={e => setForm({ ...form, session: e.target.value as 'SANG' | 'CHIEU' })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="SANG">Buổi sáng</option>
                    <option value="CHIEU">Buổi chiều</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp giảng dạy *</label>
                  <input
                    type="text"
                    required
                    placeholder="12A1"
                    value={form.className}
                    onChange={e => setForm({ ...form, className: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết PPCT</label>
                  <input
                    type="number"
                    value={form.curriculumPeriod}
                    onChange={e => setForm({ ...form, curriculumPeriod: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học theo KHBD *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Ôn tập chương 4 - Giải bài tập tích phân..."
                  value={form.lessonTitle}
                  onChange={e => setForm({ ...form, lessonTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              {/* Specific fields */}
              {form.type === 'DAY_THAY' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chỉ định Giáo viên dạy thay cùng bộ môn *
                  </label>
                  <select
                    value={form.substituteTeacherId}
                    onChange={e => setForm({ ...form, substituteTeacherId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {teachers
                      .filter(t => t.id !== currentUser.id)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subject} - {t.departmentName})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {form.type === 'DOI_GIO' && (
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 space-y-2">
                  <div className="font-bold text-purple-900">Thông tin ca đổi đối ứng:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-600 mb-0.5">Giáo viên đổi cùng</label>
                      <select
                        value={form.swapWithTeacherId}
                        onChange={e => setForm({ ...form, swapWithTeacherId: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded"
                      >
                        {teachers
                          .filter(t => t.id !== currentUser.id)
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-0.5">Ngày đổi dạy bù</label>
                      <input
                        type="date"
                        value={form.swapDate}
                        onChange={e => setForm({ ...form, swapDate: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do cụ thể *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Lý do đi công tác, khám bệnh, việc hiếu/hỉ..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
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
                  Gửi Đơn Trình Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Từ chối đơn yêu cầu</h3>
              <button onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3 mt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do không duyệt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Trùng lịch thi, chưa có người nhận dạy thay..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
