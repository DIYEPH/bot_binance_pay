// Admin handlers (fixed + cleaned, keep original language)
const config = require('../config');
const User = require('../database/models/user');
const Product = require('../database/models/product');
const Order = require('../database/models/order');
const Wallet = require('../services/wallet');
const Events = require('../services/events');
const i18n = require('../locales');
const { formatPrice, isAdmin, formatDateShort, formatNumber } = require('../utils/helpers');
const { buildAdminProductsKeyboard } = require('../utils/keyboard');

const adminState = new Map();

function registerCommands(bot) {
  config.ADMIN_IDS.forEach(adminId => {
    bot.setMyCommands([
      { command: 'products', description: '⚙️ Quản lý sản phẩm' },
      { command: 'events', description: '🎁 Quản lý sự kiện' },
      { command: 'orders', description: '📦 Đơn hàng' },
      { command: 'revenue', description: '📈 Doanh thu' },
      { command: 'stats', description: '📊 Tồn kho' },
      { command: 'users', description: '👥 Users' },
      { command: 'broadcast', description: '📣 Thông báo' },
      { command: 'addbalance', description: '💰 Cộng tiền user' },
      { command: 'addcredits', description: '🎁 Cộng xu user' },
      { command: 'clear', description: '🧹 Xóa 50 tin nhắn gần nhất' }
    ], { scope: { type: 'chat', chat_id: adminId } });
  });

  // /events - Event management
  bot.onText(/\/events/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const events = Events.getAllEvents();
    let text = `🎁 QUẢN LÝ SỰ KIỆN
━━━━━━━━━━━━━━━━━━━━━

📊 Tổng: ${events.length} sự kiện\n\n`;

    if (events.length === 0) {
      text += '⛄ Chưa có sự kiện nào!';
    } else {
      events.slice(0, 10).forEach((e) => {
        const status = e.is_active ? '✅' : '🔴';
        const stats = Events.getEventStats(e.id);
        text += `${status} #${e.id} ${e.name}\n`;
        text += `   📋 ${e.type} │ 🎯 ${e.reward_amount} ${e.reward_type === 'percent' ? '%' : 'xu'}\n`;
        text += `   👥 ${stats.claims} claims │ 💰 ${stats.total_amount} xu\n`;
        if (e.code) text += `   🔑 Code: ${e.code}\n`;
        text += '\n';
      });
    }

    const keyboard = [
      [{ text: '➕ Thêm Promo Code', callback_data: 'adm_event_add_promo' }],
      [{ text: '➕ Thêm Welcome Bonus', callback_data: 'adm_event_add_welcome' }],
      [{ text: '➕ Thêm Deposit Bonus', callback_data: 'adm_event_add_deposit' }]
    ];

    if (events.length > 0) {
      keyboard.push([{ text: '📋 Danh sách sự kiện', callback_data: 'adm_event_list' }]);
    }

    bot.sendMessage(msg.chat.id, text, { reply_markup: { inline_keyboard: keyboard } });
  });

  // /addevent <type> <amount> [code] [name]
  // Ví dụ: /addevent promo 5 NEWUSER Chào mừng
  bot.onText(/\/addevent (\w+) ([\d.]+)(?: (\w+))?(?: (.+))?/, (msg, match) => {
    if (!isAdmin(msg.from.id)) return;

    const type = (match[1] || '').toLowerCase();
    const amount = parseFloat(match[2]);
    const code = match[3] || null;
    const name = match[4] || `${type} bonus ${amount}`;
    const t = i18n.getTranslator(msg.from.id);

    if (!['promo', 'welcome', 'deposit', 'purchase'].includes(type)) {
      return bot.sendMessage(msg.chat.id, t('admin_event_type_error'));
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return bot.sendMessage(msg.chat.id, '❌ Số xu không hợp lệ! (phải > 0)');
    }
    if (type === 'promo' && !code) {
      return bot.sendMessage(msg.chat.id, '❌ Promo bắt buộc phải có CODE!');
    }

    try {
      const eventId = Events.createEvent({
        code,
        name,
        type,
        reward_amount: amount,
        reward_type: 'fixed',
        max_per_user: type === 'welcome' ? 1 : 999
      });

      const codeText = code ? `🔑 Code: ${code}` : '';
      bot.sendMessage(msg.chat.id, t('admin_event_created', { id: eventId, name, amount, code: codeText }));
    } catch (e) {
      bot.sendMessage(msg.chat.id, t('admin_event_error', { error: e.message }));
    }
  });

  bot.onText(/\/products/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const products = Product.getAll(false); // Include inactive
    const keyboard = buildAdminProductsKeyboard(products);

    const text = `⚙️ QUẢN LÝ SẢN PHẨM
━━━━━━━━━━━━━━━━━━━━━

📊 Tổng: ${products.length} sản phẩm
⛄ Chọn để sửa/xóa:`;

    bot.sendMessage(msg.chat.id, text, { reply_markup: { inline_keyboard: keyboard } });
  });

  bot.onText(/\/orders/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const orders = Order.getRecent(20);
    const t = i18n.getTranslator(msg.from.id);

    if (!orders.length) {
      return bot.sendMessage(msg.chat.id, t('admin_no_orders'));
    }

    let text = `📦 ĐƠN HÀNG GẦN ĐÂY
━━━━━━━━━━━━━━━━━━━━━\n\n`;

    orders.forEach((o, idx) => {
      const icon = { completed: '✅', pending: '⏳', expired: '⌛', cancelled: '❌' }[o.status] || '❓';
      const time = o.created_at ? formatDateShort(o.created_at) : 'N/A';
      const amountText = o.payment_method === 'credits'
        ? `🪙 ${formatNumber(o.total_price)} credits`
        : `💵 ${formatPrice(o.total_price)}`;

      text += `${icon} #${o.id} │ ${o.user_name}\n`;
      text += `   🎁 ${o.product_name} x${o.quantity}\n`;
      text += `   ${amountText} │ 🕐 ${time}\n`;
      if (idx < orders.length - 1) text += '\n';
    });

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/\/revenue/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const stats = Order.getRevenue();
    const products = Product.getAll();
    const stockStats = Product.getStockStats();
    const userCount = User.count();

    const text = `💰 DOANH THU
━━━━━━━━━━━━━━━━━━━━━

💵 Tổng thu: ${formatPrice(stats.total_revenue)}
✅ Đơn hoàn thành: ${stats.total_orders}

💳 PHÂN TÍCH
• Từ Balance: ${formatPrice(stats.balance_revenue)}
• Xu đã dùng: ${formatNumber(stats.credits_used)} 🪙

📊 TỔNG QUAN
📦 Sản phẩm: ${products.length}
🎯 Tồn kho: ${stockStats.available}
📤 Đã bán: ${stockStats.sold}
👥 Users: ${userCount}`;

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/\/stats/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const products = Product.getAll(false);

    let text = `📊 TỒN KHO
━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (products.length === 0) {
      text += '⛄ Chưa có sản phẩm nào!';
    } else {
      let total = 0;
      products.forEach(p => {
        const status = p.stock_count > 0 ? '✅' : '🔴';
        const active = p.is_active ? '' : ' (ẩn)';
        text += `${status} ${p.name}${active}: ${p.stock_count}\n`;
        total += p.stock_count;
      });
      text += `\n📦 Tổng: ${total}`;
    }

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/\/users/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const users = User.getAll(50);

    let text = `👥 DANH SÁCH USER
━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (users.length === 0) {
      text += '⛄ Chưa có user nào!';
    } else {
      text += `📊 Tổng: ${User.count()} users\n\n`;
      users.forEach((u, i) => {
        text += `${i + 1}. ${u.first_name} │ ${u.id}\n`;
        text += `   💵 ${formatPrice(u.balance)} │ 🎁 ${formatNumber(u.credits)} 🪙\n`;
      });
    }

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/^\/broadcast$/, (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const users = User.getAll(1000);
    adminState.set(msg.from.id, { action: 'broadcast' });

    const text = `📣 GỬI THÔNG BÁO
━━━━━━━━━━━━━━━━━━━━━

👥 Sẽ gửi đến: ${users.length} users

✏️ Nhập nội dung thông báo:`;

    bot.sendMessage(msg.chat.id, text, {
      reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: 'adm_cancel_broadcast' }]] }
    });
  });

  bot.onText(/\/broadcast (.+)/s, async (msg, match) => {
    if (!isAdmin(msg.from.id)) return;
    await sendBroadcast(bot, msg.chat.id, match[1]);
  });

  bot.onText(/\/addbalance (\d+) ([\d.]+)/, (msg, match) => {
    if (!isAdmin(msg.from.id)) return;

    const userId = parseInt(match[1], 10);
    const amount = parseFloat(match[2]);
    const adminT = i18n.getTranslator(msg.from.id);
    const user = User.getById(userId);

    if (!user) {
      return bot.sendMessage(msg.chat.id, adminT('admin_user_not_found'));
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return bot.sendMessage(msg.chat.id, '❌ Số tiền không hợp lệ! (phải > 0)');
    }

    Wallet.adminAddBalance(userId, amount, msg.from.id);
    const userT = i18n.getTranslator(userId);

    bot.sendMessage(msg.chat.id, adminT('admin_balance_added', { amount: formatPrice(amount), name: user.first_name, id: userId }));
    bot.sendMessage(userId, userT('admin_balance_added_notify', { amount: formatPrice(amount) })).catch(() => { });
  });

  bot.onText(/\/addcredits (\d+) ([\d.]+)/, (msg, match) => {
    if (!isAdmin(msg.from.id)) return;

    const userId = parseInt(match[1], 10);
    const amount = parseFloat(match[2]);
    const adminT = i18n.getTranslator(msg.from.id);
    const user = User.getById(userId);

    if (!user) {
      return bot.sendMessage(msg.chat.id, adminT('admin_user_not_found'));
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return bot.sendMessage(msg.chat.id, '❌ Số xu không hợp lệ! (phải > 0)');
    }

    Wallet.adminAddCredits(userId, amount, msg.from.id);
    const userT = i18n.getTranslator(userId);

    bot.sendMessage(msg.chat.id, adminT('admin_credits_added', { amount: `${formatNumber(amount)} 🪙`, name: user.first_name, id: userId }));
    bot.sendMessage(userId, userT('admin_credits_added_notify', { amount: `${formatNumber(amount)} 🪙` })).catch(() => { });
  });

  bot.onText(/\/clear/, async (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const chatId = msg.chat.id;
    const t = i18n.getTranslator(msg.from.id);
    let deleted = 0;

    const statusMsg = await bot.sendMessage(chatId, t('admin_clearing_messages'));

    for (let i = msg.message_id; i > msg.message_id - 50; i--) {
      try {
        await bot.deleteMessage(chatId, i);
        deleted++;
      } catch (e) { }
    }

    try { await bot.deleteMessage(chatId, statusMsg.message_id); } catch (e) { }

    const resultMsg = await bot.sendMessage(chatId, t('admin_messages_cleared', { count: deleted }));
    setTimeout(() => {
      try { bot.deleteMessage(chatId, resultMsg.message_id); } catch (e) { }
    }, 3000);
  });
}

