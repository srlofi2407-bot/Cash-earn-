import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory & database file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utility
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
}

// Database schema interfaces
interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  email?: string;
  phone?: string;
  balance: number;
  totalEarnings: number;
  todayEarnings: number;
  lastEarningsDate: string;
  referralEarnings: number;
  referralCode: string;
  referredBy: string | null;
  completedTasks: number;
  status: 'active' | 'banned' | 'disabled';
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: 'superadmin';
  createdAt: string;
}

interface Task {
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

interface TaskSession {
  id: string;
  userId: string;
  taskId: string;
  adStartedAt: number; // ms
  adRequiredSeconds: number;
  adCompletedAt: number | null;
  taskStartedAt: number | null;
  taskDurationSeconds: number;
  completedAt: number | null;
  status: 'ad_watching' | 'ad_completed' | 'task_running' | 'completed' | 'abandoned';
}

interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'task_earning' | 'referral_earning' | 'video_ad_earning' | 'spin_reward' | 'withdrawal' | 'withdrawal_refund' | 'admin_adjustment';
  description: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
}

interface Withdrawal {
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

interface VideoAd {
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

interface VideoSession {
  id: string;
  userId: string;
  videoAdId: string;
  startedAt: number;
  durationSeconds: number;
  completed: boolean;
}

interface SpinRecord {
  id: string;
  userId: string;
  reward: number;
  date: string;
  createdAt: string;
}

interface SpinSegment {
  id: number;
  reward: number;
  label: string;
  weight: number;
  color: string;
}

interface Advertisement {
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

interface SystemSettings {
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

interface AdminLog {
  id: string;
  adminUsername: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

interface AdsterraDirectLinkConfig {
  directLinkUrl: string;
  timerSeconds: number;
  reward: number;
  enabled: boolean;
  updatedAt: string;
}

interface AdsterraSettings {
  watchEarn: AdsterraDirectLinkConfig;
  spin: AdsterraDirectLinkConfig;
}

interface AdEarningSession {
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

interface Database {
  users: User[];
  admins: Admin[];
  tasks: Task[];
  taskSessions: TaskSession[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  videoAds: VideoAd[];
  videoSessions: VideoSession[];
  spins: SpinRecord[];
  spinSegments: SpinSegment[];
  advertisements: Advertisement[];
  systemSettings: SystemSettings;
  adminLogs: AdminLog[];
  adsterraSettings: AdsterraSettings;
  adEarningSessions: AdEarningSession[];
}

// Initial DB template
const defaultAdminHash = hashPassword('hexor@07');
const defaultUserHash = hashPassword('user123');

const initialDb: Database = {
  users: [
    {
      id: 'usr_demo_01',
      username: 'rahman_bd',
      passwordHash: defaultUserHash.hash,
      salt: defaultUserHash.salt,
      email: 'rahman@example.com',
      phone: '01712345678',
      balance: 145.50,
      totalEarnings: 320.00,
      todayEarnings: 45.00,
      lastEarningsDate: new Date().toISOString().slice(0, 10),
      referralEarnings: 60.00,
      referralCode: 'TK9981',
      referredBy: null,
      completedTasks: 14,
      status: 'active',
      lastActivity: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  admins: [
    {
      id: 'adm_01',
      username: 'srnoman2407',
      passwordHash: defaultAdminHash.hash,
      salt: defaultAdminHash.salt,
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    }
  ],
  tasks: [
    {
      id: 'task_01',
      title: 'Complete Sponsored Website Visit',
      description: 'Visit our premium partner website, explore the home services page, and wait for verification timer to earn instant BDT.',
      reward: 5.00,
      timerSeconds: 20,
      dailyLimit: 10,
      active: true,
      totalAttempts: 142,
      completedTasks: 128,
      rewardsDistributed: 640.00,
      adText: 'Exclusive 50% discount on tech gadgets with Bkash cashback!',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_02',
      title: 'Financial App Review & Survey Check',
      description: 'Read the fintech survey checklist and review the newest mobile banking security guidelines.',
      reward: 8.50,
      timerSeconds: 30,
      dailyLimit: 5,
      active: true,
      totalAttempts: 95,
      completedTasks: 89,
      rewardsDistributed: 756.50,
      adText: 'Open a high-yield digital deposit account in 2 minutes.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_03',
      title: 'Tech Gadget Feature Article Read',
      description: 'Browse the latest smartphone releases in Bangladesh and scroll through the specs comparison table.',
      reward: 4.00,
      timerSeconds: 15,
      dailyLimit: 15,
      active: true,
      totalAttempts: 210,
      completedTasks: 198,
      rewardsDistributed: 792.00,
      adText: 'Grab genuine mobile accessories at guaranteed lowest price.',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_04',
      title: 'E-commerce Flash Deal Explorer',
      description: 'Review trending lifestyle products and verify today promo voucher availability.',
      reward: 10.00,
      timerSeconds: 40,
      dailyLimit: 3,
      active: true,
      totalAttempts: 70,
      completedTasks: 62,
      rewardsDistributed: 620.00,
      adText: 'Eid Special Megadeals - Free delivery all over Bangladesh.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  taskSessions: [],
  transactions: [
    {
      id: 'TXN-90214',
      userId: 'usr_demo_01',
      username: 'rahman_bd',
      amount: 45.00,
      type: 'task_earning',
      description: 'Completed 6 sponsored timer tasks',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'TXN-88120',
      userId: 'usr_demo_01',
      username: 'rahman_bd',
      amount: 15.00,
      type: 'referral_earning',
      description: 'Referral commission from new active member',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'TXN-79401',
      userId: 'usr_demo_01',
      username: 'rahman_bd',
      amount: 100.00,
      type: 'withdrawal',
      description: 'bKash cashout payout completed',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ],
  withdrawals: [
    {
      id: 'WTH-79401',
      userId: 'usr_demo_01',
      username: 'rahman_bd',
      method: 'bKash',
      accountNumber: '01712345678',
      amount: 100.00,
      fee: 2.00,
      netAmount: 98.00,
      status: 'completed',
      adminNote: 'TrxID: 9JL34K90 sent via bKash Merchant',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    }
  ],
  videoAds: [
    {
      id: 'vid_01',
      title: 'Digital Banking Security Spotlight',
      brand: 'Nexus Pay & Bkash Security',
      reward: 3.50,
      requiredDurationSeconds: 15,
      dailyLimit: 5,
      active: true,
      viewsCount: 164,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'vid_02',
      title: 'Global Freelance & Tech Careers',
      brand: 'Future Skills BD',
      reward: 5.00,
      requiredDurationSeconds: 20,
      dailyLimit: 4,
      active: true,
      viewsCount: 120,
      createdAt: new Date().toISOString(),
    }
  ],
  videoSessions: [],
  spins: [],
  spinSegments: [
    { id: 0, reward: 0, label: '৳0 (Try Again)', weight: 20, color: '#64748B' },
    { id: 1, reward: 1, label: '৳1.00', weight: 35, color: '#0EA5E9' },
    { id: 2, reward: 2, label: '৳2.00', weight: 20, color: '#10B981' },
    { id: 3, reward: 5, label: '৳5.00', weight: 15, color: '#F59E0B' },
    { id: 4, reward: 10, label: '৳10.00 Jack!', weight: 8, color: '#8B5CF6' },
    { id: 5, reward: 20, label: '৳20.00 Mega!', weight: 2, color: '#EF4444' },
  ],
  advertisements: [
    {
      id: 'ad_pre_task',
      name: 'Adsterra 10s Task Sponsor',
      type: 'task_pre_ad',
      code: '<div class="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center"><p class="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">Sponsored Advertisement</p><h4 class="text-sm font-bold text-white">Boost Your Tech Skills with Certified Bootcamps</h4><p class="text-xs text-slate-300 mt-1">Get up to 70% scholarship for computer science and AI courses.</p></div>',
      status: 'active',
      placement: 'Pre-Task Modal (Mandatory 10s Countdown)',
      priority: 1,
      bannerTitle: 'Top Rated Tech Courses in Bangladesh',
      bannerSubtitle: 'Instant enrollment with 0% interest EMI on all cards',
      targetUrl: 'https://example.com/sponsor-deals',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ad_social_bar',
      name: 'Social Bar Reward Banner',
      type: 'social_bar',
      code: '<div class="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg flex items-center justify-between text-xs font-medium"><span class="flex items-center gap-2">🔥 Weekend Mega Cash Bonanza active!</span><span class="underline">View Offers</span></div>',
      status: 'active',
      placement: 'User Dashboard Top Bar',
      priority: 1,
      bannerTitle: 'Weekend Bonanza',
      targetUrl: 'https://example.com/bonanza',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ad_video_sponsor',
      name: 'Video Ad Interstitial',
      type: 'video_ad',
      code: '<div class="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-slate-300 text-sm">Sponsored Video Commercial Stream</div>',
      status: 'active',
      placement: 'Video Ads Section',
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  systemSettings: {
    appName: 'TakaRewards',
    currencySymbol: '৳',
    currencyCode: 'BDT',
    minWithdrawal: 50.00,
    maxWithdrawal: 10000.00,
    withdrawalFeePercent: 2.0,
    dailyTaskLimit: 20,
    dailyVideoLimit: 10,
    dailySpinLimit: 5,
    referralCommissionType: 'fixed',
    referralCommissionValue: 10.00,
    maintenanceMode: false,
    userRegistrationEnabled: true,
    supportedMethods: ['bKash', 'Nagad', 'USDT']
  },
  adminLogs: [
    {
      id: 'log_01',
      adminUsername: 'srnoman2407',
      action: 'SYSTEM_INITIALIZED',
      target: 'System Settings',
      details: 'Initial system boot and security policies set.',
      createdAt: new Date().toISOString()
    }
  ],
  adsterraSettings: {
    watchEarn: {
      directLinkUrl: 'https://www.highrevenuegate.com/example-watch-direct-link',
      timerSeconds: 15,
      reward: 1.50,
      enabled: true,
      updatedAt: new Date().toISOString()
    },
    spin: {
      directLinkUrl: 'https://www.highrevenuegate.com/example-spin-direct-link',
      timerSeconds: 10,
      reward: 1.00,
      enabled: true,
      updatedAt: new Date().toISOString()
    }
  },
  adEarningSessions: []
};

// Database loader and saver
let db: Database;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);

    // Initialize Adsterra settings if not present
    if (!db.adsterraSettings) {
      db.adsterraSettings = {
        watchEarn: {
          directLinkUrl: 'https://www.highrevenuegate.com/example-watch-direct-link',
          timerSeconds: 15,
          reward: 1.50,
          enabled: true,
          updatedAt: new Date().toISOString()
        },
        spin: {
          directLinkUrl: 'https://www.highrevenuegate.com/example-spin-direct-link',
          timerSeconds: 10,
          reward: 1.00,
          enabled: true,
          updatedAt: new Date().toISOString()
        }
      };
      saveDb();
    } else {
      // Ensure both sections exist independently
      if (!db.adsterraSettings.watchEarn) {
        db.adsterraSettings.watchEarn = {
          directLinkUrl: 'https://www.highrevenuegate.com/example-watch-direct-link',
          timerSeconds: 15,
          reward: 1.50,
          enabled: true,
          updatedAt: new Date().toISOString()
        };
        saveDb();
      }
      if (!db.adsterraSettings.spin) {
        db.adsterraSettings.spin = {
          directLinkUrl: 'https://www.highrevenuegate.com/example-spin-direct-link',
          timerSeconds: 10,
          reward: 1.00,
          enabled: true,
          updatedAt: new Date().toISOString()
        };
        saveDb();
      }
    }

    if (!db.adEarningSessions) {
      db.adEarningSessions = [];
      saveDb();
    }

    // Ensure admin srnoman2407 always exists with secure hash of hexor@07
    const existingAdmin = db.admins.find(a => a.username === 'srnoman2407');
    if (!existingAdmin) {
      db.admins.push({
        id: 'adm_01',
        username: 'srnoman2407',
        passwordHash: defaultAdminHash.hash,
        salt: defaultAdminHash.salt,
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      });
      saveDb();
    } else {
      if (!verifyPassword('hexor@07', existingAdmin.passwordHash, existingAdmin.salt)) {
        const freshHash = hashPassword('hexor@07');
        existingAdmin.passwordHash = freshHash.hash;
        existingAdmin.salt = freshHash.salt;
        saveDb();
      }
    }
  } else {
    db = initialDb;
    saveDb();
  }
} catch (e) {
  console.error('Error loading db file, using initial memory state:', e);
  db = initialDb;
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

// In-memory sessions
const userSessions = new Map<string, { userId: string; createdAt: number }>();
const adminSessions = new Map<string, { adminId: string; username: string; createdAt: number }>();

// Helper to sanitize User before sending to client
function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Helper to round to 2 decimals
function roundMoney(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Today string YYYY-MM-DD
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Express app initialization
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Middlewares
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  const session = userSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Your account has been suspended by administration' });
  }
  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Your account is currently disabled' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const token = authHeader.split(' ')[1];
  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Admin session expired or invalid' });
  }
  const admin = db.admins.find(a => a.id === session.adminId);
  if (!admin) {
    return res.status(401).json({ error: 'Admin not found' });
  }
  (req as any).admin = admin;
  next();
}

// -------------------------------------------------------------
// PUBLIC / USER AUTH ROUTES
// -------------------------------------------------------------

// Register user
app.post('/api/auth/register', (req, res) => {
  if (!db.systemSettings.userRegistrationEnabled) {
    return res.status(403).json({ error: 'New user registrations are currently disabled by admin.' });
  }

  const { username, password, email, phone, referralCode } = req.body;
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  let referredByUserId: string | null = null;
  if (referralCode && typeof referralCode === 'string') {
    const referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.trim().toLowerCase());
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUserId = 'usr_' + crypto.randomBytes(6).toString('hex');
  const userRefCode = 'TK' + Math.floor(1000 + Math.random() * 9000);

  const newUser: User = {
    id: newUserId,
    username: cleanUsername,
    passwordHash: hash,
    salt,
    email: email ? String(email).trim() : undefined,
    phone: phone ? String(phone).trim() : undefined,
    balance: 10.00, // Welcome signup bonus
    totalEarnings: 10.00,
    todayEarnings: 10.00,
    lastEarningsDate: getTodayStr(),
    referralEarnings: 0,
    referralCode: userRefCode,
    referredBy: referredByUserId,
    completedTasks: 0,
    status: 'active',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Add welcome bonus transaction
  db.transactions.push({
    id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
    userId: newUser.id,
    username: newUser.username,
    amount: 10.00,
    type: 'task_earning',
    description: 'Welcome Signup Bonus Credited',
    status: 'completed',
    createdAt: new Date().toISOString()
  });

  // If referred, process referral
  if (referredByUserId) {
    const referrer = db.users.find(u => u.id === referredByUserId);
    if (referrer) {
      const commissionType = db.systemSettings.referralCommissionType;
      const commissionVal = db.systemSettings.referralCommissionValue;
      const earned = commissionType === 'percentage' ? roundMoney(10 * (commissionVal / 100)) : roundMoney(commissionVal);
      
      referrer.balance = roundMoney(referrer.balance + earned);
      referrer.referralEarnings = roundMoney(referrer.referralEarnings + earned);
      referrer.totalEarnings = roundMoney(referrer.totalEarnings + earned);

      db.transactions.push({
        id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
        userId: referrer.id,
        username: referrer.username,
        amount: earned,
        type: 'referral_earning',
        description: `Referral bonus for inviting @${newUser.username}`,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    }
  }

  saveDb();

  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, { userId: newUser.id, createdAt: Date.now() });

  return res.json({
    token,
    user: sanitizeUser(newUser)
  });
});

// Login user
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || !verifyPassword(String(password), user.passwordHash, user.salt)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Your account has been banned. Contact admin.' });
  }
  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Your account is disabled.' });
  }

  user.lastActivity = new Date().toISOString();
  saveDb();

  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, { userId: user.id, createdAt: Date.now() });

  return res.json({
    token,
    user: sanitizeUser(user)
  });
});

// Quick guest demo login (creates temporary registered user for instant evaluation)
app.post('/api/auth/quick-start', (req, res) => {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const cleanUsername = 'taka_user' + randomSuffix;
  const { hash, salt } = hashPassword('demoPass123');
  const userRefCode = 'TK' + Math.floor(1000 + Math.random() * 9000);

  const newUser: User = {
    id: 'usr_' + crypto.randomBytes(6).toString('hex'),
    username: cleanUsername,
    passwordHash: hash,
    salt,
    balance: 50.00,
    totalEarnings: 50.00,
    todayEarnings: 20.00,
    lastEarningsDate: getTodayStr(),
    referralEarnings: 0,
    referralCode: userRefCode,
    referredBy: null,
    completedTasks: 3,
    status: 'active',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.transactions.push({
    id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
    userId: newUser.id,
    username: newUser.username,
    amount: 50.00,
    type: 'task_earning',
    description: 'Welcome Starter Balance Credited',
    status: 'completed',
    createdAt: new Date().toISOString()
  });

  saveDb();

  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, { userId: newUser.id, createdAt: Date.now() });

  return res.json({
    token,
    user: sanitizeUser(newUser)
  });
});

// Get current user profile
app.get('/api/auth/me', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  
  // Reset today's earnings if new day
  const today = getTodayStr();
  if (user.lastEarningsDate !== today) {
    user.todayEarnings = 0;
    user.lastEarningsDate = today;
    saveDb();
  }

  return res.json({
    user: sanitizeUser(user),
    system: {
      appName: db.systemSettings.appName,
      currencySymbol: db.systemSettings.currencySymbol,
      minWithdrawal: db.systemSettings.minWithdrawal,
      maxWithdrawal: db.systemSettings.maxWithdrawal,
      withdrawalFeePercent: db.systemSettings.withdrawalFeePercent,
      supportedMethods: db.systemSettings.supportedMethods
    }
  });
});

// User logout
app.post('/api/auth/logout', authenticateUser, (req, res) => {
  const token = (req as any).token as string;
  userSessions.delete(token);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// ADMIN AUTH ROUTES
// -------------------------------------------------------------

// Admin Login: strictly server-side verification, credentials never exposed
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = db.admins.find(a => a.username === String(username).trim());
  if (!admin || !verifyPassword(String(password), admin.passwordHash, admin.salt)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { adminId: admin.id, username: admin.username, createdAt: Date.now() });

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'ADMIN_LOGIN',
    target: 'Auth',
    details: 'Admin authenticated successfully into control panel',
    createdAt: new Date().toISOString()
  });
  saveDb();

