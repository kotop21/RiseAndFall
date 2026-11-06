export const languages = {
  ru: 'Русский',
  en: 'English',
};

export const defaultLang = 'ru';

export const ui = {
  ru: {
    'nav.home': 'Главная',
    'nav.wiki': 'Вики',
    'hero.title': 'Rise and Fall:<br>Civilizations at War',
    'hero.desc': 'Единая точка входа в мир Rise And Fall: Civilizations at War. Официальный хаб сообщества: актуальная база знаний, глобальный рейтинг игроков и пошаговые инструкции для новичков.',
    'button.download': 'Скачать лаунчер',
    'donate': 'Донат',
    'donateTooltip': 'Держится на личном железе и времени. Спасибо за поддержку!',
    'githubTooltip': 'Исходный код сайта и лаунчера полностью открыт. Изучайте, контрибьютьте и создавайте своё!',
    'discordTooltip': 'Главное сообщество Rise & Fall: 500+ игроков, турниры, дуэли и помощь новичкам!',
    'thanks.title': 'Спасибо за скачивание! ❤️',
    'thanks.desc': 'Загрузка лаунчера началась. До встречи на полях сражений Rise and Fall!',
    'thanks.skip': 'Пропустить',
  },
  en: {
    'nav.home': 'Home',
    'nav.wiki': 'Wiki',
    'hero.title': 'Rise and Fall:<br>Civilizations at War',
    'hero.desc': 'The single entry point to the world of Rise And Fall: Civilizations at War. Official community hub: up-to-date knowledge base, global player rankings, and step-by-step guides.',
    'button.download': 'Download Launcher',
    'donate': 'Donate',
    'donateTooltip': 'Runs on personal hardware & time. Thanks for supporting!',
    'githubTooltip': 'Website and launcher are 100% open source. Explore the code, contribute, and build with us!',
    'discordTooltip': 'The premier Rise & Fall community: 500+ players, matchmaking, tournaments, and 24/7 help!',
    'thanks.title': 'Thank you for downloading! ❤️',
    'thanks.desc': 'Launcher download has started. See you on the battlefields of Rise and Fall!',
    'thanks.skip': 'Skip',
  },
} as const;

export function useTranslations(lang: keyof typeof ui) {
  const validLang = (lang && ui[lang]) ? lang : defaultLang;

  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[validLang][key] || ui[defaultLang][key];
  }
}
