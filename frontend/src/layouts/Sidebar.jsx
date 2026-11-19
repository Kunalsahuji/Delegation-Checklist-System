import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Users2,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Layers,
  X,
  LogOut,
  ShieldCheck,
  ChevronsUpDown,
  Building2,
  HardHat,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [checklistOpen, setChecklistOpen] = useState(
    location.pathname.startsWith('/checklist')
  );
  const [delegationOpen, setDelegationOpen] = useState(
    location.pathname.startsWith('/delegation')
  );
  const [crmOpen, setCrmOpen] = useState(
    location.pathname.startsWith('/crm') || true
  );
  const [pmsOpen, setPmsOpen] = useState(
    location.pathname.startsWith('/pms') || true
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const navContent = (
    <div className="flex flex-col h-full bg-white overflow-hidden select-none">
      {/* Brand Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">TaskFlow ERP</h1>
            <span className="text-[10px] text-brand-600 font-medium">Operations, Delegation & CRM</span>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0 overscroll-contain">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>

        {/* Global Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Unified Dashboard</span>
        </NavLink>

        {/* Checklist Section */}
        <div className="pt-2">
          <button
            onClick={() => setChecklistOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4 text-brand-600" />
              <span>Checklist</span>
            </div>
            {checklistOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {checklistOpen && (
            <div className="ml-7 pl-2 mt-1 space-y-0.5 border-l border-slate-200">
              <NavLink
                to="/checklist/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/checklist/list"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Checklists
              </NavLink>
              <NavLink
                to="/checklist/report"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Weekly Report
              </NavLink>
            </div>
          )}
        </div>

        {/* Delegation Section */}
        <div className="pt-2">
          <button
            onClick={() => setDelegationOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <ListTodo className="w-4 h-4 text-brand-600" />
              <span>Delegation</span>
            </div>
            {delegationOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {delegationOpen && (
            <div className="ml-7 pl-2 mt-1 space-y-0.5 border-l border-slate-200">
              <NavLink
                to="/delegation/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/delegation/list"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Delegation List
              </NavLink>
              <NavLink
                to="/delegation/report"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Weekly Report
              </NavLink>
            </div>
          )}
        </div>

        {/* CRM Section */}
        <div className="pt-2">
          <button
            onClick={() => setCrmOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>CRM</span>
            </div>
            {crmOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {crmOpen && (
            <div className="ml-7 pl-2 mt-1 space-y-0.5 border-l border-slate-200">
              <NavLink
                to="/crm/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/crm/enquiries"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Enquiries
              </NavLink>
              <NavLink
                to="/crm/lead-assignments"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Lead Assignment
              </NavLink>
              <NavLink
                to="/crm/leads"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Leads
              </NavLink>
              <NavLink
                to="/crm/visits"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Visit
              </NavLink>
              <NavLink
                to="/crm/followups"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Follow-ups
              </NavLink>
              <NavLink
                to="/crm/special-followups"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Special Follow-Ups
              </NavLink>
              <NavLink
                to="/crm/calendar"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Calendar
              </NavLink>
              <NavLink
                to="/crm/bulk-message"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Bulk Message
              </NavLink>
              <NavLink
                to="/crm/meta-leads"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Meta Leads
              </NavLink>
              <NavLink
                to="/crm/projects"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Projects
              </NavLink>
              <NavLink
                to="/crm/brokers"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Brokers
              </NavLink>
              <NavLink
                to="/crm/network"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Network
              </NavLink>
            </div>
          )}
        </div>

        {/* PMS (Project Management System) Section */}
        <div className="pt-2">
          <button
            onClick={() => setPmsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <HardHat className="w-4 h-4 text-brand-600" />
              <span>PMS (Projects)</span>
            </div>
            {pmsOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {pmsOpen && (
            <div className="ml-7 pl-2 mt-1 space-y-0.5 border-l border-slate-200">
              <NavLink
                to="/pms/projects"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Project Catalog (13 Stages)
              </NavLink>
              <NavLink
                to="/pms/plots"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Land Acquisition (Plots)
              </NavLink>
              <NavLink
                to="/pms/legal-cases"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Legal Verification (Stage 2)
              </NavLink>
              <NavLink
                to="/pms/land-purchases"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                Land Purchase (Stage 3)
              </NavLink>
            </div>
          )}
        </div>

        {/* Master Data Section (Admin) */}
        {user?.role === 'Administrator' && (
          <div className="pt-4">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </div>
            <NavLink
              to="/master/departments"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <FolderGit2 className="w-4 h-4 text-slate-500" />
              <span>Departments</span>
            </NavLink>
            <NavLink
              to="/master/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Users2 className="w-4 h-4 text-slate-500" />
              <span>Employees & Roles</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer User Info - Functional with popup menu */}
      <div className="relative shrink-0 border-t border-slate-200 bg-slate-50/70" ref={profileRef}>
        {profileOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || '—'}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
                <ShieldCheck className="w-3 h-3 text-brand-600" />
                <span>{user?.role || 'Guest'}</span>
              </span>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-100/80 transition-colors rounded-none focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-200/80">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TF'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.role || 'Guest'}</p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 shrink-0 h-screen sticky top-0 bg-white z-20 flex-col overflow-hidden">
        {navContent}
      </aside>

      {/* Mobile & Tablet Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
