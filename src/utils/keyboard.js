// Keyboard builders
const { formatPrice, formatCredits } = require('./helpers');

function buildShopKeyboard(products, showProfile = true, adminUsername = null, t = null) {
  const keyboard = products.map(p => {
    let priceText = formatPrice(p.price);
    if (p.credits_enabled && p.credits_price) {
      priceText += `/${formatCredits(p.credits_price)}`;
    }
    return [{
      text: `🎁 ${p.name}┃${priceText}┃📦${p.stock_count}`,
      callback_data: `product_${p.id}`
    }];
  });

  if (showProfile && t) {
    keyboard.push([
      { text: t('profile_btn'), callback_data: 'main_profile' },
      { text: t('history_btn'), callback_data: 'main_history' }
    ]);
    keyboard.push([
      { text: t('deposit_btn'), callback_data: 'deposit_menu' },
      { text: t('credits_btn'), callback_data: 'credits_menu' }
    ]);
    keyboard.push([
      { text: '🌐 Language', callback_data: 'lang_menu' }
    ]);
  }

  if (adminUsername && t) {
    keyboard.push([{ text: t('contact_admin'), url: `https://t.me/${adminUsername}` }]);
  }

  return keyboard;
}

function buildProductKeyboard(product, t = null) {
  const stock = product.stock_count;
  const presets = [1, 2, 3, 5, 10];
  const qtyButtons = [];

  presets.forEach(n => {
    if (n <= stock) {
      qtyButtons.push({ text: `『${n}』`, callback_data: `qty_${product.id}_${n}` });
    }
  });

  if (stock > 10) {
    qtyButtons.push({ text: `『MAX:${stock}』`, callback_data: `qty_${product.id}_${stock}` });
  }

  const keyboard = [];
  if (qtyButtons.length <= 3) {
    keyboard.push(qtyButtons);
  } else {
    keyboard.push(qtyButtons.slice(0, 3));
    keyboard.push(qtyButtons.slice(3));
  }

  if (stock > 5 && t) {
    keyboard.push([{ text: `📝 ${t('enter_quantity')}`, callback_data: `customqty_${product.id}` }]);
  }

  if (t) {
    keyboard.push([{ text: t('back'), callback_data: 'main_shop' }]);
  }

  return keyboard;
}

function buildDepositKeyboard(t = null) {
  const config = require('../config');
  const keyboard = [
    [{ text: '💰 ' + t('deposit_binance'), callback_data: 'deposit_binance' }]
  ];

  // Only show bank option if enabled in config
  if (config.BANK_ENABLED) {
    keyboard.push([{ text: t ? t('deposit_bank') : '🏦 Bank Transfer', callback_data: 'deposit_bank' }]);
  }

  if (t) {
    keyboard.push([{ text: t('back'), callback_data: 'back_main' }]);
  }
  return keyboard;
}

function buildDepositAmountKeyboard(method, t = null) {
  const amounts = method === 'binance' ? [1, 5, 10, 20, 50, 100] : [50000, 100000, 200000, 500000];
  const keyboard = [];
  const row = [];

  amounts.forEach((amount, idx) => {
    const label = method === 'binance' ? `${amount} USDT` : formatPrice(amount, 'VND');
    row.push({ text: label, callback_data: `deposit_amount_${method}_${amount}` });
    if ((idx + 1) % 3 === 0 || idx === amounts.length - 1) {
      keyboard.push([...row]);
      row.length = 0;
    }
  });

  if (t) {
    keyboard.push([{ text: `📝 ${t('enter_amount')}`, callback_data: `deposit_custom_${method}` }]);
    keyboard.push([{ text: t('back'), callback_data: 'deposit_menu' }]);
  }

  return keyboard;
}

function buildAdminProductsKeyboard(products, t = null) {
  const keyboard = products.map(p => [{
    text: `📦 #${p.id} ${p.name} ┃ 🎯${p.stock_count}`,
    callback_data: `adm_product_${p.id}`
  }]);
  keyboard.push([{ text: t ? t('add_new_product') : '➕ Add New Product', callback_data: 'adm_add_product' }]);
  return keyboard;
}

function buildAdminProductDetailKeyboard(productId, t = null) {
  return [
    [
      { text: t ? t('edit_name') : '✏️ Edit Name', callback_data: `adm_edit_name_${productId}` },
      { text: t ? t('edit_price') : '💵 Edit Price', callback_data: `adm_edit_price_${productId}` }
    ],
    [{ text: t ? t('edit_description') : '📝 Edit Description', callback_data: `adm_edit_desc_${productId}` }],
    [
      { text: t ? t('add_stock') : '➕ Add Stock', callback_data: `adm_addstock_${productId}` },
      { text: t ? t('view_stock') : '👁️ View Stock', callback_data: `adm_viewstock_${productId}` }
    ],
    [{ text: t ? t('delete_product') : '🗑️ Delete Product', callback_data: `adm_delete_${productId}` }],
    [{ text: t ? t('back') : '◀️ Back', callback_data: 'adm_back_list' }]
  ];
}

module.exports = { buildShopKeyboard, buildProductKeyboard, buildDepositKeyboard, buildDepositAmountKeyboard, buildAdminProductsKeyboard, buildAdminProductDetailKeyboard };
