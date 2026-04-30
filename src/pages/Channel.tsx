import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import { Loader2, User, AlertCircle, Video } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { VideoCard } from "../components/VideoCard";

export default function Channel() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [subsCount, setSubsCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubbing, setIsSubbing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'videos' | 'shorts' | 'about'>('home');

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
          contentType: v.contentType || 'video'
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
        }
      } else {
        await databases.createDocument(dbId, subsCol, "unique()", {
          channelId: id,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
        setSubsCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Subscribe failed:", err);
    } finally {
      setIsSubbing(false);
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

  const regularVideos = videos.filter(v => typeof v.contentType === 'undefined' || v.contentType === 'video');
  const shortsVideos = videos.filter(v => v.contentType === 'shorts');

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
            <button 
              disabled
              className="bg-white/10 text-slate-300 px-6 py-2.5 rounded-full border border-white/10 cursor-default"
            >
              {t('channel_your_channel')}
            </button>
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
                      <VideoCard video={video} isShort={true} />
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
            {regularVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                <Video className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-lg">{language === 'ru' ? 'Нет обычных видео.' : 'No regular videos.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-4">
                {regularVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shorts' && (
          <div>
            {shortsVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                <Video className="w-12 h-12 text-slate-500 mb-4" />
                <p className="text-lg">{language === 'ru' ? 'Нет Shorts.' : 'No Shorts.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-y-6 gap-x-4">
                {shortsVideos.map(video => (
                  <VideoCard key={video.id} video={video} isShort={true} />
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
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