function registerCallbacks(bot) {
  bot.on('callback_query', async (query) => {
    if (!query?.data?.startsWith('adm_')) return;
    if (!isAdmin(query.from.id)) return;

    const data = query.data;

    try {
      if (data.startsWith('adm_product_')) return await handleProductDetail(bot, query);
      if (data === 'adm_back_list') return await handleBackToList(bot, query);
      if (data === 'adm_add_product') return await handleAddProduct(bot, query);
      if (data.startsWith('adm_edit_')) return await handleEditProduct(bot, query);
      if (data.startsWith('adm_addstock_')) return await handleAddStock(bot, query);
      if (data.startsWith('adm_viewstock_')) return await handleViewStock(bot, query);
      if (data.startsWith('adm_delstock_')) return await handleDeleteStock(bot, query);
      if (data.startsWith('adm_clearstock_')) return await handleClearStock(bot, query);
      if (data.startsWith('adm_confirmclear_')) return await handleConfirmClear(bot, query);
      if (data.startsWith('adm_delete_')) return await handleDeleteProduct(bot, query);
      if (data.startsWith('adm_confirm_delete_')) return await handleConfirmDelete(bot, query);

      if (data === 'adm_cancel_broadcast') {
        adminState.delete(query.from.id);
        await bot.editMessageText('❌ Đã hủy gửi thông báo.', {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        });
        return bot.answerCallbackQuery(query.id);
      }

      if (data.startsWith('adm_credits_toggle_')) {
        const productId = parseInt(data.split('_')[3], 10);
        const product = Product.getById(productId);
        if (!product) return bot.answerCallbackQuery(query.id, { text: '❄️ Không tồn tại!' });

        Product.updateCreditsSettings(
          productId,
          product.credits_price || product.price,
          !product.credits_enabled
        );

        bot.answerCallbackQuery(query.id, { text: product.credits_enabled ? '🔴 Đã tắt mua bằng xu' : '✅ Đã bật mua bằng xu' });
        query.data = `adm_edit_credits_${productId}`;
        return await handleEditProduct(bot, query);
      }

      if (data.startsWith('adm_credits_same_')) {
        const productId = parseInt(data.split('_')[3], 10);
        const product = Product.getById(productId);
        if (!product) return bot.answerCallbackQuery(query.id, { text: '❄️ Không tồn tại!' });

        Product.updateCreditsSettings(productId, product.price, true);
        bot.answerCallbackQuery(query.id, { text: '✅ Đã đặt giá xu = giá thật' });
        query.data = `adm_edit_credits_${productId}`;
        return await handleEditProduct(bot, query);
      }

      if (data.startsWith('adm_credits_setprice_')) {
        const productId = parseInt(data.split('_')[3], 10);
        adminState.set(query.from.id, { action: 'set_credits_price', productId, messageId: query.message.message_id });

        await bot.editMessageText('💰 Nhập giá xu mới cho sản phẩm:', {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: `adm_edit_credits_${productId}` }]] }
        });

        return bot.answerCallbackQuery(query.id);
      }

      if (data === 'adm_event_list') return await handleEventList(bot, query);
      if (data.startsWith('adm_event_add_')) return await handleEventAdd(bot, query);
      if (data.startsWith('adm_event_view_')) return await handleEventView(bot, query);
      if (data.startsWith('adm_event_toggle_')) return await handleEventToggle(bot, query);
      if (data.startsWith('adm_event_delete_')) return await handleEventDelete(bot, query);

      // ✅ FIX: callback "adm_back_events" bị thiếu handler
      if (data === 'adm_back_events') {
        // quay về /events dashboard
        const events = Events.getAllEvents();
        let text = `🎁 QUẢN LÝ SỰ KIỆN
━━━━━━━━━━━━━━━━━━━━━

📊 Tổng: ${events.length} sự kiện\n\n`;

        if (events.length === 0) {
          text += '⛄ Chưa có sự kiện nào!';
        } else {
          events.slice(0, 10).forEach((e) => {
            const status = e.is_active ? '✅' : '🔴';
            const stats = Events.getEventStats(e.id);
            text += `${status} #${e.id} ${e.name}\n`;
            text += `   📋 ${e.type} │ 🎯 ${e.reward_amount} ${e.reward_type === 'percent' ? '%' : 'xu'}\n`;
            text += `   👥 ${stats.claims} claims │ 💰 ${stats.total_amount} xu\n`;
            if (e.code) text += `   🔑 Code: ${e.code}\n`;
            text += '\n';
          });
        }

        const keyboard = [
          [{ text: '➕ Thêm Promo Code', callback_data: 'adm_event_add_promo' }],
          [{ text: '➕ Thêm Welcome Bonus', callback_data: 'adm_event_add_welcome' }],
          [{ text: '➕ Thêm Deposit Bonus', callback_data: 'adm_event_add_deposit' }]
        ];
        if (events.length > 0) keyboard.push([{ text: '📋 Danh sách sự kiện', callback_data: 'adm_event_list' }]);

        await bot.editMessageText(text, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: { inline_keyboard: keyboard }
        });

        return bot.answerCallbackQuery(query.id);
      }

    } catch (error) {
      console.error('Admin callback error:', error);
    }

    bot.answerCallbackQuery(query.id);
  });
}

