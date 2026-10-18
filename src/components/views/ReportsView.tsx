import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportTeachersToCSV } from '../../utils/exportTeachers';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Building,
  FileText
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    teachers,
    departments,
    assignments,
    baoGiangList,
    giaoAnList,
    neNepList,
    requests,
    hoSoMatrix,
    addToast
  } = useApp();

  const [reportSemester, setReportSemester] = useState('Học kỳ II (Năm học 2026-2027)');
  const [selectedDeptReport, setSelectedDeptReport] = useState('ALL');

  // Summary Metrics
  const totalPeriodsTaught = baoGiangList.filter(b => b.status === 'DA_DUYET').length;
  const totalLessonPlans = giaoAnList.length;
  const cv5512Compliant = giaoAnList.filter(g => g.has4Steps).length;
  const compliantPercent = Math.round((cv5512Compliant / (totalLessonPlans || 1)) * 100);

  const totalSubstitutePeriods = requests
    .filter(r => r.type === 'DAY_THAY' && r.status === 'DA_DUYET')
    .reduce((sum, r) => sum + r.periods.length, 0);

  const totalInspections = neNepList.length;
  const excellentInspections = neNepList.filter(n => n.ranking === 'XUAT_SAC').length;

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Giáo viên', 'Tổ chuyên môn', 'Số tiết dạy', 'Số giáo án đã duyệt', 'Dự giờ', 'Xếp loại'];
    const rows = hoSoMatrix.map(h => [
      `"${h.teacherName}"`,
      `"${h.departmentName}"`,
      h.baoGiangRate + '%',
      h.giaoAnCount.submitted,
      h.duGioCount.actual,
      `"${h.overallStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Chuyen_Mon_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Đã xuất thành công tệp dữ liệu CSV báo cáo chuyên môn', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Báo Cáo Tổng Hợp Hồ Sơ Chuyên Môn</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              Mẫu biểu chuẩn Sở GD&ĐT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu giảng dạy, thẩm duyệt giáo án CV 5512, thanh toán dạy thay và thống kê dự giờ định kỳ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              exportTeachersToCSV(teachers, departments, assignments, selectedDeptReport);
              addToast('Đã tải xuống file danh sách giáo viên thành công!', 'success');
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            Tải Danh Sách Giáo Viên (Excel)
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất Báo Cáo Chuyên Môn
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            In Báo Cáo
          </button>
        </div>
      </div>

      {/* Official Vietnamese School Header Banner (Formatted for Print) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between text-center sm:text-left gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="font-semibold text-xs text-slate-600 uppercase">BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
              TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Số: 48/BC-CM-DBSS</div>
          </div>

          <div className="text-center">
            <div className="font-extrabold text-xs text-slate-900 uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-xs font-bold text-slate-700 underline decoration-1 underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="text-[11px] text-slate-500 italic mt-1">
              Sầm Sơn, ngày 18 tháng 03 năm 2026
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase">
            BÁO CÁO KẾT QUẢ QUẢN LÝ HỒ SƠ CHUYÊN MÔN & HOẠT ĐỘNG DẠY HỌC
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Kỳ báo cáo: {reportSemester}
          </p>
        </div>

        {/* 4 Summary Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="text-[10px] font-bold uppercase text-indigo-700">Tiết dạy đã ký duyệt</div>
            <div className="text-xl font-extrabold text-indigo-950 mt-1">{totalPeriodsTaught} tiết</div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Tiến độ tuần 26 hoàn thành 100%</div>
          </div>

          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="text-[10px] font-bold uppercase text-emerald-700">Giáo án chuẩn CV 5512</div>
            <div className="text-xl font-extrabold text-emerald-950 mt-1">{compliantPercent}%</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              {cv5512Compliant}/{totalLessonPlans} KHBD đủ 4 chuỗi HĐ
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="text-[10px] font-bold uppercase text-blue-700">Tiết dạy thay thừa giờ</div>
            <div className="text-xl font-extrabold text-blue-950 mt-1">{totalSubstitutePeriods} tiết</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Bảo đảm 100% không trống giờ</div>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="text-[10px] font-bold uppercase text-purple-700">Tiết dự giờ xuất sắc</div>
            <div className="text-xl font-extrabold text-purple-950 mt-1">
              {excellentInspections}/{totalInspections}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5">Điểm trung bình: 18.2/20đ</div>
          </div>
        </div>

        {/* Section 1: Department Level Summary */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-600" />
            I. TỔNG HỢP THEO TỔ CHUYÊN MÔN
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Tổ Chuyên Môn</th>
                  <th className="p-2.5">Tổ trưởng</th>
                  <th className="p-2.5 text-center">Số GV</th>
                  <th className="p-2.5 text-center">Tiết/Tuần</th>
                  <th className="p-2.5 text-center">Tỷ lệ nộp sổ báo giảng</th>
                  <th className="p-2.5 text-center">Giáo án đã duyệt</th>
                  <th className="p-2.5 text-center">Đánh giá chung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                    <td className="p-2.5 text-slate-600">{d.leaderName}</td>
                    <td className="p-2.5 text-center font-semibold">{d.memberCount}</td>
                    <td className="p-2.5 text-center">{d.memberCount * 17} tiết</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">100%</td>
                    <td className="p-2.5 text-center font-medium">
                      {giaoAnList.filter(g => g.departmentId === d.id && g.status === 'DA_DUYET').length} bài
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        Hoàn thành tốt
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Detailed Teacher Matrix */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            II. THỐNG KÊ CHI TIẾT ĐÁNH GIÁ TỪNG GIÁO VIÊN
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">STT</th>
                  <th className="p-2.5">Họ và tên giáo viên</th>
                  <th className="p-2.5">Môn</th>
                  <th className="p-2.5 text-center">Báo giảng</th>
                  <th className="p-2.5 text-center">Giáo án</th>
                  <th className="p-2.5 text-center">Dự giờ</th>
                  <th className="p-2.5 text-center">Dạy thay</th>
                  <th className="p-2.5 text-center">Xếp loại hồ sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hoSoMatrix.map((h, index) => {
                  const teacherSubs = requests.filter(
                    r => r.substituteTeacherId === h.teacherId && r.status === 'DA_DUYET'
                  ).reduce((sum, r) => sum + r.periods.length, 0);

                  return (
                    <tr key={h.teacherId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-slate-400 font-mono">{index + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{h.teacherName}</td>
                      <td className="p-2.5 text-slate-600">{h.subject}</td>
                      <td className="p-2.5 text-center font-medium">{h.baoGiangRate}%</td>
                      <td className="p-2.5 text-center font-medium">
                        {h.giaoAnCount.submitted}/{h.giaoAnCount.required}
                      </td>
                      <td className="p-2.5 text-center font-medium">{h.duGioCount.actual} tiết</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">
                        {teacherSubs > 0 ? `+${teacherSubs} tiết` : '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {h.overallStatus === 'XUAT_SAC' ? (
                          <span className="text-emerald-700">Xuất sắc</span>
                        ) : h.overallStatus === 'CANH_BAO' ? (
                          <span className="text-rose-600">Cần bổ sung</span>
                        ) : (
                          <span className="text-blue-700">Đạt chuẩn</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signatures */}
        <div className="grid grid-cols-2 pt-8 text-center text-xs">
          <div>
            <div className="font-extrabold uppercase text-slate-900">NGƯỜI LẬP BÁO CÁO</div>
            <div className="text-[10px] text-slate-400 italic mb-14">(Ký, ghi rõ họ tên)</div>
            <div className="font-bold text-slate-800">Cô Nguyễn Thị Thu</div>
            <div className="text-[11px] text-slate-500">Tổ trưởng Tổ Toán - Tin</div>
          </div>

          <div>
            <div className="font-extrabold uppercase text-slate-900">HIỆU TRƯỞNG / BAN GIÁM HIỆU</div>
            <div className="text-[10px] text-slate-400 italic mb-14">(Ký tên và đóng dấu)</div>
            <div className="font-bold text-slate-800">TS. Lê Lâm</div>
            <div className="text-[11px] text-slate-500">Q. Hiệu trưởng Nhà trường</div>
          </div>
        </div>
      </div>
    </div>
  );
};
