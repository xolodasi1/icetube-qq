import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { Video, Loader2 } from 'lucide-react';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

export default function Clips() {
  const { t, language } = useLanguage();
  const [clips, setClips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        setIsLoading(true);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        
        if (!dbId || !colId) return;

        // Fetch videos with contentType clip or short
        const response = await databases.listDocuments(dbId, colId, [
           Query.orderDesc('$createdAt'),
           Query.limit(100)
        ]);
        
        const formatted = response.documents
          .filter(v => v.contentType === 'clip' || v.contentType === 'short')
          .map(v => ({
            id: v.$id,
            uploaderId: v.uploaderId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            channelName: v.uploaderName || 'User',
            channelAvatar: v.uploaderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.uploaderId}`,
            views: v.views || 0,
            uploadDate: t('video_recently'),
            duration: v.duration || '0:00'
          }));

        setClips(formatted);
      } catch (err) {
        console.error("Failed to fetch clips:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClips();
  }, [language]);

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#ff70a6]">
          <Video className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          {t('page_clips')}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin mb-4" />
          <p className="text-slate-400">{language === 'ru' ? 'Загрузка клипов...' : 'Loading clips...'}</p>
        </div>
      ) : clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
          <Video className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">{language === 'ru' ? 'Клипов пока нет. Станьте первым!' : 'No clips yet. Be the first to upload one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {clips.map((clip) => (
            <VideoCard key={clip.id} video={clip} layout="clip" />
          ))}
        </div>
      )}
    </div>
  );
}
