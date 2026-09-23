import React, { useState, useEffect } from 'react';
import type { Advertisement, WatchEarnAdConfig, SpinAdConfig } from '../../types';
import { api } from '../../api/client';
import { useAuth, formatBDT } from '../../context/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Code2,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  PlayCircle,
  Disc3,
  ExternalLink,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Clock,
  Coins
} from 'lucide-react';

export const AdminAdsTab: React.FC = () => {
  const { addToast } = useAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);

  // Section A: Watch & Earn Adsterra Direct Link State (Completely Independent)
  const [watchEarnUrl, setWatchEarnUrl] = useState('');
  const [watchEarnTimer, setWatchEarnTimer] = useState<number>(15);
  const [watchEarnReward, setWatchEarnReward] = useState<number>(1.50);
  const [watchEarnEnabled, setWatchEarnEnabled] = useState<boolean>(true);
  const [watchEarnSaving, setWatchEarnSaving] = useState(false);

  // Section B: Spin Adsterra Direct Link State (Completely Independent)
  const [spinUrl, setSpinUrl] = useState('');
  const [spinTimer, setSpinTimer] = useState<number>(10);
  const [spinReward, setSpinReward] = useState<number>(1.00);
  const [spinEnabled, setSpinEnabled] = useState<boolean>(true);
  const [spinSaving, setSpinSaving] = useState(false);

  // Modal State for General Custom Ads
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  // General Ad Form
  const [name, setName] = useState('');
  const [type, setType] = useState<'task_pre_ad' | 'video_ad' | 'social_bar' | 'popunder' | 'custom'>('task_pre_ad');
  const [code, setCode] = useState('');
  const [placement, setPlacement] = useState('task_modal_overlay');
  const [priority, setPriority] = useState('10');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [adsRes, adsterraRes] = await Promise.all([
        api.getAdminAds(),
        api.getAdminAdsterra(),
      ]);
      setAds(adsRes.advertisements);

      if (adsterraRes.watchEarn) {
        setWatchEarnUrl(adsterraRes.watchEarn.directLinkUrl || '');
        setWatchEarnTimer(adsterraRes.watchEarn.timerSeconds ?? 15);
        setWatchEarnReward(adsterraRes.watchEarn.reward ?? 1.50);
        setWatchEarnEnabled(adsterraRes.watchEarn.enabled ?? true);
      }

      if (adsterraRes.spin) {
        setSpinUrl(adsterraRes.spin.directLinkUrl || '');
        setSpinTimer(adsterraRes.spin.timerSeconds ?? 10);
        setSpinReward(adsterraRes.spin.reward ?? 1.00);
        setSpinEnabled(adsterraRes.spin.enabled ?? true);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load advertisements config', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save Watch & Earn Ad Settings Independently
  const handleSaveWatchEarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchEarnUrl.trim()) {
      addToast('Please provide a valid Adsterra Direct Link URL for Watch & Earn', 'error');
      return;
    }
    setWatchEarnSaving(true);
    try {
      await api.updateAdminWatchEarnAd({
        directLinkUrl: watchEarnUrl.trim(),
        timerSeconds: Number(watchEarnTimer),
        reward: Number(watchEarnReward),
        enabled: watchEarnEnabled,
      });
      addToast('Watch & Earn Adsterra Direct Link saved successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save Watch & Earn Ad settings', 'error');
    } finally {
      setWatchEarnSaving(false);
    }
  };

  // Save Spin Ad Settings Independently
  const handleSaveSpin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinUrl.trim()) {
      addToast('Please provide a valid Adsterra Direct Link URL for Spin', 'error');
      return;
    }
    setSpinSaving(true);
    try {
      await api.updateAdminSpinAd({
        directLinkUrl: spinUrl.trim(),
        timerSeconds: Number(spinTimer),
        reward: Number(spinReward),
        enabled: spinEnabled,
      });
      addToast('Spin Adsterra Direct Link saved successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save Spin Ad settings', 'error');
    } finally {
      setSpinSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAd(null);
    setName('');
    setType('task_pre_ad');
    setCode('');
    setPlacement('task_modal_overlay');
    setPriority('10');
    setStatus('active');
    setBannerTitle('');
    setBannerSubtitle('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setName(ad.name);
    setType(ad.type);
    setCode(ad.code || '');
    setPlacement(ad.placement);
    setPriority(ad.priority?.toString() || '10');
    setStatus(ad.status);
    setBannerTitle(ad.bannerTitle || '');
    setBannerSubtitle(ad.bannerSubtitle || '');
    setIsModalOpen(true);
  };

  const handleSaveGeneralAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await api.updateAdminAd(editingAd.id, {
          name,
          type,
          code,
          placement,
          priority: parseInt(priority, 10),
          status,
          bannerTitle,
          bannerSubtitle,
        });
        addToast('Advertisement configuration updated', 'success');
      } else {
        await api.createAdminAd({
          name,
          type,
          code,
          placement,
          priority: parseInt(priority, 10),
          status,
          bannerTitle,
          bannerSubtitle,
        });
        addToast('New advertisement campaign added', 'success');
      }
      setIsModalOpen(false);
      const res = await api.getAdminAds();
      setAds(res.advertisements);
    } catch (err: any) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteGeneralAd = async (id: string, adName: string) => {
    if (!window.confirm(`Delete advertisement "${adName}"?`)) return;
    try {
      await api.deleteAdminAd(id);
      addToast('Advertisement deleted', 'success');
      const res = await api.getAdminAds();
      setAds(res.advertisements);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete advertisement', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-white">Advertisements & Direct Link Center</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure independent Adsterra Direct Links for Watch &amp; Earn and Lucky Spin with server-enforced countdown timers and anti-abuse verification.
        </p>
      </div>

      {/* Security & Verification Notice */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">Server-Side Session &amp; Anti-Abuse Protection</p>
          <p className="text-slate-400 leading-relaxed">
            All user earnings are authoritatively verified on the server using timestamped session tokens. 
            The system validates in-app elapsed time before releasing rewards, preventing client-side timer manipulation, duplicate claims, refresh abuse, and concurrent session exploits.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION A: WATCH & EARN AD (ADSTERRA DIRECT LINK) */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Section A: Watch &amp; Earn Ad</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Adsterra Direct Link
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Users open this direct link, wait for the required timer, and unlock the configured BDT reward.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <button
              type="button"
              onClick={() => setWatchEarnEnabled(!watchEarnEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                watchEarnEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  watchEarnEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${watchEarnEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {watchEarnEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveWatchEarn} className="mt-5 space-y-5 text-xs">
          {/* Direct Link URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Adsterra Direct Link URL</span>
                <span className="text-rose-400">*</span>
              </label>
              {watchEarnUrl && (
                <a
                  href={watchEarnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Test Direct Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              required
              value={watchEarnUrl}
              onChange={e => setWatchEarnUrl(e.target.value)}
              placeholder="https://www.highrevenuegate.com/xxxxxx or your direct link URL"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Paste your raw Adsterra Direct Link. Changing this link automatically updates all future Watch &amp; Earn user sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Timer Duration */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Watch &amp; Earn Timer Duration (Seconds)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[10, 15, 20, 30].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setWatchEarnTimer(sec)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      watchEarnTimer === sec
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={3}
                  max={300}
                  required
                  value={watchEarnTimer}
                  onChange={e => setWatchEarnTimer(Math.max(1, parseInt(e.target.value || '0', 10)))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-500 font-medium">seconds</span>
              </div>
            </div>

            {/* Reward Amount */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Reward Amount (BDT ৳)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[0.5, 1.0, 1.5, 2.0, 5.0].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWatchEarnReward(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      watchEarnReward === amt
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    ৳{amt.toFixed(2)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={100}
                  required
                  value={watchEarnReward}
                  onChange={e => setWatchEarnReward(parseFloat(e.target.value || '0'))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-500 font-medium">BDT</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 font-mono">
              Independent Config: Changes only affect Watch &amp; Earn.
            </div>
            <button
              type="submit"
              disabled={watchEarnSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{watchEarnSaving ? 'Saving...' : 'Save Watch & Earn Ad'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* SECTION B: SPIN AD (ADSTERRA DIRECT LINK) */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Section B: Spin Ad</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                  Adsterra Direct Link
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Users open this direct link before spinning. The wheel unlocks only after countdown completion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <button
              type="button"
              onClick={() => setSpinEnabled(!spinEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                spinEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  spinEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${spinEnabled ? 'text-amber-400' : 'text-slate-400'}`}>
              {spinEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSpin} className="mt-5 space-y-5 text-xs">
          {/* Direct Link URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Spin Adsterra Direct Link URL</span>
                <span className="text-rose-400">*</span>
              </label>
              {spinUrl && (
                <a
                  href={spinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Test Spin Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              required
              value={spinUrl}
              onChange={e => setSpinUrl(e.target.value)}
              placeholder="https://www.highrevenuegate.com/yyyyyy (Separate link for Spin)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Independent Spin Direct Link. Modifying this link does NOT alter the Watch &amp; Earn direct link.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Spin Ad Timer */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Spin Ad Timer (Seconds)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[5, 10, 15, 20].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSpinTimer(sec)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      spinTimer === sec
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={3}
                  max={300}
                  required
                  value={spinTimer}
                  onChange={e => setSpinTimer(Math.max(1, parseInt(e.target.value || '0', 10)))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-500 font-medium">seconds</span>
              </div>
            </div>

            {/* Spin Ad Guaranteed Reward / Bonus */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Spin Ad Bonus Reward (BDT ৳)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[0, 0.5, 1.0, 2.0].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSpinReward(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      spinReward === amt
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    ৳{amt.toFixed(2)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={50}
                  required
                  value={spinReward}
                  onChange={e => setSpinReward(parseFloat(e.target.value || '0'))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-500 font-medium">BDT</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 font-mono">
              Independent Config: Changes only affect Spin flow.
            </div>
            <button
              type="submit"
              disabled={spinSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{spinSaving ? 'Saving...' : 'Save Spin Ad'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* SECTION C: CUSTOM NETWORK SCRIPTS & DISPLAY BANNERS */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Section C: Display Banners &amp; Social Bar Scripts</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Custom HTML/JS banners, popunders, and social bars across the user interface.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner / Script Unit</span>
          </button>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ad Campaign</th>
                  <th className="py-3.5 px-4">Ad Type</th>
                  <th className="py-3.5 px-4">Placement</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{ad.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {ad.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                        {ad.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {ad.placement}
                    </td>
                    <td className="py-3 px-4 font-mono text-white">
                      {ad.priority}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ad.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ad.status}
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
                        onClick={() => handleDeleteGeneralAd(ad.id, ad.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {ads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No custom script banners added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Custom Script / Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAd ? 'Edit Ad Configuration' : 'Create New Ad Campaign'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGeneralAd} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Ad Unit Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Adsterra Social Bar Header"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ad Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="task_pre_ad">Task Pre-Start Ad</option>
                    <option value="video_ad">Video Commercial Ad</option>
                    <option value="social_bar">Social Bar Ad</option>
                    <option value="popunder">Popunder Ad</option>
                    <option value="custom">Other Custom Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Placement Identifier</label>
                  <input
                    type="text"
                    required
                    value={placement}
                    onChange={e => setPlacement(e.target.value)}
                    placeholder="e.g. task_modal_overlay"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Display Priority</label>
                  <input
                    type="number"
                    required
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Ad Code / HTML / JS Snippet (Paste network script here)
                </label>
                <textarea
                  rows={4}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="<script async src='...'></script> or banner HTML..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Fallback Banner Title (Optional)</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={e => setBannerTitle(e.target.value)}
                  placeholder="e.g. Exclusive Partner Offer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
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
                  Save Ad Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
