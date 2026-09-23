import React, { useState, useEffect } from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { Transaction } from '../../types';
import { api } from '../../api/client';
import {
  User,
  LogOut,
  ShieldCheck,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ProfileTabProps {
  onOpenAuth: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ onOpenAuth }) => {
  const { user, userLogout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getTransactions();
      setTransactions(res.transactions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Sign In to Your Account</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Access your BDT wallet, daily task progress, and withdrawal transaction logs.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="min-h-[44px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">@{user.username}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 capitalize">
                {user.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              ID: {user.id} · Ref: {user.referralCode}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={userLogout}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700/80"
          title="Sign out of account"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">Wallet Balance</div>
          <div className="text-base font-bold text-white font-mono mt-1">
            {formatBDT(user.balance)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Lifetime</div>
          <div className="text-base font-bold text-emerald-400 font-mono mt-1">
            {formatBDT(user.totalEarnings)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">Tasks Completed</div>
          <div className="text-base font-bold text-white font-mono mt-1">
            {user.completedTasks}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">Referral Earnings</div>
          <div className="text-base font-bold text-teal-400 font-mono mt-1">
            {formatBDT(user.referralEarnings)}
          </div>
        </div>
      </div>

      {/* Transaction Ledger & History Filter */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Full Transaction Audit Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable server records of every balance adjustment, task reward, and cashout
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: 'All' },
              { id: 'task_earning', label: 'Tasks' },
              { id: 'video_ad_earning', label: 'Videos' },
              { id: 'spin_reward', label: 'Spins' },
              { id: 'referral_earning', label: 'Referrals' },
              { id: 'withdrawal', label: 'Cashouts' },
              { id: 'admin_adjustment', label: 'Admin Adj' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No transactions match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTransactions.map(tx => {
              const isPositive = tx.amount >= 0;
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleString()} · {tx.id}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatBDT(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
