const { ensureDb } = require('../../lib/db');
const Events = require('../../../src/services/events');

module.exports = async function handler(req, res) {
  try {
    await ensureDb();

    if (req.method === 'GET') {
      const rows = await Events.getAllEvents(false);
      const withStats = await Promise.all(
        rows.map(async (e) => {
          const stats = await Events.getEventStats(e.id);
          return { ...e, stats };
        })
      );
      return res.status(200).json(withStats);
    }

    if (req.method === 'POST') {
      const {
        code = null,
        name,
        type,
        reward_amount,
        reward_type = 'fixed',
        min_amount = 0,
        max_claims = null,
        max_per_user = 1,
        start_date = null,
        end_date = null,
        is_active = true
      } = req.body || {};

      if (!name || !type || !reward_amount) {
        return res.status(400).json({ error: 'name, type, reward_amount are required' });
      }

      const id = await Events.createEvent({
        code,
        name,
        type,
        reward_amount: Number(reward_amount),
        reward_type,
        min_amount: Number(min_amount || 0),
        max_claims: max_claims ? Number(max_claims) : null,
        max_per_user: max_per_user ? Number(max_per_user) : 1,
        start_date,
        end_date,
        is_active
      });

      return res.status(200).json({ ok: true, id });
    }

    if (req.method === 'PUT') {
      const { id, ...payload } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });

      const data = { ...payload };
      if (data.reward_amount !== undefined) data.reward_amount = Number(data.reward_amount);
      if (data.min_amount !== undefined) data.min_amount = Number(data.min_amount);
      if (data.max_claims !== undefined && data.max_claims !== null) data.max_claims = Number(data.max_claims);
      if (data.max_per_user !== undefined && data.max_per_user !== null) data.max_per_user = Number(data.max_per_user);

      await Events.updateEvent(Number(id), data);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      await Events.deleteEvent(Number(id));
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

module.exports.default = module.exports;
