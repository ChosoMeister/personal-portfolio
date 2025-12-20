import { Transaction, PriceData } from '../types';

// تشخیص خودکار URL پایه بر اساس محیط اجرا
const BASE_URL = window.location.origin;
const TIMEOUT_MS = 3000;

const LOCAL_USERS_KEY = 'gemini_fallback_users';
const LOCAL_PRICES_KEY = 'gemini_fallback_prices';
const DEFAULT_ADMIN_USERNAME = 'admin';

type EnvSource = Record<string, any>;

type Credential = {
  username: string;
  password?: string;
  isAdmin?: boolean;
};

const resolveEnv = (): EnvSource => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env;
  if (typeof process !== 'undefined' && process.env) return process.env;
  return {} as EnvSource;
};

const resolveAdminConfig = () => {
  const env = resolveEnv();
  return {
    username: env.VITE_ADMIN_USERNAME || env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
    password: env.VITE_ADMIN_PASSWORD || env.ADMIN_PASSWORD || ''
  };
};

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch (e) { return []; }
};

const saveLocalUsers = (users: any[]) => localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

const seedAdmin = () => {
  const { username, password } = resolveAdminConfig();
  const users = getLocalUsers();
  const admin = users.find((u: any) => u.username === username);
  if (!admin) {
    const adminUser: any = {
      username,
      isAdmin: true,
      transactions: [],
      createdAt: new Date().toISOString(),
      displayName: 'ادمین سیستم'
    };
    if (password) {
      adminUser.password = password;
      adminUser.passwordHash = password;
    }
    saveLocalUsers([...users, adminUser]);
  } else {
    if (password && admin.password !== password && admin.passwordHash !== password) {
      admin.password = password;
      admin.passwordHash = password;
      saveLocalUsers(users);
    }
    if (!admin.displayName) {
      admin.displayName = 'ادمین سیستم';
      saveLocalUsers(users);
    }
  }
};
seedAdmin();

const withTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const findLocalUserByCredentials = (username: string, pass: string) => {
  const normalizedUsername = username.toLowerCase();
  const localUsers = getLocalUsers();
  return localUsers.find((u: any) => u.username === normalizedUsername && (u.password === pass || u.passwordHash === pass));
};

const persistLocalCredential = ({ username, password, isAdmin, displayName }: Credential) => {
  if (!password) return;
  const normalizedUsername = username.toLowerCase();
  const users = getLocalUsers();
  const existing = users.find((u: any) => u.username === normalizedUsername);
  if (existing) {
    existing.password = password;
    existing.passwordHash = password;
    if (typeof isAdmin === 'boolean') existing.isAdmin = isAdmin;
    if (displayName) existing.displayName = displayName;
  } else {
    users.push({
      username: normalizedUsername,
      password,
      passwordHash: password,
      isAdmin: !!isAdmin,
      transactions: [],
      createdAt: new Date().toISOString(),
      displayName: displayName || normalizedUsername
    });
  }
  saveLocalUsers(users);
};



const mergeServerUsersWithLocal = (serverUsers: any[], credential?: Credential) => {
  const localUsers = getLocalUsers();
  const { username: adminUsername, password: adminPassword } = resolveAdminConfig();
  return serverUsers.map((su: any) => {
    const local = localUsers.find((u: any) => u.username === su.username) || {};
    const credentialPassword = credential?.username === su.username ? credential?.password : undefined;
    const password = credentialPassword || local.password || local.passwordHash || (su.username === adminUsername ? adminPassword : undefined);
    return {
      ...local,
      username: su.username,
      isAdmin: !!su.isAdmin,
      createdAt: su.createdAt || local.createdAt || new Date().toISOString(),
      transactions: local.transactions || [],
      password,
      passwordHash: password || local.passwordHash,
      txCount: su.txCount ?? (local.transactions?.length || 0),
      displayName: su.displayName || local.displayName || su.username,
      securityQuestion: su.securityQuestion || local.securityQuestion,
      securityAnswerHash: local.securityAnswerHash
    };
  });
};

