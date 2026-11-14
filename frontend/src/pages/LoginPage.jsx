import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        {/* Brand Banner */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              TaskFlow ERP
            </h1>
            <p className="text-xs text-slate-500 font-medium">Delegation & Checklist Portal</p>
          </div>
        </div>

        <h2 className="text-base font-semibold text-slate-900 mb-1">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mb-6">
          Enter your organization credentials to manage checklists and delegated tasks.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label className="field-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Quick Switcher (Demo / Seed Accounts)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@company.com', 'admin123')}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 block truncate">Administrator</span>
                <span className="text-[10px] text-slate-500 block">admin@company.com</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('pm@company.com', 'manager123')}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors text-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 block truncate">Project Manager</span>
                <span className="text-[10px] text-slate-500 block">pm@company.com</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('engineer@company.com', 'engineer123')}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors text-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 block truncate">Site Engineer</span>
                <span className="text-[10px] text-slate-500 block">engineer@company.com</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('accounts@company.com', 'accounts123')}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors text-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-800 block truncate">Accounts Demo</span>
                <span className="text-[10px] text-slate-500 block">accounts@company.com</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
