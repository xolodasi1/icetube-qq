import { databases } from './appwrite';
import { Query } from 'appwrite';

// Общие настройки сайта в коллекции `settings` (создаётся вручную, см. подсказку в админке).
// Каждый параметр — документ с ID = ключ и полем data (JSON-строка).
// Ключи: 'announcement' | 'categories' | 'promo'

const cache = new Map<string, { at: number; value: any }>();
const TTL = 60_000;

function colId(): string {
  return import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID || 'settings';
}

export function settingsMissingHint(): string {
  return 'settings';
}

export async function getSetting(key: string): Promise<any | null> {
  try {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.value;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    if (!dbId) return null;
    const doc = await databases.getDocument(dbId, colId(), key).catch(() => null);
    if (!doc) return null;
    let value: any = null;
    try {
      value = typeof (doc as any).data === 'string' ? JSON.parse((doc as any).data) : (doc as any).data;
    } catch {
      value = (doc as any).data;
    }
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

/** Возвращает { ok:false, missing:true } если нет коллекции settings. */
export async function setSetting(key: string, value: any): Promise<{ ok: boolean; missing?: boolean }> {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    if (!dbId) return { ok: false, missing: true };
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      await databases.updateDocument(dbId, colId(), key, { data });
    } catch (err: any) {
      if (err?.code === 404) {
        const { ID } = await import('appwrite');
        try {
          await databases.createDocument(dbId, colId(), key === '' ? ID.unique() : key, { data });
        } catch (createErr: any) {
          if (createErr?.code === 404) return { ok: false, missing: true };
          throw createErr;
        }
      } else {
        throw err;
      }
    }
    cache.set(key, { at: Date.now(), value });
    return { ok: true };
  } catch (err: any) {
    if (err?.code === 404) return { ok: false, missing: true };
    console.warn('setSetting failed:', err);
    return { ok: false };
  }
}

export function clearSettingsCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

// ---- Типы настроек ----

export interface AnnouncementSetting {
  text: string;
  active: boolean;
  updatedAt?: number;
}

export interface CategoriesSetting {
  hidden: string[];
  order: string[];
  renames: Record<string, string>;
}

export interface PromoSetting {
  videoIds: string[];
}
