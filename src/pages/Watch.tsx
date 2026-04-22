import { useParams, Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, MessageSquare, Loader2, Video, User, Edit2, Trash2 } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import React, { useState, useEffect } from "react";
import { databases } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [video, setVideo] = useState<any | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real Interaction State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');
  const [likesCount, setLikesCount] = useState(0); 
  const [subsCount, setSubsCount] = useState("0");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubbing, setIsSubbing] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const fetchInteractions = async (videoId: string, uploaderId: string) => {
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
      const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
      const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;

      if (!dbId) return;

      // Fetch Likes Count & User Like State
      if (likesCol) {
        const likesRes = await databases.listDocuments(dbId, likesCol, [Query.equal('videoId', videoId)]);
        setLikesCount(likesRes.total);
        if (user) {
          const myLike = likesRes.documents.find(doc => doc.userId === user.$id);
          if (myLike) setLikeState('liked');
        }
      }

      // Fetch Subs Count & User Sub State
      if (subsCol) {
         const subsRes = await databases.listDocuments(dbId, subsCol, [Query.equal('channelId', uploaderId)]);
         setSubsCount(new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(subsRes.total));
         if (user) {
           const mySub = subsRes.documents.find(doc => doc.subscriberId === user.$id);
           setIsSubscribed(!!mySub);
         }
      }

      // Fetch Comments
      if (commsCol) {
        const commsRes = await databases.listDocuments(dbId, commsCol, [
          Query.equal('videoId', videoId),
          Query.orderDesc('$createdAt')
        ]);
        setComments(commsRes.documents.map(c => ({
          id: c.$id,
          authorId: c.authorId,
          author: c.authorName,
          ts: new Date(c.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
          text: c.text,
          likes: c.likes || 0,
          authorAvatar: c.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}`
        })));
      } else {
        setComments([]);
      }

    } catch (err) {
      console.warn("Interactions collection might be missing attributes or ID:", err);
    }
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setIsLoading(true);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        
        if (!dbId || !colId || !id) return;

        const response = await databases.listDocuments(dbId, colId);
        
        const allFormatted = response.documents.map(v => ({
            id: v.$id,
            uploaderId: v.uploaderId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            videoUrl: v.videoUrl,
            channelName: v.uploaderName,
            channelAvatar: v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
            views: v.views || 0,
            uploadDate: t('video_recently'),
            description: v.description || t('video_no_description')
        }));

        const currentVideo = allFormatted.find(v => v.id === id);
        
        if (currentVideo) {
          setVideo(currentVideo);
          setSuggestedVideos(allFormatted.filter(v => v.id !== id).reverse());
          fetchInteractions(currentVideo.id, currentVideo.uploaderId);
          
          // Increment View Count
          try {
            await databases.updateDocument(dbId, colId, currentVideo.id, {
              views: (currentVideo.views || 0) + 1
            });
          } catch (viewErr) {
            console.error("View increment failed:", viewErr);
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [id, user, language]);

  const handleLike = async () => {
    if (!user || isLiking) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
    if (!dbId || !likesCol) return;

    try {
      setIsLiking(true);
      if (likeState === 'liked') {
        const res = await databases.listDocuments(dbId, likesCol, [
          Query.equal('videoId', id!),
          Query.equal('userId', user.$id)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(dbId, likesCol, res.documents[0].$id);
          setLikeState('none');
          setLikesCount(prev => prev - 1);
        }
      } else {
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: id,
          userId: user.$id
        });
        setLikeState('liked');
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || isSubbing || !video) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const subsCol = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
    if (!dbId || !subsCol) return;

    try {
      setIsSubbing(true);
      if (isSubscribed) {
        const res = await databases.listDocuments(dbId, subsCol, [
          Query.equal('channelId', video.uploaderId),
          Query.equal('subscriberId', user.$id)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(dbId, subsCol, res.documents[0].$id);
          setIsSubscribed(false);
        }
      } else {
        await databases.createDocument(dbId, subsCol, ID.unique(), {
          channelId: video.uploaderId,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error("Sub failed:", err);
    } finally {
      setIsSubbing(false);
    }
  };

  // Comment logic
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isCommenting) return;
    
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) {
      console.error("Comments collection not configured");
      return;
    }

    try {
      setIsCommenting(true);
      const res = await databases.createDocument(dbId, commsCol, ID.unique(), {
        videoId: id,
        authorId: user.$id,
        authorName: user.name,
        authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
        text: newComment,
        likes: 0
      });

      setComments([
        {
          id: res.$id,
          authorId: res.authorId,
          author: res.authorName,
          ts: t('video_recently'),
          text: res.text,
          likes: 0,
          authorAvatar: res.authorAvatar
        },
        ...comments
      ]);
      setNewComment("");
    } catch (err: any) {
      console.error("Comment submission failed:", err);
      // Basic check for missing attributes in Appwrite
      if (err.message?.includes('attribute') && err.message?.includes('not found')) {
        alert(language === 'ru' ? 'Ошибка: в коллекции Appwrite не хватает полей (videoId, authorId, authorName, authorAvatar, text, likes)' : 'Error: Appwrite collection missing attributes (videoId, authorId, authorName, authorAvatar, text, likes)');
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentLike = async (commentId: string, isLike: boolean) => {
    if (!user || isCommenting) return;
    // For now we just update locally and attempt update in DB
    // Ideally we need a separate collection for comment likes to be strictly correct
    // But for a simple version we can just increment/decrement the 'likes' attribute on the comment
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const newLikes = isLike ? (comment.likes + 1) : Math.max(0, comment.likes - 1);
      
      setComments(comments.map(c => c.id === commentId ? { ...c, likes: newLikes } : c));
      
      await databases.updateDocument(dbId, commsCol, commentId, {
        likes: newLikes
      });
    } catch (err) {
      console.error("Comment interaction failed:", err);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingText.trim() || isCommenting) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      setIsCommenting(true);
      await databases.updateDocument(dbId, commsCol, commentId, {
        text: editingText
      });
      setComments(comments.map(c => c.id === commentId ? { ...c, text: editingText } : c));
      setEditingCommentId(null);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(language === 'ru' ? 'Удалить комментарий?' : 'Delete comment?')) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      await databases.deleteDocument(dbId, commsCol, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff]" />
        <p>{language === 'ru' ? t('video_connecting') : 'Loading video...'}</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4 h-[70vh]">
        <Video className="w-12 h-12 text-slate-500 mb-2" />
        <h1 className="text-2xl font-bold text-white">{t('video_not_found')}</h1>
        <p>{t('video_not_found_desc')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      {/* Primary Video Section */}
      <div className="flex-1 lg:w-[70%]">
        <div className="w-full aspect-video bg-black sm:rounded-xl overflow-hidden sm:border ice-border sm:shadow-2xl relative">
          <video 
            autoPlay 
            controls 
            className="w-full h-full object-contain"
            poster={video.thumbnailUrl}
            src={video.videoUrl} 
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white">{video.title}</h1>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to={`/channel/${video.uploaderId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                <img src={video.channelAvatar} alt={video.channelName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-cold-border" referrerPolicy="no-referrer" />
              </Link>
              <div className="flex flex-col">
                <Link to={`/channel/${video.uploaderId}`} className="font-medium text-slate-100 hover:text-[#70d6ff] transition-colors">{video.channelName}</Link>
                <span className="text-xs text-slate-400">{subsCount} {t('video_subscribers')}</span>
              </div>
              <button 
                disabled={isSubbing || !user}
                onClick={handleSubscribe}
                className={`ml-2 font-medium px-4 py-2 rounded-full transition-colors text-sm ${isSubscribed ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-slate-100 text-black hover:bg-slate-300'}`}
              >
                {isSubscribed ? t('video_subscribed') : t('video_subscribe')}
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <div className="flex items-center bg-white/5 border ice-border rounded-full overflow-hidden shrink-0 cursor-pointer text-slate-300">
                <button 
                  disabled={isLiking || !user}
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors border-r ice-border text-sm ${likeState === 'liked' ? 'text-[#70d6ff]' : ''}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likeState === 'liked' ? 'fill-current' : ''}`} />
                  <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount)}</span>
                </button>
                <button 
                  className={`px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors text-sm`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
              
              <button className="flex items-center gap-2 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 px-4 py-2 rounded-full transition-colors text-sm shrink-0">
                <Share2 className="w-4 h-4" />
                <span>{t('video_share')}</span>
              </button>
              
              <button className="flex items-center justify-center w-9 h-9 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 rounded-full transition-colors shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white/5 border ice-border p-4 rounded-xl text-sm mx-4 sm:mx-0">
          <div className="font-medium text-slate-200 mb-2">
            {new Intl.NumberFormat().format(video.views)} {t('video_views')} • {video.uploadDate}
          </div>
          <p className="text-slate-300 whitespace-pre-wrap">{video.description}</p>
        </div>

        <div className="mt-8 mb-10 px-4 sm:px-0">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b-2 border-ice-500 pb-1 inline-flex text-white">
              <MessageSquare className="w-5 h-5 text-ice-400" />
              {comments.length} {t('video_comments')}
            </h2>
          </div>
          
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#70d6ff] to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={newComment}
                  disabled={isCommenting}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={language === 'ru' ? 'Оставьте комментарий...' : "Add a comment... (Press Enter to post)"} 
                  className="w-full bg-transparent border-b ice-border focus:border-[#70d6ff]/50 transition-colors pb-1 outline-none text-sm text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </form>
          ) : (
            <div className="p-4 bg-white/5 rounded-xl text-center text-slate-400 text-sm">
              <Link to="/settings" className="text-[#70d6ff] hover:underline">{t('nav_sign_in')}</Link> {t('video_sign_in_comment')}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img 
                  src={comment.authorAvatar} 
                  className="w-10 h-10 rounded-full shrink-0 object-cover bg-slate-700" 
                  alt={comment.author} 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-medium text-slate-200">@{comment.author}</span>
                      <span className="text-slate-500">{comment.ts}</span>
                    </div>
                    {user && user.$id === comment.authorId && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                         <button onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.text); }} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-[#70d6ff] transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                         </button>
                         <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                       <input 
                         type="text" 
                         value={editingText} 
                         onChange={(e) => setEditingText(e.target.value)}
                         className="w-full bg-white/5 border-b ice-border focus:border-[#70d6ff]/50 outline-none text-sm text-slate-200 p-1"
                         autoFocus
                       />
                       <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingCommentId(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">{t('comment_cancel')}</button>
                          <button onClick={() => handleUpdateComment(comment.id)} className="text-xs bg-[#70d6ff]/20 text-[#70d6ff] px-3 py-1 rounded hover:bg-[#70d6ff]/30 transition-colors font-medium">{t('comment_save')}</button>
                       </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 mb-2">{comment.text}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-slate-400">
                    <button 
                      onClick={() => handleCommentLike(comment.id, true)} 
                      className="flex items-center gap-1.5 hover:text-[#70d6ff] transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> 
                      <span className="text-xs">{comment.likes > 0 && comment.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleCommentLike(comment.id, false)} 
                      className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    {user && user.$id !== comment.authorId && (
                      <button 
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id);
                          setReplyText("");
                        }}
                        className="text-xs font-semibold hover:text-white transition-colors uppercase tracking-wider"
                      >
                        {t('comment_reply')}
                      </button>
                    )}
                  </div>
                  
                  {replyingToId === comment.id && !editingCommentId && (
                    <div className="mt-3 flex gap-3 animate-in slide-in-from-top-1 duration-200">
                       <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-[10px] font-bold">
                         {user?.name?.charAt(0).toUpperCase()}
                       </div>
                       <div className="flex-1 flex flex-col gap-2">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder={t('comment_reply_placeholder')}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-transparent border-b ice-border focus:border-[#70d6ff]/50 outline-none text-sm text-slate-200 py-1"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setReplyingToId(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">{t('comment_cancel')}</button>
                            <button className="text-xs bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-slate-200 transition-colors">{t('comment_reply')}</button>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:w-[30%] flex flex-col gap-4">
        {suggestedVideos.map(vid => (
          <VideoCard key={vid.id} video={vid} layout="list" />
        ))}
      </div>
    </div>
  );
}
