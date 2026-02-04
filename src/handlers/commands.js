// User command handlers
const config = require('../config');
const User = require('../database/models/user');
const Product = require('../database/models/product');
const Order = require('../database/models/order');
const Wallet = require('../services/wallet');
const Referral = require('../services/referral');
const Events = require('../services/events');
const { formatPrice, formatCredits, getFullName, getAdminUsername, formatNumber } = require('../utils/helpers');
const { buildShopKeyboard } = require('../utils/keyboard');
const i18n = require('../locales');

function register(bot) {
  bot.onText(/\/start(?:\s+(.*))?/, (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const startParam = match[1];

    // Check if new user
    const existingUser = User.getById(userId);
    const isNewUser = !existingUser;

    // Get or create user
    const user = User.getOrCreate(userId, getFullName(msg.from), msg.from.username || '');

    // Load user language
    if (user.language) {
      i18n.setUserLang(userId, user.language);
    }

    // Process welcome bonus for new users
    if (isNewUser) {
      const welcomeBonuses = Events.processAutoEvents(userId, 'welcome', 0, `welcome:${userId}`);
      if (welcomeBonuses.length > 0) {
        let bonusMsg = '🎁 WELCOME BONUS!\n';
        welcomeBonuses.forEach(b => {
          bonusMsg += `• ${b.eventName}: +${b.amount} credits\n`;
        });
        bot.sendMessage(chatId, bonusMsg);
      }
    }

    // Process referral if present
    if (startParam && startParam.startsWith('ref_')) {
      const refCode = startParam.replace('ref_', '');
      const result = Referral.processReferral(userId, refCode);
      if (result.success) {
        const t = i18n.getTranslator(userId);
        bot.sendMessage(chatId, t('referral_success', { name: result.referrer.first_name, amount: result.bonus }));
      }
    }

    showMainMenu(bot, chatId, msg.from);
  });

  bot.onText(/\/lang/, (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const keyboard = i18n.buildLanguageKeyboard(userId);
    keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);

    bot.sendMessage(msg.chat.id, t('language_title'), {
      reply_markup: { inline_keyboard: keyboard }
    });
  });

  bot.onText(/\/menu/, (msg) => {
    const userId = msg.from.id;
    const user = User.getOrCreate(userId, getFullName(msg.from), msg.from.username || '');
    if (user.language) i18n.setUserLang(userId, user.language);
    showMainMenu(bot, msg.chat.id, msg.from);
  });

  bot.onText(/\/myid/, (msg) => {
    bot.sendMessage(msg.chat.id, `🔖 User ID: \`${msg.from.id}\``, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/balance/, (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const wallet = Wallet.getWallet(userId);

    if (!wallet) {
      return bot.sendMessage(msg.chat.id, `❌ ${t('error')}`);
    }

    const text = `${t('balance_title')}
━━━━━━━━━━━━━━━━━━━━━

💵 ${formatPrice(wallet.balance)}
🪙 ${formatCredits(wallet.credits)}

📊 ${t('stats_section')}
${t('balance_spent_label', { amount: formatPrice(wallet.balanceSpent) })}
${t('credits_spent_label', { amount: formatCredits(wallet.creditsSpent) })}`;

    bot.sendMessage(msg.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t('deposit_btn'), callback_data: 'deposit_menu' }],
          [{ text: t('credits_btn'), callback_data: 'credits_menu' }],
          [{ text: t('back'), callback_data: 'back_main' }]
        ]
      }
    });
  });

  bot.onText(/\/referral/, (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const info = Referral.getReferralInfo(userId);

    if (!info) {
      return bot.sendMessage(msg.chat.id, `❌ ${t('error')}`);
    }

    const botUsername = bot.botInfo?.username || config.BOT_USERNAME || '';
    const refLink = `https://t.me/${botUsername}?start=ref_${info.referralCode}`;

    const text = `🎁 ${t('referral_title')}
━━━━━━━━━━━━━━━━━━━━━

${t('referral_code', { code: info.referralCode })}

${t('referral_link')}
${refLink}

📊 ${t('referral_stats')}
${t('total_referrals', { count: info.totalReferrals })}
${t('total_earned', { amount: formatPrice(info.totalEarned) })}

🎯 ${t('referral_rewards')}
${t('referrer_bonus', { amount: info.config.referrer_bonus })}
${t('referee_bonus', { amount: info.config.referee_bonus })}
${t('min_deposit_bonus', { amount: formatPrice(info.config.min_deposit_for_bonus) })}`;

    bot.sendMessage(msg.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t('copy_link_btn'), callback_data: 'copy_referral' }],
          [{ text: t('my_referrals_btn'), callback_data: 'my_referrals' }],
          [{ text: t('back'), callback_data: 'back_main' }]
        ]
      }
    });
  });

  bot.onText(/\/history/, (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const orders = Order.getByUser(userId, 10);

    if (orders.length === 0) {
      return bot.sendMessage(msg.chat.id, t('no_history'), {
        reply_markup: { inline_keyboard: [[{ text: t('back'), callback_data: 'back_main' }]] }
      });
    }

    let text = `📋 ${t('history_title')}
━━━━━━━━━━━━━━━━━━━━━\n\n`;

    orders.forEach((o, idx) => {
      const statusIcon = t(`order_status.${o.status}`) || '❓';
      const amountText = o.payment_method === 'credits' ? `🪙 ${formatNumber(o.total_price)} credits` : `💵 ${formatPrice(o.total_price)}`;
      text += `${statusIcon} #${o.id}\n`;
      text += `   🎁 ${o.product_name} x${o.quantity}\n`;
      text += `   ${amountText}\n`;
      if (idx < orders.length - 1) text += '\n';
    });

    bot.sendMessage(msg.chat.id, text, {
      reply_markup: { inline_keyboard: [[{ text: t('back'), callback_data: 'back_main' }]] }
    });
  });
}

function showMainMenu(bot, chatId, user) {
  const t = i18n.getTranslator(user.id);
  const products = Product.getAll();
  const adminUser = getAdminUsername();

  const keyboard = buildShopKeyboard(products, true, adminUser, t);

  const text = `${t('shop_name', { name: config.SHOP_NAME })}
━━━━━━━━━━━━━━━━━━━━━

${t('welcome', { name: getFullName(user) })}

${products.length > 0 ? t('select_product') : t('no_products')}`;

  bot.sendMessage(chatId, text, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

module.exports = { register, showMainMenu };
