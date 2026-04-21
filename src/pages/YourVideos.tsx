import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { VideoCard } from '../components/VideoCard';
import { Loader2, Video, AlertCircle, Plus } from 'lucide-react';
import { UploadModal } from '../components/UploadModal';
import { useLanguage } from '../lib/LanguageContext';

export default function YourVideos() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchUserVideos = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;

      if (!dbId || !colId) {
        throw new Error(language === 'ru' ? "Отсутствуют ID базы данных или коллекции." : "Missing Database or Collection IDs. Please check your admin configuration.");
      }

      const response = await databases.listDocuments(dbId, colId);
      
      const userVids = response.documents
        .filter((v: any) => v.uploaderId === user.$id)
        .map((v: any) => ({
          id: v.$id,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          channelName: v.uploaderName,
          channelAvatar: v.uploaderAvatar,
          views: v.views || 0,
          uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
          description: v.description
        }));

      setVideos(userVids.reverse());
    } catch (err: any) {
      console.error("Error fetching user videos:", err);
      setError(err.message || (language === 'ru' ? "Не удалось загрузить ваши видео." : "Failed to load your videos."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserVideos();
    }
  }, [user]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <AlertCircle className="w-16 h-16 text-slate-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('your_vids_login_req')}</h1>
        <p className="text-slate-400 max-w-sm mx-auto">
          {t('your_vids_login_desc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ice-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">{t('your_vids_title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('your_vids_subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-[#70d6ff] text-black px-6 py-3 rounded-full font-bold hover:bg-[#5bc0e6] transition-all shadow-[0_0_15px_rgba(112,214,255,0.3)] active:scale-95"
        >
          <Plus className="w-5 h-5" />
          {t('your_vids_upload_btn')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff]" />
          <span>{language === 'ru' ? 'Ищем ваши ролики во льдах...' : 'Scanning the ice for your clips...'}</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <div>
            <h2 className="text-white font-bold">{language === 'ru' ? 'Ошибка загрузки' : 'Error Loading Videos'}</h2>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
          <button 
            onClick={fetchUserVideos}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors text-slate-200"
          >
            {language === 'ru' ? 'Повторить' : 'Try Again'}
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Video className="w-12 h-12 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('hero_no_videos')}</h2>
          <p className="text-slate-400 max-w-sm mx-auto mb-8">
            {language === 'ru' ? 'Вы еще не загрузили ни одного видео на Icetube. Начните делиться моментами прямо сейчас!' : "You haven't uploaded any videos to Icetube yet. Start sharing your moments with the community!"}
          </p>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="border border-[#70d6ff]/40 text-[#70d6ff] hover:bg-[#70d6ff]/10 px-6 py-3 rounded-xl transition-all"
          >
            {language === 'ru' ? 'Опубликовать первое видео' : 'Publish your first video'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={fetchUserVideos}
      />
    </div>
  );
}
