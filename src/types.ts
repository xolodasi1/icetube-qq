export type ContentType = 'video' | 'shorts' | 'photo';

export interface Video {
  id: string;
  uploaderId?: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  channelName: string;
  channelHandle?: string;
  channelAvatar: string;
  views: number;
  uploadDate: string; // $createdAt
  createdAt?: string;
  duration?: string;
  description?: string;
  category: string;
  contentType?: ContentType;
  verified?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  text: string;
  likes: number;
  likedBy: string[];
  dislikedBy: string[];
  parentId: string | null;
  $createdAt: string;
  ts?: string;
}

export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt?: string;
  _appwrite?: boolean;
}