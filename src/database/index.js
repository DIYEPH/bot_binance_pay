// Database core - supports SQLite (default) or MySQL based on env
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

const DB_FILE = process.env.DB_FILE || 'teleshop.db';
const repoRoot = path.resolve(__dirname, '../../');
let dbPath = DB_FILE;

if (!path.isAbsolute(dbPath)) {
  if (!dbPath.includes('/') && !dbPath.includes('\\')) {
    dbPath = path.join(repoRoot, 'data', dbPath);
  } else {
    dbPath = path.resolve(repoRoot, dbPath);
  }
}

const DB_PATH = dbPath;
let driver = 'sqlite';
let sqliteDb = null;
let mysqlConn = null;
let _lastInsertId = 0;

function isMySQLConfigured() {
  return Boolean(config.MYSQL_HOST && config.MYSQL_USER && config.MYSQL_DATABASE);
}

async function initDB() {
  if (isMySQLConfigured()) {
    driver = 'mysql';
    const MySQL = require('sync-mysql');
    mysqlConn = new MySQL({
      host: config.MYSQL_HOST,
      port: config.MYSQL_PORT || 3306,
      user: config.MYSQL_USER,
      password: config.MYSQL_PASSWORD || '',
      database: config.MYSQL_DATABASE,
      charset: 'utf8mb4'
    });
    createTablesMySQL();
    console.log(`✅ Database initialized (MySQL) ${config.MYSQL_HOST || ''}/${config.MYSQL_DATABASE || ''}`);
    return;
  }

  driver = 'sqlite';
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  sqliteDb = await createSqliteDatabase(DB_PATH);
  await sqliteExec(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;`);
  await createTablesSQLite();
  console.log(`✅ Database initialized (SQLite) ${DB_PATH}`);
}

function createSqliteDatabase(filePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

function sqliteExec(sql) {
  return new Promise((resolve, reject) => {
    sqliteDb.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function sqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function sqliteRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function runCallback(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function createTablesSQLite() {
  const ddl = `
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

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      credits_price REAL,
      credits_enabled INTEGER DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (category_id) REFERENCES categories(id)
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

    CREATE TABLE IF NOT EXISTS bot_status (
      id INTEGER PRIMARY KEY,
      last_seen INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
    CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, is_sold);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_pending_deposits_code ON pending_deposits(payment_code, status);
    CREATE INDEX IF NOT EXISTS idx_events_code ON events(code, is_active);
    CREATE INDEX IF NOT EXISTS idx_event_claims_user ON event_claims(user_id, event_id);
  `;

  await sqliteExec(ddl);
  await ensureProductCategoryColumn();
  await sqliteRun(`INSERT OR IGNORE INTO referral_config (id, bonus_type, referrer_bonus, referee_bonus) VALUES (1, 'credits', 1, 0.5)`);
}

async function ensureProductCategoryColumn() {
  const columns = await sqliteAll(`PRAGMA table_info(products)`);
  const hasCategory = columns.some(c => c.name === 'category_id');
  if (!hasCategory) {
    await sqliteRun(`ALTER TABLE products ADD COLUMN category_id INTEGER`);
    await sqliteRun(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
  }
}

function createTablesMySQL() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      first_name VARCHAR(255),
      username VARCHAR(255),
      language VARCHAR(10) DEFAULT 'en',
      balance DECIMAL(18,4) DEFAULT 0,
      credits DECIMAL(18,4) DEFAULT 0,
      referral_code VARCHAR(50) UNIQUE,
      referred_by BIGINT,
      balance_spent DECIMAL(18,4) DEFAULT 0,
      credits_spent DECIMAL(18,4) DEFAULT 0,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_active TINYINT DEFAULT 1,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(18,4) NOT NULL,
      credits_price DECIMAL(18,4),
      credits_enabled TINYINT DEFAULT 0,
      description TEXT,
      is_active TINYINT DEFAULT 1,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(100) UNIQUE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      reward_amount DECIMAL(18,4) NOT NULL,
      reward_type VARCHAR(20) DEFAULT 'fixed',
      min_amount DECIMAL(18,4) DEFAULT 0,
      max_claims INT,
      max_per_user INT DEFAULT 1,
      start_date BIGINT,
      end_date BIGINT,
      is_active TINYINT DEFAULT 1,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS event_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      user_id BIGINT NOT NULL,
      amount DECIMAL(18,4) NOT NULL,
      reference_id VARCHAR(255),
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS stock (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      account_data TEXT NOT NULL,
      is_sold TINYINT DEFAULT 0,
      buyer_id BIGINT,
      sold_at BIGINT,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      unit_price DECIMAL(18,4) NOT NULL,
      total_price DECIMAL(18,4) NOT NULL,
      payment_method VARCHAR(50),
      payment_code VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      chat_id BIGINT,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      completed_at BIGINT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(18,4) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USDT',
      payment_method VARCHAR(50),
      reference_id VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      note TEXT,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS pending_deposits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      amount DECIMAL(18,4) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USDT',
      payment_method VARCHAR(50) NOT NULL,
      payment_code VARCHAR(100) NOT NULL,
      chat_id BIGINT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()*1000),
      expires_at BIGINT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS referral_config (
      id INT PRIMARY KEY,
      bonus_type VARCHAR(20) DEFAULT 'credits',
      referrer_bonus DECIMAL(18,4) DEFAULT 1,
      referee_bonus DECIMAL(18,4) DEFAULT 0.5,
      min_deposit_for_bonus DECIMAL(18,4) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS bot_status (
      id INT PRIMARY KEY,
      last_seen BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);`,
    `CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id, is_sold);`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, status);`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, type);`,
    `CREATE INDEX IF NOT EXISTS idx_pending_deposits_code ON pending_deposits(payment_code, status);`,
    `CREATE INDEX IF NOT EXISTS idx_events_code ON events(code, is_active);`,
    `CREATE INDEX IF NOT EXISTS idx_event_claims_user ON event_claims(user_id, event_id);`,

    `INSERT INTO referral_config (id, bonus_type, referrer_bonus, referee_bonus) VALUES (1, 'credits', 1, 0.5)
      ON DUPLICATE KEY UPDATE id = id;`
  ];

  for (const stmt of statements) {
    mysqlConn.query(stmt);
  }
}

