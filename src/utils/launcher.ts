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

export function isPortableAsset(fileName: string, keywords: string[] = PORTABLE_KEYWORDS): boolean {
  const lower = fileName.toLowerCase();

  return keywords.some(keyword => {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return false;

    const boundaryRegex = new RegExp(`(^|[._\\-\\s])${kw}([._\\-\\s]|$)`, 'i');
    if (boundaryRegex.test(lower)) {
      return true;
    }

    if (kw.length >= 4 && lower.includes(kw)) {
      return true;
    }

    return false;
  });
}

export function isIgnoredAsset(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz') || lower.endsWith('.tar')) return true;
  if (lower.includes('source') || lower.includes('src-code')) return true;

  if (lower.endsWith('.sha256') || lower.endsWith('.md5') || lower.endsWith('.sig') || lower.endsWith('.asc')) return true;

  if (lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.yml') || lower.endsWith('.yaml')) return true;

  return false;
}

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

export function findInstallerAsset(
  assets: ReleaseAsset[],
  portableKeywords: string[] = PORTABLE_KEYWORDS
): ReleaseAsset | null {
  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    return null;
  }

  const binaries = assets.filter(asset => !isIgnoredAsset(asset.name));

  const nonPortable = binaries.filter(asset => !isPortableAsset(asset.name, portableKeywords));

  const candidates = nonPortable.filter(asset => {
    const lower = asset.name.toLowerCase();
    return lower.endsWith('.exe') || lower.endsWith('.zip') || lower.endsWith('.msi');
  });

  if (candidates.length === 0) {
    const fallback = binaries.find(asset => {
      const lower = asset.name.toLowerCase();
      return lower.endsWith('.exe') || lower.endsWith('.zip');
    });
    return fallback || null;
  }

  candidates.sort((a, b) => getInstallerScore(b.name) - getInstallerScore(a.name));

  return candidates[0];
}

const GITHUB_REPO = 'kotop21/RiseAndFall---launcher';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_KEY = 'raf_launcher_download_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

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
  } catch (_) {}

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

  if (!isCachedFresh) {
    fetchPromise = fetchLatest();
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const href = btn.getAttribute('href') || '';
      if (href.endsWith('.zip') || href.endsWith('.exe') || href.endsWith('.msi')) {
        return;
      }

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

        window.open(btn.href, '_blank', 'noopener,noreferrer');
      }
    });
  });
}
