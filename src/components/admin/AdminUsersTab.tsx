import React, { useState, useEffect } from 'react';
import type { SafeUser } from '../../types';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  DollarSign,
  Ban,
  CheckCircle,
  X,
  AlertCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const { addToast } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Balance Adjustment Modal
  const [adjustUser, setAdjustUser] = useState<SafeUser | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // User Detail Modal
  const [detailUser, setDetailUser] = useState<SafeUser | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err: any) {
      addToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdjust = (u: SafeUser) => {
    setAdjustUser(u);
    setAdjustType('add');
    setAdjustAmount('');
    setAdjustReason('');
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUser) return;
    const amountVal = parseFloat(adjustAmount);
    if (!amountVal || amountVal <= 0) {
      addToast('Please enter a valid positive adjustment amount', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      addToast('Please enter a mandatory audit reason', 'error');
      return;
    }

    setAdjusting(true);
    try {
      await api.adjustUserBalance(adjustUser.id, {
        type: adjustType,
        amount: amountVal,
        reason: adjustReason.trim(),
      });
      addToast(`User balance adjusted by ${adjustType === 'add' ? '+' : '-'}${formatBDT(amountVal)}`, 'success');
      setAdjustUser(null);
      loadUsers();
    } catch (err: any) {
      addToast(err.message || 'Balance adjustment failed', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleUpdateStatus = async (user: SafeUser, newStatus: 'active' | 'banned' | 'disabled') => {
    if (!window.confirm(`Are you sure you want to set @${user.username} status to ${newStatus}?`)) return;
    try {
      await api.updateUserStatus(user.id, { status: newStatus });
      addToast(`User @${user.username} is now ${newStatus}`, 'info');
      loadUsers();
    } catch (err: any) {
      addToast(err.message || 'Status update failed', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    u.referralCode.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Registered User Accounts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit user profiles, investigate fraud, adjust balances with audit trails, and manage account statuses.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Users: <strong className="text-white">{users.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username, ID, phone, referral code..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Total Earned</th>
                <th className="py-3.5 px-4">Tasks Done</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setDetailUser(u)}
                      className="font-bold text-white hover:text-indigo-400 text-left transition-colors"
                    >
                      @{u.username}
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {u.id} · Ref: {u.referralCode}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {formatBDT(u.balance)}
                  </td>
                  <td className="py-3 px-4 font-mono text-white">
                    {formatBDT(u.totalEarnings)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {u.completedTasks}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : u.status === 'banned'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenAdjust(u)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-semibold transition-colors"
                      title="Adjust Balance"
                    >
                      ± Balance
                    </button>
                    {u.status === 'active' ? (
                      <button
                        onClick={() => handleUpdateStatus(u, 'banned')}
                        className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-950 text-rose-300 text-[11px] transition-colors"
                        title="Ban User"
                      >
                        Ban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(u, 'active')}
                        className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-950 text-emerald-300 text-[11px] transition-colors"
                        title="Activate User"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Adjustment Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Adjust Balance for @{adjustUser.username}
              </h3>
              <button
                onClick={() => setAdjustUser(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-mono font-bold text-emerald-400">{formatBDT(adjustUser.balance)}</span>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-semibold border transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    + Credit Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2 rounded-xl font-semibold border transition-colors ${
                      adjustType === 'deduct'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    - Deduct Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Amount (BDT ৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Promotional bonus credit, manual compensation, correction"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md disabled:opacity-50"
                >
                  {adjusting ? 'Applying...' : 'Confirm Balance Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details View Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                User Details: @{detailUser.username}
              </h3>
              <button
                onClick={() => setDetailUser(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">User ID</span>
                  <span className="font-mono text-white select-all">{detailUser.id}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Referral Code</span>
                  <span className="font-mono text-emerald-400">{detailUser.referralCode}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatBDT(detailUser.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Lifetime Earned:</span>
                  <span className="font-mono text-white">{formatBDT(detailUser.totalEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Referral Commission Earned:</span>
                  <span className="font-mono text-teal-400">{formatBDT(detailUser.referralEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks Completed:</span>
                  <span className="font-mono text-white">{detailUser.completedTasks}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400">Account Status: <strong className="text-white capitalize">{detailUser.status}</strong></div>
                <div className="text-slate-400">Joined: <strong className="text-white">{new Date(detailUser.createdAt).toLocaleString()}</strong></div>
                <div className="text-slate-400">Last Activity: <strong className="text-white">{new Date(detailUser.lastActivity).toLocaleString()}</strong></div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