async function setBotHeartbeat(timestamp) {
  if (driver === 'sqlite') {
    await sqliteRun(
      'INSERT INTO bot_status (id, last_seen) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen',
      [timestamp]
    );
    return;
  }

  await run(
    'INSERT INTO bot_status (id, last_seen) VALUES (1, ?) ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)',
    [timestamp]
  );
}

async function getBotHeartbeat() {
  const result = await query('SELECT last_seen FROM bot_status WHERE id = 1');
  if (!result.length || !result[0].values.length) return 0;
  return result[0].values[0][0] || 0;
}

function saveDB() {
  // For sqlite3 and MySQL, persistence is handled by the drivers.
}

function getDB() {
  return driver === 'sqlite' ? sqliteDb : mysqlConn;
}

async function query(sql, params = []) {
  try {
    if (driver === 'sqlite') {
      const rows = await sqliteAll(sql, params);
      if (!rows.length) return [];
      const cols = Object.keys(rows[0]);
      return [{ values: rows.map(r => cols.map(c => r[c])) }];
    }

    const rows = mysqlConn.query(sql, params);
    if (!rows || rows.length === 0) return [];
    const cols = Object.keys(rows[0]);
    return [{ values: rows.map(r => cols.map(c => r[c])) }];
  } catch (error) {
    console.error('DB Query Error:', error?.message || error);
    console.error('SQL:', sql);
    return [];
  }
}

async function run(sql, params = []) {
  try {
    if (driver === 'sqlite') {
      const info = await sqliteRun(sql, params);
      if (sql.trim().toUpperCase().startsWith('INSERT') && info && info.lastID) {
        _lastInsertId = info.lastID;
      }
      return;
    }

    const result = mysqlConn.query(sql, params);
    if (sql.trim().toUpperCase().startsWith('INSERT') && result && typeof result.insertId !== 'undefined') {
      _lastInsertId = result.insertId;
    }
  } catch (error) {
    console.error('DB Run Error:', error?.message || error);
    console.error('SQL:', sql);
    console.error('Params:', params);
  }
}

function lastInsertRowId() {
  return _lastInsertId || 0;
}

module.exports = { initDB, saveDB, getDB, query, run, lastInsertRowId, setBotHeartbeat, getBotHeartbeat };
