import React, { useState, useEffect } from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { Withdrawal } from '../../types';
import { api } from '../../api/client';
import {
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface WalletTabProps {
  onOpenAuth: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ onOpenAuth }) => {
  const { user, refreshUser, addToast } = useAuth();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [maxWithdrawal, setMaxWithdrawal] = useState(10000);
  const [feePercent, setFeePercent] = useState(2);
  const [supportedMethods, setSupportedMethods] = useState<string[]>(['bKash', 'Nagad', 'USDT']);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'USDT'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [amount, setAmount] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState(false);

  const loadWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getWithdrawals();
      setWithdrawals(res.withdrawals);
      setMinWithdrawal(res.minWithdrawal);
      setMaxWithdrawal(res.maxWithdrawal);
      setFeePercent(res.feePercent);
      if (res.supportedMethods) setSupportedMethods(res.supportedMethods);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const numAmount = parseFloat(amount) || 0;
  const calculatedFee = Math.round(((numAmount * feePercent) / 100 + Number.EPSILON) * 100) / 100;
  const netReceived = Math.max(0, Math.round(((numAmount - calculatedFee) + Number.EPSILON) * 100) / 100);

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleMaxAmount = () => {
    if (user) {
      setAmount(Math.floor(user.balance).toString());
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (numAmount < minWithdrawal) {
      addToast(`Minimum withdrawal is ${formatBDT(minWithdrawal)}`, 'error');
      return;
    }
    if (numAmount > maxWithdrawal) {
      addToast(`Maximum withdrawal is ${formatBDT(maxWithdrawal)}`, 'error');
      return;
    }
    if (user.balance < numAmount) {
      addToast('Insufficient wallet balance for this amount', 'error');
      return;
    }
    if (!accountNumber.trim()) {
      addToast('Please enter your account number or wallet address', 'error');
      return;
    }
    setConfirmModal(true);
  };

  const handleConfirmWithdrawal = async () => {
    setSubmitting(true);
    try {
      await api.requestWithdrawal({
        method: selectedMethod,
        accountNumber: accountNumber.trim(),
        amount: numAmount,
        network: selectedMethod === 'USDT' ? usdtNetwork : undefined,
      });

      addToast(`Withdrawal request for ${formatBDT(numAmount)} submitted successfully!`, 'success');
      setConfirmModal(false);
      setAmount('');
      setAccountNumber('');
      await refreshUser();
      loadWalletData();
    } catch (err: any) {
      addToast(err.message || 'Withdrawal request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              BDT Cashout Portal
            </span>
          </div>
          <button
            onClick={loadWalletData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="text-xs text-slate-400">Available For Withdrawal</div>
          <div className="text-3xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatBDT(user?.balance ?? 0)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div>
            <span>Min: </span>
            <span className="font-semibold text-white font-mono">{formatBDT(minWithdrawal)}</span>
          </div>
          <div>
            <span>Max: </span>
            <span className="font-semibold text-white font-mono">{formatBDT(maxWithdrawal)}</span>
          </div>
          <div>
            <span>Fee: </span>
            <span className="font-semibold text-emerald-400 font-mono">{feePercent}%</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-sm font-bold text-white mb-4">Request Cashout</h3>

        <form onSubmit={handleOpenConfirm} className="space-y-5">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Payout Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {supportedMethods.includes('bKash') && (
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bKash')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedMethod === 'bKash'
                      ? 'border-pink-500 bg-pink-950/20 text-white shadow-md shadow-pink-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs mb-2">
                    bK
                  </div>
                  <div className="text-xs font-bold text-white">bKash</div>
                  <div className="text-[10px] text-slate-400">Personal / Agent</div>
                </button>
              )}

              {supportedMethods.includes('Nagad') && (
                <button
                  type="button"
                  onClick={() => setSelectedMethod('Nagad')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedMethod === 'Nagad'
                      ? 'border-orange-500 bg-orange-950/20 text-white shadow-md shadow-orange-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs mb-2">
                    NG
                  </div>
                  <div className="text-xs font-bold text-white">Nagad</div>
                  <div className="text-[10px] text-slate-400">Mobile Wallet</div>
                </button>
              )}

              {supportedMethods.includes('USDT') && (
                <button
                  type="button"
                  onClick={() => setSelectedMethod('USDT')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedMethod === 'USDT'
                      ? 'border-emerald-500 bg-emerald-950/20 text-white shadow-md shadow-emerald-950/30'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs mb-2">
                    ₮
                  </div>
                  <div className="text-xs font-bold text-white">USDT Crypto</div>
                  <div className="text-[10px] text-slate-400">TRC20 / BEP20</div>
                </button>
              )}
            </div>
          </div>

          {/* If USDT, Network Selector */}
          {selectedMethod === 'USDT' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                USDT Network
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUsdtNetwork('TRC20')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                    usdtNetwork === 'TRC20'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  TRC20 (Tron)
                </button>
                <button
                  type="button"
                  onClick={() => setUsdtNetwork('BEP20')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                    usdtNetwork === 'BEP20'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  BEP20 (BNB Chain)
                </button>
              </div>
            </div>
          )}

          {/* Account Number / Wallet Address */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {selectedMethod === 'USDT'
                ? `USDT (${usdtNetwork}) Receiving Address`
                : `${selectedMethod} 11-Digit Mobile Number`}
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder={
                selectedMethod === 'USDT'
                  ? 'Paste wallet address (e.g. T... or 0x...)'
                  : '017xxxxxxxx / 018xxxxxxxx'
              }
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Withdrawal Amount in BDT
              </label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Max ({formatBDT(user?.balance ?? 0)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold font-mono">
                ৳
              </span>
              <input
                type="number"
                step="any"
                required
                min={minWithdrawal}
                max={maxWithdrawal}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="50.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[50, 100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-semibold text-slate-300 transition-colors"
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation summary */}
          {numAmount > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount:</span>
                <span className="font-mono text-white">{formatBDT(numAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Withdrawal Fee ({feePercent}%):</span>
                <span className="font-mono text-rose-400">-{formatBDT(calculatedFee)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800">
                <span>Net Estimated Payout:</span>
                <span className="font-mono text-emerald-400">{formatBDT(netReceived)}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full min-h-[48px] py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <span>Proceed to Confirmation</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <ArrowUpRight className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Confirm Cashout</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify your payout recipient credentials before sending.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-semibold text-white">
                  {selectedMethod} {selectedMethod === 'USDT' ? `(${usdtNetwork})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Account:</span>
                <span className="font-mono text-white truncate max-w-[180px]">{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Amount:</span>
                <span className="font-mono text-white">{formatBDT(numAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee ({feePercent}%):</span>
                <span className="font-mono text-rose-400">-{formatBDT(calculatedFee)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-slate-800">
                <span className="text-slate-300">You Receive:</span>
                <span className="font-mono text-emerald-400 text-sm">{formatBDT(netReceived)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawal}
                disabled={submitting}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-md disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-3">Withdrawal Records</h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {withdrawals.map(w => {
              const statusColor =
                w.status === 'completed' || w.status === 'approved'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                  : w.status === 'rejected'
                  ? 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                  : w.status === 'processing'
                  ? 'text-blue-400 bg-blue-950/60 border-blue-800/40'
                  : 'text-amber-400 bg-amber-950/60 border-amber-800/40';

              return (
                <div key={w.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {w.method} {w.network ? `(${w.network})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {w.id}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColor}`}>
                      {w.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                      {w.accountNumber}
                    </span>
                    <div className="text-right">
                      <span className="font-bold font-mono text-white">{formatBDT(w.amount)}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Net: {formatBDT(w.netAmount)}
                      </span>
                    </div>
                  </div>

                  {w.status === 'rejected' && w.rejectionReason && (
                    <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-300">
                      Reason: {w.rejectionReason} (Amount has been refunded to your wallet)
                    </div>
                  )}

                  {w.adminNote && (
                    <div className="text-[10px] text-slate-400 italic">
                      Note: {w.adminNote}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(w.createdAt).toLocaleString()}
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
