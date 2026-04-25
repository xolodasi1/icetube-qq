import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Users, Eye, ThumbsUp, Trophy, Loader2, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

interface ChannelStats {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  totalViews: number;
  totalLikes: number;
  videoCount: number;
}

export default function TopChannels() {
  const { t, language } = useLanguage();
  const [topBySubs, setTopBySubs] = useState<ChannelStats[]>([]);
  const [topByViews, setTopByViews] = useState<ChannelStats[]>([]);
  const [topByLikes, setTopByLikes] = useState<ChannelStats[]>([]);
  const [topByVideos, setTopByVideos] = useState<ChannelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const videosCol = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
        const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;

        if (!dbId || !videosCol) return;

        // Fetch all videos to calculate views/likes per channel
        const videosRes = await databases.listDocuments(dbId, videosCol, [Query.limit(100)]);
        const allSubs = subsCol ? await databases.listDocuments(dbId, subsCol, [Query.limit(100)]) : { documents: [] };
        
        const channelMap: Record<string, ChannelStats> = {};

        // 1. Accumulate views and identify channels
        videosRes.documents.forEach(v => {
          if (!channelMap[v.uploaderId]) {
            const displayName = v.channelName || v.uploaderName || v.uploaderId || 'User';
            channelMap[v.uploaderId] = {
              id: v.uploaderId,
              name: displayName === v.uploaderId ? 'User' : displayName,
              avatar: v.channelAvatar || v.uploaderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.uploaderId}`,
              subscribers: 0,
              totalViews: 0,
              totalLikes: 0,
              videoCount: 0
            };
          }
          channelMap[v.uploaderId].totalViews += (v.views || 0);
          channelMap[v.uploaderId].videoCount += 1;
        });

        // Try to fetch actual profiles to get freshest names
        try {
          const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
          if (profilesCol) {
            const uploaderIds = Object.keys(channelMap);
            if (uploaderIds.length > 0) {
              const profilesRes = await databases.listDocuments(dbId, profilesCol, [
                Query.equal('userId', uploaderIds)
              ]);
              profilesRes.documents.forEach(p => {
                if (channelMap[p.userId]) {
                  channelMap[p.userId].name = p.name || channelMap[p.userId].name;
                  channelMap[p.userId].avatar = p.avatar || channelMap[p.userId].avatar;
                }
              });
            }
          }
        } catch (profileErr) {
          console.warn("Failed to fetch profiles for top channels:", profileErr);
        }

        // 2. Count subscribers
        allSubs.documents.forEach(s => {
          if (channelMap[s.channelId]) {
            channelMap[s.channelId].subscribers += 1;
          }
        });

        const channels = Object.values(channelMap);

        // Sort for different categories
        setTopBySubs([...channels].sort((a, b) => b.subscribers - a.subscribers).slice(0, 10));
        setTopByViews([...channels].sort((a, b) => b.totalViews - a.totalViews).slice(0, 10));
        setTopByLikes([...channels].sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 10)); // Total likes would normally need more fetching
        setTopByVideos([...channels].sort((a, b) => b.videoCount - a.videoCount).slice(0, 10));

      } catch (err) {
        console.error("Top Channels failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCount = (num: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(num);
  };

  const Leaderboard = ({ title, icon: Icon, data, type }: { title: string, icon: any, data: ChannelStats[], type: 'subs' | 'views' | 'likes' | 'videos' }) => (
    <div className="flex-1 min-w-[300px] flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-white/5 border ice-border ${
           type === 'subs' ? 'text-[#70d6ff]' : type === 'views' ? 'text-[#ffb703]' : 'text-[#ff70a6]'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex flex-col gap-2">
        {data.length === 0 ? (
          <p className="text-slate-500 text-sm italic py-4">{t('top_channels_empty')}</p>
        ) : (
          data.map((channel, index) => (
            <Link 
              key={channel.id} 
              to={`/channel/${channel.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
            >
              <div className="w-6 text-center font-mono text-sm text-slate-500 group-hover:text-[#70d6ff]">
                {index === 0 ? '🏆' : index + 1}
              </div>
              <img src={channel.avatar} alt={channel.name} className="w-10 h-10 rounded-full object-cover border ice-border" />
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{channel.name}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  {type === 'subs' && `${formatCount(channel.subscribers)} ${language === 'ru' ? 'подп.' : 'subs'}`}
                  {type === 'views' && `${formatCount(channel.totalViews)} ${language === 'ru' ? 'просм.' : 'views'}`}
                  {type === 'likes' && `${formatCount(channel.totalLikes)} ${language === 'ru' ? 'лайков' : 'likes'}`}
                  {type === 'videos' && `${formatCount(channel.videoCount)} ${language === 'ru' ? 'видео' : 'videos'}`}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <header className="flex flex-col gap-2 mb-10">
        <div className="flex items-center gap-3">
           <Trophy className="w-8 h-8 text-[#70d6ff]" />
           <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
             {t('top_channels_title')}
           </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-2xl">
          {language === 'ru' ? 'Рейтинг самых успешных авторов нашей платформы на текущий момент.' : 'Rankings of the most successful creators on our platform right now.'}
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin mb-4" />
          <p className="text-slate-500 font-medium">{language === 'ru' ? 'Анализируем данные...' : 'Analyzing leaderboard data...'}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-10">
           <Leaderboard title={t('top_channels_by_subs')} icon={Users} data={topBySubs} type="subs" />
           <Leaderboard title={t('top_channels_by_views')} icon={Eye} data={topByViews} type="views" />
           <Leaderboard title={t('top_channels_by_likes')} icon={ThumbsUp} data={topByLikes} type="likes" />
           <Leaderboard title={t('top_channels_by_videos')} icon={Video} data={topByVideos} type="videos" />
        </div>
      )}
    </div>
  );
}
