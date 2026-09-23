import React from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { Task, Transaction, Advertisement } from '../../types';
import {
  Wallet,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  PlayCircle,
  Disc3,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface HomeTabProps {
  onNavigateTab: (tab: 'home' | 'tasks' | 'earn' | 'wallet' | 'profile') => void;
  tasks: Task[];
  transactions: Transaction[];
  activeAds: Advertisement[];
  onOpenAuth: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigateTab,
  tasks,
  transactions,
  activeAds,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  const socialAd = activeAds.find(a => a.type === 'social_bar');
  const availableTasksCount = tasks.filter(t => t.active).length;

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner Ad if configured by admin */}
      {socialAd && (
        <div
          className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 p-3 text-xs"
          dangerouslySetInnerHTML={{ __html: socialAd.code }}
        />
      )}

      {/* Hero Financial Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-900/40 p-6 shadow-xl text-white">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                Active BDT Wallet
              </span>
            </div>
            {user ? (
              <span className="text-xs text-slate-400 font-medium">
                @{user.username}
              </span>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs font-semibold text-emerald-400 underline hover:text-emerald-300"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="text-xs text-slate-400 mb-1">Available Balance</div>
            <div className="text-4xl font-bold tracking-tight text-white font-mono tabular-nums flex items-baseline gap-2">
              {formatBDT(user?.balance ?? 0)}
              <span className="text-xs text-emerald-400/80 font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                Verified
              </span>
            </div>
          </div>

          {/* Key Stat Counters */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-left">
            <div>
              <div className="text-[11px] text-slate-400">Today's Earnings</div>
              <div className="text-sm font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                {formatBDT(user?.todayEarnings ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Total Earned</div>
              <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                {formatBDT(user?.totalEarnings ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Referral Earn</div>
              <div className="text-sm font-semibold text-teal-400 font-mono tabular-nums mt-0.5">
                {formatBDT(user?.referralEarnings ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('tasks')}
          className="group p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl text-left transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">Timer Tasks</div>
          <div className="text-xs text-slate-400 mt-0.5">{availableTasksCount} tasks open</div>
        </button>

        <button
          onClick={() => onNavigateTab('earn')}
          className="group p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl text-left transition-all hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-950/20 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-105 transition-transform">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">Watch & Earn</div>
          <div className="text-xs text-slate-400 mt-0.5">Instant video bonus</div>
        </button>

        <button
          onClick={() => onNavigateTab('earn')}
          className="group p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl text-left transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-950/20 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
            <Disc3 className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">Lucky Spin</div>
          <div className="text-xs text-slate-400 mt-0.5">Win up to ৳20</div>
        </button>

        <button
          onClick={() => onNavigateTab('wallet')}
          className="group p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl text-left transition-all hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-950/20 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">Withdraw BDT</div>
          <div className="text-xs text-slate-400 mt-0.5">bKash, Nagad, USDT</div>
        </button>
      </div>

      {/* Featured Task Promo Card with visual banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-full md:w-48 h-32 md:h-32 rounded-2xl overflow-hidden shrink-0">
          <img
            src="/src/assets/images/task_earning_showcase_1790149735162.jpg"
            alt="Sponsored Tasks"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            <span>High Payout</span>
          </div>
        </div>

        <div className="flex-1 w-full text-left">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Verified Sponsor Tasks</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">10s Ad Countdown Protection</span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Complete Micro-Tasks & Receive Instant BDT Rewards
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Each sponsored task is protected with mandatory advertisement verification. Browse partner offers, wait for the timer, and claim your verified earnings directly to your wallet.
          </p>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <span>Explore All Tasks</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity / Transactions */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time ledger of your earnings & payouts</p>
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View All
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No transactions yet. Complete tasks or spin the lucky wheel to get started!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map(tx => {
              const isPositive = tx.amount >= 0;
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white line-clamp-1">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {tx.id}
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
                    <div className="text-[10px] text-slate-400 capitalize">
                      {tx.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust & Payout Security Badge */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Fast Bangladesh Payouts:</span> Minimum cashout ৳50. Instant disbursement via bKash Personal/Merchant, Nagad, and USDT TRC20/BEP20.
        </div>
      </div>
    </div>
  );
};
