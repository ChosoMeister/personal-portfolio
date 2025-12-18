
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');

// اطمینان از وجود دایرکتوری داده‌ها
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(PRICES_FILE)) fs.writeFileSync(PRICES_FILE, JSON.stringify(null));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'orchidpharmed';

const getUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
};

const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const refreshAdmin = () => {
    let users = getUsers();
    let adminIdx = users.findIndex(u => u.username === ADMIN_USER);
    if (adminIdx === -1) {
        users.push({ 
            username: ADMIN_USER, 
            passwordHash: ADMIN_PASS, 
            isAdmin: true, 
            createdAt: new Date(), 
            transactions: [] 
        });
    } else {
        users[adminIdx].passwordHash = ADMIN_PASS;
        users[adminIdx].isAdmin = true;
    }
    saveUsers(users);
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
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.passwordHash === password);
    if (user) return res.json({ username: user.username, isAdmin: !!user.isAdmin });
    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    let users = getUsers();
    if (users.find(u => u.username === username)) return res.status(400).json({ message: 'نام کاربری تکراری است' });
    const newUser = { username, passwordHash: password, createdAt: new Date(), transactions: [], isAdmin: false };
    users.push(newUser);
    saveUsers(users);
    res.json({ username: newUser.username, isAdmin: false });
});

app.get('/api/users', (req, res) => {
    res.json(getUsers().map(u => ({ username: u.username, createdAt: u.createdAt, txCount: u.transactions.length, isAdmin: !!u.isAdmin })));
});

app.post('/api/users/delete', (req, res) => {
    const { username } = req.body;
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    saveUsers(getUsers().filter(u => u.username !== username));
    res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
    const user = getUsers().find(u => u.username === req.query.username);
    res.json(user ? user.transactions : []);
});

app.post('/api/transactions', (req, res) => {
    const { username, transaction } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        const idx = user.transactions.findIndex(t => t.id === transaction.id);
        if (idx > -1) user.transactions[idx] = transaction;
        else user.transactions.push(transaction);
        saveUsers(users);
    }
    res.json({ success: true });
});

app.get('/api/prices', (req, res) => {
    try {
        res.json(JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')));
    } catch (e) { res.json(null); }
});

app.post('/api/prices', (req, res) => {
    fs.writeFileSync(PRICES_FILE, JSON.stringify(req.body));
    res.json({ success: true });
});

// SPA Routing: ارسال تمام درخواست‌های ناشناخته به ایندکس
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
