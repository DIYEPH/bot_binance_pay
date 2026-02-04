// Main Bot Entry Point
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const db = require('./database/index');
const Payment = require('./services/payment');
const i18n = require('./locales');
const commandHandlers = require('./handlers/commands');
const callbackHandlers = require('./handlers/callbacks');
const adminHandlers = require('./handlers/admin');
const messageHandlers = require('./handlers/messages');

const PAYMENT_CHECK_INTERVAL = 30000;

async function startBot() {
  console.log('🚀 Starting bot...');
  await db.initDB();

  Payment.loadPendingDeposits();

  const User = require('./database/models/user');
  const users = User.getAll(10000);
  i18n.loadUserLangs(users);
  console.log(`🌐 Loaded languages for ${users.length} users`);

  const bot = new TelegramBot(config.BOT_TOKEN, { polling: { params: { timeout: 10 }, interval: 300 } });

  try {
    bot.botInfo = await bot.getMe();
    console.log(`🤖 Bot: @${bot.botInfo.username}`);
  } catch (err) {
    console.error('Failed to get bot info:', err.message);
  }

  bot.setMyCommands([
    { command: 'start', description: 'Start / 开始 / Bắt đầu' },
    { command: 'menu', description: 'Shop / 商店 / Mua hàng' },
    { command: 'balance', description: 'Balance / 余额 / Số dư' },
    { command: 'referral', description: 'Referral / 邀请 / Giới thiệu' },
    { command: 'history', description: 'History / 历史 / Lịch sử' },
    { command: 'lang', description: 'Language / 语言 / Ngôn ngữ' }
  ]);

  commandHandlers.register(bot);
  callbackHandlers.register(bot);
  adminHandlers.registerCommands(bot);
  adminHandlers.registerCallbacks(bot);
  messageHandlers.register(bot);

  bot.on('polling_error', (err) => console.error('Polling error:', err.message));

  startPaymentChecker(bot);
  console.log(`🏪 ${config.SHOP_NAME} is running!`);
}

function startPaymentChecker(bot) {
  setInterval(async () => {
    try {
      await Payment.checkPendingDeposits((userId, amount, method, chatId, depositBonuses) => {
        let msg = `✅ Deposit successful!\n\n💰 Added ${amount} ${method === 'binance' ? 'USDT' : 'VND'} to your account!`;
        if (depositBonuses?.length > 0) {
          msg += `\n\n🎁 BONUS:`;
          depositBonuses.forEach(b => msg += `\n• ${b.eventName}: +${b.amount} credits`);
        }
        bot.sendMessage(chatId, msg).catch(() => { });
        config.ADMIN_IDS.forEach(id => {
          bot.sendMessage(id, `💰 NEW DEPOSIT\n👤 User: ${userId}\n💵 ${amount} ${method === 'binance' ? 'USDT' : 'VND'}\n📱 ${method}`).catch(() => { });
        });
      });
    } catch (err) {
      console.error('Deposit checker error:', err.message);
    }
  }, PAYMENT_CHECK_INTERVAL);
}

startBot().catch(err => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
