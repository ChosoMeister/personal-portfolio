
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as cheerio from 'cheerio';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import * as db from './database.js';

// JWT Secrets from environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Zod Validation Schemas
const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط شامل حروف، اعداد و _ باشد');
const passwordSchema = z.string().min(6).max(100);

const loginSchema = z.object({
    username: usernameSchema,
    password: passwordSchema
});

const registerSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: z.string().max(100).optional(),
    securityQuestion: z.string().min(5).max(200),
    securityAnswer: z.string().min(2).max(100)
});

const resetPasswordSchema = z.object({
    username: usernameSchema,
    securityAnswer: z.string().min(2).max(100),
    newPassword: passwordSchema
});

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { message: 'تلاش‌های زیادی انجام شد. لطفاً ۱۵ دقیقه صبر کنید.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: { message: 'تعداد درخواست‌ها بیش از حد مجاز است.' }
});

// JWT Token Generation Functions
const generateAccessToken = (user) => {
    return jwt.sign(
        { username: user.username, isAdmin: !!user.isAdmin },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { username: user.username },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'توکن منقضی شده است', expired: true });
            }
            return res.status(403).json({ message: 'توکن نامعتبر است' });
        }
        req.user = decoded;
        next();
    });
};

const BCRYPT_ROUNDS = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy (nginx/reverse proxy)
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const FALLBACK_PRICES = { usdToToman: 70000, eurToToman: 74000, gold18ToToman: 4700000 };
const FIVE_MINUTES_MS = 5 * 60 * 1000; // Rate limit reduced since AI is no longer used

// Memory Cache for prices only (users are now in SQLite)
let pricesCache = null;

// اطمینان از وجود دایرکتوری داده‌ها
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

try {
    if (fs.existsSync(PRICES_FILE)) {
        pricesCache = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    } else {
        fs.writeFileSync(PRICES_FILE, JSON.stringify(null));
    }
} catch (e) {
    console.error('Error loading prices:', e);
    pricesCache = null;
}

if (!pricesCache) {
    pricesCache = {
        usdToToman: FALLBACK_PRICES.usdToToman,
        eurToToman: FALLBACK_PRICES.eurToToman,
        gold18ToToman: FALLBACK_PRICES.gold18ToToman,
        fiatPricesToman: {
            USD: FALLBACK_PRICES.usdToToman,
            EUR: FALLBACK_PRICES.eurToToman,
        },
        cryptoPricesToman: {
            USDT: FALLBACK_PRICES.usdToToman,
        },
        goldPricesToman: {
            GOLD18: FALLBACK_PRICES.gold18ToToman,
            '18AYAR': FALLBACK_PRICES.gold18ToToman,
        },
        fetchedAt: Date.now(),
    };

    fs.promises.writeFile(PRICES_FILE, JSON.stringify(pricesCache)).catch((err) => {
        console.error('Error initializing default prices:', err);
    });
}

const PERSIAN_DIGITS = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
};

