
import { Transaction, PriceData } from '../types';

// تشخیص خودکار URL پایه بر اساس محیط اجرا
const BASE_URL = window.location.origin; 
const TIMEOUT_MS = 3000;

const LOCAL_USERS_KEY = 'gemini_fallback_users';
const LOCAL_PRICES_KEY = 'gemini_fallback_prices';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch (e) { return []; }
};

const saveLocalUsers = (users: any[]) => localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

const initStorage = () => {
  const users = getLocalUsers();
  if (!users.find((u: any) => u.username === ADMIN_USERNAME)) {
    users.push({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      isAdmin: true,
      transactions: [],
      createdAt: new Date().toISOString()
    });
    saveLocalUsers(users);
  }
};
initStorage();

export const API = {
  login: async (username: string, pass: string) => {
    // ۱. اولویت با حافظه محلی برای ورود سریع در محیط پیش‌نمایش
    const localUsers = getLocalUsers();
    const localUser = localUsers.find((u: any) => u.username === username && (u.password === pass || u.passwordHash === pass));
    
    if (localUser) {
      // تلاش برای لاگین در بک‌ند در پس‌زمینه (برای همگام‌سازی دیتابیس داکر)
      fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
      }).catch(() => {});
      
      return { username: localUser.username, isAdmin: !!localUser.isAdmin };
    }

    // ۲. تلاش برای برقراری ارتباط با سرور
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn("Backend server not responding, check Docker status.");
    }

    throw new Error('نام کاربری یا رمز عبور اشتباه است');
  },

  register: async (username: string, pass: string) => {
    const users = getLocalUsers();
    if (users.find((u: any) => u.username === username)) throw new Error('نام کاربری تکراری است');
    
    const newUser = { username, password: pass, isAdmin: false, transactions: [], createdAt: new Date().toISOString() };
    users.push(newUser);
    saveLocalUsers(users);
    
    await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass })
    }).catch(() => {});
    
    return { username, isAdmin: false };
  },

  getTransactions: async (username: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/transactions?username=${username}`);
      if (res.ok) return res.json();
    } catch (e) {}
    const user = getLocalUsers().find((u: any) => u.username === username);
    return user ? user.transactions : [];
  },

  saveTransaction: async (username: string, tx: Transaction) => {
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
    }).catch(() => {});
  },

  deleteTransaction: async (username: string, txId: string) => {
    const users = getLocalUsers();
    const user = users.find((u: any) => u.username === username);
    if (user) {
      user.transactions = user.transactions.filter((t: any) => t.id !== txId);
      saveLocalUsers(users);
    }
    await fetch(`${BASE_URL}/api/transactions/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, txId })
    }).catch(() => {});
  },

  getPrices: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/prices`);
      if (res.ok) return res.json();
    } catch (e) {}
    return JSON.parse(localStorage.getItem(LOCAL_PRICES_KEY) || 'null');
  },

  savePrices: async (prices: PriceData) => {
    localStorage.setItem(LOCAL_PRICES_KEY, JSON.stringify(prices));
    await fetch(`${BASE_URL}/api/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prices)
    }).catch(() => {});
  },

  getAllUsers: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`);
      if (res.ok) return res.json();
    } catch (e) {}
    return getLocalUsers().map((u: any) => ({
      username: u.username,
      isAdmin: !!u.isAdmin,
      txCount: u.transactions?.length || 0,
      createdAt: u.createdAt || new Date()
    }));
  },

  deleteUser: async (username: string) => {
    const users = getLocalUsers().filter((u: any) => u.username !== username);
    saveLocalUsers(users);
    await fetch(`${BASE_URL}/api/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).catch(() => {});
  },

  updateUserPassword: async (username: string, newPass: string) => {
    const users = getLocalUsers();
    const user = users.find((u: any) => u.username === username);
    if (user) {
      user.password = newPass;
      saveLocalUsers(users);
    }
    await fetch(`${BASE_URL}/api/users/update-pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword: newPass })
    }).catch(() => {});
  }
};
