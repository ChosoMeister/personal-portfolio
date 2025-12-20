
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

const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=025',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025',
  ETC: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.png?v=025',
  ADA: 'https://cryptologos.cc/logos/cardano-ada-logo.png?v=025',
  USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=025',
  BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=025',
  XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png?v=025',
  SHIB: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png?v=025',
  SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=025',
  TON: 'https://cryptologos.cc/logos/toncoin-ton-logo.png?v=025',
  TRX: 'https://cryptologos.cc/logos/tron-trx-logo.png?v=025',
  LTC: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=025',
};

const FIAT_FLAG_MAP: Record<string, string> = {
  USD: 'us', EUR: 'eu', AED: 'ae', TRY: 'tr', GBP: 'gb', CNY: 'cn', CAD: 'ca', AUD: 'au', RUB: 'ru',
  IQD: 'iq', MYR: 'my', GEL: 'ge', AZN: 'az', AMD: 'am', THB: 'th', OMR: 'om', INR: 'in',
  PKR: 'pk', JPY: 'jp', SAR: 'sa', AFN: 'af', SEK: 'se', CHF: 'ch', QAR: 'qa', KRW: 'kr',
  NOK: 'no', NZD: 'nz', SGD: 'sg', HKD: 'hk', KWD: 'kw', DKK: 'dk', BHD: 'bh', TJS: 'tj',
  TMT: 'tm', KGS: 'kg', SYP: 'sy', BRL: 'br', ARS: 'ar',
  'EUR-IST': 'eu', 'EUR-HAV': 'eu', 'USD-HAV': 'us', 'USD-IST': 'us', 'USD-SULAYMANIYAH': 'us', 'USD-HERAT': 'us',
};

const GOLD_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/138/138281.png';

const getFiatIcon = (symbol: string) => {
  const flagCode = FIAT_FLAG_MAP[symbol];
  if (flagCode) {
    return `https://wise.com/public-resources/assets/flags/rectangle/${flagCode}.png`;
  }
  return `https://alanchand.com/assets/img/currency/${symbol}.svg`;
};

export const getAssetIconUrl = (symbol: string): string => {
  const detail = getAssetDetail(symbol);

  if (detail.type === 'CRYPTO') {
    return CRYPTO_ICON_MAP[symbol] || `https://alanchand.com/assets/img/crypto/${symbol}.svg`;
  }

  if (detail.type === 'FIAT') {
    return getFiatIcon(symbol);
  }

  // طلا و سکه
  return GOLD_ICON_URL;
};
