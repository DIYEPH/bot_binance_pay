const { db, ensureDb, mapRows } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const page = Math.max(1, Number(req.query?.page || 1));
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));
      const offset = (page - 1) * limit;

      const totalResult = await db.query('SELECT COUNT(*) FROM pending_deposits');
      const total = totalResult?.[0]?.values?.[0]?.[0] || 0;

      const rows = mapRows(
        await db.query(
          'SELECT d.id, d.user_id, d.amount, d.currency, d.payment_method, d.payment_code, d.status, d.created_at, d.expires_at, u.first_name, u.username FROM pending_deposits d LEFT JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC LIMIT ? OFFSET ?'
          , [limit, offset]
        ),
        ['id', 'user_id', 'amount', 'currency', 'payment_method', 'payment_code', 'status', 'created_at', 'expires_at', 'first_name', 'username']
      );
      return res.status(200).json({ items: rows, total, page, limit });
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run('UPDATE pending_deposits SET status = ? WHERE id = ?', [status, id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
