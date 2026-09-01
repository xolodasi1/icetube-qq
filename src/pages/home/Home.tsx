import { VideoCard } from "../../components/VideoCard";
import { useSearchParams, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { databases, withTimeout } from "../../lib/appwrite";
import { Query } from "appwrite";
import { Loader2, Video, Image, RefreshCw } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import { getOptimizedThumbnail } from "../../lib/cloudinary";
import { getRecommendations } from "../../lib/recommendations";

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
      if (!dbId || !colId) {
        setError(language === 'ru' ? 'Сервер не настроен' : 'Server is not configured');
        setDbVideos([]);
        return;
      }
      let response: any;
      try {
        response = await withTimeout(databases.listDocuments(dbId, colId, [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]), 8000);
      } catch (firstErr) {
        console.warn("Home first fetch failed, retrying directly:", firstErr);
        response = await databases.listDocuments(dbId, colId, [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]);
      }

      const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
      let profilesMap: Record<string, {name: string, avatar: string}> = {};
      try {
        if (profilesCol) {
          const uploaderIds = Array.from(new Set(response.documents.map((v: any) => v.uploaderId).filter(Boolean))) as string[];
          if (uploaderIds.length > 0) {
            const chunks: string[][] = [];
            for (let i = 0; i < uploaderIds.length; i += 50) chunks.push(uploaderIds.slice(i, i + 50));
            const results = await Promise.all(chunks.map(ids => withTimeout(databases.listDocuments(dbId, profilesCol, [Query.equal('userId', ids)]), 2500)));
            results.flatMap(r => r.documents).forEach((p: any) => {
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
        console.warn("Could not fetch profiles for latest avatars", pErr);
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
            channelHandle: profile?.handle || '',
            channelAvatar: profile?.avatar || v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
            views: v.views || 0,
            uploadDate: v.$createdAt,
            createdAt: v.$createdAt,
            category: v.category || 'All',
            contentType: v.contentType || 'video',
            verified: v.verified || false,
            description: v.description || ''
          };
      });
      const ranked = getRecommendations(formatted, { limit: 200 });
      setDbVideos(ranked);
    } catch (err) {
       console.warn("Appwrite network/timeout error:", err);
       setError(t('video_load_error'));
    } finally {
       setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

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
    <div className="flex flex-col gap-5 pt-3 sm:pt-1 pb-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 px-4 sm:px-0 overflow-x-auto custom-scrollbar hide-scrollbar pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activeFilter === tab.value
                ? "bg-white text-black border-white shadow-sm"
                : "bg-white/[0.06] border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20"
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
            <button
              onClick={() => fetchVideos()}
              className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#70d6ff] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(112,214,255,0.2)]"
            >
              <RefreshCw className="w-4 h-4" />
              {t('video_retry')}
            </button>
          </div>
        ) : dbVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold font-display text-white mb-2">{t('hero_no_videos')}</h2>
            <p className="text-slate-400">{t('hero_upload_prompt')}</p>
          </div>
        ) : activeFilter !== 'all' && filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-xl font-medium">{t('video_no_results')}</p>
            <p className="text-sm mt-2 text-slate-500">{t('video_search_try_again')}</p>
          </div>
        ) : activeFilter === 'all' ? (
          <>
            {(() => {
              const regs = dbVideos.filter(v => !isShort(v) && !isPhoto(v) && (!searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.channelName.toLowerCase().includes(searchQuery.toLowerCase())));
              const shs = dbVideos.filter(v => isShort(v) && (!searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.channelName.toLowerCase().includes(searchQuery.toLowerCase())));
              const phs = dbVideos.filter(v => isPhoto(v) && (!searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.channelName.toLowerCase().includes(searchQuery.toLowerCase())));
              return (
                <>
                  {regs.length > 0 && (
                    <div className="mb-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 px-4 sm:px-0">
                        {regs.map(video => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    </div>
                  )}
                  {shs.length > 0 && (
                    <div className="mb-10 px-4 sm:px-0">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[15px] font-bold tracking-tight text-white uppercase">{t('shorts_tab')}</span>
                        <span className="h-4 w-px bg-white/10" />
                        <span className="text-xs text-slate-500">{shs.length}</span>
                      </div>
                      <div className="flex overflow-x-auto gap-3 custom-scrollbar pb-2 hide-scrollbar snap-x">
                        {shs.map(video => (
                          <div key={video.id} className="w-[168px] sm:w-[180px] shrink-0 snap-start">
                            <VideoCard video={video} layout="clip" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {phs.length > 0 && (
                    <div className="mb-10 px-4 sm:px-0">
                      <div className="flex items-center gap-2 mb-4">
                        <Image className="w-4 h-4 text-slate-400" />
                        <span className="text-[15px] font-bold tracking-tight text-white">{t('nav_photos')}</span>
                        <span className="h-4 w-px bg-white/10" />
                        <span className="text-xs text-slate-500">{phs.length}</span>
                      </div>
                      <div className="flex overflow-x-auto gap-3 custom-scrollbar pb-2 hide-scrollbar snap-x">
                        {phs.map(photo => (
                          <div key={photo.id} className="w-[168px] sm:w-[180px] shrink-0 snap-start">
                            <Link to="/photos" className="block relative group aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/5 hover:border-white/15 transition-all">
                              <img src={getOptimizedThumbnail(photo.thumbnailUrl) || photo.thumbnailUrl} alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-xs font-medium truncate">{photo.title}</p>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 px-4 sm:px-0">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
