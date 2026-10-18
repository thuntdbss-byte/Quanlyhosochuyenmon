import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  School,
  Bell,
  Search,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  UserCheck,
  Menu,
  HardDrive,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentRole,
    setRole,
    currentUser,
    selectedWeek,
    setSelectedWeek,
    searchQuery,
    setSearchQuery,
    academicYear,
    setAcademicYear,
    requests,
    giaoAnList,
    baoGiangList,
    hoSoMatrix,
    resetAllData,
    setActiveTab,
    openGoogleSync
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingRequests = requests.filter(r => r.status === 'CHO_DUYET');
  const pendingGiaoAn = giaoAnList.filter(g => g.status === 'CHO_DUYET');
  const pendingBaoGiang = baoGiangList.filter(b => b.status === 'CHO_DUYET');
  const warningHoSo = hoSoMatrix.filter(h => h.overallStatus === 'CANH_BAO');

  const totalNotifications =
    pendingRequests.length + pendingGiaoAn.length + pendingBaoGiang.length + warningHoSo.length;

  const roles: { role: UserRole; label: string; desc: string; icon: string }[] = [
    {
      role: 'BGH',
      label: 'Ban Giám Hiệu',
      desc: 'TS. Lê Lâm (Q. Hiệu trưởng) - Quản trị toàn trường, phê duyệt kế hoạch, báo cáo',
      icon: '🏛️'
    },
    {
      role: 'TO_TRUONG',
      label: 'Tổ Trưởng Chuyên Môn',
      desc: 'Cô Nguyễn Thị Thu (Tổ Toán - Tin) - Duyệt báo giảng, giáo án, dạy thay tổ',
      icon: '📋'
    },
    {
      role: 'GIAO_VIEN',
      label: 'Giáo Viên Bộ Môn',
      desc: 'Thầy Lê Văn Hải (Tổ Toán - Tin) - Nộp giáo án, báo giảng, đề nghị đổi giờ',
      icon: '👨‍🏫'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-700 to-blue-800 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <School className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold tracking-wider text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN
              </span>
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all text-xs shadow-2xs"
                title="Tự nhập năm học theo từng năm"
              >
                <span className="text-slate-500 font-medium whitespace-nowrap">Năm học:</span>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  placeholder="2026 - 2027"
                  aria-label="Năm học"
                  className="w-24 font-bold text-indigo-900 bg-transparent border-none outline-hidden p-0 text-xs focus:ring-0 placeholder:text-slate-400"
                />
                <span className="text-slate-400 text-[11px] whitespace-nowrap font-normal">(28 tuần)</span>
              </div>
            </div>
            <h1 className="text-base lg:text-lg font-bold text-slate-900 leading-tight truncate">
              Hồ Sơ Chuyên Môn Nhà Trường
            </h1>
          </div>
        </div>

        {/* Center: Search & Week Selector */}
        <div className="flex items-center gap-2 lg:gap-3 flex-1 max-w-xl justify-end md:justify-center">
          {/* Week picker */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline font-semibold">Tuần:</span>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent font-bold text-indigo-900 border-none outline-hidden cursor-pointer"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Tuần {w}/28 {w === 20 ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tra cứu giáo viên, môn học, giáo án, hồ sơ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Right: Role Switcher & Notifications */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Google Sheets & Drive Sync Button */}
          <button
            onClick={() => openGoogleSync('sheets')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 transition-all text-xs font-bold shadow-2xs group"
            title="Kết nối và đồng bộ dữ liệu với Google Sheets & Google Drive"
          >
            <div className="flex items-center -space-x-1 shrink-0">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
                S
              </span>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shadow-2xs border border-white">
                D
              </span>
            </div>
            <span className="hidden sm:inline font-bold">Google Sheets & Drive</span>
          </button>

          {/* Role Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 bg-linear-to-r from-indigo-50 to-blue-50 text-indigo-900 hover:bg-indigo-100 transition-all text-xs font-semibold shadow-xs"
              title="Chuyển đổi góc nhìn phân quyền"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <div className="text-left hidden md:block">
                <div className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Vai trò demo</div>
                <div className="font-bold text-slate-800 leading-tight">
                  {currentRole === 'BGH' ? 'Ban Giám Hiệu' : currentRole === 'TO_TRUONG' ? 'Tổ Trưởng CM' : 'Giáo Viên'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500 ml-0.5" />
            </button>

            {/* Role dropdown modal */}
            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Chọn vai trò trải nghiệm
                    </p>
                    <p className="text-[11px] text-slate-500">Mỗi vai trò có thẩm quyền và nghiệp vụ chuyên môn riêng</p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {roles.map(r => (
                      <button
                        key={r.role}
                        onClick={() => {
                          setRole(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                          currentRole === r.role
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xl">{r.icon}</span>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            {r.label}
                            {currentRole === r.role && (
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Thông báo công việc cần xử lý"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notification popover */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Công việc chuyên môn cần xử lý ({totalNotifications})
                    </h4>
                    <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer" onClick={() => setShowNotifications(false)}>
                      Đóng
                    </span>
                  </div>

                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto text-xs">
                    {pendingRequests.length > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('nghi_day_day_thay');
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 hover:bg-amber-100/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          {pendingRequests.length} Đơn nghỉ dạy / đổi giờ chờ duyệt
                        </div>
                        <p className="text-[11px] text-amber-700 mt-1">
                          Có giáo viên xin nghỉ dạy do công tác hoặc đổi lịch tuần 24 cần phân công dạy thay.
                        </p>
                      </div>
                    )}

                    {pendingGiaoAn.length > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('giao_an');
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 hover:bg-blue-100/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          {pendingGiaoAn.length} Kế hoạch bài dạy (Giáo án) chờ duyệt
                        </div>
                        <p className="text-[11px] text-blue-700 mt-1">
                          Giáo án môn Ngữ văn và Tin học đã nộp theo Công văn 5512 đang chờ ký duyệt.
                        </p>
                      </div>
                    )}

                    {warningHoSo.length > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('ho_so_matrix');
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 hover:bg-rose-100/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-rose-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {warningHoSo.length} Giáo viên chậm tiến độ hồ sơ chuyên môn
                        </div>
                        <p className="text-[11px] text-rose-700 mt-1">
                          Cần gửi thông báo nhắc nhở nộp bổ sung giáo án và sổ báo giảng đúng hạn.
                        </p>
                      </div>
                    )}

                    {totalNotifications === 0 && (
                      <div className="py-6 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                        <p>Tất cả hồ sơ và sổ sách chuyên môn đã được xử lý xong!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetAllData}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Khôi phục dữ liệu mẫu ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* User Profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-indigo-300"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{currentUser.position}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
