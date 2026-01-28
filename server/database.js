import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path - in production use /app/data, otherwise local data folder
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'portfolio.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        displayName TEXT,
        isAdmin INTEGER DEFAULT 0,
        securityQuestion TEXT,
        securityAnswerHash TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        assetSymbol TEXT NOT NULL,
        quantity REAL NOT NULL,
        buyDateTime TEXT NOT NULL,
        buyPricePerUnit REAL NOT NULL,
        buyCurrency TEXT NOT NULL,
        feesToman REAL DEFAULT 0,
        note TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        totalValueToman REAL NOT NULL,
        totalCostBasisToman REAL NOT NULL,
        snapshotDate TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        UNIQUE(userId, snapshotDate),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historical_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        priceDate TEXT NOT NULL,
        priceToman REAL NOT NULL,
        source TEXT DEFAULT 'ai',
        createdAt TEXT DEFAULT (datetime('now')),
        UNIQUE(symbol, priceDate)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_snapshots_userId ON portfolio_snapshots(userId);
    CREATE INDEX IF NOT EXISTS idx_snapshots_date ON portfolio_snapshots(snapshotDate);
    CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol ON historical_prices(symbol);
    CREATE INDEX IF NOT EXISTS idx_historical_prices_date ON historical_prices(priceDate);
