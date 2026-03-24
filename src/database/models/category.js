// Category model
const db = require('../index');

async function getAll(activeOnly = true) {
  const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
  const result = await db.query(
    `SELECT id, name, description, is_active, created_at FROM categories ${whereClause} ORDER BY id DESC`
  );

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    name: row[1],
    description: row[2],
    is_active: row[3],
    created_at: row[4]
  }));
}

async function getById(id) {
  const result = await db.query(
    `SELECT id, name, description, is_active, created_at FROM categories WHERE id = ?`,
    [id]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    name: row[1],
    description: row[2],
    is_active: row[3],
    created_at: row[4]
  };
}

async function add(name, description = '', isActive = true) {
  await db.run(
    `INSERT INTO categories (name, description, is_active, created_at) VALUES (?, ?, ?, ?)`,
    [name, description, isActive ? 1 : 0, Date.now()]
  );
  return db.lastInsertRowId();
}

async function update(id, name, description = '', isActive = true) {
  await db.run(
    `UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ?`,
    [name, description, isActive ? 1 : 0, id]
  );
}

async function remove(id) {
  // Remove category only; products can be re-linked manually if needed
  await db.run(`DELETE FROM categories WHERE id = ?`, [id]);
}

module.exports = { getAll, getById, add, update, remove };
