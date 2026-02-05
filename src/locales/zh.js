// Chinese
module.exports = {
  _lang: 'zh',
  _name: '中文',
  _flag: '🇨🇳',

  // Common
  back: '◀️ 返回',
  cancel: '❌ 取消',
  error: '❌ 错误',
  not_enough: '不足',

  // Main menu
  shop_name: '⛄ {name}',
  welcome: '✨ 你好，{name}！',
  select_product: '🛒 选择要购买的产品：',
  no_products: '⛄ 暂无产品！',
  profile_btn: '👤 个人中心',
  history_btn: '📋 历史记录',
  deposit_btn: '💰 充值',
  credits_btn: '🎁 免费积分',
  contact_admin: '💬 联系客服',

  // Products
  product_price: '💰 价格：{price}/个',
  product_stock: '📊 库存：{count} 个',  description: '描述',  select_quantity: '⛄ 选择数量：',
  enter_quantity: '✏️ 输入购买数量：',
  invalid_quantity: '✖️ 数量无效！请输入大于0的数字',
  not_enough_stock: '✖️ 库存不足！仅剩 {count} 个。',
  product_not_found: '❄️ 产品不存在！',

  // Payment
  payment_title: '💳 选择支付方式',
  your_balance: '💵 您的余额：',
  balance_label: '• 余额：{amount}',
  credits_label: '• 免费积分：{amount}',
  select_payment: '⛄ 选择支付方式：',
  pay_with_credits: '🎁 使用积分 ({amount})',
  pay_with_balance: '💵 使用余额 ({amount})',
  pay_with_both: '🔄 积分+余额',
  pay_binance: '💰 币安支付',
  pay_bank: '🏦 银行转账',
  check_payment: '🔄 检查支付',
  cancel_order: '❌ 取消订单',

  // Payment processing
  binance_instructions: '📱 币安支付说明',
  binance_step1: '1. 打开币安App',
  binance_step2: '2. 进入币安支付',
  binance_step3: '3. 选择"发送"',
  binance_step4: '4. 输入币安ID: *{id}*',
  binance_step5: '5. 金额: *{amount}*',
  binance_step6: '6. 备注（*重要*）: *{note}*',
  binance_step7: '7. 确认发送',
  bank_info: '🏦 银行转账信息',
  bank_name: '• 银行：{name}',
  bank_account: '• 账号：{account}',
  bank_owner: '• 户名：{owner}',
  payment_note: '• 备注：{code}',
  scan_qr: '📲 扫码支付',
  order_expires: '⏳ 订单20分钟后过期',
  payment_warning: '⚠️ 必须填写正确备注才能自动确认！',

  // Payment result
  payment_success: '✅ 支付成功！',
  payment_pending: '❄️ 暂未收到付款！请稍后重试。',

  // Accounts delivery
  accounts_title: '🔑 账号：',
  change_password: '⚠️ 请立即修改密码！',
  buy_more: '🛒 继续购买？输入 /menu',

  // Profile
  profile_title: '个人中心',
  profile_id: '🆔 ID：{id}',
  profile_name: '✨ 昵称：{name}',
  profile_username: '📧 用户名：{username}',
  no_username: '未设置',
  balance_section: '余额',
  stats_section: '统计',
  completed_orders: '🛍️ 已完成订单：{count}',
  balance_spent_label: '💵 余额消费：{amount}',
  credits_spent_label: '🎁 积分消费：{amount}',

  // Balance
  balance_title: '💰 我的余额',
  current_balance: '💵 余额：{amount}',
  current_credits: '🎁 免费积分：{amount}',
  total_balance: '📊 总计：{amount}',

  // Deposit
  deposit_title: '充值',
  deposit_current: '💵 当前余额：{amount}',
  select_deposit_method: '⛄ 选择充值方式：',
  deposit_binance: '币安支付 (USDT)',
  deposit_bank: '🏦 银行转账',
  deposit_amount_title: '充值 - {method}',
  deposit_currency: '💱 货币：{currency}',
  select_amount: '⛄ 选择充值金额：',
  enter_amount: '输入充值金额：',
  invalid_amount: '✖️ 金额无效！',
  min_amount: '✖️ 最低金额为 {amount}！',
  deposit_success: '✅ 充值成功！\n\n💰 已添加 {amount} 到您的账户！',
  deposit_success_with_bonus: '✅ 充值成功！\n\n💰 已添加 {amount} {currency} 到您的账户！\n\n🎁 奖励：',
  deposit_bonus_item: '• {eventName}: +{amount} 积分',
  deposit_not_found: '✖️ 未找到充值请求！',
  expires_30_min: '⏳ {minutes}分钟后过期',

  // Admin notifications
  admin_new_deposit: '💰 新充值\n👤 用户：{userId}\n💵 {amount} {currency}\n📱 {method}',

  // Credits / Referral
  credits_title: '免费积分',
  credits_current: '当前积分：{amount}',
  how_to_earn: '如何获取积分',
  earn_referral: '• 邀请好友：+{amount} 积分/人 (最低充值 {min})',
  earn_referee: '• 被邀请：+{amount} 积分 (立即获得)',
  earn_events: '• 特别活动',
  referral_code: '邀请码：{code}',
  total_referrals: '已邀请：{count} 人',
  total_earned: '已获得：{amount}',
  my_referral_btn: '🔗 我的邀请码',
  my_referrals_btn: '👥 邀请列表',
  enter_referral_btn: '🎁 输入邀请码',

  // Referral details
  referral_title: '🎁 邀请计划',
  referral_link: '📎 邀请链接：',
  referral_stats: '📊 统计',
  referral_rewards: '🎯 奖励',
  referrer_bonus: '• 邀请人获得：+{amount} 积分',
  referee_bonus: '• 新用户获得：+{amount} 积分',
  min_deposit_bonus: '（首次充值满 {amount}）',
  copy_link_btn: '📋 复制链接',

  my_referral_title: '🔗 我的邀请码',
  referral_code_label: '📋 邀请码：{code}',
  referral_link_label: '🔗 链接：\n{link}',
  share_referral: '📤 分享链接给好友即可获得积分奖励！',

  referrals_list_title: '👥 我的邀请',
  no_referrals: '⛄ 还没有邀请任何人！\n\n分享邀请码获取积分！',
  referrals_total: '📊 共计：{count} 人',
  referral_spent: '{name} - 消费：{amount}',
  and_more: '\n... 还有 {count} 人',

  enter_referral_title: '📝 输入邀请码',
  enter_code_prompt: '✏️ 请输入好友的邀请码：',
  already_has_referrer: '❌ 您已有邀请人！',
  invalid_referral: '❌ 邀请码无效！',
  referral_success: '✅ 已关联 {name}。您获得了 {amount} 免费积分！',

  // History
  history_title: '购买记录',
  no_history: '📋 暂无购买记录！',
  order_status: {
    completed: '✅',
    pending: '⏳',
    expired: '⌛',
    cancelled: '❌'
  },

  // Language selection
  language_title: '🌐 选择语言',
  language_changed: '✅ 语言已更改为中文！',

  // Broadcast
  broadcast_prefix: '📣 公告：',

  // Admin commands
  admin_user_not_found: '❌ 用户不存在！',
  admin_balance_added: '✅ 已为用户 {name} ({id}) 添加 {amount}',
  admin_balance_added_notify: '🎁 管理员已向您的账户添加 {amount}！',
  admin_credits_added: '✅ 已为用户 {name} ({id}) 添加 {amount} 积分',
  admin_credits_added_notify: '🎁 管理员已向您的账户添加 {amount} 免费积分！',
  admin_clearing_messages: '⏳ 正在清除消息...',
  admin_messages_cleared: '🎯 已清除 {count} 条消息！',
  admin_event_type_error: '❌ 类型必须是：promo, welcome, deposit, purchase',
  admin_event_created: '✅ 已创建活动 #{id}\n\n📋 {name}\n🎯 +{amount} 积分\n{code}',
  admin_event_error: '❌ 创建活动错误：{error}',
  admin_no_orders: '📦 订单\n━━━━━━━━━━━━━━━━━━━━━\n\n⛄ 暂无订单！',
  admin_broadcasting: '⏳ 正在向 {count} 个用户发送广播...'
};
