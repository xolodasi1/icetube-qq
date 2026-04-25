import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { Clock, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WatchLater() {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('watch_later') || '[]');
      setVideos(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const updated = videos.filter(v => v.id !== id);
      localStorage.setItem('watch_later', JSON.stringify(updated));
      setVideos(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm(language === 'ru' ? 'Очистить список "Смотреть позже"?' : 'Clear all Watch Later videos?')) return;
    try {
      localStorage.setItem('watch_later', '[]');
      setVideos([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Stats/Action Panel */}
        <div className="w-full md:w-80 lg:w-96 shrink-0">
          <div className="rounded-2xl ice-panel border ice-border overflow-hidden sticky top-24">
            <div className="aspect-video relative overflow-hidden group">
              {videos.length > 0 ? (
                <img src={videos[0].thumbnailUrl} alt="Watch Later" className="w-full h-full object-cover blur-sm opacity-50 scale-110" />
              ) : (
                <div className="w-full h-full bg-[#0a192f] flex items-center justify-center">
                  <Clock className="w-16 h-16 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border ice-border">
                   <Clock className="w-8 h-8 text-[#70d6ff]" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display px-6 text-center">
                  {t('watch_later_title')}
                </h1>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-400">{videos.length} {language === 'ru' ? 'видео' : 'videos'}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">
                  {language === 'ru' ? 'Обновлено сегодня' : 'Updated today'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {videos.length > 0 ? (
                  <Link 
                    to={`/watch/${videos[0].id}`}
                    className="flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-full font-bold hover:bg-slate-200 transition-colors w-full"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{language === 'ru' ? 'Смотреть всё' : 'Play all'}</span>
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 bg-white/10 text-slate-500 py-2.5 rounded-full font-bold w-full cursor-not-allowed">
                    <Play className="w-4 h-4 fill-current" />
                    <span>{language === 'ru' ? 'Смотреть всё' : 'Play all'}</span>
                  </button>
                )}
                
                {videos.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 py-2.5 rounded-full font-bold transition-all w-full border ice-border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'ru' ? 'Очистить всё' : 'Clear all'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Video List */}
        <div className="flex-1 min-w-0">
          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel text-slate-400">
               <Clock className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-center max-w-sm">{t('watch_later_empty')}</p>
               <Link to="/" className="mt-6 text-[#70d6ff] font-bold hover:underline">
                 {language === 'ru' ? 'На главную' : 'Back to explore'}
               </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
               {videos.map((video, index) => (
                 <div key={video.id} className="group relative flex gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors items-center">
                    <div className="text-slate-500 font-mono text-sm w-4 shrink-0 text-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 flex gap-4 min-w-0">
                      <div className="w-32 sm:w-44 aspect-video shrink-0">
                         <VideoCard video={video} layout="list" hideDetails />
                      </div>
                      <div className="flex flex-col min-w-0 justify-center">
                         <Link to={`/watch/${video.id}`} className="font-bold text-white line-clamp-2 hover:text-[#70d6ff] transition-colors leading-tight mb-1">
                           {video.title}
                         </Link>
                         <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                            <Link to={`/channel/${video.uploaderId}`} className="hover:text-white transition-colors">{video.channelName}</Link>
                            <span>•</span>
                            <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(video.views)} {t('video_views')}</span>
                         </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleRemove(video.id, e)}
                      className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
