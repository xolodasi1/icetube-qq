import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { VideoCard } from '../components/VideoCard';
import { History as HistoryIcon, Trash2, X, PlaySquare, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeStorage } from '../lib/storage';

export default function History() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts'>('videos');

  useEffect(() => {
    try {
      const savedHistory = SafeStorage.get('watch_history', []);
      setHistory(savedHistory);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRemove = (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let saved = SafeStorage.get('watch_history', []);
      saved = saved.filter((v: any) => v.id !== videoId);
      SafeStorage.set('watch_history', saved);
      setHistory(saved);
    } catch(err) {
      console.error(err);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm(t('history_clear_confirm'))) return;
    try {
      SafeStorage.set('watch_history', []);
      setHistory([]);
    } catch(err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
        <div className="flex flex-col items-center justify-center text-slate-400 py-20 px-4 mt-10 rounded-2xl border border-dashed border-white/10 ice-panel">
          <HistoryIcon className="w-16 h-16 mb-4 text-[#70d6ff] opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-2 font-display">{t('history_title')}</h2>
          <p className="text-lg font-medium text-center mb-6">
            {language === 'ru' ? 'Войдите в аккаунт, чтобы просматривать историю' : 'Register or log in to view history'}
          </p>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter(v => 
    activeTab === 'shorts' ? v.contentType === 'shorts' : (v.contentType !== 'shorts')
  );

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#70d6ff]">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            {t('history_title')}
          </h1>
        </div>
        {history.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            <span className="inline">{t('history_clear')}</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-max border border-white/10">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'videos' 
              ? 'bg-[#70d6ff] text-black shadow-lg shadow-[#70d6ff]/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PlaySquare className="w-4 h-4" />
          {language === 'ru' ? 'Видео' : 'Videos'}
        </button>
        <button
          onClick={() => setActiveTab('shorts')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'shorts' 
              ? 'bg-[#70d6ff] text-black shadow-lg shadow-[#70d6ff]/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className="w-4 h-4" />
          {language === 'ru' ? 'Шортсы' : 'Shorts'}
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-20 px-4 mt-2 rounded-2xl border border-dashed border-white/10 ice-panel">
          <HistoryIcon className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">
            {language === 'ru' ? 'История пуста' : 'History is empty'}
          </p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-[#70d6ff]/10 text-[#70d6ff] rounded-xl font-medium hover:bg-[#70d6ff]/20 transition-colors">
            {t('nav_explore')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
          {filteredHistory.map((video) => (
            <div key={video.id + video.timestamp} className="relative group">
              {activeTab === 'shorts' ? (
                <Link to={`/shorts/${video.id}`} className="block">
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                    <img 
                      src={video.thumbnailUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                       <h3 className="text-white font-medium line-clamp-2 leading-snug">{video.title}</h3>
                       <p className="text-slate-300 text-sm mt-1">{video.channelName}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <VideoCard video={video} />
              )}
              <button
                onClick={(e) => handleRemove(video.id, e)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-md border border-white/10 z-10"
                title="Remove from history"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
