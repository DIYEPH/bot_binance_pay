const { db, ensureDb, mapRows } = require('../../lib/db');
const Wallet = require('../../../src/services/wallet');
const Transaction = require('../../../src/database/models/transaction');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const userId = req.query?.userId ? Number(req.query.userId) : null;
      const page = Math.max(1, Number(req.query?.page || 1));
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));
      const offset = (page - 1) * limit;

      if (userId) {
        const users = mapRows(
          await db.query(
            'SELECT id, first_name, username, language, balance, credits, balance_spent, credits_spent, referral_code, referred_by, created_at FROM users WHERE id = ? LIMIT 1',
            [userId]
          ),
          ['id', 'first_name', 'username', 'language', 'balance', 'credits', 'balance_spent', 'credits_spent', 'referral_code', 'referred_by', 'created_at']
        );

        const orders = mapRows(
          await db.query(
            'SELECT o.id, o.status, o.quantity, o.total_price, o.payment_method, o.created_at, p.name FROM orders o LEFT JOIN products p ON p.id = o.product_id WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 200',
            [userId]
          ),
          ['id', 'status', 'quantity', 'total_price', 'payment_method', 'created_at', 'product_name']
        );
        const transactions = await Transaction.getByUser(userId, 200);

        return res.status(200).json({ user: users[0] || null, orders, transactions });
      }

      const totalResult = await db.query('SELECT COUNT(*) FROM users');
      const total = totalResult?.[0]?.values?.[0]?.[0] || 0;

      const rows = mapRows(
        await db.query(
          "SELECT u.id, u.first_name, u.username, u.language, u.balance, u.credits, u.balance_spent, u.credits_spent, u.created_at, COUNT(o.id) as order_count, COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END), 0) as total_spent FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?",
          [limit, offset]
        ),
        ['id', 'first_name', 'username', 'language', 'balance', 'credits', 'balance_spent', 'credits_spent', 'created_at', 'order_count', 'total_spent']
      );

      return res.status(200).json({ items: rows, total, page, limit });
    }

    if (req.method === 'PUT') {
      const { userId, action, amount, note, adminId } = req.body || {};
      if (!userId || !action) return res.status(400).json({ error: 'userId and action are required' });
      const value = Number(amount);
      if (!value || value <= 0) return res.status(400).json({ error: 'amount must be > 0' });

      if (action === 'add_balance') {
        await Wallet.adminAddBalance(Number(userId), value, adminId || 'web-admin', note || '');
        return res.status(200).json({ ok: true });
      }

      if (action === 'add_credits') {
        await Wallet.adminAddCredits(Number(userId), value, adminId || 'web-admin', note || '');
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unsupported action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
