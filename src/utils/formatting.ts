
import { getAssetDetail } from '../types';

export const formatToman = (value: number): string => {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value));
};

export const formatNumber = (value: number, decimals = 2): string => {
  // اگر عدد خیلی کوچک بود اعشار بیشتری نشان بده
  const finalDecimals = value < 1 && value > 0 ? Math.max(decimals, 4) : decimals;
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: finalDecimals,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}٪`;
};

export const formatCurrencyInput = (val: string) => {
  if (!val) return "";
  const cleanVal = val.toString().replace(/,/g, "");
  if (isNaN(parseFloat(cleanVal))) return "";
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parseCurrencyInput = (val: string) => {
  if (!val) return 0;
  return parseFloat(val.toString().replace(/,/g, ""));
};

const CRYPTO_ICON_CDN_BASE = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color';
const CRYPTO_ICON_GENERIC = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png';
const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: `${CRYPTO_ICON_CDN_BASE}/btc.png`,
  ETH: `${CRYPTO_ICON_CDN_BASE}/eth.png`,
  ETC: `${CRYPTO_ICON_CDN_BASE}/etc.png`,
  ADA: `${CRYPTO_ICON_CDN_BASE}/ada.png`,
  USDT: `${CRYPTO_ICON_CDN_BASE}/usdt.png`,
  BNB: `${CRYPTO_ICON_CDN_BASE}/bnb.png`,
  XRP: `${CRYPTO_ICON_CDN_BASE}/xrp.png`,
  SHIB: `${CRYPTO_ICON_CDN_BASE}/shib.png`,
  SOL: `${CRYPTO_ICON_CDN_BASE}/sol.png`,
  TON: `${CRYPTO_ICON_CDN_BASE}/ton.png`,
  TRX: `${CRYPTO_ICON_CDN_BASE}/trx.png`,
  LTC: `${CRYPTO_ICON_CDN_BASE}/ltc.png`,
};

const FIAT_FLAG_MAP: Record<string, string> = {
  USD: 'us', EUR: 'eu', AED: 'ae', TRY: 'tr', GBP: 'gb', CNY: 'cn', CAD: 'ca', AUD: 'au', RUB: 'ru',
  IQD: 'iq', MYR: 'my', GEL: 'ge', AZN: 'az', AMD: 'am', THB: 'th', OMR: 'om', INR: 'in',
  PKR: 'pk', JPY: 'jp', SAR: 'sa', AFN: 'af', SEK: 'se', CHF: 'ch', QAR: 'qa', KRW: 'kr',
  NOK: 'no', NZD: 'nz', SGD: 'sg', HKD: 'hk', KWD: 'kw', DKK: 'dk', BHD: 'bh', TJS: 'tj',
  TMT: 'tm', KGS: 'kg', SYP: 'sy', BRL: 'br', ARS: 'ar',
  'EUR-IST': 'eu', 'EUR-HAV': 'eu', 'USD-HAV': 'us', 'USD-IST': 'us', 'USD-SULAYMANIYAH': 'us', 'USD-HERAT': 'us',
};

const GOLD_ICON_URL = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1fa99.svg'; // coin emoji

const CRYPTO_ICON_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%230f172a"/><stop offset="1" stop-color="%232563eb"/></linearGradient></defs><rect rx="24" ry="24" width="128" height="128" fill="url(%23g)"/><circle cx="64" cy="64" r="46" fill="%230b1221" opacity="0.65"/><text x="64" y="74" text-anchor="middle" font-size="32" font-family="Inter,Arial" font-weight="700" fill="%23e2e8f0">CR</text></svg>';
const FIAT_FLAG_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%231e293b"/><stop offset="1" stop-color="%230ea5e9"/></linearGradient></defs><rect width="160" height="120" rx="14" fill="url(%23fg)"/><rect x="12" y="16" width="136" height="88" rx="10" fill="%230b1221" opacity="0.6"/><text x="80" y="76" text-anchor="middle" font-family="Inter,Arial" font-size="32" font-weight="800" fill="%23e2e8f0">FX</text></svg>';

const getFiatIcon = (symbol: string) => {
  const flagCode = FIAT_FLAG_MAP[symbol];
  if (flagCode) {
    return `https://flagcdn.com/${flagCode}.svg`;
  }
  return FIAT_FLAG_FALLBACK;
};

export const getAssetIconUrl = (symbol: string): string => {
  const detail = getAssetDetail(symbol);

  if (detail.type === 'CRYPTO') {
    return CRYPTO_ICON_MAP[symbol] || `${CRYPTO_ICON_CDN_BASE}/${symbol.toLowerCase()}.png`;
  }

  if (detail.type === 'FIAT') {
    return getFiatIcon(symbol);
  }

  // طلا و سکه
  return GOLD_ICON_URL;
};

export const getAssetFallbackIcon = (symbol: string): string => {
  const detail = getAssetDetail(symbol);
  if (detail.type === 'CRYPTO') return CRYPTO_ICON_GENERIC || CRYPTO_ICON_FALLBACK;
  if (detail.type === 'FIAT') return FIAT_FLAG_FALLBACK;
  return GOLD_ICON_URL;
};
