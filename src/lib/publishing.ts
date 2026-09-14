import { databases } from './appwrite';

/** Виден ли документ в лентах: опубликован, либо отложка со сроком, который настал. */
export function isVisibleStatus(doc: any): boolean {
  const st = (doc as any)?.status;
  if (!st || st === 'published') return true;
  if (st === 'scheduled') {
    const at = (doc as any)?.publishAt;
    if (at) {
      try {
        if (new Date(at).getTime() <= Date.now()) return true;
      } catch {}
    }
  }
  return false;
}

/** Ленивая публикация: у отложки со сроком в прошлом ставим published (best-effort). */
export async function publishDue(docs: any[]): Promise<void> {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !colId) return;
    const due = (docs || []).filter(
      (d: any) => d?.status === 'scheduled' && d?.publishAt && new Date(d.publishAt).getTime() <= Date.now()
    );
    if (due.length === 0) return;
    await Promise.all(
      due.map((d: any) => {
        d.status = 'published';
        return databases.updateDocument(dbId, colId, d.$id, { status: 'published' }).catch(() => null);
      })
    );
  } catch {}
}
