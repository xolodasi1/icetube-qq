import { VideoCard } from "../components/VideoCard";
import { useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { databases, withTimeout } from "../lib/appwrite";
import { Loader2, Video } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Home() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'shorts' | 'photo'>('all');

  const searchQuery = searchParams.get("search") || "";

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
      } else {
           setDbVideos([]);
      }
    } catch (err) {
       console.warn("Appwrite network/timeout error:", err);
       setError(
         language === 'ru'
           ? "Ошибка соединения с сервером"
           : "Connection error"
       );
       setDbVideos([]);
    } finally {
       setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [language]);

  const isShort = (v: any) => v.contentType === 'shorts' || v.title?.toLowerCase().includes('#shorts') || v.description?.toLowerCase().includes('#shorts');
  const isPhoto = (v: any) => v.contentType === 'photo';

  const filteredVideos = dbVideos.filter(video => {
    const matchesSearch = searchQuery
      ? video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channelName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    let matchesFilter = true;
    if (activeFilter === 'video') matchesFilter = !isShort(video) && !isPhoto(video);
    else if (activeFilter === 'shorts') matchesFilter = isShort(video);
    else if (activeFilter === 'photo') matchesFilter = isPhoto(video);
    return matchesSearch && matchesFilter;
  });

  const filterTabs = [
    { value: 'all' as const, label: language === 'ru' ? 'Все' : 'All' },
    { value: 'video' as const, label: language === 'ru' ? 'Видео' : 'Videos' },
    { value: 'shorts' as const, label: 'Shorts' },
    { value: 'photo' as const, label: language === 'ru' ? 'Фото' : 'Photos' },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-0 pb-4 sm:pb-0">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 sm:px-0 overflow-x-auto custom-scrollbar hide-scrollbar -mt-2 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-all ${
              activeFilter === tab.value
                ? "bg-blue-500 text-white font-medium shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105"
                : "bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
          </div>
        ) : error && dbVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-4 sm:gap-y-8 gap-x-4 px-4 sm:px-0">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
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
