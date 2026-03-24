// User model
const db = require('../index');
const { generateReferralCode } = require('../../utils/helpers');

async function getOrCreate(id, firstName = '', username = '') {
  let user = await getById(id);

  if (!user) {
    const referralCode = generateReferralCode(id);
    await db.run(`INSERT INTO users (id, first_name, username, referral_code, created_at) VALUES (?, ?, ?, ?, ?)`, [id, firstName, username, referralCode, Date.now()]);
    user = await getById(id);
  } else {
    await db.run(`UPDATE users SET first_name = ?, username = ? WHERE id = ?`, [firstName, username, id]);
  }

  return user;
}

async function getById(id) {
  const result = await db.query(
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

async function getByReferralCode(code) {
  const result = await db.query(
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

async function setReferrer(userId, referrerId) {
  const user = await getById(userId);
  if (!user || user.referred_by) return false; // Already has referrer
  if (userId === referrerId) return false; // Can't refer yourself

  await db.run(`UPDATE users SET referred_by = ? WHERE id = ?`, [referrerId, userId]);
  return true;
}

async function getReferrals(referrerId) {
  const result = await db.query(
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

async function addBalance(userId, amount) {
  await db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId]);
  return true;
}

async function deductBalance(userId, amount) {
  const user = await getById(userId);
  if (!user || user.balance < amount) return false;

  await db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, userId]);
  return true;
}

async function addCredits(userId, amount) {
  await db.run(`UPDATE users SET credits = credits + ? WHERE id = ?`, [amount, userId]);
  return true;
}

async function deductCredits(userId, amount) {
  const user = await getById(userId);
  if (!user || user.credits < amount) return false;

  await db.run(`UPDATE users SET credits = credits - ? WHERE id = ?`, [amount, userId]);
  return true;
}

async function addBalanceSpent(userId, amount) {
  await db.run(`UPDATE users SET balance_spent = balance_spent + ? WHERE id = ?`, [amount, userId]);
}

async function addCreditsSpent(userId, amount) {
  await db.run(`UPDATE users SET credits_spent = credits_spent + ? WHERE id = ?`, [amount, userId]);
}

async function getAll(limit = 100) {
  const result = await db.query(
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

async function setLanguage(userId, langCode) {
  await db.run(`UPDATE users SET language = ? WHERE id = ?`, [langCode, userId]);
}

async function count() {
  const result = await db.query('SELECT COUNT(*) FROM users');
  return result[0]?.values[0][0] || 0;
}

module.exports = { getOrCreate, getById, getByReferralCode, setReferrer, getReferrals, addBalance, deductBalance, addCredits, deductCredits, addBalanceSpent, addCreditsSpent, getAll, count, setLanguage };
