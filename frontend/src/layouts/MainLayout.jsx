import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import PageLoader from '../components/PageLoader';

export const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Route change transition micro-loader */}
      <PageLoader />

      {/* Sidebar with mobile drawer support */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar onToggleSidebar={() => setMobileSidebarOpen((v) => !v)} />
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
