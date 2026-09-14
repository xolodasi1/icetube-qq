import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../language/LanguageContext';
import { VideoCard } from '../../components/VideoCard';
import { Trash2, Play, Globe, Lock, Share2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeStorage } from '../../lib/storage';
import { databases } from '../../lib/appwrite';
import { useAuth } from '../../auth/AuthContext';
import {
  loadDbPlaylists, createDbPlaylist, setDbPlaylistVideos, setDbPlaylistPublic,
  deleteDbPlaylist, importLocalPlaylists, type DbPlaylist,
} from '../../lib/playlists';

type Pl = DbPlaylist | { id: string; name: string; videos: any[]; _appwrite?: false };

export default function Playlists() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Pl[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Pl | null>(null);
  const [dbMode, setDbMode] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPlaylists = async () => {
    if (user?.$id) {
      try {
        const dbLists = await loadDbPlaylists(user.$id);
        // одноразовый перенос локальных в базу
        const local = SafeStorage.get<any[]>('user_playlists', []);
        if (local.length > 0 && dbLists.length === 0) {
          try {
            const imported = await importLocalPlaylists(user.$id, local);
            if (imported.length > 0) {
              SafeStorage.set('user_playlists', []);
              setPlaylists(imported);
              return;
            }
          } catch {}
        }
        setPlaylists(dbLists);
        setDbMode(true);
        return;
      } catch (e: any) {
        if (!e?.missing) console.warn('DB playlists unavailable, local mode', e);
      }
    }
    try {
      setPlaylists(SafeStorage.get('user_playlists', []));
    } catch (e) {
      console.error(e);
    }
    setDbMode(false);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user) return;
    if (dbMode) {
      try {
        const created = await createDbPlaylist(user.$id, name);
        setPlaylists(prev => [...prev, created]);
        setNewName('');
        return;
      } catch (err: any) {
        alert('Error: ' + (err?.message || err));
        return;
      }
    }
    const pl = { id: 'pl_' + Date.now().toString(), name, videos: [] };
    const next = [...playlists, pl];
    SafeStorage.set('user_playlists', next);
    setPlaylists(next);
    setNewName('');
  };

  const handleDeletePlaylist = async (idv: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить этот плейлист?' : 'Are you sure you want to delete this playlist?')) return;
    const playlist = playlists.find(pl => pl.id === idv);
    try {
      if (playlist && (playlist as any)._appwrite) {
        await deleteDbPlaylist(playlist as DbPlaylist);
      } else {
        SafeStorage.set('user_playlists', playlists.filter(pl => pl.id !== idv));
      }
      const saved = playlists.filter(pl => pl.id !== idv);
      setPlaylists(saved);
      if (activePlaylist?.id === idv) setActivePlaylist(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromPlaylist = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePlaylist) return;
    try {
      const newVideos = activePlaylist.videos.filter((v: any) => v.id !== videoId);
      if ((activePlaylist as any)._appwrite) {
        const ids = newVideos.map((v: any) => v.id);
        await setDbPlaylistVideos(activePlaylist as DbPlaylist, ids);
        const updated = { ...activePlaylist, videos: newVideos, videoIds: ids } as Pl;
        setPlaylists(playlists.map(pl => pl.id === activePlaylist.id ? updated : pl));
        setActivePlaylist(updated);
      } else {
        const updatedPlaylists = playlists.map(pl => pl.id === activePlaylist.id ? { ...pl, videos: newVideos } : pl);
        SafeStorage.set('user_playlists', updatedPlaylists);
        setPlaylists(updatedPlaylists);
        setActivePlaylist({ ...activePlaylist, videos: newVideos });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePublic = async (pl: Pl) => {
    if (!(pl as any)._appwrite) return;
    try {
      const next = !(pl as DbPlaylist).isPublic;
      await setDbPlaylistPublic(pl as DbPlaylist, next);
      const updated = { ...pl, isPublic: next } as Pl;
      setPlaylists(playlists.map(x => x.id === pl.id ? updated : x));
      if (activePlaylist?.id === pl.id) setActivePlaylist(updated);
    } catch (err: any) {
      alert('Error: ' + (err?.message || err));
    }
  };

  const shareLink = async (pl: Pl) => {
    const url = `${window.location.origin}/playlists/${pl.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
    } catch {
      prompt(language === 'ru' ? 'Скопируйте ссылку:' : 'Copy link:', url);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative flex flex-col lg:flex-row gap-6">

      {/* Sidebar - Playlist List */}
      <div className="w-full lg:w-80 border ice-border rounded-2xl bg-[#0a192f] overflow-hidden flex flex-col shrink-0 lg:h-[calc(100vh-120px)] lg:sticky top-24">
        <div className="p-4 border-b ice-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-display">
            {t('nav_playlists')}
          </h2>
        </div>
        <div className="p-3 border-b ice-border flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder={language === 'ru' ? 'Новый плейлист…' : 'New playlist…'}
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#70d6ff] placeholder:text-slate-500"
          />
          <button onClick={handleCreate} disabled={!newName.trim() || !user} className="p-2.5 bg-[#70d6ff] text-black rounded-xl hover:bg-white transition-colors disabled:opacity-40 shrink-0">
            <Plus className="w-4 h-4" />
          </button>
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-200 line-clamp-1 flex-1">{pl.name}</h3>
                  <button onClick={(e) => handleDeletePlaylist(pl.id, e)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{pl.videos.length} {language === 'ru' ? 'видео' : 'videos'}</span>
                  {(pl as any)._appwrite && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${(pl as DbPlaylist).isPublic ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                      {(pl as DbPlaylist).isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {(pl as DbPlaylist).isPublic ? (language === 'ru' ? 'Открыт' : 'Public') : (language === 'ru' ? 'Приват' : 'Private')}
                    </span>
                  )}
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
            <div className="flex items-end justify-between border-b ice-border pb-4 gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2 truncate">
                  {activePlaylist.name}
                </h1>
                <p className="text-sm text-slate-400">{activePlaylist.videos.length} {language === 'ru' ? 'видео' : 'videos'}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(activePlaylist as any)._appwrite && (
                  <>
                    <button
                      onClick={() => togglePublic(activePlaylist)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors"
                    >
                      {(activePlaylist as DbPlaylist).isPublic ? <Globe className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4" />}
                      {(activePlaylist as DbPlaylist).isPublic ? (language === 'ru' ? 'Открыт' : 'Public') : (language === 'ru' ? 'Сделать открытым' : 'Make public')}
                    </button>
                    {(activePlaylist as DbPlaylist).isPublic && (
                      <button
                        onClick={() => shareLink(activePlaylist)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        {language === 'ru' ? 'Поделиться' : 'Share'}
                      </button>
                    )}
                  </>
                )}
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
            </div>

            {activePlaylist.videos.length === 0 ? (
              <div className="text-center py-20 text-slate-400 ice-panel rounded-2xl border border-dashed border-white/10">
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
