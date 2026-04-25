import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { useEffect, useState } from "react";

export default function ContinueWatching() {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('watching_progress') || '{}');
      const videoArray = Object.values(saved)
        .sort((a: any, b: any) => b.timestamp - a.timestamp); // Sort by most recent
      setVideos(videoArray);
    } catch(err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 mt-8 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#70d6ff]/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#70d6ff]" />
        </div>
        <h1 className="text-2xl font-bold font-display text-white">
          {t('page_continue_watching')}
        </h1>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
          <Clock className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-slate-300 mb-2">
            {language === 'ru' ? 'Нет роликов для продолжения просмотра' : 'No videos to continue watching'}
          </h2>
          <p className="text-slate-500 max-w-sm">
            {language === 'ru' ? 'Вы еще не начали смотреть видео или досмотрели все ролики до конца.' : 'You haven\'t started any videos lately or you\'ve finished them all.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link key={video.videoId} to={`/watch/${video.videoId}`} className="group flex flex-col gap-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-[#70d6ff] text-black rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-[0_0_20px_rgba(112,214,255,0.4)]">
                    <Clock className="w-6 h-6 ml-0.5" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                  <div 
                    className="h-full bg-red-600" 
                    style={{ width: `${Math.min(100, Math.max(0, video.progress * 100))}%` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 bg-slate-800 border ice-border">
                  <img src={video.channelAvatar} alt={video.channelName} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-bold text-slate-100 text-sm line-clamp-2 leading-tight group-hover:text-[#70d6ff] transition-colors">{video.title}</h3>
                  <p className="text-slate-400 text-xs mt-1 truncate hover:text-slate-300">{video.channelName}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">
                    {new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(video.views)} {language === 'ru' ? 'просмотров' : 'views'} • {video.uploadDate}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