const normalizeNumber = (value = '') => {
    const normalized = value
        .toString()
        .replace(/[۰-۹٠-٩]/g, (d) => PERSIAN_DIGITS[d] || d)
        .replace(/[٬,]/g, '')
        .replace(/[^0-9.]/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
};

const fetchCurrencyBoard = async () => {
    const res = await fetch('https://alanchand.com/currencies-price');
    if (!res.ok) throw new Error('Failed to load currency rates');
    const html = await res.text();
    const $ = cheerio.load(html);
    const prices = {};

    $('table tbody tr').each((_, row) => {
        const onclick = $(row).attr('onclick') || '';
        const slug = onclick.split('/').pop()?.replace(/'/g, '').toUpperCase();
        if (!slug) return;
        const sell = normalizeNumber($(row).find('.sellPrice').text());
        const buy = normalizeNumber($(row).find('.buyPrice').text());
        const price = sell || buy;
        if (price) prices[slug] = price;
    });

    return prices;
};

const fetchCryptoBoard = async () => {
    const res = await fetch('https://alanchand.com/crypto-price');
    if (!res.ok) throw new Error('Failed to load crypto rates');
    const html = await res.text();
    const $ = cheerio.load(html);
    const prices = {};

    $('table tbody tr').each((_, row) => {
        const onclick = $(row).attr('onclick') || '';
        const slug = onclick.split('/').pop()?.replace(/'/g, '').toUpperCase();
        if (!slug) return;
        const tomanText = $(row).find('.tmn').text();
        const tomanPrice = normalizeNumber(tomanText);
        if (tomanPrice) prices[slug] = tomanPrice;
    });

    return prices;
};

const fetchGoldBoard = async (usdRate = FALLBACK_PRICES.usdToToman) => {
    const res = await fetch('https://alanchand.com/gold-price');
    if (!res.ok) throw new Error('Failed to load gold rates');
    const html = await res.text();
    const $ = cheerio.load(html);
    const prices = {};

    $('table tbody tr').each((_, row) => {
        const onclick = $(row).attr('onclick') || '';
        const slug = onclick.split('/').pop()?.replace(/'/g, '').toUpperCase();
        if (!slug) return;

        const priceCell = $(row).find('td.priceTd').first();
        const tomanText = priceCell.clone().children().remove().end().text();
        const priceNumber = normalizeNumber(tomanText);
        const hasDollar = tomanText.includes('$');
        const tomanValue = hasDollar ? priceNumber * usdRate : priceNumber;

        if (tomanValue) {
            prices[slug] = tomanValue;
            if (slug === '18AYAR' || slug === 'GOLD18') {
                prices.GOLD18 = tomanValue;
                prices['18AYAR'] = tomanValue;
            }
        }
    });

    return prices;
};

// Backup source: tgju.org for gold/coin prices
const fetchTgjuGold = async () => {
    try {
        const res = await fetch('https://www.tgju.org/profile/geram18', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        const prices = {};
        // Try to get price from the page
        const priceText = $('[data-col="info.last_trade.PDrCotVal"]').text() ||
            $('.info-price').first().text();
        const price = normalizeNumber(priceText);
        if (price) prices.GOLD18 = price;

        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('tgju.org fetch failed:', e.message);
        return null;
    }
};

// Backup source: navasan.net for currency rates
const fetchNavasanCurrency = async () => {
    try {
        const res = await fetch('https://www.navasan.tech/api/latest-rate/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!res.ok) return null;
        const data = await res.json();

        const prices = {};
        // Map navasan symbols to our symbols
        if (data.usd?.value) prices.USD = normalizeNumber(data.usd.value);
        if (data.eur?.value) prices.EUR = normalizeNumber(data.eur.value);
        if (data.aed?.value) prices.AED = normalizeNumber(data.aed.value);
        if (data.try?.value) prices.TRY = normalizeNumber(data.try.value);

        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('navasan.net fetch failed:', e.message);
        return null;
    }
};

// Telegram channel scrapers for TGJU prices
const TELEGRAM_CHANNELS = {
    crypto: 'https://t.me/s/tgjucryptocurrency',
    currency: 'https://t.me/s/tgjucurrency',
    gold: 'https://t.me/s/tgjugold'
};

// Map Persian names to standard symbols (from Telegram TGJU channels)
const CRYPTO_NAME_MAP = {
    // Major cryptos
    'بیت کوین': 'BTC',
    'بیتکوین': 'BTC',
    'اتریوم': 'ETH',
    'اتریوم کلاسیک': 'ETC',
    'تتر': 'USDT',
    'بایننس کوین': 'BNB',
    'ریپل': 'XRP',
    'لایت کوین': 'LTC',
    'کاردانو': 'ADA',
    'سولانا': 'SOL',
    'داج کوین': 'DOGE',
    'دوج کوین': 'DOGE',
    'شیبا اینو': 'SHIB',
    'شیبا': 'SHIB',
    // DeFi & Layer 1
    'آوالانچ': 'AVAX',
    'اوالانچ': 'AVAX',
    'پولکادات': 'DOT',
    'چین لینک': 'LINK',
    'استلار': 'XLM',
    'ترون': 'TRX',
    'تون کوین': 'TON',
    'نات کوین': 'NOT',
    'الروند': 'EGLD',
    'کازماز': 'ATOM',
    'کازموس': 'ATOM',
    // More cryptos from Telegram
    'بیت کوین کش': 'BCH',
    'مونرو': 'XMR',
    'زد کش': 'ZEC',
    'دش': 'DASH',
    'نئو': 'NEO',
    'ایاس': 'EOS',
    'تزوس': 'XTZ',
    'فایل کوین': 'FIL',
    'گالا': 'GALA',
    'سندباکس': 'SAND',
    'فانتوم': 'FTM',
    'فلو': 'FLOW',
    'لوپرینگ': 'LRC',
    'دیکرید': 'DCR',
    'ویوز': 'WAVES',
    'نیو اکونومی': 'XEM',
    'بیت تورنت': 'BTT',
    'ماکر': 'MKR',
    'یونی سواپ': 'UNI',
    'پنکیک سواپ': 'CAKE'
};

const CURRENCY_NAME_MAP = {
    // Major currencies
    'دلار': 'USD',
    'یورو': 'EUR',
    'پوند': 'GBP',
    'پوند انگلیس': 'GBP',
    // Middle East
    'درهم امارات': 'AED',
    'درهم': 'AED',
    'لیر ترکیه': 'TRY',
    'لیر': 'TRY',
    'دینار کویت': 'KWD',
    'ریال عمان': 'OMR',
    'دینار عراق': 'IQD',
    'ریال عربستان': 'SAR',
    'دینار بحرین': 'BHD',
    'ریال قطر': 'QAR',
    // Asia
    'یوان چین': 'CNY',
    'روپیه هند': 'INR',
    'ین ژاپن': 'JPY',
    'ین': 'JPY',
    'رینگیت مالزی': 'MYR',
    'یینگیت مالزی': 'MYR',
    // Other
    'دلار کانادا': 'CAD',
    'دلار استرالیا': 'AUD',
    'دلار نیوزیلند': 'NZD',
    'فرانک سوئیس': 'CHF'
};

const GOLD_NAME_MAP = {
    // Gold by Karat
    'طلای ۱۸ عیار': 'GOLD18',
    'طلای 18 عیار': 'GOLD18',
    'طلا ۱۸ عیار': 'GOLD18',
    'طلا 18 عیار': 'GOLD18',
    'گرم طلای ۱۸': 'GOLD18',
    'گرم طلای 18': 'GOLD18',
    'طلای ۲۴ عیار': 'GOLD24',
    'طلای 24 عیار': 'GOLD24',
    'طلای دست دوم': 'GOLD_USED',
    // Coins
    'سکه امامی': 'COIN_EMAMI',
    'سکه بهار آزادی': 'COIN_BAHAR',
    'نیم سکه': 'HALF_COIN',
    'ربع سکه': 'QUARTER_COIN',
    'سکه گرمی': 'COIN_GERAMI',
    // Other gold
    'مثقال طلا': 'MESGHAL',
    'مثقال': 'MESGHAL',
    'آبشده': 'GOLD_MELTED',
    'آبشده نقدی': 'GOLD_MELTED',
    'اونس طلا': 'GOLD_OZ',
    'نقره': 'SILVER'
};

// Parse price text from Telegram message format: "◽️ بیت کوین : 117,699,670,000 ریال"
const parseTelegramPrices = (text, nameMap) => {
    const prices = {};
    const lines = text.split(/[\n◽️◾️🔸🔹⬜️⬛️□■▫️▪️●○]/);

    for (const line of lines) {
        // Match pattern: "name : number ریال" or "name : number تومان"
        const match = line.match(/([^:]+?)\s*:\s*([\d,٬۰-۹]+)\s*(ریال|تومان)/);
        if (match) {
            const name = match[1].trim();
            let priceStr = match[2];
            const unit = match[3];

            // Find matching symbol
            let symbol = null;
            for (const [persianName, sym] of Object.entries(nameMap)) {
                if (name.includes(persianName)) {
                    symbol = sym;
                    break;
                }
            }

            if (symbol) {
                const price = normalizeNumber(priceStr);
                // Convert ریال to تومان if needed
                const priceInToman = unit === 'ریال' ? Math.round(price / 10) : price;
                if (priceInToman > 0) {
                    prices[symbol] = priceInToman;
                }
            }
        }
    }

    return prices;
};

// Fetch crypto prices from Telegram channel
const fetchTelegramCrypto = async () => {
    try {
        const res = await fetch(TELEGRAM_CHANNELS.crypto, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        // Get all messages and combine them for better coverage
        const messages = $('.tgme_widget_message_text');
        if (messages.length === 0) return null;

        // Get text from the LAST (most recent) message
        const latestText = $(messages[messages.length - 1]).text();
        const prices = parseTelegramPrices(latestText, CRYPTO_NAME_MAP);

        console.log(`[Telegram] Crypto: fetched ${Object.keys(prices).length} prices`);
        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('[Telegram] Crypto fetch failed:', e.message);
        return null;
    }
};

// Fetch currency prices from Telegram channel
const fetchTelegramCurrency = async () => {
    try {
        const res = await fetch(TELEGRAM_CHANNELS.currency, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        const messages = $('.tgme_widget_message_text');
        if (messages.length === 0) return null;

        // Get text from the LAST (most recent) message
        const latestText = $(messages[messages.length - 1]).text();
        const prices = parseTelegramPrices(latestText, CURRENCY_NAME_MAP);

        console.log(`[Telegram] Currency: fetched ${Object.keys(prices).length} prices`);
        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('[Telegram] Currency fetch failed:', e.message);
        return null;
    }
};

// Fetch gold prices from Telegram channel
const fetchTelegramGold = async () => {
    try {
        const res = await fetch(TELEGRAM_CHANNELS.gold, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        const messages = $('.tgme_widget_message_text');
        if (messages.length === 0) return null;

        // Get text from the LAST (most recent) message
        const latestText = $(messages[messages.length - 1]).text();
        const prices = parseTelegramPrices(latestText, GOLD_NAME_MAP);

        // Ensure we have GOLD18 alias
        if (prices['18AYAR'] && !prices.GOLD18) prices.GOLD18 = prices['18AYAR'];
        if (prices.GOLD18 && !prices['18AYAR']) prices['18AYAR'] = prices.GOLD18;

        console.log(`[Telegram] Gold: fetched ${Object.keys(prices).length} prices`);
        return Object.keys(prices).length > 0 ? prices : null;
    } catch (e) {
        console.log('[Telegram] Gold fetch failed:', e.message);
        return null;
    }
};

// Multi-source fetcher with smart merging
// Primary source is tried first, then backups are used to fill in missing prices
const fetchWithFallback = async (primaryFn, backupFns = [], category = 'unknown') => {
    let mergedData = {};
    let primarySource = 'none';
    let usedBackups = [];

    // Try primary source first
    try {
        const result = await primaryFn();
        if (result && Object.keys(result).length > 0) {
            mergedData = { ...result };
            primarySource = 'primary';
            console.log(`[Prices] ${category}: fetched ${Object.keys(result).length} from primary`);
        }
    } catch (e) {
        console.log(`[Prices] ${category}: primary failed - ${e.message}`);
    }

    // Always try backup sources to fill in missing assets
    for (let i = 0; i < backupFns.length; i++) {
        try {
            const result = await backupFns[i]();
            if (result && Object.keys(result).length > 0) {
                let addedCount = 0;
                // Only add prices that don't exist in merged data
                for (const [symbol, price] of Object.entries(result)) {
                    if (!mergedData[symbol] && price) {
                        mergedData[symbol] = price;
                        addedCount++;
                    }
                }
                if (addedCount > 0) {
                    usedBackups.push(`backup${i + 1}`);
                    console.log(`[Prices] ${category}: added ${addedCount} missing from backup ${i + 1}`);
                }
            }
        } catch (e) {
            console.log(`[Prices] ${category}: backup ${i + 1} failed - ${e.message}`);
        }
    }

    const source = primarySource !== 'none'
        ? (usedBackups.length > 0 ? `${primarySource}+${usedBackups.join('+')}` : primarySource)
        : (usedBackups.length > 0 ? usedBackups.join('+') : 'none');

    console.log(`[Prices] ${category}: total ${Object.keys(mergedData).length} prices from ${source}`);
    return { data: mergedData, source };
};

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
app.use(express.static(path.join(__dirname, 'dist')));

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

const refreshAdmin = async () => {
    let user = db.getUser(ADMIN_USER);

    if (!user) {
        db.createUser({
            username: ADMIN_USER,
            passwordHash: ADMIN_PASS,
            isAdmin: true,
            displayName: 'ادمین سیستم',
            createdAt: new Date().toISOString(),
            securityQuestion: 'کلمه عبور پیش‌فرض ادمین؟',
            securityAnswerHash: ADMIN_PASS
        });
        console.log(`[Security] Admin user created: ${ADMIN_USER}`);
    } else {
        let needsUpdate = false;
        const updates = {};

        if (user.passwordHash !== ADMIN_PASS || !user.isAdmin) {
            updates.passwordHash = ADMIN_PASS;
            updates.isAdmin = true;
            needsUpdate = true;
        }
        if (!user.displayName) {
            updates.displayName = 'ادمین سیستم';
            needsUpdate = true;
        }
        if (!user.securityQuestion) {
            updates.securityQuestion = 'کلمه عبور پیش‌فرض ادمین؟';
            needsUpdate = true;
        }
        if (!user.securityAnswerHash) {
            updates.securityAnswerHash = ADMIN_PASS;
            needsUpdate = true;
        }

        if (needsUpdate) {
            db.updateUser(ADMIN_USER, updates);
        }
    }
};
refreshAdmin();

// ساده‌ترین مسیر برای ارسال لاگ‌های سمت کلاینت به لاگ‌های داکر
app.post('/api/logs', (req, res) => {
    const { level = 'info', message = '', context = {} } = req.body || {};
    const logLine = `[ClientLog][${level.toUpperCase()}] ${message}`;

    if (level === 'error' || level === 'warn') {
        console.error(logLine, context);
    } else {
        console.log(logLine, context);
    }

    res.json({ success: true });
});

// API Endpoints
app.post('/api/login', authLimiter, async (req, res) => {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password } = validation.data;
    username = username.toLowerCase();
    const user = db.getUser(username);

    if (!user) {
        return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // Check if password is hashed (bcrypt hashes start with $2)
    const isHashed = user.passwordHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        // Compare with bcrypt
        isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
        // Legacy plain text comparison (for migration)
        isMatch = user.passwordHash === password;

        // Migrate legacy password to bcrypt hash
        if (isMatch) {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
            db.updateUserPassword(username, hashedPassword);
            console.log(`[Security] Migrated password for user: ${username}`);
        }
    }

    if (isMatch) {
        // Generate JWT tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.json({
            username: user.username,
            isAdmin: !!user.isAdmin,
            displayName: user.displayName || user.username,
            accessToken,
            refreshToken
        });
    }

    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

// Refresh token endpoint
app.post('/api/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'توکن رفرش یافت نشد' });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'توکن رفرش نامعتبر است' });
        }

        const user = db.getUser(decoded.username);
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد' });
        }

        const accessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });
    });
});

app.post('/api/register', authLimiter, async (req, res) => {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password, displayName, securityQuestion, securityAnswer } = validation.data;
    username = username.toLowerCase();

    if (db.getUser(username)) {
        return res.status(400).json({ message: 'نام کاربری تکراری است' });
    }

    // Hash password and security answer
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), BCRYPT_ROUNDS);

    db.createUser({
        username,
        passwordHash: hashedPassword,
        displayName: displayName || username,
        isAdmin: false,
        securityQuestion,
        securityAnswerHash: hashedSecurityAnswer
    });

    console.log(`[Security] New user registered with hashed credentials: ${username}`);
    res.json({ username, isAdmin: false, displayName: displayName || username });
});

