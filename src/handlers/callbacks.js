// Callback handlers
const config = require('../config');
const User = require('../database/models/user');
const Product = require('../database/models/product');
const Category = require('../database/models/category');
const Order = require('../database/models/order');
const Wallet = require('../services/wallet');
const Referral = require('../services/referral');
const Payment = require('../services/payment');
const Events = require('../services/events');
const { formatPrice, formatCredits, getFullName, getAdminUsername, formatNumber } = require('../utils/helpers');
const { buildShopKeyboard, buildCategoryKeyboard, buildProductKeyboard, buildDepositKeyboard, buildDepositAmountKeyboard } = require('../utils/keyboard');
const i18n = require('../locales');

const userState = new Map();

// Helper: edit message + answer callback
function editMsg(bot, query, text, keyboard, parseMode = null) {
  bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    parse_mode: parseMode,
    reply_markup: { inline_keyboard: keyboard }
  }).catch(err => {
    // Ignore "message is not modified" error
    if (!err.message.includes('message is not modified')) {
      console.error('Edit message error:', err.message);
    }
  });
  bot.answerCallbackQuery(query.id).catch(() => { });
}

function register(bot) {
  bot.on('callback_query', async (query) => {
    const data = query.data;
    try {
      // Navigation
      if (data === 'back_main' || data === 'main_shop') return await handleBackMain(bot, query);
      if (data.startsWith('category_')) return await handleCategoryView(bot, query);
      if (data === 'main_profile') return await handleProfile(bot, query);
      if (data === 'main_history') return await handleHistory(bot, query);

      // Categories / Products
      if (data.startsWith('product_')) return await handleProductView(bot, query);
      if (data.startsWith('qty_')) return await handleQuantitySelect(bot, query);
      if (data.startsWith('customqty_')) return await handleCustomQuantity(bot, query);

      // Deposit
      if (data === 'deposit_menu') return await handleDepositMenu(bot, query);
      if (data === 'deposit_binance' || data === 'deposit_bank') return await handleDepositMethod(bot, query);
      if (data.startsWith('deposit_amount_')) return await handleDepositAmount(bot, query);
      if (data.startsWith('deposit_custom_')) return await handleDepositCustom(bot, query);
      if (data.startsWith('deposit_check_')) return await handleDepositCheck(bot, query);
      if (data.startsWith('deposit_cancel_')) return await handleDepositCancel(bot, query);

      // Credits/Referral
      if (data === 'credits_menu') return await handleCreditsMenu(bot, query);
      if (data === 'my_referral') return await handleMyReferral(bot, query);
      if (data === 'my_referrals') return await handleMyReferrals(bot, query);
      if (data === 'enter_referral') return await handleEnterReferral(bot, query);
      if (data === 'enter_promo') return await handleEnterPromo(bot, query);

      // Payment
      if (data.startsWith('pay_')) return await handleWalletPayment(bot, query);

      // Language
      if (data === 'lang_menu') return await handleLanguageMenu(bot, query);
      if (data.startsWith('lang_')) return await handleLanguageSelect(bot, query);
    } catch (err) {
      console.error('Callback error:', err.message);
    }
    bot.answerCallbackQuery(query.id);
  });
}

async function handleBackMain(bot, query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const categories = await Category.getAll(false);
  const priceRanges = await Product.getCategoryPriceRanges(true);
  const keyboard = buildCategoryKeyboard(categories, t, getAdminUsername(), priceRanges);

  const text = `🛒 SHOP\n━━━━━━━━━━━━━━━━━━━━━\n\n${categories.length > 0 ? 'Chọn danh mục để xem sản phẩm' : t('no_products')}`;

  if (query.message.photo) {
    await bot.deleteMessage(chatId, query.message.message_id);
    bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: keyboard } });
  } else {
    bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: keyboard } }).catch(() => { });
  }
  bot.answerCallbackQuery(query.id).catch(() => { });
}

