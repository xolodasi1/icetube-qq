import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { databases } from '../../lib/appwrite';
import { Loader2, Play, Lock, Globe } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { VideoCard } from '../../components/VideoCard';
import { playlistsCol, resolvePlaylistVideos } from '../../lib/playlists';

export default function PublicPlaylist() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [pl, setPl] = useState<any | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [state, setState] = useState<'loading' | 'denied' | 'missing' | 'ok'>('loading');

  useEffect(() => {
    if (!id) { setState('missing'); return; }
    (async () => {
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        if (!dbId) { setState('missing'); return; }
        const doc: any = await databases.getDocument(dbId, playlistsCol(), id);
        if (!doc.isPublic && doc.ownerId !== user?.$id) {
          setState('denied');
          return;
        }
        setPl(doc);
        setVideos(await resolvePlaylistVideos(doc.videoIds || []));
        setState('ok');
      } catch (err: any) {
        console.warn('Public playlist load failed:', err);
        setState(err?.code === 404 ? 'missing' : 'denied');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state === 'loading') {
    return <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[#70d6ff]" /></div>;
  }

  if (state === 'denied') {
    return (
      <div className="flex flex-col items-center py-32 text-center px-4">
        <Lock className="w-12 h-12 text-slate-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Приватный плейлист' : 'Private playlist'}</h1>
        <p className="text-slate-400 text-sm">{language === 'ru' ? 'Автор ограничил доступ.' : 'The author restricted access.'}</p>
      </div>
    );
  }

  if (state === 'missing' || !pl) {
    return (
      <div className="flex flex-col items-center py-32 text-center px-4">
        <h1 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Плейлист не найден' : 'Playlist not found'}</h1>
        <Link to="/" className="text-[#70d6ff] text-sm hover:underline">{t('studio_back_home')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 pb-24 animate-in fade-in duration-300">
      <div className="flex items-end justify-between border-b ice-border pb-4 mb-6 gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Globe className="w-3 h-3" /> {language === 'ru' ? 'Открытый плейлист' : 'Public playlist'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display truncate">{pl.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{videos.length} {language === 'ru' ? 'видео' : 'videos'}</p>
        </div>
        {videos.length > 0 && (
          <Link to={`/watch/${videos[0].id}`} className="flex items-center gap-2 bg-[#70d6ff] text-[#05070a] px-5 py-2.5 rounded-full font-bold hover:opacity-90 transition-opacity">
            <Play className="w-4 h-4 fill-current" />
            <span>{language === 'ru' ? 'Смотреть всё' : 'Play All'}</span>
          </Link>
        )}
      </div>
      {videos.length === 0 ? (
        <div className="text-center py-20 text-slate-400">{language === 'ru' ? 'Пока пусто.' : 'Empty yet.'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {videos.map((v: any) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