app.get('/api/security-question', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = db.getUser(username);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.json({ securityQuestion: user.securityQuestion || 'سوال امنیتی ثبت نشده است' });
});

app.post('/api/reset-password', authLimiter, async (req, res) => {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, securityAnswer, newPassword } = validation.data;
    username = username.toLowerCase();
    const user = db.getUser(username);

    if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    if (!user.securityAnswerHash) {
        return res.status(400).json({ message: 'سوال امنیتی ثبت نشده است' });
    }

    // Check if security answer is hashed
    const isHashed = user.securityAnswerHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        isMatch = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswerHash);
    } else {
        // Legacy plain text comparison
        isMatch = user.securityAnswerHash.toLowerCase() === securityAnswer.toLowerCase();
    }

    if (!isMatch) {
        return res.status(401).json({ message: 'پاسخ امنیتی اشتباه است' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    db.updateUserPassword(username, hashedPassword);
    console.log(`[Security] Password reset for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    const users = db.getAllUsers();
    res.json(users.map(u => ({
        username: u.username,
        createdAt: u.createdAt,
        txCount: u.txCount,
        isAdmin: !!u.isAdmin,
        displayName: u.displayName || u.username
    })));
});

app.post('/api/users/delete', verifyToken, async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase();
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    db.deleteUser(username);
    res.json({ success: true });
});

app.post('/api/users/update-pass', verifyToken, async (req, res) => {
    let { username, newPassword } = req.body;

    // Validate password
    const passValidation = passwordSchema.safeParse(newPassword);
    if (!passValidation.success) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
    }

    username = username.toLowerCase();
    const user = db.getUser(username);

    if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    db.updateUserPassword(username, hashedPassword);
    console.log(`[Security] Password updated for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/transactions', verifyToken, (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const transactions = db.getTransactions(username);
    res.json(transactions);
});

app.post('/api/transactions', verifyToken, async (req, res) => {
    let { username, transaction } = req.body;
    username = username.toLowerCase();
    db.saveTransaction(username, transaction);

    res.json({ success: true });
});

app.post('/api/transactions/delete', verifyToken, async (req, res) => {
    let { username, id } = req.body;
    db.deleteTransaction(id);
    res.json({ success: true });
});

app.get('/api/prices', (req, res) => {
    res.json(pricesCache);
});

app.get('/api/prices/refresh', async (req, res) => {
    try {
        const now = Date.now();
        if (pricesCache?.fetchedAt && now - pricesCache.fetchedAt < FIVE_MINUTES_MS) {
            const nextAllowedAt = pricesCache.fetchedAt + FIVE_MINUTES_MS;
            const remainingMs = nextAllowedAt - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            const nextAllowedTime = new Date(nextAllowedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

            return res.json({
                success: true,
                data: pricesCache,
                skipped: true,
                nextAllowedAt: nextAllowedAt,
                message: `بروزرسانی بعدی ساعت ${nextAllowedTime} (${remainingMinutes} دقیقه دیگر)`,
            });
        }

        const sources = [];

        // Fetch currencies with fallback (Telegram as first backup)
        const fiatResult = await fetchWithFallback(
            fetchCurrencyBoard,
            [fetchTelegramCurrency, fetchNavasanCurrency],
            'currencies'
        );
        const fiatPrices = fiatResult.data;
        sources.push({ type: 'fiat', source: fiatResult.source });

        // Fetch crypto with Telegram as backup
        const cryptoResult = await fetchWithFallback(
            fetchCryptoBoard,
            [fetchTelegramCrypto],
            'crypto'
        );
        const cryptoPrices = cryptoResult.data;
        sources.push({ type: 'crypto', source: cryptoResult.source });

        const usdRate = fiatPrices.USD || pricesCache?.usdToToman || FALLBACK_PRICES.usdToToman;

        // Fetch gold with fallback (Telegram as first backup)
        const goldResult = await fetchWithFallback(
            () => fetchGoldBoard(usdRate),
            [fetchTelegramGold, fetchTgjuGold],
            'gold'
        );
        const goldPrices = goldResult.data;
        sources.push({ type: 'gold', source: goldResult.source });

        const priceData = {
            usdToToman: usdRate,
            eurToToman: fiatPrices.EUR || pricesCache?.eurToToman || FALLBACK_PRICES.eurToToman,
            gold18ToToman: goldPrices.GOLD18 || pricesCache?.gold18ToToman || FALLBACK_PRICES.gold18ToToman,
            fiatPricesToman: { ...fiatPrices },
            cryptoPricesToman: { ...cryptoPrices },
            goldPricesToman: { ...goldPrices },
            fetchedAt: Date.now(),
        };

        if (!priceData.fiatPricesToman.USD) priceData.fiatPricesToman.USD = priceData.usdToToman;
        if (!priceData.fiatPricesToman.EUR) priceData.fiatPricesToman.EUR = priceData.eurToToman;
        if (!priceData.goldPricesToman.GOLD18 && priceData.gold18ToToman) {
            priceData.goldPricesToman.GOLD18 = priceData.gold18ToToman;
        }

        pricesCache = priceData;

        // Save to prices file
        try {
            await fs.promises.writeFile(PRICES_FILE, JSON.stringify(priceData));
        } catch (err) {
            console.error('Error persisting refreshed prices:', err);
        }



        res.json({
            success: true,
            data: priceData,
            sources,
            nextAllowedAt: priceData.fetchedAt + FIVE_MINUTES_MS,
        });
    } catch (error) {
        console.error('Error refreshing prices:', error);
        res.status(500).json({ message: 'بروزرسانی قیمت‌ها با خطا مواجه شد' });
    }
});

app.post('/api/prices', async (req, res) => {
    pricesCache = req.body;
    try {
        await fs.promises.writeFile(PRICES_FILE, JSON.stringify(req.body));
    } catch (e) {
        console.error('Error saving prices:', e);
    }
    res.json({ success: true });
});

// Admin verification middleware
const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'دسترسی فقط برای ادمین مجاز است' });
    }
    next();
};

