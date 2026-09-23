import React, { useState, useEffect } from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { Task, Transaction, Advertisement } from '../../types';
import { api } from '../../api/client';
import { HomeTab } from './HomeTab';
import { TasksTab } from './TasksTab';
import { EarnTab } from './EarnTab';
import { WalletTab } from './WalletTab';
import { ProfileTab } from './ProfileTab';
import { AuthModal } from './AuthModal';
import {
  Home,
  CheckSquare,
  Sparkles,
  Wallet,
  User as UserIcon,
  Shield,
  Coins
} from 'lucide-react';

export const UserLayout: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'earn' | 'wallet' | 'profile'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeAds, setActiveAds] = useState<Advertisement[]>([]);

  const loadData = async () => {
    try {
      const adsRes = await api.getActiveAds();
      setActiveAds(adsRes.ads);
    } catch {
      // ignore
    }

    if (user) {
      try {
        const [tasksRes, txRes] = await Promise.all([
          api.getTasks(),
          api.getTransactions(),
        ]);
        setTasks(tasksRes.tasks);
        setTransactions(txRes.transactions);
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold font-display text-lg shadow-md shadow-emerald-500/20">
            ৳
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-white block">
              TakaRewards
            </span>
            <div className="text-[10px] text-slate-400 font-medium">
              <span>Bangladesh</span>
              <span className="mx-1">·</span>
              <span>BDT Earning</span>
            </div>
          </div>
        </div>

        {/* Action Zone: Balance Badge or Sign In */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {formatBDT(user.balance)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAuth('login')}
              className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          )}

          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="Profile"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {activeTab === 'home' && (
          <HomeTab
            onNavigateTab={setActiveTab}
            tasks={tasks}
            transactions={transactions}
            activeAds={activeAds}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            onRefreshTasks={loadData}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {activeTab === 'earn' && (
          <EarnTab onOpenAuth={() => handleOpenAuth('login')} />
        )}

        {activeTab === 'wallet' && (
          <WalletTab onOpenAuth={() => handleOpenAuth('login')} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab onOpenAuth={() => handleOpenAuth('login')} />
        )}

        {/* Subtle Platform Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 TakaRewards BD · Bangladesh Micro-Task Platform</p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600">
            <span>Server Time (BST UTC+6)</span>
            <span>·</span>
            <span>256-bit SSL</span>
            <span>·</span>
            <span
              onClick={() => {
                if (import.meta.env.DEV) {
                  try {
                    window.history.pushState(null, '', '/admin/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  } catch {
                    window.location.hash = '#admin/login';
                  }
                }
              }}
              className={import.meta.env.DEV ? 'cursor-pointer hover:text-slate-400 font-mono' : 'font-mono'}
              title={import.meta.env.DEV ? 'Dev: Jump to /admin/login' : undefined}
            >
              v1.0.4
            </span>
          </div>
        </footer>
      </main>

      {/* Mobile-First Fixed Bottom Navigation Bar (Tab Anchor) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'home' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'tasks' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('earn')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'earn' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Earn</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'wallet' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};
