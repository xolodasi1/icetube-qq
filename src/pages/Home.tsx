import { VideoCard } from "../components/VideoCard";
import { useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { databases, withTimeout, getOfflineFlag, setOfflineFlag } from "../lib/appwrite";
import { Loader2, ServerCrash, Video, Wifi, ShieldAlert, RotateCw } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Home() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(getOfflineFlag());

  useEffect(() => {
    const handleNetworkState = () => {
      setOfflineMode(getOfflineFlag());
    };
    window.addEventListener('icetube_network_status_changed', handleNetworkState);
    return () => {
      window.removeEventListener('icetube_network_status_changed', handleNetworkState);
    };
  }, []);

  const handleRetryConnection = () => {
    setIsLoading(true);
    setOfflineFlag(false);
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const dynamicCategories: string[] = Array.from(new Set(
    dbVideos
      .map(v => v.category ? String(v.category) : '')
      .filter(c => c && c !== 'All' && c !== 'undefined')
  ));
  const tags: string[] = [
    language === 'ru' ? 'Все' : 'All',
    ...dynamicCategories
  ];
  
  const searchQuery = searchParams.get("search") || "";
  const activeCategoryParam = searchParams.get("category") || 'All';
  
  const activeCategoryLabel = activeCategoryParam === 'All' 
    ? (language === 'ru' ? 'Все' : 'All') 
    : activeCategoryParam;

  const fetchVideos = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (dbId && colId) {
          const response = await withTimeout(databases.listDocuments(dbId, colId), 4000);
          
          // Fetch users/profiles to get freshest avatars
          const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
          let profilesMap: Record<string, {name: string, avatar: string}> = {};
          try {
            if (profilesCol) {
              const uploaderIds = Array.from(new Set(response.documents.map(v => v.uploaderId)));
              if (uploaderIds.length > 0) {
                const profilesResult = await withTimeout(databases.listDocuments(dbId, profilesCol), 2500);
                profilesResult.documents.forEach(p => {
                  if (p.userId) {
                    profilesMap[p.userId] = {
                      name: p.name || '',
                      avatar: p.avatar || ''
                    };
                  }
                });
              }
            }
          } catch (pErr) {
            console.log("Could not fetch profiles for latest avatars", pErr);
          }

          const formatted = response.documents.map(v => {
              const profile = profilesMap[v.uploaderId];
              return {
                id: v.$id,
                uploaderId: v.uploaderId,
                title: v.title,
                thumbnailUrl: v.thumbnailUrl,
                videoUrl: v.videoUrl,
                channelName: profile?.name || v.uploaderName,
                channelAvatar: profile?.avatar || v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
                views: v.views || 0,
                uploadDate: t('video_recently'),
                category: v.category || 'All',
                contentType: v.contentType || 'video',
                verified: v.verified || false,
                description: v.description || ''
              };
          });
          setDbVideos(formatted.reverse()); 
          setOfflineFlag(false);
      } else {
           setDbVideos([]);
      }
    } catch (err) {
       console.warn("Appwrite network/timeout error:", err);
       setOfflineFlag(true);
       setError(
         language === 'ru' 
           ? "Соединение с сервером базы данных заблокировано или истекло. Пожалуйста, включите VPN и попробуйте снова." 
           : "Database connection blocked or timed out. Please turn on your VPN and try again."
       );
       setDbVideos([]); 
    } finally {
       setIsLoading(false);
       setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [language]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchVideos(true);
  };

  const handleTagClick = (tagLabel: string) => {
    if (tagLabel === 'Все' || tagLabel === 'All') {
      navigate("/");
    } else {
      navigate(`/?category=${tagLabel}`);
    }
  };

  const filteredVideos = dbVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategoryParam === "All" || video.category === activeCategoryParam;
    return matchesSearch && matchesCategory;
  });

  const isShort = (v: any) => v.contentType === 'shorts' || v.title?.toLowerCase().includes('#shorts') || v.description?.toLowerCase().includes('#shorts');
  const regularVideos = filteredVideos.filter(v => !isShort(v));
  const shortsVideos = filteredVideos.filter(v => isShort(v));

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-0 pb-4 sm:pb-0">
      {offlineMode && (
        <div className="mx-4 sm:mx-0 p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-slate-900/90 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase">
                {language === 'ru' ? '⚠️ Соединение заблокировано' : '⚠️ Connection Blocked'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {language === 'ru' 
                  ? 'Сервер базы данных Appwrite недоступен без VPN. Пожалуйста, включите VPN для просмотра и публикации видео.' 
                  : 'Appwrite database is unreachable without VPN. Please turn on your VPN to view and upload videos.'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleRetryConnection}
            className="flex items-center gap-2 bg-[#70d6ff] text-black hover:scale-105 active:scale-95 text-xs font-bold py-2 px-4 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Wifi className="w-4 h-4" />
            {language === 'ru' ? 'Проверить еще раз' : 'Retry Connection'}
          </button>
        </div>
      )}

      {/* Category Tags & Manual Refresh */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-0 -mt-2">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar flex-1">
          {tags.map((tag) => (
            <button 
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-all ${
                tag === activeCategoryLabel 
                  ? "bg-blue-500 text-white font-medium shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105" 
                  : "bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleManualRefresh}
          disabled={isLoading || isRefreshing}
          className="whitespace-nowrap flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-[#70d6ff]/10 hover:from-blue-500/20 hover:to-[#70d6ff]/20 border border-[#70d6ff]/20 hover:border-[#70d6ff]/40 text-slate-300 hover:text-[#70d6ff] px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(112,214,255,0.05)]"
          title={language === 'ru' ? 'Обновить видео' : 'Refresh Feed'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{language === 'ru' ? 'Обновить поток' : 'Update Feed'}</span>
        </button>
      </div>

      {/* Video Grid */}
      <div className="mt-2">
        {isLoading ? (
             <div className="flex justify-center flex-col gap-4 items-center h-64 text-slate-400">
               <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
               <span>{t('video_connecting')}</span>
             </div>
        ) : error && dbVideos.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <ServerCrash className="w-12 h-12 text-red-400 mb-4" />
                <p>{error}</p>
             </div>
        ) : dbVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Video className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold font-display text-white mb-2">{t('hero_no_videos')}</h2>
                <p className="text-slate-400">{t('hero_upload_prompt')}</p>
            </div>
        ) : filteredVideos.length > 0 ? (
          <>
            {regularVideos.length > 0 && (
              <div className="mt-2">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-4 sm:px-0">
                  <span className="text-[#70d6ff]">{t('nav_videos')}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-4 sm:gap-y-8 gap-x-4 px-4 sm:px-0">
                  {regularVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
            
            {shortsVideos.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-4 sm:px-0">
                  <span className="text-[#70d6ff]">{t('shorts_tab')}</span>
                </h3>
                <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-6 px-4 sm:px-0 hide-scrollbar snap-x">
                  {shortsVideos.map(video => (
                    <div key={video.id} className="w-[180px] sm:w-[200px] shrink-0 snap-start">
                      <VideoCard video={video} layout="clip" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-xl font-medium">{t('video_no_results')}</p>
            <p className="text-sm mt-2 text-slate-500">{t('video_search_try_again')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
