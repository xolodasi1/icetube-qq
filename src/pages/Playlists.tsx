import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { VideoCard } from '../components/VideoCard';
import { Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Playlists() {
  const { t, language } = useLanguage();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<any | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user_playlists') || '[]');
      setPlaylists(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить этот плейлист?' : 'Are you sure you want to delete this playlist?')) return;
    try {
      const saved = playlists.filter(pl => pl.id !== id);
      localStorage.setItem('user_playlists', JSON.stringify(saved));
      setPlaylists(saved);
      if (activePlaylist?.id === id) setActivePlaylist(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromPlaylist = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePlaylist) return;
    try {
      const newVideos = activePlaylist.videos.filter((v: any) => v.id !== videoId);
      const updatedPlaylist = { ...activePlaylist, videos: newVideos };
      const updatedPlaylists = playlists.map(pl => pl.id === activePlaylist.id ? updatedPlaylist : pl);
      localStorage.setItem('user_playlists', JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
      setActivePlaylist(updatedPlaylist);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0 flex flex-col lg:flex-row gap-6">
      
      {/* Sidebar - Playlist List */}
      <div className="w-full lg:w-80 border ice-border rounded-2xl bg-[#0a192f] overflow-hidden flex flex-col shrink-0 lg:h-[calc(100vh-120px)] lg:sticky top-24">
        <div className="p-4 border-b ice-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-display">
            {t('nav_playlists')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
          {playlists.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              {language === 'ru' ? 'У вас нет плейлистов.' : 'You have no playlists.'}
            </div>
          ) : (
            playlists.map(pl => (
              <div 
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className={`flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-colors ${activePlaylist?.id === pl.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-200 line-clamp-1">{pl.name}</h3>
                  <button onClick={(e) => handleDeletePlaylist(pl.id, e)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  {pl.videos.length} {language === 'ru' ? 'видео' : 'videos'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Videos in Active Playlist */}
      <div className="flex-1 min-w-0">
        {!activePlaylist ? (
           <div className="flex flex-col items-center justify-center text-slate-400 py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
            <h3 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Выберите плейлист' : 'Select a playlist'}</h3>
            <p>{language === 'ru' ? 'Выберите плейлист из списка слева, чтобы просмотреть его содержимое.' : 'Select a playlist from the list on the left to view its contents.'}</p>
           </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between border-b ice-border pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">
                  {activePlaylist.name}
                </h1>
                <p className="text-sm text-slate-400">{activePlaylist.videos.length} {language === 'ru' ? 'видео' : 'videos'}</p>
              </div>
              {activePlaylist.videos.length > 0 && (
                <Link 
                  to={`/watch/${activePlaylist.videos[0].id}`}
                  className="flex items-center gap-2 bg-[#70d6ff] text-[#05070a] px-5 py-2.5 rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{language === 'ru' ? 'Смотреть всё' : 'Play All'}</span>
                </Link>
              )}
            </div>

            {activePlaylist.videos.length === 0 ? (
              <div className="text-center py-20 text-slate-400 ice-panel rounded-2xl rounded-2xl border border-dashed border-white/10">
                {language === 'ru' ? 'В этом плейлисте пока нет видео.' : 'There are no videos in this playlist yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activePlaylist.videos.map((video: any) => (
                  <div key={video.id} className="relative group">
                    <VideoCard video={video} />
                    <button
                      onClick={(e) => handleRemoveFromPlaylist(video.id, e)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-md border border-white/10 z-10"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
