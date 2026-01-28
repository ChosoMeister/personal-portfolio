import jwt from 'jsonwebtoken';

// JWT Secrets from environment variables (should be same as in auth routes)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret-change-in-production';

export const verifyToken = (req, res, next) => {
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

export const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'دسترسی فقط برای ادمین مجاز است' });
    }
    next();
};
