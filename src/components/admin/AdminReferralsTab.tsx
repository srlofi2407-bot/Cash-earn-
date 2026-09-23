import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import { Users, Award, ShieldCheck, Save, Percent, DollarSign } from 'lucide-react';
import type { SystemSettings } from '../../types';

export const AdminReferralsTab: React.FC = () => {
  const { addToast } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('fixed');
  const [commissionValue, setCommissionValue] = useState('10.00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getAdminSettings().then(res => {
      setSettings(res.settings);
      setCommissionType(res.settings.referralCommissionType || 'fixed');
      setCommissionValue(res.settings.referralCommissionValue?.toString() || '10.00');
    }).catch(err => {
      addToast(err.message, 'error');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSettings({
        referralCommissionType: commissionType,
        referralCommissionValue: parseFloat(commissionValue),
      });
      addToast('Referral program settings updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update referral settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold font-display text-white">Referral Program Configuration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure how much referrers earn when new users sign up or perform platform activities.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-2">Commission Calculation Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCommissionType('fixed')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  commissionType === 'fixed'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  ৳
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Fixed BDT Payout</div>
                  <div className="text-[10px] text-slate-400">Fixed amount per referral</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCommissionType('percentage')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  commissionType === 'percentage'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  %
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Percentage Commission</div>
                  <div className="text-[10px] text-slate-400">% of referee task earnings</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              {commissionType === 'fixed'
                ? 'Referral Bonus Amount (BDT ৳)'
                : 'Referral Commission Percentage (%)'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={commissionValue}
              onChange={e => setCommissionValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
            <div className="font-semibold text-white">Active Rule Summary:</div>
            <div>
              When an invited member completes their registration, the inviter's wallet is credited with{' '}
              <strong className="text-emerald-400 font-mono">
                {commissionType === 'fixed' ? `৳${parseFloat(commissionValue || '0').toFixed(2)}` : `${commissionValue}%`}
              </strong>{' '}
              with server anti-duplicate validation.
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Referral Configuration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
