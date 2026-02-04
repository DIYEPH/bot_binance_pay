// i18n service
const en = require('./en');
const zh = require('./zh');
const vi = require('./vi');

const languages = { en, zh, vi };
const defaultLang = 'en';
const userLangs = new Map();

function getLanguages() {
  return Object.keys(languages).map(code => ({
    code,
    name: languages[code]._name,
    flag: languages[code]._flag
  }));
}

function setUserLang(userId, langCode) {
  if (languages[langCode]) {
    userLangs.set(userId, langCode);
  }
}

function getUserLang(userId) {
  return userLangs.get(userId) || defaultLang;
}

function loadUserLangs(users) {
  users.forEach(u => {
    if (u.language && languages[u.language]) {
      userLangs.set(u.id, u.language);
    }
  });
}

function t(userId, key, params = {}) {
  const langCode = getUserLang(userId);
  const lang = languages[langCode] || languages[defaultLang];
  
  let text = key.split('.').reduce((obj, k) => obj?.[k], lang);
  if (!text && langCode !== defaultLang) text = key.split('.').reduce((obj, k) => obj?.[k], languages[defaultLang]);
  if (!text) return key;
  
  if (typeof text === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  
  return text;
}

function getTranslator(userId) {
  return (key, params = {}) => t(userId, key, params);
}

function buildLanguageKeyboard(userId) {
  const currentLang = getUserLang(userId);
  
  return getLanguages().map(lang => [{
    text: `${lang.flag} ${lang.name}${lang.code === currentLang ? ' ✓' : ''}`,
    callback_data: `lang_${lang.code}`
  }]);
}

module.exports = { languages, defaultLang, getLanguages, setUserLang, getUserLang, loadUserLangs, t, getTranslator, buildLanguageKeyboard };
