// Text message handlers
const config = require('../config');
const Product = require('../database/models/product');
const Wallet = require('../services/wallet');
const Referral = require('../services/referral');
const Payment = require('../services/payment');
const Events = require('../services/events');
const { formatPrice, formatCredits, isAdmin } = require('../utils/helpers');
const { buildAdminProductDetailKeyboard } = require('../utils/keyboard');
const { userState } = require('./callbacks');
const { getAdminState } = require('./admin');
const i18n = require('../locales');

function register(bot) {
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const userId = msg.from.id;
    const state = userState.get(userId);
    if (state) return handleUserInput(bot, msg, state);

    if (isAdmin(userId)) {
      const aState = getAdminState().get(userId);
      if (aState) return handleAdminInput(bot, msg, aState);
    }
  });
}

async function handleUserInput(bot, msg, state) {
  const userId = msg.from.id;

  switch (state.action) {
    case 'custom_qty': return handleCustomQuantity(bot, msg, state);
    case 'custom_deposit': return handleCustomDeposit(bot, msg, state);
    case 'enter_referral': return handleReferralCode(bot, msg, state);
    case 'enter_promo': return handlePromoCode(bot, msg, state);
    default: userState.delete(userId);
  }
}

async function handleCustomQuantity(bot, msg, state) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const t = i18n.getTranslator(userId);
  const qty = parseInt(msg.text.trim());

  const product = Product.getById(state.productId);

  if (!product) {
    userState.delete(userId);
    return bot.sendMessage(chatId, t('product_not_found'));
  }

  if (isNaN(qty) || qty < 1) {
    return bot.sendMessage(chatId, t('invalid_quantity'), {
      reply_markup: { inline_keyboard: [[{ text: t('cancel'), callback_data: `product_${state.productId}` }]] }
    });
  }

  if (qty > product.stock_count) {
    return bot.sendMessage(chatId, t('not_enough_stock', { count: product.stock_count }), {
      reply_markup: { inline_keyboard: [[{ text: t('cancel'), callback_data: `product_${state.productId}` }]] }
    });
  }

  userState.delete(userId);

  // Show payment options
  const balancePrice = product.price * qty;
  const creditsPrice = (product.credits_price || product.price) * qty;
  const wallet = Wallet.getWallet(userId);
  const canUseCredits = product.credits_enabled;

  let text = `${t('payment_title')}
━━━━━━━━━━━━━━━━━━━━━

🎁 ${product.name} x${qty}
💵 Balance price: ${formatPrice(balancePrice)}`;

  if (canUseCredits) {
    text += `\n🎁 Credits price: ${formatCredits(creditsPrice)}`;
  }

  text += `\n
${t('your_balance')}
${t('balance_label', { amount: formatPrice(wallet?.balance || 0) })}
${t('credits_label', { amount: formatCredits(wallet?.credits || 0) })}

${t('select_payment')}`;

  const canPayBalance = (wallet?.balance || 0) >= balancePrice;
  const canPayCredits = canUseCredits && (wallet?.credits || 0) >= creditsPrice;
  const hasEnoughFunds = canPayBalance || canPayCredits;

  const keyboard = [];

  // Credits option
  if (canUseCredits) {
    if (canPayCredits) {
      keyboard.push([{
        text: `🎁 ${t('pay_with_credits', { amount: formatCredits(creditsPrice) })}`,
        callback_data: `pay_credits_${state.productId}_${qty}`
      }]);
    } else {
      keyboard.push([{ text: `🎁 Credits: ${formatCredits(creditsPrice)} (${t('not_enough')})`, callback_data: 'noop' }]);
    }
  }

  // Balance option
  if (canPayBalance) {
    keyboard.push([{
      text: `💵 ${t('pay_with_balance', { amount: formatPrice(balancePrice) })}`,
      callback_data: `pay_balance_${state.productId}_${qty}`
    }]);
  } else {
    keyboard.push([{ text: `💵 Balance: ${formatPrice(balancePrice)} (${t('not_enough')})`, callback_data: 'noop' }]);
  }

  // Show deposit button if not enough funds
  if (!hasEnoughFunds) {
    keyboard.push([{ text: `💰 ${t('deposit_btn')}`, callback_data: 'deposit_menu' }]);
  }

  keyboard.push([{ text: t('back'), callback_data: `product_${state.productId}` }]);

  bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: keyboard } });
}

