import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserLayout } from './components/user/UserLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { ShieldCheck, Command } from 'lucide-react';

type AppRoute = 'user' | 'admin-login' | 'admin-dashboard';

export function navigateTo(targetPath: string) {
  try {
    window.history.pushState(null, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch {
    window.location.hash = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
  }
}

function AppContent() {
  const { admin, isAdminLoading, adminLogout, addToast } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('user');
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);

  // Sync route based on URL path and hash
  const resolveRoute = useCallback((): AppRoute => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // Check Admin Login route
    if (
      path === '/admin/login' ||
      hash === '#admin/login' ||
      hash === '#/admin/login' ||
      window.location.search.includes('route=admin-login')
    ) {
      return 'admin-login';
    }

    // Check Admin Dashboard route (and legacy #admin / /admin aliases)
    if (
      path === '/admin/dashboard' ||
      path === '/admin' ||
      hash === '#admin/dashboard' ||
      hash === '#/admin/dashboard' ||
      hash === '#admin' ||
      hash === '#/admin' ||
      window.location.search.includes('route=admin-dashboard') ||
      window.location.search.includes('view=admin')
    ) {
      return 'admin-dashboard';
    }

    return 'user';
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const route = resolveRoute();
      setCurrentRoute(route);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Global developer shortcut: Ctrl+Shift+A (or Cmd+Shift+A) to access /admin/login
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateTo('/admin/login');
        addToast('Developer shortcut: Navigated to /admin/login', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resolveRoute, addToast]);

  // Route security & redirection logic
  useEffect(() => {
    if (isAdminLoading) return;

    // If trying to access /admin/dashboard while not logged in
    if (currentRoute === 'admin-dashboard' && !admin) {
      setAccessDeniedNotice('Access Denied: You must authenticate with authorized admin credentials to access /admin/dashboard.');
      navigateTo('/admin/login');
      return;
    }

    // If on /admin/login while already logged in as admin
    if (currentRoute === 'admin-login' && admin) {
      setAccessDeniedNotice(null);
      navigateTo('/admin/dashboard');
      return;
    }

    // Clear notice once on normal routes
    if (currentRoute === 'user') {
      setAccessDeniedNotice(null);
    }
  }, [currentRoute, admin, isAdminLoading]);

  // Navigations
  const handleGoToUserApp = () => {
    setAccessDeniedNotice(null);
    navigateTo('/');
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    navigateTo('/admin/login');
  };

  const handleLoginSuccess = () => {
    setAccessDeniedNotice(null);
    navigateTo('/admin/dashboard');
  };

  // Loading state for admin verification
  if ((currentRoute === 'admin-dashboard' || currentRoute === 'admin-login') && isAdminLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-mono gap-3">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Verifying administrative authorization...</span>
      </div>
    );
  }

  // Admin Login View (/admin/login)
  if (currentRoute === 'admin-login') {
    return (
      <AdminLogin
        onBackToUserApp={handleGoToUserApp}
        onLoginSuccess={handleLoginSuccess}
        accessDeniedReason={accessDeniedNotice}
      />
    );
  }

  // Admin Dashboard View (/admin/dashboard)
  if (currentRoute === 'admin-dashboard') {
    if (!admin) {
      // Fallback while redirect takes place
      return (
        <AdminLogin
          onBackToUserApp={handleGoToUserApp}
          onLoginSuccess={handleLoginSuccess}
          accessDeniedReason="Access Denied: Admin authorization required."
        />
      );
    }

    return (
      <AdminLayout
        onBackToUserApp={handleGoToUserApp}
        onLogout={handleAdminLogout}
      />
    );
  }

  // Standard Public User Application
  return (
    <>
      <UserLayout />
      {/* Developer-only access widget: only rendered in development environment */}
      {import.meta.env.DEV && (
        <aside
          aria-label="Developer Navigation"
          className="fixed bottom-20 right-4 z-50 pointer-events-auto"
        >
          <button
            onClick={() => navigateTo('/admin/login')}
            title="Dev Shortcut: Go to /admin/login (or press Ctrl+Shift+A)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/40 text-[11px] font-mono shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dev: /admin/login</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
              <Command className="w-2.5 h-2.5" />
              <span>Shift+A</span>
            </span>
          </button>
        </aside>
      )}
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
