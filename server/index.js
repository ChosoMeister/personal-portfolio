import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import priceRoutes from './routes/prices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(bodyParser.json());

// Global Rate Limit
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'تعداد درخواست‌ها بیش از حد مجاز است.' }
});
app.use('/api', apiLimiter);

// Admin initializer (inline)
import * as db from './database.js';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

const initAdmin = () => {
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
    } else if (user.passwordHash !== ADMIN_PASS || !user.isAdmin) {
        db.updateUser(ADMIN_USER, { passwordHash: ADMIN_PASS, isAdmin: true, displayName: 'ادمین سیستم' });
    }
};
initAdmin();


// Static Files (Frontend)
app.use(express.static(path.join(ROOT_DIR, 'dist')));

// API Routes
app.use('/api', authRoutes); // login, register, refresh, security-question, reset-password
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/prices', priceRoutes);

// Client Logging
app.post('/api/logs', (req, res) => {
    const { level = 'info', message = '', context = {} } = req.body || {};
    const logLine = `[ClientLog][${level.toUpperCase()}] ${message}`;
    if (level === 'error' || level === 'warn') console.error(logLine, context);
    else console.log(logLine, context);
    res.json({ success: true });
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