async function handleEventList(bot, query) {
  const events = Events.getAllEvents();

  const keyboard = events.slice(0, 10).map(e => {
    const status = e.is_active ? '✅' : '🔴';
    return [{ text: `${status} ${e.name} (${e.type})`, callback_data: `adm_event_view_${e.id}` }];
  });

  keyboard.push([{ text: '➕ Thêm sự kiện mới', callback_data: 'adm_event_add_promo' }]);
  keyboard.push([{ text: '◀️ Quay lại', callback_data: 'adm_back_events' }]);

  await bot.editMessageText(
    '🎁 DANH SÁCH SỰ KIỆN\n━━━━━━━━━━━━━━━━━━━━━\n\nChọn sự kiện để xem/sửa:',
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: { inline_keyboard: keyboard }
    }
  );
  bot.answerCallbackQuery(query.id);
}

async function handleEventAdd(bot, query) {
  const type = query.data.split('_')[3]; // promo, welcome, deposit

  adminState.set(query.from.id, {
    action: 'add_event',
    eventType: type,
    messageId: query.message.message_id
  });

  let text = `➕ TẠO SỰ KIỆN ${type.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━

`;

  if (type === 'promo') {
    text += `📝 HƯỚNG DẪN NHẬP:
CODE|Tên sự kiện|Số xu|Số lần/user

🔹 CODE: Mã nhập để nhận xu (viết hoa, không dấu)
🔹 Tên: Mô tả sự kiện (dùng để quản lý)
🔹 Số xu: Số xu thưởng khi nhập code
🔹 Số lần: Mỗi user có thể dùng code bao nhiêu lần

📌 VÍ DỤ:
NEWUSER|Chào mừng 2024|5|1
→ Code "NEWUSER" thưởng 5 xu, mỗi user chỉ dùng 1 lần

SALE50|Flash Sale|2|3
→ Code "SALE50" thưởng 2 xu, mỗi user dùng tối đa 3 lần`;

  } else if (type === 'welcome') {
    text += `📝 HƯỚNG DẪN NHẬP:
Tên sự kiện|Số xu

🔹 Tên: Mô tả sự kiện (dùng để quản lý)
🔹 Số xu: Số xu thưởng khi user mới đăng ký

ℹ️ Tự động thưởng cho user đăng ký lần đầu

📌 VÍ DỤ:
Thưởng chào mừng|2
→ User mới tự động nhận 2 xu khi vào bot lần đầu`;

  } else if (type === 'deposit') {
    text += `📝 HƯỚNG DẪN NHẬP:
Tên|Số xu hoặc %|Nạp tối thiểu|fixed hoặc percent

🔹 Tên: Mô tả sự kiện (dùng để quản lý)
🔹 Số xu/%: Thưởng bao nhiêu (10 = 10 xu hoặc 10%)
🔹 Nạp min: Số tiền nạp tối thiểu để được thưởng
🔹 Loại: "fixed" (cố định) hoặc "percent" (%)

📌 VÍ DỤ 1 - Thưởng cố định:
Nạp thưởng 2 xu|2|10|fixed
→ Nạp từ 10 USDT trở lên nhận 2 xu

📌 VÍ DỤ 2 - Thưởng %:
Nạp thưởng 10%|10|5|percent
→ Nạp 5 USDT nhận 0.5 xu, nạp 10 USDT nhận 1 xu`;
  }

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: 'adm_event_list' }]] }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleEventView(bot, query) {
  const eventId = parseInt(query.data.split('_')[3], 10);
  const event = Events.getEventById(eventId);

  if (!event) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Không tìm thấy sự kiện!' });
  }

  const stats = Events.getEventStats(eventId);

  const text = `🎁 ${event.name} (#${event.id})
━━━━━━━━━━━━━━━━━━━━━

📋 Loại: ${event.type}
🎯 Thưởng: ${event.reward_amount} ${event.reward_type === 'percent' ? '%' : 'xu'}
${event.code ? `🔑 Code: ${event.code}` : ''}
${event.min_amount > 0 ? `💰 Tối thiểu: ${event.min_amount}` : ''}
👤 Max/user: ${event.max_per_user || 'Không giới hạn'}
📊 Max claims: ${event.max_claims || 'Không giới hạn'}
📊 Trạng thái: ${event.is_active ? '✅ Hoạt động' : '🔴 Tắt'}

📈 THỐNG KÊ
👥 Đã claim: ${stats.claims} lần
💰 Tổng xu: ${stats.total_amount}
👤 Users: ${stats.unique_users}`;

  const keyboard = [
    [{ text: event.is_active ? '🔴 Tắt sự kiện' : '✅ Bật sự kiện', callback_data: `adm_event_toggle_${eventId}` }],
    [{ text: '🗑️ Xóa sự kiện', callback_data: `adm_event_delete_${eventId}` }],
    [{ text: '◀️ Quay lại', callback_data: 'adm_event_list' }]
  ];

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleEventToggle(bot, query) {
  const eventId = parseInt(query.data.split('_')[3], 10);
  const event = Events.getEventById(eventId);
  if (!event) return bot.answerCallbackQuery(query.id, { text: '❌ Không tìm thấy!' });

  Events.updateEvent(eventId, { is_active: !event.is_active });
  bot.answerCallbackQuery(query.id, { text: event.is_active ? '🔴 Đã tắt' : '✅ Đã bật' });

  query.data = `adm_event_view_${eventId}`;
  return handleEventView(bot, query);
}

