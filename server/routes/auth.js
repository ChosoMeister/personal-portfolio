import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import * as db from '../database.js';
import { loginSchema, registerSchema, resetPasswordSchema } from '../validation.js';

const router = express.Router();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per window (increased for dev)
    message: { message: 'تلاش‌های زیادی انجام شد. لطفاً ۱۵ دقیقه صبر کنید.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Helper Functions
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

// Routes
router.post('/login', authLimiter, async (req, res) => {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error?.errors?.[0]?.message || 'داده‌های ورودی نامعتبر است' });
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

router.post('/refresh', (req, res) => {
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

router.post('/register', authLimiter, async (req, res) => {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error?.errors?.[0]?.message || 'داده‌های ورودی نامعتبر است' });
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

    // Generate JWT tokens for auto-login after registration
    const newUser = db.getUser(username);
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.json({
        username,
        isAdmin: false,
        displayName: displayName || username,
        accessToken,
        refreshToken
    });
});

router.get('/security-question', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = db.getUser(username);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.json({ securityQuestion: user.securityQuestion || 'سوال امنیتی ثبت نشده است' });
});

router.post('/reset-password', authLimiter, async (req, res) => {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error?.errors?.[0]?.message || 'داده‌های ورودی نامعتبر است' });
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

export default router;