// Admin-only force price refresh (bypasses 1-hour limit)
app.post('/api/admin/prices/force-refresh', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log(`[Admin] Force price refresh triggered by ${req.user.username}`);
        const sources = [];

        // Fetch currencies with fallback (Telegram as first backup)
        const fiatResult = await fetchWithFallback(
            fetchCurrencyBoard,
            [fetchTelegramCurrency, fetchNavasanCurrency],
            'currencies'
        );
        const fiatPrices = fiatResult.data;
        sources.push({ type: 'fiat', source: fiatResult.source });

        // Fetch crypto with Telegram as backup
        const cryptoResult = await fetchWithFallback(
            fetchCryptoBoard,
            [fetchTelegramCrypto],
            'crypto'
        );
        const cryptoPrices = cryptoResult.data;
        sources.push({ type: 'crypto', source: cryptoResult.source });

        const usdRate = fiatPrices.USD || pricesCache?.usdToToman || FALLBACK_PRICES.usdToToman;

        // Fetch gold with fallback (Telegram as first backup)
        const goldResult = await fetchWithFallback(
            () => fetchGoldBoard(usdRate),
            [fetchTelegramGold, fetchTgjuGold],
            'gold'
        );
        const goldPrices = goldResult.data;
        sources.push({ type: 'gold', source: goldResult.source });

        const priceData = {
            usdToToman: usdRate,
            eurToToman: fiatPrices.EUR || pricesCache?.eurToToman || FALLBACK_PRICES.eurToToman,
            gold18ToToman: goldPrices.GOLD18 || pricesCache?.gold18ToToman || FALLBACK_PRICES.gold18ToToman,
            fiatPricesToman: { ...fiatPrices },
            cryptoPricesToman: { ...cryptoPrices },
            goldPricesToman: { ...goldPrices },
            fetchedAt: Date.now(),
        };

        if (!priceData.fiatPricesToman.USD) priceData.fiatPricesToman.USD = priceData.usdToToman;
        if (!priceData.fiatPricesToman.EUR) priceData.fiatPricesToman.EUR = priceData.eurToToman;
        if (!priceData.goldPricesToman.GOLD18 && priceData.gold18ToToman) {
            priceData.goldPricesToman.GOLD18 = priceData.gold18ToToman;
        }

        pricesCache = priceData;

        // Save to prices file
        try {
            await fs.promises.writeFile(PRICES_FILE, JSON.stringify(priceData));
        } catch (err) {
            console.error('Error persisting refreshed prices:', err);
        }

        res.json({
            success: true,
            data: priceData,
            sources,
            forcedBy: req.user.username,
            message: 'قیمت‌ها با موفقیت بروزرسانی شدند (فورس)',
        });

    } catch (error) {
        console.error('Error force refreshing prices:', error);
        res.status(500).json({ message: 'بروزرسانی قیمت‌ها با خطا مواجه شد' });
    }
});

