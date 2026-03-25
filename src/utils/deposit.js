const config = require('../config');
const { formatPrice } = require('./helpers');

function buildDepositInstructionPayload({ amount, method, info, paymentCode, t }) {
  const isBinance = method === 'binance';
  const currency = isBinance ? 'USDT' : 'VND';

  let text = `💰 ${t('deposit_title')} ${formatPrice(amount, currency)}\n━━━━━━━━━━━━━━━━━━━\n\n`;

  if (isBinance) {
    text += `${t('binance_instructions')}\n`;
    text += `${t('binance_step1')}\n`;
    text += `${t('binance_step2')}\n`;
    text += `${t('binance_step3')}\n`;
    text += `${t('binance_step4', { id: info.binanceId || 'N/A' })}\n`;
    text += `${t('binance_step5', { amount: `${amount} ${info.currency}` })}\n`;
    text += `${t('binance_step6', { note: paymentCode })}\n`;
    text += `${t('binance_step7')}\n`;
  } else {
    text += `${t('bank_info')}\n`;
    text += `${t('bank_name', { name: info.bankInfo.bankName })}\n`;
    text += `${t('bank_account', { account: info.bankInfo.accountNumber })}\n`;
    text += `${t('bank_owner', { owner: info.bankInfo.accountName })}\n`;
    text += `${t('payment_note', { code: paymentCode })}\n\n`;
    text += t('scan_qr');
  }

  text += `\n\n${t('expires_30_min', { minutes: config.DEPOSIT_EXPIRES_MINUTES })}\n`;
  text += t('payment_warning');

  const keyboard = [
    [{ text: t('check_payment'), callback_data: `deposit_check_${paymentCode}` }],
    [{ text: t('cancel'), callback_data: `deposit_cancel_${paymentCode}` }]
  ];

  return {
    text,
    keyboard,
    isBinance,
    qrUrl: info.qrUrl || null,
  };
}

module.exports = { buildDepositInstructionPayload };