async function handleProfile(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const wallet = await Wallet.getWallet(userId);
  const completedOrders = await Order.getCompletedCount(userId);

  const text = `👤 ${t('profile_title')}\n━━━━━━━━━━━━━━━━━━━━━\n
${t('profile_id', { id: userId })}
${t('profile_name', { name: getFullName(query.from) })}
${t('profile_username', { username: query.from.username ? '@' + query.from.username : t('no_username') })}

💰 ${t('balance_section')}
${t('balance_label', { amount: formatPrice(wallet?.balance || 0) })}
${t('credits_label', { amount: formatCredits(wallet?.credits || 0) })}

📊 ${t('stats_section')}
${t('completed_orders', { count: completedOrders })}
${t('balance_spent_label', { amount: formatPrice(wallet?.balanceSpent || 0) })}
${t('credits_spent_label', { amount: formatCredits(wallet?.creditsSpent || 0) })}`;

  editMsg(bot, query, text, [
    [{ text: t('deposit_btn'), callback_data: 'deposit_menu' }],
    [{ text: t('credits_btn'), callback_data: 'credits_menu' }],
    [{ text: t('back'), callback_data: 'back_main' }]
  ]);
}

async function handleHistory(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const orders = await Order.getByUser(userId, 10);

  if (!orders.length) {
    bot.answerCallbackQuery(query.id, { text: t('no_history') });
    return;
  }

  let text = `📋 ${t('history_title')}\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  orders.forEach((o, idx) => {
    const amountText = o.payment_method === 'credits' ? `${formatNumber(o.total_price)} Coin credits` : `${formatPrice(o.total_price)}`;
    text += `${t(`order_status.${o.status}`) || '❓'} #${o.id}\n   🎁 ${o.product_name} x${o.quantity}\n   ${amountText}`;
    if (idx < orders.length - 1) text += '\n\n';
  });

  editMsg(bot, query, text, [[{ text: t('back'), callback_data: 'back_main' }]]);
}

async function handleProductView(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const productId = parseInt(query.data.split('_')[1]);
  const product = await Product.getById(productId);

  if (!product) return bot.answerCallbackQuery(query.id, { text: t('product_not_found') });

  const text = `🎁 ${product.name}\n━━━━━━━━━━━━━━━━━━━━━\n
${t('product_price', { price: formatPrice(product.price) })}
${t('product_stock', { count: product.stock_count })}
${product.description ? '📝 ' + t('description') + ': ' + product.description + '\n' : ''}
${t('select_quantity')}`;

  const backTarget = product.category_id ? `category_${product.category_id}` : 'back_main';
  editMsg(bot, query, text, buildProductKeyboard(product, t, backTarget));
}

async function handleCategoryView(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const categoryId = parseInt(query.data.split('_')[1]);

  const [activeProducts, inactiveProducts] = await Promise.all([
    Product.getByCategory(categoryId, true),
    Product.getByCategory(categoryId, false)
  ]);

  const toShow = activeProducts.length ? activeProducts : inactiveProducts;
  const showInactive = !activeProducts.length && inactiveProducts.length > 0;
  const keyboard = buildShopKeyboard(toShow, false, null, null, showInactive);
  keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);

  const category = await Category.getById(categoryId);
  const title = category ? category.name : 'Danh mục';
  const text = `📂 ${title}\n━━━━━━━━━━━━━━━━━━━━━\n\n${toShow.length > 0 ? t('select_product') : t('no_products')}${showInactive ? '\n🔴 Danh mục đang ẩn sản phẩm' : ''}`;

  editMsg(bot, query, text, keyboard);
}

