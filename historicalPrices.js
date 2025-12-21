/**
 * Historical Price API Module
 * Fetches historical prices from Gemini AI (for Iranian assets) and CoinGecko (for crypto)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API setup
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

// Symbol mappings
const IRANIAN_ASSETS = {
    USD: 'دلار آمریکا',
    EUR: 'یورو',
    AED: 'درهم امارات',
    TRY: 'لیر ترکیه',
    GOLD18: 'طلای ۱۸ عیار (هر گرم)',
    GOLDMELT: 'طلای آبشده (هر گرم)',
    EMAMI: 'سکه امامی',
    BAHAR: 'سکه بهار آزادی',
    HALFCOIN: 'نیم سکه',
    QUARTERCOIN: 'ربع سکه'
};

const CRYPTO_COINGECKO_IDS = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    XRP: 'ripple',
    SOL: 'solana',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    TRX: 'tron',
    DOT: 'polkadot'
};

/**
 * Convert Gregorian date to Persian date string
 */
const toPersianDate = (date) => {
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

/**
 * Fetch historical prices for Iranian assets from Gemini AI
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string[]} symbols - Array of asset symbols (e.g., ['USD', 'EUR', 'GOLD18'])
 * @returns {Promise<Object>} - { USD: 70000, EUR: 75000, ... }
 */
export const fetchIranianHistoricalPrices = async (dateStr, symbols = Object.keys(IRANIAN_ASSETS)) => {
    if (!model) {
        console.error('Gemini API not configured');
        return null;
    }

    const date = new Date(dateStr);
    const persianDate = toPersianDate(date);

    // Build asset list
    const assetList = symbols
        .filter(s => IRANIAN_ASSETS[s])
        .map(s => `- ${IRANIAN_ASSETS[s]}`)
        .join('\n');

    const prompt = `قیمت دارایی‌های زیر به تومان در تاریخ ${persianDate} چقدر بود؟

${assetList}

لطفاً فقط یک JSON برگردون با کلیدهای انگلیسی و مقادیر عددی (بدون کاما یا متن اضافه).
مثال: {"USD": 70000, "EUR": 75000, "GOLD18": 4500000}

فقط JSON خالص برگردون، هیچ توضیح اضافه نده.`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const prices = JSON.parse(jsonMatch[0]);
            return prices;
        }

        console.error('Could not parse Gemini response:', responseText);
        return null;
    } catch (error) {
        console.error('Error fetching from Gemini:', error);
        return null;
    }
};

/**
 * Fetch historical prices for crypto from CoinGecko
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string[]} symbols - Array of crypto symbols (e.g., ['BTC', 'ETH'])
 * @param {number} usdToToman - USD to Toman exchange rate
 * @returns {Promise<Object>} - { BTC: 5000000000, ETH: 300000000, ... }
 */
export const fetchCryptoHistoricalPrices = async (dateStr, symbols = Object.keys(CRYPTO_COINGECKO_IDS), usdToToman = 70000) => {
    const prices = {};
    const date = new Date(dateStr);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;

    for (const symbol of symbols) {
        const coinId = CRYPTO_COINGECKO_IDS[symbol];
        if (!coinId) continue;

        try {
            const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${formattedDate}&localization=false`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`CoinGecko error for ${symbol}:`, response.status);
                continue;
            }

            const data = await response.json();
            const usdPrice = data.market_data?.current_price?.usd;

            if (usdPrice) {
                prices[symbol] = Math.round(usdPrice * usdToToman);
            }

            // Rate limiting - CoinGecko free tier has limits
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            console.error(`Error fetching ${symbol} from CoinGecko:`, error);
        }
    }

    return prices;
};

/**
 * Get all Wednesdays between two dates
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string[]} - Array of date strings in YYYY-MM-DD format
 */
export const getWednesdays = (startDate, endDate) => {
    const wednesdays = [];
    const current = new Date(startDate);

    // Move to first Wednesday
    const day = current.getDay();
    const daysUntilWednesday = (3 - day + 7) % 7;
    current.setDate(current.getDate() + daysUntilWednesday);

    while (current <= endDate) {
        wednesdays.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 7);
    }

    return wednesdays;
};

/**
 * Detect asset type from symbol
 */
export const getAssetType = (symbol) => {
    if (IRANIAN_ASSETS[symbol]) return 'iranian';
    if (CRYPTO_COINGECKO_IDS[symbol]) return 'crypto';
    return 'unknown';
};

export const SUPPORTED_IRANIAN_ASSETS = Object.keys(IRANIAN_ASSETS);
export const SUPPORTED_CRYPTO_ASSETS = Object.keys(CRYPTO_COINGECKO_IDS);
