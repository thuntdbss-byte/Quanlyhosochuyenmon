import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bell,
  Filter,
  Download,
  Search,
  BookOpen,
  FileSpreadsheet,
  Award
} from 'lucide-react';

export const HoSoMatrixView: React.FC = () => {
  const { hoSoMatrix, remindTeacher, currentRole, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredList = hoSoMatrix.filter(item => {
    if (filterStatus !== 'ALL' && item.overallStatus !== filterStatus) return false;
    if (
      search &&
      !item.teacherName.toLowerCase().includes(search.toLowerCase()) &&
      !item.subject.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalTeachers = hoSoMatrix.length;
  const compliantTeachers = hoSoMatrix.filter(
    h => h.overallStatus === 'XUAT_SAC' || h.overallStatus === 'DAT_CHUAN'
  ).length;
  const warningTeachers = hoSoMatrix.filter(h => h.overallStatus === 'CANH_BAO').length;
  const compliancePercentage = Math.round((compliantTeachers / totalTeachers) * 100);

  const handleRemindAll = () => {
    const needRemind = hoSoMatrix.filter(h => h.overallStatus === 'CANH_BAO');
    needRemind.forEach(h => remindTeacher(h.teacherId, 'Giáo án và Sổ báo giảng'));
    addToast(`Đã gửi thông báo đôn đốc tới ${needRemind.length} giáo viên chậm tiến độ`, 'warning');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Ma Trận Tình Trạng Hồ Sơ Sổ Sách Chuyên Môn</h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
              Kiểm tra định kỳ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ hoàn thành 6 loại hồ sơ chuyên môn bắt buộc theo Điều lệ trường trung học & Thông tư Bộ GD&ĐT
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole !== 'GIAO_VIEN' && warningTeachers > 0 && (
            <button
              onClick={handleRemindAll}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Bell className="w-4 h-4" />
              Đôn đốc giáo viên chậm nộp ({warningTeachers})
            </button>
          )}
        </div>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Tỷ lệ hoàn thành hồ sơ</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-indigo-700">{compliancePercentage}%</div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {compliantTeachers}/{totalTeachers} Giáo viên đạt chuẩn
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${compliancePercentage}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Hồ sơ xuất sắc & Đúng hạn</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-emerald-700">
              {hoSoMatrix.filter(h => h.overallStatus === 'XUAT_SAC').length}
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Đủ 100% minh chứng
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '40%' }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-500">Cảnh báo chậm nộp / Cần sửa</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-rose-600">{warningTeachers}</div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Cần khắc phục
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '15%' }} />
          </div>
        </div>
      </div>

      {/* Audit Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên, môn..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-48"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">Tất cả xếp loại</option>
              <option value="XUAT_SAC">Xuất sắc</option>
              <option value="DAT_CHUAN">Đạt chuẩn</option>
              <option value="CANH_BAO">Cảnh báo chậm muộn</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Dữ liệu cập nhật kiểm tra đến ngày: <strong>16/03/2026</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Giáo viên</th>
                <th className="p-3">Tổ bộ môn</th>
                <th className="p-3 text-center">Sổ Báo Giảng</th>
                <th className="p-3 text-center">Giáo án (KHBD)</th>
                <th className="p-3 text-center">Sổ Dự Giờ</th>
                <th className="p-3 text-center">Sổ Điểm Điện Tử</th>
                <th className="p-3 text-center">Kế Hoạch Cá Nhân</th>
                <th className="p-3 text-center">Đánh Giá Chung</th>
                {currentRole !== 'GIAO_VIEN' && <th className="p-3 text-right">Đôn đốc</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(item => {
                const isWarning = item.overallStatus === 'CANH_BAO';
                const isExcellent = item.overallStatus === 'XUAT_SAC';

                return (
                  <tr key={item.teacherId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{item.teacherName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {item.code} - {item.subject}
                      </div>
                    </td>

                    <td className="p-3 text-slate-600 font-medium">{item.departmentName}</td>

                    {/* Sổ báo giảng */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.baoGiangStatus === 'DA_NOP_DU'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.baoGiangStatus === 'DANG_CHO_DUYET'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.baoGiangRate}% (
                        {item.baoGiangStatus === 'DA_NOP_DU'
                          ? 'Đầy đủ'
                          : item.baoGiangStatus === 'DANG_CHO_DUYET'
                          ? 'Chờ duyệt'
                          : 'Trễ hạn'}
                        )
                      </span>
                    </td>

                    {/* Giáo án */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.giaoAnStatus === 'DA_NOP_DU'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.giaoAnStatus === 'DANG_CHO_DUYET'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.giaoAnCount.submitted}/{item.giaoAnCount.required} bài (
                        {item.giaoAnStatus === 'DA_NOP_DU'
                          ? 'Đủ'
                          : item.giaoAnStatus === 'CAN_SUA'
                          ? 'Cần sửa'
                          : 'Chờ'}
                        )
                      </span>
                    </td>

                    {/* Sổ dự giờ */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.duGioCount.actual >= item.duGioCount.required
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.duGioCount.actual}/{item.duGioCount.required} tiết
                      </span>
                    </td>

                    {/* Sổ điểm */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.soDiemDienTu === 'DA_CAP_NHAT' || item.soDiemDienTu === 'DU_DIEM'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.soDiemDienTu === 'DA_CAP_NHAT'
                          ? 'Đã cập nhật'
                          : item.soDiemDienTu === 'DU_DIEM'
                          ? 'Đủ cột điểm'
                          : 'Chậm điểm'}
                      </span>
                    </td>

                    {/* Kế hoạch */}
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Đã duyệt
                      </span>
                    </td>

                    {/* Đánh giá chung */}
                    <td className="p-3 text-center">
                      {isExcellent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Xuất sắc
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Cảnh báo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Đạt chuẩn
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {currentRole !== 'GIAO_VIEN' && (
                      <td className="p-3 text-right">
                        {isWarning && (
                          <button
                            onClick={() => remindTeacher(item.teacherId, 'Giáo án & Sổ báo giảng')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-1 ml-auto"
                            title="Gửi thông báo nhắc nhở"
                          >
                            <Bell className="w-3 h-3" /> Nhắc nhở
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