async function handleQuantitySelect(bot, query) {
  const [, productId, quantity] = query.data.split('_');
  const product = await Product.getById(parseInt(productId));
  const qty = parseInt(quantity);
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);

  if (!product || product.stock_count < qty) {
    return bot.answerCallbackQuery(query.id, { text: t('not_enough_stock', { count: product?.stock_count || 0 }) });
  }

  const wallet = await Wallet.getWallet(userId);
  const balancePrice = product.price * qty;
  const creditsPrice = (product.credits_price || product.price) * qty;
  const canUseCredits = product.credits_enabled;
  const canPayBalance = (wallet?.balance || 0) >= balancePrice;
  const canPayCredits = canUseCredits && (wallet?.credits || 0) >= creditsPrice;

  let text = `${t('payment_title')}\n━━━━━━━━━━━━━━━━━━━━━\n
🎁 ${product.name} x${qty}

${t('your_balance')}
${t('balance_label', { amount: formatPrice(wallet?.balance || 0) })}
${t('credits_label', { amount: formatCredits(wallet?.credits || 0) })}

${t('select_payment')}`;

  const keyboard = [];
  if (canUseCredits) {
    keyboard.push([{
      text: canPayCredits ? `${t('pay_with_credits', { amount: formatCredits(creditsPrice) })}` : `🎁 Credits: ${formatCredits(creditsPrice)} (${t('not_enough')})`,
      callback_data: canPayCredits ? `pay_credits_${productId}_${qty}` : 'noop'
    }]);
  }
  keyboard.push([{
    text: canPayBalance ? `${t('pay_with_balance', { amount: formatPrice(balancePrice) })}` : `Balance: ${formatPrice(balancePrice)} (${t('not_enough')})`,
    callback_data: canPayBalance ? `pay_balance_${productId}_${qty}` : 'noop'
  }]);
  if (!canPayBalance && !canPayCredits) keyboard.push([{ text: `${t('deposit_btn')}`, callback_data: 'deposit_menu' }]);
  keyboard.push([{ text: t('back'), callback_data: `product_${productId}` }]);

  const backTarget = product.category_id ? `category_${product.category_id}` : 'back_main';
  editMsg(bot, query, text, [...keyboard, [{ text: t('back'), callback_data: backTarget }]]);
}

async function handleCustomQuantity(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const productId = parseInt(query.data.split('_')[1]);
  const product = await Product.getById(productId);

  if (!product) return bot.answerCallbackQuery(query.id, { text: t('product_not_found') });

  userState.set(userId, { action: 'custom_qty', productId, messageId: query.message.message_id });

  const text = `📝 ${t('enter_quantity').replace('✏️', '').trim()}\n━━━━━━━━━━━━━━━━━━━━━\n
📦 ${product.name}
${t('product_price', { price: formatPrice(product.price) })}
${t('product_stock', { count: product.stock_count })}

${t('enter_quantity')}`;

  editMsg(bot, query, text, [[{ text: t('cancel'), callback_data: `product_${productId}` }]]);
}

async function handleDepositMenu(bot, query) {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const t = i18n.getTranslator(userId);
  const wallet = await Wallet.getWallet(userId);

  const text = `💰 ${t('deposit_title')}\n━━━━━━━━━━━━━━━━━━━━━\n
${formatPrice(wallet?.balance || 0)}
${formatCredits(wallet?.credits || 0)}

${t('select_deposit_method')}`;
  if (query.message.photo) {
    await bot.deleteMessage(chatId, query.message.message_id);
    bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: buildDepositKeyboard(t) } });
    bot.answerCallbackQuery(query.id).catch(() => { });
  } else {
    editMsg(bot, query, text, buildDepositKeyboard(t));
  }
}

async function handleDepositMethod(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const method = query.data.replace('deposit_', '');

  if (method === 'bank' && !config.BANK_ENABLED) {
    return bot.answerCallbackQuery(query.id, { text: '🚫 Chức năng chuyển khoản tạm thời không khả dụng', show_alert: true });
  }

  const currency = method === 'binance' ? 'USDT' : 'VND';
  const methodName = method === 'binance' ? 'Binance Pay' : 'Bank Transfer';

  const text = `💰 ${t('deposit_amount_title', { method: methodName })}\n━━━━━━━━━━━━━━━━━━━━━\n
${t('deposit_currency', { currency })}

${t('select_amount')}`;

  editMsg(bot, query, text, buildDepositAmountKeyboard(method, t));
}