  return res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  });
});

app.get('/api/admin/me', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  return res.json({
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  });
});

app.post('/api/admin/logout', authenticateAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    adminSessions.delete(token);
  }
  return res.json({ success: true });
});

// -------------------------------------------------------------
// TIMER TASK FLOW (Server-Authoritative Anti-Cheat)
// -------------------------------------------------------------

// 1. Get active tasks for user
app.get('/api/tasks', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const activeTasks = db.tasks.filter(t => t.active);
  const today = getTodayStr();

  // Find user completions today for limits
  const userCompletionsToday = db.transactions.filter(
    tx => tx.userId === user.id && tx.type === 'task_earning' && tx.createdAt.startsWith(today)
  ).length;

  res.json({
    tasks: activeTasks,
    dailyCompletedCount: userCompletionsToday,
    dailyLimit: db.systemSettings.dailyTaskLimit
  });
});

// 2. Step 1 of task: User opens ad. Server creates task_session with mandatory 10s countdown start
app.post('/api/tasks/start-ad', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { taskId } = req.body;

  const task = db.tasks.find(t => t.id === taskId && t.active);
  if (!task) {
    return res.status(404).json({ error: 'Task not found or is currently inactive' });
  }

  // Cancel any existing active session for this user to prevent multiple simultaneous task abuse
  const activeSessionIndex = db.taskSessions.findIndex(
    s => s.userId === user.id && (s.status === 'ad_watching' || s.status === 'task_running')
  );
  if (activeSessionIndex >= 0) {
    db.taskSessions[activeSessionIndex].status = 'abandoned';
  }

  // Get active pre-task advertisement
  const preTaskAd = db.advertisements.find(a => a.type === 'task_pre_ad' && a.status === 'active') || db.advertisements[0];

  const sessionId = 'ses_' + crypto.randomBytes(8).toString('hex');
  const newSession: TaskSession = {
    id: sessionId,
    userId: user.id,
    taskId: task.id,
    adStartedAt: Date.now(),
    adRequiredSeconds: 10, // Mandatory 10-second advertisement countdown
    adCompletedAt: null,
    taskStartedAt: null,
    taskDurationSeconds: task.timerSeconds,
    completedAt: null,
    status: 'ad_watching'
  };

  db.taskSessions.push(newSession);
  task.totalAttempts += 1;
  saveDb();

  return res.json({
    sessionId,
    adRequiredSeconds: 10,
    ad: preTaskAd ? {
      name: preTaskAd.name,
      code: preTaskAd.code,
      bannerTitle: preTaskAd.bannerTitle,
      bannerSubtitle: preTaskAd.bannerSubtitle,
      targetUrl: preTaskAd.targetUrl
    } : null
  });
});