const trySyncLocalUsers = async (credential?: Credential) => {
  try {
    const res = await withTimeout(`${BASE_URL}/api/users`);
    if (!res.ok) throw new Error('Failed to sync users with server');
    const serverUsers = await res.json();
    const merged = mergeServerUsersWithLocal(serverUsers, credential);
    saveLocalUsers(merged);
    return { users: merged, offline: false };
  } catch (error) {
    console.warn('Could not sync users from server, keeping local fallback.', error);
    if (credential) persistLocalCredential(credential);
    return null;
  }
};

export const API = {
  login: async (username: string, pass: string) => {
    username = username.toLowerCase();
    let serverResponded = false;
    try {
      const res = await withTimeout(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
      });
      serverResponded = true;

      if (res.ok) {
        const data = await res.json();
        await trySyncLocalUsers({ username, password: pass, isAdmin: data.isAdmin, displayName: data.displayName });
        return data;
      }

      if (res.status === 401) throw new Error('نام کاربری یا رمز عبور اشتباه است');
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'ورود به سرور ناموفق بود');
    } catch (e) {
      if (serverResponded) throw e;
      console.warn('Backend server not responding, attempting offline login.', e);
      const localUser = findLocalUserByCredentials(username, pass);
      if (localUser) return { username: localUser.username, isAdmin: !!localUser.isAdmin, offline: true, displayName: localUser.displayName || localUser.username };
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }
  },

  register: async (username: string, pass: string, displayName: string, securityQuestion: string, securityAnswer: string) => {
    username = username.toLowerCase();
    let serverResponded = false;
    try {
      const res = await withTimeout(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass, displayName, securityQuestion, securityAnswer })
      });
      serverResponded = true;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'ثبت‌نام با خطا مواجه شد');
      await trySyncLocalUsers({ username, password: pass, isAdmin: false, displayName: data.displayName });
      return data;
    } catch (error) {
      if (serverResponded) throw error;
      console.warn('Register via server failed, falling back to local storage.', error);
      const users = getLocalUsers();
      if (users.find((u: any) => u.username === username)) throw new Error('نام کاربری تکراری است');
      persistLocalCredential({ username, password: pass, isAdmin: false, displayName });
      users.push({ username, password: pass, passwordHash: pass, isAdmin: false, transactions: [], createdAt: new Date().toISOString(), displayName, securityQuestion, securityAnswerHash: securityAnswer });
      saveLocalUsers(users);
      return { username, isAdmin: false, offline: true, displayName };
    }
  },

  getTransactions: async (username: string) => {
    username = username.toLowerCase();
    try {
      const res = await fetch(`${BASE_URL}/api/transactions?username=${username}`);
      if (res.ok) return res.json();
    } catch (e) { }
    const user = getLocalUsers().find((u: any) => u.username === username);
    return user ? user.transactions : [];
  },

  saveTransaction: async (username: string, tx: Transaction) => {
    username = username.toLowerCase();
    const users = getLocalUsers();
    const user = users.find((u: any) => u.username === username);
    if (user) {
      const idx = user.transactions.findIndex((t: any) => t.id === tx.id);
      if (idx > -1) user.transactions[idx] = tx;
      else user.transactions.push(tx);
      saveLocalUsers(users);
    }
    await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, transaction: tx })
    }).catch(() => { });
  },

  deleteTransaction: async (username: string, txId: string) => {
    username = username.toLowerCase();
    const users = getLocalUsers();
    const user = users.find((u: any) => u.username === username);
    if (user) {
      user.transactions = user.transactions.filter((t: any) => t.id !== txId);
      saveLocalUsers(users);
    }
    await fetch(`${BASE_URL}/api/transactions/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, id: txId })
    }).catch(() => { });
  },

  getPrices: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/prices`);
      if (res.ok) return res.json();
    } catch (e) { }
    return JSON.parse(localStorage.getItem(LOCAL_PRICES_KEY) || 'null');
  },

  refreshLivePrices: async () => {
    const res = await withTimeout(`${BASE_URL}/api/prices/refresh`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'دریافت قیمت‌های جدید ناموفق بود');
    return data;
  },

  savePrices: async (prices: PriceData) => {
    localStorage.setItem(LOCAL_PRICES_KEY, JSON.stringify(prices));
    await fetch(`${BASE_URL}/api/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prices)
    }).catch(() => { });
  },

  getAllUsers: async (): Promise<{ users: any[], offline?: boolean, message?: string }> => {
    try {
      const res = await withTimeout(`${BASE_URL}/api/users`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'دریافت کاربران از سرور ناموفق بود');
      }
      const serverUsers = await res.json();
      const merged = mergeServerUsersWithLocal(serverUsers);
      saveLocalUsers(merged);
      return { users: merged, offline: false };
    } catch (error) {
      console.warn('Falling back to local user list because server is unavailable.', error);
      return {
        users: getLocalUsers().map((u: any) => ({
          username: u.username,
          isAdmin: !!u.isAdmin,
          txCount: u.transactions?.length || 0,
          createdAt: u.createdAt || new Date(),
          displayName: u.displayName || u.username
        })),
        offline: true,
        message: 'اتصال به سرور برقرار نیست؛ داده‌های محلی نمایش داده می‌شود و ممکن است ناقص باشد.'
      };
    }
  },

  deleteUser: async (username: string) => {
    username = username.toLowerCase();
    let serverResponded = false;
    try {
      const res = await withTimeout(`${BASE_URL}/api/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      serverResponded = true;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'حذف کاربر ناموفق بود');
      await trySyncLocalUsers();
    } catch (error) {
      if (serverResponded) throw error;
      console.warn('Server delete failed, applying local fallback.', error);
      const users = getLocalUsers().filter((u: any) => u.username !== username);
      saveLocalUsers(users);
    }
  },

  updateUserPassword: async (username: string, newPass: string) => {
    username = username.toLowerCase();
    let serverResponded = false;
    try {
      const res = await withTimeout(`${BASE_URL}/api/users/update-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword: newPass })
      });
      serverResponded = true;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تغییر رمز عبور ناموفق بود');
      await trySyncLocalUsers({ username, password: newPass });
    } catch (error) {
      if (serverResponded) throw error;
      console.warn('Password update failed on server, applying local fallback.', error);
      const users = getLocalUsers();
      const user = users.find((u: any) => u.username === username);
      if (user) {
        user.password = newPass;
        user.passwordHash = newPass;
        saveLocalUsers(users);
      }
    }
  },

  getSecurityQuestion: async (username: string): Promise<string> => {
    username = username.toLowerCase();
    try {
      const res = await withTimeout(`${BASE_URL}/api/security-question?username=${username}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'دریافت سوال امنیتی ممکن نیست');
      return data.securityQuestion;
    } catch (error) {
      const local = getLocalUsers().find((u: any) => u.username === username);
      if (local?.securityQuestion) return local.securityQuestion;
      throw error;
    }
  },

  resetPasswordWithSecurityAnswer: async (username: string, securityAnswer: string, newPassword: string) => {
    username = username.toLowerCase();
    let serverResponded = false;
    try {
      const res = await withTimeout(`${BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, securityAnswer, newPassword })
      });
      serverResponded = true;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'بازیابی رمز عبور ناموفق بود');
      await trySyncLocalUsers({ username, password: newPassword });
    } catch (error) {
      if (serverResponded) throw error;
      console.warn('Reset password via server failed, using local fallback.', error);
      const users = getLocalUsers();
      const user = users.find((u: any) => u.username === username);
      if (!user) throw error;
      if (user.securityAnswerHash !== securityAnswer) throw error;
      user.password = newPassword;
      user.passwordHash = newPassword;
      saveLocalUsers(users);
    }
  }
};
