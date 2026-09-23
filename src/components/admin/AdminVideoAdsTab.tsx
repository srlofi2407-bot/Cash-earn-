import React, { useState, useEffect } from 'react';
import type { VideoAd } from '../../types';
import { api } from '../../api/client';
import { formatBDT, useAuth } from '../../context/AuthContext';
import {
  PlayCircle,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Coins,
  X,
  Eye
} from 'lucide-react';

export const AdminVideoAdsTab: React.FC = () => {
  const { addToast } = useAuth();
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<VideoAd | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [reward, setReward] = useState('2.50');
  const [duration, setDuration] = useState('15');
  const [dailyLimit, setDailyLimit] = useState('10');
  const [active, setActive] = useState(true);

  const loadVideoAds = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminVideoAds();
      setVideoAds(res.videoAds);
    } catch (err: any) {
      addToast(err.message || 'Failed to load video ads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideoAds();
  }, []);

  const handleOpenCreate = () => {
    setEditingAd(null);
    setTitle('');
    setBrand('');
    setReward('2.50');
    setDuration('15');
    setDailyLimit('10');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: VideoAd) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setBrand(ad.brand);
    setReward(ad.reward.toString());
    setDuration(ad.requiredDurationSeconds.toString());
    setDailyLimit(ad.dailyLimit.toString());
    setActive(ad.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await api.updateAdminVideoAd(editingAd.id, {
          title,
          brand,
          reward: parseFloat(reward),
          requiredDurationSeconds: parseInt(duration, 10),
          dailyLimit: parseInt(dailyLimit, 10),
          active,
        });
        addToast('Video ad updated', 'success');
      } else {
        await api.createAdminVideoAd({
          title,
          brand,
          reward: parseFloat(reward),
          requiredDurationSeconds: parseInt(duration, 10),
          dailyLimit: parseInt(dailyLimit, 10),
          active,
        });
        addToast('Video ad created', 'success');
      }
      setIsModalOpen(false);
      loadVideoAds();
    } catch (err: any) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string, adTitle: string) => {
    if (!window.confirm(`Delete video campaign "${adTitle}"?`)) return;
    try {
      await api.deleteAdminVideoAd(id);
      addToast('Video ad deleted', 'success');
      loadVideoAds();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete video ad', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Commercial Video Campaigns</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure partner commercial video campaigns, duration requirements, and BDT viewer payouts.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video Campaign</span>
        </button>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Title & Sponsor</th>
                <th className="py-3.5 px-4">Reward</th>
                <th className="py-3.5 px-4">Required Duration</th>
                <th className="py-3.5 px-4">Total Views</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {videoAds.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{ad.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ad.brand}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    +{formatBDT(ad.reward)}
                  </td>
                  <td className="py-3 px-4 font-mono text-white">
                    {ad.requiredDurationSeconds}s
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-400">
                    {ad.viewsCount} views
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ad.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {ad.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(ad)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id, ad.title)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAd ? 'Edit Video Campaign' : 'Create Video Campaign'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Banglalink 4G Network Showcase"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Brand / Sponsor Name</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Banglalink Digital"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reward (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={reward}
                    onChange={e => setReward(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (s)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Daily Limit</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dailyLimit}
                    onChange={e => setDailyLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="adActiveCheck"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="adActiveCheck" className="text-slate-300 cursor-pointer">
                  Campaign is active for users
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
