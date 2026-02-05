// Order model
const db = require('../index');

function create(orderData) {
  const { userId, productId, quantity, unitPrice, totalPrice, paymentMethod, paymentCode, chatId} = orderData;

  const createdAt = Date.now();
  const finalPaymentCode = paymentCode || (paymentMethod === 'credits' ? 'credits' : 'balance');
  
  db.run(`
    INSERT INTO orders (user_id, product_id, quantity, unit_price, total_price, payment_method, payment_code, chat_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, productId, quantity, unitPrice, totalPrice, paymentMethod, finalPaymentCode, chatId, createdAt]);

  const id = db.lastInsertRowId();
  return { id, createdAt };
}

function getById(id) {
  const result = db.query(`
    SELECT o.id, o.user_id, o.product_id, o.quantity, o.unit_price, o.total_price,
           o.payment_method, o.payment_code, o.status, o.chat_id, o.created_at, o.completed_at,
           p.name as product_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `, [id]);
  
  if (!result.length || !result[0].values.length) return null;
  
  const row = result[0].values[0];
  return {
    id: row[0],
    user_id: row[1],
    product_id: row[2],
    quantity: row[3],
    unit_price: row[4],
    total_price: row[5],
    payment_method: row[6],
    payment_code: row[7],
    status: row[8],
    chat_id: row[9],
    created_at: row[10],
    completed_at: row[11],
    product_name: row[12]
  };
}

function updateStatus(id, status) {
  const completedAt = status === 'completed' ? Date.now() : null;
  db.run(`UPDATE orders SET status = ?, completed_at = ? WHERE id = ?`, [status, completedAt, id]);
}

function getByUser(userId, limit = 20) {
  const result = db.query(`
    SELECT o.id, o.status, o.quantity, o.total_price, o.payment_method, o.created_at,
           p.name as product_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
    LIMIT ?
  `, [userId, limit]);
  
  if (!result.length) return [];
  
  return result[0].values.map(row => ({
    id: row[0],
    status: row[1],
    quantity: row[2],
    total_price: row[3],
    payment_method: row[4],
    created_at: row[5],
    product_name: row[6]
  }));
}

function getRecent(limit = 20) {
  const result = db.query(`
    SELECT o.id, o.user_id, o.status, o.quantity, o.total_price, o.payment_method, o.created_at,
           p.name as product_name, u.first_name as user_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.id DESC
    LIMIT ?
  `, [limit]);
  
  if (!result.length) return [];
  
  return result[0].values.map(row => ({
    id: row[0],
    user_id: row[1],
    status: row[2],
    quantity: row[3],
    total_price: row[4],
    payment_method: row[5],
    created_at: row[6],
    product_name: row[7],
    user_name: row[8] || 'Unknown'
  }));
}

function getRevenue() {
  const result = db.query(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_price) as total_revenue,
      SUM(CASE WHEN payment_method = 'balance' THEN total_price ELSE 0 END) as balance_revenue,
      SUM(CASE WHEN payment_method = 'credits' THEN total_price ELSE 0 END) as credits_used
    FROM orders
    WHERE status = 'completed'
  `);
  
  if (!result.length || !result[0].values.length) {
    return { total_orders: 0, total_revenue: 0, balance_revenue: 0, credits_used: 0 };
  }
  
  const row = result[0].values[0];
  return {
    total_orders: row[0] || 0,
    total_revenue: row[1] || 0,
    balance_revenue: row[2] || 0,
    credits_used: row[3] || 0
  };
}

function getCompletedCount(userId) {
  const result = db.query(
    `SELECT COUNT(*) FROM orders WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  return result[0]?.values[0][0] || 0;
}

module.exports = { create, getById, updateStatus, getByUser, getRecent, getRevenue, getCompletedCount };
