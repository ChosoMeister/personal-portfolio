
import { Transaction, PriceData } from '../types';

const STORAGE_KEY = 'gemini_portfolio_transactions';
const PRICES_KEY = 'gemini_portfolio_prices';

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load transactions', e);
    return [];
  }
};

export const saveTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  const updated = [...current, transaction];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateTransaction = (updatedTx: Transaction) => {
  const current = getTransactions();
  const updated = current.map(t => t.id === updatedTx.id ? updatedTx : t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// مدیریت قیمت‌های کش شده
export const savePrices = (prices: PriceData) => {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
};

export const getStoredPrices = (): PriceData | null => {
  const data = localStorage.getItem(PRICES_KEY);
  return data ? JSON.parse(data) : null;
};
