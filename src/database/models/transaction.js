// Transaction model
const db = require('../index');

const TYPES = { DEPOSIT: 'deposit', PURCHASE: 'purchase', REFERRAL_BONUS: 'referral', ADMIN_ADD: 'admin_add', REFUND: 'refund', EVENT_BONUS: 'event' };

function create(data) {
  const {
    userId,
    type,
    amount,
    currency = 'USDT',
    paymentMethod = null,
    referenceId = null,
    status = 'completed',
    note = null
  } = data;

  db.run(`
    INSERT INTO transactions (user_id, type, amount, currency, payment_method, reference_id, status, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, type, amount, currency, paymentMethod, referenceId, status, note, Date.now()]);

  return db.lastInsertRowId();
}

function getById(id) {
  const result = db.query(`
    SELECT id, user_id, type, amount, currency, payment_method, reference_id, status, note, created_at
    FROM transactions WHERE id = ?
  `, [id]);

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    user_id: row[1],
    type: row[2],
    amount: row[3],
    currency: row[4],
    payment_method: row[5],
    reference_id: row[6],
    status: row[7],
    note: row[8],
    created_at: row[9]
  };
}

function getByUser(userId, limit = 20) {
  const result = db.query(`
    SELECT id, type, amount, currency, payment_method, status, note, created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [userId, limit]);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    type: row[1],
    amount: row[2],
    currency: row[3],
    payment_method: row[4],
    status: row[5],
    note: row[6],
    created_at: row[7]
  }));
}

function getTotalDeposits(userId) {
  const result = db.query(`
    SELECT SUM(amount) FROM transactions 
    WHERE user_id = ? AND type = 'deposit' AND status = 'completed'
  `, [userId]);

  return result[0]?.values[0][0] || 0;
}

function createPendingDeposit(data) {
  const {
    userId,
    amount,
    currency = 'USDT',
    paymentMethod,
    paymentCode,
    chatId,
    expiresAt = null
  } = data;

  db.run(`
    INSERT INTO pending_deposits (user_id, amount, currency, payment_method, payment_code, chat_id, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, amount, currency, paymentMethod, paymentCode, chatId, expiresAt, Date.now()]);

  return db.lastInsertRowId();
}

function getPendingByCode(paymentCode) {
  const result = db.query(`
    SELECT id, user_id, amount, currency, payment_method, payment_code, chat_id, created_at, expires_at
    FROM pending_deposits
    WHERE payment_code = ? AND status = 'pending'
  `, [paymentCode]);

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    user_id: row[1],
    amount: row[2],
    currency: row[3],
    payment_method: row[4],
    payment_code: row[5],
    chat_id: row[6],
    created_at: row[7],
    expires_at: row[8]
  };
}

function getAllPendingDeposits() {
  const result = db.query(`
    SELECT id, user_id, amount, currency, payment_method, payment_code, chat_id, created_at, expires_at
    FROM pending_deposits
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    user_id: row[1],
    amount: row[2],
    currency: row[3],
    payment_method: row[4],
    payment_code: row[5],
    chat_id: row[6],
    created_at: row[7],
    expires_at: row[8]
  }));
}

function updatePendingDepositStatus(id, status) {
  const check = db.query(`SELECT id FROM pending_deposits WHERE id = ? AND status = 'pending'`, [id]);
  const hasPending = check.length > 0 && check[0].values.length > 0;
  
  if (hasPending) {
    db.run(`UPDATE pending_deposits SET status = ? WHERE id = ?`, [status, id]);
    return 1;
  }
  return 0;
}

function getPendingDepositById(id) {
  const result = db.query(`
    SELECT id, user_id, amount, currency, payment_method, payment_code, chat_id, status, created_at, expires_at
    FROM pending_deposits WHERE id = ?
  `, [id]);

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    user_id: row[1],
    amount: row[2],
    currency: row[3],
    payment_method: row[4],
    payment_code: row[5],
    chat_id: row[6],
    status: row[7],
    created_at: row[8],
    expires_at: row[9]
  };
}

module.exports = { TYPES, create, getById, getByUser, getTotalDeposits, createPendingDeposit, getPendingByCode, getAllPendingDeposits, updatePendingDepositStatus, getPendingDepositById };
