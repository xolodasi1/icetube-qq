import { SafeStorage } from './storage';

// Один засчитанный просмотр на устройство в сутки для каждого видео.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORE_KEY = 'viewed_at';

function getMap(): Record<string, number> {
  try {
    return SafeStorage.get<Record<string, number>>(STORE_KEY, {}) || {};
  } catch {
    return {};
  }
}

/** Можно ли засчитать просмотр (не было засчитанного за последние сутки). */
export function shouldCountView(videoId: string): boolean {
  if (!videoId) return false;
  try {
    const map = getMap();
    const ts = map[videoId];
    if (!ts) return true;
    return Date.now() - Number(ts) > COOLDOWN_MS;
  } catch {
    return true;
  }
}

/** Запомнить, что просмотр засчитан. */
export function markViewCounted(videoId: string): void {
  if (!videoId) return;
  try {
    const map = getMap();
    map[videoId] = Date.now();
    SafeStorage.set(STORE_KEY, map);
  } catch {
    /* ignore */
  }
}

/**
 * Сколько СЕКУНД реального просмотра нужно, чтобы засчитать просмотр.
 * ~30% длительности, но не меньше 3с (шортсы) и не больше 30с (длинные видео).
 */
export function viewThreshold(durationSec: number): number {
  if (!durationSec || isNaN(durationSec) || durationSec <= 0) return 30;
  return Math.min(30, Math.max(3, durationSec * 0.3));
}
