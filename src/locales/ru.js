// Russian
module.exports = {
  _lang: 'ru',
  _name: 'Русский',
  _flag: '🇷🇺',

  // Common
  back: '◀️ Назад',
  cancel: '❌ Отмена',
  error: '❌ Ошибка',
  not_enough: 'Недостаточно',

  // Main menu
  shop_name: '⛄ {name}',
  welcome: '✨ Привет, {name}!',
  select_product: '🛒 Выберите товар для покупки:',
  select_category: '📂 Выберите категорию, чтобы посмотреть товары',
  no_products: '⛄ Товары отсутствуют!',
  profile_btn: '👤 Профиль',
  history_btn: '📋 История',
  deposit_btn: '💰 Пополнить',
  credits_btn: '🎁 Бесплатные кредиты',
  language_btn: '🌐 Язык',
  contact_admin: '💬 Связаться с админом',

  // Products
  product_price: '💰 Цена: {price}/шт',
  product_stock: '📊 В наличии: {count} шт',
  description: 'Описание',
  select_quantity: '⛄ Выберите количество:',
  enter_quantity: '✏️ Введите количество для покупки:',
  invalid_quantity: '✖️ Неверное количество! Введите число > 0',
  not_enough_stock: '✖️ Недостаточно товара! Осталось {count}.',
  product_not_found: '❄️ Товар не найден!',

  // Payment
  payment_title: '💳 ВЫБЕРИТЕ СПОСОБ ОПЛАТЫ',
  your_balance: 'Ваш баланс:',
  balance_label: '• Balance: {amount}',
  credits_label: '• Бесплатные кредиты: {amount}',
  select_payment: '⛄ Выберите способ оплаты:',
  pay_with_credits: '🎁 Использовать кредиты ({amount})',
  pay_with_balance: 'Использовать баланс ({amount})',
  pay_with_both: '🔄 Кредиты + баланс',
  pay_binance: '💰 Binance Pay',
  pay_bank: '🏦 Банковский перевод',
  check_payment: '🔄 Проверить оплату',
  cancel_order: '❌ Отменить заказ',

  // Payment processing
  binance_instructions: '📱 ИНСТРУКЦИЯ BINANCE PAY',
  binance_step1: '1. Откройте приложение Binance',
  binance_step2: '2. Перейдите в Binance Pay',
  binance_step3: '3. Выберите "Send"',
  binance_step4: '4. Введите Binance ID: `{id}`',
  binance_step5: '5. Сумма: *{amount}*',
  binance_step6: '6. Примечание (*ВАЖНО*): `{note}`',
  binance_step7: '7. Подтвердите отправку',
  bank_info: '🏦 ИНФОРМАЦИЯ ДЛЯ ПЕРЕВОДА',
  bank_name: '• Банк: {name}',
  bank_account: '• Счет: {account}',
  bank_owner: '• Владелец: {owner}',
  payment_note: '• Примечание: {code}',
  scan_qr: '📲 Отсканируйте QR для оплаты',
  order_expires: '⏳ Заказ истекает через 20 минут',
  payment_warning: '⚠️ ОБЯЗАТЕЛЬНО укажите верное примечание для авто-подтверждения!',

  // Payment result
  payment_success: '✅ ОПЛАТА УСПЕШНА!',
  payment_pending: '❄️ Оплата еще не получена! Попробуйте позже.',

  // Accounts delivery
  accounts_title: '🔑 АККАУНТЫ:',
  change_password: '⚠️ Смените пароль немедленно!',
  buy_more: '🛒 Хотите еще? Введите /start',

  // Profile
  profile_title: 'ВАШ ПРОФИЛЬ',
  profile_id: '🆔 ID: {id}',
  profile_name: '✨ Имя: {name}',
  profile_username: '📧 Username: {username}',
  no_username: 'Не задан',
  balance_section: 'БАЛАНС',
  stats_section: 'СТАТИСТИКА',
  completed_orders: '🛍️ Завершенные заказы: {count}',
  balance_spent_label: 'Потрачено (Balance): {amount}',
  credits_spent_label: '🎁 Потрачено (Credits): {amount}',

  // Balance
  balance_title: '💰 ВАШ БАЛАНС',
  current_balance: 'Balance: {amount}',
  current_credits: '🎁 Бесплатные кредиты: {amount}',
  total_balance: '📊 Итого: {amount}',

  // Deposit
  deposit_title: 'ПОПОЛНЕНИЕ',
  deposit_current: 'Текущий баланс: {amount}',
  select_deposit_method: '⛄ Выберите способ пополнения:',
  deposit_binance: 'Binance Pay (USDT)',
  deposit_bank: '🏦 Банковский перевод',
  deposit_amount_title: 'ПОПОЛНЕНИЕ - {method}',
  deposit_currency: '💱 Валюта: {currency}',
  select_amount: '⛄ Выберите сумму для пополнения:',
  enter_amount: '📝 Введите сумму для пополнения:',
  invalid_amount: '✖️ Неверная сумма!',
  min_amount: '✖️ Минимальная сумма {amount}!',
  deposit_success: '✅ ПОПОЛНЕНИЕ УСПЕШНО!\n\n💰 Начислено {amount} на ваш счет!',
  deposit_success_with_bonus: '✅ Пополнение успешно!\n\n💰 Начислено {amount} {currency} на ваш счет!\n\n🎁 БОНУС:',
  deposit_bonus_item: '• {eventName}: +{amount} кредитов',
  deposit_not_found: '✖️ Запрос на пополнение не найден!',
  expires_30_min: '⏳ Истекает через {minutes} минут',

  // Admin notifications
  admin_new_deposit: '💰 НОВОЕ ПОПОЛНЕНИЕ\n👤 User: {userId}\n{amount} {currency}\n📱 {method}',

  // Credits / Referral
  credits_title: 'БЕСПЛАТНЫЕ КРЕДИТЫ',
  credits_current: 'Текущие кредиты: {amount}',
  how_to_earn: 'КАК ПОЛУЧИТЬ КРЕДИТЫ',
  earn_referral: '• Пригласите друзей: +{amount} кредитов/чел (мин. пополнение {min})',
  earn_referee: '• Быть приглашенным: +{amount} кредитов (сразу)',
  earn_events: '• Специальные события',
  referral_code: 'Реферальный код: {code}',
  total_referrals: 'Всего приглашенных: {count}',
  total_earned: 'Всего получено: {amount}',
  my_referral_btn: '🔗 Мой реферальный код',
  my_referrals_btn: '👥 Мои приглашенные',
  enter_referral_btn: '🎁 Ввести реферальный код',

  // Referral details
  referral_title: '🎁 РЕФЕРАЛЬНАЯ ПРОГРАММА',
  referral_link: '📎 Реферальная ссылка:',
  referral_stats: '📊 СТАТИСТИКА',
  referral_rewards: '🎯 НАГРАДЫ',
  referrer_bonus: '• Пригласивший получает: +{amount} кредитов',
  referee_bonus: '• Новый пользователь получает: +{amount} кредитов',
  min_deposit_bonus: '(При пополнении от {amount})',
  copy_link_btn: '📋 Копировать ссылку',

  my_referral_title: '🔗 ВАШ РЕФЕРАЛЬНЫЙ КОД',
  referral_code_label: '📋 Код: {code}',
  referral_link_label: '🔗 Ссылка:\n{link}',
  share_referral: '📤 Поделитесь этой ссылкой, чтобы получать кредиты!',

  referrals_list_title: '👥 ВАШИ ПРИГЛАШЕННЫЕ',
  no_referrals: '⛄ Еще нет приглашенных!\n\nПоделитесь кодом, чтобы получать кредиты!',
  referrals_total: '📊 Всего: {count} чел',
  referral_spent: '{name} - Потрачено: {amount}',
  and_more: '\n... и еще {count}',

  enter_referral_title: '📝 ВВЕДИТЕ РЕФЕРАЛЬНЫЙ КОД',
  enter_code_prompt: '✏️ Введите реферальный код друга:',
  already_has_referrer: '❌ У вас уже есть пригласивший!',
  invalid_referral: '❌ Неверный реферальный код!',
  referral_success: '✅ Связано с {name}. Вы получили {amount} бесплатных кредитов!',

  // History
  history_title: 'ИСТОРИЯ ПОКУПОК',
  no_history: '📋 История покупок отсутствует!',
  order_status: {
    completed: '✅',
    pending: '⏳',
    expired: '⌛',
    cancelled: '❌'
  },

  // Language selection
  language_title: '🌐 ВЫБЕРИТЕ ЯЗЫК',
  language_changed: '✅ Язык изменен на русский!',

  // Broadcast
  broadcast_prefix: '📣 Объявление:',

  // Admin commands
  admin_user_not_found: '❌ Пользователь не найден!',
  admin_balance_added: '✅ Добавлено {amount} пользователю {name} ({id})',
  admin_balance_added_notify: '🎁 Админ добавил {amount} на ваш счет!',
  admin_credits_added: '✅ Добавлено {amount} кредитов пользователю {name} ({id})',
  admin_credits_added_notify: '🎁 Админ добавил {amount} бесплатных кредитов на ваш счет!',
  admin_clearing_messages: '⏳ Очистка сообщений...',
  admin_messages_cleared: '🎯 Удалено {count} сообщений!',
  admin_event_type_error: '❌ Тип должен быть: promo, welcome, deposit, purchase',
  admin_event_created: '✅ Событие создано #{id}\n\n📋 {name}\n🎯 +{amount} кредитов\n{code}',
  admin_event_error: '❌ Ошибка создания события: {error}',
  admin_no_orders: '📦 ЗАКАЗЫ\n━━━━━━━━━━━━━━━━━━━━━\n\n⛄ Заказов пока нет!',
  admin_broadcasting: '⏳ Рассылка для {count} пользователей...'
};
