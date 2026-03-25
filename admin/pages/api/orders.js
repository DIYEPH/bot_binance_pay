const { db, ensureDb, mapRows } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const page = Math.max(1, Number(req.query?.page || 1));
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));
      const offset = (page - 1) * limit;

      const totalResult = await db.query('SELECT COUNT(*) FROM orders');
      const total = totalResult?.[0]?.values?.[0]?.[0] || 0;

      const rows = mapRows(
        await db.query(
          'SELECT o.id, o.user_id, o.product_id, o.quantity, o.total_price, o.payment_method, o.status, o.created_at, u.first_name, u.username, p.name FROM orders o LEFT JOIN users u ON u.id = o.user_id LEFT JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
          , [limit, offset]
        ),
        ['id', 'user_id', 'product_id', 'quantity', 'total_price', 'payment_method', 'status', 'created_at', 'first_name', 'username', 'product_name']
      );
      return res.status(200).json({ items: rows, total, page, limit });
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
