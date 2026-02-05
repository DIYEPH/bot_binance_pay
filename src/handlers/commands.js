// User command handlers (refactored)
const config = require('../config');
const User = require('../database/models/user');
const Product = require('../database/models/product');
const Order = require('../database/models/order');
const Wallet = require('../services/wallet');
const Referral = require('../services/referral');
const Events = require('../services/events');
const {
  formatPrice,
  formatCredits,
  getFullName,
  getAdminUsername,
  formatNumber,
} = require('../utils/helpers');
const { buildShopKeyboard } = require('../utils/keyboard');
const i18n = require('../locales');

// ---------- Small helpers ----------
function initUserLang(userId, user) {
  if (user?.language) i18n.setUserLang(userId, user.language);
  return i18n.getTranslator(userId);
}

function backToMainKeyboard(t) {
  return { inline_keyboard: [[{ text: t('back'), callback_data: 'back_main' }]] };
}

function safeSend(bot, chatId, text, extra = {}) {
  return bot.sendMessage(chatId, text, extra);
}

// ---------- Handlers ----------
function handleStart(bot) {
  return (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const startParam = match?.[1];

    const existingUser = User.getById(userId);
    const isNewUser = !existingUser;

    const user = User.getOrCreate(userId, getFullName(msg.from), msg.from.username || '');
    const t = initUserLang(userId, user);

    if (isNewUser) {
      sendWelcomeBonus(bot, chatId, userId);
    }

    if (startParam?.startsWith('ref_')) {
      processReferral(bot, chatId, userId, startParam, t);
    }

    showMainMenu(bot, chatId, msg.from);
  };
}

function sendWelcomeBonus(bot, chatId, userId) {
  const bonuses = Events.processAutoEvents(userId, 'welcome', 0, `welcome:${userId}`);
  if (!bonuses?.length) return;

  const lines = bonuses.map(b => `• ${b.eventName}: +${b.amount} credits`).join('\n');
  const text = `🎁 WELCOME BONUS!\n${lines}`;
  safeSend(bot, chatId, text);
}

function processReferral(bot, chatId, userId, startParam, t) {
  const refCode = startParam.replace('ref_', '');
  const result = Referral.processReferral(userId, refCode);

  if (result?.success) {
    safeSend(
      bot,
      chatId,
      t('referral_success', { name: result.referrer.first_name, amount: result.bonus })
    );
  }
}

function handleLang(bot) {
  return (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);

    const keyboard = i18n.buildLanguageKeyboard(userId);
    keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);

    safeSend(bot, msg.chat.id, t('language_title'), {
      reply_markup: { inline_keyboard: keyboard },
    });
  };
}

function handleMenu(bot) {
  return (msg) => {
    const userId = msg.from.id;
    const user = User.getOrCreate(userId, getFullName(msg.from), msg.from.username || '');
    initUserLang(userId, user);
    showMainMenu(bot, msg.chat.id, msg.from);
  };
}

function handleMyId(bot) {
  return (msg) => {
    safeSend(bot, msg.chat.id, `🔖 User ID: \`${msg.from.id}\``, { parse_mode: 'Markdown' });
  };
}

function handleBalance(bot) {
  return (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const wallet = Wallet.getWallet(userId);

    if (!wallet) return safeSend(bot, msg.chat.id, `❌ ${t('error')}`);

    const text = [
      t('balance_title'),
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `💵 ${formatPrice(wallet.balance)}`,
      `🪙 ${formatCredits(wallet.credits)}`,
      '',
      `📊 ${t('stats_section')}`,
      t('balance_spent_label', { amount: formatPrice(wallet.balanceSpent) }),
      t('credits_spent_label', { amount: formatCredits(wallet.creditsSpent) }),
    ].join('\n');

    safeSend(bot, msg.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t('deposit_btn'), callback_data: 'deposit_menu' }],
          [{ text: t('credits_btn'), callback_data: 'credits_menu' }],
          [{ text: t('back'), callback_data: 'back_main' }],
        ],
      },
    });
  };
}

function handleReferral(bot) {
  return (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const info = Referral.getReferralInfo(userId);

    if (!info) return safeSend(bot, msg.chat.id, `❌ ${t('error')}`);

    const botUsername = bot.botInfo?.username || config.BOT_USERNAME || '';
    const refLink = `https://t.me/${botUsername}?start=ref_${info.referralCode}`;

    const text = [
      `🎁 ${t('referral_title')}`,
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      t('referral_code', { code: info.referralCode }),
      '',
      t('referral_link'),
      refLink,
      '',
      `📊 ${t('referral_stats')}`,
      t('total_referrals', { count: info.totalReferrals }),
      t('total_earned', { amount: formatPrice(info.totalEarned) }),
      '',
      `🎯 ${t('referral_rewards')}`,
      t('referrer_bonus', { amount: info.config.referrer_bonus }),
      t('referee_bonus', { amount: info.config.referee_bonus }),
      t('min_deposit_bonus', { amount: formatPrice(info.config.min_deposit_for_bonus) }),
    ].join('\n');

    safeSend(bot, msg.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t('copy_link_btn'), callback_data: 'copy_referral' }],
          [{ text: t('my_referrals_btn'), callback_data: 'my_referrals' }],
          [{ text: t('back'), callback_data: 'back_main' }],
        ],
      },
    });
  };
}

function handleHistory(bot) {
  return (msg) => {
    const userId = msg.from.id;
    const t = i18n.getTranslator(userId);
    const orders = Order.getByUser(userId, 10);

    if (!orders?.length) {
      return safeSend(bot, msg.chat.id, t('no_history'), {
        reply_markup: backToMainKeyboard(t),
      });
    }

    const lines = orders.map((o) => {
      const statusIcon = t(`order_status.${o.status}`) || '❓';
      const amountText =
        o.payment_method === 'credits'
          ? `🪙 ${formatNumber(o.total_price)} credits`
          : `💵 ${formatPrice(o.total_price)}`;

      return [
        `${statusIcon} #${o.id}`,
        `   🎁 ${o.product_name} x${o.quantity}`,
        `   ${amountText}`,
      ].join('\n');
    });

    const text = [`📋 ${t('history_title')}`, '━━━━━━━━━━━━━━━━━━━━━', '', ...lines].join('\n\n');

    safeSend(bot, msg.chat.id, text, {
      reply_markup: backToMainKeyboard(t),
    });
  };
}

// ---------- Public APIs ----------
function register(bot) {
  bot.onText(/\/start(?:\s+(.*))?/, handleStart(bot));
  bot.onText(/\/lang/, handleLang(bot));
  bot.onText(/\/menu/, handleMenu(bot));
  bot.onText(/\/myid/, handleMyId(bot));
  bot.onText(/\/balance/, handleBalance(bot));
  bot.onText(/\/referral/, handleReferral(bot));
  bot.onText(/\/history/, handleHistory(bot));
}

function showMainMenu(bot, chatId, user) {
  const t = i18n.getTranslator(user.id);
  const products = Product.getAll();
  const adminUser = getAdminUsername();

  const keyboard = buildShopKeyboard(products, true, adminUser, t);

  const text = [
    t('shop_name', { name: config.SHOP_NAME }),
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    t('welcome', { name: getFullName(user) }),
    '',
    products.length > 0 ? t('select_product') : t('no_products'),
  ].join('\n');

  safeSend(bot, chatId, text, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

module.exports = { register, showMainMenu };
