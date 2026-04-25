import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { Download, Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Downloads() {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('downloaded_videos') || '[]');
      setVideos(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(language === 'ru' ? 'Удалить видео из скачанных?' : 'Remove video from downloads?')) return;
    try {
      const updated = videos.filter(v => v.id !== id);
      localStorage.setItem('downloaded_videos', JSON.stringify(updated));
      setVideos(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#70d6ff]">
          <Download className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          {t('page_downloads')}
        </h1>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
          <Download className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">{language === 'ru' ? 'Список скачанных видео пуст.' : 'Your downloads list is empty.'}</p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-[#70d6ff]/10 text-[#70d6ff] rounded-xl font-medium hover:bg-[#70d6ff]/20 transition-colors">
            {t('nav_explore')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
          {videos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} />
              <button
                onClick={(e) => handleRemove(video.id, e)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-md border border-white/10 z-10"
                title="Remove from downloads"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
