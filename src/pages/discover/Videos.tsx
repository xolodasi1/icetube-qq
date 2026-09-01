import { VideoCard } from "../../components/VideoCard";
import { useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { databases, withTimeout } from "../../lib/appwrite";
import { Query } from "appwrite";
import { Loader2, ServerCrash, Video, RefreshCw } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

export default function Videos() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (dbId && colId) {
          const response = await withTimeout(databases.listDocuments(dbId, colId, [
            Query.orderDesc('$createdAt'),
            Query.limit(50)
          ]), 4000);
          
          // Fetch users/profiles to get freshest avatars (chunked)
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
                channelAvatar: profile?.avatar || v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
                views: v.views || 0,
                uploadDate: v.$createdAt,
                category: v.category || 'All',
                contentType: v.contentType || 'video',
                verified: v.verified || false,
                description: v.description || ''
              };
          });
          setDbVideos(formatted.reverse()); 
      } else {
           setError(language === 'ru' ? 'Сервер не настроен' : 'Server is not configured');
      }
    } catch (err) {
       console.warn("Appwrite lookup failed/timed out:", err);
       setError(t('video_load_error'));
    } finally {
       setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

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

  const handleTagClick = (tagLabel: string) => {
    if (tagLabel === 'Все' || tagLabel === 'All') {
      navigate("/videos");
    } else {
      navigate(`/videos?category=${tagLabel}`);
    }
  };

  const filteredVideos = dbVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategoryParam === "All" || video.category === activeCategoryParam;
    return matchesSearch && matchesCategory;
  });

  const isShort = (v: any) => v.contentType === 'shorts' || v.title?.toLowerCase().includes('#shorts') || v.description?.toLowerCase().includes('#shorts');
  const isPhoto = (v: any) => v.contentType === 'photo';
  const regularVideos = filteredVideos.filter(v => !isShort(v) && !isPhoto(v));

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-0 pb-4 sm:pb-0">
      {/* Category Tags */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar px-4 sm:px-0 -mt-2">
        {tags.map((tag) => (
          <button 
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-colors ${
              tag === activeCategoryLabel 
                ? "bg-blue-500 text-white font-medium shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                : "bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
            }`}
          >
            {tag}
          </button>
        ))}
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
                <button
                  onClick={fetchVideos}
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
        ) : filteredVideos.length > 0 ? (
          <>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-4 sm:px-0">
              <span className="text-[#70d6ff]">{t('nav_videos')}</span>
            </h3>
            {regularVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-2 sm:gap-y-8 gap-x-4 px-0 sm:px-0">
                {regularVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <p className="text-xl font-medium">{t('video_no_results')}</p>
                <p className="text-sm mt-2 text-slate-500">{t('video_search_try_again')}</p>
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
