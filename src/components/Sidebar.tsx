import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  BookOpen,
  ArrowLeftRight,
  Award,
  CheckSquare,
  Printer,
  ChevronRight,
  ExternalLink,
  HardDrive
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  badge?: number;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose
}) => {
  const {
    activeTab,
    setActiveTab,
    requests,
    giaoAnList,
    baoGiangList,
    hoSoMatrix,
    currentRole,
    openGoogleSync
  } = useApp();

  const pendingRequests = requests.filter(r => r.status === 'CHO_DUYET').length;
  const pendingGiaoAn = giaoAnList.filter(g => g.status === 'CHO_DUYET').length;
  const pendingBaoGiang = baoGiangList.filter(b => b.status === 'CHO_DUYET').length;
  const warningCount = hoSoMatrix.filter(h => h.overallStatus === 'CANH_BAO').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan Chuyên môn',
      icon: LayoutDashboard
    },
    {
      id: 'departments',
      label: 'Tổ chuyên môn',
      icon: Users
    },
    {
      id: 'teaching_assignments',
      label: 'Phân công chuyên môn',
      icon: CalendarDays
    },
    {
      id: 'bao_giang',
      label: 'Sổ báo giảng & Lịch trình',
      icon: FileSpreadsheet,
      badge: pendingBaoGiang > 0 ? pendingBaoGiang : undefined,
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'ke_hoach',
      label: 'Kế hoạch giáo dục',
      icon: FileText
    },
    {
      id: 'giao_an',
      label: 'Giáo án (KH bài dạy)',
      icon: BookOpen,
      badge: pendingGiaoAn > 0 ? pendingGiaoAn : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'nghi_day_day_thay',
      label: 'Dạy thay, đổi giờ & nghỉ',
      icon: ArrowLeftRight,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'ne_nep_du_gio',
      label: 'Nề nếp & Dự giờ GV',
      icon: Award
    },
    {
      id: 'ho_so_matrix',
      label: 'Tình trạng hồ sơ sổ sách',
      icon: CheckSquare,
      badge: warningCount > 0 ? warningCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700'
    },
    {
      id: 'reports',
      label: 'Báo cáo tổng hợp',
      icon: Printer
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col z-20 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Role highlight box */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quyền hạn hiện tại
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {currentRole === 'BGH' ? 'Ban Giám Hiệu' : currentRole === 'TO_TRUONG' ? 'Tổ Trưởng CM' : 'Giáo Viên'}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {currentRole === 'BGH'
              ? 'Toàn quyền kiểm duyệt, thanh tra & xem báo cáo trường'
              : currentRole === 'TO_TRUONG'
              ? 'Quản lý thành viên tổ, thẩm định giáo án & báo giảng'
              : 'Thực hiện giảng dạy, cập nhật hồ sơ cá nhân đúng hạn'}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Danh mục nghiệp vụ
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Google Workspace Cloud Sync Card */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <button
            onClick={() => {
              openGoogleSync('sheets');
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-linear-to-r from-emerald-50/90 to-teal-50/90 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 transition-all text-left shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                  Google Sheets & Drive
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Đồng bộ & sao lưu trực tuyến
                </div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span>Tiêu chuẩn hồ sơ:</span>
            <span className="font-bold text-indigo-700">CV 5512/BGDĐT</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Phiên bản:</span>
            <span>v2.6 Chuyên môn số</span>
          </div>
        </div>
      </aside>
    </>
  );
};
