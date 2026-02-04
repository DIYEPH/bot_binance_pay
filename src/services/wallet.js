// Wallet service
const User = require('../database/models/user');
const Transaction = require('../database/models/transaction');

function getWallet(userId) {
  const user = User.getById(userId);
  if (!user) return null;

  const balance = user.balance || 0;
  const credits = user.credits || 0;
  const balanceSpent = user.balance_spent || 0;
  const creditsSpent = user.credits_spent || 0;

  return {
    balance,
    credits,
    total: balance + credits,
    balanceSpent,
    creditsSpent
  };
}

function deposit(userId, amount, paymentMethod, note = '') {
  if (amount <= 0) return false;

  User.addBalance(userId, amount);

  Transaction.create({
    userId,
    type: Transaction.TYPES.DEPOSIT,
    amount,
    paymentMethod,
    status: 'completed',
    note
  });

  return true;
}

function addCredits(userId, amount, type = 'event', note = '') {
  if (amount <= 0) return false;

  User.addCredits(userId, amount);

  Transaction.create({
    userId,
    type,
    amount,
    currency: 'CREDITS',
    status: 'completed',
    note
  });

  return true;
}

function purchase(userId, amount, preferredMethod = 'auto') {
  const wallet = getWallet(userId);
  if (!wallet) {
    return { success: false, message: 'User not found' };
  }

  let usedCredits = 0;
  let usedBalance = 0;

  if (preferredMethod === 'credits') {
    if (wallet.credits < amount) return { success: false, message: 'Không đủ xu free' };
    usedCredits = amount;
  } else if (preferredMethod === 'balance') {
    if (wallet.balance < amount) return { success: false, message: 'Không đủ số dư' };
    usedBalance = amount;
  } else {
    if (wallet.total < amount) return { success: false, message: 'Không đủ số dư và xu free' };
    usedCredits = Math.min(wallet.credits, amount);
    usedBalance = amount - usedCredits;
  }

  if (usedCredits > 0) {
    User.deductCredits(userId, usedCredits);
    User.addCreditsSpent(userId, usedCredits);
  }
  if (usedBalance > 0) {
    User.deductBalance(userId, usedBalance);
    User.addBalanceSpent(userId, usedBalance);
  }

  Transaction.create({
    userId,
    type: Transaction.TYPES.PURCHASE,
    amount: -amount,
    note: `Credits: ${usedCredits}, Balance: ${usedBalance}`
  });

  return {
    success: true,
    usedCredits,
    usedBalance,
    message: 'Thanh toán thành công'
  };
}

function adminAddBalance(userId, amount, adminId, note = '') {
  if (amount <= 0) return false;

  User.addBalance(userId, amount);

  Transaction.create({
    userId,
    type: Transaction.TYPES.ADMIN_ADD,
    amount,
    note: `By admin ${adminId}: ${note}`
  });

  return true;
}

function adminAddCredits(userId, amount, adminId, note = '') {
  if (amount <= 0) return false;

  User.addCredits(userId, amount);

  Transaction.create({
    userId,
    type: Transaction.TYPES.ADMIN_ADD,
    amount,
    currency: 'CREDITS',
    note: `By admin ${adminId}: ${note}`
  });

  return true;
}

function refund(userId, amount, toWallet = 'balance', note = '') {
  if (amount <= 0) return false;

  if (toWallet === 'credits') {
    User.addCredits(userId, amount);
  } else {
    User.addBalance(userId, amount);
  }

  Transaction.create({
    userId,
    type: Transaction.TYPES.REFUND,
    amount,
    currency: toWallet === 'credits' ? 'CREDITS' : 'USDT',
    note
  });

  return true;
}

module.exports = { getWallet, deposit, addCredits, purchase, adminAddBalance, adminAddCredits, refund };
