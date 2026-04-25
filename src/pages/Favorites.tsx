import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { Bookmark, BookmarkX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { t } = useLanguage();
  const [savedVideos, setSavedVideos] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_videos') || '[]');
      setSavedVideos(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemove = (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let saved = JSON.parse(localStorage.getItem('saved_videos') || '[]');
      saved = saved.filter((v: any) => v.id !== videoId);
      localStorage.setItem('saved_videos', JSON.stringify(saved));
      setSavedVideos(saved);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#70d6ff]">
          <Bookmark className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          {t('favorites_title')}
        </h1>
      </div>

      {savedVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-20 px-4 mt-10 rounded-2xl border border-dashed border-white/10 ice-panel">
          <BookmarkX className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">{t('favorites_empty')}</p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-[#70d6ff]/10 text-[#70d6ff] rounded-xl font-medium hover:bg-[#70d6ff]/20 transition-colors">
            {t('nav_explore')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
          {savedVideos.map((video) => (
            <div key={video.id + video.timestamp} className="relative group">
              <VideoCard video={video} />
              <button
                onClick={(e) => handleRemove(video.id, e)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-md border border-white/10"
                title="Remove from favorites"
              >
                <BookmarkX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
