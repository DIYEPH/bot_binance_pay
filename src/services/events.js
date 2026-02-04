// Events service
const db = require('../database/index');
const Wallet = require('./wallet');

const EVENT_TYPES = { WELCOME: 'welcome', DEPOSIT: 'deposit', PURCHASE: 'purchase', PROMO: 'promo', REFERRAL: 'referral', MANUAL: 'manual' };
const REWARD_TYPES = { FIXED: 'fixed', PERCENT: 'percent' };

function createEvent(data) {
  const {
    code = null,
    name,
    type,
    reward_amount,
    reward_type = REWARD_TYPES.FIXED,
    min_amount = 0,
    max_claims = null,
    max_per_user = 1,
    start_date = null,
    end_date = null,
    is_active = true
  } = data;

  db.run(`
    INSERT INTO events (code, name, type, reward_amount, reward_type, min_amount, max_claims, max_per_user, start_date, end_date, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    code ? code.toUpperCase() : null,
    name,
    type,
    reward_amount,
    reward_type,
    min_amount,
    max_claims,
    max_per_user,
    start_date,
    end_date,
    is_active ? 1 : 0,
    Date.now()
  ]);

  return db.lastInsertRowId();
}

function getEventById(id) {
  const result = db.query(`
    SELECT id, code, name, type, reward_amount, reward_type, min_amount, 
           max_claims, max_per_user, start_date, end_date, is_active, created_at
    FROM events WHERE id = ?
  `, [id]);

  if (!result.length || !result[0].values.length) return null;

  return mapEventRow(result[0].values[0]);
}

function getEventByCode(code) {
  const result = db.query(`
    SELECT id, code, name, type, reward_amount, reward_type, min_amount, 
           max_claims, max_per_user, start_date, end_date, is_active, created_at
    FROM events WHERE code = ? AND is_active = 1
  `, [code.toUpperCase()]);

  if (!result.length || !result[0].values.length) return null;

  return mapEventRow(result[0].values[0]);
}

function getEventsByType(type, activeOnly = true) {
  const whereClause = activeOnly ? 'AND is_active = 1' : '';
  const result = db.query(`
    SELECT id, code, name, type, reward_amount, reward_type, min_amount, 
           max_claims, max_per_user, start_date, end_date, is_active, created_at
    FROM events WHERE type = ? ${whereClause}
    ORDER BY created_at DESC
  `, [type]);

  if (!result.length) return [];

  return result[0].values.map(mapEventRow);
}

function getAllEvents(activeOnly = false) {
  const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
  const result = db.query(`
    SELECT id, code, name, type, reward_amount, reward_type, min_amount, 
           max_claims, max_per_user, start_date, end_date, is_active, created_at
    FROM events ${whereClause}
    ORDER BY created_at DESC
  `);

  if (!result.length) return [];

  return result[0].values.map(mapEventRow);
}

function updateEvent(id, data) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.reward_amount !== undefined) { fields.push('reward_amount = ?'); values.push(data.reward_amount); }
  if (data.reward_type !== undefined) { fields.push('reward_type = ?'); values.push(data.reward_type); }
  if (data.min_amount !== undefined) { fields.push('min_amount = ?'); values.push(data.min_amount); }
  if (data.max_claims !== undefined) { fields.push('max_claims = ?'); values.push(data.max_claims); }
  if (data.max_per_user !== undefined) { fields.push('max_per_user = ?'); values.push(data.max_per_user); }
  if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

  if (fields.length === 0) return;

  values.push(id);
  db.run(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
}

function deleteEvent(id) {
  db.run(`DELETE FROM event_claims WHERE event_id = ?`, [id]);
  db.run(`DELETE FROM events WHERE id = ?`, [id]);
}

function canClaimEvent(userId, event, transactionAmount = 0) {
  const now = Date.now();
  if (!event.is_active) return { canClaim: false, reason: 'Event is not active' };
  if (event.start_date && now < event.start_date) return { canClaim: false, reason: 'Event has not started yet' };
  if (event.end_date && now > event.end_date) return { canClaim: false, reason: 'Event has ended' };
  if (event.min_amount > 0 && transactionAmount < event.min_amount) return { canClaim: false, reason: `Minimum amount is ${event.min_amount}` };
  if (event.max_claims && getTotalClaims(event.id) >= event.max_claims) return { canClaim: false, reason: 'Event has reached maximum claims' };
  if (event.max_per_user && getUserClaims(userId, event.id) >= event.max_per_user) return { canClaim: false, reason: 'You have already claimed this event' };
  return { canClaim: true };
}

function claimEvent(userId, eventId, transactionAmount = 0, referenceId = null) {
  const event = getEventById(eventId);
  if (!event) {
    return { success: false, message: 'Event not found' };
  }

  const check = canClaimEvent(userId, event, transactionAmount);
  if (!check.canClaim) {
    return { success: false, message: check.reason };
  }

  let rewardAmount = event.reward_amount;
  if (event.reward_type === REWARD_TYPES.PERCENT && transactionAmount > 0) rewardAmount = transactionAmount * (event.reward_amount / 100);

  Wallet.addCredits(userId, rewardAmount, 'event', `Event: ${event.name}`);
  db.run(`
    INSERT INTO event_claims (event_id, user_id, amount, reference_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, [eventId, userId, rewardAmount, referenceId, Date.now()]);

  return {
    success: true,
    amount: rewardAmount,
    message: `Received ${rewardAmount} credits from "${event.name}"!`
  };
}

function claimPromoCode(userId, code) {
  const event = getEventByCode(code);
  if (!event) {
    return { success: false, message: 'Invalid promo code' };
  }

  if (event.type !== EVENT_TYPES.PROMO) {
    return { success: false, message: 'Invalid promo code' };
  }

  return claimEvent(userId, event.id, 0, `promo:${code}`);
}

function processAutoEvents(userId, eventType, amount = 0, referenceId = null) {
  const events = getEventsByType(eventType, true);
  const claimed = [];

  for (const event of events) {
    const check = canClaimEvent(userId, event, amount);
    if (check.canClaim) {
      const result = claimEvent(userId, event.id, amount, referenceId);
      if (result.success) {
        claimed.push({
          eventName: event.name,
          amount: result.amount
        });
      }
    }
  }

  return claimed;
}

function getTotalClaims(eventId) {
  const result = db.query(`SELECT COUNT(*) FROM event_claims WHERE event_id = ?`, [eventId]);
  return result[0]?.values[0][0] || 0;
}

function getUserClaims(userId, eventId) {
  const result = db.query(`
    SELECT COUNT(*) FROM event_claims WHERE user_id = ? AND event_id = ?
  `, [userId, eventId]);
  return result[0]?.values[0][0] || 0;
}

function getEventStats(eventId) {
  const result = db.query(`
    SELECT COUNT(*) as claims, SUM(amount) as total_amount, COUNT(DISTINCT user_id) as unique_users
    FROM event_claims WHERE event_id = ?
  `, [eventId]);

  if (!result.length || !result[0].values.length) {
    return { claims: 0, total_amount: 0, unique_users: 0 };
  }

  const row = result[0].values[0];
  return {
    claims: row[0] || 0,
    total_amount: row[1] || 0,
    unique_users: row[2] || 0
  };
}

function mapEventRow(row) {
  return {
    id: row[0],
    code: row[1],
    name: row[2],
    type: row[3],
    reward_amount: row[4],
    reward_type: row[5],
    min_amount: row[6],
    max_claims: row[7],
    max_per_user: row[8],
    start_date: row[9],
    end_date: row[10],
    is_active: row[11] === 1,
    created_at: row[12]
  };
}

module.exports = { EVENT_TYPES, REWARD_TYPES, createEvent, getEventById, getEventsByType, getAllEvents, updateEvent, deleteEvent, claimEvent, claimPromoCode, processAutoEvents, getEventStats };
