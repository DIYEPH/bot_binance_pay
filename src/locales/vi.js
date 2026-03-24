// Vietnamese
module.exports = {
  _lang: 'vi',
  _name: 'Tiếng Việt',
  _flag: '🇻🇳',

  // Common
  back: '◀️ Quay lại',
  cancel: '❌ Hủy',
  error: '❌ Lỗi',
  not_enough: 'Không đủ',

  // Main menu
  shop_name: '⛄ {name}',
  welcome: '✨ Xin chào, {name}!',
  select_product: '🛒 Chọn sản phẩm để mua:',
  no_products: '⛄ Chưa có sản phẩm nào!',
  profile_btn: '👤 Hồ sơ',
  history_btn: '📋 Lịch sử',
  deposit_btn: '💰 Nạp tiền',
  credits_btn: '🎁 Xu free',
  language_btn: '🌐 Ngôn ngữ',
  contact_admin: '💬 Liên hệ Admin',

  // Products
  product_price: '💰 Giá: {price}/sp',
  product_stock: '📊 Còn: {count} sản phẩm',
  description: 'Mô tả',
  select_quantity: '⛄ Chọn số lượng:',
  enter_quantity: '✏️ Nhập số lượng muốn mua:',
  invalid_quantity: '✖️ Số lượng không hợp lệ! Nhập số nguyên > 0',
  not_enough_stock: '✖️ Không đủ hàng! Chỉ còn {count} sản phẩm.',
  product_not_found: '❄️ Sản phẩm không tồn tại!',

  // Payment
  payment_title: '💳 CHỌN PHƯƠNG THỨC THANH TOÁN',
  your_balance: 'Số dư của bạn:',
  balance_label: '• Balance: {amount}',
  credits_label: '• Xu free: {amount}',
  select_payment: '⛄ Chọn cách thanh toán:',
  pay_with_credits: '🎁 Dùng Xu free ({amount})',
  pay_with_balance: 'Dùng Balance ({amount})',
  pay_with_both: '🔄 Dùng cả Xu + Balance',
  pay_binance: '💰 Binance Pay',
  pay_bank: '🏦 Chuyển khoản',
  check_payment: '🔄 Kiểm tra thanh toán',
  cancel_order: '❌ Hủy đơn',

  // Payment processing
  binance_instructions: '📱 HƯỚNG DẪN BINANCE PAY',
  binance_step1: '1. Mở Binance App',
  binance_step2: '2. Vào Binance Pay',
  binance_step3: '3. Chọn "Send"',
  binance_step4: '4. Nhập Binance ID: *{id}*',
  binance_step5: '5. Số tiền: *{amount}*',
  binance_step6: '6. Ghi chú (*QUAN TRỌNG*): *{note}*',
  binance_step7: '7. Xác nhận gửi',
  bank_info: '🏦 THÔNG TIN CHUYỂN KHOẢN',
  bank_name: '• NH: {name}',
  bank_account: '• STK: {account}',
  bank_owner: '• Chủ TK: {owner}',
  payment_note: '• Nội dung: {code}',
  scan_qr: '📲 Quét QR để thanh toán',
  order_expires: '⏳ Đơn hết hạn sau 20 phút',
  payment_warning: '⚠️ PHẢI nhập đúng nội dung để hệ thống tự động xác nhận!',

  // Payment result
  payment_success: '✅ THANH TOÁN THÀNH CÔNG!',
  payment_pending: '❄️ Chưa nhận được thanh toán! Thử lại sau.',

  // Accounts delivery
  accounts_title: '🔑 TÀI KHOẢN:',
  change_password: '⚠️ Đổi mật khẩu ngay!',
  buy_more: '🛒 Mua thêm? Gõ /menu',

  // Profile
  profile_title: 'HỒ SƠ CỦA BẠN',
  profile_id: '🆔 ID: {id}',
  profile_name: '✨ Tên: {name}',
  profile_username: '📧 Username: {username}',
  no_username: 'Chưa có',
  balance_section: 'SỐ DƯ',
  stats_section: 'THỐNG KÊ',
  completed_orders: '🛍️ Đơn hoàn thành: {count}',
  balance_spent_label: 'Đã chi tiêu (Balance): {amount}',
  credits_spent_label: '🎁 Đã chi tiêu (Credits): {amount}',

  // Balance
  balance_title: '💰 SỐ DƯ CỦA BẠN',
  current_balance: 'Balance: {amount}',
  current_credits: '🎁 Xu free: {amount}',
  total_balance: '📊 Tổng: {amount}',

  // Deposit
  deposit_title: 'NẠP TIỀN',
  deposit_current: 'Số dư hiện tại: {amount}',
  select_deposit_method: '⛄ Chọn phương thức nạp:',
  deposit_binance: 'Binance Pay (USDT)',
  deposit_bank: '🏦 Chuyển khoản ngân hàng',
  deposit_amount_title: 'NẠP TIỀN - {method}',
  deposit_currency: '💱 Đơn vị: {currency}',
  select_amount: '⛄ Chọn số tiền muốn nạp:',
  enter_amount: '📝 Nhập số tiền muốn nạp:',
  invalid_amount: '✖️ Số tiền không hợp lệ!',
  min_amount: '✖️ Số tiền tối thiểu là {amount}!',
  deposit_success: '✅ NẠP TIỀN THÀNH CÔNG!\n\n💰 Đã cộng {amount} vào tài khoản!',
  deposit_success_with_bonus: '✅ Nạp tiền thành công!\n\n💰 Đã cộng {amount} {currency} vào tài khoản!\n\n🎁 THƯỞNG:',
  deposit_bonus_item: '• {eventName}: +{amount} xu',
  deposit_not_found: '✖️ Không tìm thấy yêu cầu nạp tiền!',
  expires_30_min: '⏳ Hết hạn sau {minutes} phút',

  // Admin notifications
  admin_new_deposit: '💰 NẠP TIỀN MỚI\n👤 User: {userId}\n{amount} {currency}\n📱 {method}',

  // Credits / Referral
  credits_title: 'XU FREE',
  credits_current: 'Xu hiện có: {amount}',
  how_to_earn: 'CÁCH KIẾM XU FREE',
  earn_referral: '• Giới thiệu bạn bè: +{amount} xu/người (nạp tối thiểu {min})',
  earn_referee: '• Được giới thiệu: +{amount} xu (nhận ngay)',
  earn_events: '• Sự kiện đặc biệt',
  referral_code: 'Mã giới thiệu: {code}',
  total_referrals: 'Đã giới thiệu: {count} người',
  total_earned: 'Đã nhận: {amount}',
  my_referral_btn: '🔗 Mã giới thiệu của tôi',
  my_referrals_btn: '👥 Danh sách đã giới thiệu',
  enter_referral_btn: '🎁 Nhập mã giới thiệu',

  // Referral details
  referral_title: '🎁 CHƯƠNG TRÌNH GIỚI THIỆU',
  referral_link: '📎 Link giới thiệu:',
  referral_stats: '📊 THỐNG KÊ',
  referral_rewards: '🎯 PHẦN THƯỞNG',
  referrer_bonus: '• Người giới thiệu: +{amount} xu',
  referee_bonus: '• Người được giới thiệu: +{amount} xu',
  min_deposit_bonus: '(Khi nạp tối thiểu {amount})',
  copy_link_btn: '📋 Sao chép link',

  my_referral_title: '🔗 MÃ GIỚI THIỆU CỦA BẠN',
  referral_code_label: '📋 Mã: {code}',
  referral_link_label: '🔗 Link giới thiệu:\n{link}',
  share_referral: '📤 Chia sẻ link này cho bạn bè để nhận xu thưởng!',

  referrals_list_title: '👥 DANH SÁCH ĐÃ GIỚI THIỆU',
  no_referrals: '⛄ Chưa giới thiệu ai!\n\nChia sẻ mã giới thiệu để nhận xu thưởng!',
  referrals_total: '📊 Tổng: {count} người',
  referral_spent: '{name} - Chi tiêu: {amount}',
  and_more: '\n... và {count} người khác',

  enter_referral_title: '📝 NHẬP MÃ GIỚI THIỆU',
  enter_code_prompt: '✏️ Nhập mã giới thiệu của bạn bè:',
  already_has_referrer: '❌ Bạn đã có người giới thiệu rồi!',
  invalid_referral: '❌ Mã giới thiệu không hợp lệ!',
  referral_success: '✅ Đã liên kết với {name}. Bạn nhận được {amount} xu free!',

  // History
  history_title: 'LỊCH SỬ MUA HÀNG',
  no_history: '📋 Chưa có lịch sử mua hàng!',
  order_status: {
    completed: '✅',
    pending: '⏳',
    expired: '⌛',
    cancelled: '❌'
  },

  // Language selection
  language_title: '🌐 CHỌN NGÔN NGỮ',
  language_changed: '✅ Đã đổi ngôn ngữ sang Tiếng Việt!',

  // Broadcast
  broadcast_prefix: '📣 Thông báo:',

  // Admin commands
  admin_user_not_found: '❌ User không tồn tại!',
  admin_balance_added: '✅ Đã cộng {amount} cho user {name} ({id})',
  admin_balance_added_notify: '🎁 Admin đã cộng {amount} vào tài khoản của bạn!',
  admin_credits_added: '✅ Đã cộng {amount} xu cho user {name} ({id})',
  admin_credits_added_notify: '🎁 Admin đã cộng {amount} xu free vào tài khoản của bạn!',
  admin_clearing_messages: '⏳ Đang xóa tin nhắn...',
  admin_messages_cleared: '🎯 Đã xóa {count} tin nhắn!',
  admin_event_type_error: '❌ Type phải là: promo, welcome, deposit, purchase',
  admin_event_created: '✅ Đã tạo sự kiện #{id}\n\n📋 {name}\n🎯 +{amount} xu\n{code}',
  admin_event_error: '❌ Lỗi tạo sự kiện: {error}',
  admin_no_orders: '📦 ĐƠN HÀNG\n━━━━━━━━━━━━━━━━━━━━━\n\n⛄ Chưa có đơn hàng nào!',
  admin_broadcasting: '⏳ Đang gửi thông báo đến {count} users...'
};
