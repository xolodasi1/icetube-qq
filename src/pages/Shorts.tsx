import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, X, Loader2, Send } from 'lucide-react';
import { databases } from '../lib/appwrite';
import { Query, ID } from 'appwrite';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

import { getOptimizedThumbnail } from '../lib/cloudinary';

export default function Shorts() {
  const { id } = useParams();
  const [videos, setVideos] = useState<any[]>([]);
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
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
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (!dbId || !colId) return;

      try {
        const res = await databases.listDocuments(dbId, colId, [
           Query.equal('contentType', 'short'), // Prefer shorts if marked
           Query.limit(50)
        ]);
        
        let docs = res.documents;
        if (docs.length === 0) {
          // Fallback to any videos if no shorts found
          const allRes = await databases.listDocuments(dbId, colId, [Query.limit(50)]);
          docs = allRes.documents;
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
        
        const finalDocs = docs.reverse();
        setVideos(finalDocs);

        if (id) {
          const index = finalDocs.findIndex(v => v.$id === id);
          if (index !== -1) setCurrentVideoIndex(index);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchShorts();
  }, []);

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
    }
  }, [currentVideoIndex, videos, user, language]);

  useEffect(() => {
    if (showComments && videos.length > 0) {
      fetchComments(videos[currentVideoIndex].$id);
    }
  }, [showComments]);

  const handleLike = async (isLike: boolean) => {
    if (!user || isLiking || videos.length === 0) return;
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
          if (isLike) setLikesCount(prev => prev - 1);
        } else {
          await databases.updateDocument(dbId, likesCol, existingDoc.$id, { type: actionType });
          setLikeState(actionType as 'liked' | 'disliked');
          if (isLike) setLikesCount(prev => prev + 1);
          else setLikesCount(prev => prev - 1);
        }
      } else {
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: current.$id,
          userId: user.$id,
          type: actionType
        });
        setLikeState(actionType as 'liked' | 'disliked');
        if (isLike) setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Like failed in Shorts:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || isSubbing || videos.length === 0) return;
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
        }
      } else {
        await databases.createDocument(dbId, subsCol, ID.unique(), {
          channelId: current.uploaderId,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Subscribe failed in Shorts:", err);
    } finally {
      setIsSubbing(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isCommenting || videos.length === 0) return;
    
    const current = videos[currentVideoIndex];
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      setIsCommenting(true);
      const authorName = profile?.name || user.name || 'User';
      const authorAvatar = profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;

      const res = await databases.createDocument(dbId, commsCol, ID.unique(), {
        videoId: current.$id,
        authorId: user.$id,
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
    } catch (err) {
      console.error("Comment failed in Shorts:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-[#70d6ff]" />
         <p className="text-slate-400 ml-3">Loading Shorts...</p>
      </div>
    );
  }

  const current = videos[currentVideoIndex];
  const uploaderAvatar = current.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName)}`;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] px-0 bg-black pt-0 sm:pt-4 overflow-hidden">
      
      {/* Immersive Video Container */}
      <div className="relative w-full sm:max-w-[380px] h-full sm:h-[calc(100vh-140px)] aspect-[9/16] bg-slate-900 sm:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex-shrink-0 border border-white/5 group">
        
        <video 
          key={current.$id}
          src={current.videoUrl} 
          poster={getOptimizedThumbnail(current.thumbnailUrl)}
          loop 
          autoPlay 
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Interaction Side Overlay (Right) */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
            <div className="flex flex-col items-center gap-1 group">
                <button 
                  onClick={() => handleLike(true)}
                  disabled={isLiking}
                  className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all ${likeState === 'liked' ? 'bg-[#70d6ff] text-black shadow-[0_0_15px_rgba(112,214,255,0.5)]' : 'bg-black/40 text-white hover:bg-white/20'}`}
                >
                    <ThumbsUp className={`w-6 h-6 ${likeState === 'liked' ? 'fill-current' : ''}`} />
                </button>
                <span className="text-white text-xs font-bold drop-shadow-md">{likesCount > 0 ? new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount) : 'Like'}</span>
            </div>

            <div className="flex flex-col items-center gap-1 group">
                <button 
                  onClick={() => handleLike(false)}
                  disabled={isLiking}
                  className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all ${likeState === 'disliked' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 text-white hover:bg-white/20'}`}
                >
                    <ThumbsDown className={`w-6 h-6 ${likeState === 'disliked' ? 'fill-current' : ''}`} />
                </button>
                <span className="text-white text-xs font-bold drop-shadow-md">{language === 'ru' ? 'Не нр.' : 'Dislike'}</span>
            </div>

            <div className="flex flex-col items-center gap-1 group">
                <button 
                  onClick={() => setShowComments(true)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
                <span className="text-white text-xs font-bold drop-shadow-md">...</span>
            </div>

            <div className="flex flex-col items-center gap-1 group">
                <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <Share2 className="w-6 h-6" />
                </button>
                <span className="text-white text-xs font-bold drop-shadow-md">{language === 'ru' ? 'Поделиться' : 'Share'}</span>
            </div>

            <button className="w-10 h-10 rounded-lg overflow-hidden border-2 border-[#70d6ff]/30 shadow-lg mt-2 animate-pulse">
                <img 
                  src={uploaderAvatar} 
                  alt="audio" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName || 'User')}&background=random`;
                  }}
                />
            </button>
        </div>

        {/* Content Info (Bottom) */}
        <div className="absolute bottom-0 left-0 right-16 p-4 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2">
            <Link to={`/channel/${current.uploaderId}`} className="shrink-0">
              <img 
                src={uploaderAvatar} 
                alt={current.uploaderName || 'User'} 
                className="w-9 h-9 rounded-full border border-white/20 shadow-md" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName || 'User')}&background=random`;
                }}
              />
            </Link>
            <Link to={`/channel/${current.uploaderId}`} className="text-white font-bold text-sm truncate drop-shadow-md hover:underline decoration-[#70d6ff]">@{current.uploaderName || 'user'}</Link>
            <button 
              onClick={handleSubscribe}
              disabled={isSubbing}
              className={`px-4 py-1.5 rounded-full text-xs font-bold ml-1 transition-all ${isSubscribed ? 'bg-white/20 text-white' : 'bg-[#70d6ff] text-black hover:bg-white'}`}
            >
              {isSubscribed ? (language === 'ru' ? 'Вы подписаны' : 'Subscribed') : (language === 'ru' ? 'Подписаться' : 'Subscribe')}
            </button>
          </div>
          <h2 className="text-white text-sm font-medium line-clamp-2 leading-snug drop-shadow-md">
            {current.title}
          </h2>
        </div>

        {/* Next/Prev Navigation Hints */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
             className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20"
           >
             ↑
           </button>
           <button 
             onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
             className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20"
           >
             ↓
           </button>
        </div>

      </div>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex mt-6 gap-6 items-center">
         <button 
           onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
           disabled={currentVideoIndex === 0}
           className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all disabled:opacity-20 border border-white/5"
         >
           {language === 'ru' ? 'Назад' : 'Previous'}
         </button>
         <div className="text-white/40 text-sm font-mono">{currentVideoIndex + 1} / {videos.length}</div>
         <button 
           onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
           disabled={currentVideoIndex === videos.length - 1}
           className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all disabled:opacity-20 border border-white/5"
         >
           {language === 'ru' ? 'Далее' : 'Next'}
         </button>
      </div>

      {/* Mobile Swipe Simulation Hint */}
      <div className="sm:hidden mt-2 text-white/30 text-[10px] pb-4">
        Swipe buttons up/down to see more
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
                {!user ? (
                   <button 
                    disabled
                    className="w-full py-3 bg-white/5 rounded-xl text-slate-500 text-sm font-bold border border-white/5"
                   >
                     {language === 'ru' ? 'Войдите, чтобы комментировать' : 'Sign in to comment'}
                   </button>
                ) : (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={language === 'ru' ? 'Добавьте комментарий...' : 'Add a comment...'}
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
                )}
             </div>

          </div>
        </div>
      )}

    </div>
  );
}
