const { db, ensureDb, mapRows } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const rows = mapRows(
        await db.query(
          'SELECT p.id, p.category_id, p.name, p.price, p.credits_price, p.credits_enabled, p.description, p.is_active, COUNT(CASE WHEN s.is_sold = 0 THEN 1 END) as stock_count, c.name as category_name FROM products p LEFT JOIN stock s ON s.product_id = p.id LEFT JOIN categories c ON c.id = p.category_id GROUP BY p.id ORDER BY p.id DESC'
        ),
        ['id', 'category_id', 'name', 'price', 'credits_price', 'credits_enabled', 'description', 'is_active', 'stock_count', 'category_name']
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const {
        name,
        price,
        description = '',
        category_id = null,
        credits_price = null,
        credits_enabled = 0,
        is_active = 1
      } = req.body || {};

      if (!name) return res.status(400).json({ error: 'Name is required' });
      await db.run(
        'INSERT INTO products (category_id, name, price, credits_price, credits_enabled, description, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [category_id, name, price, credits_price, credits_enabled ? 1 : 0, description, is_active ? 1 : 0, Date.now()]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const {
        id,
        name,
        price,
        description = '',
        category_id = null,
        credits_price = null,
        credits_enabled = 0,
        is_active = 1
      } = req.body || {};

      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run(
        'UPDATE products SET category_id = ?, name = ?, price = ?, credits_price = ?, credits_enabled = ?, description = ?, is_active = ? WHERE id = ?',
        [category_id, name, price, credits_price, credits_enabled ? 1 : 0, description, is_active ? 1 : 0, id]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run('DELETE FROM stock WHERE product_id = ?', [id]);
      await db.run('DELETE FROM products WHERE id = ?', [id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
