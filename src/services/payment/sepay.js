// SePay (Bank Transfer) gateway
const axios = require('axios');
const config = require('../../config');

const API_URL = 'https://my.sepay.vn/userapi/transactions/list';

async function getTransactions() {
  try {
    if (!config.SEPAY_API_KEY) {
      console.log('SePay API key not configured');
      return [];
    }

    const res = await axios.get(API_URL, {
      headers: { 
        'Authorization': `Bearer ${config.SEPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return res.data?.transactions || [];
  } catch (error) {
    console.error('SePay getTransactions error:', error.message);
    return [];
  }
}

async function checkPayment(content, amount) {
  try {
    const transactions = await getTransactions();
    
    const found = transactions.find(t => {
      const transContent = (t.transaction_content || t.content || t.description || '').toUpperCase();
      const transAmount = parseInt(t.amount_in || t.amount || 0);
      return transContent.includes(content.toUpperCase()) && transAmount >= amount;
    });

    return found || null;
  } catch (error) {
    console.error('SePay checkPayment error:', error.message);
    return null;
  }
}

function getPaymentInstructions(amount, content) {
  return {
    method: 'bank',
    amount,
    currency: 'VND',
    content,
    bankInfo: {
      bankName: config.BANK_NAME,
      accountNumber: config.BANK_ACCOUNT,
      accountName: config.BANK_OWNER,
      bin: config.BANK_BIN
    },
    qrUrl: `https://img.vietqr.io/image/${config.BANK_BIN}-${config.BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
  };
}

module.exports = { checkPayment, getPaymentInstructions };