// 3. Step 2 of task: User finished 10s ad countdown. Server verifies elapsed time >= 10s before unlocking task start
app.post('/api/tasks/verify-ad', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sessionId } = req.body;

  const session = db.taskSessions.find(s => s.id === sessionId && s.userId === user.id);
  if (!session) {
    return res.status(400).json({ error: 'Invalid task session' });
  }

  if (session.status !== 'ad_watching') {
    return res.status(400).json({ error: 'Task ad is not in watching state' });
  }

  const elapsedMs = Date.now() - session.adStartedAt;
  const requiredMs = session.adRequiredSeconds * 1000 - 400; // 400ms tolerance for network latency

  if (elapsedMs < requiredMs) {
    session.status = 'abandoned';
    saveDb();
    return res.status(400).json({
      error: 'Advertisement requirement not satisfied! You must wait the full 10-second countdown.'
    });
  }

  session.adCompletedAt = Date.now();
  session.taskStartedAt = Date.now();
  session.status = 'task_running';
  saveDb();

  return res.json({
    success: true,
    taskStarted: true,
    timerSeconds: session.taskDurationSeconds,
    remainingSeconds: session.taskDurationSeconds
  });
});

// 4. Step 3 of task: Task timer completed. Server validates elapsed task time >= timerSeconds, credits BDT reward
app.post('/api/tasks/claim', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sessionId } = req.body;

  const session = db.taskSessions.find(s => s.id === sessionId && s.userId === user.id);
  if (!session) {
    return res.status(400).json({ error: 'Task session not found' });
  }

  if (session.status !== 'task_running' || !session.taskStartedAt) {
    return res.status(400).json({ error: 'Task was not properly running or already claimed' });
  }

  const task = db.tasks.find(t => t.id === session.taskId);
  if (!task) {
    return res.status(400).json({ error: 'Associated task no longer exists' });
  }

  // Server elapsed verification
  const elapsedTaskMs = Date.now() - session.taskStartedAt;
  const requiredTaskMs = session.taskDurationSeconds * 1000 - 500; // 500ms network jitter buffer

  if (elapsedTaskMs < requiredTaskMs) {
    session.status = 'abandoned';
    saveDb();
    return res.status(400).json({
      error: 'Task timer has not completed on server. Cheating detected.'
    });
  }

  // Check daily limit
  const today = getTodayStr();
  const userTasksToday = db.transactions.filter(
    tx => tx.userId === user.id && tx.type === 'task_earning' && tx.createdAt.startsWith(today)
  ).length;

  if (userTasksToday >= db.systemSettings.dailyTaskLimit) {
    session.status = 'abandoned';
    saveDb();
    return res.status(400).json({ error: 'Daily task limit reached for today' });
  }

  // Mark session completed
  session.status = 'completed';
  session.completedAt = Date.now();

  // Credit user reward
  const rewardAmount = roundMoney(task.reward);
  user.balance = roundMoney(user.balance + rewardAmount);
  user.totalEarnings = roundMoney(user.totalEarnings + rewardAmount);
  user.todayEarnings = roundMoney(user.todayEarnings + rewardAmount);
  user.lastEarningsDate = today;
  user.completedTasks += 1;
  user.updatedAt = new Date().toISOString();

  // Task statistics
  task.completedTasks += 1;
  task.rewardsDistributed = roundMoney(task.rewardsDistributed + rewardAmount);

  // Transaction record
  const txnId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
  db.transactions.unshift({
    id: txnId,
    userId: user.id,
    username: user.username,
    amount: rewardAmount,
    type: 'task_earning',
    description: `Completed task: ${task.title}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  });

  saveDb();

  return res.json({
    success: true,
    reward: rewardAmount,
    newBalance: user.balance,
    transactionId: txnId
  });
});

// -------------------------------------------------------------
// VIDEO ADS (Watch & Earn)
// -------------------------------------------------------------

app.get('/api/video-ads', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const today = getTodayStr();
  const watchedToday = db.transactions.filter(
    tx => tx.userId === user.id && tx.type === 'video_ad_earning' && tx.createdAt.startsWith(today)
  ).length;

  res.json({
    videoAds: db.videoAds.filter(v => v.active),
    watchedToday,
    dailyLimit: db.systemSettings.dailyVideoLimit
  });
});

app.post('/api/video-ads/start', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { videoAdId } = req.body;

  const video = db.videoAds.find(v => v.id === videoAdId && v.active);
  if (!video) {
    return res.status(404).json({ error: 'Video ad not found' });
  }

  const today = getTodayStr();
  const watchedToday = db.transactions.filter(
    tx => tx.userId === user.id && tx.type === 'video_ad_earning' && tx.createdAt.startsWith(today)
  ).length;

  if (watchedToday >= db.systemSettings.dailyVideoLimit) {
    return res.status(400).json({ error: 'Daily video watching limit reached' });
  }

  const sessionId = 'vidses_' + crypto.randomBytes(6).toString('hex');
  db.videoSessions.push({
    id: sessionId,
    userId: user.id,
    videoAdId: video.id,
    startedAt: Date.now(),
    durationSeconds: video.requiredDurationSeconds,
    completed: false
  });

  saveDb();

  return res.json({
    sessionId,
    requiredDuration: video.requiredDurationSeconds
  });
});

app.post('/api/video-ads/claim', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sessionId } = req.body;

  const session = db.videoSessions.find(s => s.id === sessionId && s.userId === user.id);
  if (!session || session.completed) {
    return res.status(400).json({ error: 'Invalid or expired video session' });
  }

  const video = db.videoAds.find(v => v.id === session.videoAdId);
  if (!video) {
    return res.status(400).json({ error: 'Video ad not found' });
  }

  const elapsed = (Date.now() - session.startedAt) / 1000;
  if (elapsed < session.durationSeconds - 0.5) {
    return res.status(400).json({ error: 'You must watch the full video duration to receive reward' });
  }

  session.completed = true;
  video.viewsCount += 1;

  const reward = roundMoney(video.reward);
  const today = getTodayStr();
  user.balance = roundMoney(user.balance + reward);
  user.totalEarnings = roundMoney(user.totalEarnings + reward);
  user.todayEarnings = roundMoney(user.todayEarnings + reward);
  user.lastEarningsDate = today;

  const txnId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
  db.transactions.unshift({
    id: txnId,
    userId: user.id,
    username: user.username,
    amount: reward,
    type: 'video_ad_earning',
    description: `Watched video ad: ${video.title}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  });

  saveDb();

  return res.json({
    success: true,
    reward,
    newBalance: user.balance,
    transactionId: txnId
  });
});

