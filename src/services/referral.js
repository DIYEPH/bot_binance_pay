// Referral service
const User = require('../database/models/user');
const Transaction = require('../database/models/transaction');
const Wallet = require('./wallet');
const db = require('../database/index');

async function getConfig() {
  const result = await db.query('SELECT * FROM referral_config WHERE id = 1');
  if (!result.length || !result[0].values.length) {
    return {
      bonus_type: 'credits',
      referrer_bonus: 1,    
      referee_bonus: 0.5,   
      min_deposit_for_bonus: 1
    };
  }
  
  const row = result[0].values[0];
  return {
    bonus_type: row[1],
    referrer_bonus: row[2],
    referee_bonus: row[3],
    min_deposit_for_bonus: row[4]
  };
}

async function processReferral(userId, referralCode) {
  if (!referralCode) return { success: false, message: 'No referral code' };
  
  const referrer = await User.getByReferralCode(referralCode);
  if (!referrer) return { success: false, message: 'Invalid referral code' };
  if (referrer.id === userId) return { success: false, message: 'Cannot refer yourself' };
  
  const user = await User.getById(userId);
  if (user && user.referred_by) return { success: false, message: 'Already has referrer' };
  
  if (!await User.setReferrer(userId, referrer.id)) return { success: false, message: 'Failed to set referrer' };
  
  const config = await getConfig();

  if (config.referee_bonus > 0) {
    await Wallet.addCredits(userId, config.referee_bonus, Transaction.TYPES.REFERRAL_BONUS, `Welcome bonus for using referral code`);
  }
  
  if (config.min_deposit_for_bonus === 0 && config.referrer_bonus > 0) {
    await Wallet.addCredits(referrer.id, config.referrer_bonus, Transaction.TYPES.REFERRAL_BONUS, `Referral bonus from user ${userId}`);
  }
  
  return { success: true, referrer, bonus: config.referee_bonus };
}

async function processReferrerBonus(userId, depositAmount) {
  const config = await getConfig();
  if (depositAmount < config.min_deposit_for_bonus) return null;
  
  const user = await User.getById(userId);
  if (!user || !user.referred_by) return null;
  
  const totalDeposits = await Transaction.getTotalDeposits(userId);
  if (totalDeposits - depositAmount >= config.min_deposit_for_bonus) return null;
  
  const referrer = await User.getById(user.referred_by);
  if (!referrer) return null;
  
  await Wallet.addCredits(referrer.id, config.referrer_bonus, Transaction.TYPES.REFERRAL_BONUS, `Referral bonus from user ${userId}`);
  
  return { referrerId: referrer.id, referrerName: referrer.first_name, bonus: config.referrer_bonus };
}

async function getReferralInfo(userId) {
  const user = await User.getById(userId);
  if (!user) return null;
  
  const referrals = await User.getReferrals(userId);
  const config = await getConfig();
  const result = await db.query(`
    SELECT SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND type = 'referral'
  `, [userId]);
  
  const totalEarned = result[0]?.values[0][0] || 0;
  
  return {
    referralCode: user.referral_code,
    referralLink: `https://t.me/${process.env.BOT_USERNAME}?start=ref_${user.referral_code}`,
    referrals: referrals,
    totalReferrals: referrals.length,
    totalEarned,
    config
  };
}

module.exports = { processReferral, processReferrerBonus, getReferralInfo };
