
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const FALLBACK_PRICES = { usdToToman: 70000, eurToToman: 74000, gold18ToToman: 4700000 };

// Memory Cache
let usersCache = [];
let pricesCache = null;

// اطمینان از وجود دایرکتوری داده‌ها
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data into memory on startup
try {
    if (fs.existsSync(USERS_FILE)) {
        usersCache = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
} catch (e) {
    console.error('Error loading users:', e);
    usersCache = [];
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

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

const getUsers = () => {
    return usersCache;
};

const saveUsers = async (users) => {
    usersCache = users; // Update Memory Immediately
    try {
        await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users to disk:', e);
    }
};

const refreshAdmin = async () => {
    let users = [...getUsers()]; // Clone to avoid mutation issues
    let adminIdx = users.findIndex(u => u.username === ADMIN_USER);
    let changed = false;

    if (adminIdx === -1) {
        users.push({
            username: ADMIN_USER,
            passwordHash: ADMIN_PASS,
            isAdmin: true,
            displayName: 'ادمین سیستم',
            createdAt: new Date(),
            transactions: [],
            securityQuestion: 'کلمه عبور پیش‌فرض ادمین؟',
            securityAnswerHash: ADMIN_PASS
        });
        changed = true;
    } else {
        if (users[adminIdx].passwordHash !== ADMIN_PASS || !users[adminIdx].isAdmin) {
            users[adminIdx].passwordHash = ADMIN_PASS;
            users[adminIdx].isAdmin = true;
            changed = true;
        }
        if (!users[adminIdx].displayName) {
            users[adminIdx].displayName = 'ادمین سیستم';
            changed = true;
        }
        if (!users[adminIdx].securityQuestion) {
            users[adminIdx].securityQuestion = 'کلمه عبور پیش‌فرض ادمین؟';
            changed = true;
        }
        if (!users[adminIdx].securityAnswerHash) {
            users[adminIdx].securityAnswerHash = ADMIN_PASS;
            changed = true;
        }
    }

    if (changed) await saveUsers(users);
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
app.post('/api/login', (req, res) => {
    let { username, password } = req.body;
    username = username.toLowerCase();
    const users = getUsers();
    const user = users.find(u => u.username === username && u.passwordHash === password);
    if (user) return res.json({ username: user.username, isAdmin: !!user.isAdmin, displayName: user.displayName || user.username });
    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.post('/api/register', async (req, res) => {
    let { username, password, displayName, securityQuestion, securityAnswer } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    if (users.find(u => u.username === username)) return res.status(400).json({ message: 'نام کاربری تکراری است' });
    if (!securityQuestion || !securityAnswer) return res.status(400).json({ message: 'سوال و پاسخ امنیتی اجباری است' });
    const newUser = {
        username,
        passwordHash: password,
        displayName: displayName || username,
        createdAt: new Date(),
        transactions: [],
        isAdmin: false,
        securityQuestion,
        securityAnswerHash: securityAnswer
    };
    users.push(newUser);
    await saveUsers(users);
    res.json({ username: newUser.username, isAdmin: false, displayName: newUser.displayName });
});

app.get('/api/security-question', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.json({ securityQuestion: user.securityQuestion || 'سوال امنیتی ثبت نشده است' });
});

app.post('/api/reset-password', async (req, res) => {
    let { username, securityAnswer, newPassword } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.status(404).json({ message: 'کاربر یافت نشد' });
    const user = users[userIndex];
    if (!user.securityAnswerHash) return res.status(400).json({ message: 'سوال امنیتی ثبت نشده است' });
    if (user.securityAnswerHash !== securityAnswer) return res.status(401).json({ message: 'پاسخ امنیتی اشتباه است' });
    users[userIndex] = { ...user, passwordHash: newPassword };
    await saveUsers(users);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    res.json(getUsers().map(u => ({
        username: u.username,
        createdAt: u.createdAt,
        txCount: u.transactions.length,
        isAdmin: !!u.isAdmin,
        displayName: u.displayName || u.username
    })));
});

app.post('/api/users/delete', async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase();
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    await saveUsers(getUsers().filter(u => u.username !== username));
    res.json({ success: true });
});

app.post('/api/users/update-pass', async (req, res) => {
    let { username, newPassword } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) return res.status(404).json({ message: 'کاربر یافت نشد' });
    users[userIndex] = { ...users[userIndex], passwordHash: newPassword };
    await saveUsers(users);
    res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    res.json(user ? user.transactions : []);
});

app.post('/api/transactions', async (req, res) => {
    let { username, transaction } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        // Create a copy of the user to update
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        const idx = user.transactions.findIndex(t => t.id === transaction.id);

        if (idx > -1) user.transactions[idx] = transaction;
        else user.transactions.push(transaction);

        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.post('/api/transactions/delete', async (req, res) => {
    let { username, id } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        user.transactions = user.transactions.filter(t => t.id !== id);
        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.get('/api/prices', (req, res) => {
    res.json(pricesCache);
});

app.get('/api/prices/refresh', async (req, res) => {
    try {
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
