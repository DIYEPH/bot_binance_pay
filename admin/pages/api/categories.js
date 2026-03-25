const { db, ensureDb, mapRows } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const rows = mapRows(
        await db.query(
          'SELECT c.id, c.name, c.description, c.is_active, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.id DESC'
        ),
        ['id', 'name', 'description', 'is_active', 'product_count']
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, description = '', is_active = 1 } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name is required' });
      await db.run(
        'INSERT INTO categories (name, description, is_active, created_at) VALUES (?, ?, ?, ?)',
        [name, description, is_active ? 1 : 0, Date.now()]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const { id, name, description = '', is_active = 1 } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run(
        'UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?',
        [name, description, is_active ? 1 : 0, id]
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required' });
      await db.run('DELETE FROM categories WHERE id = ?', [id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
