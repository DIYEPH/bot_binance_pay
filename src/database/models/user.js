// User model
const db = require('../index');
const { generateReferralCode } = require('../../utils/helpers');

function getOrCreate(id, firstName = '', username = '') {
  let user = getById(id);

  if (!user) {
    const referralCode = generateReferralCode(id);
    db.run(`INSERT INTO users (id, first_name, username, referral_code, created_at) VALUES (?, ?, ?, ?, ?)`, [id, firstName, username, referralCode, Date.now()]);
    user = getById(id);
  } else {
    db.run(`UPDATE users SET first_name = ?, username = ? WHERE id = ?`, [firstName, username, id]);
  }

  return user;
}

function getById(id) {
  const result = db.query(
    `SELECT id, first_name, username, language, balance, credits, referral_code, referred_by, balance_spent, credits_spent, created_at 
     FROM users WHERE id = ?`,
    [id]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    first_name: row[1],
    username: row[2],
    language: row[3] || 'en',
    balance: row[4] || 0,
    credits: row[5] || 0,
    referral_code: row[6],
    referred_by: row[7],
    balance_spent: row[8] || 0,
    credits_spent: row[9] || 0,
    created_at: row[10]
  };
}

function getByReferralCode(code) {
  const result = db.query(
    `SELECT id, first_name, username, balance, credits, referral_code, referred_by, balance_spent, credits_spent 
     FROM users WHERE referral_code = ?`,
    [code.toUpperCase()]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    first_name: row[1],
    username: row[2],
    balance: row[3] || 0,
    credits: row[4] || 0,
    referral_code: row[5],
    referred_by: row[6],
    balance_spent: row[7] || 0,
    credits_spent: row[8] || 0
  };
}

function setReferrer(userId, referrerId) {
  const user = getById(userId);
  if (!user || user.referred_by) return false; // Already has referrer
  if (userId === referrerId) return false; // Can't refer yourself

  db.run(`UPDATE users SET referred_by = ? WHERE id = ?`, [referrerId, userId]);
  return true;
}

function getReferrals(referrerId) {
  const result = db.query(
    `SELECT id, first_name, username, balance_spent, credits_spent, created_at 
     FROM users WHERE referred_by = ? ORDER BY created_at DESC`,
    [referrerId]
  );

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    first_name: row[1],
    username: row[2],
    balance_spent: row[3] || 0,
    credits_spent: row[4] || 0,
    created_at: row[5]
  }));
}

function addBalance(userId, amount) {
  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId]);
  return true;
}

function deductBalance(userId, amount) {
  const user = getById(userId);
  if (!user || user.balance < amount) return false;

  db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, userId]);
  return true;
}

function addCredits(userId, amount) {
  db.run(`UPDATE users SET credits = credits + ? WHERE id = ?`, [amount, userId]);
  return true;
}

function deductCredits(userId, amount) {
  const user = getById(userId);
  if (!user || user.credits < amount) return false;

  db.run(`UPDATE users SET credits = credits - ? WHERE id = ?`, [amount, userId]);
  return true;
}

function addBalanceSpent(userId, amount) {
  db.run(`UPDATE users SET balance_spent = balance_spent + ? WHERE id = ?`, [amount, userId]);
}

function addCreditsSpent(userId, amount) {
  db.run(`UPDATE users SET credits_spent = credits_spent + ? WHERE id = ?`, [amount, userId]);
}

function getAll(limit = 100) {
  const result = db.query(
    `SELECT id, first_name, username, language, balance, credits, balance_spent, credits_spent, created_at 
     FROM users ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    first_name: row[1],
    username: row[2],
    language: row[3] || 'en',
    balance: row[4] || 0,
    credits: row[5] || 0,
    balance_spent: row[6] || 0,
    credits_spent: row[7] || 0,
    created_at: row[8]
  }));
}

function setLanguage(userId, langCode) {
  db.run(`UPDATE users SET language = ? WHERE id = ?`, [langCode, userId]);
}

function count() {
  const result = db.query('SELECT COUNT(*) FROM users');
  return result[0]?.values[0][0] || 0;
}

function setBalance(userId, amount) {
  db.run(`UPDATE users SET balance = ? WHERE id = ?`, [amount, userId]);
}

function setCredits(userId, amount) {
  db.run(`UPDATE users SET credits = ? WHERE id = ?`, [amount, userId]);
}

module.exports = { getOrCreate, getById, getByReferralCode, setReferrer, getReferrals, addBalance, deductBalance, addCredits, deductCredits, addBalanceSpent, addCreditsSpent, getAll, count, setBalance, setCredits, setLanguage };