async function handleDepositAmount(bot, query) {
  const [, , method, amount] = query.data.split('_');
  const amountNum = parseFloat(amount);
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const t = i18n.getTranslator(userId);

  const deposit = await Payment.createDeposit(userId, amountNum, method, chatId);
  const info = deposit.instructions;
  const isBinance = method === 'binance';

  let text = `💰 ${t('deposit_title')} ${formatPrice(amountNum, isBinance ? 'USDT' : 'VND')}\n━━━━━━━━━━━━━━━━━━━\n\n`;

  if (isBinance) {
    text += `${t('binance_instructions')}\n${t('binance_step1')}\n${t('binance_step2')}\n${t('binance_step3')}\n`;
    text += `${t('binance_step4', { id: info.binanceId || 'N/A' })}\n${t('binance_step5', { amount: `${amountNum} ${info.currency}` })}\n`;
    text += `${t('binance_step6', { note: deposit.paymentCode })}\n${t('binance_step7')}\n`;
  } else {
    text += `${t('bank_info')}\n${t('bank_name', { name: info.bankInfo.bankName })}\n`;
    text += `${t('bank_account', { account: info.bankInfo.accountNumber })}\n${t('bank_owner', { owner: info.bankInfo.accountName })}\n`;
    text += `${t('payment_note', { code: deposit.paymentCode })}\n\n${t('scan_qr')}`;
  }
  text += `\n\n${t('expires_30_min', { minutes: config.DEPOSIT_EXPIRES_MINUTES })}\n${t('payment_warning')}`;

  const keyboard = [
    [{ text: t('check_payment'), callback_data: `deposit_check_${deposit.paymentCode}` }],
    [{ text: t('cancel'), callback_data: `deposit_cancel_${deposit.paymentCode}` }]
  ];

  if (isBinance) {
    await bot.deleteMessage(chatId, query.message.message_id);
    bot.sendPhoto(chatId, './public/bnc_qr.png', {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  } else {
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => { });
  }
  bot.answerCallbackQuery(query.id).catch(() => { });
}

async function handleDepositCustom(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const method = query.data.split('_')[2];

  userState.set(userId, { action: 'custom_deposit', method, messageId: query.message.message_id });

  const currency = method === 'binance' ? 'USDT' : 'VND';
  const text = `📝 ${t('enter_amount').replace('✏️', '').trim()}\n━━━━━━━━━━━━━━━━━━━━━\n
${t('deposit_currency', { currency })}

${t('enter_amount')}`;

  editMsg(bot, query, text, [[{ text: t('cancel'), callback_data: 'deposit_menu' }]]);
}

async function handleDepositCheck(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const paymentCode = query.data.split('_')[2];
  const result = await Payment.checkDeposit(paymentCode);

  if (!result) return bot.answerCallbackQuery(query.id, { text: t('deposit_not_found'), show_alert: true });

  if (result.confirmed) {
    let msg = `✅ ${t('deposit_success', { amount: formatPrice(result.amount) })}`;
    if (result.referralBonus) msg += `\n\n🎁 Referrer ${result.referralBonus.referrerName} +${result.referralBonus.bonus} credits!`;
    if (result.depositBonuses?.length) {
      msg += `\n\n🎁 BONUS:`;
      result.depositBonuses.forEach(b => msg += `\n• ${b.eventName}: +${b.amount} credits`);
    }

    bot.answerCallbackQuery(query.id, { text: '✅ Success!' });
    if (query.message.photo) await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    bot.sendMessage(query.message.chat.id, msg, { reply_markup: { inline_keyboard: [[{ text: '🛒 Shop', callback_data: 'back_main' }]] } });
    config.ADMIN_IDS.forEach(id => bot.sendMessage(id, `💰 DEPOSIT\n👤 ${result.user_id}\n${formatPrice(result.amount)}\n📱 ${result.payment_method}`));
  } else {
    bot.answerCallbackQuery(query.id, { text: t('payment_pending'), show_alert: true });
  }
}

async function handleDepositCancel(bot, query) {
  await Payment.cancelDeposit(query.data.split('_')[2]);
  await handleDepositMenu(bot, query);
}

async function handleCreditsMenu(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const info = await Referral.getReferralInfo(userId);
  const wallet = await Wallet.getWallet(userId);

  const text = `🎁 ${t('credits_title')}\n━━━━━━━━━━━━━━━━━━━━━\n
💰 ${t('credits_current', { amount: formatCredits(wallet?.credits || 0) })}

📊 ${t('how_to_earn')}
${t('earn_referral', { amount: info?.config?.referrer_bonus || 1, min: formatPrice(info?.config?.min_deposit_for_bonus || 5) })}
${t('earn_referee', { amount: info?.config?.referee_bonus || 0.5 })}
• Promo codes
${t('earn_events')}

🔗 ${t('referral_code', { code: info?.referralCode || 'N/A' })}
👥 ${t('total_referrals', { count: info?.totalReferrals || 0 })}
💰 ${t('total_earned', { amount: formatCredits(info?.totalEarned || 0) })}`;

  editMsg(bot, query, text, [
    [{ text: t('my_referral_btn'), callback_data: 'my_referral' }],
    [{ text: t('my_referrals_btn'), callback_data: 'my_referrals' }],
    [{ text: t('enter_referral_btn'), callback_data: 'enter_referral' }],
    [{ text: '🎟️ Promo Code', callback_data: 'enter_promo' }],
    [{ text: t('back'), callback_data: 'back_main' }]
  ]);
}

async function handleEnterPromo(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);

  userState.set(userId, { action: 'enter_promo', messageId: query.message.message_id });

  editMsg(bot, query, `🎟️ PROMO CODE\n━━━━━━━━━━━━━━━━━━━━━\n\n✏️ Enter code:`, [[{ text: t('cancel'), callback_data: 'credits_menu' }]]);
}

