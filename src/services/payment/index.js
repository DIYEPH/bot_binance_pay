// Payment Manager
const config = require('../../config');
const binance = require('./binance');
const sepay = require('./sepay');
const Transaction = require('../../database/models/transaction');
const Wallet = require('../wallet');
const Referral = require('../referral');
const Events = require('../events');
const { generateCode } = require('../../utils/helpers');

const METHODS = { BINANCE: 'binance', BANK: 'bank' };
const pendingDeposits = new Map();

function getAvailableMethods() {
  const methods = [];

  if (binance.isConfigured()) {
    methods.push({
      id: METHODS.BINANCE,
      name: 'Binance Pay',
      currency: 'USDT',
      icon: '💰'
    });
  }

  if (sepay.isConfigured()) {
    methods.push({
      id: METHODS.BANK,
      name: 'Chuyển khoản ngân hàng',
      currency: 'VND',
      icon: '🏦'
    });
  }

  return methods;
}

function createDeposit(userId, amount, method, chatId) {
  const paymentCode = generateCode();
  const expiresAt = Date.now() + config.DEPOSIT_EXPIRES_MINUTES * 60 * 1000;

  const depositId = Transaction.createPendingDeposit({
    userId,
    amount,
    currency: method === METHODS.BINANCE ? 'USDT' : 'VND',
    paymentMethod: method,
    paymentCode,
    chatId,
    expiresAt
  });

  pendingDeposits.set(paymentCode, {
    id: depositId,
    userId,
    amount,
    method,
    chatId,
    createdAt: Date.now(),
    expiresAt
  });

  const instructions = method === METHODS.BINANCE
    ? binance.getPaymentInstructions(amount, paymentCode)
    : sepay.getPaymentInstructions(amount, paymentCode);

  return {
    depositId,
    paymentCode,
    expiresAt,
    instructions
  };
}

async function checkPendingDeposits(onSuccess) {
  const confirmed = [];
  const now = Date.now();
  const pendingList = Transaction.getAllPendingDeposits();

  for (const deposit of pendingList) {
    if (deposit.expires_at && now > deposit.expires_at) {
      Transaction.updatePendingDepositStatus(deposit.id, 'expired');
      pendingDeposits.delete(deposit.payment_code);
      continue;
    }

    let paid = deposit.payment_method === METHODS.BINANCE
      ? await binance.checkPayment(deposit.payment_code, deposit.amount)
      : await sepay.checkPayment(deposit.payment_code, deposit.amount);

    if (paid) {
      const updated = Transaction.updatePendingDepositStatus(deposit.id, 'completed');
      if (updated > 0) {
        pendingDeposits.delete(deposit.payment_code);
        Wallet.deposit(deposit.user_id, deposit.amount, deposit.payment_method, `Deposit via ${deposit.payment_method}`);
        const referralBonus = Referral.processReferrerBonus(deposit.user_id, deposit.amount);
        const depositBonuses = Events.processAutoEvents(deposit.user_id, 'deposit', deposit.amount, `deposit:${deposit.id}`);

        confirmed.push({ ...deposit, referralBonus, depositBonuses });
        if (onSuccess) onSuccess(deposit.user_id, deposit.amount, deposit.payment_method, deposit.chat_id, depositBonuses);
      }
    }
  }

  return confirmed;
}

async function checkDeposit(paymentCode) {
  const deposit = Transaction.getPendingByCode(paymentCode);
  if (!deposit) return null;

  const paid = deposit.payment_method === METHODS.BINANCE
    ? await binance.checkPayment(paymentCode, deposit.amount)
    : await sepay.checkPayment(paymentCode, deposit.amount);

  if (paid) {
    const updated = Transaction.updatePendingDepositStatus(deposit.id, 'completed');
    if (updated > 0) {
      pendingDeposits.delete(paymentCode);
      Wallet.deposit(deposit.user_id, deposit.amount, deposit.payment_method, `Deposit via ${deposit.payment_method}`);
      const referralBonus = Referral.processReferrerBonus(deposit.user_id, deposit.amount);
      const depositBonuses = Events.processAutoEvents(deposit.user_id, 'deposit', deposit.amount, `deposit:${deposit.id}`);
      return { ...deposit, confirmed: true, referralBonus, depositBonuses };
    } else {
      return { ...deposit, confirmed: false, message: 'Already processed' };
    }
  }

  return { ...deposit, confirmed: false };
}

function cancelDeposit(paymentCode) {
  const deposit = Transaction.getPendingByCode(paymentCode);
  if (!deposit) return false;

  Transaction.updatePendingDepositStatus(deposit.id, 'cancelled');
  pendingDeposits.delete(paymentCode);

  return true;
}

function getDepositById(depositId) {
  return Transaction.getPendingDepositById(depositId);
}

function loadPendingDeposits() {
  const deposits = Transaction.getAllPendingDeposits();
  deposits.forEach(d => {
    pendingDeposits.set(d.payment_code, {
      id: d.id,
      userId: d.user_id,
      amount: d.amount,
      method: d.payment_method,
      chatId: d.chat_id,
      createdAt: d.created_at,
      expiresAt: d.expires_at
    });
  });
  console.log(`📦 Loaded ${deposits.length} pending deposits`);
}

module.exports = { METHODS, getAvailableMethods, createDeposit, checkPendingDeposits, checkDeposit, cancelDeposit, getDepositById, loadPendingDeposits, binance, sepay };