// -------------------------------------------------------------
// ADSTERRA DIRECT LINK SYSTEM (Watch & Earn & Spin Anti-Abuse Sessions)
// -------------------------------------------------------------

// Public/User: Get active Adsterra Direct Link configurations
app.get('/api/adsterra/config', (req, res) => {
  return res.json({
    watchEarn: {
      directLinkUrl: db.adsterraSettings.watchEarn.directLinkUrl,
      timerSeconds: db.adsterraSettings.watchEarn.timerSeconds,
      reward: db.adsterraSettings.watchEarn.reward,
      enabled: db.adsterraSettings.watchEarn.enabled,
    },
    spin: {
      directLinkUrl: db.adsterraSettings.spin.directLinkUrl,
      timerSeconds: db.adsterraSettings.spin.timerSeconds,
      reward: db.adsterraSettings.spin.reward,
      enabled: db.adsterraSettings.spin.enabled,
    },
  });
});

// User: Start an Adsterra task session (Server-side tracking & anti-abuse)
app.post('/api/adsterra/session/start', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account is currently disabled or restricted' });
  }

  const { taskType } = req.body;
  if (taskType !== 'watch_earn' && taskType !== 'spin') {
    return res.status(400).json({ error: 'Invalid ad task type specified' });
  }

  const cfg = taskType === 'watch_earn' ? db.adsterraSettings.watchEarn : db.adsterraSettings.spin;
  if (!cfg || !cfg.enabled) {
    return res.status(400).json({
      error: `${taskType === 'watch_earn' ? 'Watch & Earn' : 'Spin'} Adsterra Direct Link is currently disabled by administrator`
    });
  }

  const now = Date.now();

  // Anti-Abuse: Prevent multiple simultaneous sessions
  // Find any active session created within (requiredDuration + 10s)
  const existingActive = db.adEarningSessions.find(
    s => s.userId === user.id && s.status === 'active' && (now - s.startTime) < (s.requiredDuration * 1000 + 10000)
  );

  if (existingActive) {
    if (existingActive.taskType === taskType) {
      // Resume existing active session without restart penalty
      const elapsedSec = Math.floor((now - existingActive.startTime) / 1000);
      const remainingSec = Math.max(0, existingActive.requiredDuration - elapsedSec);
      return res.json({
        sessionId: existingActive.id,
        directLinkUrl: existingActive.directLinkUrl,
        requiredDuration: existingActive.requiredDuration,
        remainingSeconds: remainingSec,
        reward: existingActive.reward,
        startTime: existingActive.startTime,
        isResumed: true
      });
    } else {
      return res.status(400).json({
        error: 'Another ad session is currently in progress. Please complete it before starting a new one.'
      });
    }
  }

  // Create unique server session
  const sessionId = 'adsess_' + crypto.randomBytes(8).toString('hex');
  const newSession: AdEarningSession = {
    id: sessionId,
    userId: user.id,
    taskType,
    directLinkUrl: cfg.directLinkUrl,
    startTime: now,
    requiredDuration: cfg.timerSeconds,
    reward: roundMoney(cfg.reward),
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.adEarningSessions.unshift(newSession);

  // Keep array within memory threshold
  if (db.adEarningSessions.length > 3000) {
    db.adEarningSessions = db.adEarningSessions.slice(0, 3000);
  }

  saveDb();

  return res.json({
    sessionId: newSession.id,
    directLinkUrl: newSession.directLinkUrl,
    requiredDuration: newSession.requiredDuration,
    remainingSeconds: newSession.requiredDuration,
    reward: newSession.reward,
    startTime: newSession.startTime
  });
});

