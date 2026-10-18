import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Views
import { DashboardView } from './components/views/DashboardView';
import { DepartmentsView } from './components/views/DepartmentsView';
import { TeachingAssignmentView } from './components/views/TeachingAssignmentView';
import { BaoGiangView } from './components/views/BaoGiangView';
import { KeHoachView } from './components/views/KeHoachView';
import { GiaoAnView } from './components/views/GiaoAnView';
import { NghiDayDayThayView } from './components/views/NghiDayDayThayView';
import { NeNepDuGioView } from './components/views/NeNepDuGioView';
import { HoSoMatrixView } from './components/views/HoSoMatrixView';
import { ReportsView } from './components/views/ReportsView';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, toasts, removeToast, isGoogleModalOpen, closeGoogleSync, googleModalTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'departments':
        return <DepartmentsView />;
      case 'teaching_assignments':
        return <TeachingAssignmentView />;
      case 'bao_giang':
        return <BaoGiangView />;
      case 'ke_hoach':
        return <KeHoachView />;
      case 'giao_an':
        return <GiaoAnView />;
      case 'nghi_day_day_thay':
        return <NghiDayDayThayView />;
      case 'ne_nep_du_gio':
        return <NeNepDuGioView />;
      case 'ho_so_matrix':
        return <HoSoMatrixView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex-1 flex w-full max-w-[1720px] mx-auto">
        {/* Sidebar */}
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Google Workspace Sync & Storage Modal */}
      <GoogleSyncModal
        isOpen={isGoogleModalOpen}
        onClose={closeGoogleSync}
        defaultTab={googleModalTab}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl shadow-lg border backdrop-blur-md transition-all text-xs font-medium animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900/90 text-white border-amber-700'
                : 'bg-indigo-900/90 text-white border-indigo-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}

            <div className="flex-1 leading-snug">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
