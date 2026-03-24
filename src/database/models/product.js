// Product model
const db = require('../index');

async function getAll(activeOnly = true) {
  const whereClause = activeOnly ? 'WHERE p.is_active = 1' : '';
  const result = await db.query(`
    SELECT p.id, p.category_id, p.name, p.price, p.credits_price, p.credits_enabled, p.description, p.is_active,
           COUNT(CASE WHEN s.is_sold = 0 THEN 1 END) as stock_count
    FROM products p
    LEFT JOIN stock s ON p.id = s.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    category_id: row[1],
    name: row[2],
    price: row[3],
    credits_price: row[4],
    credits_enabled: row[5] === 1,
    description: row[6],
    is_active: row[7],
    stock_count: row[8] || 0
  }));
}

async function getById(id) {
  const result = await db.query(`
    SELECT p.id, p.category_id, p.name, p.price, p.credits_price, p.credits_enabled, p.description, p.is_active,
           COUNT(CASE WHEN s.is_sold = 0 THEN 1 END) as stock_count
    FROM products p
    LEFT JOIN stock s ON p.id = s.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];
  return {
    id: row[0],
    category_id: row[1],
    name: row[2],
    price: row[3],
    credits_price: row[4],
    credits_enabled: row[5] === 1,
    description: row[6],
    is_active: row[7],
    stock_count: row[8] || 0
  };
}

async function getByCategory(categoryId, activeOnly = true) {
  const whereClause = activeOnly ? 'AND p.is_active = 1' : '';
  const result = await db.query(`
    SELECT p.id, p.category_id, p.name, p.price, p.credits_price, p.credits_enabled, p.description, p.is_active,
           COUNT(CASE WHEN s.is_sold = 0 THEN 1 END) as stock_count
    FROM products p
    LEFT JOIN stock s ON p.id = s.product_id
    WHERE p.category_id = ? ${whereClause}
    GROUP BY p.id
    ORDER BY p.id DESC
  `, [categoryId]);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    category_id: row[1],
    name: row[2],
    price: row[3],
    credits_price: row[4],
    credits_enabled: row[5] === 1,
    description: row[6],
    is_active: row[7],
    stock_count: row[8] || 0
  }));
}

async function getCategoryPriceRanges(activeOnly = true) {
  const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
  const result = await db.query(`
    SELECT category_id, MIN(price) as min_price, MAX(price) as max_price
    FROM products
    ${whereClause}
    GROUP BY category_id
  `);

  if (!result.length) return {};

  return result[0].values.reduce((acc, row) => {
    acc[row[0]] = { min: row[1], max: row[2] };
    return acc;
  }, {});
}

async function add(name, price, description = '', creditsPrice = null, creditsEnabled = false, categoryId = null) {
  await db.run(
    `INSERT INTO products (category_id, name, price, credits_price, credits_enabled, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [categoryId, name, price, creditsPrice, creditsEnabled ? 1 : 0, description, Date.now()]
  );
  return db.lastInsertRowId();
}

async function update(id, name, price, description, categoryId) {
  if (typeof categoryId === 'undefined') {
    await db.run(`UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?`, [name, price, description, id]);
  } else {
    await db.run(`UPDATE products SET name = ?, price = ?, description = ?, category_id = ? WHERE id = ?`, [name, price, description, categoryId, id]);
  }
}

async function updateCreditsSettings(id, creditsPrice, creditsEnabled) {
  await db.run(
    `UPDATE products SET credits_price = ?, credits_enabled = ? WHERE id = ?`,
    [creditsPrice, creditsEnabled ? 1 : 0, id]
  );
}

async function remove(id) {
  await db.run(`DELETE FROM stock WHERE product_id = ?`, [id]);
  await db.run(`DELETE FROM products WHERE id = ?`, [id]);
}

async function addStock(productId, accounts) {
  const now = Date.now();
  let added = 0;

  for (const account of accounts) {
    if (account.trim()) {
      await db.run(
        `INSERT INTO stock (product_id, account_data, created_at) VALUES (?, ?, ?)`,
        [productId, account.trim(), now]
      );
      added++;
    }
  }

  return added;
}

async function getAvailableStock(productId, limit = 1) {
  const result = await db.query(`
    SELECT id, product_id, account_data 
    FROM stock 
    WHERE product_id = ? AND is_sold = 0 
    ORDER BY id ASC
    LIMIT ?
  `, [productId, limit]);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    product_id: row[1],
    account_data: row[2]
  }));
}

// Atomic: Reserve stock trước, trả về số lượng thực sự reserved
async function reserveStock(productId, quantity, buyerId) {
  const now = Date.now();

  // Atomic update - chỉ update những stock chưa bị sold
  await db.run(`
    UPDATE stock SET is_sold = 1, buyer_id = ?, sold_at = ?
    WHERE id IN (
      SELECT id FROM stock 
      WHERE product_id = ? AND is_sold = 0 
      ORDER BY id ASC 
      LIMIT ?
    )
  `, [buyerId, now, productId, quantity]);

  // Lấy stock đã reserved cho user này
  const result = await db.query(`
    SELECT id, product_id, account_data 
    FROM stock 
    WHERE product_id = ? AND buyer_id = ? AND sold_at = ?
    ORDER BY id ASC
  `, [productId, buyerId, now]);

  if (!result.length || !result[0].values.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    product_id: row[1],
    account_data: row[2]
  }));
}

async function markStockSold(stockIds, buyerId) {
  const now = Date.now();
  for (const id of stockIds) {
    await db.run(
      `UPDATE stock SET is_sold = 1, buyer_id = ?, sold_at = ? WHERE id = ?`,
      [buyerId, now, id]
    );
  }
}

// Rollback reserved stock nếu cần
async function releaseStock(stockIds) {
  for (const id of stockIds) {
    await db.run(`UPDATE stock SET is_sold = 0, buyer_id = NULL, sold_at = NULL WHERE id = ?`, [id]);
  }
}

async function getStockByProduct(productId) {
  const result = await db.query(`
    SELECT id, account_data, is_sold, buyer_id, sold_at 
    FROM stock 
    WHERE product_id = ?
    ORDER BY id DESC
  `, [productId]);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    account_data: row[1],
    is_sold: row[2],
    buyer_id: row[3],
    sold_at: row[4]
  }));
}

async function deleteStock(stockId) {
  await db.run(`DELETE FROM stock WHERE id = ? AND is_sold = 0`, [stockId]);
}

async function clearStock(productId) {
  await db.run(`DELETE FROM stock WHERE product_id = ? AND is_sold = 0`, [productId]);
}

async function getStockStats() {
  const result = await db.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_sold = 0 THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN is_sold = 1 THEN 1 ELSE 0 END) as sold
    FROM stock
  `);

  if (!result.length || !result[0].values.length) {
    return { total: 0, available: 0, sold: 0 };
  }

  const row = result[0].values[0];
  return {
    total: row[0] || 0,
    available: row[1] || 0,
    sold: row[2] || 0
  };
}

module.exports = { getAll, getById, getByCategory, getCategoryPriceRanges, add, update, updateCreditsSettings, remove, addStock, getAvailableStock, reserveStock, markStockSold, releaseStock, getStockByProduct, deleteStock, clearStock, getStockStats };
