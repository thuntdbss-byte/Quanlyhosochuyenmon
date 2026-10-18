import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NeNepRecord } from '../../types';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Star,
  FileCheck,
  User,
  Filter,
  Eye,
  X
} from 'lucide-react';

export const NeNepDuGioView: React.FC = () => {
  const { neNepList, teachers, addNeNepRecord, currentUser, currentRole, addToast } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NeNepRecord | null>(null);

  // Form state
  const [form, setForm] = useState({
    teacherId: teachers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    type: 'DU_GIO' as NeNepRecord['type'],
    className: '12A1',
    subject: 'Toán học',
    lessonTitle: '',
    scores: {
      keHoachBaiDay: 4.5,
      hoatDongHocSinh: 4.5,
      phuongPhapDayHoc: 4.5,
      hieuQuaTietDay: 4.5
    },
    feedback: ''
  });

  const totalScore = Math.round(
    (form.scores.keHoachBaiDay +
      form.scores.hoatDongHocSinh +
      form.scores.phuongPhapDayHoc +
      form.scores.hieuQuaTietDay) * 10
  ) / 10;

  const calculateRanking = (score: number): NeNepRecord['ranking'] => {
    if (score >= 18) return 'XUAT_SAC';
    if (score >= 15) return 'TOT';
    if (score >= 12) return 'KHA';
    if (score >= 10) return 'DAT';
    return 'CHUA_DAT';
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lessonTitle || !form.feedback) return;

    const teacher = teachers.find(t => t.id === form.teacherId);
    if (!teacher) return;

    const ranking = calculateRanking(totalScore);

    addNeNepRecord({
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentName: teacher.departmentName,
      date: form.date,
      type: form.type,
      className: form.className.toUpperCase(),
      subject: form.subject,
      lessonTitle: form.lessonTitle,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.position,
      scores: form.scores,
      totalScore,
      ranking,
      feedback: form.feedback
    });

    setShowAddModal(false);
  };

  const filteredList = neNepList.filter(item => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Nề Nếp Chuyên Môn & Đánh Giá Tiết Dạy</h2>
            <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
              Thang điểm 20 - Chuẩn nghề nghiệp GV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá tiết dạy theo định hướng phát triển năng lực học sinh, thực hiện quy chế giờ dạy và thanh tra hồ sơ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole !== 'GIAO_VIEN' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lập phiếu Dự giờ / Đánh giá
            </button>
          )}
        </div>
      </div>

      {/* 4 Standard Criteria Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiêu chí 1 (Max 5đ)</div>
          <div className="font-bold text-slate-900 mt-1">Kế hoạch bài dạy (CV 5512)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mục tiêu rõ ràng, chuỗi 4 hoạt động học hợp lý</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiêu chí 2 (Max 5đ)</div>
          <div className="font-bold text-slate-900 mt-1">Hoạt động học sinh</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Học sinh tích cực, chủ động, hợp tác nhóm hiệu quả</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiêu chí 3 (Max 5đ)</div>
          <div className="font-bold text-slate-900 mt-1">Phương pháp & Thiết bị</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ứng dụng CNTT, đồ dùng dạy học, thí nghiệm sinh động</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiêu chí 4 (Max 5đ)</div>
          <div className="font-bold text-slate-900 mt-1">Nề nếp & Hiệu quả</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đúng giờ, kỷ cương lớp học, đạt mục tiêu chuẩn đầu ra</div>
        </div>
      </div>

      {/* Evaluation List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase">Hình thức:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả ({neNepList.length})</option>
              <option value="DU_GIO">Dự giờ chuyên môn</option>
              <option value="KIEM_TRA_DOT_XUAT">Kiểm tra đột xuất</option>
              <option value="KIEM_TRA_HO_SO">Kiểm tra hồ sơ sổ sách</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Tổng số phiếu đánh giá: <strong>{filteredList.length}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map(record => (
            <div
              key={record.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-slate-50/40 hover:bg-white transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        record.type === 'DU_GIO'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {record.type === 'DU_GIO' ? 'Dự giờ' : 'Kiểm tra đột xuất'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{record.teacherName}</span>
                    <span className="text-xs text-slate-500">({record.subject} - Lớp {record.className})</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-800 leading-snug">
                    {record.lessonTitle}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-indigo-700">
                    {record.totalScore}/20đ
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      record.ranking === 'XUAT_SAC'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {record.ranking === 'XUAT_SAC' ? 'Xuất sắc' : 'Tốt'}
                  </span>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-100/70 rounded-lg text-center text-[10px] text-slate-600 font-medium">
                <div>KHBD: <strong>{record.scores.keHoachBaiDay}đ</strong></div>
                <div>HĐ Học: <strong>{record.scores.hoatDongHocSinh}đ</strong></div>
                <div>PPDH: <strong>{record.scores.phuongPhapDayHoc}đ</strong></div>
                <div>Hiệu quả: <strong>{record.scores.hieuQuaTietDay}đ</strong></div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 italic">
                "{record.feedback}"
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Người dự / kiểm tra: <strong>{record.inspectorName}</strong>
                </span>
                <span>{record.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Lập phiếu dự giờ mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Lập Phiếu Đánh Giá Tiết Dạy / Dự Giờ
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 mt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giáo viên được dự giờ / kiểm tra *</label>
                <select
                  value={form.teacherId}
                  onChange={e => {
                    const t = teachers.find(tch => tch.id === e.target.value);
                    setForm({ ...form, teacherId: e.target.value, subject: t?.subject || form.subject });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject} - {t.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày dự</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình thức</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as NeNepRecord['type'] })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="DU_GIO">Dự giờ</option>
                    <option value="KIEM_TRA_DOT_XUAT">Kiểm tra đột xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp dạy</label>
                  <input
                    type="text"
                    required
                    placeholder="12A1"
                    value={form.className}
                    onChange={e => setForm({ ...form, className: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài học *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiết 60: Ứng dụng tích phân tính diện tích hình phẳng..."
                  value={form.lessonTitle}
                  onChange={e => setForm({ ...form, lessonTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* 4 Score inputs */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex justify-between">
                  <span>Chấm điểm theo 4 tiêu chí (Thang 5 điểm mỗi tiêu chí):</span>
                  <span className="text-indigo-700 font-extrabold text-sm">Tổng: {totalScore} / 20đ</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">1. Kế hoạch bài dạy (Max 5)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={form.scores.keHoachBaiDay}
                      onChange={e => setForm({
                        ...form,
                        scores: { ...form.scores, keHoachBaiDay: Number(e.target.value) }
                      })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">2. Hoạt động học sinh (Max 5)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={form.scores.hoatDongHocSinh}
                      onChange={e => setForm({
                        ...form,
                        scores: { ...form.scores, hoatDongHocSinh: Number(e.target.value) }
                      })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">3. Phương pháp & thiết bị (Max 5)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={form.scores.phuongPhapDayHoc}
                      onChange={e => setForm({
                        ...form,
                        scores: { ...form.scores, phuongPhapDayHoc: Number(e.target.value) }
                      })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">4. Nề nếp & Hiệu quả (Max 5)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={5}
                      value={form.scores.hieuQuaTietDay}
                      onChange={e => setForm({
                        ...form,
                        scores: { ...form.scores, hieuQuaTietDay: Number(e.target.value) }
                      })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhận xét ưu điểm & tồn tại *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi nhận xét ưu điểm về nề nếp, tác phong sư phạm và gợi ý nâng cao hiệu quả bài dạy..."
                  value={form.feedback}
                  onChange={e => setForm({ ...form, feedback: e.target.value })}
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
                  Lưu Phiếu Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
