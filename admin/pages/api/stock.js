const { ensureDb } = require('../../lib/db');
const Product = require('../../../src/database/models/product');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const productId = req.query?.productId ? Number(req.query.productId) : null;
      if (!productId) return res.status(400).json({ error: 'productId is required' });
      const rows = await Product.getStockByProduct(productId);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { productId, accounts } = req.body || {};
      if (!productId) return res.status(400).json({ error: 'productId is required' });
      if (!accounts || !Array.isArray(accounts)) return res.status(400).json({ error: 'accounts must be array' });
      const added = await Product.addStock(Number(productId), accounts);
      return res.status(200).json({ ok: true, added });
    }

    if (req.method === 'DELETE') {
      const { stockId, productId, action } = req.body || {};
      if (action === 'clear' && productId) {
        await Product.clearStock(Number(productId));
        return res.status(200).json({ ok: true });
      }
      if (!stockId) return res.status(400).json({ error: 'stockId is required' });
      await Product.deleteStock(Number(stockId));
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
