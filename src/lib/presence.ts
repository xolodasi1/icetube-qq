import { databases } from './appwrite';
import { Query } from 'appwrite';

/** Считается онлайн если lastSeen < 2 минут назад */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const isUserOnline = (lastSeen?: string | null): boolean => {
  if (!lastSeen) return false;
  const ts = new Date(lastSeen).getTime();
  if (isNaN(ts)) return false;
  const diff = Date.now() - ts;
  return diff >= 0 && diff < ONLINE_THRESHOLD_MS;
};

export const formatLastSeen = (lastSeen?: string | null, language: string = 'ru'): string => {
  if (!lastSeen) return language === 'ru' ? 'давно' : 'long ago';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (isNaN(diff) || diff < 0) return language === 'ru' ? 'только что' : 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return language === 'ru' ? 'только что' : 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return language === 'ru' ? `${min} мин. назад` : `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return language === 'ru' ? `${h} ч. назад` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return language === 'ru' ? `${d} д. назад` : `${d}d ago`;
  return new Date(lastSeen).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
};

/**
 * Heartbeat: обновляет lastSeen в профиле.
 * Пытается обновить документ по ID = userId, fallback — поиск по userId.
 * Если атрибутов lastSeen/isOnline нет в коллекции — тихо игнорирует (нужно добавить в Appwrite).
 */
export const updatePresence = async (userId: string): Promise<void> => {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const colId = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
  if (!dbId || !colId || !userId) return;

  const now = new Date().toISOString();

  // 1. Попытка прямого обновления по ID
  try {
    await databases.updateDocument(dbId, colId, userId, {
      lastSeen: now,
    } as any);
    return;
  } catch (e: any) {
    const msg = (e?.message || '').toLowerCase();
    // Если атрибут отсутствует — не спамим, просто выходим
    if (msg.includes('unknown attribute') && msg.includes('lastseen')) {
      console.warn('[presence] Добавьте атрибут lastSeen (datetime) в коллекцию profiles/users для онлайн-статуса');
      return;
    }
    // 404 — пробуем поиск по userId
    if (e?.code !== 404) {
      // для других ошибок (400 unknown attribute) уже вышли, для остальных пробуем fallback
      if (!msg.includes('unknown attribute')) {
        // продолжаем к fallback
      } else {
        return;
      }
    }
  }

  // 2. Fallback: ищем документ где userId == userId
  try {
    const res = await databases.listDocuments(dbId, colId, [Query.equal('userId', userId), Query.limit(1)]);
    if (res.documents.length > 0) {
      const doc = res.documents[0] as any;
      await databases.updateDocument(dbId, colId, doc.$id, {
        lastSeen: now,
      } as any);
    }
  } catch (e: any) {
    const msg = (e?.message || '').toLowerCase();
    if (msg.includes('unknown attribute') && msg.includes('lastseen')) {
      console.warn('[presence] lastSeen attribute missing in Appwrite');
    } else {
      console.debug('[presence] update fallback failed', e?.message);
    }
  }
};