`);

// Prepared statements for better performance
const stmts = {
    // User queries
    getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    getAllUsers: db.prepare('SELECT id, username, displayName, isAdmin, createdAt FROM users'),
    createUser: db.prepare(`
        INSERT INTO users (username, passwordHash, displayName, isAdmin, securityQuestion, securityAnswerHash, createdAt)
        VALUES (@username, @passwordHash, @displayName, @isAdmin, @securityQuestion, @securityAnswerHash, @createdAt)
    `),
    updateUser: db.prepare(`
        UPDATE users SET passwordHash = @passwordHash, displayName = @displayName, 
        isAdmin = @isAdmin, securityQuestion = @securityQuestion, securityAnswerHash = @securityAnswerHash
        WHERE username = @username
    `),
    updateUserPassword: db.prepare('UPDATE users SET passwordHash = ? WHERE username = ?'),
    deleteUser: db.prepare('DELETE FROM users WHERE username = ?'),

    // Transaction queries
    getTransactionsByUserId: db.prepare('SELECT * FROM transactions WHERE userId = ?'),
    getTransactionById: db.prepare('SELECT * FROM transactions WHERE id = ?'),
    createTransaction: db.prepare(`
        INSERT INTO transactions (id, userId, assetSymbol, quantity, buyDateTime, buyPricePerUnit, buyCurrency, feesToman, note)
        VALUES (@id, @userId, @assetSymbol, @quantity, @buyDateTime, @buyPricePerUnit, @buyCurrency, @feesToman, @note)
    `),
    updateTransaction: db.prepare(`
        UPDATE transactions SET assetSymbol = @assetSymbol, quantity = @quantity, buyDateTime = @buyDateTime,
        buyPricePerUnit = @buyPricePerUnit, buyCurrency = @buyCurrency, feesToman = @feesToman, note = @note
        WHERE id = @id
    `),
    deleteTransaction: db.prepare('DELETE FROM transactions WHERE id = ?'),
    deleteTransactionsByUserId: db.prepare('DELETE FROM transactions WHERE userId = ?'),
    countTransactionsByUserId: db.prepare('SELECT COUNT(*) as count FROM transactions WHERE userId = ?'),

    // Snapshot queries
    getSnapshotsByUserId: db.prepare(`
        SELECT * FROM portfolio_snapshots 
        WHERE userId = ? 
        ORDER BY snapshotDate ASC
    `),
    getSnapshotsByDateRange: db.prepare(`
        SELECT * FROM portfolio_snapshots 
        WHERE userId = ? AND snapshotDate >= ? AND snapshotDate <= ?
        ORDER BY snapshotDate ASC
    `),
    getSnapshotByDate: db.prepare(`
        SELECT * FROM portfolio_snapshots 
        WHERE userId = ? AND snapshotDate = ?
    `),
    saveSnapshot: db.prepare(`
        INSERT INTO portfolio_snapshots (userId, totalValueToman, totalCostBasisToman, snapshotDate)
        VALUES (@userId, @totalValueToman, @totalCostBasisToman, @snapshotDate)
        ON CONFLICT(userId, snapshotDate) DO UPDATE SET
        totalValueToman = @totalValueToman,
        totalCostBasisToman = @totalCostBasisToman
    `),
    getLatestSnapshot: db.prepare(`
        SELECT * FROM portfolio_snapshots 
        WHERE userId = ? 
        ORDER BY snapshotDate DESC 
        LIMIT 1
    `),
    deleteSnapshotsByUserId: db.prepare('DELETE FROM portfolio_snapshots WHERE userId = ?'),
};

// Helper functions
export const getUser = (username) => {
    return stmts.getUserByUsername.get(username.toLowerCase());
};

export const getAllUsers = () => {
    const users = stmts.getAllUsers.all();
    return users.map(user => ({
        ...user,
        isAdmin: !!user.isAdmin,
        txCount: stmts.countTransactionsByUserId.get(user.id).count
    }));
};

export const createUser = (userData) => {
    const result = stmts.createUser.run({
        username: userData.username.toLowerCase(),
        passwordHash: userData.passwordHash,
        displayName: userData.displayName || userData.username,
        isAdmin: userData.isAdmin ? 1 : 0,
        securityQuestion: userData.securityQuestion || null,
        securityAnswerHash: userData.securityAnswerHash || null,
        createdAt: userData.createdAt || new Date().toISOString()
    });
    return result.lastInsertRowid;
};

export const updateUser = (username, updates) => {
    const user = getUser(username);
    if (!user) return false;

    stmts.updateUser.run({
        username: username.toLowerCase(),
        passwordHash: updates.passwordHash ?? user.passwordHash,
        displayName: updates.displayName ?? user.displayName,
        isAdmin: (updates.isAdmin !== undefined ? updates.isAdmin : user.isAdmin) ? 1 : 0,
        securityQuestion: updates.securityQuestion ?? user.securityQuestion,
        securityAnswerHash: updates.securityAnswerHash ?? user.securityAnswerHash
    });
    return true;
};

export const updateUserPassword = (username, newPasswordHash) => {
    const result = stmts.updateUserPassword.run(newPasswordHash, username.toLowerCase());
    return result.changes > 0;
};

export const deleteUser = (username) => {
    const user = getUser(username);
    if (!user) return false;

    // Delete user's transactions first (cascade doesn't work in all SQLite versions)
    stmts.deleteTransactionsByUserId.run(user.id);
    stmts.deleteUser.run(username.toLowerCase());
    return true;
};

export const getTransactions = (username) => {
    const user = getUser(username);
    if (!user) return [];

    const transactions = stmts.getTransactionsByUserId.all(user.id);
    return transactions.map(tx => ({
        id: tx.id,
        assetSymbol: tx.assetSymbol,
        quantity: tx.quantity,
        buyDateTime: tx.buyDateTime,
        buyPricePerUnit: tx.buyPricePerUnit,
        buyCurrency: tx.buyCurrency,
        feesToman: tx.feesToman,
        note: tx.note
    }));
};

export const saveTransaction = (username, transaction) => {
    const user = getUser(username);
    if (!user) return false;

    const existing = stmts.getTransactionById.get(transaction.id);

    if (existing) {
        stmts.updateTransaction.run({
            id: transaction.id,
            assetSymbol: transaction.assetSymbol,
            quantity: transaction.quantity,
            buyDateTime: transaction.buyDateTime,
            buyPricePerUnit: transaction.buyPricePerUnit,
            buyCurrency: transaction.buyCurrency,
            feesToman: transaction.feesToman || 0,
            note: transaction.note || null
        });
    } else {
        stmts.createTransaction.run({
            id: transaction.id || Math.random().toString(36).substr(2, 9),
            userId: user.id,
            assetSymbol: transaction.assetSymbol,
            quantity: transaction.quantity,
            buyDateTime: transaction.buyDateTime,
            buyPricePerUnit: transaction.buyPricePerUnit,
            buyCurrency: transaction.buyCurrency,
            feesToman: transaction.feesToman || 0,
            note: transaction.note || null
        });
    }
    return true;
};

export const deleteTransaction = (txId) => {
    const result = stmts.deleteTransaction.run(txId);
    return result.changes > 0;
};

// Portfolio snapshot functions
export const savePortfolioSnapshot = (username, totalValueToman, totalCostBasisToman) => {
    const user = getUser(username);
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    stmts.saveSnapshot.run({
        userId: user.id,
        totalValueToman,
        totalCostBasisToman,
        snapshotDate: today
    });
    return true;
};

export const getPortfolioSnapshots = (username, startDate = null, endDate = null) => {
    const user = getUser(username);
    if (!user) return [];

    if (startDate && endDate) {
        return stmts.getSnapshotsByDateRange.all(user.id, startDate, endDate);
    }
    return stmts.getSnapshotsByUserId.all(user.id);
};

export const getLatestSnapshot = (username) => {
    const user = getUser(username);
    if (!user) return null;
    return stmts.getLatestSnapshot.get(user.id);
};

// Backfill historical snapshots from transactions
export const backfillSnapshots = (username, currentTotalValue, currentCostBasis) => {
    const user = getUser(username);
    if (!user) return false;

    const transactions = stmts.getTransactionsByUserId.all(user.id);
    if (!transactions.length) return false;

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.buyDateTime) - new Date(b.buyDateTime));

    // Get the first transaction date
    const firstTxDate = new Date(transactions[0].buyDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate days between first tx and today
    const totalDays = Math.ceil((today - firstTxDate) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return false;

    // Generate snapshots for each day from first transaction to today
    const snapshots = [];

    for (let i = 0; i <= totalDays; i++) {
        const date = new Date(firstTxDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Calculate cumulative cost basis up to this date
        let cumulativeCostBasis = 0;
        for (const tx of transactions) {
            const txDate = new Date(tx.buyDateTime);
            if (txDate <= date) {
                cumulativeCostBasis += tx.quantity * tx.buyPricePerUnit;
            }
        }

        // Estimate value (linear interpolation from cost basis to current value)
        const progress = i / totalDays;
        const estimatedValue = cumulativeCostBasis + (currentTotalValue - currentCostBasis) * progress;

        snapshots.push({
            userId: user.id,
            totalValueToman: Math.round(estimatedValue),
            totalCostBasisToman: Math.round(cumulativeCostBasis),
            snapshotDate: dateStr
        });
    }

    // Insert all snapshots in a transaction
    const insertSnapshots = db.transaction((snapshots) => {
        for (const snapshot of snapshots) {
            stmts.saveSnapshot.run(snapshot);
        }
    });

    insertSnapshots(snapshots);
    return true;
};

// For migration: batch insert users and transactions
export const batchInsertUser = db.transaction((userData, transactions) => {
    const userId = createUser(userData);

    for (const tx of transactions) {
        stmts.createTransaction.run({
            id: tx.id || Math.random().toString(36).substr(2, 9),
            userId: userId,
            assetSymbol: tx.assetSymbol,
            quantity: tx.quantity,
            buyDateTime: tx.buyDateTime,
            buyPricePerUnit: tx.buyPricePerUnit,
            buyCurrency: tx.buyCurrency,
            feesToman: tx.feesToman || 0,
            note: tx.note || null
        });
    }

    return userId;
});

// Close database connection gracefully
export const closeDatabase = () => {
    db.close();
};

export default db;
