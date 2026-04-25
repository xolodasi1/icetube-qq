import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { ThumbsUp, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '../lib/AuthContext';

export default function Liked() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
        const videosCol = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        
        if (!dbId || !likesCol || !videosCol) return;

        // 1. Get all likes by current user
        const likesRes = await databases.listDocuments(dbId, likesCol, [
          Query.equal('userId', user.$id),
          Query.equal('type', 'like'),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]);

        if (likesRes.total === 0) {
          setLikedVideos([]);
          return;
        }

        // 2. Extract video IDs
        const videoIds = likesRes.documents.map(doc => doc.videoId);
        
        if (videoIds.length === 0) {
            setLikedVideos([]);
            return;
        }

        // 3. Fetch full video details for these IDs
        // Appwrite doesn't have an "IN" operator for direct IDs list in a single batch easily if IDs exceed limit,
        // but for small sets we can use multiple equal checks or a listDocuments with multiple Query.equal
        
        // Let's fetch all videos and filter (not most efficient but works for now in this project structure)
        const videosRes = await databases.listDocuments(dbId, videosCol);
        
        const formatted = videosRes.documents
          .filter(v => videoIds.includes(v.$id))
          .map(v => ({
            id: v.$id,
            uploaderId: v.uploaderId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            channelName: v.channelName || 'User',
            channelAvatar: v.channelAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.uploaderId}`,
            views: v.views || 0,
            uploadDate: v.$createdAt,
          }))
          // Sort according to like order
          .sort((a, b) => videoIds.indexOf(a.id) - videoIds.indexOf(b.id));

        setLikedVideos(formatted);
      } catch (err) {
        console.error("Failed to fetch liked videos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedVideos();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 mt-16 sm:mt-0">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border ice-border">
          <LogIn className="w-10 h-10 text-[#70d6ff]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('liked_title')}</h1>
        <p className="text-slate-400 text-center max-w-md mb-8">
          {t('liked_login_required')}
        </p>
        <button 
          onClick={() => (window as any).loginWithGoogle?.()}
          className="px-8 py-3 bg-[#70d6ff] text-[#05070a] font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          {language === 'ru' ? 'Войти' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#70d6ff]">
          <ThumbsUp className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          {t('liked_title')}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin mb-4" />
          <p className="text-slate-400">{language === 'ru' ? 'Загрузка...' : 'Loading liked videos...'}</p>
        </div>
      ) : likedVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-20 px-4 mt-10 rounded-2xl border border-dashed border-white/10 ice-panel">
          <ThumbsUp className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">{t('liked_empty')}</p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-[#70d6ff]/10 text-[#70d6ff] rounded-xl font-medium hover:bg-[#70d6ff]/20 transition-colors">
            {t('nav_explore')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
          {likedVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
