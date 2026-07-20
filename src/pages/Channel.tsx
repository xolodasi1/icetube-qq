import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import { Loader2, User, AlertCircle, Video } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { VideoCard } from "../components/VideoCard";
import { createNotification } from "../lib/notifications";

export default function Channel() {
  const { id: paramId } = useParams();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const id = paramId === 'me' && user ? user.$id : paramId;

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [subsCount, setSubsCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubbing, setIsSubbing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'videos' | 'shorts' | 'about'>('home');
  const [videoSort, setVideoSort] = useState<'newest' | 'popular' | 'oldest'>('newest');

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!id) return;
      setIsLoading(true);

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
      const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;

      if (!dbId || !usersColId || !videosColId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Profile
        const profileRes = await databases.listDocuments(dbId, usersColId, [
          Query.equal("userId", id)
        ]);

        let channelProfile = (profileRes.documents.length > 0 ? profileRes.documents[0] : null) as any;

        // Fetch Videos
        const videosRes = await databases.listDocuments(dbId, videosColId, [
          Query.equal("uploaderId", id),
          Query.orderDesc("$createdAt")
        ]);

        const formattedVideos = videosRes.documents.map(v => ({
          id: v.$id,
          uploaderId: v.uploaderId,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          channelName: channelProfile ? (channelProfile.name || channelProfile.displayName) : v.uploaderName,
          channelAvatar: channelProfile ? (channelProfile.avatar || channelProfile.photoUrl) : (v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`),
          views: v.views || 0,
          uploadDate: t('video_recently'),
          duration: "10:00",
          contentType: v.contentType || 'video',
          createdAt: v.$createdAt
        }));

        setVideos(formattedVideos);

        // Define fallback profile if no user doc was created yet but videos exist
        if (!channelProfile && formattedVideos.length > 0) {
           channelProfile = {
             name: formattedVideos[0].channelName,
             avatar: formattedVideos[0].channelAvatar,
             description: ""
           };
        } else if (!channelProfile) {
           channelProfile = {
             name: "Unknown Channel",
             avatar: "",
             description: ""
           };
        }

        setProfile(channelProfile);

        // Fetch Subs
        if (subsColId) {
          const subsRes = await databases.listDocuments(dbId, subsColId, [
             Query.equal("channelId", id)
          ]);
          setSubsCount(subsRes.total);

          if (user) {
            const mySub = subsRes.documents.find((doc: any) => doc.subscriberId === user.$id);
            setIsSubscribed(!!mySub);
          }
        }
      } catch (err) {
        console.error("Failed to load channel data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();
  }, [id, user, language, t]);

  const handleSubscribe = async () => {
    if (!user || isSubbing || !id) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
    if (!dbId || !subsCol) return;

    try {
      setIsSubbing(true);
      if (isSubscribed) {
        const res = await databases.listDocuments(dbId, subsCol, [
          Query.equal('channelId', id),
          Query.equal('subscriberId', user.$id)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(dbId, subsCol, res.documents[0].$id);
          setIsSubscribed(false);
          setSubsCount(prev => prev - 1);
          updateProfileStat(id, 'subscribersCount', -1);
        }
      } else {
        await databases.createDocument(dbId, subsCol, "unique()", {
          channelId: id,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
        setSubsCount(prev => prev + 1);
        updateProfileStat(id, 'subscribersCount', 1);

        createNotification({
          userId: id,
          actorId: user.$id,
          actorName: user.name || 'User',
          actorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
          type: 'subscribe'
        });
      }
    } catch (err) {
      console.error("Subscribe failed:", err);
    } finally {
      setIsSubbing(false);
    }
  };

  const updateProfileStat = async (userId: string, field: string, increment: number) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
      if (!dbId || !profilesCol) return;

      // Try to fetch by document ID first (the new standard)
      try {
        const doc = await databases.getDocument(dbId, profilesCol, userId);
        if (doc) {
          await databases.updateDocument(dbId, profilesCol, userId, {
            [field]: (doc[field] || 0) + increment
          });
          return;
        }
      } catch (e) {
        // Continue to query if not found by ID
      }

      const res = await databases.listDocuments(dbId, profilesCol, [
        Query.equal('userId', userId),
        Query.orderDesc(field),
        Query.limit(1)
      ]);
      
      if (res.documents.length > 0) {
        const doc = res.documents[0];
        const newValue = (doc[field] || 0) + increment;
        await databases.updateDocument(dbId, profilesCol, doc.$id, { [field]: newValue }); 
      }
    } catch (err) {
      console.error("Failed to update profile stat", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff] mb-4" />
        <p>{t('channel_loading')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 h-[70vh]">
        <AlertCircle className="w-12 h-12 text-slate-500 mb-2" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('channel_not_found')}</h1>
        <p>{t('channel_not_found_desc')}</p>
      </div>
    );
  }

  const avatarSrc = profile.avatar || profile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.displayName || "U")}&background=random`;
  const channelName = profile.name || profile.displayName || "Unknown Channel";
  const channelHandle = profile.handle ? `@${profile.handle}` : `@${channelName.replace(/\s+/g, '').toLowerCase() || "user"}`;
  const bannerUrl = profile.bannerUrl;

  const isShort = (v: any) => v.contentType === 'shorts' || v.title?.toLowerCase().includes('#shorts') || v.description?.toLowerCase().includes('#shorts');

  const regularVideos = videos.filter(v => !isShort(v));
  const shortsVideos = videos.filter(v => isShort(v));

  const sortedRegularVideos = [...regularVideos].sort((a, b) => {
    if (videoSort === 'popular') return b.views - a.views;
    if (videoSort === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const sortedShortsVideos = [...shortsVideos].sort((a, b) => {
    if (videoSort === 'popular') return b.views - a.views;
    if (videoSort === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const SortPills = () => (
    <div className="flex gap-2 mb-6">
      <button 
        onClick={() => setVideoSort('newest')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${videoSort === 'newest' ? 'bg-[#70d6ff] text-black shadow-[0_0_15px_rgba(112,214,255,0.3)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
      >
        {language === 'ru' ? 'Новые' : 'Newest'}
      </button>
      <button 
        onClick={() => setVideoSort('popular')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${videoSort === 'popular' ? 'bg-[#70d6ff] text-black shadow-[0_0_15px_rgba(112,214,255,0.3)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
      >
        {language === 'ru' ? 'Популярные' : 'Popular'}
      </button>
      <button 
        onClick={() => setVideoSort('oldest')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${videoSort === 'oldest' ? 'bg-[#70d6ff] text-black shadow-[0_0_15px_rgba(112,214,255,0.3)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
      >
        {language === 'ru' ? 'Старые' : 'Oldest'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner */}
      {bannerUrl && (
        <div className="w-full h-48 md:h-64 lg:h-80 w-full mb-8 rounded-2xl overflow-hidden bg-slate-800 relative">
          <img 
            src={bannerUrl} 
            alt="Channel Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Channel Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-white/10 pb-8">
        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0">
          <img 
            src={avatarSrc} 
            alt={channelName} 
            className="w-full h-full rounded-full object-cover bg-slate-800 border-2 border-[#70d6ff]/20 shadow-[0_0_20px_rgba(112,214,255,0.1)]"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-4xl font-bold font-display text-white mb-2">{channelName}</h1>
          <div className="flex items-center gap-2 text-slate-400 mb-4">
            <span className="font-medium text-slate-300">{channelHandle}</span>
            <span>•</span>
            <span>{new Intl.NumberFormat().format(subsCount)} {t('channel_subscribers')}</span>
            <span>•</span>
            <span>{videos.length} {t('channel_videos')}</span>
          </div>

          <p className="text-slate-300 max-w-2xl mb-6 line-clamp-3">
            {profile.description || profile.bio || ""}
          </p>

          {user && user.$id !== id && (
            <button 
              disabled={isSubbing}
              onClick={handleSubscribe}
              className={`font-bold px-6 py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 ${
                 isSubscribed ? 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10' : 'bg-[#70d6ff] text-black hover:bg-[#5bc0e6]'
              }`}
            >
              {isSubscribed ? t('video_subscribed') : t('video_subscribe')}
            </button>
          )}

          {user && user.$id === id && (
            <div className="flex gap-2">
              <button 
                disabled
                className="bg-white/10 text-slate-300 px-6 py-2.5 rounded-full border border-white/10 cursor-default"
              >
                {t('channel_your_channel')}
              </button>
              <Link to="/studio/editor" className="bg-[#70d6ff] text-black px-6 py-2.5 rounded-full font-bold hover:bg-[#5bc0e6] transition-colors">
                {language === 'ru' ? 'Редактор канала' : 'Channel Editor'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex border-b border-white/10 mb-8 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('home')}
          className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'home' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          {language === 'ru' ? 'Главная' : 'Home'}
        </button>
        <button 
          onClick={() => setActiveTab('videos')}
          className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'videos' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          {language === 'ru' ? 'Видео' : 'Videos'}
        </button>
        <button 
          onClick={() => setActiveTab('shorts')}
          className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'shorts' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Shorts
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'about' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          {language === 'ru' ? 'О канале' : 'About'}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[40vh]">
        {activeTab === 'home' && (
          <div className="flex flex-col gap-10">
            {regularVideos.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">{language === 'ru' ? 'Недавние видео' : 'Recent Videos'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-4">
                  {regularVideos.slice(0, 8).map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
            
            {shortsVideos.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-[#FF0000]">Shorts</span>
                </h3>
                <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-6 hide-scrollbar snap-x">
                  {shortsVideos.map(video => (
                    <div key={video.id} className="w-[180px] sm:w-[200px] shrink-0 snap-start">
                      <VideoCard video={video} layout="clip" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regularVideos.length === 0 && shortsVideos.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                 <Video className="w-12 h-12 text-slate-500 mb-4" />
                 <p className="text-lg">{t('channel_no_videos')}</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <SortPills />
            {sortedRegularVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                <Video className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-lg">{language === 'ru' ? 'Нет видео.' : 'No videos.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-4">
                {sortedRegularVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shorts' && (
          <div>
            <SortPills />
            {sortedShortsVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                <Video className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-lg">{language === 'ru' ? 'Нет Shorts.' : 'No Shorts.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-y-6 gap-x-4">
                {sortedShortsVideos.map(video => (
                  <VideoCard key={video.id} video={video} layout="clip" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="flex flex-col gap-6 max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">{language === 'ru' ? 'Описание' : 'Description'}</h3>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {profile.description || profile.bio || (language === 'ru' ? 'Нет описания.' : 'No description provided.')}
              </p>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">{language === 'ru' ? 'Статистика' : 'Stats'}</h3>
              <ul className="text-slate-300 space-y-2">
                <li>{new Intl.NumberFormat().format(subsCount)} {t('channel_subscribers')}</li>
                <li>{videos.length} {t('channel_videos')}</li>
                {profile.$createdAt && (
                    <li>{language === 'ru' ? 'Создан:' : 'Created:'} {new Date(profile.$createdAt).toLocaleDateString()}</li>
                )}
              </ul>
            </div>
            
            {(profile.website || profile.youtube || profile.tiktok || profile.telegram || profile.vk) && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">{language === 'ru' ? 'Ссылки' : 'Links'}</h3>
                <div className="flex flex-wrap gap-4 text-slate-300">
                    {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#70d6ff]">Website</a>}
                    {profile.youtube && <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[#70d6ff]">YouTube</a>}
                    {profile.tiktok && <a href={profile.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#70d6ff]">TikTok</a>}
                    {profile.telegram && <a href={profile.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-[#70d6ff]">Telegram</a>}
                    {profile.vk && <a href={profile.vk} target="_blank" rel="noopener noreferrer" className="hover:text-[#70d6ff]">VK</a>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
