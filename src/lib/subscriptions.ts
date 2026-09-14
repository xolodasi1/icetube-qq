import { databases } from './appwrite';
import { Query } from 'appwrite';

/** True, если документ канала принадлежит пользователю (новый и legacy форматы). */
export function isOwnChannelDoc(doc: any, userId: string): boolean {
  if (!doc || !userId) return false;
  return doc.$id === userId || doc.userId === userId;
}

/**
 * Самолечение: удаляет подписки пользователя на самого себя
 * (channelId ведёт на его же канал — напрямую или через legacy doc id)
 * и откатывает накрученный счётчик подписчиков. Тихо, best-effort.
 */
export async function cleanupSelfSubscriptions(userId: string): Promise<void> {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
    const usersCol = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    if (!dbId || !subsCol || !userId) return;

    const res = await databases
      .listDocuments(dbId, subsCol, [Query.equal('subscriberId', userId), Query.limit(100)])
      .catch(() => null);
    if (!res || res.documents.length === 0) return;

    // Какие channelId реально ведут на меня
    const ownDocIds = new Set<string>([userId]);
    if (usersCol) {
      try {
        const mine = await databases
          .listDocuments(dbId, usersCol, [Query.equal('userId', userId), Query.limit(10)])
          .catch(() => ({ documents: [] as any[] }));
        mine.documents.forEach((d: any) => {
          if (d.$id) ownDocIds.add(d.$id);
        });
      } catch {}
    }

    const selfRows = res.documents.filter((d: any) => d.channelId && ownDocIds.has(d.channelId));
    if (selfRows.length === 0) return;

    await Promise.all(
      selfRows.map((d: any) => databases.deleteDocument(dbId, subsCol, d.$id).catch(() => null))
    );

    // Откат счётчика подписчиков за каждую удалённую самоподписку
    if (usersCol) {
      const byChannel = new Map<string, number>();
      selfRows.forEach((d: any) => {
        byChannel.set(d.channelId, (byChannel.get(d.channelId) || 0) + 1);
      });
      await Promise.all(
        [...byChannel.entries()].map(async ([channelId, n]) => {
          try {
            const doc = await databases.getDocument(dbId, usersCol, channelId).catch(() => null);
            if (doc) {
              await databases
                .updateDocument(dbId, usersCol, channelId, {
                  subscribersCount: Math.max(0, ((doc as any).subscribersCount || 0) - n),
                })
                .catch(() => null);
            }
          } catch {}
        })
      );
    }
  } catch {
    /* тихо — самолечение не должно ломать страницу */
  }
}
