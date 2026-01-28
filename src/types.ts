export type AssetSymbol = string;
export type AssetType = 'FIAT' | 'GOLD' | 'CRYPTO';
export type Currency = 'TOMAN' | 'USD';

export interface Transaction {
  id: string;
  assetSymbol: AssetSymbol;
  quantity: number;
  buyDateTime: string; // ISO string
  buyPricePerUnit: number;
  buyCurrency: Currency;
  feesToman: number;
  note?: string;
}

export interface PriceData {
  usdToToman: number;
  eurToToman: number;
  gold18ToToman: number;
  fiatPricesToman: Record<string, number>;
  cryptoPricesToman: Record<string, number>;
  goldPricesToman: Record<string, number>;
  fetchedAt: number;
}

export interface AssetSummary {
  symbol: AssetSymbol;
  name: string;
  type: AssetType;
  totalQuantity: number;
  currentPriceToman: number;
  currentValueToman: number;
  costBasisToman: number;
  pnlToman: number;
  pnlPercent: number;
  allocationPercent: number;
  currentPriceUsd?: number;
}

export interface PortfolioSummary {
  totalValueToman: number;
  totalCostBasisToman: number;
  totalPnlToman: number;
  totalPnlPercent: number;
  assets: AssetSummary[];
}

const currencyAssets = [
  { symbol: 'USD', name: 'دلار آمریکا' },
  { symbol: 'EUR', name: 'یورو' },
  { symbol: 'AED', name: 'درهم' },
  { symbol: 'TRY', name: 'لیر ترکیه' },
  { symbol: 'GBP', name: 'پوند انگلیس' },
  { symbol: 'CNY', name: 'یوان چین' },
  { symbol: 'CAD', name: 'دلار کانادا' },
  { symbol: 'AUD', name: 'دلار استرالیا' },
  { symbol: 'RUB', name: 'روبل روسیه' },
  { symbol: 'IQD', name: 'صد دینار عراق' },
  { symbol: 'MYR', name: 'رینگیت مالزی' },
  { symbol: 'GEL', name: 'لاری گرجستان' },
  { symbol: 'AZN', name: 'منات آذربایجان' },
  { symbol: 'AMD', name: 'صد درام ارمنستان' },
  { symbol: 'THB', name: 'بات تایلند' },
  { symbol: 'OMR', name: 'ریال عمان' },
  { symbol: 'INR', name: 'روپیه هند' },
  { symbol: 'PKR', name: 'روپیه پاکستان' },
  { symbol: 'JPY', name: 'صد ین ژاپن' },
  { symbol: 'SAR', name: 'ریال عربستان' },
  { symbol: 'AFN', name: 'افغانی' },
  { symbol: 'SEK', name: 'کرون سوئد' },
  { symbol: 'CHF', name: 'فرانک سوئیس' },
  { symbol: 'QAR', name: 'ریال قطر' },
  { symbol: 'KRW', name: 'صد وون کره جنوبی' },
  { symbol: 'NOK', name: 'کرون نروژ' },
  { symbol: 'NZD', name: 'دلار نیوزلند' },
  { symbol: 'SGD', name: 'دلار سنگاپور' },
  { symbol: 'HKD', name: 'دلار هنگ کنگ' },
  { symbol: 'KWD', name: 'دینار کویت' },
  { symbol: 'DKK', name: 'کرون دانمارک' },
  { symbol: 'BHD', name: 'دینار بحرین' },
  { symbol: 'TJS', name: 'سامانی تاجیکستان' },
  { symbol: 'TMT', name: 'منات ترکمنستان' },
  { symbol: 'KGS', name: 'سوم قرقیزستان' },
  { symbol: 'SYP', name: 'صد پوند سوریه' },
  { symbol: 'BRL', name: 'رئال برزیل' },
  { symbol: 'ARS', name: 'پزو آرژانتین' },
  { symbol: 'USD-HAV', name: 'حواله دلار آمریکا' },
  { symbol: 'USD-IST', name: 'دلار استانبول' },
  { symbol: 'USD-SULAYMANIYAH', name: 'دلار سلیمانیه' },
  { symbol: 'USD-HERAT', name: 'دلار هرات' },
  { symbol: 'EUR-HAV', name: 'حواله یورو' },
  { symbol: 'EUR-IST', name: 'یورو استانبول' },
];

