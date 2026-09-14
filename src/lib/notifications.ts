import { databases, Permission, Role } from './appwrite';
import { ID } from 'appwrite';

export const createNotification = async (params: {
  userId: string; // The person receiving the notification
  actorId: string; // The person doing the action
  actorName: string;
  actorAvatar?: string;
  type: 'like' | 'snowflake' | 'comment' | 'reply' | 'subscribe' | 'upload' | 'verify' | 'mention';
  videoId?: string;
  videoTitle?: string;
  contentType?: 'video' | 'shorts' | 'photo';
  commentId?: string;
}) => {
  if (params.userId === params.actorId) return; // Don't notify yourself

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const notifCol = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

  if (!dbId || !notifCol) return;

  try {
    const permissions = params.userId ? [
      Permission.read(Role.any()),
      Permission.update(Role.user(params.userId)),
      Permission.delete(Role.user(params.userId))
    ] : [
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any())
    ];

    const base: any = {
      userId: params.userId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorAvatar: params.actorAvatar,
      type: params.type,
      videoId: params.videoId,
      videoTitle: params.videoTitle,
      contentType: params.contentType || 'video',
      isRead: false
    };
    try {
      // commentId — опциональная колонка; если её нет, пишем без неё
      await databases.createDocument(dbId, notifCol, ID.unique(), params.commentId ? { ...base, commentId: params.commentId } : base, permissions);
    } catch (err: any) {
      if (params.commentId && String(err?.message || '').toLowerCase().includes('unknown attribute')) {
        await databases.createDocument(dbId, notifCol, ID.unique(), base, permissions);
      } else {
        throw err;
      }
    }
    try { window.dispatchEvent(new Event('icetube_refresh_notifications')); } catch {}
  } catch (err) {
    console.warn("Failed to create notification (Appwrite permissions block):", err);
  }
};
