import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onBackToUserApp?: () => void;
  onLoginSuccess?: () => void;
  accessDeniedReason?: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onBackToUserApp,
  onLoginSuccess,
  accessDeniedReason
}) => {
  const { adminLogin, addToast } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(accessDeniedReason || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(username.trim(), password);
      // Redirection to /admin/dashboard
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        try {
          window.history.pushState(null, '', '/admin/dashboard');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch {
          window.location.hash = '#admin/dashboard';
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid administrator credentials. Access denied.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Return to Public Application */}
      {onBackToUserApp && (
        <button
          onClick={onBackToUserApp}
          className="fixed top-6 left-6 z-20 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl transition-all hover:border-slate-700 shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to User App</span>
        </button>
      )}

      {/* Decorative ambient lights */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white backdrop-blur-xl relative z-10 overflow-hidden">
        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-lg shadow-indigo-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Admin Login
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Dedicated Administrative Portal · Authorized Personnel Only
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
            <span>Route:</span>
            <span className="text-indigo-400 font-semibold">/admin/login</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Authentication Alert</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter administrator username"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="admin-login-button"
            className="w-full min-h-[48px] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500 space-y-1">
          <div>Protected System Area · Server-Side Verification</div>
          <div className="text-[10px] text-slate-600">
            Successful authorization redirects to <span className="text-slate-400 font-mono">/admin/dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
