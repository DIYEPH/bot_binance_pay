const config = require('../config');
const Category = require('../database/models/category');
const Product = require('../database/models/product');
const { getFullName, getAdminUsername } = require('./helpers');
const { buildCategoryKeyboard } = require('./keyboard');

async function buildMainMenuPayload(user, t, options = {}) {
  const includeWelcome = options.includeWelcome !== false;
  const categories = await Category.getAll(false);
  const priceRanges = await Product.getCategoryPriceRanges(true);
  const keyboard = buildCategoryKeyboard(categories, t, getAdminUsername(), priceRanges);

  const headerLines = includeWelcome
    ? [
        t('shop_name', { name: config.SHOP_NAME }),
        '━━━━━━━━━━━━━━━━━━━━━',
        '',
        t('welcome', { name: getFullName(user) }),
        '',
      ]
    : ['🛒 SHOP', '━━━━━━━━━━━━━━━━━━━━━', ''];

  const text = [
    ...headerLines,
    categories.length > 0 ? t('select_category') : t('no_products'),
  ].join('\n');

  return { text, keyboard };
}

module.exports = { buildMainMenuPayload };
