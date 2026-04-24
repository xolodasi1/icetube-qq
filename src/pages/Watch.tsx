import { useParams, Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, MessageSquare, Loader2, Video, User, Edit2, Trash2, Snowflake, ShieldAlert, X, Bookmark, ListFilter } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import React, { useState, useEffect } from "react";
import { databases, Permission, Role } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";

export default function Watch() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  
  const [video, setVideo] = useState<any | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real Interaction State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');
  const [hasSnowflaked, setHasSnowflaked] = useState(false);
  const [likesCount, setLikesCount] = useState(0); 
  const [dislikesCount, setDislikesCount] = useState(0);
  const [snowflakesCount, setSnowflakesCount] = useState(0);
  const [subsCount, setSubsCount] = useState("0");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubbing, setIsSubbing] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSnowflaking, setIsSnowflaking] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSendReport = async (reasonId: string) => {
    if (!user || !video || isReporting) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const reportsCol = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
    
    if (!dbId || !reportsCol) {
      alert(language === 'ru' ? 'Ошибка: Идентификатор коллекции жалоб не настроен.' : 'Error: Reports collection ID not configured.');
      return;
    }

    try {
      setIsReporting(true);
      await databases.createDocument(dbId, reportsCol, ID.unique(), {
        videoId: video.id,
        videoTitle: video.title,
        reporterId: user.$id,
        reporterName: profile?.name || user.name || 'User',
        reason: reasonId,
        timestamp: new Date().toISOString()
      });
      
      alert(t('admin_report_success'));
      setShowReportModal(false);
    } catch (err: any) {
      console.error("Reporting failed:", err);
      if (err.message?.includes('Collection not found')) {
        alert(language === 'ru' ? 'Ошибка: Коллекция "Reports" не создана в Appwrite.' : 'Error: "Reports" collection not found in Appwrite.');
      } else {
        alert(t('admin_report_fail') + " " + err.message);
      }
    } finally {
      setIsReporting(false);
    }
  };

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
        const totalLikes = likesRes.documents.filter((d: any) => d.type === 'like' || !d.type).length;
        const totalDislikes = likesRes.documents.filter((d: any) => d.type === 'dislike').length;
        const totalSnowflakes = likesRes.documents.filter((d: any) => d.type === 'snowflake').length;
        
        setLikesCount(totalLikes);
        setDislikesCount(totalDislikes);
        setSnowflakesCount(totalSnowflakes);
        
        if (user) {
          const myLike = likesRes.documents.find(doc => doc.userId === user.$id && (doc.type === 'like' || doc.type === 'dislike' || !doc.type));
          if (myLike) {
            setLikeState(myLike.type === 'dislike' ? 'disliked' : 'liked');
          }
          
          const mySnowflake = likesRes.documents.find(doc => doc.userId === user.$id && doc.type === 'snowflake');
          setHasSnowflaked(!!mySnowflake);
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
          likedBy: c.likedBy || [],
          dislikedBy: c.dislikedBy || [],
          parentId: c.parentId || null,
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

  const handleLike = async (isLike: boolean) => {
    if (!user || isLiking) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
    if (!dbId || !likesCol) return;

    try {
      setIsLiking(true);
      const actionType = isLike ? 'like' : 'dislike';
      
      const res = await databases.listDocuments(dbId, likesCol, [
        Query.equal('videoId', id!),
        Query.equal('userId', user.$id)
      ]);
      
      if (res.total > 0) {
        const existingDoc = res.documents[0];
        const existingType = existingDoc.type || 'like';

        if (existingType === actionType) {
          // Remove interaction
          await databases.deleteDocument(dbId, likesCol, existingDoc.$id);
          setLikeState('none');
          if (isLike) setLikesCount(prev => prev - 1);
          else setDislikesCount(prev => prev - 1);
        } else {
          // Switch interaction
          await databases.updateDocument(dbId, likesCol, existingDoc.$id, {
            type: actionType
          });
          setLikeState(actionType as 'liked' | 'disliked');
          if (isLike) {
            setLikesCount(prev => prev + 1);
            setDislikesCount(prev => prev - 1);
          } else {
            setLikesCount(prev => prev - 1);
            setDislikesCount(prev => prev + 1);
          }
        }
      } else {
        // Create new
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: id,
          userId: user.$id,
          type: actionType
        });
        setLikeState(actionType as 'liked' | 'disliked');
        if (isLike) setLikesCount(prev => prev + 1);
        else setDislikesCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error("Like failed:", err);
      if (err.message?.toLowerCase().includes('attribute') || err.message?.toLowerCase().includes('invalid document structure')) {
        alert(language === 'ru' ? 'Вам нужно добавить атрибут type (String, размер 10) в коллекцию Likes в базе данных Appwrite, чтобы заработали дизлайки по видео.' : 'You need to add a "type" (String, size 10) attribute to the Likes collection in Appwrite for video dislikes to work.');
      } else {
        alert("Ошибка: " + err.message);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleSnowflake = async () => {
    if (!user || isSnowflaking || !video) return;
    
    // Restriction: Author cannot flake their own video
    if (user.$id === video.uploaderId) {
      alert(language === 'ru' ? 'Вы не можете ставить снежинки на своё видео!' : 'You cannot snowflake your own video!');
      return;
    }

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const likesCol = import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID;
    if (!dbId || !likesCol) return;

    try {
      setIsSnowflaking(true);
      const res = await databases.listDocuments(dbId, likesCol, [
        Query.equal('videoId', id!),
        Query.equal('userId', user.$id),
        Query.equal('type', 'snowflake')
      ]);

      if (res.total > 0) {
        await databases.deleteDocument(dbId, likesCol, res.documents[0].$id);
        setHasSnowflaked(false);
        setSnowflakesCount(prev => prev - 1);
      } else {
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: id,
          userId: user.$id,
          type: 'snowflake'
        });
        setHasSnowflaked(true);
        setSnowflakesCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error("Snowflake failed:", err);
    } finally {
      setIsSnowflaking(false);
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
      const authorName = profile?.name || user.name || 'User';
      const authorAvatar = profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;

      const res = await databases.createDocument(
        dbId, 
        commsCol, 
        ID.unique(), 
        {
          videoId: id,
          authorId: user.$id,
          authorName: authorName,
          authorAvatar: authorAvatar,
          text: newComment,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: null
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.users()),
          Permission.delete(Role.user(user.$id))
        ]
      );

      setComments([
        {
          id: res.$id,
          authorId: res.authorId,
          author: res.authorName,
          ts: t('video_recently'),
          text: res.text,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: null,
          authorAvatar: res.authorAvatar
        },
        ...comments
      ]);
      setNewComment("");
    } catch (err: any) {
      console.error("Comment submission failed:", err);
      
      if (err.message?.includes('likedBy') && err.message?.includes('invalid type')) {
        alert(language === 'ru' ? '🛑 ОШИБКА: Вы создали поле likedBy как обычную Строку (String), а нужен МАССИВ (Array)!\n\n1. Зайдите в Appwrite -> Databases -> IcetubeDB -> Comments -> Attributes\n2. Удалите текущие поля likedBy и dislikedBy.\n3. Создайте их заново (Create Attribute -> String), но ОБЯЗАТЕЛЬНО выберите тип ARRAY (массив размер 255), а не просто строку.' : 'ERROR: likedBy must be an Array. Delete it in Appwrite and recreate as String Array.');
      } else if (err.message?.includes('attribute') && err.message?.includes('not found')) {
        alert(language === 'ru' ? 'Ошибка: в коллекции Comments не хватает полей. Добавьте: likedBy (String Array), dislikedBy (String Array), parentId (String)' : 'Error: Appwrite collection missing attributes (likedBy: String Array, dislikedBy: String Array, parentId: String)');
      } else {
        alert("Error: " + err.message);
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentLike = async (commentId: string, isLike: boolean) => {
    if (!user || isCommenting) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      let newLikedBy = [...(comment.likedBy || [])];
      let newDislikedBy = [...(comment.dislikedBy || [])];

      if (isLike) {
        if (newLikedBy.includes(user.$id)) {
          newLikedBy = newLikedBy.filter(id => id !== user.$id); // Remove like
        } else {
          newLikedBy.push(user.$id);
          newDislikedBy = newDislikedBy.filter(id => id !== user.$id); // Remove dislike
        }
      } else {
        if (newDislikedBy.includes(user.$id)) {
          newDislikedBy = newDislikedBy.filter(id => id !== user.$id); // Remove dislike
        } else {
          newDislikedBy.push(user.$id);
          newLikedBy = newLikedBy.filter(id => id !== user.$id); // Remove like
        }
      }

      const newLikes = newLikedBy.length - newDislikedBy.length;
      
      setComments(comments.map(c => c.id === commentId ? { 
        ...c, 
        likes: newLikes,
        likedBy: newLikedBy,
        dislikedBy: newDislikedBy 
      } : c));
      
      await databases.updateDocument(dbId, commsCol, commentId, {
        likes: newLikes,
        likedBy: newLikedBy,
        dislikedBy: newDislikedBy
      });
    } catch (err: any) {
      console.error("Comment interaction failed:", err);
      if (err.message?.includes('likedBy') && err.message?.includes('invalid type')) {
        alert(language === 'ru' ? '🛑 ОШИБКА: Вы создали поле likedBy как обычную Строку (String), а нужен МАССИВ (Array)!\n\n1. Зайдите в Appwrite -> Databases -> IcetubeDB -> Comments -> Attributes\n2. Удалите текущие поля likedBy и dislikedBy.\n3. Создайте их заново (Create Attribute -> String), но ОБЯЗАТЕЛЬНО выберите тип ARRAY (массив размер 255), а не просто строку.' : 'ERROR: likedBy must be an Array. Delete it in Appwrite and recreate as String Array.');
      } else if (err.message?.includes('attribute') && err.message?.includes('not found')) {
        alert(language === 'ru' ? 'Вам нужно добавить атрибуты likedBy и dislikedBy (String, Array) в коллекцию Comments в Appwrite.' : 'You need to add likedBy and dislikedBy (String, Array) missing attributes to Appwrite Comments.');
      } else if (err.message?.includes('Missing or insufficient permissions')) {
        if (language === 'ru') {
          alert("Ошибка прав доступа!\nЧтобы лайки заработали для СТАРЫХ комментариев, зайдите в Appwrite -> Databases -> IcetubeDB -> Comments -> Settings.\nВ разделе 'Permissions' добавьте роль 'Users' и дайте ей права 'Update'.");
        } else {
          alert("Permission Error!\nTo make likes work for OLD comments, go to Appwrite -> Databases -> IcetubeDB -> Comments -> Settings.\nUnder 'Permissions', add 'Users' and grant 'Update' permission.");
        }
      } else {
        alert("Error: " + err.message);
      }
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !user || isCommenting) return;
    
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      setIsCommenting(true);
      const authorName = profile?.name || user.name || 'User';
      const authorAvatar = profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;

      const res = await databases.createDocument(
        dbId, 
        commsCol, 
        ID.unique(), 
        {
          videoId: id,
          authorId: user.$id,
          authorName: authorName,
          authorAvatar: authorAvatar,
          text: replyText,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: parentId
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.users()),
          Permission.delete(Role.user(user.$id))
        ]
      );

      setComments([
        ...comments,
        {
          id: res.$id,
          authorId: res.authorId,
          author: res.authorName,
          ts: t('video_recently'),
          text: res.text,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: parentId,
          authorAvatar: res.authorAvatar
        }
      ]);
      setReplyText("");
      setReplyingToId(null);
    } catch (err: any) {
      console.error("Reply failed:", err);
      if (err.message?.includes('likedBy') && err.message?.includes('invalid type')) {
        alert(language === 'ru' ? '🛑 ОШИБКА: Вы создали поле likedBy как обычную Строку (String), а нужен МАССИВ (Array)!\n\n1. Зайдите в Appwrite -> Databases -> IcetubeDB -> Comments -> Attributes\n2. Удалите текущие поля likedBy и dislikedBy.\n3. Создайте их заново (Create Attribute -> String), но ОБЯЗАТЕЛЬНО выберите тип ARRAY (массив размер 255), а не просто строку.' : 'ERROR: likedBy must be an Array. Delete it in Appwrite and recreate as String Array.');
      } else if (err.message?.includes('attribute') && err.message?.includes('not found')) {
        alert(language === 'ru' ? 'Ошибка: в коллекции Comments нет поля parentId (String)' : 'Error: Appwrite collection missing attribute parentId (String)');
      } else {
        alert("Error: " + err.message);
      }
    } finally {
      setIsCommenting(false);
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
    } catch (err: any) {
      console.error("Update failed:", err);
      alert((language === 'ru' ? "Ошибка редактирования: " : "Edit Error: ") + err.message);
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
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert((language === 'ru' ? "Ошибка удаления: " : "Delete Error: ") + err.message);
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

            <div className={`flex items-center gap-2 pb-2 sm:pb-0 hide-scrollbar ${showMoreMenu ? 'overflow-visible' : 'overflow-x-auto'}`}>
              <div className="flex items-center bg-white/5 border ice-border rounded-full overflow-hidden shrink-0 cursor-pointer text-slate-300">
                <button 
                  disabled={isLiking || !user}
                  onClick={() => handleLike(true)}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors border-r ice-border text-sm ${likeState === 'liked' ? 'text-[#70d6ff]' : ''}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likeState === 'liked' ? 'fill-current' : ''}`} />
                  <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount)}</span>
                </button>
                <button 
                  disabled={isLiking || !user}
                  onClick={() => handleLike(false)}
                  className={`px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors text-sm flex items-center gap-2 ${likeState === 'disliked' ? 'text-red-400' : ''}`}
                >
                  <ThumbsDown className={`w-4 h-4 ${likeState === 'disliked' ? 'fill-current text-red-400' : ''}`} />
                  {dislikesCount > 0 && <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(dislikesCount)}</span>}
                </button>
              </div>

              <button 
                disabled={isSnowflaking || !user}
                onClick={handleSnowflake}
                className={`flex items-center gap-2 bg-white/5 border ice-border hover:bg-[#70d6ff]/10 text-slate-300 px-4 py-2 rounded-full transition-colors text-sm shrink-0 ${hasSnowflaked ? 'text-[#70d6ff] border-[#70d6ff]/30 shadow-[0_0_10px_rgba(112,214,255,0.1)]' : ''}`}
                title={t('video_snowflakes')}
              >
                <Snowflake className={`w-4 h-4 ${hasSnowflaked ? 'text-[#70d6ff] animate-pulse' : ''}`} />
                <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(snowflakesCount)}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 px-4 py-2 rounded-full transition-colors text-sm shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>{isCopied ? (language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!') : t('video_share')}</span>
              </button>

              <button 
                onClick={() => setIsSaved(!isSaved)}
                className={`flex items-center gap-2 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-4 py-2 rounded-full transition-colors text-sm shrink-0 ${isSaved ? 'text-[#70d6ff] border-[#70d6ff]/30' : 'text-slate-300 hover:text-[#70d6ff]'}`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? t('video_saved') : t('video_save')}</span>
              </button>
              
              <div className="relative" ref={moreMenuRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(!showMoreMenu);
                  }}
                  className="flex items-center justify-center w-9 h-9 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 rounded-full transition-colors shrink-0"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute top-11 right-0 w-48 bg-[#0a192f] backdrop-blur-2xl border ice-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100] py-2 overflow-hidden ring-1 ring-white/10">
                    <button 
                      onClick={() => {
                        window.open(video.videoUrl, '_blank');
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-[#70d6ff] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>{language === 'ru' ? 'Скачать видео' : 'Download video'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-red-400 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{language === 'ru' ? 'Пожаловаться' : 'Report'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Report Modal */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-[#0a192f] border ice-border w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b ice-border flex justify-between items-center">
                  <h3 className="text-white font-bold">{language === 'ru' ? 'Пожаловаться на видео' : 'Report Video'}</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  {[
                    { id: 'inappropriate', label: t('report_reason_inappropriate') },
                    { id: 'spam', label: t('report_reason_spam') },
                    { id: 'hate', label: t('report_reason_hate') },
                    { id: 'violence', label: t('report_reason_violence') }
                  ].map((reason) => (
                    <button 
                      key={reason.id}
                      onClick={() => handleSendReport(reason.id)}
                      disabled={isReporting}
                      className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-red-400 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <span>{reason.label}</span>
                      <ShieldAlert className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
                <div className="p-4 bg-black/20 flex justify-end">
                   <button 
                    onClick={() => setShowReportModal(false)} 
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                   >
                     {t('comment_cancel')}
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div 
          onClick={() => !isDescExpanded && setIsDescExpanded(true)}
          className={`mt-4 bg-white/5 hover:bg-white/10 transition-colors border ice-border p-4 rounded-xl text-sm mx-4 sm:mx-0 ${!isDescExpanded ? 'cursor-pointer' : ''}`}
        >
          <div className="font-medium text-white mb-2">
            <span className="mr-2 font-bold">
              {new Intl.NumberFormat().format(video.views)} {t('video_views_time').split('•')[0]}
            </span>
            <span className="font-bold">• {video.uploadDate}</span>
          </div>
          <div className={`text-slate-300 font-medium whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-2' : ''}`}>
             {video.description || (language === 'ru' ? 'Нет описания' : 'No description provided.')}
          </div>
          
          {!isDescExpanded && video.description && video.description.length > 100 && (
            <button className="text-slate-400 font-bold mt-2 hover:text-white transition-colors">
              {t('video_more')}
            </button>
          )}
          
          {isDescExpanded && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDescExpanded(false);
              }}
              className="text-slate-400 font-bold mt-6 hover:text-white transition-colors block"
            >
              {t('video_less')}
            </button>
          )}
        </div>

        <div className="mt-8 mb-10 px-4 sm:px-0">
          <div className="flex items-center gap-6 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 pb-1 inline-flex text-white">
              {comments.length} {t('video_comments')}
            </h2>
            <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-medium text-sm">
              <ListFilter className="w-5 h-5" />
              {t('comment_sort')}
            </button>
          </div>
          
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#70d6ff] to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="You" className="w-full h-full object-cover" />
                ) : (
                  (profile?.name || user.name || 'U').charAt(0).toUpperCase()
                )}
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
            {comments.filter(c => !c.parentId).map((comment) => (
              <div key={comment.id} className="flex gap-4 group flex-col">
                <div className="flex gap-4 group">
                  <img 
                    src={comment.authorAvatar} 
                    className="w-10 h-10 rounded-full shrink-0 object-cover bg-slate-700" 
                    alt={comment.author} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-medium text-slate-200">
                          @{(user && user.$id === comment.authorId && profile?.name) ? profile.name : comment.author}
                        </span>
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
                      <div className="mt-1 flex flex-col items-start gap-1">
                        <p className="text-sm text-slate-200">{comment.text}</p>
                        <button className="text-xs text-slate-400 font-medium hover:text-white transition-colors mt-0.5">
                          {t('comment_translate')}
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-slate-400">
                      <button 
                        onClick={() => handleCommentLike(comment.id, true)} 
                        className={`flex items-center gap-1.5 transition-colors ${comment.likedBy?.includes(user?.$id) ? 'text-[#70d6ff]' : 'hover:text-[#70d6ff]'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${comment.likedBy?.includes(user?.$id) ? 'fill-current' : ''}`} /> 
                        <span className="text-xs">{(comment.likedBy?.length || 0) > 0 && comment.likedBy.length}</span>
                      </button>
                      <button 
                        onClick={() => handleCommentLike(comment.id, false)} 
                        className={`flex items-center gap-1.5 transition-colors ${comment.dislikedBy?.includes(user?.$id) ? 'text-red-400' : 'hover:text-red-400'}`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${comment.dislikedBy?.includes(user?.$id) ? 'fill-current' : ''}`} />
                        <span className="text-xs">{(comment.dislikedBy?.length || 0) > 0 && comment.dislikedBy.length}</span>
                      </button>
                      {user && (
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
                         <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center text-[10px] font-bold">
                           {profile?.avatar ? (
                             <img src={profile.avatar} alt="You" className="w-full h-full object-cover" />
                           ) : (
                             (profile?.name || user?.name || 'U').charAt(0).toUpperCase()
                           )}
                         </div>
                         <div className="flex-1 flex flex-col gap-2">
                            <input 
                              type="text" 
                              autoFocus
                              placeholder={t('comment_reply_placeholder')}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddReply(comment.id);
                              }}
                              className="w-full bg-transparent border-b ice-border focus:border-[#70d6ff]/50 outline-none text-sm text-slate-200 py-1"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setReplyingToId(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">{t('comment_cancel')}</button>
                              <button onClick={() => handleAddReply(comment.id)} disabled={isCommenting} className="text-xs bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">{t('comment_reply')}</button>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Replies */}
                <div className="ml-14 flex flex-col gap-4 mt-2">
                  {comments.filter(reply => reply.parentId === comment.id).reverse().map(reply => (
                    <div key={reply.id} className="flex gap-3 group">
                      <img 
                        src={reply.authorAvatar} 
                        className="w-8 h-8 rounded-full shrink-0 object-cover bg-slate-700" 
                        alt={reply.author} 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="font-medium text-slate-200 border bg-white/10 px-2 py-0.5 rounded-full">
                              @{(user && user.$id === reply.authorId && profile?.name) ? profile.name : reply.author}
                            </span>
                            <span className="text-slate-500 text-[10px]">{reply.ts}</span>
                          </div>
                          {user && user.$id === reply.authorId && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                               <button onClick={() => { setEditingCommentId(reply.id); setEditingText(reply.text); }} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-[#70d6ff] transition-colors">
                                  <Edit2 className="w-3 h-3" />
                               </button>
                               <button onClick={() => handleDeleteComment(reply.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                          )}
                        </div>
                        
                        {editingCommentId === reply.id ? (
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
                                <button onClick={() => handleUpdateComment(reply.id)} className="text-xs bg-[#70d6ff]/20 text-[#70d6ff] px-3 py-1 rounded hover:bg-[#70d6ff]/30 transition-colors font-medium">{t('comment_save')}</button>
                             </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-300 mb-2">{reply.text}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-slate-400">
                          <button 
                            onClick={() => handleCommentLike(reply.id, true)} 
                            className={`flex items-center gap-1.5 transition-colors ${reply.likedBy?.includes(user?.$id) ? 'text-[#70d6ff]' : 'hover:text-[#70d6ff]'}`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${reply.likedBy?.includes(user?.$id) ? 'fill-current' : ''}`} /> 
                            <span className="text-xs">{(reply.likedBy?.length || 0) > 0 && reply.likedBy.length}</span>
                          </button>
                          <button 
                            onClick={() => handleCommentLike(reply.id, false)} 
                            className={`flex items-center gap-1.5 transition-colors ${reply.dislikedBy?.includes(user?.$id) ? 'text-red-400' : 'hover:text-red-400'}`}
                          >
                            <ThumbsDown className={`w-3.5 h-3.5 ${reply.dislikedBy?.includes(user?.$id) ? 'fill-current' : ''}`} />
                            <span className="text-xs">{(reply.dislikedBy?.length || 0) > 0 && reply.dislikedBy.length}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
