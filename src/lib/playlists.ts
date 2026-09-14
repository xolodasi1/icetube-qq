import { databases } from './appwrite';
import { Query, ID, Permission, Role } from 'appwrite';

export interface DbPlaylist {
  id: string;
  name: string;
  videoIds: string[];
  videos: any[];
  isPublic: boolean;
  ownerId: string;
  createdAt?: string;
  _appwrite: true;
}

export function playlistsCol(): string {
  return import.meta.env.VITE_APPWRITE_PLAYLISTS_COLLECTION_ID || 'playlists';
}

/** Нормализация документа видео в карточку. */
export function toVideoRef(v: any): any {
  return {
    id: v.$id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    channelName: v.uploaderName || v.channelName,
    channelAvatar: v.uploaderAvatar || v.channelAvatar,
    channelHandle: v.channelHandle || '',
    uploaderId: v.uploaderId,
    views: v.views || 0,
    uploadDate: v.$createdAt || v.uploadDate,
    createdAt: v.$createdAt || v.createdAt,
    category: v.category || 'All',
    contentType: v.contentType || 'video',
    verified: v.verified || false,
    description: v.description || '',
  };
}

/** Догрузить videoRef по списку ID. */
export async function resolvePlaylistVideos(videoIds: string[]): Promise<any[]> {
  const ids = [...new Set((videoIds || []).filter(Boolean))].slice(0, 100);
  if (ids.length === 0) return [];
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosCol = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosCol) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 25) chunks.push(ids.slice(i, i + 25));
    const out: any[] = [];
    for (const ch of chunks) {
      try {
        const r = await databases.listDocuments(dbId, videosCol, [Query.equal('$id', ch), Query.limit(25)]);
        r.documents.forEach((d: any) => out.push(toVideoRef(d)));
      } catch {}
    }
    const byId = new Map(out.map((v: any) => [v.id, v]));
    return ids.map(id => byId.get(id)).filter(Boolean);
  } catch {
    return [];
  }
}

/** Мои плейлисты из базы. Бросает {missing:true}, если нет коллекции. */
export async function loadDbPlaylists(userId: string): Promise<DbPlaylist[]> {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const col = playlistsCol();
  if (!dbId || !col) throw { missing: true };
  try {
    const res = await databases.listDocuments(dbId, col, [Query.equal('ownerId', userId), Query.orderDesc('$createdAt'), Query.limit(50)]);
    const lists: DbPlaylist[] = await Promise.all(
      res.documents.map(async (d: any) => ({
        id: d.$id,
        name: d.name,
        videoIds: d.videoIds || [],
        videos: await resolvePlaylistVideos(d.videoIds || []),
        isPublic: !!d.isPublic,
        ownerId: d.ownerId,
        createdAt: d.$createdAt,
        _appwrite: true as const,
      }))
    );
    return lists;
  } catch (err: any) {
    if (err?.code === 404 || String(err?.message || '').toLowerCase().includes('unknown attribute')) throw { missing: true };
    throw err;
  }
}

export async function createDbPlaylist(userId: string, name: string): Promise<DbPlaylist> {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const col = playlistsCol();
  const doc: any = await databases.createDocument(
    dbId!, col, ID.unique(),
    { ownerId: userId, name, videoIds: [], isPublic: false },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
  return { id: doc.$id, name, videoIds: [], videos: [], isPublic: false, ownerId: userId, createdAt: doc.$createdAt, _appwrite: true };
}

export async function setDbPlaylistVideos(pl: DbPlaylist, videoIds: string[]): Promise<void> {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  await databases.updateDocument(dbId!, playlistsCol(), pl.id, { videoIds });
}

export async function setDbPlaylistPublic(pl: DbPlaylist, isPublic: boolean): Promise<void> {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const perms = isPublic
    ? [Permission.read(Role.any()), Permission.update(Role.user(pl.ownerId)), Permission.delete(Role.user(pl.ownerId))]
    : [Permission.read(Role.user(pl.ownerId)), Permission.update(Role.user(pl.ownerId)), Permission.delete(Role.user(pl.ownerId))];
  await databases.updateDocument(dbId!, playlistsCol(), pl.id, { isPublic }, perms as any);
}

export async function deleteDbPlaylist(pl: DbPlaylist): Promise<void> {
  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  await databases.deleteDocument(dbId!, playlistsCol(), pl.id);
}

/** Одноразовый перенос локальных плейлистов в базу. */
export async function importLocalPlaylists(userId: string, local: any[]): Promise<DbPlaylist[]> {
  const out: DbPlaylist[] = [];
  for (const pl of local) {
    try {
      const created = await createDbPlaylist(userId, pl.name || 'Playlist');
      const ids: string[] = [...new Set(((pl.videos || []).map((v: any) => v.id).filter(Boolean) as string[]))].slice(0, 100);
      if (ids.length > 0) {
        await setDbPlaylistVideos(created, ids);
        created.videoIds = ids;
        created.videos = await resolvePlaylistVideos(ids);
      }
      out.push(created);
    } catch {}
  }
  return out;
}
