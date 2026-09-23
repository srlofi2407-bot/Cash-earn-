import React, { useState, useEffect } from 'react';
import type { SystemSettings } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const { addToast } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAdminSettings().then(res => {
      setSettings(res.settings);
    }).catch(err => {
      addToast(err.message, 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleFieldChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleToggleMethod = (method: string) => {
    if (!settings) return;
    const current = settings.supportedMethods || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setSettings({ ...settings, supportedMethods: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateAdminSettings(settings);
      addToast('System settings updated successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="text-xs text-slate-400">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold font-display text-white">System Global Configuration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Platform financial rules, limits, currency parameters, maintenance mode, and payout channels.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Financial Rules */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Financial & Withdrawal Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={settings.currencySymbol}
                onChange={e => handleFieldChange('currencySymbol', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Currency Code
              </label>
              <input
                type="text"
                required
                value={settings.currencyCode}
                onChange={e => handleFieldChange('currencyCode', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Withdrawal Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.withdrawalFeePercent}
                onChange={e => handleFieldChange('withdrawalFeePercent', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Minimum Withdrawal (BDT ৳)
              </label>
              <input
                type="number"
                required
                value={settings.minWithdrawal}
                onChange={e => handleFieldChange('minWithdrawal', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Maximum Withdrawal (BDT ৳)
              </label>
              <input
                type="number"
                required
                value={settings.maxWithdrawal}
                onChange={e => handleFieldChange('maxWithdrawal', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Daily User Limits */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Daily User Activity Limits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Daily Tasks Per User
              </label>
              <input
                type="number"
                required
                value={settings.dailyTaskLimit}
                onChange={e => handleFieldChange('dailyTaskLimit', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Daily Video Ads
              </label>
              <input
                type="number"
                required
                value={settings.dailyVideoLimit}
                onChange={e => handleFieldChange('dailyVideoLimit', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Daily Lucky Spins
              </label>
              <input
                type="number"
                required
                value={settings.dailySpinLimit}
                onChange={e => handleFieldChange('dailySpinLimit', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Supported Payout Gateways */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Supported Withdrawal Channels</h3>
          <div className="flex gap-4">
            {['bKash', 'Nagad', 'USDT'].map(method => (
              <label
                key={method}
                className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={settings.supportedMethods.includes(method)}
                  onChange={() => handleToggleMethod(method)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-white">{method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* System Gates */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">System Flags & Access Controls</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.userRegistrationEnabled}
                onChange={e => handleFieldChange('userRegistrationEnabled', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
              />
              <div>
                <div className="font-semibold text-white">Enable Public User Registrations</div>
                <div className="text-[10px] text-slate-400">Allows new members to sign up and claim welcome rewards</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => handleFieldChange('maintenanceMode', e.target.checked)}
                className="rounded text-rose-600 focus:ring-0 w-4 h-4"
              />
              <div>
                <div className="font-semibold text-rose-400">Maintenance Mode</div>
                <div className="text-[10px] text-slate-400">Temporarily freeze non-admin task sessions and payouts</div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Updating Settings...' : 'Save All System Settings'}</span>
        </button>
      </form>
    </div>
  );
};