async function handleCustomDeposit(bot, msg, state) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const t = i18n.getTranslator(userId);
  const amount = parseFloat(msg.text.trim());

  if (isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId, t('invalid_amount'), {
      reply_markup: { inline_keyboard: [[{ text: t('cancel'), callback_data: 'deposit_menu' }]] }
    });
  }

  const minAmount = state.method === 'binance' ? 1 : 10000;
  if (amount < minAmount) {
    return bot.sendMessage(chatId, t('min_amount', { amount: formatPrice(minAmount, state.method === 'binance' ? 'USDT' : 'VND') }), {
      reply_markup: { inline_keyboard: [[{ text: t('cancel'), callback_data: 'deposit_menu' }]] }
    });
  }

  userState.delete(userId);

  const deposit = Payment.createDeposit(userId, amount, state.method, chatId);
  const info = deposit.instructions;
  const currency = state.method === 'binance' ? 'USDT' : 'VND';

  let text = `💰 DEPOSIT ${formatPrice(amount, currency)}
━━━━━━━━━━━━━━━━━━━\n\n`;

  if (state.method === 'binance') {
    text += `${t('binance_instructions')}\n`;
    text += `${t('binance_step1')}\n`;
    text += `${t('binance_step2')}\n`;
    text += `${t('binance_step3')}\n`;
    text += `${t('binance_step4', { id: info.binanceId || 'N/A' })}\n`;
    text += `${t('binance_step5', { amount: `${amount} ${info.currency}` })}\n`;
    text += `${t('binance_step6', { note: deposit.paymentCode })}\n`;
    text += `${t('binance_step7')}\n`;
  } else {
    text += `${t('bank_info')}\n`;
    text += `${t('bank_name', { name: info.bankInfo.bankName })}\n`;
    text += `${t('bank_account', { account: info.bankInfo.accountNumber })}\n`;
    text += `${t('bank_owner', { owner: info.bankInfo.accountName })}\n`;
    text += `${t('payment_note', { code: deposit.paymentCode })}\n\n`;
    text += t('scan_qr');
  }

  text += `\n\n${t('expires_30_min', { minutes: config.DEPOSIT_EXPIRES_MINUTES })}\n`;
  text += t('payment_warning');

  const keyboard = [
    [{ text: t('check_payment'), callback_data: `deposit_check_${deposit.paymentCode}` }],
    [{ text: t('cancel'), callback_data: `deposit_cancel_${deposit.paymentCode}` }]
  ];

  if (state.method === 'binance') {
    bot.sendPhoto(chatId, './public/bnc_qr.png', {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } else if (state.method === 'bank' && info.qrUrl) {
    bot.sendPhoto(chatId, info.qrUrl, {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    }, {
      contentType: 'image/png'
    });
  } else {
    bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }
}

async function handleReferralCode(bot, msg, state) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const t = i18n.getTranslator(userId);
  const code = msg.text.trim().toUpperCase();

  userState.delete(userId);

  const result = Referral.processReferral(userId, code);

  if (result.success) {
    bot.sendMessage(chatId, t('referral_success', { name: result.referrer.first_name, amount: result.bonus }), {
      reply_markup: { inline_keyboard: [[{ text: t('back'), callback_data: 'credits_menu' }]] }
    });
  } else {
    bot.sendMessage(chatId, t('invalid_referral'), {
      reply_markup: { inline_keyboard: [[{ text: t('back'), callback_data: 'credits_menu' }]] }
    });
  }
}

async function handlePromoCode(bot, msg, state) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const code = msg.text.trim().toUpperCase();

  userState.delete(userId);

  const result = Events.claimPromoCode(userId, code);

  if (result.success) {
    bot.sendMessage(chatId, `✅ ${result.message}`, {
      reply_markup: { inline_keyboard: [[{ text: '◀️ Back', callback_data: 'credits_menu' }]] }
    });
  } else {
    bot.sendMessage(chatId, `❌ ${result.message}`, {
      reply_markup: { inline_keyboard: [[{ text: '🔄 Try again', callback_data: 'enter_promo' }, { text: '◀️ Back', callback_data: 'credits_menu' }]] }
    });
  }
}

async function handleAdminInput(bot, msg, state) {
  const userId = msg.from.id;
  const adminState = getAdminState();

  switch (state.action) {
    case 'new_product': return handleNewProduct(bot, msg, state, adminState);
    case 'edit_product': return handleEditProduct(bot, msg, state, adminState);
    case 'add_stock': return handleAddStock(bot, msg, state, adminState);
    case 'broadcast': return handleBroadcast(bot, msg, state, adminState);
    case 'set_credits_price': return handleSetCreditsPrice(bot, msg, state, adminState);
    case 'add_event': return handleAddEvent(bot, msg, state, adminState);
    default: adminState.delete(userId);
  }
}

async function handleNewProduct(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const parts = msg.text.split('|').map(s => s.trim());
  const name = parts[0];
  const price = parseFloat(parts[1]);
  const desc = parts.slice(2).join('|') || '';

  if (!name || isNaN(price) || price < 0) {
    return bot.sendMessage(chatId, '✖️ Sai format! Nhập lại:\nTên|Giá|Mô tả\n\nVí dụ: Netflix 1 tháng|5|Tài khoản Premium', {
      reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: 'adm_back_list' }]] }
    });
  }

  const productId = Product.add(name, price, desc);
  adminState.delete(userId);

  const text = `✅ ĐÃ THÊM SẢN PHẨM
━━━━━━━━━━━━━━━━━━━━━

📦 ${name} (#${productId})
💰 Giá: ${formatPrice(price)}
📝 Mô tả: ${desc || 'Chưa có'}

📊 KHO: ✅0 còn │ 🔴0 đã bán`;

  bot.sendMessage(chatId, text, {
    reply_markup: { inline_keyboard: buildAdminProductDetailKeyboard(productId) }
  });
}