async function handleEventDelete(bot, query) {
  const eventId = parseInt(query.data.split('_')[3], 10);
  Events.deleteEvent(eventId);
  bot.answerCallbackQuery(query.id, { text: '🗑️ Đã xóa sự kiện!' });
  return handleEventList(bot, query);
}

async function handleProductDetail(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  const product = Product.getById(productId);

  if (!product) {
    return bot.answerCallbackQuery(query.id, { text: '❄️ Không tồn tại!' });
  }

  const stocks = Product.getStockByProduct(productId);
  const available = stocks.filter(s => !s.is_sold).length;
  const sold = stocks.length - available;

  const creditsStatus = product.credits_enabled
    ? `✅ ${formatNumber(product.credits_price || product.price)} 🪙`
    : '🔴 Không cho phép';

  const text = `📦 ${product.name} (#${product.id})
━━━━━━━━━━━━━━━━━━━━━

💵 Giá Balance: ${formatPrice(product.price)}
🎁 Giá Xu: ${creditsStatus}
📝 Mô tả: ${product.description || 'Chưa có'}
📊 Trạng thái: ${product.is_active ? '✅ Đang bán' : '🔴 Đã ẩn'}

📊 KHO: ✅${available} còn │ 🔴${sold} đã bán`;

  const keyboard = [
    [
      { text: '✏️ Sửa tên', callback_data: `adm_edit_name_${productId}` },
      { text: '💵 Sửa giá', callback_data: `adm_edit_price_${productId}` }
    ],
    [{ text: '🎁 Cài đặt giá Xu', callback_data: `adm_edit_credits_${productId}` }],
    [{ text: '📝 Sửa mô tả', callback_data: `adm_edit_desc_${productId}` }],
    [
      { text: '➕ Thêm stock', callback_data: `adm_addstock_${productId}` },
      { text: '👁️ Xem stock', callback_data: `adm_viewstock_${productId}` }
    ],
    [{ text: '🗑️ Xóa sản phẩm', callback_data: `adm_delete_${productId}` }],
    [{ text: '◀️ Quay lại', callback_data: 'adm_back_list' }]
  ];

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleBackToList(bot, query) {
  const products = Product.getAll(false);
  const keyboard = buildAdminProductsKeyboard(products);

  const text = `⚙️ QUẢN LÝ SẢN PHẨM
━━━━━━━━━━━━━━━━━━━━━

📊 Tổng: ${products.length} sản phẩm
⛄ Chọn để sửa/xóa:`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleAddProduct(bot, query) {
  adminState.set(query.from.id, {
    action: 'new_product',
    messageId: query.message.message_id
  });

  const text = `➕ THÊM SẢN PHẨM MỚI
━━━━━━━━━━━━━━━━━━━━━

📝 Nhập theo format:
Tên|Giá|Mô tả

▸ Ví dụ:
Netflix 1 tháng|5|Premium`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: '❌ Hủy', callback_data: 'adm_back_list' }]] }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleEditProduct(bot, query) {
  const parts = query.data.split('_');
  const field = parts[2]; // name, price, desc, credits
  const productId = parseInt(parts[3], 10);

  if (field === 'credits') {
    return handleCreditsSettings(bot, query, productId);
  }

  adminState.set(query.from.id, {
    action: 'edit_product',
    productId,
    field,
    messageId: query.message.message_id
  });

  const labels = { name: 'tên', price: 'giá (USDT)', desc: 'mô tả' };
  const text = `✏️ Nhập ${labels[field]} mới cho sản phẩm #${productId}:`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: '✖️ Hủy', callback_data: `adm_product_${productId}` }]] }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleCreditsSettings(bot, query, productId) {
  const product = Product.getById(productId);
  if (!product) {
    return bot.answerCallbackQuery(query.id, { text: '❄️ Không tồn tại!' });
  }

  const text = `🎁 CÀI ĐẶT GIÁ XU
━━━━━━━━━━━━━━━━━━━━━

📦 ${product.name}
💵 Giá Balance: ${formatPrice(product.price)}
🎁 Giá Xu hiện tại: ${product.credits_price || 'Chưa đặt'}
📊 Trạng thái: ${product.credits_enabled ? '✅ Cho phép mua bằng xu' : '🔴 Không cho phép'}

⛄ Chọn hành động:`;

  const keyboard = [
    [{ text: product.credits_enabled ? '🔴 Tắt mua bằng xu' : '✅ Bật mua bằng xu', callback_data: `adm_credits_toggle_${productId}` }],
    [{ text: '💰 Đặt giá xu', callback_data: `adm_credits_setprice_${productId}` }],
    [{ text: '🔄 Giá xu = Giá Balance', callback_data: `adm_credits_same_${productId}` }],
    [{ text: '◀️ Quay lại', callback_data: `adm_product_${productId}` }]
  ];

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleAddStock(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  const product = Product.getById(productId);

  adminState.set(query.from.id, {
    action: 'add_stock',
    productId,
    messageId: query.message.message_id
  });

  const text = `➕ Thêm stock cho: ${product?.name || `#${productId}`}

Gửi danh sách tài khoản (mỗi dòng 1 tk):`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: [[{ text: '✖️ Hủy', callback_data: `adm_product_${productId}` }]] }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleViewStock(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  const product = Product.getById(productId);
  const stocks = Product.getStockByProduct(productId);
  const available = stocks.filter(s => !s.is_sold);

  let text = `📦 ${product?.name || `#${productId}`}\n\n🎯 Còn: ${available.length} | ✖️ Đã bán: ${stocks.length - available.length}\n\n`;
  const keyboard = [];

  if (available.length > 0) {
    text += 'Tài khoản còn (bấm để xóa):\n';
    available.slice(0, 10).forEach((s, i) => {
      text += `${i + 1}. ${s.account_data}\n`;
      const short = (s.account_data || '').toString().slice(0, 25);
      keyboard.push([{ text: `🗑️ Xóa: ${short}...`, callback_data: `adm_delstock_${productId}_${s.id}` }]);
    });
    if (available.length > 10) text += `... và ${available.length - 10} tài khoản khác\n`;
    keyboard.push([{ text: '🗑️ Xóa TẤT CẢ stock', callback_data: `adm_clearstock_${productId}` }]);
  } else {
    text += '✖️ Chưa có tài khoản trong kho!';
  }

  keyboard.push([{ text: '➕ Thêm stock', callback_data: `adm_addstock_${productId}` }]);
  keyboard.push([{ text: '← Quay lại', callback_data: `adm_product_${productId}` }]);

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleDeleteStock(bot, query) {
  const parts = query.data.split('_');
  const productId = parseInt(parts[2], 10);
  const stockId = parseInt(parts[3], 10);

  Product.deleteStock(stockId);
  bot.answerCallbackQuery(query.id, { text: '🎯 Đã xóa!' });

  query.data = `adm_viewstock_${productId}`;
  return handleViewStock(bot, query);
}

async function handleClearStock(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  const product = Product.getById(productId);
  const stocks = Product.getStockByProduct(productId);
  const available = stocks.filter(s => !s.is_sold).length;

  const text = `⚠️ Xác nhận xóa TẤT CẢ stock?

📦 ${product?.name || `#${productId}`}
🗑️ Sẽ xóa: ${available} tài khoản

Hành động này không thể hoàn tác!`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗑️ Xóa hết', callback_data: `adm_confirmclear_${productId}` }, { text: '✖️ Hủy', callback_data: `adm_viewstock_${productId}` }]
      ]
    }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleConfirmClear(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  Product.clearStock(productId);
  bot.answerCallbackQuery(query.id, { text: '🎯 Đã xóa tất cả stock!' });

  query.data = `adm_product_${productId}`;
  return handleProductDetail(bot, query);
}

async function handleDeleteProduct(bot, query) {
  const productId = parseInt(query.data.split('_')[2], 10);
  const product = Product.getById(productId);

  if (!product) {
    return bot.answerCallbackQuery(query.id, { text: '❄️ Không tồn tại!' });
  }

  const text = `⚠️ Xác nhận xóa sản phẩm:

📦 ${product.name}

Hành động này không thể hoàn tác!`;

  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗑️ Xóa luôn', callback_data: `adm_confirm_delete_${productId}` }, { text: '✖️ Hủy', callback_data: `adm_product_${productId}` }]
      ]
    }
  });
  bot.answerCallbackQuery(query.id);
}

async function handleConfirmDelete(bot, query) {
  const productId = parseInt(query.data.split('_')[3], 10);
  Product.remove(productId);

  const products = Product.getAll(false);
  const keyboard = buildAdminProductsKeyboard(products);

  await bot.editMessageText(`🎯 Đã xóa sản phẩm #${productId}!\n\n⚙️ Quản lý sản phẩm:`, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    reply_markup: { inline_keyboard: keyboard }
  });
  bot.answerCallbackQuery(query.id);
}

async function sendBroadcast(bot, chatId, message) {
  const users = User.getAll(10000);
  let sent = 0, failed = 0;

  const tAdmin = i18n.getTranslator(chatId);

  await bot.sendMessage(chatId, tAdmin('admin_broadcasting', { count: users.length }));

  for (const user of users) {
    try {
      const tUser = i18n.getTranslator(user.id);
      await bot.sendMessage(user.id, `${tUser('broadcast_prefix')}\n\n${message}`);
      sent++;
    } catch (e) {
      failed++;
    }
  }

  const text = `✅ ĐÃ GỬI THÔNG BÁO
━━━━━━━━━━━━━━━━━━━━━

✅ Thành công: ${sent}
❌ Thất bại: ${failed}`;

  bot.sendMessage(chatId, text);
}

function getAdminState() {
  return adminState;
}

module.exports = { registerCommands, registerCallbacks, getAdminState, sendBroadcast };