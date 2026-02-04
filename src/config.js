require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_USERNAME: process.env.BOT_USERNAME || '',
  SHOP_NAME: process.env.SHOP_NAME || 'Shop Bot',
  ADMIN_IDS: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)),
  ADMIN_USER_NAME: process.env.ADMIN_USER_NAME,
  BINANCE_API_KEY: process.env.BINANCE_API_KEY,
  BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY,
  BINANCE_PAY_ID: process.env.BINANCE_PAY_ID,
  BANK_ENABLED: process.env.BANK_ENABLED === 'false',
  SEPAY_API_KEY: process.env.SEPAY_API_KEY,
  BANK_ACCOUNT: process.env.BANK_ACCOUNT,
  BANK_NAME: process.env.BANK_NAME,
  BANK_OWNER: process.env.BANK_OWNER,
  BANK_BIN: process.env.BANK_BIN,
  REFERRER_BONUS: parseFloat(process.env.REFERRER_BONUS) || 1,
  REFEREE_BONUS: parseFloat(process.env.REFEREE_BONUS) || 0.5,
  MIN_DEPOSIT_FOR_BONUS: parseFloat(process.env.MIN_DEPOSIT_FOR_BONUS) || 5,
  DEPOSIT_EXPIRES_MINUTES: parseInt(process.env.DEPOSIT_EXPIRES_MINUTES) || 15
};
