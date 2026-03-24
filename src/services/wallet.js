// Wallet service
const User = require('../database/models/user');
const Transaction = require('../database/models/transaction');

async function getWallet(userId) {
  const user = await User.getById(userId);
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

async function deposit(userId, amount, paymentMethod, note = '') {
  if (amount <= 0) return false;

  await User.addBalance(userId, amount);

  await Transaction.create({
    userId,
    type: Transaction.TYPES.DEPOSIT,
    amount,
    paymentMethod,
    status: 'completed',
    note
  });

  return true;
}

async function addCredits(userId, amount, type = 'event', note = '') {
  if (amount <= 0) return false;

  await User.addCredits(userId, amount);

  await Transaction.create({
    userId,
    type,
    amount,
    currency: 'CREDITS',
    status: 'completed',
    note
  });

  return true;
}

async function purchase(userId, amount, preferredMethod = 'auto') {
  const wallet = await getWallet(userId);
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
    await User.deductCredits(userId, usedCredits);
    await User.addCreditsSpent(userId, usedCredits);
  }
  if (usedBalance > 0) {
    await User.deductBalance(userId, usedBalance);
    await User.addBalanceSpent(userId, usedBalance);
  }

  await Transaction.create({
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

async function adminAddBalance(userId, amount, adminId, note = '') {
  if (amount <= 0) return false;

  await User.addBalance(userId, amount);

  await Transaction.create({
    userId,
    type: Transaction.TYPES.ADMIN_ADD,
    amount,
    note: `By admin ${adminId}: ${note}`
  });

  return true;
}

async function adminAddCredits(userId, amount, adminId, note = '') {
  if (amount <= 0) return false;

  await User.addCredits(userId, amount);

  await Transaction.create({
    userId,
    type: Transaction.TYPES.ADMIN_ADD,
    amount,
    currency: 'CREDITS',
    note: `By admin ${adminId}: ${note}`
  });

  return true;
}

async function refund(userId, amount, toWallet = 'balance', note = '') {
  if (amount <= 0) return false;

  if (toWallet === 'credits') {
    await User.addCredits(userId, amount);
  } else {
    await User.addBalance(userId, amount);
  }

  await Transaction.create({
    userId,
    type: Transaction.TYPES.REFUND,
    amount,
    currency: toWallet === 'credits' ? 'CREDITS' : 'USDT',
    note
  });

  return true;
}

module.exports = { getWallet, deposit, addCredits, purchase, adminAddBalance, adminAddCredits, refund };
