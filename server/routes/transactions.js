import express from 'express';
import * as db from '../database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const transactions = db.getTransactions(username);
    res.json(transactions);
});

router.post('/', async (req, res) => {
    let { username, transaction } = req.body;
    username = username.toLowerCase();
    db.saveTransaction(username, transaction);

    res.json({ success: true });
});

router.post('/delete', async (req, res) => {
    let { username, id } = req.body;
    db.deleteTransaction(id);
    res.json({ success: true });
});

export default router;
