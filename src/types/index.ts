export interface SafeUser {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  balance: number;
  totalEarnings: number;
  todayEarnings: number;
  referralEarnings: number;
  referralCode: string;
  referredBy: string | null;
  completedTasks: number;
  status: 'active' | 'banned' | 'disabled';
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'superadmin';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number; // in BDT
  timerSeconds: number;
  dailyLimit: number;
  active: boolean;
  totalAttempts: number;
  completedTasks: number;
  rewardsDistributed: number;
  adText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'task_earning' | 'referral_earning' | 'video_ad_earning' | 'spin_reward' | 'withdrawal' | 'withdrawal_refund' | 'admin_adjustment';
  description: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  method: 'bKash' | 'Nagad' | 'USDT';
  accountNumber: string;
  network?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoAd {
  id: string;
  title: string;
  brand: string;
  videoUrl?: string;
  reward: number;
  requiredDurationSeconds: number;
  dailyLimit: number;
  active: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface SpinSegment {
  id: number;
  reward: number;
  label: string;
  weight: number;
  color: string;
}

export interface Advertisement {
  id: string;
  name: string;
  type: 'task_pre_ad' | 'video_ad' | 'social_bar' | 'popunder' | 'custom';
  code: string;
  status: 'active' | 'inactive';
  placement: string;
  priority: number;
  bannerTitle?: string;
  bannerSubtitle?: string;
  targetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  appName: string;
  currencySymbol: string;
  currencyCode: string;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  dailyTaskLimit: number;
  dailyVideoLimit: number;
  dailySpinLimit: number;
  referralCommissionType: 'fixed' | 'percentage';
  referralCommissionValue: number;
  maintenanceMode: boolean;
  userRegistrationEnabled: boolean;
  supportedMethods: string[];
}

export interface AdminLog {
  id: string;
  adminUsername: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalDistributedRewards: number;
  pendingWithdrawalsCount: number;
  totalWithdrawalsAmount: number;
  totalSpins: number;
  totalVideoViews: number;
}

export interface WatchEarnAdConfig {
  directLinkUrl: string;
  timerSeconds: number;
  reward: number; // in BDT
  enabled: boolean;
  updatedAt?: string;
}

export interface SpinAdConfig {
  directLinkUrl: string;
  timerSeconds: number;
  reward: number; // in BDT
  enabled: boolean;
  updatedAt?: string;
}

export interface AdsterraPublicConfig {
  watchEarn: WatchEarnAdConfig;
  spin: SpinAdConfig;
}

export interface AdEarningSession {
  id: string;
  userId: string;
  taskType: 'watch_earn' | 'spin';
  directLinkUrl: string;
  startTime: number;
  requiredDuration: number;
  completionTime?: number;
  reward: number;
  status: 'active' | 'completed' | 'claimed' | 'abandoned';
  createdAt: string;
}
