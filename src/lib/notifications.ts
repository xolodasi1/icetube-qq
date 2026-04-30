import { databases } from './appwrite';
import { ID } from 'appwrite';

export const createNotification = async (params: {
  userId: string; // The person receiving the notification
  actorId: string; // The person doing the action
  actorName: string;
  actorAvatar?: string;
  type: 'like' | 'snowflake' | 'comment' | 'subscribe' | 'upload';
  videoId?: string;
  videoTitle?: string;
}) => {
  if (params.userId === params.actorId) return; // Don't notify yourself

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const notifCol = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

  if (!dbId || !notifCol) return;

  try {
    await databases.createDocument(dbId, notifCol, ID.unique(), {
      userId: params.userId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorAvatar: params.actorAvatar,
      type: params.type,
      videoId: params.videoId,
      videoTitle: params.videoTitle,
      isRead: false
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};
