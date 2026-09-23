import React, { useState, useEffect, useRef } from 'react';
import { useAuth, formatBDT } from '../../context/AuthContext';
import type { Task, Advertisement } from '../../types';
import { api } from '../../api/client';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  ExternalLink,
  ShieldCheck,
  X,
  Lock,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

interface TasksTabProps {
  tasks: Task[];
  onRefreshTasks: () => void;
  onOpenAuth: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onRefreshTasks,
  onOpenAuth,
}) => {
  const { user, refreshUser, addToast } = useAuth();

  // Active Task Workflow State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalPhase, setTaskModalPhase] = useState<'idle' | 'ad_countdown' | 'ad_ready' | 'task_running' | 'task_finished' | 'claiming'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adContent, setAdContent] = useState<any>(null);

  // Timers
  const [adCountdown, setAdCountdown] = useState<number>(10);
  const [taskCountdown, setTaskCountdown] = useState<number>(0);
  const [claimRewardAmount, setClaimRewardAmount] = useState<number | null>(null);

  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const taskTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);
    };
  }, []);

  // 1. User clicks "Start Task"
  const handleInitiateTask = async (task: Task) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setSelectedTask(task);
      setTaskModalPhase('ad_countdown');
      setAdCountdown(10);
      setClaimRewardAmount(null);

      // Call server to initiate task session with mandatory 10s ad lock
      const res = await api.startTaskAd(task.id);
      setSessionId(res.sessionId);
      setAdContent(res.ad);

      // Start client 10s ad countdown
      let current = 10;
      if (adTimerRef.current) clearInterval(adTimerRef.current);

      adTimerRef.current = setInterval(() => {
        current -= 1;
        setAdCountdown(current);
        if (current <= 0) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          setTaskModalPhase('ad_ready'); // Unlock Start Task button
        }
      }, 1000);
    } catch (err: any) {
      addToast(err.message || 'Failed to start task ad', 'error');
      handleCloseModal();
    }
  };

  // 2. User clicks "Start Task" after 10s ad countdown finishes
  const handleStartTaskAfterAd = async () => {
    if (!sessionId || !selectedTask) return;
    try {
      // Validate ad completion on server (server checks real elapsed ms >= 10s)
      const res = await api.verifyTaskAd(sessionId);
      if (!res.taskStarted) {
        throw new Error('Server ad verification failed');
      }

      setTaskModalPhase('task_running');
      setTaskCountdown(res.timerSeconds);

      let currentSec = res.timerSeconds;
      if (taskTimerRef.current) clearInterval(taskTimerRef.current);

      taskTimerRef.current = setInterval(() => {
        currentSec -= 1;
        setTaskCountdown(currentSec);
        if (currentSec <= 0) {
          if (taskTimerRef.current) clearInterval(taskTimerRef.current);
          setTaskModalPhase('task_finished');
        }
      }, 1000);
    } catch (err: any) {
      addToast(err.message || 'Ad requirement was not met. Task locked.', 'error');
      handleCloseModal();
    }
  };

  // 3. User claims reward after task timer completes
  const handleClaimReward = async () => {
    if (!sessionId || !selectedTask) return;
    setTaskModalPhase('claiming');
    try {
      const res = await api.claimTask(sessionId);
      setClaimRewardAmount(res.reward);
      addToast(`Congratulations! ${formatBDT(res.reward)} credited to your wallet!`, 'success');
      await refreshUser();
      onRefreshTasks();
    } catch (err: any) {
      addToast(err.message || 'Failed to claim task reward', 'error');
      handleCloseModal();
    }
  };

  // Cancel or close modal
  const handleCloseModal = () => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    if (taskTimerRef.current) clearInterval(taskTimerRef.current);
    setSelectedTask(null);
    setTaskModalPhase('idle');
    setSessionId(null);
    setAdCountdown(10);
    setTaskCountdown(0);
    setClaimRewardAmount(null);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Timer Task Central</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete sponsored visits and earn instant BDT. All tasks are protected by anti-cheat verification.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Server-Verified Rewards</span>
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.filter(t => t.active).map(task => (
          <div
            key={task.id}
            className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-5 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
          >
            <div>
              {/* Task Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{task.timerSeconds}s timer</span>
                      <span aria-hidden="true">·</span>
                      <span>Daily limit {task.dailyLimit}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                    +{formatBDT(task.reward)}
                  </div>
                  <div className="text-[10px] text-slate-400">BDT Reward</div>
                </div>
              </div>

              {/* Task Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {task.description}
              </p>

              {task.adText && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 mb-4 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{task.adText}</span>
                </div>
              )}
            </div>

            {/* Task Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono">
                {task.completedTasks} completions
              </div>
              <button
                onClick={() => handleInitiateTask(task)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                <span>Start Task</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No tasks currently available. Please check back shortly as admin publishes new campaigns!
        </div>
      )}

      {/* ========================================================== */}
      {/* MANDATORY 10-SECOND AD & TIMER TASK MODAL */}
      {/* ========================================================== */}
      {selectedTask && taskModalPhase !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {taskModalPhase === 'ad_countdown' || taskModalPhase === 'ad_ready'
                    ? 'Mandatory Sponsor Advertisement'
                    : 'Active Task Timer Session'}
                </span>
              </div>
              {/* If user closes during countdown, task is locked and session ends */}
              <button
                onClick={handleCloseModal}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Cancel & Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ================= PHASE 1 & 2: 10s MANDATORY ADVERTISEMENT COUNTDOWN ================= */}
            {(taskModalPhase === 'ad_countdown' || taskModalPhase === 'ad_ready') && (
              <div className="space-y-5">
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {selectedTask.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reward: <span className="text-emerald-400 font-bold font-mono">+{formatBDT(selectedTask.reward)}</span>. Complete the mandatory 10-second sponsor ad to unlock this task.
                  </p>
                </div>

                {/* ADVERTISEMENT CONTAINER */}
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-slate-950 p-5 text-center relative overflow-hidden shadow-inner">
                  {adContent?.code ? (
                    <div
                      className="text-xs text-slate-300"
                      dangerouslySetInnerHTML={{ __html: adContent.code }}
                    />
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Sponsored Advertisement
                      </div>
                      <h4 className="text-base font-bold text-white">
                        {adContent?.bannerTitle || 'Exclusive Bangladesh Partner Offer'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {adContent?.bannerSubtitle || 'Explore premium digital services and mobile recharge offers with instant cashback.'}
                      </p>
                    </div>
                  )}

                  {/* 10-SECOND COUNTDOWN DISPLAY */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col items-center justify-center">
                    {taskModalPhase === 'ad_countdown' ? (
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1.5 animate-pulse">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Advertisement Loading: Task Locked</span>
                        </div>
                        {/* Countdown circle */}
                        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-400 flex items-center justify-center text-2xl font-bold font-mono text-amber-400 animate-spin-slow">
                          {adCountdown}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          Remaining ad view time: {adCountdown}s
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-2">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          Advertisement Requirement Satisfied!
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          "Start Task" button has unlocked below
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Notice */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Closing or refreshing before the 10-second countdown finishes will discard the session and keep the task locked.
                  </span>
                </div>

                {/* START TASK BUTTON (LOCKED UNTIL COUNTDOWN FINISHES) */}
                <button
                  type="button"
                  onClick={handleStartTaskAfterAd}
                  disabled={taskModalPhase !== 'ad_ready'}
                  className={`w-full min-h-[48px] py-3 px-4 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                    taskModalPhase === 'ad_ready'
                      ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  {taskModalPhase === 'ad_ready' ? (
                    <>
                      <span>Start Task Timer ({selectedTask.timerSeconds}s)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Locked until Ad finishes ({adCountdown}s)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ================= PHASE 3 & 4: TASK RUNNING & CLAIM ================= */}
            {(taskModalPhase === 'task_running' || taskModalPhase === 'task_finished' || taskModalPhase === 'claiming') && (
              <div className="space-y-6 text-center">
                {claimRewardAmount ? (
                  /* Success Claim View */
                  <div className="py-6 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40">
                      <Award className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Task Reward Credited!</h3>
                      <div className="text-3xl font-bold font-mono text-emerald-400 my-2">
                        +{formatBDT(claimRewardAmount)}
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Your balance has been updated successfully on the server. Transaction logged.
                      </p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="min-h-[44px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs shadow-md transition-all"
                    >
                      Done & Return to Tasks
                    </button>
                  </div>
                ) : (
                  /* Active Timer View */
                  <>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Please review the partner guidelines below while the countdown timer runs. Do not refresh or exit.
                      </p>
                    </div>

                    {/* Circular Task Timer */}
                    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                      <div className="w-full h-full rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin-slow" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold font-mono text-emerald-400 tabular-nums">
                          {taskCountdown}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Seconds left</span>
                      </div>
                    </div>

                    {/* Task Content Card */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                      <div className="text-slate-300 font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Sponsor Inspection Task</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        {selectedTask.description}
                      </p>
                    </div>

                    {/* Claim Button */}
                    <button
                      type="button"
                      onClick={handleClaimReward}
                      disabled={taskModalPhase !== 'task_finished'}
                      className={`w-full min-h-[48px] py-3 px-4 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                        taskModalPhase === 'task_finished'
                          ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      {taskModalPhase === 'claiming' ? (
                        <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : taskModalPhase === 'task_finished' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Claim +{formatBDT(selectedTask.reward)} Reward</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Task in progress ({taskCountdown}s remaining)</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
