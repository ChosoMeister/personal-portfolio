/**
 * Migration Script: JSON to SQLite
 * 
 * This script migrates existing user data from users.json to SQLite database.
 * Run with: node migrate-to-sqlite.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchInsertUser, getUser, closeDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function migrate() {
    console.log('🚀 Starting migration from JSON to SQLite...');
    console.log(`📁 Reading from: ${USERS_FILE}`);

    // Check if users.json exists
    if (!fs.existsSync(USERS_FILE)) {
        console.log('⚠️  No users.json found. Nothing to migrate.');
        closeDatabase();
        return;
    }

    // Read existing users
    let users = [];
    try {
        const content = fs.readFileSync(USERS_FILE, 'utf8');
        users = JSON.parse(content);
        console.log(`📊 Found ${users.length} users to migrate.`);
    } catch (e) {
        console.error('❌ Error reading users.json:', e.message);
        closeDatabase();
        process.exit(1);
    }

    let migrated = 0;
    let skipped = 0;
    let transactionCount = 0;

    for (const user of users) {
        // Check if user already exists in SQLite
        const existing = getUser(user.username);
        if (existing) {
            console.log(`⏭️  Skipping existing user: ${user.username}`);
            skipped++;
            continue;
        }

        try {
            // Prepare user data
            const userData = {
                username: user.username.toLowerCase(),
                passwordHash: user.passwordHash || user.password,
                displayName: user.displayName || user.username,
                isAdmin: !!user.isAdmin,
                securityQuestion: user.securityQuestion || null,
                securityAnswerHash: user.securityAnswerHash || null,
                createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
            };

            // Get transactions
            const transactions = user.transactions || [];
            transactionCount += transactions.length;

            // Insert user with transactions in a single transaction
            batchInsertUser(userData, transactions);

            console.log(`✅ Migrated user: ${user.username} (${transactions.length} transactions)`);
            migrated++;
        } catch (e) {
            console.error(`❌ Error migrating user ${user.username}:`, e.message);
        }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users (already exist)`);
    console.log(`   📊 Total transactions: ${transactionCount}`);

    // Create backup of users.json
    const backupPath = USERS_FILE + '.backup';
    try {
        fs.copyFileSync(USERS_FILE, backupPath);
        console.log(`\n💾 Backup created: ${backupPath}`);
    } catch (e) {
        console.log(`\n⚠️  Could not create backup: ${e.message}`);
    }

    closeDatabase();
    console.log('\n🎉 Migration completed successfully!');
}

migrate().catch(e => {
    console.error('❌ Migration failed:', e);
    closeDatabase();
    process.exit(1);
});
