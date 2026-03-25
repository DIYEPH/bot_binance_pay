const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const dbFile = process.env.DB_FILE || 'teleshop.db';
if (!path.isAbsolute(dbFile)) {
  const repoRoot = path.resolve(process.cwd(), '..');
  const resolved = dbFile.includes('/') || dbFile.includes('\\')
    ? path.resolve(repoRoot, dbFile)
    : path.join(repoRoot, 'data', dbFile);
  process.env.DB_FILE = resolved;
}

const db = require('../../src/database/index.js');
let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await db.initDB();
    initialized = true;
  }
}

function getScalar(result, fallback = 0) {
  return result?.[0]?.values?.[0]?.[0] ?? fallback;
}

function mapRows(result, columns) {
  if (!result?.[0]?.values?.length) return [];
  return result[0].values.map(row => {
    const entry = {};
    columns.forEach((col, idx) => {
      entry[col] = row[idx];
    });
    return entry;
  });
}

module.exports = { db, ensureDb, getScalar, mapRows };
