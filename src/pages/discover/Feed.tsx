import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Loader2, Rss, Trash2 } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';
import { useAuth } from '../../auth/AuthContext';
import { VideoCard } from '../../components/VideoCard';
import { RichText } from '../../components/RichText';

export default function Feed() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [reposts, setReposts] = useState<any[]>([]);
  const [videosMap, setVideosMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setMissing(false);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const repostsCol = import.meta.env.VITE_APPWRITE_REPOSTS_COLLECTION_ID || 'reposts';
        const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
        const videosCol = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        if (!dbId) { setIsLoading(false); return; }
        let authorIds: string[] | null = null;
        if (user && subsCol) {
          try {
            const subs = await databases.listDocuments(dbId, subsCol, [Query.equal('subscriberId', user.$id), Query.limit(100)]);
            authorIds = [...new Set([...subs.documents.map((d: any) => d.channelId).filter(Boolean), user.$id])];
          } catch {}
        }
        let q: any[] = [Query.orderDesc('$createdAt'), Query.limit(50)];
        if (authorIds) q = [Query.equal('authorId', authorIds), ...q];
        const res = await databases.listDocuments(dbId, repostsCol, q);
        const docs = res.documents;
        setReposts(docs);
        // подтягиваем видео для карточек
        const vids = [...new Set(docs.map((d: any) => d.videoId).filter(Boolean))];
        if (vids.length > 0 && videosCol) {
          try {
            const vres = await databases.listDocuments(dbId, videosCol, [Query.equal('$id', vids.slice(0, 50)), Query.limit(50)]);
            const map: Record<string, any> = {};
            vres.documents.forEach((v: any) => {
              map[v.$id] = {
                id: v.$id,
                uploaderId: v.uploaderId,
                title: v.title,
                thumbnailUrl: v.thumbnailUrl,
                channelName: v.uploaderName,
                channelAvatar: v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName || 'U')}`,
                views: v.views || 0,
                uploadDate: v.$createdAt,
                createdAt: v.$createdAt,
                category: v.category || 'All',
                contentType: v.contentType || 'video',
                verified: v.verified || false,
                description: v.description || ''
              };
            });
            setVideosMap(map);
          } catch {}
        }
      } catch (err: any) {
        if (err?.code === 404) setMissing(true);
        else console.warn('Feed load failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const deleteRepost = async (repostId: string) => {
    if (!window.confirm(language === 'ru' ? 'Удалить репост?' : 'Delete repost?')) return;
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const repostsCol = import.meta.env.VITE_APPWRITE_REPOSTS_COLLECTION_ID || 'reposts';
      if (!dbId) return;
      await databases.deleteDocument(dbId, repostsCol, repostId);
      setReposts(prev => prev.filter(r => r.$id !== repostId));
    } catch (err: any) {
      alert('Error: ' + (err?.message || err));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
        <Rss className="w-6 h-6 text-[#70d6ff]" />
        {t('nav_feed')}
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        {user
          ? (language === 'ru' ? 'Репосты каналов, на которые вы подписаны' : 'Reposts from your subscriptions')
          : (language === 'ru' ? 'Войдите, чтобы видеть ленту подписок. Пока — свежие репосты платформы.' : 'Sign in for your subscriptions feed. Showing latest reposts for now.')}
      </p>

      {missing ? (
        <div className="text-center py-20 text-slate-500 text-sm">
          {language === 'ru' ? 'Лента скоро появится.' : 'Feed coming soon.'}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" /></div>
      ) : reposts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Rss className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">{language === 'ru' ? 'Пока пусто. Репостните что-нибудь кнопкой «Поделиться»!' : 'Empty yet. Repost something with the Share button!'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reposts.map(r => (
            <article key={r.$id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Link to={`/channel/${r.authorId}`} className="shrink-0">
                  <img
                    src={r.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.authorName || 'U')}&background=random`}
                    alt={r.authorName} referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.authorName || 'U')}&background=random`; }}
                    className="w-10 h-10 rounded-full object-cover bg-slate-700"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/channel/${r.authorId}`} className="font-bold text-white text-sm hover:text-[#70d6ff] truncate block">{r.authorName}</Link>
                  <span className="text-[11px] text-slate-500">{r.$createdAt ? new Date(r.$createdAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                {user && user.$id === r.authorId && (
                  <button onClick={() => deleteRepost(r.$id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {r.text ? (
                <p className="text-sm text-slate-200 whitespace-pre-wrap break-words mb-3"><RichText text={r.text} maxChars={300} language={language} /></p>
              ) : null}
              {videosMap[r.videoId] ? (
                <VideoCard video={videosMap[r.videoId]} />
              ) : (
                <Link to={`/watch/${r.videoId}`} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-colors">
                  {r.videoThumb ? <img src={r.videoThumb} alt="" className="w-24 h-14 object-cover rounded-lg shrink-0" loading="lazy" /> : null}
                  <span className="text-sm font-bold text-white truncate">{r.videoTitle || r.videoId}</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
