import React, { useState, useEffect } from 'react';
import type { Withdrawal } from '../../types';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';

export const AdminWithdrawalsTab: React.FC = () => {
  const { addToast } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Action Dialog State
  const [actionItem, setActionItem] = useState<{
    withdrawal: Withdrawal;
    action: 'approve' | 'complete' | 'processing' | 'reject';
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminWithdrawals();
      setWithdrawals(res.withdrawals);
    } catch (err: any) {
      addToast(err.message || 'Failed to load withdrawals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleOpenAction = (
    withdrawal: Withdrawal,
    action: 'approve' | 'complete' | 'processing' | 'reject'
  ) => {
    setActionItem({ withdrawal, action });
    setRejectionReason('');
    setAdminNote('');
  };

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    if (actionItem.action === 'reject' && !rejectionReason.trim()) {
      addToast('Please provide a mandatory reason for rejecting this cashout', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.actionWithdrawal(actionItem.withdrawal.id, {
        action: actionItem.action,
        reason: rejectionReason.trim() || undefined,
        note: adminNote.trim() || undefined,
      });

      const message =
        actionItem.action === 'reject'
          ? `Withdrawal ${actionItem.withdrawal.id} rejected and balance refunded to user`
          : `Withdrawal ${actionItem.withdrawal.id} marked as ${actionItem.action}`;

      addToast(message, 'success');
      setActionItem(null);
      loadWithdrawals();
    } catch (err: any) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = withdrawals.filter(w => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        w.id.toLowerCase().includes(q) ||
        w.username.toLowerCase().includes(q) ||
        w.accountNumber.toLowerCase().includes(q) ||
        w.method.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Withdrawal Processing Queue</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit member cashout requests, disburse mobile banking & crypto payouts, or reject with automatic balance refund.
          </p>
        </div>
        <button
          onClick={loadWithdrawals}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, username, account, method..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'pending', 'processing', 'approved', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Payout ID</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Method / Account</th>
                <th className="py-3.5 px-4">Gross Amount</th>
                <th className="py-3.5 px-4">Net Payout</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filtered.map(w => {
                const statusColor =
                  w.status === 'completed' || w.status === 'approved'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                    : w.status === 'rejected'
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                    : w.status === 'processing'
                    ? 'text-blue-400 bg-blue-950/60 border-blue-800/40'
                    : 'text-amber-400 bg-amber-950/60 border-amber-800/40';

                return (
                  <tr key={w.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {w.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">@{w.username}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{w.userId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {w.method} {w.network ? `(${w.network})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] select-all">
                        {w.accountNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-white">
                      {formatBDT(w.amount)}
                      <span className="text-[10px] text-slate-500 block">Fee: {formatBDT(w.fee)}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatBDT(w.netAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>
                        {w.status}
                      </span>
                      {w.rejectionReason && (
                        <div className="text-[10px] text-rose-400 mt-1 max-w-xs truncate" title={w.rejectionReason}>
                          {w.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(w.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenAction(w, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-semibold"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenAction(w, 'processing')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] font-semibold"
                            title="Mark Processing"
                          >
                            Process
                          </button>
                          <button
                            onClick={() => handleOpenAction(w, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[11px] font-semibold"
                            title="Reject & Refund"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(w.status === 'approved' || w.status === 'processing') && (
                        <button
                          onClick={() => handleOpenAction(w, 'complete')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px]"
                          title="Disbursed & Complete"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Action Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white capitalize">
                {actionItem.action === 'reject'
                  ? 'Reject Withdrawal Request'
                  : `Mark Withdrawal as ${actionItem.action}`}
              </h3>
              <button
                onClick={() => setActionItem(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Withdrawal ID:</span>
                <span className="font-mono text-white">{actionItem.withdrawal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-semibold text-white">@{actionItem.withdrawal.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Target:</span>
                <span className="font-mono text-emerald-400">{actionItem.withdrawal.method} ({actionItem.withdrawal.accountNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Amount to Send:</span>
                <span className="font-mono font-bold text-white">{formatBDT(actionItem.withdrawal.netAmount)}</span>
              </div>
            </div>

            {actionItem.action === 'reject' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                  ⚠️ Rejecting this request will automatically refund{' '}
                  <strong>{formatBDT(actionItem.withdrawal.amount)}</strong> back to the user's wallet!
                </div>
                <label className="block text-slate-300 font-medium">
                  Mandatory Rejection Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid bKash account number, incorrect network, suspected fraud"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="block text-slate-400 font-medium">
                Admin Audit Note (Optional)
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Internal reference or Tx hash..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActionItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-5 py-2 rounded-xl font-bold shadow-md transition-colors ${
                  actionItem.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {submitting ? 'Updating...' : `Confirm ${actionItem.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
