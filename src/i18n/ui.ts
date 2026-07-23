export const languages = {
  ru: 'Русский',
  en: 'English',
};

export const defaultLang = 'ru';

export const ui = {
  ru: {
    'nav.home': 'Главная',
    'nav.leaderboard': 'Рейтинг',
    'nav.wiki': 'Вики',
    'hero.title': 'Rise and Fall:<br>Civilizations at War',
    'hero.desc': 'Единая точка входа в мир Rise And Fall: Civilizations at War. Официальный хаб сообщества: актуальная база знаний, глобальный рейтинг игроков и пошаговые инструкции для новичков.',
    'button.download': 'Скачать лаунчер',
  },
  en: {
    'nav.home': 'Home',
    'nav.leaderboard': 'Leaderboard',
    'nav.wiki': 'Wiki',
    'hero.title': 'Rise and Fall:<br>Civilizations at War',
    'hero.desc': 'The single entry point to the world of Rise And Fall: Civilizations at War. Official community hub: up-to-date knowledge base, global player rankings, and step-by-step guides.',
    'button.download': 'Download Launcher',
  },
} as const;

export function useTranslations(lang: keyof typeof ui) {
  const validLang = (lang && ui[lang]) ? lang : defaultLang;

  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[validLang][key] || ui[defaultLang][key];
  }
}