async function handleMyReferral(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const user = await User.getById(userId);
  const refLink = `https://t.me/${bot.botInfo?.username || ''}?start=ref_${user.referral_code}`;

  const text = `${t('my_referral_title')}\n━━━━━━━━━━━━━━━━━━━━━\n
${t('referral_code_label', { code: user.referral_code })}

${t('referral_link_label', { link: refLink })}

${t('share_referral')}`;

  editMsg(bot, query, text, [[{ text: t('back'), callback_data: 'credits_menu' }]]);
}

async function handleMyReferrals(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const referrals = await User.getReferrals(userId);

  let text = `${t('referrals_list_title')}\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (!referrals.length) {
    text += t('no_referrals');
  } else {
    text += `${t('referrals_total', { count: referrals.length })}\n\n`;
    referrals.slice(0, 10).forEach((r, i) => text += `${i + 1}. ${t('referral_spent', { name: r.first_name, amount: formatPrice(r.total_spent) })}\n`);
    if (referrals.length > 10) text += t('and_more', { count: referrals.length - 10 });
  }

  editMsg(bot, query, text, [[{ text: t('back'), callback_data: 'credits_menu' }]]);
}

async function handleEnterReferral(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const user = await User.getById(userId);

  if (user.referred_by) return bot.answerCallbackQuery(query.id, { text: t('already_has_referrer'), show_alert: true });

  userState.set(userId, { action: 'enter_referral', messageId: query.message.message_id });

  editMsg(bot, query, `${t('enter_referral_title')}\n━━━━━━━━━━━━━━━━━━━━━\n\n${t('enter_code_prompt')}`, [[{ text: t('cancel'), callback_data: 'credits_menu' }]]);
}

async function handleWalletPayment(bot, query) {
  const [, method, productId, qty] = query.data.split('_');
  const product = await Product.getById(parseInt(productId));
  const quantity = parseInt(qty);
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);

  if (!product) return bot.answerCallbackQuery(query.id, { text: t('product_not_found'), show_alert: true });

  const price = method === 'credits' ? (product.credits_price || product.price) : product.price;
  let totalPrice = price * quantity;

  if (method === 'credits' && !product.credits_enabled) {
    return bot.answerCallbackQuery(query.id, { text: t('not_enough'), show_alert: true });
  }

  const result = await Wallet.purchase(userId, totalPrice, method);
  if (!result.success) return bot.answerCallbackQuery(query.id, { text: result.message, show_alert: true });

  // Atomic reserve stock
  const stocks = await Product.reserveStock(product.id, quantity, userId);

  if (!stocks.length) {
    await Wallet.refund(userId, totalPrice, method);
    return bot.answerCallbackQuery(query.id, { text: t('not_enough_stock', { count: 0 }), show_alert: true });
  }

  // Partial order: refund excess
  if (stocks.length < quantity) {
    const actualPrice = price * stocks.length;
    await Wallet.refund(userId, totalPrice - actualPrice, method);
    totalPrice = actualPrice;
  }

  const order = await Order.create({
    userId, productId: product.id, quantity: stocks.length,
    unitPrice: price, totalPrice, paymentMethod: method, chatId: query.message.chat.id
  });
  await Order.updateStatus(order.id, 'completed');

  const bonuses = await Events.processAutoEvents(userId, 'purchase', totalPrice, `order:${order.id}`);
  const accText = stocks.map((s, i) => `  ${i + 1}. ${s.account_data}`).join('\n');

  const amountText = method === 'credits' ? `${formatNumber(totalPrice)} Coin` : formatPrice(totalPrice);
  let msg = `${t('payment_success')}\n━━━━━━━━━━━━━━━━━━━━━\n
🎁 ${product.name} x${stocks.length}
💰 ${amountText}

${t('accounts_title')}
${accText}`;

  if (bonuses.length) {
    msg += `\n\n🎁 BONUS:`;
    bonuses.forEach(b => msg += `\n• ${b.eventName}: +${b.amount} credits`);
  }
  msg += `\n\n${t('change_password')}\n${t('buy_more')}`;

  await bot.deleteMessage(query.message.chat.id, query.message.message_id);
  bot.sendMessage(query.message.chat.id, msg);
  bot.answerCallbackQuery(query.id, { text: '✅ Success!' });

  const currencyIcon = method === 'credits' ? 'Coin' : 'USDT';
  const currencyText = method === 'credits' ? 'credits' : 'USDT';
  config.ADMIN_IDS.forEach(id => bot.sendMessage(id, `🔔 #${order.id}\n👤 ${userId}\n🎁 ${product.name} x${stocks.length}\n${currencyIcon} ${formatPrice(totalPrice)} ${currencyText}`));
}

async function handleLanguageMenu(bot, query) {
  const userId = query.from.id;
  const t = i18n.getTranslator(userId);
  const keyboard = i18n.buildLanguageKeyboard(userId);
  keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);
  editMsg(bot, query, t('language_title'), keyboard);
}

async function handleLanguageSelect(bot, query) {
  const userId = query.from.id;
  const langCode = query.data.replace('lang_', '');
  if (langCode === 'menu') return;

  i18n.setUserLang(userId, langCode);
  await User.setLanguage(userId, langCode);
  const t = i18n.getTranslator(userId);

  bot.answerCallbackQuery(query.id, { text: t('language_changed') });

  const keyboard = i18n.buildLanguageKeyboard(userId);
  keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);
  bot.editMessageText(t('language_title'), {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  }).catch(() => { });
}

module.exports = { register, userState };