// User: Verify and complete/claim Adsterra task session
app.post('/api/adsterra/session/verify', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const session = db.adEarningSessions.find(s => s.id === sessionId && s.userId === user.id);
  if (!session) {
    return res.status(404).json({ error: 'Ad session not found or invalid' });
  }

  if (session.status === 'claimed') {
    return res.status(400).json({ error: 'This reward has already been claimed. Duplicate claims are prevented.' });
  }

  if (session.status === 'abandoned') {
    return res.status(400).json({ error: 'This ad session was abandoned or cancelled. Please start a new session.' });
  }

  if (session.taskType === 'spin' && session.status === 'completed') {
    return res.json({
      success: true,
      status: 'completed',
      message: 'Spin requirement already fulfilled! You can proceed to spin.'
    });
  }

  // Strict server-side elapsed time verification
  const now = Date.now();
  const elapsedSeconds = (now - session.startTime) / 1000;
  // Allow 0.5s network tolerance, but strictly require the configured timer
  if (elapsedSeconds < session.requiredDuration - 0.5) {
    const remaining = Math.ceil(session.requiredDuration - elapsedSeconds);
    return res.status(400).json({
      error: `Timer requirement not met. Please complete the remaining ${remaining}s before requesting reward.`
    });
  }

  if (session.taskType === 'watch_earn') {
    session.status = 'claimed';
    session.completionTime = now;

    const reward = roundMoney(session.reward);
    const today = getTodayStr();

    user.balance = roundMoney(user.balance + reward);
    user.totalEarnings = roundMoney(user.totalEarnings + reward);
    user.todayEarnings = roundMoney(user.todayEarnings + reward);
    user.lastEarningsDate = today;
    user.completedTasks += 1;

    const txnId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
    db.transactions.unshift({
      id: txnId,
      userId: user.id,
      username: user.username,
      amount: reward,
      type: 'task_earning',
      description: 'Watch & Earn Adsterra Direct Link completed',
      status: 'completed',
      createdAt: new Date().toISOString()
    });

    saveDb();

    return res.json({
      success: true,
      reward,
      newBalance: user.balance,
      status: 'claimed',
      transactionId: txnId
    });
  } else if (session.taskType === 'spin') {
    // Unlock spin for this session
    session.status = 'completed';
    session.completionTime = now;
    saveDb();

    return res.json({
      success: true,
      status: 'completed',
      message: 'Ad session completed! Lucky Spin is now unlocked.'
    });
  }

  return res.status(400).json({ error: 'Unknown task type' });
});

// User: Abandon or cancel an active session
app.post('/api/adsterra/session/abandon', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sessionId } = req.body;

  if (sessionId) {
    const session = db.adEarningSessions.find(s => s.id === sessionId && s.userId === user.id);
    if (session && session.status === 'active') {
      session.status = 'abandoned';
      saveDb();
    }
  }

  return res.json({ success: true });
});

// -------------------------------------------------------------
// LUCKY SPIN & EARN (Server-Generated & Validated)
// -------------------------------------------------------------

app.get('/api/spin', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const today = getTodayStr();
  const spinsToday = db.spins.filter(s => s.userId === user.id && s.date === today).length;

  res.json({
    segments: db.spinSegments,
    spinsToday,
    dailyLimit: db.systemSettings.dailySpinLimit,
    remainingSpins: Math.max(0, db.systemSettings.dailySpinLimit - spinsToday),
    spinAdRequired: db.adsterraSettings.spin?.enabled || false,
    spinAdTimer: db.adsterraSettings.spin?.timerSeconds || 10,
    spinAdReward: db.adsterraSettings.spin?.reward || 0
  });
});

