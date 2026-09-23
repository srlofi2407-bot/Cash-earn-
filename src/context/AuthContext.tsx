import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SafeUser, AdminUser } from '../types';
import { api, authStorage } from '../api/client';

export function formatBDT(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳0.00';
  return `৳${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  // User auth
  user: SafeUser | null;
  isUserLoading: boolean;
  userLogin: (username: string, password: string) => Promise<void>;
  userRegister: (payload: { username: string; password: string; email?: string; phone?: string; referralCode?: string }) => Promise<void>;
  userQuickStart: () => Promise<void>;
  userLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Admin auth
  admin: AdminUser | null;
  isAdminLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<void>;
  adminLogout: () => Promise<void>;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load User profile on mount if token exists
  const refreshUser = async () => {
    const token = authStorage.getUserToken();
    if (!token) {
      setUser(null);
      setIsUserLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.warn('User session invalid, cleared', e);
      authStorage.clearUserToken();
      setUser(null);
    } finally {
      setIsUserLoading(false);
    }
  };

  // Load Admin profile on mount if token exists
  const refreshAdmin = async () => {
    const token = authStorage.getAdminToken();
    if (!token) {
      setAdmin(null);
      setIsAdminLoading(false);
      return;
    }
    try {
      const res = await api.getAdminMe();
      setAdmin(res.admin);
    } catch (e) {
      console.warn('Admin session invalid, cleared', e);
      authStorage.clearAdminToken();
      setAdmin(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    refreshAdmin();
  }, []);

  const userLogin = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    authStorage.setUserToken(res.token);
    setUser(res.user);
    addToast(`Welcome back, @${res.user.username}!`, 'success');
  };

  const userRegister = async (payload: { username: string; password: string; email?: string; phone?: string; referralCode?: string }) => {
    const res = await api.register(payload);
    authStorage.setUserToken(res.token);
    setUser(res.user);
    addToast(`Account created! You received ৳10.00 welcome bonus.`, 'success');
  };

  const userQuickStart = async () => {
    const res = await api.quickStart();
    authStorage.setUserToken(res.token);
    setUser(res.user);
    addToast(`Instant account created as @${res.user.username}!`, 'success');
  };

  const userLogout = async () => {
    try {
      await api.logoutUser();
    } catch {
      // ignore
    }
    authStorage.clearUserToken();
    setUser(null);
    addToast('You have been logged out.', 'info');
  };

  const adminLogin = async (username: string, password: string) => {
    const res = await api.adminLogin({ username, password });
    authStorage.setAdminToken(res.token);
    setAdmin(res.admin);
    addToast(`Admin verification successful. Welcome @${res.admin.username}`, 'success');
  };

  const adminLogout = async () => {
    try {
      await api.adminLogout();
    } catch {
      // ignore
    }
    authStorage.clearAdminToken();
    setAdmin(null);
    addToast('Admin logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isUserLoading,
        userLogin,
        userRegister,
        userQuickStart,
        userLogout,
        refreshUser,
        admin,
        isAdminLoading,
        adminLogin,
        adminLogout,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/40'
                : 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-slate-950/40'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-70 hover:opacity-100 px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
