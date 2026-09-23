import type {
  SafeUser,
  AdminUser,
  Task,
  Transaction,
  Withdrawal,
  VideoAd,
  SpinSegment,
  Advertisement,
  SystemSettings,
  AdminStats,
  AdminLog,
  AdsterraPublicConfig,
  WatchEarnAdConfig,
  SpinAdConfig
} from '../types';

const USER_TOKEN_KEY = 'taka_user_token';
const ADMIN_TOKEN_KEY = 'taka_admin_token';

export const authStorage = {
  getUserToken: () => localStorage.getItem(USER_TOKEN_KEY),
  setUserToken: (token: string) => localStorage.setItem(USER_TOKEN_KEY, token),
  clearUserToken: () => localStorage.removeItem(USER_TOKEN_KEY),

  getAdminToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setAdminToken: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearAdminToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, isAdmin = false): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = isAdmin ? authStorage.getAdminToken() : authStorage.getUserToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // User Auth
  register: (payload: { username: string; password: string; email?: string; phone?: string; referralCode?: string }) =>
    apiFetch<{ token: string; user: SafeUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { username: string; password: string }) =>
    apiFetch<{ token: string; user: SafeUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  quickStart: () =>
    apiFetch<{ token: string; user: SafeUser }>('/api/auth/quick-start', {
      method: 'POST',
    }),

  getMe: () =>
    apiFetch<{ user: SafeUser; system: Partial<SystemSettings> }>('/api/auth/me'),

  logoutUser: () =>
    apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Tasks
  getTasks: () =>
    apiFetch<{ tasks: Task[]; dailyCompletedCount: number; dailyLimit: number }>('/api/tasks'),

  startTaskAd: (taskId: string) =>
    apiFetch<{ sessionId: string; adRequiredSeconds: number; ad: any }>('/api/tasks/start-ad', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  verifyTaskAd: (sessionId: string) =>
    apiFetch<{ success: boolean; taskStarted: boolean; timerSeconds: number; remainingSeconds: number }>(
      '/api/tasks/verify-ad',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    ),

  claimTask: (sessionId: string) =>
    apiFetch<{ success: boolean; reward: number; newBalance: number; transactionId: string }>(
      '/api/tasks/claim',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    ),

  // Video Ads
  getVideoAds: () =>
    apiFetch<{ videoAds: VideoAd[]; watchedToday: number; dailyLimit: number }>('/api/video-ads'),

  startVideoAd: (videoAdId: string) =>
    apiFetch<{ sessionId: string; requiredDuration: number }>('/api/video-ads/start', {
      method: 'POST',
      body: JSON.stringify({ videoAdId }),
    }),

  claimVideoAd: (sessionId: string) =>
    apiFetch<{ success: boolean; reward: number; newBalance: number; transactionId: string }>(
      '/api/video-ads/claim',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    ),

  // Spin
  getSpinData: () =>
    apiFetch<{ segments: SpinSegment[]; spinsToday: number; dailyLimit: number; remainingSpins: number }>('/api/spin'),

  playSpin: (sessionId?: string) =>
    apiFetch<{ segmentIndex: number; reward: number; label: string; newBalance: number; spinsToday: number; remainingSpins: number }>(
      '/api/spin/play',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    ),

  // Adsterra Direct Link (Watch & Earn and Spin)
  getAdsterraConfig: () =>
    apiFetch<AdsterraPublicConfig>('/api/adsterra/config'),

  startAdsterraSession: (payload: { taskType: 'watch_earn' | 'spin' }) =>
    apiFetch<{
      sessionId: string;
      directLinkUrl: string;
      requiredDuration: number;
      reward: number;
      startTime: number;
      remainingSeconds?: number;
    }>('/api/adsterra/session/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyAdsterraSession: (sessionId: string) =>
    apiFetch<{
      success: boolean;
      reward?: number;
      newBalance?: number;
      status: string;
      message?: string;
    }>('/api/adsterra/session/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  abandonAdsterraSession: (sessionId: string) =>
    apiFetch<{ success: boolean }>('/api/adsterra/session/abandon', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  // Wallet & Withdrawals
  getWithdrawals: () =>
    apiFetch<{
      withdrawals: Withdrawal[];
      balance: number;
      minWithdrawal: number;
      maxWithdrawal: number;
      feePercent: number;
      supportedMethods: string[];
    }>('/api/withdrawals'),

  requestWithdrawal: (payload: { method: string; accountNumber: string; amount: number; network?: string }) =>
    apiFetch<{ success: boolean; withdrawal: Withdrawal; newBalance: number }>('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Transactions & Referrals
  getTransactions: () =>
    apiFetch<{ transactions: Transaction[] }>('/api/transactions'),

  getReferrals: () =>
    apiFetch<{
      referralCode: string;
      totalReferrals: number;
      activeReferrals: number;
      referralEarnings: number;
      commissionSetting: { type: string; value: number };
      referredUsers: Array<{ id: string; username: string; status: string; completedTasks: number; joinedAt: string }>;
    }>('/api/referrals'),

  getActiveAds: () =>
    apiFetch<{ ads: Advertisement[] }>('/api/ads/active'),

  // ================= ADMIN APIs =================
  adminLogin: (payload: { username: string; password: string }) =>
    apiFetch<{ token: string; admin: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true),

  getAdminMe: () =>
    apiFetch<{ admin: AdminUser }>('/api/admin/me', {}, true),

  adminLogout: () =>
    apiFetch<{ success: boolean }>('/api/admin/logout', { method: 'POST' }, true),

  getAdminStats: () =>
    apiFetch<AdminStats>('/api/admin/stats', {}, true),

  // Admin Tasks
  getAdminTasks: () =>
    apiFetch<{ tasks: Task[] }>('/api/admin/tasks', {}, true),

  createAdminTask: (task: Partial<Task>) =>
    apiFetch<{ success: boolean; task: Task }>('/api/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }, true),

  updateAdminTask: (id: string, task: Partial<Task>) =>
    apiFetch<{ success: boolean; task: Task }>(`/api/admin/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }, true),

  deleteAdminTask: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/tasks/${id}`, {
      method: 'DELETE',
    }, true),

  // Admin Users
  getAdminUsers: () =>
    apiFetch<{ users: SafeUser[] }>('/api/admin/users', {}, true),

  adjustUserBalance: (userId: string, payload: { type: 'add' | 'deduct'; amount: number; reason: string }) =>
    apiFetch<{ success: boolean; user: SafeUser; transactionId: string }>(
      `/api/admin/users/${userId}/adjust-balance`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    ),

  updateUserStatus: (userId: string, payload: { status: 'active' | 'banned' | 'disabled'; reason?: string }) =>
    apiFetch<{ success: boolean; user: SafeUser }>(
      `/api/admin/users/${userId}/status`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    ),

  // Admin Withdrawals
  getAdminWithdrawals: () =>
    apiFetch<{ withdrawals: Withdrawal[] }>('/api/admin/withdrawals', {}, true),

  actionWithdrawal: (id: string, payload: { action: 'approve' | 'complete' | 'processing' | 'reject'; reason?: string; note?: string }) =>
    apiFetch<{ success: boolean; withdrawal: Withdrawal }>(
      `/api/admin/withdrawals/${id}/action`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    ),

  // Admin Video Ads
  getAdminVideoAds: () =>
    apiFetch<{ videoAds: VideoAd[] }>('/api/admin/video-ads', {}, true),

  createAdminVideoAd: (ad: Partial<VideoAd>) =>
    apiFetch<{ success: boolean; videoAd: VideoAd }>('/api/admin/video-ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    }, true),

  updateAdminVideoAd: (id: string, ad: Partial<VideoAd>) =>
    apiFetch<{ success: boolean; videoAd: VideoAd }>(`/api/admin/video-ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    }, true),

  deleteAdminVideoAd: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/video-ads/${id}`, {
      method: 'DELETE',
    }, true),

  // Admin Spin
  getAdminSpin: () =>
    apiFetch<{ segments: SpinSegment[]; dailyLimit: number; totalSpins: number }>('/api/admin/spin', {}, true),

  updateAdminSpin: (payload: { segments?: SpinSegment[]; dailyLimit?: number }) =>
    apiFetch<{ success: boolean; segments: SpinSegment[]; dailyLimit: number }>('/api/admin/spin', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true),

  // Admin Ads
  getAdminAds: () =>
    apiFetch<{ advertisements: Advertisement[] }>('/api/admin/advertisements', {}, true),

  createAdminAd: (ad: Partial<Advertisement>) =>
    apiFetch<{ success: boolean; advertisement: Advertisement }>('/api/admin/advertisements', {
      method: 'POST',
      body: JSON.stringify(ad),
    }, true),

  updateAdminAd: (id: string, ad: Partial<Advertisement>) =>
    apiFetch<{ success: boolean; advertisement: Advertisement }>(`/api/admin/advertisements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    }, true),

  deleteAdminAd: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/advertisements/${id}`, {
      method: 'DELETE',
    }, true),

  // Admin Adsterra Direct Link (Separate Watch & Earn and Spin)
  getAdminAdsterra: () =>
    apiFetch<AdsterraPublicConfig>('/api/admin/adsterra', {}, true),

  updateAdminWatchEarnAd: (config: Partial<WatchEarnAdConfig>) =>
    apiFetch<{ success: boolean; watchEarn: WatchEarnAdConfig }>('/api/admin/adsterra/watch-earn', {
      method: 'PUT',
      body: JSON.stringify(config),
    }, true),

  updateAdminSpinAd: (config: Partial<SpinAdConfig>) =>
    apiFetch<{ success: boolean; spin: SpinAdConfig }>('/api/admin/adsterra/spin', {
      method: 'PUT',
      body: JSON.stringify(config),
    }, true),

  // Admin Settings
  getAdminSettings: () =>
    apiFetch<{ settings: SystemSettings }>('/api/admin/settings', {}, true),

  updateAdminSettings: (settings: Partial<SystemSettings>) =>
    apiFetch<{ success: boolean; settings: SystemSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }, true),

  // Admin Logs
  getAdminLogs: () =>
    apiFetch<{ logs: AdminLog[] }>('/api/admin/logs', {}, true),
};
