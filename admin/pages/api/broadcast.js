const axios = require('axios');
const { db, ensureDb, mapRows } = require('../../lib/db');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, parseMode = null, dryRun = false, userIds = null } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const token = process.env.BOT_TOKEN;
    if (!token) return res.status(400).json({ error: 'BOT_TOKEN not configured' });

    let users = [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      const cleaned = userIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
      if (!cleaned.length) return res.status(400).json({ error: 'userIds must be a number array' });
      users = cleaned.map((id) => ({ id }));
    } else {
      users = mapRows(
        await db.query('SELECT id FROM users ORDER BY created_at DESC'),
        ['id']
      );
    }

    if (dryRun) {
      return res.status(200).json({ ok: true, total: users.length, sent: 0, failed: 0, dryRun: true });
    }

    let sent = 0;
    let failed = 0;

    for (const u of users) {
      try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: u.id,
          text: message,
          ...(parseMode ? { parse_mode: parseMode } : {})
        });
        sent += 1;
      } catch (err) {
        failed += 1;
      }
      await sleep(35);
    }

    res.status(200).json({ ok: true, total: users.length, sent, failed });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
