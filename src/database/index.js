// Database core - SQLite with sql.js
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/shop.db');
let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA busy_timeout = 5000;');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      username TEXT,
      language TEXT DEFAULT 'en',
      balance REAL DEFAULT 0,
      credits REAL DEFAULT 0,
      referral_code TEXT UNIQUE,
      referred_by INTEGER,
      balance_spent REAL DEFAULT 0,
      credits_spent REAL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      credits_price REAL,
      credits_enabled INTEGER DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      reward_amount REAL NOT NULL,
      reward_type TEXT DEFAULT 'fixed',
      min_amount REAL DEFAULT 0,
      max_claims INTEGER,
      max_per_user INTEGER DEFAULT 1,
      start_date INTEGER,
      end_date INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS event_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reference_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      account_data TEXT NOT NULL,
      is_sold INTEGER DEFAULT 0,
      buyer_id INTEGER,
      sold_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_method TEXT,
      payment_code TEXT,
      status TEXT DEFAULT 'pending',
      chat_id INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      completed_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USDT',
      payment_method TEXT,
      reference_id TEXT,
      status TEXT DEFAULT 'pending',
      note TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pending_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USDT',
      payment_method TEXT NOT NULL,
      payment_code TEXT NOT NULL,
      chat_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      expires_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS referral_config (
      id INTEGER PRIMARY KEY,
      bonus_type TEXT DEFAULT 'credits',
      referrer_bonus REAL DEFAULT 1,
      referee_bonus REAL DEFAULT 0.5,
      min_deposit_for_bonus REAL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, is_sold);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_pending_deposits_code ON pending_deposits(payment_code, status);
    CREATE INDEX IF NOT EXISTS idx_events_code ON events(code, is_active);
    CREATE INDEX IF NOT EXISTS idx_event_claims_user ON event_claims(user_id, event_id);
  `);

  db.run(`INSERT OR IGNORE INTO referral_config (id, bonus_type, referrer_bonus, referee_bonus) VALUES (1, 'credits', 1, 0.5)`);

  saveDB();
  console.log('✅ Database initialized');
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

function getDB() { return db; }

function query(sql, params = []) {
  try {
    return db.exec(sql, params);
  } catch (error) {
    console.error('DB Query Error:', error?.message || error);
    return [];
  }
}

let _lastInsertId = 0;

function run(sql, params = []) {
  try {
    db.run(sql, params);
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = db.exec('SELECT last_insert_rowid()');
      if (result.length && result[0].values.length) {
        _lastInsertId = result[0].values[0][0];
      }
    }
    saveDB();
  } catch (error) {
    console.error('DB Run Error:', error?.message || error);
    console.error('SQL:', sql);
    console.error('Params:', params);
  }
}

function lastInsertRowId() {
  return _lastInsertId || 0;
}

module.exports = { initDB, saveDB, getDB, query, run, lastInsertRowId };
