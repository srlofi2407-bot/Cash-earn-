import React, { useState, useEffect } from 'react';
import type { SpinSegment } from '../../types';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import { Disc3, Save, Plus, Trash2, Award } from 'lucide-react';

export const AdminSpinTab: React.FC = () => {
  const { addToast } = useAuth();
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [totalSpins, setTotalSpins] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getAdminSpin().then(res => {
      setSegments(res.segments);
      setDailyLimit(res.dailyLimit);
      setTotalSpins(res.totalSpins);
    }).catch(err => {
      addToast(err.message, 'error');
    });
  }, []);

  const handleSegmentChange = (index: number, field: keyof SpinSegment, value: any) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };
    setSegments(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSpin({
        segments,
        dailyLimit,
      });
      addToast('Lucky Spin wheel settings saved', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save spin settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Lucky Prize Wheel Configuration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure wheel prize segments, server-side weighted probability distributions, and daily spin limits.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Lifetime Platform Spins: <strong className="text-white">{totalSpins}</strong>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              User Daily Spin Limit
            </label>
            <input
              type="number"
              required
              min={1}
              max={50}
              value={dailyLimit}
              onChange={e => setDailyLimit(parseInt(e.target.value, 10))}
              className="w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Wheel Segments & Weighted Probability</h3>
            <div className="space-y-3">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                >
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Reward (BDT ৳)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={seg.reward}
                      onChange={e => handleSegmentChange(idx, 'reward', parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Display Label</label>
                    <input
                      type="text"
                      required
                      value={seg.label}
                      onChange={e => handleSegmentChange(idx, 'label', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Probability Weight</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={seg.weight}
                      onChange={e => handleSegmentChange(idx, 'weight', parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Segment Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={seg.color}
                        onChange={e => handleSegmentChange(idx, 'color', e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-slate-400 text-[11px]">{seg.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Spin Wheel Configuration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
