import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

// Create a minimal test server
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // In-memory user storage for tests
    const testUsers: any[] = [];

    // Mock rate limiter (no-op for tests)
    const noopLimiter = (req: any, res: any, next: any) => next();

    // Login endpoint
    app.post('/api/login', noopLimiter, async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'داده‌های ورودی نامعتبر است' });
        }

        const user = testUsers.find(u => u.username === username.toLowerCase());
        if (!user) {
            return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
        }

        const isMatch = user.passwordHash?.startsWith('$2')
            ? await bcrypt.compare(password, user.passwordHash)
            : user.passwordHash === password;

        if (isMatch) {
            return res.json({
                username: user.username,
                isAdmin: !!user.isAdmin,
                displayName: user.displayName || user.username,
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token'
            });
        }

        res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
    });

    // Register endpoint
    app.post('/api/register', noopLimiter, async (req, res) => {
        const { username, password, displayName, securityQuestion, securityAnswer } = req.body;

        if (!username || username.length < 3 || !password || password.length < 6) {
            return res.status(400).json({ message: 'داده‌های ورودی نامعتبر است' });
        }

        const normalizedUsername = username.toLowerCase();
        if (testUsers.find(u => u.username === normalizedUsername)) {
            return res.status(400).json({ message: 'نام کاربری تکراری است' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username: normalizedUsername,
            passwordHash: hashedPassword,
            displayName: displayName || normalizedUsername,
            isAdmin: false,
            securityQuestion,
            securityAnswerHash: securityAnswer
        };

        testUsers.push(newUser);
        res.json({ username: newUser.username, isAdmin: false, displayName: newUser.displayName });
    });

    // Transactions endpoint
    app.get('/api/transactions', (req, res) => {
        const username = (req.query.username as string)?.toLowerCase();
        const user = testUsers.find(u => u.username === username);
        res.json(user?.transactions || []);
    });

    // Helper to add test users
    const addTestUser = (user: any) => {
        testUsers.push(user);
    };

    const clearTestUsers = () => {
        testUsers.length = 0;
    };

    return { app, addTestUser, clearTestUsers };
};

describe('Server API Tests', () => {
    let app: express.Application;
    let addTestUser: (user: any) => void;
    let clearTestUsers: () => void;

    beforeEach(() => {
        const testApp = createTestApp();
        app = testApp.app;
        addTestUser = testApp.addTestUser;
        clearTestUsers = testApp.clearTestUsers;
    });

    afterEach(() => {
        clearTestUsers();
    });

    describe('POST /api/login', () => {
        it('should return user data and tokens with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            addTestUser({
                username: 'testuser',
                passwordHash: hashedPassword,
                displayName: 'Test User',
                isAdmin: false
            });

            const response = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('testuser');
            expect(response.body.displayName).toBe('Test User');
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
        });

        it('should return 401 with invalid password', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            addTestUser({
                username: 'testuser',
                passwordHash: hashedPassword
            });

            const response = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBeDefined();
        });

        it('should return 401 with non-existent user', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ username: 'nonexistent', password: 'password123' });

            expect(response.status).toBe(401);
        });

        it('should handle case-insensitive usernames', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            addTestUser({
                username: 'testuser',
                passwordHash: hashedPassword
            });

            const response = await request(app)
                .post('/api/login')
                .send({ username: 'TESTUSER', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('testuser');
        });
    });

    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/register')
                .send({
                    username: 'newuser',
                    password: 'password123',
                    displayName: 'New User',
                    securityQuestion: 'What is your pet name?',
                    securityAnswer: 'fluffy'
                });

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('newuser');
            expect(response.body.displayName).toBe('New User');
            expect(response.body.isAdmin).toBe(false);
        });

        it('should return 400 for duplicate username', async () => {
            addTestUser({
                username: 'existinguser',
                passwordHash: 'password123'
            });

            const response = await request(app)
                .post('/api/register')
                .send({
                    username: 'existinguser',
                    password: 'password123',
                    securityQuestion: 'Question',
                    securityAnswer: 'Answer'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('تکراری');
        });

        it('should return 400 for short username', async () => {
            const response = await request(app)
                .post('/api/register')
                .send({
                    username: 'ab',
                    password: 'password123',
                    securityQuestion: 'Question',
                    securityAnswer: 'Answer'
                });

            expect(response.status).toBe(400);
        });

        it('should return 400 for short password', async () => {
            const response = await request(app)
                .post('/api/register')
                .send({
                    username: 'validuser',
                    password: '12345',
                    securityQuestion: 'Question',
                    securityAnswer: 'Answer'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/transactions', () => {
        it('should return empty array for user without transactions', async () => {
            addTestUser({
                username: 'testuser',
                transactions: []
            });

            const response = await request(app)
                .get('/api/transactions')
                .query({ username: 'testuser' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return transactions for user with transactions', async () => {
            const transactions = [
                { id: '1', assetSymbol: 'BTC', quantity: 0.5, buyPricePerUnit: 50000 },
                { id: '2', assetSymbol: 'ETH', quantity: 2, buyPricePerUnit: 3000 }
            ];
            addTestUser({
                username: 'testuser',
                transactions
            });

            const response = await request(app)
                .get('/api/transactions')
                .query({ username: 'testuser' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].assetSymbol).toBe('BTC');
        });

        it('should return empty array for non-existent user', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .query({ username: 'nonexistent' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
});
