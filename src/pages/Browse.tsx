import { useState, useEffect } from "react";
import { databases } from "../lib/appwrite";
import { Loader2, ServerCrash, Compass } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { VideoCard } from "../components/VideoCard";
import { getOptimizedThumbnail } from "../lib/cloudinary";

export default function Browse() {
  const { t, language } = useLanguage();
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        if (dbId && colId) {
          const response = await databases.listDocuments(dbId, colId);
          const formatted = response.documents.map((v: any) => ({
            id: v.$id,
            uploaderId: v.uploaderId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
            channelName: v.uploaderName,
            channelAvatar: v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
            views: v.views || 0,
            uploadDate: t('video_recently'),
            category: v.category || 'Uncategorized',
            contentType: v.contentType || 'video',
            verified: v.verified || false,
            description: v.description || ''
          }));
          setDbVideos(formatted.reverse());
        }
      } catch (err) {
        console.warn("Browse fetch failed:", err);
        setError(
          language === 'ru'
            ? "Не удалось загрузить категории. Проверьте подключение."
            : "Failed to load categories. Please check your connection."
        );
        setDbVideos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [language]);

  const categories = dbVideos.reduce((acc: Record<string, number>, v: any) => {
    const cat = v.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categories).sort(([a], [b]) => a.localeCompare(b));

  const filteredVideos = selectedCategory
    ? dbVideos.filter(v => (v.category || 'Uncategorized') === selectedCategory)
    : [];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-0 pb-4 sm:pb-0">
      {isLoading ? (
        <div className="flex justify-center flex-col gap-4 items-center h-64 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
          <span>{t('video_connecting')}</span>
        </div>
      ) : error && dbVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
          <ServerCrash className="w-12 h-12 text-red-400 mb-4" />
          <p>{error}</p>
        </div>
      ) : !selectedCategory ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-4 sm:px-0">
            <span className="text-[#70d6ff]">{t('nav_browse') || 'Browse Categories'}</span>
          </h2>
          {categoryEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Compass className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white mb-2">{t('hero_no_videos')}</h2>
              <p className="text-slate-400">{t('hero_upload_prompt')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 sm:px-0">
              {categoryEntries.map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white/5 border ice-border rounded-2xl p-6 text-left hover:border-[#70d6ff]/30 hover:shadow-[0_0_15px_rgba(112,214,255,0.05)] hover:bg-white/[0.02] transition-all duration-300 group"
                >
                  <h3 className="text-lg font-bold text-white group-hover:text-[#70d6ff] transition-colors">{cat}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {count} {count === 1 ? (language === 'ru' ? 'видео' : 'video') : (language === 'ru' ? 'видео' : 'videos')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 px-4 sm:px-0 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-colors bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
            >
              {language === 'ru' ? '← Все категории' : '← All Categories'}
            </button>
            <span className="text-lg font-bold text-white">{selectedCategory}</span>
          </div>
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-2 sm:gap-y-8 gap-x-4 px-0 sm:px-0">
              {filteredVideos.map((video: any) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p className="text-xl font-medium">{t('video_no_results')}</p>
              <p className="text-sm mt-2 text-slate-500">{t('video_search_try_again')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
