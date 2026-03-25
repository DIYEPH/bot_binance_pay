const { db, ensureDb, getScalar, mapRows } = require('../../lib/db');

function buildDailyRevenue(orders, days = 7) {
  const now = new Date();
  const labels = [];
  const totals = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    totals.push(0);
  }

  orders.forEach(o => {
    if (o.status !== 'completed') return;
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    const idx = labels.indexOf(key);
    if (idx >= 0) totals[idx] += Number(o.total_price || 0);
  });

  return { labels, totals };
}

function buildWeeklyRevenue(orders, weeks = 4) {
  const now = new Date();
  const labels = [];
  const totals = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7);
    const key = start.toISOString().slice(0, 10);
    labels.push(key);
    totals.push(0);
  }

  orders.forEach(o => {
    if (o.status !== 'completed') return;
    const created = new Date(o.created_at);
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const bucket = weeks - 1 - Math.floor(diffDays / 7);
    if (bucket >= 0 && bucket < weeks) {
      totals[bucket] += Number(o.total_price || 0);
    }
  });

  return { labels, totals };
}

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    const users = getScalar(await db.query('SELECT COUNT(*) FROM users'));
    const categories = getScalar(await db.query('SELECT COUNT(*) FROM categories'));
    const products = getScalar(await db.query('SELECT COUNT(*) FROM products'));
    const orders = getScalar(await db.query('SELECT COUNT(*) FROM orders'));
    const revenue = getScalar(await db.query("SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed'"));

    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentOrders = mapRows(
      await db.query(
        'SELECT total_price, status, created_at, product_id FROM orders WHERE created_at >= ? ORDER BY created_at DESC',
        [since]
      ),
      ['total_price', 'status', 'created_at', 'product_id']
    );

    const daily = buildDailyRevenue(recentOrders, 7);
    const weekly = buildWeeklyRevenue(recentOrders, 4);

    const topProducts = mapRows(
      await db.query(
        "SELECT p.id, p.name, SUM(o.quantity) as qty, SUM(o.total_price) as revenue FROM orders o JOIN products p ON p.id = o.product_id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5"
      ),
      ['id', 'name', 'qty', 'revenue']
    );

    const latestOrders = mapRows(
      await db.query(
        'SELECT o.id, o.status, o.total_price, o.payment_method, o.created_at, u.first_name, u.username, p.name FROM orders o LEFT JOIN users u ON u.id = o.user_id LEFT JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT 10'
      ),
      ['id', 'status', 'total_price', 'payment_method', 'created_at', 'first_name', 'username', 'product_name']
    );

    res.status(200).json({
      users,
      categories,
      products,
      orders,
      revenue,
      daily,
      weekly,
      topProducts,
      latestOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
