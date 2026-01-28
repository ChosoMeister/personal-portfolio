import express from 'express';
import bcrypt from 'bcrypt';
import * as db from '../database.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { passwordSchema } from '../validation.js';

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';

router.get('/', (req, res) => {
    const users = db.getAllUsers();
    res.json(users.map(u => ({
        username: u.username,
        createdAt: u.createdAt,
        txCount: u.txCount,
        isAdmin: !!u.isAdmin,
        displayName: u.displayName || u.username
    })));
});

router.post('/delete', verifyToken, async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase();
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    db.deleteUser(username);
    res.json({ success: true });
});

router.post('/update-pass', verifyToken, async (req, res) => {
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

export default router;
