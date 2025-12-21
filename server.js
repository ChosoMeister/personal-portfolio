
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
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const FALLBACK_PRICES = { usdToToman: 70000, eurToToman: 74000, gold18ToToman: 4700000 };
const ONE_HOUR_MS = 60 * 60 * 1000;

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
        if (pricesCache?.fetchedAt && now - pricesCache.fetchedAt < ONE_HOUR_MS) {
            return res.json({
                success: true,
                data: pricesCache,
                skipped: true,
                nextAllowedAt: pricesCache.fetchedAt + ONE_HOUR_MS,
                message: 'آخرین بروزرسانی کمتر از یک ساعت پیش انجام شده است',
            });
        }

        const [fiatPrices, cryptoPrices] = await Promise.all([
            fetchCurrencyBoard(),
            fetchCryptoBoard()
        ]);
        const usdRate = fiatPrices.USD || pricesCache?.usdToToman || FALLBACK_PRICES.usdToToman;
        const goldPrices = await fetchGoldBoard(usdRate);

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
        try {
            await fs.promises.writeFile(PRICES_FILE, JSON.stringify(priceData));
        } catch (err) {
            console.error('Error persisting refreshed prices:', err);
        }

        res.json({
            success: true,
            data: priceData,
            sources: [
                { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
                { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
            ],
            nextAllowedAt: priceData.fetchedAt + ONE_HOUR_MS,
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

// SPA Routing: ارسال تمام درخواست‌های ناشناخته به ایندکس
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