// Portfolio Snapshot Endpoints
app.get('/api/snapshots', verifyToken, (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : req.user.username;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const snapshots = db.getPortfolioSnapshots(username, startDate, endDate);
    res.json(snapshots);
});

app.post('/api/snapshots', verifyToken, (req, res) => {
    const { username, totalValueToman, totalCostBasisToman } = req.body;
    const user = username ? username.toLowerCase() : req.user.username;

    const success = db.savePortfolioSnapshot(user, totalValueToman, totalCostBasisToman);
    if (success) {
        res.json({ success: true, message: 'Snapshot saved successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Failed to save snapshot' });
    }
});

app.post('/api/snapshots/backfill', verifyToken, (req, res) => {
    const { username, currentTotalValue, currentCostBasis } = req.body;
    const user = username ? username.toLowerCase() : req.user.username;

    // Check if snapshots already exist
    const existingSnapshots = db.getPortfolioSnapshots(user);
    if (existingSnapshots.length > 0) {
        return res.json({
            success: false,
            message: 'Snapshots already exist. Backfill skipped.',
            snapshotCount: existingSnapshots.length
        });
    }

    const success = db.backfillSnapshots(user, currentTotalValue, currentCostBasis);
    if (success) {
        const snapshots = db.getPortfolioSnapshots(user);
        res.json({
            success: true,
            message: 'Historical snapshots generated successfully',
            snapshotCount: snapshots.length
        });
    } else {
        res.status(400).json({ success: false, message: 'Failed to generate historical snapshots' });
    }
});

// SPA Routing: ارسال تمام درخواست‌های ناشناخته به ایندکس
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
