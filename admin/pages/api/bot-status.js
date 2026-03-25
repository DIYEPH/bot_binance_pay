const { ensureDb, db } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();
    const lastSeen = await db.getBotHeartbeat();
    const now = Date.now();
    const delta = now - Number(lastSeen || 0);
    const online = lastSeen && delta < 60000;

    return res.status(200).json({
      ok: true,
      status: online ? 'online' : 'offline',
      lastSeen
    });
  } catch (err) {
    return res.status(200).json({ ok: false, status: 'offline' });
  }
};

module.exports.default = module.exports;
