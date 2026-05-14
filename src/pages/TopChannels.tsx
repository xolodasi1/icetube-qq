import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Users, Eye, ThumbsUp, Trophy, Loader2, Video, Snowflake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { databases, client } from '../lib/appwrite';
import { Query } from 'appwrite';

export default function TopChannels() {
  const { t, language } = useLanguage();
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'subscribersCount' | 'viewsCount' | 'likesCount' | 'snowflakesCount' | 'videosCount'>('subscribersCount');

  const categories = [
    { id: 'subscribersCount', label: language === 'ru' ? 'Топ по подписчикам' : 'By Subscribers', icon: Users, color: 'text-[#70d6ff]' },
    { id: 'viewsCount', label: language === 'ru' ? 'Топ по просмотрам' : 'By Views', icon: Eye, color: 'text-[#ffb703]' },
    { id: 'likesCount', label: language === 'ru' ? 'Топ по лайкам' : 'By Likes', icon: ThumbsUp, color: 'text-[#ff70a6]' },
    { id: 'snowflakesCount', label: language === 'ru' ? 'Топ по снежинкам' : 'By Snowflakes', icon: Snowflake, color: 'text-[#9bf6ff]' },
    { id: 'videosCount', label: language === 'ru' ? 'Топ по видео и Shorts' : 'By Videos & Shorts', icon: Video, color: 'text-[#00f5d4]' },
  ];

  const fetchTopData = React.useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

      if (!dbId || !profilesCol) return;

      // Fetch more than limit to allow for deduplication
      const res = await databases.listDocuments(
        dbId,
        profilesCol,
        [
          Query.orderDesc(sortBy),
          Query.limit(100)
        ]
      );
      
      const seen = new Set();
      const uniqueChannels = res.documents.filter(doc => {
        if (!doc.userId || seen.has(doc.userId)) return false;
        seen.add(doc.userId);
        return true;
      }).map(doc => ({
        ...doc,
        subscribersCount: doc.subscribersCount || 0,
        viewsCount: doc.viewsCount || 0,
        likesCount: doc.likesCount || 0,
        videosCount: doc.videosCount || 0,
        snowflakesCount: doc.snowflakesCount || 0,
      })).slice(0, 50);

      setChannels(uniqueChannels);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [sortBy]);

  // Use a ref to keep the latest fetchTopData accessible to the subscription
  const fetchRef = React.useRef(fetchTopData);
  React.useEffect(() => {
    fetchRef.current = fetchTopData;
  }, [fetchTopData]);

  useEffect(() => {
    fetchTopData();
  }, [fetchTopData]);

  useEffect(() => {
    // Set up real-time subscription once and KEEP it alive
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    
    if (dbId && profilesCol) {
      const unsubscribe = client.subscribe(`databases.${dbId}.collections.${profilesCol}.documents`, () => {
        // Always call the most recent version of fetchTopData
        fetchRef.current(true);
      });
      return () => unsubscribe();
    }
  }, []); // Truly empty dependency array - connected once

  const formatCount = (num: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(num || 0);
  };

  const currentCategory = categories.find(c => c.id === sortBy) || categories[0];
  const Icon = currentCategory.icon;

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 mb-20 sm:mb-6 mt-16 sm:mt-0">
      <header className="flex flex-col gap-6 mb-10">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-white/5 rounded-2xl border ice-border">
             <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-[#70d6ff]" />
           </div>
           <div>
             <h1 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tighter italic">
               {t('top_channels_title') || (language === 'ru' ? 'Зал славы' : 'Hall of Fame')}
             </h1>
             <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mt-0.5 font-medium opacity-80">
               {language === 'ru' ? 'Рейтинг самых успешных авторов нашей платформы' : 'Rankings of the most successful creators'}
             </p>
           </div>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSortBy(cat.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                sortBy === cat.id 
                  ? 'bg-[#70d6ff] text-[#0a192f] border-[#70d6ff] shadow-[0_0_20px_rgba(112,214,255,0.3)]' 
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin mb-4" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">{language === 'ru' ? 'Загрузка рейтинга...' : 'Loading rankings...'}</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border ice-border rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="grid grid-cols-1 divide-y ice-border">
            {channels.length === 0 ? (
              <div className="p-20 text-center text-slate-500 italic">{t('top_channels_empty')}</div>
            ) : (
              channels.map((channel, index) => (
                <Link 
                  key={channel.$id} 
                  to={`/channel/${channel.userId}`}
                  className="flex items-center gap-4 p-4 sm:p-5 hover:bg-white/5 transition-all group"
                >
                  <div className={`w-8 sm:w-10 text-center font-black text-lg sm:text-xl ${
                    index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="relative">
                    <img 
                      src={channel.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name || 'User')}&background=random`} 
                      alt={channel.name} 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-[#70d6ff]/50 transition-colors" 
                    />
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 bg-black rounded-full p-1 border border-white/10">
                        <Trophy className={`w-3 h-3 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : 'text-amber-600'}`} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-base sm:text-lg truncate group-hover:text-[#70d6ff] transition-colors">
                      {channel.name || (language === 'ru' ? 'Безымянный автор' : 'Unnamed Creator')}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${currentCategory.color}`}>
                        <Icon className="w-3 h-3" />
                        {formatCount(channel[sortBy])}
                      </div>
                      <div className="w-1 h-1 bg-white/20 rounded-full" />
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {formatCount(channel.subscribersCount)} {language === 'ru' ? 'подп.' : 'subs'}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border ice-border text-[#70d6ff] text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    {language === 'ru' ? 'Смотреть' : 'View'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
