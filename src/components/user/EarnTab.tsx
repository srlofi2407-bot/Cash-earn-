import React, { useState, useEffect, useRef } from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { VideoAd, SpinSegment, AdsterraPublicConfig } from '../../types';
import { api } from '../../api/client';
import {
  PlayCircle,
  Disc3,
  Users,
  Copy,
  Check,
  Sparkles,
  Flame,
  Award,
  Clock,
  ShieldCheck,
  X,
  Share2,
  Gift,
  ExternalLink,
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface EarnTabProps {
  onOpenAuth: () => void;
}

export const EarnTab: React.FC<EarnTabProps> = ({ onOpenAuth }) => {
  const { user, refreshUser, addToast } = useAuth();
  const [subTab, setSubTab] = useState<'video' | 'spin' | 'referral'>('video');

  // Adsterra Direct Link Configuration State
  const [adsterraConfig, setAdsterraConfig] = useState<AdsterraPublicConfig | null>(null);

  // Watch & Earn Adsterra Direct Link State
  const [watchAdModalOpen, setWatchAdModalOpen] = useState(false);
  const [watchAdSession, setWatchAdSession] = useState<{
    sessionId: string;
    directLinkUrl: string;
    requiredDuration: number;
    reward: number;
  } | null>(null);
  const [watchAdCountdown, setWatchAdCountdown] = useState(0);
  const [watchAdClaiming, setWatchAdClaiming] = useState(false);
  const [watchAdClaimedReward, setWatchAdClaimedReward] = useState<number | null>(null);
  const watchAdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spin Adsterra Direct Link State
  const [spinAdModalOpen, setSpinAdModalOpen] = useState(false);
  const [spinAdSession, setSpinAdSession] = useState<{
    sessionId: string;
    directLinkUrl: string;
    requiredDuration: number;
    reward: number;
  } | null>(null);
  const [spinAdCountdown, setSpinAdCountdown] = useState(0);
  const [spinAdVerified, setSpinAdVerified] = useState(false);
  const [spinAdVerifying, setSpinAdVerifying] = useState(false);
  const spinAdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Video Ads State
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [videoDailyLimit, setVideoDailyLimit] = useState(10);
  const [watchedToday, setWatchedToday] = useState(0);
  const [activeVideo, setActiveVideo] = useState<VideoAd | null>(null);
  const [videoSessionId, setVideoSessionId] = useState<string | null>(null);
  const [videoCountdown, setVideoCountdown] = useState(0);
  const [isVideoWatching, setIsVideoWatching] = useState(false);
  const [videoClaimedReward, setVideoClaimedReward] = useState<number | null>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spin State
  const [spinSegments, setSpinSegments] = useState<SpinSegment[]>([]);
  const [spinsToday, setSpinsToday] = useState(0);
  const [dailySpinLimit, setDailySpinLimit] = useState(5);
  const [remainingSpins, setRemainingSpins] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinWinResult, setSpinWinResult] = useState<{ reward: number; label: string } | null>(null);

  // Referral State
  const [referralsData, setReferralsData] = useState<{
    referralCode: string;
    totalReferrals: number;
    activeReferrals: number;
    referralEarnings: number;
    commissionSetting: { type: string; value: number };
    referredUsers: Array<{ id: string; username: string; status: string; completedTasks: number; joinedAt: string }>;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Video Ads
  const loadVideoAds = async () => {
    if (!user) return;
    try {
      const res = await api.getVideoAds();
      setVideoAds(res.videoAds);
      setVideoDailyLimit(res.dailyLimit);
      setWatchedToday(res.watchedToday);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Spin Data
  const loadSpinData = async () => {
    if (!user) return;
    try {
      const res = await api.getSpinData();
      setSpinSegments(res.segments);
      setSpinsToday(res.spinsToday);
      setDailySpinLimit(res.dailyLimit);
      setRemainingSpins(res.remainingSpins);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Referral Data
  const loadReferralData = async () => {
    if (!user) return;
    try {
      const res = await api.getReferrals();
      setReferralsData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Adsterra Direct Link Configurations
  const loadAdsterra = async () => {
    try {
      const res = await api.getAdsterraConfig();
      setAdsterraConfig(res);
    } catch (e) {
      console.error('Failed to load Adsterra config:', e);
    }
  };

  useEffect(() => {
    loadAdsterra();
  }, []);

  useEffect(() => {
    if (user) {
      loadVideoAds();
      loadSpinData();
      loadReferralData();
      loadAdsterra();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (watchAdTimerRef.current) clearInterval(watchAdTimerRef.current);
      if (spinAdTimerRef.current) clearInterval(spinAdTimerRef.current);
    };
  }, []);

  // -----------------------------------------------------------------
  // Watch & Earn Adsterra Direct Link Handlers
  // -----------------------------------------------------------------
  const handleStartWatchEarnDirectLink = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.startAdsterraSession({ taskType: 'watch_earn' });
      setWatchAdSession(res);
      setWatchAdCountdown(res.remainingSeconds !== undefined ? res.remainingSeconds : res.requiredDuration);
      setWatchAdClaimedReward(null);
      setWatchAdModalOpen(true);

      // Attempt opening direct link in new window/tab
      try {
        window.open(res.directLinkUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Window open blocked:', err);
      }

      if (watchAdTimerRef.current) clearInterval(watchAdTimerRef.current);
      let sec = res.remainingSeconds !== undefined ? res.remainingSeconds : res.requiredDuration;
      watchAdTimerRef.current = setInterval(() => {
        sec -= 1;
        setWatchAdCountdown(Math.max(0, sec));
        if (sec <= 0) {
          if (watchAdTimerRef.current) clearInterval(watchAdTimerRef.current);
        }
      }, 1000);
    } catch (err: any) {
      addToast(err.message || 'Could not start Watch & Earn session', 'error');
    }
  };

  const handleClaimWatchEarnReward = async () => {
    if (!watchAdSession) return;
    setWatchAdClaiming(true);
    try {
      const res = await api.verifyAdsterraSession(watchAdSession.sessionId);
      setWatchAdClaimedReward(res.reward || watchAdSession.reward);
      addToast(`Earned +${formatBDT(res.reward || watchAdSession.reward)} from Watch & Earn!`, 'success');
      await refreshUser();
    } catch (err: any) {
      addToast(err.message || 'Verification failed. Please complete the countdown first.', 'error');
    } finally {
      setWatchAdClaiming(false);
    }
  };

  const handleCloseWatchEarnModal = () => {
    if (watchAdTimerRef.current) clearInterval(watchAdTimerRef.current);
    if (!watchAdClaimedReward && watchAdSession) {
      api.abandonAdsterraSession(watchAdSession.sessionId).catch(() => {});
    }
    setWatchAdModalOpen(false);
    setWatchAdSession(null);
    setWatchAdCountdown(0);
    setWatchAdClaimedReward(null);
  };

  // -----------------------------------------------------------------
  // Spin Adsterra Direct Link Handlers
  // -----------------------------------------------------------------
  const handleSpinClick = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isSpinning || remainingSpins <= 0) return;

    // Check if Spin Adsterra Direct Link is enabled
    if (adsterraConfig?.spin?.enabled) {
      try {
        const res = await api.startAdsterraSession({ taskType: 'spin' });
        setSpinAdSession(res);
        setSpinAdCountdown(res.remainingSeconds !== undefined ? res.remainingSeconds : res.requiredDuration);
        setSpinAdVerified(false);
        setSpinAdModalOpen(true);

        // Open configured Spin Direct Link
        try {
          window.open(res.directLinkUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Spin direct link popup blocked:', e);
        }

        if (spinAdTimerRef.current) clearInterval(spinAdTimerRef.current);
        let sec = res.remainingSeconds !== undefined ? res.remainingSeconds : res.requiredDuration;
        spinAdTimerRef.current = setInterval(() => {
          sec -= 1;
          setSpinAdCountdown(Math.max(0, sec));
          if (sec <= 0) {
            if (spinAdTimerRef.current) clearInterval(spinAdTimerRef.current);
            // Automatic verification when timer reaches 0
            autoVerifySpinAd(res.sessionId);
          }
        }, 1000);
      } catch (err: any) {
        addToast(err.message || 'Could not initialize Spin Ad requirement', 'error');
      }
    } else {
      // Direct spin if spin ad is disabled
      executeSpin();
    }
  };

  const autoVerifySpinAd = async (sessionId: string) => {
    setSpinAdVerifying(true);
    try {
      const res = await api.verifyAdsterraSession(sessionId);
      if (res.success) {
        setSpinAdVerified(true);
        addToast('Ad verified! Lucky Spin is unlocked.', 'success');
      }
    } catch (err: any) {
      console.warn('Auto verify issue:', err);
    } finally {
      setSpinAdVerifying(false);
    }
  };

  const handleManualVerifySpinAd = async () => {
    if (!spinAdSession) return;
    setSpinAdVerifying(true);
    try {
      const res = await api.verifyAdsterraSession(spinAdSession.sessionId);
      if (res.success) {
        setSpinAdVerified(true);
        addToast('Ad requirement fulfilled! Ready to spin.', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Countdown not completed yet.', 'error');
    } finally {
      setSpinAdVerifying(false);
    }
  };

  const handleProceedToSpinFromModal = () => {
    if (!spinAdSession || !spinAdVerified) return;
    const sessId = spinAdSession.sessionId;
    setSpinAdModalOpen(false);
    setSpinAdSession(null);
    executeSpin(sessId);
  };

  const handleCloseSpinAdModal = () => {
    if (spinAdTimerRef.current) clearInterval(spinAdTimerRef.current);
    if (!spinAdVerified && spinAdSession) {
      api.abandonAdsterraSession(spinAdSession.sessionId).catch(() => {});
    }
    setSpinAdModalOpen(false);
    setSpinAdSession(null);
    setSpinAdCountdown(0);
    setSpinAdVerified(false);
  };

  // Execute Spin (Server-Authoritative)
  const executeSpin = async (sessionId?: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isSpinning || remainingSpins <= 0) return;

    setIsSpinning(true);
    setSpinWinResult(null);

    try {
      const res = await api.playSpin(sessionId);
      const numSegments = spinSegments.length || 6;
      const segmentArc = 360 / numSegments;
      // Calculate target angle to land on segment
      const targetSegmentCenter = res.segmentIndex * segmentArc + segmentArc / 2;
      // 5 full 360 rotations + target angle offset
      const newRotation = wheelRotation + 360 * 5 + (360 - (targetSegmentCenter % 360));
      setWheelRotation(newRotation);

      setTimeout(async () => {
        setIsSpinning(false);
        setSpinWinResult({ reward: res.reward, label: res.label });
        setSpinsToday(res.spinsToday);
        setRemainingSpins(res.remainingSpins);
        if (res.reward > 0) {
          addToast(`Won ${formatBDT(res.reward)} from Lucky Spin!`, 'success');
        } else {
          addToast('Better luck on your next spin!', 'info');
        }
        await refreshUser();
      }, 4000);
    } catch (err: any) {
      setIsSpinning(false);
      addToast(err.message || 'Spin failed', 'error');
    }
  };

  // Video Ad Watch Handler
  const handleStartWatchVideo = async (video: VideoAd) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.startVideoAd(video.id);
      setActiveVideo(video);
      setVideoSessionId(res.sessionId);
      setVideoCountdown(res.requiredDuration);
      setIsVideoWatching(true);
      setVideoClaimedReward(null);

      let currentSec = res.requiredDuration;
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      videoTimerRef.current = setInterval(() => {
        currentSec -= 1;
        setVideoCountdown(currentSec);
        if (currentSec <= 0) {
          if (videoTimerRef.current) clearInterval(videoTimerRef.current);
        }
      }, 1000);
    } catch (err: any) {
      addToast(err.message || 'Could not start video ad', 'error');
    }
  };

  const handleClaimVideoReward = async () => {
    if (!videoSessionId) return;
    try {
      const res = await api.claimVideoAd(videoSessionId);
      setVideoClaimedReward(res.reward);
      addToast(`Earned ${formatBDT(res.reward)} for watching video!`, 'success');
      await refreshUser();
      loadVideoAds();
    } catch (err: any) {
      addToast(err.message || 'Failed to claim video reward', 'error');
    }
  };

  const handleCloseVideoModal = () => {
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    setActiveVideo(null);
    setVideoSessionId(null);
    setIsVideoWatching(false);
    setVideoCountdown(0);
    setVideoClaimedReward(null);
  };

  // Copy referral utilities
  const handleCopyLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    addToast(`Referral code ${user.referralCode} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Sub Tabs */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setSubTab('video')}
          className={`flex-1 min-h-[44px] py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            subTab === 'video'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Watch & Earn</span>
        </button>
        <button
          onClick={() => setSubTab('spin')}
          className={`flex-1 min-h-[44px] py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            subTab === 'spin'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Disc3 className="w-4 h-4" />
          <span>Lucky Spin</span>
        </button>
        <button
          onClick={() => setSubTab('referral')}
          className={`flex-1 min-h-[44px] py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            subTab === 'referral'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Refer & Earn</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. WATCH & EARN (ADSTERRA DIRECT LINK & VIDEO ADS) */}
      {/* ============================================================== */}
      {subTab === 'video' && (
        <div className="space-y-5">
          {/* Adsterra Watch & Earn Direct Link Featured Card */}
          {adsterraConfig?.watchEarn && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">Watch &amp; Earn</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Adsterra Direct Link
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Visit the sponsored direct link, complete the mandatory countdown timer, and claim instant BDT.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Reward: {formatBDT(adsterraConfig.watchEarn.reward)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Required Timer: {adsterraConfig.watchEarn.timerSeconds}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-center shrink-0">
                  {adsterraConfig.watchEarn.enabled ? (
                    <button
                      onClick={handleStartWatchEarnDirectLink}
                      className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 fill-slate-950" />
                      <span>Watch Ad / Start</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 font-medium">
                      Direct Link Paused
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Commercial Video Ads</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Watch full duration commercials to unlock instant BDT rewards.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Today: </span>
              <span className="font-bold text-emerald-400 font-mono">
                {watchedToday}/{videoDailyLimit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoAds.map(ad => (
              <div
                key={ad.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{ad.title}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {ad.brand} · {ad.requiredDurationSeconds}s Required
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        +{formatBDT(ad.reward)}
                      </div>
                      <div className="text-[10px] text-slate-400">Per View</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{ad.viewsCount} views</span>
                  <button
                    onClick={() => handleStartWatchVideo(ad)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-semibold rounded-xl shadow-md transition-all"
                  >
                    <span>Watch Now</span>
                    <PlayCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Video Watching Modal */}
          {activeVideo && isVideoWatching && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl overflow-hidden text-center">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sponsored Stream Commercial</span>
                  </div>
                  <button
                    onClick={handleCloseVideoModal}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {videoClaimedReward ? (
                  <div className="py-6 space-y-4 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                      <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold">Reward Credited!</h3>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      +{formatBDT(videoClaimedReward)}
                    </div>
                    <button
                      onClick={handleCloseVideoModal}
                      className="min-h-[44px] px-6 py-2.5 bg-emerald-500 text-slate-950 font-semibold rounded-xl text-xs"
                    >
                      Close & Return
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-pulse">
                        <PlayCircle className="w-8 h-8" />
                      </div>
                      <div className="text-sm font-semibold text-white">{activeVideo.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{activeVideo.brand}</div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-300">
                        {videoCountdown > 0
                          ? `Required viewing: ${videoCountdown}s remaining`
                          : 'Viewing duration completed!'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimVideoReward}
                      disabled={videoCountdown > 0}
                      className={`w-full min-h-[48px] py-3 px-4 font-semibold rounded-xl text-sm transition-all ${
                        videoCountdown <= 0
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {videoCountdown <= 0
                        ? `Claim +${formatBDT(activeVideo.reward)} Reward`
                        : `Watching... (${videoCountdown}s)`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adsterra Watch & Earn Direct Link Modal Flow */}
          {watchAdModalOpen && watchAdSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl text-center space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Watch &amp; Earn Task</span>
                  </div>
                  <button
                    onClick={handleCloseWatchEarnModal}
                    className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {watchAdClaimedReward !== null ? (
                  <div className="py-6 space-y-4 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Task Completed!</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Your Adsterra session was authoritatively verified.
                      </p>
                    </div>
                    <div className="text-3xl font-bold font-mono text-emerald-400">
                      +{formatBDT(watchAdClaimedReward)}
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleCloseWatchEarnModal}
                        className="w-full min-h-[44px] py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
                      >
                        Claim &amp; Return
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Direct Link Status:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Opened in sponsor tab
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400">Task Reward:</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          +{formatBDT(watchAdSession.reward)}
                        </span>
                      </div>
                    </div>

                    {/* Pop-up blocked fallback link */}
                    <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-[11px]">If sponsor ad didn't open automatically:</span>
                      <a
                        href={watchAdSession.directLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold shrink-0"
                      >
                        <span>Open Ad ↗</span>
                      </a>
                    </div>

                    {/* Timer progress ring / display */}
                    <div className="py-4">
                      <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-full bg-slate-950 border-4 border-slate-800">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-1000"
                          style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${
                              watchAdCountdown === 0
                                ? '100% 0%, 100% 100%, 0% 100%, 0% 0%'
                                : '100% 0%'
                            })`,
                          }}
                        />
                        <div className="text-center z-10">
                          <div className="text-2xl font-bold font-mono text-white">
                            {watchAdCountdown}s
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {watchAdCountdown > 0 ? 'Remaining' : 'Ready'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {watchAdCountdown > 0 ? (
                        <span>
                          Please stay on the task flow until the required timer completes. Early exits and refreshed timers will be rejected.
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          Session duration verified! You can now claim your BDT reward.
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimWatchEarnReward}
                      disabled={watchAdCountdown > 0 || watchAdClaiming}
                      className={`w-full min-h-[48px] py-3 px-4 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
                        watchAdCountdown <= 0
                          ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-xl shadow-emerald-500/25 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {watchAdClaiming ? (
                        <span>Crediting Reward...</span>
                      ) : watchAdCountdown <= 0 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-slate-950" />
                          <span>Claim +{formatBDT(watchAdSession.reward)} Reward</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>Reward Locked ({watchAdCountdown}s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LUCKY SPIN & EARN */}
      {/* ============================================================== */}
      {subTab === 'spin' && (
        <div className="space-y-6">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Lucky Prize Wheel</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Spin daily for instant BDT cash directly credited to your balance.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Remaining: </span>
              <span className="font-bold text-emerald-400 font-mono">
                {remainingSpins}/{dailySpinLimit}
              </span>
            </div>
          </div>

          {/* Interactive Wheel Showcase */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Top Indicator Arrow */}
            <div className="relative z-20 -mb-3 text-emerald-400">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-emerald-400 drop-shadow-md" />
            </div>

            {/* Rotating Wheel Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4">
              <div
                className="w-full h-full rounded-full border-4 border-emerald-500/50 shadow-2xl shadow-emerald-950/60 overflow-hidden relative transition-transform duration-[4000ms] ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                {/* Visual Segments */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {spinSegments.map((seg, i) => {
                    const totalSegs = spinSegments.length;
                    const angle = 360 / totalSegs;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    return (
                      <path
                        key={seg.id}
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                        fill={seg.color || '#10B981'}
                        stroke="#0F172A"
                        strokeWidth="0.8"
                      />
                    );
                  })}
                </svg>

                {/* Segment Labels */}
                <div className="absolute inset-0">
                  {spinSegments.map((seg, i) => {
                    const totalSegs = spinSegments.length;
                    const angle = (360 / totalSegs) * i + (360 / totalSegs) / 2;
                    return (
                      <div
                        key={seg.id}
                        className="absolute w-full h-full flex justify-center text-[10px] font-bold text-white font-mono pointer-events-none drop-shadow"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '50% 50%',
                        }}
                      >
                        <span className="mt-4 transform -rotate-90">{seg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Center Medal Cap */}
              <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-900 border-4 border-emerald-400 flex items-center justify-center shadow-xl z-10 pointer-events-none">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            {/* Spin CTA Button */}
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || remainingSpins <= 0}
              className={`min-h-[48px] px-8 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-[0.98] flex items-center gap-2 ${
                isSpinning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : remainingSpins > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isSpinning ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Spinning Wheel...</span>
                </>
              ) : remainingSpins > 0 ? (
                <>
                  <Disc3 className="w-5 h-5" />
                  <span>SPIN NOW ({remainingSpins} Left)</span>
                </>
              ) : (
                <span>Daily Limit Reached</span>
              )}
            </button>

            {adsterraConfig?.spin?.enabled && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Sponsored Ad Session ({adsterraConfig.spin.timerSeconds}s) required before spin unlock</span>
              </div>
            )}

            {spinWinResult && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs text-center animate-in fade-in">
                {spinWinResult.reward > 0 ? (
                  <span>
                    🎉 You won <strong className="font-mono text-white text-sm">{formatBDT(spinWinResult.reward)}</strong>! Added to your balance.
                  </span>
                ) : (
                  <span>Better luck next time! Keep spinning to win cash prizes.</span>
                )}
              </div>
            )}
          </div>

          {/* Spin Adsterra Direct Link Modal Flow */}
          {spinAdModalOpen && spinAdSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl text-center space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Disc3 className="w-4 h-4" />
                    <span>Spin Ad Requirement</span>
                  </div>
                  <button
                    onClick={handleCloseSpinAdModal}
                    className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                    {spinAdVerified ? (
                      <Unlock className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <Lock className="w-7 h-7 text-amber-400 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {spinAdVerified ? 'Lucky Spin Unlocked!' : 'Complete Ad Session to Spin'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {spinAdVerified
                        ? 'Your sponsor session has been verified on the server. You can now spin the wheel!'
                        : `A sponsor direct link was opened in a new tab. Please complete the ${spinAdSession.requiredDuration}s session to unlock the wheel.`}
                    </p>
                  </div>

                  {/* Fallback button if popup blocked */}
                  {!spinAdVerified && (
                    <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-[11px]">If sponsor ad didn't open:</span>
                      <a
                        href={spinAdSession.directLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold shrink-0"
                      >
                        <span>Open Ad ↗</span>
                      </a>
                    </div>
                  )}

                  {/* Timer display */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">Countdown Status:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {spinAdCountdown > 0 ? `${spinAdCountdown}s remaining` : 'Timer Finished'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-1000"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((spinAdSession.requiredDuration - spinAdCountdown) /
                                spinAdSession.requiredDuration) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {spinAdVerified ? (
                    <button
                      type="button"
                      onClick={handleProceedToSpinFromModal}
                      className="w-full min-h-[48px] py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Disc3 className="w-5 h-5 text-slate-950" />
                      <span>SPIN LUCKY WHEEL NOW</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleManualVerifySpinAd}
                        disabled={spinAdCountdown > 0 || spinAdVerifying}
                        className={`w-full min-h-[48px] py-3 px-4 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
                          spinAdCountdown <= 0
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/25'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        {spinAdVerifying ? (
                          <span>Verifying with server...</span>
                        ) : spinAdCountdown <= 0 ? (
                          <span>Verify &amp; Unlock Spin</span>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span>Spin Locked ({spinAdCountdown}s)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REFER & EARN */}
      {/* ============================================================== */}
      {subTab === 'referral' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Invite Friends & Earn BDT</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share your referral link or code. Earn{' '}
                  <span className="text-emerald-400 font-semibold font-mono">
                    {referralsData?.commissionSetting.type === 'percentage'
                      ? `${referralsData?.commissionSetting.value}%`
                      : `৳${Number(referralsData?.commissionSetting.value ?? 10).toFixed(2)}`}
                  </span>{' '}
                  for each registered active member.
                </p>
              </div>
            </div>

            {/* Referral Stats Summary */}
            <div className="grid grid-cols-3 gap-3 my-6 text-center">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Referrals</div>
                <div className="text-lg font-bold text-white font-mono mt-1">
                  {referralsData?.totalReferrals ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Active Members</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {referralsData?.activeReferrals ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Commission</div>
                <div className="text-lg font-bold text-teal-400 font-mono mt-1">
                  {formatBDT(referralsData?.referralEarnings ?? 0)}
                </div>
              </div>
            </div>

            {/* Referral Code & Link Box */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Referral Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold font-mono text-emerald-400 uppercase tracking-widest">
                    {user?.referralCode || '------'}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Referral Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={user ? `${window.location.origin}/?ref=${user.referralCode}` : ''}
                    className="flex-1 px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="min-h-[44px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Invited Friends List */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <h4 className="text-sm font-bold text-white mb-3">Referred Members History</h4>
            {(!referralsData?.referredUsers || referralsData.referredUsers.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-500">
                You have not invited any members yet. Share your code to earn commissions!
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {referralsData.referredUsers.map(refUser => (
                  <div key={refUser.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">@{refUser.username}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Joined {new Date(refUser.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold">
                        {refUser.completedTasks} Tasks Done
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{refUser.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