app.post('/api/spin/play', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const today = getTodayStr();
  const spinsToday = db.spins.filter(s => s.userId === user.id && s.date === today).length;

  if (spinsToday >= db.systemSettings.dailySpinLimit) {
    return res.status(400).json({ error: 'Daily spin limit reached. Come back tomorrow!' });
  }

  // Anti-Abuse: If Spin Adsterra Direct Link is enabled, enforce verified ad session
  if (db.adsterraSettings.spin && db.adsterraSettings.spin.enabled) {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({
        error: 'Spin locked: You must view the required Spin Ad and complete the timer countdown first.'
      });
    }

    const session = db.adEarningSessions.find(
      s => s.id === sessionId && s.userId === user.id && s.taskType === 'spin'
    );

    if (!session || session.status !== 'completed') {
      return res.status(400).json({
        error: 'Invalid or incomplete ad session. Please complete the required ad timer first.'
      });
    }

    // Mark session claimed so it cannot be replayed or used for multiple spins
    session.status = 'claimed';
    session.completionTime = Date.now();
  }

  // Server-authoritative weighted random selection
  const totalWeight = db.spinSegments.reduce((sum, seg) => sum + seg.weight, 0);
  let randomVal = Math.random() * totalWeight;
  let selectedIndex = 0;

  for (let i = 0; i < db.spinSegments.length; i++) {
    if (randomVal < db.spinSegments[i].weight) {
      selectedIndex = i;
      break;
    }
    randomVal -= db.spinSegments[i].weight;
  }

  const selectedSegment = db.spinSegments[selectedIndex];
  const spinAdBonus = (db.adsterraSettings.spin && db.adsterraSettings.spin.enabled) ? roundMoney(db.adsterraSettings.spin.reward || 0) : 0;
  const baseReward = roundMoney(selectedSegment.reward);
  const totalReward = roundMoney(baseReward + spinAdBonus);

  // Record spin
  db.spins.push({
    id: 'spn_' + crypto.randomBytes(6).toString('hex'),
    userId: user.id,
    reward: totalReward,
    date: today,
    createdAt: new Date().toISOString()
  });

  // Credit balance if totalReward > 0
  if (totalReward > 0) {
    user.balance = roundMoney(user.balance + totalReward);
    user.totalEarnings = roundMoney(user.totalEarnings + totalReward);
    user.todayEarnings = roundMoney(user.todayEarnings + totalReward);
    user.lastEarningsDate = today;

    db.transactions.unshift({
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      userId: user.id,
      username: user.username,
      amount: totalReward,
      type: 'spin_reward',
      description: `Lucky Spin win: ${selectedSegment.label}${spinAdBonus > 0 ? ` (+৳${spinAdBonus.toFixed(2)} Ad Bonus)` : ''}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    });
  }

  saveDb();

  return res.json({
    segmentIndex: selectedIndex,
    reward: totalReward,
    baseReward,
    spinAdBonus,
    label: selectedSegment.label,
    newBalance: user.balance,
    spinsToday: spinsToday + 1,
    remainingSpins: Math.max(0, db.systemSettings.dailySpinLimit - (spinsToday + 1))
  });
});

// -------------------------------------------------------------
// WITHDRAWALS & WALLET
// -------------------------------------------------------------

app.get('/api/withdrawals', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const userWithdrawals = db.withdrawals
    .filter(w => w.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    withdrawals: userWithdrawals,
    balance: user.balance,
    minWithdrawal: db.systemSettings.minWithdrawal,
    maxWithdrawal: db.systemSettings.maxWithdrawal,
    feePercent: db.systemSettings.withdrawalFeePercent,
    supportedMethods: db.systemSettings.supportedMethods
  });
});

app.post('/api/withdrawals', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { method, accountNumber, amount, network } = req.body;

  if (!method || !accountNumber || !amount) {
    return res.status(400).json({ error: 'Method, account number, and amount are required' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid withdrawal amount' });
  }

  if (numAmount < db.systemSettings.minWithdrawal) {
    return res.status(400).json({
      error: `Minimum withdrawal is ৳${db.systemSettings.minWithdrawal.toFixed(2)}`
    });
  }

  if (numAmount > db.systemSettings.maxWithdrawal) {
    return res.status(400).json({
      error: `Maximum withdrawal is ৳${db.systemSettings.maxWithdrawal.toFixed(2)}`
    });
  }

  if (user.balance < numAmount) {
    return res.status(400).json({ error: 'Insufficient balance for this withdrawal request' });
  }

  // Calculate fee
  const fee = roundMoney((numAmount * db.systemSettings.withdrawalFeePercent) / 100);
  const netAmount = roundMoney(numAmount - fee);

  // Deduct balance securely
  user.balance = roundMoney(user.balance - numAmount);
  user.updatedAt = new Date().toISOString();

  const withdrawalId = 'WTH-' + Math.floor(100000 + Math.random() * 900000);
  const newWithdrawal: Withdrawal = {
    id: withdrawalId,
    userId: user.id,
    username: user.username,
    method,
    accountNumber: String(accountNumber).trim(),
    network: network ? String(network).trim() : undefined,
    amount: numAmount,
    fee,
    netAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.withdrawals.unshift(newWithdrawal);

  // Transaction entry
  db.transactions.unshift({
    id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
    userId: user.id,
    username: user.username,
    amount: -numAmount,
    type: 'withdrawal',
    description: `Withdrawal request via ${method} (${withdrawalId})`,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  saveDb();

  return res.json({
    success: true,
    withdrawal: newWithdrawal,
    newBalance: user.balance
  });
});

// -------------------------------------------------------------
// USER TRANSACTIONS & REFERRALS
// -------------------------------------------------------------

app.get('/api/transactions', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const userTxns = db.transactions
    .filter(t => t.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ transactions: userTxns });
});

app.get('/api/referrals', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const referredUsers = db.users
    .filter(u => u.referredBy === user.id)
    .map(u => ({
      id: u.id,
      username: u.username,
      status: u.status,
      completedTasks: u.completedTasks,
      joinedAt: u.createdAt
    }));

  res.json({
    referralCode: user.referralCode,
    totalReferrals: referredUsers.length,
    activeReferrals: referredUsers.filter(u => u.status === 'active').length,
    referralEarnings: user.referralEarnings,
    commissionSetting: {
      type: db.systemSettings.referralCommissionType,
      value: db.systemSettings.referralCommissionValue
    },
    referredUsers
  });
});

// Active advertisements for public placement
app.get('/api/ads/active', (req, res) => {
  const activeAds = db.advertisements
    .filter(a => a.status === 'active')
    .map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      placement: a.placement,
      code: a.code,
      bannerTitle: a.bannerTitle,
      bannerSubtitle: a.bannerSubtitle,
      targetUrl: a.targetUrl
    }));
  res.json({ ads: activeAds });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT SUITE (Requires Admin Authentication)
// -------------------------------------------------------------

// Dashboard summary statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => u.status === 'active').length;
  const today = getTodayStr();
  const newUsersToday = db.users.filter(u => u.createdAt.startsWith(today)).length;

  const totalTasks = db.tasks.length;
  const totalCompletedTasks = db.tasks.reduce((sum, t) => sum + t.completedTasks, 0);
  const totalDistributedRewards = roundMoney(
    db.transactions.filter(t => t.amount > 0 && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)
  );

  const pendingWithdrawalsCount = db.withdrawals.filter(w => w.status === 'pending').length;
  const totalWithdrawalsAmount = roundMoney(
    db.withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0)
  );

  const totalSpins = db.spins.length;
  const totalVideoViews = db.videoAds.reduce((sum, v) => sum + v.viewsCount, 0);

  res.json({
    totalUsers,
    activeUsers,
    newUsersToday,
    totalTasks,
    totalCompletedTasks,
    totalDistributedRewards,
    pendingWithdrawalsCount,
    totalWithdrawalsAmount,
    totalSpins,
    totalVideoViews
  });
});

// Admin Task Management
app.get('/api/admin/tasks', authenticateAdmin, (req, res) => {
  res.json({ tasks: db.tasks });
});

app.post('/api/admin/tasks', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { title, description, reward, timerSeconds, dailyLimit, active, adText } = req.body;

  if (!title || !reward || !timerSeconds) {
    return res.status(400).json({ error: 'Title, reward, and timer seconds are required' });
  }

  const newTask: Task = {
    id: 'task_' + crypto.randomBytes(4).toString('hex'),
    title: String(title).trim(),
    description: String(description || '').trim(),
    reward: roundMoney(parseFloat(reward)),
    timerSeconds: parseInt(timerSeconds, 10),
    dailyLimit: parseInt(dailyLimit || '10', 10),
    active: active !== undefined ? Boolean(active) : true,
    totalAttempts: 0,
    completedTasks: 0,
    rewardsDistributed: 0,
    adText: adText ? String(adText).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tasks.unshift(newTask);

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'CREATE_TASK',
    target: newTask.title,
    details: `Created task with ৳${newTask.reward} reward, ${newTask.timerSeconds}s timer`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, task: newTask });
});

app.put('/api/admin/tasks/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const task = db.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, reward, timerSeconds, dailyLimit, active, adText } = req.body;
  if (title !== undefined) task.title = String(title).trim();
  if (description !== undefined) task.description = String(description).trim();
  if (reward !== undefined) task.reward = roundMoney(parseFloat(reward));
  if (timerSeconds !== undefined) task.timerSeconds = parseInt(timerSeconds, 10);
  if (dailyLimit !== undefined) task.dailyLimit = parseInt(dailyLimit, 10);
  if (active !== undefined) task.active = Boolean(active);
  if (adText !== undefined) task.adText = String(adText).trim();
  task.updatedAt = new Date().toISOString();

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'UPDATE_TASK',
    target: task.title,
    details: `Updated task parameters`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, task });
});

app.delete('/api/admin/tasks/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deleted = db.tasks.splice(index, 1)[0];
  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'DELETE_TASK',
    target: deleted.title,
    details: `Deleted task ${deleted.id}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true });
});