const cryptoAssets = [
  { symbol: 'USDT', name: 'تتر' },
  { symbol: 'BTC', name: 'بیت کوین' },
  { symbol: 'ETH', name: 'اتریوم' },
  { symbol: 'ETC', name: 'اتریوم کلاسیک' },
  { symbol: 'XRP', name: 'ریپل' },
  { symbol: 'BNB', name: 'بایننس کوین' },
  { symbol: 'SHIB', name: 'شیبا' },
  { symbol: 'ADA', name: 'کاردانو' },
  { symbol: 'DOGE', name: 'دوج‌کوین' },
  { symbol: 'TON', name: 'تون کوین' },
  { symbol: 'NOT', name: 'نات کوین' },
  { symbol: 'SOL', name: 'سولانا' },
  { symbol: 'TRX', name: 'ترون' },
  { symbol: 'CAKE', name: 'پنکیک سواپ' },
  { symbol: 'AVAX', name: 'آوالانچ' },
  { symbol: 'DOT', name: 'پولکادات' },
  { symbol: 'LINK', name: 'چین‌لینک' },
  { symbol: 'LTC', name: 'لایت‌کوین' },
  { symbol: 'PEPE', name: 'پپه' },
  { symbol: 'UNI', name: 'یونی‌سواپ' },
  { symbol: 'XLM', name: 'استلار' },
  { symbol: 'FIL', name: 'فایل‌کوین' },
  { symbol: 'NEAR', name: 'نیر پروتکل' },
  { symbol: 'EOS', name: 'ایاس' },
  { symbol: 'AAVE', name: 'آوه' },
  { symbol: 'GRT', name: 'گراف' },
  { symbol: 'XTZ', name: 'تزوس' },
  { symbol: 'FLOW', name: 'فلو' },
  { symbol: 'SAND', name: 'سندباکس' },
  { symbol: 'MANA', name: 'دی‌سنترالند' },
  { symbol: 'AXS', name: 'اکسی اینفینیتی' },
  { symbol: 'CHZ', name: 'چیلیز' },
  { symbol: 'ENJ', name: 'انجین کوین' },
  { symbol: 'ZEC', name: 'زدکش' },
  { symbol: 'GALA', name: 'گالا' },
  { symbol: 'LRC', name: 'لوپرینگ' },
  { symbol: 'BAT', name: 'بت' },
  { symbol: 'ONE', name: 'هارمونی' },
  { symbol: 'ZEN', name: 'هورایزن' },
  { symbol: 'CVC', name: 'سیویک' },
  { symbol: 'STORJ', name: 'استورج' },
];

const goldAssets = [
  { symbol: 'GOLD18', name: 'طلای ۱۸ عیار' },
  { symbol: '18AYAR', name: 'طلای ۱۸ عیار (آلان‌چند)' },
  { symbol: 'ABSHODEH', name: 'آبشده (مثقال طلا)' },
  { symbol: 'SEKKEH', name: 'سکه امامی (طرح جدید)' },
  { symbol: 'BAHAR', name: 'سکه بهار آزادی' },
  { symbol: 'NIM', name: 'نیم سکه' },
  { symbol: 'ROB', name: 'ربع سکه' },
  { symbol: 'SEK', name: 'سکه گرمی' },
  { symbol: 'USD_XAU', name: 'انس طلا (دلار)' },
  { symbol: 'XAG', name: 'انس نقره (دلار)' },
];

const baseAssets = [
  ...goldAssets.map(asset => ({ ...asset, type: 'GOLD' as AssetType })),
  ...currencyAssets.map(asset => ({ ...asset, type: 'FIAT' as AssetType })),
  ...cryptoAssets.map(asset => ({ ...asset, type: 'CRYPTO' as AssetType })),
];

export const ASSET_DETAILS: Record<AssetSymbol, { name: string; type: AssetType }> = baseAssets.reduce((acc, asset) => {
  acc[asset.symbol] = { name: asset.name, type: asset.type };
  return acc;
}, {} as Record<AssetSymbol, { name: string; type: AssetType }>);

export const getAssetDetail = (symbol: AssetSymbol): { name: string; type: AssetType } => {
  return ASSET_DETAILS[symbol] || { name: symbol, type: 'CRYPTO' };
};
