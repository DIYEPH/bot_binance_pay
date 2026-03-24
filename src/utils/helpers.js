// Helper utilities
const config = require('../config');

function formatPrice(price, currency = 'USDT') {
  const num = Number(price || 0);
  if (Number.isNaN(num)) return currency === 'VND' ? '0 VND' : '0 USDT';
  const rounded = Math.round(num * 100) / 100;
  return currency === 'VND' ? rounded.toLocaleString('vi-VN') + ' VND' : rounded + ' USDT';
}

function formatCredits(credits) {
  return Number(credits || 0) + ' Coin';
}

function formatNumber(num) {
  return Number(num || 0).toString();
}

function isAdmin(userId) { return config.ADMIN_IDS.includes(userId); }

function getFullName(user) {
  return (user.first_name + (user.last_name ? ' ' + user.last_name : '')).trim();
}

function generateCode(existingCodes = new Set(), length = 8) {
  let code;
  let attempts = 0;
  do {
    code = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    attempts++;
  } while (existingCodes.has(code) && attempts < 100);
  return code;
}

function generateReferralCode(userId) {
  const base = userId.toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return base + random;
}

function getAdminUsername() {
  return (config.ADMIN_USER_NAME || '').trim().replace('@', '');
}

function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = { formatPrice, formatCredits, formatNumber, isAdmin, getFullName, generateCode, generateReferralCode, getAdminUsername, formatDateShort };