async function handleEditProduct(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const product = Product.getById(state.productId);
  if (!product) {
    adminState.delete(userId);
    return bot.sendMessage(chatId, '✖️ Sản phẩm không tồn tại!');
  }

  let newName = product.name;
  let newPrice = product.price;
  let newDesc = product.description;

  if (state.field === 'name') {
    newName = msg.text.trim();
  } else if (state.field === 'price') {
    const priceNum = parseFloat(msg.text.trim());
    if (isNaN(priceNum) || priceNum < 0) {
      return bot.sendMessage(chatId, '✖️ Giá không hợp lệ! Nhập số.', {
        reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: `adm_product_${state.productId}` }]] }
      });
    }
    newPrice = priceNum;
  } else if (state.field === 'desc') {
    newDesc = msg.text.trim();
  }

  Product.update(state.productId, newName, newPrice, newDesc);
  adminState.delete(userId);

  const updatedProduct = Product.getById(state.productId);
  const stocks = Product.getStockByProduct(state.productId);
  const available = stocks.filter(s => !s.is_sold).length;
  const sold = stocks.length - available;

  const text = `🎯 Đã cập nhật!

📦 ${updatedProduct.name}

◉ ID: #${updatedProduct.id}
◉ Giá: ${formatPrice(updatedProduct.price)}
◉ Mô tả: ${updatedProduct.description || 'Chưa có'}

📊 Kho hàng:
◉ Còn: ${available}
◉ Đã bán: ${sold}`;

  bot.sendMessage(chatId, text, {
    reply_markup: { inline_keyboard: buildAdminProductDetailKeyboard(state.productId) }
  });
}

async function handleAddStock(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const accounts = msg.text.split('\n').filter(a => a.trim());
  const added = Product.addStock(state.productId, accounts);

  adminState.delete(userId);

  bot.sendMessage(chatId, `🎯 Đã thêm ${added} tài khoản!\n\nGõ /products để quản lý.`);
}

async function handleBroadcast(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  adminState.delete(userId);

  const { sendBroadcast } = require('./admin');
  await sendBroadcast(bot, chatId, msg.text);
}

async function handleSetCreditsPrice(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const price = parseFloat(msg.text.trim());

  if (isNaN(price) || price < 0) {
    return bot.sendMessage(chatId, '✖️ Giá không hợp lệ! Nhập số >= 0', {
      reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: `adm_edit_credits_${state.productId}` }]] }
    });
  }

  Product.updateCreditsSettings(state.productId, price, true);
  adminState.delete(userId);

  const product = Product.getById(state.productId);
  bot.sendMessage(chatId, `✅ Đã đặt giá xu = ${price} cho ${product.name}`);
}

async function handleAddEvent(bot, msg, state, adminState) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const type = state.eventType;

  try {
    const parts = msg.text.split('|').map(s => s.trim());
    let eventData = {};

    if (type === 'promo') {
      // CODE|Name|Amount|MaxPerUser
      if (parts.length < 3) throw new Error('Thiếu thông tin');
      eventData = {
        code: parts[0].toUpperCase(),
        name: parts[1],
        type: 'promo',
        reward_amount: parseFloat(parts[2]),
        max_per_user: parseInt(parts[3]) || 1
      };
    } else if (type === 'welcome') {
      // Name|Amount
      if (parts.length < 2) throw new Error('Thiếu thông tin');
      eventData = {
        name: parts[0],
        type: 'welcome',
        reward_amount: parseFloat(parts[1]),
        max_per_user: 1
      };
    } else if (type === 'deposit') {
      // Name|Amount|MinDeposit|Type(fixed/percent)
      if (parts.length < 3) throw new Error('Thiếu thông tin');
      eventData = {
        name: parts[0],
        type: 'deposit',
        reward_amount: parseFloat(parts[1]),
        min_amount: parseFloat(parts[2]),
        reward_type: parts[3] === 'percent' ? 'percent' : 'fixed',
        max_per_user: 999
      };
    }

    const eventId = Events.createEvent(eventData);
    adminState.delete(userId);

    let text = `✅ ĐÃ TẠO SỰ KIỆN #${eventId}
━━━━━━━━━━━━━━━━━━━━━

📋 ${eventData.name}
🎯 +${eventData.reward_amount} ${eventData.reward_type === 'percent' ? '%' : 'xu'}`;

    if (eventData.code) text += `\n🔑 Code: ${eventData.code}`;
    if (eventData.min_amount) text += `\n💰 Tối thiểu: ${eventData.min_amount}`;

    bot.sendMessage(chatId, text);
  } catch (e) {
    bot.sendMessage(chatId, '❌ Lỗi: ' + e.message + '\n\nVui lòng nhập lại theo đúng format.', {
      reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: 'adm_event_list' }]] }
    });
  }
}

module.exports = { register };
