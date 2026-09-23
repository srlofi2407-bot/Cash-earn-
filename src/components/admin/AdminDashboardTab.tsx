import React from 'react';
import type { AdminStats } from '../../types';
import { formatBDT } from '../../context/AuthContext';
import {
  Users,
  CheckCircle2,
  Wallet,
  Clock,
  Coins,
  PlayCircle,
  Disc3,
  TrendingUp,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

interface AdminDashboardTabProps {
  stats: AdminStats | null;
  onNavigateTab: (tab: any) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ stats, onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Platform Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, reward pool distributions, user activity, and withdrawal processing.
          </p>
        </div>
        {stats && stats.pendingWithdrawalsCount > 0 && (
          <button
            onClick={() => onNavigateTab('withdrawals')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{stats.pendingWithdrawalsCount} Pending Withdrawals Require Review</span>
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Total Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.totalUsers ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>+{stats?.newUsersToday ?? 0} registered today</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Rewards Distributed</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatBDT(stats?.totalDistributedRewards ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total member payouts</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Pending Cashouts</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats?.pendingWithdrawalsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting approval</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">Total Cashouts Paid</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatBDT(stats?.totalWithdrawalsAmount ?? 0)}
          </div>
          <div className="text-[11px] text-teal-400 mt-1 font-mono">Disbursed</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Total System Tasks</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {stats?.totalTasks ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Completed Task Runs</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {stats?.totalCompletedTasks ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Total Video Ad Views</div>
          <div className="text-xl font-bold text-teal-400 font-mono mt-1">
            {stats?.totalVideoViews ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Total Lucky Spins</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {stats?.totalSpins ?? 0}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
              Manage Timer Tasks
            </span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400">
            Create new tasks, adjust BDT rewards, modify duration, and review attempt metrics.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('users')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              User Accounts & Balances
            </span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400">
            Audit user profiles, apply audited balance credits or deductions, ban or restore users.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('withdrawals')}
          className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Withdrawal Queue
            </span>
            <Wallet className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400">
            Process bKash, Nagad, and USDT payout requests with automatic balance refunds on rejection.
          </p>
        </button>
      </div>
    </div>
  );
};
