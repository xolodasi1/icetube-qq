import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { VideoCard } from '../components/VideoCard';
import { Loader2, Users, Film, Scissors, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Subscriptions() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'videos' | 'shorts' | 'photos'>('videos');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
        const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

        if (!dbId || !videosColId || !subsColId) {
          setIsLoading(false);
          return;
        }

        // 1. Get user's subscriptions
        const subsResponse = await databases.listDocuments(dbId, subsColId, [
          Query.equal('subscriberId', user.$id)
        ]);

        const subscribedChannelIds = subsResponse.documents.map(sub => sub.channelId);

        // 2. Fetch channel profiles
        if (subscribedChannelIds.length > 0 && usersColId) {
          const chanRes = await databases.listDocuments(dbId, usersColId, [
            Query.equal('$id', subscribedChannelIds)
          ]);
          setChannels(chanRes.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
            avatar: doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}`
          })));
        }

        // 3. Fetch videos from these channels
        if (subscribedChannelIds.length > 0) {
          const videosResponse = await databases.listDocuments(dbId, videosColId, [
            Query.equal('uploaderId', subscribedChannelIds),
            Query.orderDesc('$createdAt'),
            Query.limit(50)
          ]);
          setVideos(videosResponse.documents);
        } else {
          setVideos([]);
        }

      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const videosVideos = videos.filter(v => v.contentType !== 'shorts' && v.contentType !== 'photo');
  const shortsVideos = videos.filter(v => v.contentType === 'shorts');
  const photosVideos = videos.filter(v => v.contentType === 'photo');
  const currentList = tab === 'videos' ? videosVideos : tab === 'shorts' ? shortsVideos : photosVideos;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[50vh] text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          {language === 'ru' ? 'Не упускайте новые видео' : 'Don\'t miss new videos'}
        </h2>
        <p className="text-slate-400 mb-6 max-w-md">
          {language === 'ru' 
            ? 'Войдите в аккаунт, чтобы видеть обновления любимых каналов'
            : 'Sign in to see updates from your favorite channels'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-[2000px] mx-auto pb-24 animate-in fade-in duration-300">
      <h1 className="text-xl font-bold text-white mb-6">
        {language === 'ru' ? 'Новые видео' : 'Latest'}
      </h1>

      {/* Subscribed Channels */}
      {channels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {language === 'ru' ? 'Мои подписки' : 'My Subscriptions'}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {channels.map(ch => (
              <Link
                key={ch.id}
                to={`/channel/${ch.id}`}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#70d6ff] transition-all">
                  <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[60px] text-center group-hover:text-white transition-colors">{ch.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos / Shorts Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 mb-6">
        <button
          onClick={() => setTab('videos')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all active:scale-95 cursor-pointer relative ${tab === 'videos' ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
        >
          <Film className="w-4 h-4" />
          {language === 'ru' ? 'Видео' : 'Videos'}
          <span className="text-[10px] opacity-60">({videosVideos.length})</span>
          {tab === 'videos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
        </button>
        <button
          onClick={() => setTab('shorts')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all active:scale-95 cursor-pointer relative ${tab === 'shorts' ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
        >
          <Scissors className="w-4 h-4" />
          Shorts
          <span className="text-[10px] opacity-60">({shortsVideos.length})</span>
          {tab === 'shorts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
        </button>
        <button
          onClick={() => setTab('photos')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all active:scale-95 cursor-pointer relative ${tab === 'photos' ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
        >
          <Image className="w-4 h-4" />
          {language === 'ru' ? 'Фото' : 'Photos'}
          <span className="text-[10px] opacity-60">({photosVideos.length})</span>
          {tab === 'photos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {currentList.map((video) => (
            <VideoCard key={video.$id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 h-[40vh] text-center">
          <p className="text-slate-400">
            {tab === 'videos'
              ? (language === 'ru' ? 'Нет видео от каналов, на которые вы подписаны.' : 'No videos from your subscribed channels.')
              : tab === 'shorts'
              ? (language === 'ru' ? 'Нет шортсов от каналов, на которые вы подписаны.' : 'No shorts from your subscribed channels.')
              : (language === 'ru' ? 'Нет фото от каналов, на которые вы подписаны.' : 'No photos from your subscribed channels.')
            }
          </p>
        </div>
      )}
    </div>
  );
}
