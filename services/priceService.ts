
import { PriceData } from '../types';
import { API } from './api';

const sendLogToServer = async (level: 'info' | 'warn' | 'error', message: string, context?: any) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context })
    });
  } catch (err) {
    console.warn('Failed to send log to server', err);
  }
};

const toNumber = (value: any, fallback: number) => {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
};

const DEFAULT_PRICES: PriceData = {
  usdToToman: 70000,
  eurToToman: 74000,
  gold18ToToman: 4700000,
  fiatPricesToman: {
    USD: 70000,
    EUR: 74000,
  },
  cryptoPricesToman: {
    USDT: 70000,
  },
  goldPricesToman: {
    GOLD18: 4700000,
  },
  fetchedAt: Date.now(),
};

const normalizePriceData = (incoming?: any): PriceData => {
  if (!incoming) return { ...DEFAULT_PRICES, fetchedAt: Date.now() };

  const usd = toNumber(incoming.usdToToman, DEFAULT_PRICES.usdToToman);
  const eur = toNumber(incoming.eurToToman, DEFAULT_PRICES.eurToToman);
  const gold = toNumber(incoming.gold18ToToman, DEFAULT_PRICES.gold18ToToman);

  const fiatPrices: Record<string, number> = { ...(incoming.fiatPricesToman || {}) };
  if (!fiatPrices.USD) fiatPrices.USD = usd;
  if (!fiatPrices.EUR) fiatPrices.EUR = eur;

  const cryptoPrices: Record<string, number> = { ...(incoming.cryptoPricesToman || {}) };
  if (!cryptoPrices.USDT && incoming.cryptoUsdPrices?.USDT) {
    cryptoPrices.USDT = toNumber(incoming.cryptoUsdPrices.USDT, 1) * (fiatPrices.USD || usd);
  }

  const goldPrices: Record<string, number> = { ...(incoming.goldPricesToman || {}) };
  if (!goldPrices.GOLD18 && incoming.gold18ToToman) goldPrices.GOLD18 = toNumber(incoming.gold18ToToman, gold);
  if (!goldPrices['18AYAR'] && goldPrices.GOLD18) goldPrices['18AYAR'] = goldPrices.GOLD18;

  return {
    usdToToman: fiatPrices.USD || usd,
    eurToToman: fiatPrices.EUR || eur,
    gold18ToToman: goldPrices.GOLD18 || gold,
    fiatPricesToman: fiatPrices,
    cryptoPricesToman: cryptoPrices,
    goldPricesToman: goldPrices,
    fetchedAt: incoming.fetchedAt || Date.now(),
  };
};

export const fetchPrices = async (): Promise<PriceData> => {
  const stored = await API.getPrices();
  return normalizePriceData(stored);
};

export const fetchLivePrices = async (): Promise<{ data: PriceData, sources: {title: string, uri: string}[], skipped?: boolean, nextAllowedAt?: number, message?: string }> => {
  try {
    const response = await API.refreshLivePrices();
    const normalized = normalizePriceData(response?.data);
    await API.savePrices(normalized);
    return {
      data: normalized,
      sources: response?.sources || [],
      skipped: response?.skipped,
      nextAllowedAt: response?.nextAllowedAt,
      message: response?.message,
    };
  } catch (error) {
    console.error("Live price fetch error:", error);
    sendLogToServer('error', 'Live price fetch failed', { error: String(error) });
    const lastStored = await API.getPrices();
    return { data: normalizePriceData(lastStored), sources: [] };
  }
};
