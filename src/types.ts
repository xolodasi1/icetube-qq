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
  uploadDate: string;
  duration: string;
  description: string;
  category: string;
  contentType?: 'video' | 'shorts';
  verified?: boolean;
}