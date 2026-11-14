import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TopBar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Hamburger + Search Input */}
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
        {/* Hamburger Menu on mobile & tablet */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Responsive Search Input */}
        <div className="relative w-full max-w-[200px] sm:max-w-xs md:max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task, code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right controls: Language, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Language Pill */}
        <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 shadow-xs font-semibold">
            EN
          </span>
          <span className="px-2 py-0.5 text-slate-500 hover:text-slate-800 cursor-pointer">
            हिंदी
          </span>
        </div>

        {/* Notifications Button */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                {user?.role || 'Staff'}
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