// Admin User Management
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  const safeUsers = db.users.map(u => sanitizeUser(u));
  res.json({ users: safeUsers });
});

// User balance adjustment by Admin (Creates audit transaction)
app.post('/api/admin/users/:id/adjust-balance', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const { type, amount, reason } = req.body;

  if (!amount || !reason || (type !== 'add' && type !== 'deduct')) {
    return res.status(400).json({ error: 'Valid amount, reason, and type (add/deduct) are required' });
  }

  const numAmount = roundMoney(parseFloat(amount));
  if (numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const delta = type === 'add' ? numAmount : -numAmount;
  if (type === 'deduct' && user.balance < numAmount) {
    return res.status(400).json({ error: 'User balance cannot become negative' });
  }

  user.balance = roundMoney(user.balance + delta);
  if (type === 'add') {
    user.totalEarnings = roundMoney(user.totalEarnings + numAmount);
  }
  user.updatedAt = new Date().toISOString();

  // Create audit transaction
  const txnId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
  db.transactions.unshift({
    id: txnId,
    userId: user.id,
    username: user.username,
    amount: delta,
    type: 'admin_adjustment',
    description: `Admin balance adjustment by @${admin.username}: ${reason}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  });

  // Log admin action
  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: type === 'add' ? 'BALANCE_CREDIT' : 'BALANCE_DEBIT',
    target: `@${user.username} (${user.id})`,
    details: `${type === 'add' ? '+' : '-'}৳${numAmount.toFixed(2)}. Reason: ${reason}. Trx: ${txnId}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, user: sanitizeUser(user), transactionId: txnId });
});

// Update user status (ban, unban, enable, disable)
app.post('/api/admin/users/:id/status', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status || !['active', 'banned', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: `USER_STATUS_${status.toUpperCase()}`,
    target: `@${user.username} (${user.id})`,
    details: `Status set to ${status}. Reason: ${reason || 'Admin action'}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, user: sanitizeUser(user) });
});

// Admin Withdrawal Management
app.get('/api/admin/withdrawals', authenticateAdmin, (req, res) => {
  res.json({ withdrawals: db.withdrawals });
});

app.post('/api/admin/withdrawals/:id/action', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { id } = req.params;
  const { action, reason, note } = req.body;

  const withdrawal = db.withdrawals.find(w => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal request not found' });
  }

  const user = db.users.find(u => u.id === withdrawal.userId);

  if (action === 'approve') {
    withdrawal.status = 'approved';
    if (note) withdrawal.adminNote = note;
  } else if (action === 'complete') {
    withdrawal.status = 'completed';
    if (note) withdrawal.adminNote = note;
    // Mark associated transaction completed
    const tx = db.transactions.find(t => t.description.includes(withdrawal.id));
    if (tx) tx.status = 'completed';
  } else if (action === 'processing') {
    withdrawal.status = 'processing';
    if (note) withdrawal.adminNote = note;
  } else if (action === 'reject') {
    if (withdrawal.status === 'rejected') {
      return res.status(400).json({ error: 'Already rejected' });
    }
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason || 'Declined by administration';
    if (note) withdrawal.adminNote = note;

    // Refund user balance
    if (user) {
      user.balance = roundMoney(user.balance + withdrawal.amount);
      user.updatedAt = new Date().toISOString();

      db.transactions.unshift({
        id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
        userId: user.id,
        username: user.username,
        amount: withdrawal.amount,
        type: 'withdrawal_refund',
        description: `Refund for rejected withdrawal ${withdrawal.id}. Reason: ${withdrawal.rejectionReason}`,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    }
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  withdrawal.updatedAt = new Date().toISOString();

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: `WITHDRAWAL_${action.toUpperCase()}`,
    target: `${withdrawal.id} (@${withdrawal.username})`,
    details: `Status changed to ${withdrawal.status}. Net: ৳${withdrawal.netAmount}. Note: ${note || reason || 'None'}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, withdrawal });
});

// Admin Video Ads Management
app.get('/api/admin/video-ads', authenticateAdmin, (req, res) => {
  res.json({ videoAds: db.videoAds });
});

app.post('/api/admin/video-ads', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { title, brand, reward, requiredDurationSeconds, dailyLimit, active } = req.body;

  const newAd: VideoAd = {
    id: 'vid_' + crypto.randomBytes(4).toString('hex'),
    title: String(title).trim(),
    brand: String(brand || 'Sponsor').trim(),
    reward: roundMoney(parseFloat(reward)),
    requiredDurationSeconds: parseInt(requiredDurationSeconds, 10),
    dailyLimit: parseInt(dailyLimit || '5', 10),
    active: active !== undefined ? Boolean(active) : true,
    viewsCount: 0,
    createdAt: new Date().toISOString()
  };

  db.videoAds.unshift(newAd);

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'CREATE_VIDEO_AD',
    target: newAd.title,
    details: `Reward: ৳${newAd.reward}, Required: ${newAd.requiredDurationSeconds}s`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, videoAd: newAd });
});

app.put('/api/admin/video-ads/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const ad = db.videoAds.find(v => v.id === id);
  if (!ad) return res.status(404).json({ error: 'Video ad not found' });

  const { title, brand, reward, requiredDurationSeconds, dailyLimit, active } = req.body;
  if (title !== undefined) ad.title = String(title).trim();
  if (brand !== undefined) ad.brand = String(brand).trim();
  if (reward !== undefined) ad.reward = roundMoney(parseFloat(reward));
  if (requiredDurationSeconds !== undefined) ad.requiredDurationSeconds = parseInt(requiredDurationSeconds, 10);
  if (dailyLimit !== undefined) ad.dailyLimit = parseInt(dailyLimit, 10);
  if (active !== undefined) ad.active = Boolean(active);

  saveDb();
  res.json({ success: true, videoAd: ad });
});

app.delete('/api/admin/video-ads/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const index = db.videoAds.findIndex(v => v.id === id);
  if (index === -1) return res.status(404).json({ error: 'Video ad not found' });

  db.videoAds.splice(index, 1);
  saveDb();
  res.json({ success: true });
});

// Admin Spin Wheel Management
app.get('/api/admin/spin', authenticateAdmin, (req, res) => {
  res.json({
    segments: db.spinSegments,
    dailyLimit: db.systemSettings.dailySpinLimit,
    totalSpins: db.spins.length
  });
});

