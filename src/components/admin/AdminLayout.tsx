import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminTasksTab } from './AdminTasksTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminWithdrawalsTab } from './AdminWithdrawalsTab';
import { AdminReferralsTab } from './AdminReferralsTab';
import { AdminVideoAdsTab } from './AdminVideoAdsTab';
import { AdminSpinTab } from './AdminSpinTab';
import { AdminAdsTab } from './AdminAdsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminLogsTab } from './AdminLogsTab';
import type { AdminStats } from '../../types';
import { api } from '../../api/client';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Wallet,
  Gift,
  PlayCircle,
  Disc3,
  Megaphone,
  Settings,
  FileText,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToUserApp: () => void;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToUserApp, onLogout }) => {
  const { admin, adminLogout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'tasks' | 'users' | 'withdrawals' | 'referrals' | 'video_ads' | 'spin' | 'ads' | 'settings' | 'logs'
  >('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {});
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Timer Tasks', icon: CheckSquare },
    { id: 'users', label: 'Users & Balances', icon: Users },
    { id: 'withdrawals', label: 'Withdrawal Queue', icon: Wallet, badge: stats?.pendingWithdrawalsCount },
    { id: 'referrals', label: 'Referral Settings', icon: Gift },
    { id: 'video_ads', label: 'Video Ads', icon: PlayCircle },
    { id: 'spin', label: 'Spin & Win', icon: Disc3 },
    { id: 'ads', label: 'Advertisements', icon: Megaphone },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-sm tracking-tight text-white block">
                  TakaAdmin
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  @{admin?.username || 'admin'} · SuperAdmin
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] font-mono">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={onBackToUserApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Public User App</span>
          </button>

          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                adminLogout();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-base text-white capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Currency: ৳ BDT</span>
            </div>

            <button
              onClick={onBackToUserApp}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              User Mode
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab stats={stats} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'tasks' && <AdminTasksTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'withdrawals' && <AdminWithdrawalsTab />}
          {activeTab === 'referrals' && <AdminReferralsTab />}
          {activeTab === 'video_ads' && <AdminVideoAdsTab />}
          {activeTab === 'spin' && <AdminSpinTab />}
          {activeTab === 'ads' && <AdminAdsTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
          {activeTab === 'logs' && <AdminLogsTab />}
        </main>
      </div>
    </div>
  );
};
