import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, X, Loader2, Send, AlertTriangle } from 'lucide-react';
import { databases } from '../lib/appwrite';
import { Query, ID } from 'appwrite';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { createNotification } from '../lib/notifications';
import { SafeStorage } from '../lib/storage';
import { getOptimizedThumbnail, getOptimizedVideoUrl } from '../lib/cloudinary';

export default function Shorts() {
  const { id } = useParams();
  const [videos, setVideos] = useState<any[]>([]);
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  
  // Interaction State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');
  const [likesCount, setLikesCount] = useState(0);
  const [subsCount, setSubsCount] = useState("0");
  const [isLiking, setIsLiking] = useState(false);
  const [isSubbing, setIsSubbing] = useState(false);
  
  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        if (!dbId || !colId) {
          setError("Database configuration missing.");
          return;
        }

        let docs: any[] = [];
        
        // Priority 1: If an ID is provided, try to fetch it first
        if (id) {
          try {
            const specificDoc = await databases.getDocument(dbId, colId, id);
            if (specificDoc) {
              docs.push(specificDoc);
            }
          } catch (e) {
            console.error("Could not fetch specific short:", e);
          }
        }

        try {
          const res = await databases.listDocuments(dbId, colId, [
             Query.equal('contentType', 'shorts'), // Prefer shorts if marked
             Query.limit(50),
             Query.orderDesc('$createdAt')
          ]);
          
          // Merge and de-duplicate
          const existingIds = new Set(docs.map(d => d.$id));
          res.documents.forEach(doc => {
            if (!existingIds.has(doc.$id)) docs.push(doc);
          });
        } catch (queryErr: any) {
          console.log("Query by contentType failed, fetching all and filtering manually");
          const allRes = await databases.listDocuments(dbId, colId, [Query.limit(100), Query.orderDesc('$createdAt')]);
          const filtered = allRes.documents.filter((d: any) => d.contentType === 'shorts' || d.title?.toLowerCase().includes('#shorts') || d.description?.toLowerCase().includes('#shorts'));
          
          const existingIds = new Set(docs.map(d => d.$id));
          filtered.forEach(doc => {
            if (!existingIds.has(doc.$id)) docs.push(doc);
          });
        }

        if (docs.length === 0) {
          // Fallback to any videos if no shorts found (maybe they are vertical but not tagged)
          const fallbackRes = await databases.listDocuments(dbId, colId, [Query.limit(50), Query.orderDesc('$createdAt')]);
          const existingIds = new Set(docs.map(d => d.$id));
          fallbackRes.documents.forEach(doc => {
            if (!existingIds.has(doc.$id)) docs.push(doc);
          });
        }

        // Fetch user profiles to enrich avatars
        const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        if (profilesCol && docs.length > 0) {
          try {
            const profilesResult = await databases.listDocuments(dbId, profilesCol);
            const profilesMap = new Map(profilesResult.documents.map(p => [p.userId, p]));
            docs = docs.map(doc => {
               const profile = profilesMap.get(doc.uploaderId);
               if (profile) {
                 return {
                   ...doc,
                   uploaderName: profile.name || doc.uploaderName,
                   uploaderAvatar: profile.avatar || doc.uploaderAvatar
                 }
               }
               return doc;
             });
          } catch (e) {
            console.error("Could not fetch profiles for Shorts avatars", e);
          }
        }
        
        const finalDocs = docs.map(doc => ({
          id: doc.$id,
          $id: doc.$id,
          title: doc.title,
          videoUrl: doc.videoUrl,
          thumbnailUrl: doc.thumbnailUrl,
          uploaderId: doc.uploaderId,
          uploaderName: doc.uploaderName,
          uploaderAvatar: doc.uploaderAvatar,
          views: doc.views || 0,
          description: doc.description,
          contentType: doc.contentType || 'short'
        }));

        if (finalDocs.length === 0) {
          setError(language === 'ru' ? "Шортсы не найдены." : "No shorts found.");
          setVideos([]);
          return;
        }

        setVideos(finalDocs);

        if (id) {
          const index = finalDocs.findIndex(v => v.$id === id);
          if (index !== -1) setCurrentVideoIndex(index);
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load shorts.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchShorts();
  }, [id, language]);

  const fetchInteractions = async (videoId: string, uploaderId: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
      const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;

      if (!dbId) return;

      if (likesCol) {
        const likesRes = await databases.listDocuments(dbId, likesCol, [Query.equal('videoId', videoId)]);
        const totalLikes = likesRes.documents.filter((d: any) => d.type === 'like' || !d.type).length;
        setLikesCount(totalLikes);
        
        if (user) {
          const myLike = likesRes.documents.find(doc => doc.userId === user.$id && (doc.type === 'like' || doc.type === 'dislike' || !doc.type));
          if (myLike) {
            setLikeState(myLike.type === 'dislike' ? 'disliked' : 'liked');
          } else {
            setLikeState('none');
          }
        }
      }

      if (subsCol) {
         const subsRes = await databases.listDocuments(dbId, subsCol, [Query.equal('channelId', uploaderId)]);
         setSubsCount(new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(subsRes.total));
         if (user) {
           const mySub = subsRes.documents.find(doc => doc.subscriberId === user.$id);
           setIsSubscribed(!!mySub);
         }
      }
    } catch (err) {
      console.warn("Interactions fetch failed in Shorts:", err);
    }
  };

  const fetchComments = async (videoId: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
      if (!dbId || !commsCol) return;

      setIsLoadingComments(true);
      const res = await databases.listDocuments(dbId, commsCol, [
        Query.equal('videoId', videoId),
        Query.orderDesc('$createdAt')
      ]);
      
      setComments(res.documents.map(c => ({
        id: c.$id,
        author: c.authorName,
        text: c.text,
        authorAvatar: c.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}`,
        ts: t('video_recently') // Rough approximation
      })));
    } catch (err) {
      console.error("Comments fetch failed in Shorts:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (videos.length > 0) {
      const current = videos[currentVideoIndex];
      fetchInteractions(current.$id, current.uploaderId);
      if (showComments) fetchComments(current.$id);

      // Add to History
      try {
        let history = SafeStorage.get('watch_history', []);
        history = history.filter((v: any) => v.id !== current.$id);
        history.unshift({
          id: current.$id,
          title: current.title,
          channelName: current.uploaderName,
          channelAvatar: current.uploaderAvatar,
          views: current.views || 0,
          thumbnailUrl: current.thumbnailUrl,
          videoUrl: current.videoUrl,
          uploadDate: 'Recently',
          timestamp: Date.now(),
          contentType: 'shorts'
        });
        if (history.length > 100) history = history.slice(0, 100);
        SafeStorage.set('watch_history', history);
      } catch (e) {
        console.error("Failed to save to history", e);
      }
    }
  }, [currentVideoIndex, videos, user, language]);

  useEffect(() => {
    if (showComments && videos.length > 0) {
      fetchComments(videos[currentVideoIndex].$id);
    }
  }, [showComments]);

  const updateProfileStat = (userId: string, field: string, increment: number) => {
    // Non-blocking background update
    (async () => {
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
          await databases.updateDocument(dbId, profilesCol, doc.$id, {
            [field]: (doc[field] || 0) + increment
          });
        }
      } catch (err) {
        console.error(`Failed to update profile stat ${field} in background (Shorts):`, err);
      }
    })();
  };

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      alert(language === 'ru' ? 'Вам нужно войти в аккаунт, чтобы ставить оценки' : 'You must log in to rate videos');
      return;
    }
    if (isLiking || videos.length === 0) return;
    const current = videos[currentVideoIndex];
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
    if (!dbId || !likesCol) return;

    try {
      setIsLiking(true);
      const actionType = isLike ? 'like' : 'dislike';
      const res = await databases.listDocuments(dbId, likesCol, [
        Query.equal('videoId', current.$id),
        Query.equal('userId', user.$id)
      ]);
      
      if (res.total > 0) {
        const existingDoc = res.documents[0];
        const existingType = existingDoc.type || 'like';

        if (existingType === actionType) {
          await databases.deleteDocument(dbId, likesCol, existingDoc.$id);
          setLikeState('none');
          if (isLike) {
            setLikesCount(prev => prev - 1);
            updateProfileStat(current.uploaderId, 'likesCount', -1);
          }
        } else {
          await databases.updateDocument(dbId, likesCol, existingDoc.$id, { type: actionType });
          setLikeState(actionType as 'liked' | 'disliked');
          if (isLike) {
            setLikesCount(prev => prev + 1);
            updateProfileStat(current.uploaderId, 'likesCount', 1);
          }
          else {
            setLikesCount(prev => prev - 1);
            updateProfileStat(current.uploaderId, 'likesCount', -1);
          }
        }
      } else {
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: current.$id,
          userId: user.$id,
          type: actionType
        });
        setLikeState(actionType as 'liked' | 'disliked');
        if (isLike) {
          setLikesCount(prev => prev + 1);
          updateProfileStat(current.uploaderId, 'likesCount', 1);
          createNotification({
            userId: current.uploaderId,
            actorId: user.$id,
            actorName: profile?.name || user.name || 'User',
            actorAvatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
            type: 'like',
            videoId: current.$id,
            videoTitle: current.title,
            contentType: 'shorts'
          });
        }
      }
    } catch (err) {
      console.error("Like failed in Shorts:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert(language === 'ru' ? 'Вам нужно войти в аккаунт, чтобы подписаться' : 'You must log in to subscribe');
      return;
    }
    if (isSubbing || videos.length === 0) return;
    const current = videos[currentVideoIndex];
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
    if (!dbId || !subsCol) return;

    try {
      setIsSubbing(true);
      if (isSubscribed) {
        const res = await databases.listDocuments(dbId, subsCol, [
          Query.equal('channelId', current.uploaderId),
          Query.equal('subscriberId', user.$id)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(dbId, subsCol, res.documents[0].$id);
          setIsSubscribed(false);
          updateProfileStat(current.uploaderId, 'subscribersCount', -1);
        }
      } else {
        await databases.createDocument(dbId, subsCol, ID.unique(), {
          channelId: current.uploaderId,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
        updateProfileStat(current.uploaderId, 'subscribersCount', 1);

        createNotification({
          userId: current.uploaderId,
          actorId: user.$id,
          actorName: profile?.name || user.name || 'User',
          actorAvatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
          type: 'subscribe'
        });
      }
    } catch (err) {
      console.error("Subscribe failed in Shorts:", err);
    } finally {
      setIsSubbing(false);
    }
  };


  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isCommenting || videos.length === 0) return;
    
    const current = videos[currentVideoIndex];
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      setIsCommenting(true);
      const authorName = user ? (profile?.name || user.name || 'User') : (language === 'ru' ? 'Аноним' : 'Anonymous');
      const authorAvatar = user && profile?.avatar ? profile.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
      const authorId = user ? user.$id : 'anonymous';

      const res = await databases.createDocument(dbId, commsCol, ID.unique(), {
        videoId: current.$id,
        authorId: authorId,
        authorName: authorName,
        authorAvatar: authorAvatar,
        text: newComment,
        likes: 0,
        likedBy: [],
        dislikedBy: [],
        parentId: null
      });

      setComments([{
        id: res.$id,
        author: authorName,
        text: newComment,
        authorAvatar: authorAvatar,
        ts: t('video_recently')
      }, ...comments]);
      setNewComment("");

      createNotification({
        userId: current.uploaderId,
        actorId: authorId,
        actorName: authorName,
        actorAvatar: authorAvatar,
        type: 'comment',
        videoId: current.$id,
        videoTitle: current.title,
        contentType: 'shorts'
      });
    } catch (err) {
      console.error("Comment failed in Shorts:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center bg-black">
         <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
         <p className="text-slate-400 mt-4 tracking-wide">{language === 'ru' ? 'Загрузка Шортсов...' : 'Loading Shorts...'}</p>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center bg-black text-center px-6">
         <div className="w-20 h-20 bg-white/5 ice-border border rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(112,214,255,0.1)]">
            <X className="w-10 h-10 text-red-400/80" />
         </div>
         <h2 className="text-2xl font-bold text-white mb-2">{language === 'ru' ? 'Ошибка' : 'Error'}</h2>
         <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">{error || (language === 'ru' ? 'Видео не найдены. Попробуйте загрузить что-нибудь!' : 'No videos found. Try uploading something!')}</p>
         <Link 
           to="/"
           className="px-8 py-3 bg-[#70d6ff] text-black hover:bg-[#5bc0e6] rounded-full transition-all duration-300 font-bold shadow-lg shadow-[#70d6ff]/20 active:scale-95"
         >
           {language === 'ru' ? 'На главную' : 'Back Home'}
         </Link>
      </div>
    );
  }

  const current = videos[currentVideoIndex];
  const uploaderAvatar = current.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName)}`;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] px-0 bg-gradient-to-b from-gray-950 via-black to-gray-950 pt-0 sm:pt-6 overflow-hidden">
      
      {/* Main Container with enhanced responsive design */}
      <div className="relative w-full sm:max-w-[420px] h-full sm:h-[calc(100vh-160px)] aspect-[9/16] max-h-[85vh] sm:max-h-[calc(100vh-180px)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(112,214,255,0.15),0_20px_60px_rgba(0,0,0,0.6)] flex-shrink-0 border border-white/10 group">
        
        {/* Animated gradient border effect for desktop */}
        <div className="hidden sm:absolute sm:inset-0 sm:rounded-3xl sm:pointer-events-none sm:border-2 sm:border-transparent sm:bg-gradient-to-r sm:from-[#70d6ff]/20 sm:via-transparent sm:to-[#70d6ff]/20 sm:animate-pulse"></div>
        
        <video 
          key={current.$id}
          src={getOptimizedVideoUrl(current.videoUrl)} 
          poster={getOptimizedThumbnail(current.thumbnailUrl)}
          loop 
          autoPlay 
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => {
            const videoEl = e.target as HTMLVideoElement;
            const errCode = videoEl.error?.code;
            const errMsg = videoEl.error?.message;
            console.error("Shorts Playback Error details:", errCode, errMsg, "URL:", current.videoUrl);
            setPlaybackError(language === 'ru' ? `Ошибка: ${errCode} ${errMsg || ''}` : `Playback Error: ${errCode} ${errMsg || ''}`);
          }}
          onLoadedData={() => setPlaybackError(null)}
        />

        {playbackError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/90 via-slate-900/90 to-black/90 backdrop-blur-xl z-30 p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide mb-4">{playbackError}</span>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gradient-to-r from-[#70d6ff] to-cyan-400 hover:from-cyan-400 hover:to-[#70d6ff] text-black text-sm font-bold tracking-wide rounded-full transition-all duration-300 shadow-lg shadow-[#70d6ff]/30 active:scale-95"
            >
              {language === 'ru' ? 'Обновить' : 'Reload'}
            </button>
          </div>
        )}

        {/* Enhanced Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none z-[1]"></div>

        {/* Interaction Side Overlay (Right) - Enhanced for mobile and desktop */}
        <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-24 flex flex-col items-center gap-4 sm:gap-5 z-20">
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 group/btn">
                <button 
                  onClick={() => handleLike(true)}
                  disabled={isLiking}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                    likeState === 'liked' 
                      ? 'bg-gradient-to-br from-[#70d6ff] to-cyan-400 text-black shadow-[0_0_25px_rgba(112,214,255,0.6)] border-2 border-white/30' 
                      : 'bg-black/50 backdrop-blur-xl text-white hover:bg-white/25 border-2 border-white/20'
                  }`}
                >
                    <ThumbsUp className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform ${likeState === 'liked' ? 'fill-current scale-110' : ''}`} />
                </button>
                <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-lg tracking-wide">
                  {likesCount > 0 ? new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount) : 'Like'}
                </span>
            </div>

            {/* Dislike Button */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 group/btn">
                <button 
                  onClick={() => handleLike(false)}
                  disabled={isLiking}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                    likeState === 'disliked' 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] border-2 border-white/30' 
                      : 'bg-black/50 backdrop-blur-xl text-white hover:bg-white/25 border-2 border-white/20'
                  }`}
                >
                    <ThumbsDown className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform ${likeState === 'disliked' ? 'fill-current scale-110' : ''}`} />
                </button>
                <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-lg tracking-wide">
                  {language === 'ru' ? 'Не нр.' : 'Dislike'}
                </span>
            </div>

            {/* Comments Button */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 group/btn">
                <button 
                  onClick={() => setShowComments(true)}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-xl flex items-center justify-center text-white hover:from-purple-500/50 hover:to-pink-500/50 transition-all duration-300 border-2 border-white/20 transform hover:scale-110 active:scale-95 shadow-lg"
                >
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-lg tracking-wide">
                  {comments.length > 0 ? comments.length : '...'}
                </span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 group/btn">
                <button className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500/30 to-yellow-500/30 backdrop-blur-xl flex items-center justify-center text-white hover:from-orange-500/50 hover:to-yellow-500/50 transition-all duration-300 border-2 border-white/20 transform hover:scale-110 active:scale-95 shadow-lg">
                    <Share2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-lg tracking-wide">
                  {language === 'ru' ? 'Share' : 'Share'}
                </span>
            </div>

            {/* Channel Avatar with enhanced animation */}
            <Link to={`/channel/${current.uploaderId}`} className="mt-2 sm:mt-3 group/avatar block">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-br from-[#70d6ff] via-cyan-400 to-[#70d6ff] animate-spin-slow hover:animate-none shadow-[0_0_20px_rgba(112,214,255,0.4)]">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                  <img 
                    src={uploaderAvatar} 
                    alt="channel" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName || 'User')}&background=random`;
                    }}
                  />
                </div>
              </div>
            </Link>
        </div>

        {/* Content Info (Bottom) - Enhanced typography and layout */}
        <div className="absolute bottom-0 left-0 right-14 sm:right-20 p-3 sm:p-5 pt-16 sm:pt-20 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col gap-2.5 sm:gap-3 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to={`/channel/${current.uploaderId}`} className="shrink-0 group/channel">
              <div className="relative">
                <img 
                  src={uploaderAvatar} 
                  alt={current.uploaderName || 'User'} 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white/30 shadow-lg transition-transform group-hover/channel:scale-105" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName || 'User')}&background=random`;
                  }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#70d6ff] rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full"></div>
                </div>
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/channel/${current.uploaderId}`} className="block">
                <span className="text-white font-bold text-sm sm:text-base truncate drop-shadow-lg hover:text-[#70d6ff] transition-colors">@{current.uploaderName || 'user'}</span>
              </Link>
              <span className="text-white/60 text-[11px] sm:text-xs font-medium">{subsCount} {language === 'ru' ? 'подписчиков' : 'subscribers'}</span>
            </div>
            <button 
              onClick={handleSubscribe}
              disabled={isSubbing}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                isSubscribed 
                  ? 'bg-white/20 backdrop-blur-xl text-white border border-white/30' 
                  : 'bg-gradient-to-r from-[#70d6ff] to-cyan-400 text-black hover:from-cyan-400 hover:to-[#70d6ff] shadow-[#70d6ff]/30'
              }`}
            >
              {isSubscribed 
                ? (language === 'ru' ? '✓ Подписан' : '✓ Subscribed') 
                : (language === 'ru' ? 'Подписаться' : 'Subscribe')}
            </button>
          </div>
          <h2 className="text-white text-sm sm:text-base font-semibold line-clamp-2 leading-relaxed drop-shadow-lg tracking-wide">
            {current.title}
          </h2>
        </div>

        {/* Navigation Arrows - Enhanced visibility and interaction */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1 sm:left-3 flex flex-col gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
           <button 
             onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
             disabled={currentVideoIndex === 0}
             className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:from-white/30 hover:to-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/20 shadow-lg"
           >
             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
           </button>
           <button 
             onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
             disabled={currentVideoIndex === videos.length - 1}
             className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:from-white/30 hover:to-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/20 shadow-lg"
           >
             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
           </button>
        </div>

        {/* Progress indicator dots for mobile */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {videos.slice(Math.max(0, currentVideoIndex - 2), Math.min(videos.length, currentVideoIndex + 3)).map((_, idx) => {
            const actualIdx = Math.max(0, currentVideoIndex - 2) + idx;
            return (
              <button
                key={actualIdx}
                onClick={() => setCurrentVideoIndex(actualIdx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  actualIdx === currentVideoIndex 
                    ? 'bg-[#70d6ff] w-4 shadow-[0_0_8px_rgba(112,214,255,0.8)]' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            );
          })}
        </div>

      </div>

      {/* Enhanced Desktop Navigation Bar */}
      <div className="hidden sm:flex mt-8 gap-6 items-center">
         <button 
           onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
           disabled={currentVideoIndex === 0}
           className="group px-7 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 hover:border-white/30 hover:shadow-lg active:scale-95 flex items-center gap-2"
         >
           <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           {language === 'ru' ? 'Назад' : 'Previous'}
         </button>
         
         <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
           <div className="w-2 h-2 rounded-full bg-[#70d6ff] shadow-[0_0_8px_rgba(112,214,255,0.6)] animate-pulse"></div>
           <span className="text-white/90 text-sm font-bold font-mono tracking-wider">{String(currentVideoIndex + 1).padStart(2, '0')}</span>
           <span className="text-white/40 text-xs font-mono">/</span>
           <span className="text-white/60 text-sm font-mono tracking-wider">{String(videos.length).padStart(2, '0')}</span>
         </div>
         
         <button 
           onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
           disabled={currentVideoIndex === videos.length - 1}
           className="group px-7 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 hover:border-white/30 hover:shadow-lg active:scale-95 flex items-center gap-2"
         >
           {language === 'ru' ? 'Далее' : 'Next'}
           <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
         </button>
      </div>

      {/* Mobile swipe hint with improved design */}
      <div className="sm:hidden mt-4 mb-2 flex items-center gap-2 text-white/40 text-[11px] font-medium">
        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        <span>{language === 'ru' ? 'Свайп вверх/вниз' : 'Swipe up/down'}</span>
        <svg className="w-4 h-4 animate-bounce" style={{ animationDelay: '0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </div>

      {/* Comments Sidebar/Overlay */}
      {showComments && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#0f0f0f] rounded-t-2xl sm:rounded-2xl h-[70vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
             
             {/* Header */}
             <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <h3 className="text-white font-bold">{language === 'ru' ? 'Комментарии' : 'Comments'}</h3>
                <button 
                  onClick={() => setShowComments(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             {/* Comments List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
                {isLoadingComments ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                     <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 animate-pulse">
                    {language === 'ru' ? 'Пока нет комментариев. Будьте первым!' : 'No comments yet. Be the first!'}
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                     <img 
                       src={c.authorAvatar} 
                       alt="author" 
                       className="w-9 h-9 rounded-full shrink-0 shadow-lg border border-white/10" 
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author || 'User')}&background=random`;
                       }}
                     />
                       <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-white">@{c.author}</span>
                             <span className="text-[10px] text-slate-500">{c.ts}</span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed break-words">{c.text}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>

             {/* Input Area */}
             <div className="p-4 border-t border-white/10 bg-black/40">
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={language === 'ru' ? 'Добавьте комментарий (как инкогнито)...' : 'Add a comment (as anonymous)...'}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#70d6ff] transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={isCommenting || !newComment.trim()}
                      className="p-2.5 bg-[#70d6ff] text-black rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
             </div>

          </div>
        </div>
      )}

    </div>
  );
}