app.put('/api/admin/spin', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { segments, dailyLimit } = req.body;

  if (Array.isArray(segments)) {
    db.spinSegments = segments;
  }
  if (dailyLimit !== undefined) {
    db.systemSettings.dailySpinLimit = parseInt(dailyLimit, 10);
  }

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'UPDATE_SPIN_CONFIG',
    target: 'Spin Settings',
    details: `Updated spin wheel segments and daily limit to ${db.systemSettings.dailySpinLimit}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, segments: db.spinSegments, dailyLimit: db.systemSettings.dailySpinLimit });
});

// Admin Advertisements (Adsterra, Social Bar, Popunder, Custom)
app.get('/api/admin/advertisements', authenticateAdmin, (req, res) => {
  res.json({ advertisements: db.advertisements });
});

app.post('/api/admin/advertisements', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { name, type, code, status, placement, priority, bannerTitle, bannerSubtitle, targetUrl } = req.body;

  if (!name || !type || !code) {
    return res.status(400).json({ error: 'Name, type, and code are required' });
  }

  const newAd: Advertisement = {
    id: 'ad_' + crypto.randomBytes(4).toString('hex'),
    name: String(name).trim(),
    type,
    code: String(code),
    status: status || 'active',
    placement: placement || 'Custom Placement',
    priority: parseInt(priority || '1', 10),
    bannerTitle: bannerTitle ? String(bannerTitle) : undefined,
    bannerSubtitle: bannerSubtitle ? String(bannerSubtitle) : undefined,
    targetUrl: targetUrl ? String(targetUrl) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.advertisements.unshift(newAd);

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'CREATE_AD',
    target: newAd.name,
    details: `Type: ${newAd.type}, Placement: ${newAd.placement}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, advertisement: newAd });
});

app.put('/api/admin/advertisements/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const ad = db.advertisements.find(a => a.id === id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  const { name, type, code, status, placement, priority, bannerTitle, bannerSubtitle, targetUrl } = req.body;
  if (name !== undefined) ad.name = String(name).trim();
  if (type !== undefined) ad.type = type;
  if (code !== undefined) ad.code = String(code);
  if (status !== undefined) ad.status = status;
  if (placement !== undefined) ad.placement = String(placement);
  if (priority !== undefined) ad.priority = parseInt(priority, 10);
  if (bannerTitle !== undefined) ad.bannerTitle = String(bannerTitle);
  if (bannerSubtitle !== undefined) ad.bannerSubtitle = String(bannerSubtitle);
  if (targetUrl !== undefined) ad.targetUrl = String(targetUrl);
  ad.updatedAt = new Date().toISOString();

  saveDb();
  res.json({ success: true, advertisement: ad });
});

app.delete('/api/admin/advertisements/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const index = db.advertisements.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Advertisement not found' });

  db.advertisements.splice(index, 1);
  saveDb();
  res.json({ success: true });
});

// Admin Adsterra Direct Link (Completely Independent Watch & Earn and Spin Settings)
app.get('/api/admin/adsterra', authenticateAdmin, (req, res) => {
  res.json({
    watchEarn: db.adsterraSettings.watchEarn,
    spin: db.adsterraSettings.spin,
  });
});

app.put('/api/admin/adsterra/watch-earn', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { directLinkUrl, timerSeconds, reward, enabled } = req.body;

  if (directLinkUrl !== undefined) {
    db.adsterraSettings.watchEarn.directLinkUrl = String(directLinkUrl).trim();
  }
  if (timerSeconds !== undefined) {
    db.adsterraSettings.watchEarn.timerSeconds = Math.max(1, parseInt(timerSeconds, 10));
  }
  if (reward !== undefined) {
    db.adsterraSettings.watchEarn.reward = roundMoney(parseFloat(reward));
  }
  if (enabled !== undefined) {
    db.adsterraSettings.watchEarn.enabled = Boolean(enabled);
  }
  db.adsterraSettings.watchEarn.updatedAt = new Date().toISOString();

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'UPDATE_WATCH_EARN_DIRECT_LINK',
    target: 'Watch & Earn Adsterra Direct Link',
    details: `Timer: ${db.adsterraSettings.watchEarn.timerSeconds}s, Reward: ৳${db.adsterraSettings.watchEarn.reward}, Enabled: ${db.adsterraSettings.watchEarn.enabled}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  return res.json({ success: true, watchEarn: db.adsterraSettings.watchEarn });
});

app.put('/api/admin/adsterra/spin', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const { directLinkUrl, timerSeconds, reward, enabled } = req.body;

  if (directLinkUrl !== undefined) {
    db.adsterraSettings.spin.directLinkUrl = String(directLinkUrl).trim();
  }
  if (timerSeconds !== undefined) {
    db.adsterraSettings.spin.timerSeconds = Math.max(1, parseInt(timerSeconds, 10));
  }
  if (reward !== undefined) {
    db.adsterraSettings.spin.reward = roundMoney(parseFloat(reward));
  }
  if (enabled !== undefined) {
    db.adsterraSettings.spin.enabled = Boolean(enabled);
  }
  db.adsterraSettings.spin.updatedAt = new Date().toISOString();

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'UPDATE_SPIN_DIRECT_LINK',
    target: 'Spin Adsterra Direct Link',
    details: `Timer: ${db.adsterraSettings.spin.timerSeconds}s, Reward: ৳${db.adsterraSettings.spin.reward}, Enabled: ${db.adsterraSettings.spin.enabled}`,
    createdAt: new Date().toISOString()
  });

  saveDb();
  return res.json({ success: true, spin: db.adsterraSettings.spin });
});

// Admin System Settings
app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  res.json({ settings: db.systemSettings });
});

app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as Admin;
  const updates = req.body;

  if (updates.appName !== undefined) db.systemSettings.appName = String(updates.appName);
  if (updates.currencySymbol !== undefined) db.systemSettings.currencySymbol = String(updates.currencySymbol);
  if (updates.minWithdrawal !== undefined) db.systemSettings.minWithdrawal = parseFloat(updates.minWithdrawal);
  if (updates.maxWithdrawal !== undefined) db.systemSettings.maxWithdrawal = parseFloat(updates.maxWithdrawal);
  if (updates.withdrawalFeePercent !== undefined) db.systemSettings.withdrawalFeePercent = parseFloat(updates.withdrawalFeePercent);
  if (updates.dailyTaskLimit !== undefined) db.systemSettings.dailyTaskLimit = parseInt(updates.dailyTaskLimit, 10);
  if (updates.dailyVideoLimit !== undefined) db.systemSettings.dailyVideoLimit = parseInt(updates.dailyVideoLimit, 10);
  if (updates.dailySpinLimit !== undefined) db.systemSettings.dailySpinLimit = parseInt(updates.dailySpinLimit, 10);
  if (updates.referralCommissionType !== undefined) db.systemSettings.referralCommissionType = updates.referralCommissionType;
  if (updates.referralCommissionValue !== undefined) db.systemSettings.referralCommissionValue = parseFloat(updates.referralCommissionValue);
  if (updates.maintenanceMode !== undefined) db.systemSettings.maintenanceMode = Boolean(updates.maintenanceMode);
  if (updates.userRegistrationEnabled !== undefined) db.systemSettings.userRegistrationEnabled = Boolean(updates.userRegistrationEnabled);
  if (Array.isArray(updates.supportedMethods)) db.systemSettings.supportedMethods = updates.supportedMethods;

  db.adminLogs.push({
    id: 'log_' + crypto.randomBytes(4).toString('hex'),
    adminUsername: admin.username,
    action: 'UPDATE_SYSTEM_SETTINGS',
    target: 'System Settings',
    details: 'System settings and withdrawal thresholds updated.',
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, settings: db.systemSettings });
});

// Admin Audit Logs
app.get('/api/admin/logs', authenticateAdmin, (req, res) => {
  const logs = [...db.adminLogs].reverse();
  res.json({ logs });
});

// -------------------------------------------------------------
// VITE INTEGRATION / STATIC ASSETS
// -------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
