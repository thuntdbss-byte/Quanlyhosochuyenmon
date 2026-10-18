import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  FileSpreadsheet,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  ArrowUpRight,
  Send,
  Calendar,
  Sparkles,
  HardDrive,
  ExternalLink
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    stats,
    selectedWeek,
    departments,
    giaoAnList,
    baoGiangList,
    requests,
    hoSoMatrix,
    neNepList,
    setActiveTab,
    currentRole,
    connectedSheet,
    openGoogleSync
  } = useApp();

  const pendingRequests = requests.filter(r => r.status === 'CHO_DUYET');
  const pendingGiaoAn = giaoAnList.filter(g => g.status === 'CHO_DUYET');
  const pendingBaoGiang = baoGiangList.filter(b => b.status === 'CHO_DUYET');

  return (
    <div className="space-y-6">
      {/* Top Banner with greeting and quick role context */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-5 lg:p-6 shadow-md shadow-indigo-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs text-indigo-200 border border-white/10 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Hệ thống chuyển đổi số hồ sơ chuyên môn nhà trường</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight">
              Trung tâm Điều hành Chuyên môn Nhà trường
            </h2>
            <p className="text-xs lg:text-sm text-indigo-100/90 mt-1 max-w-2xl">
              Theo dõi toàn diện: Tổ chuyên môn, phân công giảng dạy, sổ báo giảng, giáo án CV 5512,
              nề nếp tiết dạy, biến động lịch trình và ma trận hồ sơ theo tuần.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('bao_giang')}
              className="px-3.5 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              Xem Sổ báo giảng Tuần {selectedWeek}
            </button>
            <button
              onClick={() => setActiveTab('giao_an')}
              className="px-3.5 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 border border-indigo-400/30 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4 text-indigo-200" />
              Kiểm duyệt Giáo án
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets & Drive Live Connection Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            connectedSheet ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-slate-900">
                {connectedSheet
                  ? `Google Sheet kết nối: ${connectedSheet.name}`
                  : 'Kết nối Dữ liệu với Google Sheet trong Google Drive'}
              </span>
              {connectedSheet ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đang đồng bộ 2 chiều
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ThuntDBSS@gmail.com
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {connectedSheet
                ? `Cập nhật lần cuối: ${connectedSheet.lastSynced || 'Hôm nay'}. Dữ liệu được lưu trữ trực tiếp trên Google Drive.`
                : 'Lưu trữ tự động hồ sơ chuyên môn, giáo án KHBD CV 5512 và sổ báo giảng vào Google Drive.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {connectedSheet && (
            <a
              href={connectedSheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              Mở Sheet
            </a>
          )}
          <button
            onClick={() => openGoogleSync('sheets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              connectedSheet
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {connectedSheet ? 'Đồng bộ Dữ liệu' : 'Kết nối Google Drive & Sheets'}
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Giáo án tuần này */}
        <div
          onClick={() => setActiveTab('giao_an')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Giáo án (KH bài dạy)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">{stats.giaoAnSubmittedRate}%</div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Đạt chuẩn 5512
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Chờ thẩm duyệt:</span>
            <span className="font-bold text-amber-600">{pendingGiaoAn.length} giáo án</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.giaoAnSubmittedRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Sổ báo giảng */}
        <div
          onClick={() => setActiveTab('bao_giang')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sổ báo giảng Tuần {selectedWeek}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">{stats.baoGiangApprovedRate}%</div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Đã ký duyệt
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Tiết chờ duyệt:</span>
            <span className="font-bold text-amber-600">{pendingBaoGiang.length} tiết dạy</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.baoGiangApprovedRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Đổi giờ & Dạy thay */}
        <div
          onClick={() => setActiveTab('nghi_day_day_thay')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dạy thay & Đổi giờ
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">{pendingRequests.length}</div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Cần bố trí ngay
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Tiết dạy thay tháng:</span>
            <span className="font-bold text-slate-700">{stats.substitutePeriodsThisMonth} tiết</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>

        {/* Card 4: Nề nếp & Hồ sơ chuyên môn */}
        <div
          onClick={() => setActiveTab('ho_so_matrix')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nề nếp & Hồ sơ sổ sách
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.complianceWarningCount}
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              Chậm muộn
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng hồ sơ kiểm tra:</span>
            <span className="font-bold text-slate-700">{hoSoMatrix.length} giáo viên</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '20%' }} />
          </div>
        </div>
      </div>

      {/* Middle Grid: Pending Approvals (Action Center) & Department Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Center / Pending Review Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Nhiệm vụ chuyên môn cần thẩm duyệt ({pendingRequests.length + pendingGiaoAn.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dành cho Ban Giám Hiệu và Tổ trưởng chuyên môn giải quyết nhanh trong ngày
                </p>
              </div>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
                Ưu tiên cao
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {/* Items */}
              {pendingRequests.map(req => (
                <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        {req.type === 'DAY_THAY' ? 'Dạy thay' : req.type === 'DOI_GIO' ? 'Đổi giờ' : 'Nghỉ dạy'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{req.requestTeacherName}</span>
                      <span className="text-xs text-slate-500">({req.subject} - Lớp {req.className})</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Lý do:</strong> {req.reason}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Ngày: <strong>{req.date}</strong> (Tiết {req.periods.join(', ')})</span>
                      {req.substituteTeacherName && (
                        <span>GV dạy thay: <strong className="text-indigo-600">{req.substituteTeacherName}</strong></span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('nghi_day_day_thay')}
                    className="shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Xem & Duyệt
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {pendingGiaoAn.map(ga => (
                <div key={ga.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        Giáo án CV 5512
                      </span>
                      <span className="text-xs font-bold text-slate-900">{ga.teacherName}</span>
                      <span className="text-xs text-slate-500">({ga.subject} {ga.grade})</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {ga.lessonTitle}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Nộp lúc: {ga.uploadDate}</span>
                      <span>Dung lượng: {ga.fileSize}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('giao_an')}
                    className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Thẩm định
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {pendingRequests.length === 0 && pendingGiaoAn.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs">Hiện tại không có hồ sơ nào đang chờ duyệt</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts for Teacher Actions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Lối tắt tác vụ nhanh
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => setActiveTab('bao_giang')}
                className="p-3 bg-white hover:bg-indigo-50/50 rounded-lg border border-slate-200 text-left transition-all group"
              >
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Kê khai Báo giảng</div>
                <div className="text-[11px] text-slate-500">Đăng ký tiết dạy tuần mới</div>
              </button>

              <button
                onClick={() => setActiveTab('giao_an')}
                className="p-3 bg-white hover:bg-blue-50/50 rounded-lg border border-slate-200 text-left transition-all group"
              >
                <BookOpen className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Nộp Giáo án</div>
                <div className="text-[11px] text-slate-500">Tải lên file Word/PDF CV5512</div>
              </button>

              <button
                onClick={() => setActiveTab('nghi_day_day_thay')}
                className="p-3 bg-white hover:bg-amber-50/50 rounded-lg border border-slate-200 text-left transition-all group"
              >
                <ArrowLeftRight className="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Xin đổi giờ / Dạy thay</div>
                <div className="text-[11px] text-slate-500">Tạo đơn gửi Tổ & BGH</div>
              </button>

              <button
                onClick={() => setActiveTab('ne_nep_du_gio')}
                className="p-3 bg-white hover:bg-purple-50/50 rounded-lg border border-slate-200 text-left transition-all group"
              >
                <Award className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Ghi sổ dự giờ</div>
                <div className="text-[11px] text-slate-500">Chấm điểm tiết dạy 20đ</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Department Progress & Recent Inspections */}
        <div className="space-y-4">
          {/* Department status breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Tổ Chuyên Môn ({departments.length})
              </h3>
              <button
                onClick={() => setActiveTab('departments')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Chi tiết
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {departments.map((dept, idx) => {
                const completion = 100 - idx * 4;
                return (
                  <div key={dept.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{dept.name}</span>
                      <span className="font-bold text-slate-600">{completion}% nộp hồ sơ</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          completion >= 95
                            ? 'bg-emerald-500'
                            : completion >= 90
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Tổ trưởng: {dept.leaderName}</span>
                      <span>{dept.memberCount} giáo viên</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Teaching Inspection / Du Gio */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Dự giờ & Kiểm tra gần nhất
              </h3>
              <button
                onClick={() => setActiveTab('ne_nep_du_gio')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {neNepList.slice(0, 3).map(rec => (
                <div key={rec.id} className="py-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rec.teacherName}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rec.ranking === 'XUAT_SAC' ? 'Xuất sắc' : 'Tốt'} ({rec.totalScore}/20đ)
                    </span>
                  </div>
                  <div className="text-slate-600 truncate">{rec.lessonTitle}</div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Người dự: {rec.inspectorName}</span>
                    <span>{rec.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
