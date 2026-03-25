// English
module.exports = {
  _lang: 'en',
  _name: 'English',
  _flag: '🇬🇧',

  // Common
  back: '◀️ Back',
  cancel: '❌ Cancel',
  error: '❌ Error',
  not_enough: 'Not enough',

  // Main menu
  shop_name: '⛄ {name}',
  welcome: '✨ Hello, {name}!',
  select_product: '🛒 Select a product to buy:',
  select_category: '📂 Select a category to view products',
  no_products: '⛄ No products available!',
  profile_btn: '👤 Profile',
  history_btn: '📋 History',
  deposit_btn: '💰 Deposit',
  credits_btn: '🎁 Free Credits',
  language_btn: '🌐 Language',
  contact_admin: '💬 Contact Admin',

  // Products
  product_price: '💰 Price: {price}/each',
  product_stock: '📊 Stock: {count} items',
  description: 'Description',
  select_quantity: '⛄ Select quantity:',
  enter_quantity: '✏️ Enter quantity to buy:',
  invalid_quantity: '✖️ Invalid quantity! Enter a number > 0',
  not_enough_stock: '✖️ Not enough stock! Only {count} left.',
  product_not_found: '❄️ Product not found!',

  // Payment
  payment_title: '💳 SELECT PAYMENT METHOD',
  your_balance: 'Your balance:',
  balance_label: '• Balance: {amount}',
  credits_label: '• Free credits: {amount}',
  select_payment: '⛄ Select payment method:',
  pay_with_credits: '🎁 Use Credits ({amount})',
  pay_with_balance: 'Use Balance ({amount})',
  pay_with_both: '🔄 Use Credits + Balance',
  pay_binance: '💰 Binance Pay',
  pay_bank: '🏦 Bank Transfer',
  check_payment: '🔄 Check Payment',
  cancel_order: '❌ Cancel Order',

  // Payment processing
  binance_instructions: '📱 BINANCE PAY INSTRUCTIONS',
  binance_step1: '1. Open Binance App',
  binance_step2: '2. Go to Binance Pay',
  binance_step3: '3. Select "Send"',
  binance_step4: '4. Enter Binance ID: `{id}`',
  binance_step5: '5. Amount: *{amount}*',
  binance_step6: '6. Note (*IMPORTANT*): `{note}`',
  binance_step7: '7. Confirm & Send',
  bank_info: '🏦 BANK TRANSFER INFO',
  bank_name: '• Bank: {name}',
  bank_account: '• Account: {account}',
  bank_owner: '• Name: {owner}',
  payment_note: '• Note: {code}',
  scan_qr: '📲 Scan QR to pay',
  order_expires: '⏳ Order expires in 20 minutes',
  payment_warning: '⚠️ MUST enter correct note for auto-confirmation!',

  // Payment result
  payment_success: '✅ PAYMENT SUCCESSFUL!',
  payment_pending: '❄️ Payment not received yet! Try again later.',

  // Accounts delivery
  accounts_title: '🔑 ACCOUNTS:',
  change_password: '⚠️ Change password immediately!',
  buy_more: '🛒 Buy more? Type /start',

  // Profile
  profile_title: 'YOUR PROFILE',
  profile_id: '🆔 ID: {id}',
  profile_name: '✨ Name: {name}',
  profile_username: '📧 Username: {username}',
  no_username: 'Not set',
  balance_section: 'BALANCE',
  stats_section: 'STATISTICS',
  completed_orders: '🛍️ Completed orders: {count}',
  balance_spent_label: 'Balance spent: {amount}',
  credits_spent_label: '🎁 Credits spent: {amount}',

  // Balance
  balance_title: '💰 YOUR BALANCE',
  current_balance: 'Balance: {amount}',
  current_credits: '🎁 Free credits: {amount}',
  total_balance: '📊 Total: {amount}',

  // Deposit
  deposit_title: 'DEPOSIT',
  deposit_current: 'Current balance: {amount}',
  select_deposit_method: '⛄ Select deposit method:',
  deposit_binance: 'Binance Pay (USDT)',
  deposit_bank: '🏦 Bank Transfer',
  deposit_amount_title: 'DEPOSIT - {method}',
  deposit_currency: '💱 Currency: {currency}',
  select_amount: '⛄ Select amount to deposit:',
  enter_amount: '📝 Enter amount to deposit:',
  invalid_amount: '✖️ Invalid amount!',
  min_amount: '✖️ Minimum amount is {amount}!',
  deposit_success: '✅ DEPOSIT SUCCESSFUL!\n\n💰 Added {amount} to your account!',
  deposit_success_with_bonus: '✅ Deposit successful!\n\n💰 Added {amount} {currency} to your account!\n\n🎁 BONUS:',
  deposit_bonus_item: '• {eventName}: +{amount} credits',
  deposit_not_found: '✖️ Deposit request not found!',
  expires_30_min: '⏳ Expires in {minutes} minutes',

  // Admin notifications
  admin_new_deposit: '💰 NEW DEPOSIT\n👤 User: {userId}\n{amount} {currency}\n📱 {method}',

  // Credits / Referral
  credits_title: 'FREE CREDITS',
  credits_current: 'Current credits: {amount}',
  how_to_earn: 'HOW TO EARN CREDITS',
  earn_referral: '• Refer friends: +{amount} credits/person (min. deposit {min})',
  earn_referee: '• Get referred: +{amount} credits (instant)',
  earn_events: '• Special events',
  referral_code: 'Referral code: {code}',
  total_referrals: 'Total referrals: {count}',
  total_earned: 'Total earned: {amount}',
  my_referral_btn: '🔗 My Referral Code',
  my_referrals_btn: '👥 My Referrals',
  enter_referral_btn: '🎁 Enter Referral Code',

  // Referral details
  referral_title: '🎁 REFERRAL PROGRAM',
  referral_link: '📎 Referral link:',
  referral_stats: '📊 STATISTICS',
  referral_rewards: '🎯 REWARDS',
  referrer_bonus: '• Referrer gets: +{amount} credits',
  referee_bonus: '• New user gets: +{amount} credits',
  min_deposit_bonus: '(When depositing at least {amount})',
  copy_link_btn: '📋 Copy Link',

  my_referral_title: '🔗 YOUR REFERRAL CODE',
  referral_code_label: '📋 Code: {code}',
  referral_link_label: '🔗 Link:\n{link}',
  share_referral: '📤 Share this link with friends to earn credits!',

  referrals_list_title: '👥 YOUR REFERRALS',
  no_referrals: '⛄ No referrals yet!\n\nShare your referral code to earn credits!',
  referrals_total: '📊 Total: {count} people',
  referral_spent: '{name} - Spent: {amount}',
  and_more: '\n... and {count} more',

  enter_referral_title: '📝 ENTER REFERRAL CODE',
  enter_code_prompt: '✏️ Enter your friend\'s referral code:',
  already_has_referrer: '❌ You already have a referrer!',
  invalid_referral: '❌ Invalid referral code!',
  referral_success: '✅ Linked to {name}. You received {amount} free credits!',

  // History
  history_title: 'PURCHASE HISTORY',
  no_history: '📋 No purchase history yet!',
  order_status: {
    completed: '✅',
    pending: '⏳',
    expired: '⌛',
    cancelled: '❌'
  },

  // Language selection
  language_title: '🌐 SELECT LANGUAGE',
  language_changed: '✅ Language changed to English!',

  // Broadcast
  broadcast_prefix: '📣 Announcement:',

  // Admin commands
  admin_user_not_found: '❌ User not found!',
  admin_balance_added: '✅ Added {amount} to user {name} ({id})',
  admin_balance_added_notify: '🎁 Admin added {amount} to your account!',
  admin_credits_added: '✅ Added {amount} credits to user {name} ({id})',
  admin_credits_added_notify: '🎁 Admin added {amount} free credits to your account!',
  admin_clearing_messages: '⏳ Clearing messages...',
  admin_messages_cleared: '🎯 Cleared {count} messages!',
  admin_event_type_error: '❌ Type must be: promo, welcome, deposit, purchase',
  admin_event_created: '✅ Event created #{id}\n\n📋 {name}\n🎯 +{amount} credits\n{code}',
  admin_event_error: '❌ Error creating event: {error}',
  admin_no_orders: '📦 ORDERS\n━━━━━━━━━━━━━━━━━━━━━\n\n⛄ No orders yet!',
  admin_broadcasting: '⏳ Broadcasting to {count} users...'
};
