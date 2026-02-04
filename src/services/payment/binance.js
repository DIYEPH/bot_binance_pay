// Binance Pay gateway
const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');

const BASE_URL = 'https://api.binance.com';
const API_KEY = config.BINANCE_API_KEY;
const SECRET_KEY = config.BINANCE_SECRET_KEY;

async function getTransactionHistory(days = 3) {
  try {
    const timestamp = Date.now();
    const startTime = timestamp - days * 24 * 60 * 60 * 1000;

    const queryString = `limit=100&startTime=${startTime}&endTime=${timestamp}&timestamp=${timestamp}`;

    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(queryString)
      .digest('hex');

    const url = `${BASE_URL}/sapi/v1/pay/transactions?${queryString}&signature=${signature}`;

    const res = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': API_KEY },
      timeout: 10000
    });

    return res.data?.data || [];
  } catch (error) {
    console.error('Binance getTransactionHistory error:', error.message);
    return [];
  }
}

async function checkPayment(note, amount, currency = 'USDT') {
  try {
    const transactions = await getTransactionHistory();
    
    const amountStr = String(amount);
    const found = transactions.find(tx => {
      return (
        Number(tx.amount) > 0 &&
        tx.note === note &&
        tx.amount === amountStr &&
        tx.currency === currency
      );
    });

    return found || null;
  } catch (error) {
    console.error('Binance checkPayment error:', error.message);
    return null;
  }
}

function isConfigured() {
  return !!(API_KEY && SECRET_KEY);
}

function getPaymentInstructions(amount, note, currency = 'USDT') {
  return {
    method: 'binance',
    amount,
    currency,
    note,
    binanceId: config.BINANCE_PAY_ID || ''
  };
}

module.exports = { getTransactionHistory, checkPayment, isConfigured, getPaymentInstructions };
