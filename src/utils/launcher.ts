/**
 * Ключевые слова и суффиксы для определения portable-версий архивов/файлов.
 * Вы можете свободно дополнять этот массив любыми названиями (например, 'port', 'portable', 'standalone' и т.д.)
 */
export const PORTABLE_KEYWORDS: string[] = [
  'portable',
  'port',
  'standalone',
  'no-install',
  'noinstall',
  'without-install',
];

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size?: number;
}

/**
 * Проверка файла на принадлежность к portable-версии.
 * Перебирает ключевые слова из массива PORTABLE_KEYWORDS.
 */
export function isPortableAsset(fileName: string, keywords: string[] = PORTABLE_KEYWORDS): boolean {
  const lower = fileName.toLowerCase();

  return keywords.some(keyword => {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return false;

    // 1. Проверка как отдельного фрагмента/слова с типовыми разделителями (-, _, ., пробел, начало/конец строки)
    // Например: RiseAndFall-launcher-port.zip, launcher_port_v0.2.0.exe, launcher.portable.zip
    const boundaryRegex = new RegExp(`(^|[._\\-\\s])${kw}([._\\-\\s]|$)`, 'i');
    if (boundaryRegex.test(lower)) {
      return true;
    }

    // 2. Для длинных слов (от 4 букв, таких как 'portable') проверяем прямое вхождение подстроки
    if (kw.length >= 4 && lower.includes(kw)) {
      return true;
    }

    return false;
  });
}

/**
 * Проверка на файлы, которые не являются установщиками лаунчера:
 * исходный код (GitHub по стандарту генерирует tar.gz и zip), контрольные суммы, подписи и документация.
 */
export function isIgnoredAsset(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  // Исходный код
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz') || lower.endsWith('.tar')) return true;
  if (lower.includes('source') || lower.includes('src-code')) return true;

  // Контрольные суммы и подписи
  if (lower.endsWith('.sha256') || lower.endsWith('.md5') || lower.endsWith('.sig') || lower.endsWith('.asc')) return true;

  // Текстовые и конфигурационные файлы
  if (lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.yml') || lower.endsWith('.yaml')) return true;

  return false;
}

/**
 * Оценка приоритета установщика:
 * - Если в названии есть setup/installer/install — наивысший приоритет
 * - Если прямой исполняемый файл .exe — выше, чем .zip
 * - Если чистый .zip архив установщика — базовый приоритет
 */
export function getInstallerScore(fileName: string): number {
  const lower = fileName.toLowerCase();
  let score = 0;

  if (lower.includes('setup') || lower.includes('installer') || lower.includes('install')) {
    score += 50;
  }

  if (lower.endsWith('.exe')) {
    score += 30;
  } else if (lower.endsWith('.msi')) {
    score += 25;
  } else if (lower.endsWith('.zip')) {
    score += 10;
  }

  return score;
}

/**
 * Находит нужный установщик среди ассетов релиза:
 * 1. Отсекает исходники и метаданные
 * 2. Отсекает portable-версии по перебору ключевых слов
 * 3. Выбирает установщик (.exe или .zip без portable)
 */
export function findInstallerAsset(
  assets: ReleaseAsset[],
  portableKeywords: string[] = PORTABLE_KEYWORDS
): ReleaseAsset | null {
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return null;
  }

  // 1. Исключаем исходники и служебные файлы
  const binaries = assets.filter(asset => !isIgnoredAsset(asset.name));

  // 2. Исключаем portable-версии (перебором ключевых слов)
  const nonPortable = binaries.filter(asset => !isPortableAsset(asset.name, portableKeywords));

  // 3. Выбираем файлы с поддерживаемыми расширениями установщика (.exe, .zip, .msi)
  const candidates = nonPortable.filter(asset => {
    const lower = asset.name.toLowerCase();
    return lower.endsWith('.exe') || lower.endsWith('.zip') || lower.endsWith('.msi');
  });

  if (candidates.length === 0) {
    // Резервный вариант, если среди оставшихся нет явного разделения
    const fallback = binaries.find(asset => {
      const lower = asset.name.toLowerCase();
      return lower.endsWith('.exe') || lower.endsWith('.zip');
    });
    return fallback || null;
  }

  // 4. Сортируем по приоритету инсталлятора
  candidates.sort((a, b) => getInstallerScore(b.name) - getInstallerScore(a.name));

  return candidates[0];
}

const GITHUB_REPO = 'kotop21/RiseAndFall---launcher';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_KEY = 'raf_launcher_download_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут

/**
 * Клиентский скрипт для динамического обновления кнопок "Скачать лаунчер".
 * Загружается асинхронно, не блокируя отрисовку страницы и моментальную загрузку.
 */
export function initLauncherDownload() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const buttons = document.querySelectorAll<HTMLAnchorElement>('[data-download-launcher]');
  if (!buttons.length) return;

  function updateButtons(downloadUrl: string, fileName?: string, tag?: string) {
    buttons.forEach(btn => {
      btn.href = downloadUrl;
      if (fileName) {
        btn.setAttribute('download', fileName);
        btn.setAttribute('title', `Скачать ${fileName}${tag ? ` (${tag})` : ''}`);
      }
    });
  }

  // 1. Быстрая подстановка из кэша (0 миллисекунд)
  let isCachedFresh = false;
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached && cached.url && (Date.now() - (cached.timestamp || 0) < CACHE_TTL_MS)) {
        updateButtons(cached.url, cached.name, cached.tag);
        isCachedFresh = true;
      }
    }
  } catch (_) {
    // В случае отключенного localStorage в приватном режиме продолжаем без кэша
  }

  // 2. Фоновый асинхронный запрос к GitHub API для динамического чека последнего релиза
  let fetchPromise: Promise<string | null> | null = null;

  async function fetchLatest(): Promise<string | null> {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!response.ok) return null;
      const releaseData = await response.json();

      const installer = findInstallerAsset(releaseData.assets, PORTABLE_KEYWORDS);
      if (installer) {
        updateButtons(installer.browser_download_url, installer.name, releaseData.tag_name);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            url: installer.browser_download_url,
            name: installer.name,
            tag: releaseData.tag_name,
            timestamp: Date.now()
          }));
        } catch (_) {}

        return installer.browser_download_url;
      }
    } catch (e) {
      console.warn('Не удалось загрузить данные о последнем релизе:', e);
    }
    return null;
  }

  // Если кэша нет или он устарел — запускаем запрос в фоне
  if (!isCachedFresh) {
    fetchPromise = fetchLatest();
  }

  // 3. Обработка клика: если пользователь кликнул до завершения фонового запроса
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const href = btn.getAttribute('href') || '';
      // Если URL уже ведет на файл архива или инсталлятора, обычный клик скачивает файл
      if (href.endsWith('.zip') || href.endsWith('.exe') || href.endsWith('.msi')) {
        return;
      }

      // Если клик произошел в первые доли секунды до ответа API:
      if (fetchPromise) {
        e.preventDefault();
        try {
          const directUrl = await Promise.race([
            fetchPromise,
            new Promise<null>(resolve => setTimeout(() => resolve(null), 1200))
          ]);
          if (directUrl) {
            window.location.href = directUrl;
            return;
          }
        } catch (_) {}

        // Fallback переход на страницу релизов на случай ошибки сети/лимита API
        window.open(btn.href, '_blank', 'noopener,noreferrer');
      }
    });
  });
}
