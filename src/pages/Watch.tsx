import { Params, useParams, Link, useNavigate } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, MessageSquare, Loader2, Video, User, Edit2, Trash2, Snowflake, ShieldAlert, X, Bookmark, ListFilter, Check, Clock, AlertTriangle, MessageCircle, Send, Moon, Crown } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import React, { useState, useEffect, useRef } from "react";
import { databases, Permission, Role, withTimeout, getOfflineFlag, setOfflineFlag } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { createNotification } from "../lib/notifications";
import { SafeStorage, getAnonCommentCount, registerAnonComment, MAX_ANON_COMMENTS_PER_VIDEO } from "../lib/storage";
import { getXP, getLevelInfo, addXP } from "../lib/achievements";

import { getOptimizedThumbnail, getOptimizedVideoUrl } from '../lib/cloudinary';

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();

  // Premium and Sleep Timer States
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [sleepTimerTime, setSleepTimerTime] = useState<number>(0); // in seconds
  const [sleepTimerActive, setSleepTimerActive] = useState<boolean>(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    setPremiumEnabled(localStorage.getItem("icetube_premium_enabled") === "true");
    setAmbientEnabled(localStorage.getItem("icetube_premium_ambient") !== "false");
    
    const handlePremiumToggle = () => {
      setPremiumEnabled(localStorage.getItem("icetube_premium_enabled") === "true");
      setAmbientEnabled(localStorage.getItem("icetube_premium_ambient") !== "false");
    };
    window.addEventListener("icetube_premium_changed", handlePremiumToggle);
    window.addEventListener("icetube_ambient_changed", handlePremiumToggle);
    return () => {
      window.removeEventListener("icetube_premium_changed", handlePremiumToggle);
      window.removeEventListener("icetube_ambient_changed", handlePremiumToggle);
    };
  }, []);

  useEffect(() => {
    if (sleepTimerActive && sleepTimerTime > 0) {
      timerIntervalRef.current = setInterval(() => {
        setSleepTimerTime(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setSleepTimerActive(false);
            const videoEl = document.getElementById("main-video-player") as HTMLVideoElement;
            if (videoEl) {
              videoEl.pause();
            }
            alert(language === "ru" ? "⏳ Таймер сна сработал! Воспроизведение приостановлено." : "⏳ Sleep timer triggered! Playback automatically paused.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimerActive, sleepTimerTime]);

  const [isFloating, setIsFloating] = useState(false);
  const [isMiniClosed, setIsMiniClosed] = useState(false);
  const [xpAlert, setXpAlert] = useState<{ show: boolean, msg: string } | null>(null);

  const triggerXpEarned = (points: number, reason: string) => {
    const res = addXP(points, user?.$id || "guest");
    setXpAlert({
      show: true,
      msg: language === 'ru' 
        ? `🧊 +${points} XP (${reason})! ${res.leveledUp ? `🧭 НОВЫЙ РАНГ: ${getLevelInfo(res.currentXP).title}!` : ''}`
        : `🧊 +${points} XP (${reason})! ${res.leveledUp ? `🧭 NEW LEVEL: ${getLevelInfo(res.currentXP).title}!` : ''}`
    });
    // Sync points
    window.dispatchEvent(new CustomEvent('icetube_xp_changed', { detail: { xp: res.currentXP, userId: user?.$id || "guest" } }));
    setTimeout(() => {
      setXpAlert(null);
    }, 4500);
  };

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
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleVideoError = (e: any) => {
    console.error("Video Playback Error");
    const videoElement = e.target as HTMLVideoElement;
    let message = language === 'ru' ? 'Ошибка загрузки видео' : 'Error loading video';
    
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case 1: message = language === 'ru' ? 'Загрузка прервана' : 'Loading aborted'; break;
        case 2: message = language === 'ru' ? 'Ошибка сети' : 'Network error'; break;
        case 3: message = language === 'ru' ? 'Ошибка декодирования (файл может быть поврежден)' : 'Decode error (file might be corrupted)'; break;
        case 4: message = language === 'ru' ? 'Формат видео не поддерживается' : 'Video format not supported'; break;
      }
    }
    setVideoError(message);
  };

  const retryLoad = () => {
    setVideoError(null);
    const video = document.getElementById('main-video-player') as HTMLVideoElement;
    if (video) {
      video.load();
      video.play().catch(err => console.error("Play error:", err.message || err));
    }
  };
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [activeSuggestionFilter, setActiveSuggestionFilter] = useState<'all' | 'category' | 'author'>('all');
  const [showNextFloating, setShowNextFloating] = useState(true);
  
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  const filteredSuggestedVideos = React.useMemo(() => {
    if (activeSuggestionFilter === 'all') return suggestedVideos;
    if (activeSuggestionFilter === 'category' && video) {
      return suggestedVideos.filter(v => v.category === video.category);
    }
    if (activeSuggestionFilter === 'author' && video) {
      return suggestedVideos.filter(v => v.uploaderId === video.uploaderId);
    }
    return suggestedVideos;
  }, [suggestedVideos, activeSuggestionFilter, video]);

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

  useEffect(() => {
    if (video) {
      try {
        const saved = SafeStorage.get('saved_videos', []);
        setIsSaved(saved.some((v: any) => v.id === video.id));
        
        const watchLater = SafeStorage.get('watch_later', []);
        setIsWatchLater(watchLater.some((v: any) => v.id === video.id));

        const downloaded = SafeStorage.get('downloaded_videos', []);
        setIsDownloaded(downloaded.some((v: any) => v.id === video.id));

        // Add to History
        let history = SafeStorage.get('watch_history', []);
        // Remove existing entry for this video to move it to the top
        history = history.filter((v: any) => v.id !== video.id);
        history.unshift({
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          channelAvatar: video.channelAvatar,
          uploaderId: video.uploaderId,
          views: video.views,
          uploadDate: video.uploadDate,
          contentType: video.contentType || 'video',
          timestamp: Date.now()
        });
        // Limit history to 100 items
        if (history.length > 100) history = history.slice(0, 100);
        SafeStorage.set('watch_history', history);
      } catch(e) {}
    }
  }, [video]);

  useEffect(() => {
    try {
      const savedPlaylists = SafeStorage.get('user_playlists', []);
      setPlaylists(savedPlaylists);
    } catch(e) {}
  }, []);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    try {
      const newPlaylist = {
        id: 'pl_' + Date.now().toString(),
        name: newPlaylistName.trim(),
        videos: []
      };
      const updatedPlaylists = [...playlists, newPlaylist];
      SafeStorage.set('user_playlists', updatedPlaylists);
      setPlaylists(updatedPlaylists);
      setNewPlaylistName('');
    } catch(err) {
      console.error('Failed to create playlist', err);
    }
  };

  const handleToggleVideoInPlaylist = (playlistId: string) => {
    if (!video) return;
    try {
      const updatedPlaylists = playlists.map(pl => {
        if (pl.id === playlistId) {
          const hasVideo = pl.videos.some((v: any) => v.id === video.id);
          let newVideos = [...pl.videos];
          if (hasVideo) {
            newVideos = newVideos.filter((v: any) => v.id !== video.id);
          } else {
            newVideos.unshift({
                id: video.id,
                title: video.title,
                thumbnailUrl: video.thumbnailUrl,
                channelName: video.channelName,
                channelAvatar: video.channelAvatar,
                uploaderId: video.uploaderId,
                views: video.views,
                uploadDate: video.uploadDate,
                contentType: video.contentType || 'video',
                timestamp: Date.now()
            });
          }
          return { ...pl, videos: newVideos };
        }
        return pl;
      });
      SafeStorage.set('user_playlists', updatedPlaylists);
      setPlaylists(updatedPlaylists);
    } catch(err) {
      console.error('Failed to update playlist', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSave = () => {
    if (!video) return;
    try {
      let saved = SafeStorage.get('saved_videos', []);
      if (isSaved) {
        saved = saved.filter((v: any) => v.id !== video.id);
        setIsSaved(false);
      } else {
        saved.unshift({
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          channelAvatar: video.channelAvatar,
          uploaderId: video.uploaderId,
          views: video.views,
          uploadDate: video.uploadDate,
          contentType: video.contentType || 'video',
          timestamp: Date.now()
        });
        setIsSaved(true);
      }
      SafeStorage.set('saved_videos', saved);
    } catch(err) {
      console.error("Failed to save video:", err);
    }
  };

  const handleToggleWatchLater = () => {
    if (!video) return;
    try {
      let watchLater = SafeStorage.get('watch_later', []);
      if (isWatchLater) {
        watchLater = watchLater.filter((v: any) => v.id !== video.id);
        setIsWatchLater(false);
      } else {
        watchLater.unshift({
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          channelAvatar: video.channelAvatar,
          uploaderId: video.uploaderId,
          views: video.views,
          uploadDate: video.uploadDate,
          contentType: video.contentType || 'video',
          timestamp: Date.now()
        });
        setIsWatchLater(true);
      }
      SafeStorage.set('watch_later', watchLater);
    } catch(err) {
      console.error("Failed to update watch later:", err);
    }
  };

  const handleDownload = () => {
    if (!video) return;
    try {
      let downloaded = SafeStorage.get('downloaded_videos', []);
      if (isDownloaded) {
        if (!window.confirm(language === 'ru' ? 'Удалить из скачанных?' : 'Remove from downloads?')) return;
        downloaded = downloaded.filter((v: any) => v.id !== video.id);
        setIsDownloaded(false);
      } else {
        downloaded.unshift({
            id: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            channelName: video.channelName,
            channelAvatar: video.channelAvatar,
            uploaderId: video.uploaderId,
            views: video.views,
            uploadDate: video.uploadDate,
            contentType: video.contentType || 'video',
            timestamp: Date.now()
        });
        setIsDownloaded(true);
      }
      SafeStorage.set('downloaded_videos', downloaded);
    } catch(err) {
      console.error("Failed to update downloads:", err);
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

        // Fetch the specific video directly by ID
        let currentDoc: any;
        try {
          currentDoc = await withTimeout(databases.getDocument(dbId, colId, id), 4000);
        } catch (docErr) {
          console.error("Could not fetch specific video document under timeout:", docErr);
          // Fallback: list all and find (not ideal but better than nothing)
          try {
            const response = await withTimeout(databases.listDocuments(dbId, colId), 3000);
            currentDoc = response.documents.find(v => v.$id === id);
          } catch (listErr) {
            console.warn("Listing documents also failed.");
            setOfflineFlag(true);
          }
        }
        
        if (currentDoc) {
          // Fetch users/profiles to get freshest avatars for this uploader
          const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
          let uploaderProfile: any = null;
          if (profilesCol) {
             try {
                const profileRes = await withTimeout(databases.listDocuments(dbId, profilesCol, [Query.equal('userId', currentDoc.uploaderId)]), 2500);
                if (profileRes.documents.length > 0) {
                  uploaderProfile = profileRes.documents[0];
                }
             } catch (pErr) {
                console.warn("Could not fetch uploader profile", pErr);
             }
          }

          const currentVideo = {
            id: currentDoc.$id,
            uploaderId: currentDoc.uploaderId,
            title: currentDoc.title,
            thumbnailUrl: currentDoc.thumbnailUrl,
            videoUrl: currentDoc.videoUrl,
            channelName: uploaderProfile?.name || currentDoc.uploaderName,
            channelAvatar: uploaderProfile?.avatar || currentDoc.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentDoc.uploaderName || 'User')}`,
            views: currentDoc.views || 0,
            uploadDate: t('video_recently'),
            description: currentDoc.description || t('video_no_description'),
            category: currentDoc.category || 'All',
            contentType: currentDoc.contentType || 'video',
            verified: currentDoc.verified || false,
            duration: currentDoc.duration || '0:00'
          };

          // Redirect shorts to the shorts player
          if (currentVideo.contentType === 'shorts' || 
              currentDoc.title?.toLowerCase().includes('#shorts') || 
              currentDoc.description?.toLowerCase().includes('#shorts')) {
             navigate(`/shorts/${currentDoc.$id}`, { replace: true });
             return;
          }

          setVideo(currentVideo);
          try {
            await withTimeout(fetchInteractions(currentVideo.id, currentVideo.uploaderId), 2500);
          } catch (e) {
            console.warn("Skipping standard interaction updates due to timeout/offline mode");
          }

          // Fetch suggested videos separately
          try {
            const suggestedRes = await withTimeout(databases.listDocuments(dbId, colId, [
              Query.orderDesc('$createdAt'),
              Query.limit(20)
            ]), 2500);
            
            const suggested = suggestedRes.documents
              .filter(v => v.$id !== id && (!v.contentType || v.contentType === 'video'))
              .map(v => ({
                id: v.$id,
                uploaderId: v.uploaderId,
                title: v.title,
                thumbnailUrl: v.thumbnailUrl,
                videoUrl: v.videoUrl,
                channelName: v.uploaderName,
                channelAvatar: v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName)}`,
                views: v.views || 0,
                uploadDate: t('video_recently'),
                category: v.category || 'All',
                verified: v.verified || false,
              }));
            setSuggestedVideos(suggested);
          } catch (sErr) {
            console.error("Failed to fetch suggested videos:", sErr);
            setSuggestedVideos([]);
          }

          // Increment View Count (Live mode only)
          const runUpdate = async () => {
            try {
              const increment = Math.floor(Math.random() * 3) + 1;
              await databases.updateDocument(dbId, colId, currentVideo.id, {
                views: (currentVideo.views || 0) + increment
              });

              if (profilesCol && uploaderProfile) {
                await databases.updateDocument(dbId, profilesCol, uploaderProfile.$id, {
                  viewsCount: (uploaderProfile.viewsCount || 0) + increment
                });
              }
            } catch (viewErr) {
              console.error("View increment background update failed:", viewErr);
            }
          };
          runUpdate();

        } else {
          setOfflineFlag(true);
          setVideo(null);
          setSuggestedVideos([]);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [id, user, language]);

  const lastAwardedVideoId = useRef<string | null>(null);
  
  useEffect(() => {
    if (video?.id && lastAwardedVideoId.current !== video.id) {
      lastAwardedVideoId.current = video.id;
      setTimeout(() => {
        triggerXpEarned(10, language === 'ru' ? 'Просмотр видео' : 'Started watching');
      }, 1000);
    }
  }, [video?.id]);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    
    const handleScroll = () => {
      if (!mainContainer) return;
      if (mainContainer.scrollTop > 320) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
        setIsMiniClosed(false);
      }
    };

    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll);
    }

    const handleWindowScroll = () => {
      if (window.scrollY > 320) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
        setIsMiniClosed(false);
      }
    };
    window.addEventListener('scroll', handleWindowScroll);

    return () => {
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      alert(language === 'ru' ? 'Вам нужно войти в аккаунт, чтобы ставить оценки' : 'You must log in to rate videos');
      return;
    }
    if (isLiking) return;
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
          if (isLike) {
            setLikesCount(prev => prev - 1);
            updateProfileStat(video.uploaderId, 'likesCount', -1);
          }
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
            updateProfileStat(video.uploaderId, 'likesCount', 1);
          } else {
            setLikesCount(prev => prev - 1);
            setDislikesCount(prev => prev + 1);
            updateProfileStat(video.uploaderId, 'likesCount', -1);
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
        if (isLike) {
          setLikesCount(prev => prev + 1);
          updateProfileStat(video.uploaderId, 'likesCount', 1);
          createNotification({
            userId: video.uploaderId,
            actorId: user.$id,
            actorName: profile?.name || user.name || 'User',
            actorAvatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
            type: 'like',
            videoId: video.id,
            videoTitle: video.title,
            contentType: video.contentType
          });
          triggerXpEarned(15, language === 'ru' ? 'Оценка видео' : 'Rating a video');
        }
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

        // Fallback: list and update the one with the highest current value (most likely the one in leaderboard)
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
        console.error(`Failed to update profile stat ${field} in background:`, err);
      }
    })();
  };

  const handleSnowflake = async () => {
    if (!user) {
      alert(language === 'ru' ? 'Вам нужно войти в аккаунт, чтобы ставить снежинки' : 'You must log in to give snowflakes');
      return;
    }
    if (isSnowflaking || !video) return;
    
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
        updateProfileStat(video.uploaderId, 'snowflakesCount', -1);
      } else {
        await databases.createDocument(dbId, likesCol, ID.unique(), {
          videoId: id,
          userId: user.$id,
          type: 'snowflake'
        });
        setHasSnowflaked(true);
        setSnowflakesCount(prev => prev + 1);
        updateProfileStat(video.uploaderId, 'snowflakesCount', 1);
        
        createNotification({
          userId: video.uploaderId,
          actorId: user.$id,
          actorName: profile?.name || user.name || 'User',
          actorAvatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
          type: 'snowflake',
          videoId: video.id,
          videoTitle: video.title,
          contentType: video.contentType
        });
        triggerXpEarned(50, language === 'ru' ? 'Ледяная снежинка' : 'Snowflake reaction');
      }
    } catch (err: any) {
      console.error("Snowflake failed:", err);
    } finally {
      setIsSnowflaking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert(language === 'ru' ? 'Вам нужно войти в аккаунт, чтобы подписаться' : 'You must log in to subscribe');
      return;
    }
    if (isSubbing || !video) return;
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
          updateProfileStat(video.uploaderId, 'subscribersCount', -1);
        }
      } else {
        await databases.createDocument(dbId, subsCol, ID.unique(), {
          channelId: video.uploaderId,
          subscriberId: user.$id
        });
        setIsSubscribed(true);
        updateProfileStat(video.uploaderId, 'subscribersCount', 1);

        createNotification({
          userId: video.uploaderId,
          actorId: user.$id,
          actorName: profile?.name || user.name || 'User',
          actorAvatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`,
          type: 'subscribe'
        });
        triggerXpEarned(30, language === 'ru' ? 'Подписка на автора' : 'Channel subscription');
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
    if (!newComment.trim() || isCommenting) return;
    
    if (!user) {
      const anonCount = getAnonCommentCount(id!);
      if (anonCount >= MAX_ANON_COMMENTS_PER_VIDEO) {
        alert(language === 'ru' 
          ? `Аноним может оставить не более ${MAX_ANON_COMMENTS_PER_VIDEO} комментариев под одним видео. Войдите в аккаунт, чтобы продолжить.` 
          : `Anonymous users can post at most ${MAX_ANON_COMMENTS_PER_VIDEO} comments per video. Log in to continue.`);
        return;
      }
    }

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) {
      console.error("Comments collection not configured");
      return;
    }

    try {
      setIsCommenting(true);
      const authorName = user ? (profile?.name || user.name || 'User') : (language === 'ru' ? 'Аноним' : 'Anonymous');
      const authorAvatar = user && profile?.avatar ? profile.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
      const authorId = user ? user.$id : 'anonymous';

      const permissions = user ? [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.user(user.$id))
      ] : [
        Permission.read(Role.any())
      ];

      const res = await databases.createDocument(
        dbId, 
        commsCol, 
        ID.unique(), 
        {
          videoId: id,
          authorId: authorId,
          authorName: authorName,
          authorAvatar: authorAvatar,
          text: newComment,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: null
        },
        permissions
      );

      triggerXpEarned(25, language === 'ru' ? 'Добавлен комментарий' : 'Comment added');

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

      if (!user) registerAnonComment(id!);

      if (video) {
        createNotification({
          userId: video.uploaderId,
          actorId: authorId,
          actorName: authorName,
          actorAvatar: authorAvatar,
          type: 'comment',
          videoId: video.id,
          videoTitle: video.title,
          contentType: video.contentType
        });
      }
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
    if (!replyText.trim() || isCommenting) return;
    
    if (!user) {
      const anonCount = getAnonCommentCount(id!);
      if (anonCount >= MAX_ANON_COMMENTS_PER_VIDEO) {
        alert(language === 'ru' 
          ? `Аноним может оставить не более ${MAX_ANON_COMMENTS_PER_VIDEO} комментариев под одним видео. Войдите в аккаунт, чтобы продолжить.` 
          : `Anonymous users can post at most ${MAX_ANON_COMMENTS_PER_VIDEO} comments per video. Log in to continue.`);
        return;
      }
    }

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const commsCol = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
    if (!dbId || !commsCol) return;

    try {
      setIsCommenting(true);
      const authorName = user ? (profile?.name || user.name || 'User') : (language === 'ru' ? 'Аноним' : 'Anonymous');
      const authorAvatar = user && profile?.avatar ? profile.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
      const authorId = user ? user.$id : 'anonymous';

      const permissions = user ? [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.user(user.$id))
      ] : [
        Permission.read(Role.any())
      ];

      const res = await databases.createDocument(
        dbId, 
        commsCol, 
        ID.unique(), 
        {
          videoId: id,
          authorId: authorId,
          authorName: authorName,
          authorAvatar: authorAvatar,
          text: replyText,
          likes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: parentId
        },
        permissions
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

      if (!user) registerAnonComment(id!);
      
      if (video) {
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.authorId) {
          createNotification({
            userId: parentComment.authorId,
            actorId: authorId,
            actorName: authorName,
            actorAvatar: authorAvatar,
            type: 'comment',
            videoId: video.id,
            videoTitle: video.title
          });
        }
      }
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

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!video) return;
    const target = e.target as HTMLVideoElement;
    const progress = target.currentTime / target.duration;
    
    // Only save if watched between 5% and 95%
    if (progress > 0.05 && progress < 0.95) {
      try {
        const saved = SafeStorage.get('watching_progress', {});
        saved[video.id] = {
          videoId: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          channelAvatar: video.channelAvatar,
          uploaderId: video.uploaderId,
          views: video.views,
          uploadDate: video.uploadDate,
          progress: progress,
          currentTime: target.currentTime,
          timestamp: Date.now()
        };
        SafeStorage.set('watching_progress', saved);
      } catch(err) {
         console.error('Error saving progress', err);
      }
    } else if (progress >= 0.95) {
      // Remove it if watched to completion
      try {
        const saved = SafeStorage.get('watching_progress', {});
        if (saved[video.id]) {
          delete saved[video.id];
          SafeStorage.set('watching_progress', saved);
        }
      } catch(err) {}
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto relative pb-16 lg:pb-0 animate-in fade-in duration-300">
      {/* Gamified XP Achievement alert toast */}
      {xpAlert && (
        <div className="fixed top-20 right-4 sm:right-6 md:right-10 z-[200] max-w-sm bg-[#061122]/95 border-2 border-[#70d6ff] rounded-2xl p-4 shadow-[0_4px_30px_rgba(112,214,255,0.4)] backdrop-blur-md animate-in slide-in-from-top-10 duration-300 flex items-center gap-3">
          <div className="text-2xl select-none animate-bounce">🧊</div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#70d6ff] font-extrabold uppercase tracking-wider leading-none">
              {language === 'ru' ? 'АРКТИЧЕСКОЕ ДОСТИЖЕНИЕ!' : 'ARCTIC ACHIEVEMENT!'}
            </span>
            <span className="text-xs font-semibold text-slate-200 mt-1 leading-snug">{xpAlert.msg}</span>
          </div>
        </div>
      )}
      {/* Floating Next Video Bar (Mobile Only) */}
      {showNextFloating && filteredSuggestedVideos.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 bg-[#1e2025]/95 backdrop-blur-md border-t border-white/10 p-3 lg:hidden flex items-center justify-between shadow-t-xl rounded-t-xl">
          <Link to={`/watch/${filteredSuggestedVideos[0].id}`} onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-white/5 text-white">
              <ListFilter className="w-4 h-4 rotate-90" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-slate-400">{language === 'ru' ? `Далее: ${filteredSuggestedVideos[0].title}` : `Up next: ${filteredSuggestedVideos[0].title}`}</span>
              <span className="text-xs text-slate-300 font-medium truncate">{filteredSuggestedVideos[0].channelName} - {filteredSuggestedVideos[0].title}</span>
            </div>
          </Link>
          <button onClick={() => setShowNextFloating(false)} className="p-2 text-slate-400 hover:text-white shrink-0">
            <X className="w-5 h-5 opacity-50" />
          </button>
        </div>
      )}

      {/* Primary Video Section */}
      <div className="flex-1 lg:w-[70%] relative">
        {/* Dynamic Ambilight Halo Glow (Premium feature) */}
        {premiumEnabled && ambientEnabled && !isFloating && (
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-[#70d6ff]/20 to-cyan-400/20 blur-3xl -z-10 rounded-3xl animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
        )}
        {/* Static Space-filler Card when Video is in PiP Floating Mode */}
        {isFloating && !isMiniClosed && (
          <div 
            className="w-full relative pt-[56.25%] border border-[#70d6ff]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:rounded-2xl overflow-hidden mb-4 transition-all duration-300"
            style={video?.thumbnailUrl ? { backgroundImage: `url(${getOptimizedThumbnail(video.thumbnailUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="absolute inset-0 bg-[#081222]/70 backdrop-blur-md z-0"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
              <div className="w-12 h-12 rounded-full bg-[#70d6ff]/10 border border-[#70d6ff]/30 flex items-center justify-center animate-pulse text-[#70d6ff] mb-2">
                <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-bold tracking-tight">
                {language === 'ru' ? 'Мини-плеер ICETUBE активен 🧊' : 'ICETUBE Picture-in-Picture Active 🧊'}
              </p>
              <button 
                onClick={() => {
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                  setIsFloating(false);
                }}
                className="mt-3 text-[10px] sm:text-xs text-[#70d6ff] font-bold hover:scale-105 active:scale-95 bg-white/5 hover:bg-[#70d6ff]/20 py-1.5 px-4 rounded-full border border-[#70d6ff]/30 shadow-md flex items-center gap-1.5 transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                {language === 'ru' ? 'Вернуть на главный экран' : 'Restore to center'}
              </button>
            </div>
          </div>
        )}

        <div className={isFloating && !isMiniClosed
          ? "fixed bottom-6 right-6 md:bottom-10 lg:left-6 lg:right-auto z-[120] w-[300px] sm:w-[380px] aspect-video rounded-2xl overflow-hidden border-2 border-[#70d6ff]/80 bg-[#070b13]/95 shadow-[0_10px_45px_rgba(112,214,255,0.45)] backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 group"
          : "w-full relative pt-[56.25%] bg-black sm:rounded-2xl overflow-hidden sm:border-2 border-white/5 sm:shadow-[0_20px_50px_rgba(0,0,0,0.7)] group"
        }>
          {/* PiP Cover Bar on hover */}
          {isFloating && !isMiniClosed && (
            <div 
              className="absolute inset-0 z-40 cursor-pointer group"
              onClick={() => {
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                setIsFloating(false);
              }}
            >
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between px-3 text-white pointer-events-none">
              <span className="text-[10px] font-bold truncate max-w-[160px] text-[#70d6ff] drop-shadow-md">
                {video.title}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsFloating(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#70d6ff] pointer-events-auto"
                  title={language === 'ru' ? 'Вернуть на полный экран' : 'Restore'}
                >
                  <ListFilter className="w-3.5 h-3.5 rotate-90" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMiniClosed(true);
                  }}
                  className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors pointer-events-auto"
                  title={language === 'ru' ? 'Закрыть' : 'Close'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            </div>
          )}

          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm z-50 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter italic">
                {language === 'ru' ? 'ОШИБКА ДЕКОДИРОВАНИЯ' : 'DECODE ERROR'}
              </h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm font-medium leading-relaxed">
                {videoError}<br/>
                <span className="text-[10px] text-slate-600 mt-2 block opacity-50">Code: NS_ERROR_DOM_MEDIA_METADATA_ERR</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  {language === 'ru' ? 'Обновить страницу' : 'Reload Page'}
                </button>
                <button 
                  onClick={retryLoad}
                  className="px-6 py-2 bg-[#70d6ff] text-black font-black rounded-xl transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-[#70d6ff]/30"
                >
                  {language === 'ru' ? 'Холодный перезапуск' : 'Cold Retry'}
                </button>
              </div>
            </div>
          )}
          <video 
            id="main-video-player"
            autoPlay 
            controls={!(isFloating && !isMiniClosed)}
            className="absolute top-0 left-0 w-full h-full object-contain bg-black"
            poster={getOptimizedThumbnail(video.thumbnailUrl)}
            src={getOptimizedVideoUrl(video.videoUrl)} 
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsVideoEnded(true)}
            onError={handleVideoError}
            onLoadedData={(e) => {
              try {
                const saved = SafeStorage.get('watching_progress', {});
                if (saved[video.id] && saved[video.id].currentTime) {
                  (e.target as HTMLVideoElement).currentTime = saved[video.id].currentTime;
                }
              } catch(err) {}
            }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white line-clamp-2">{video.title}</h1>
          
          {/* Mobile-Style Inline Description/Stats Row (Replaces the raw view count usually in the desc) */}
          <div 
            className="flex sm:hidden flex-wrap items-center text-xs text-slate-400 gap-1.5 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded-lg transition-colors w-fit"
            onClick={() => setIsDescExpanded(!isDescExpanded)}
          >
            <span className="font-medium text-slate-300 truncate max-w-[50vw]">
              @{video.channelName?.replace(/\s+/g, '').toLowerCase() || 'user'}
            </span>
            <span>{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(video.views)} {language === 'ru' ? (
              video.views % 10 === 1 && video.views % 100 !== 11 ? 'просмотр' :
              [2, 3, 4].includes(video.views % 10) && ![12, 13, 14].includes(video.views % 100) ? 'просмотра' :
              'просмотров'
            ) : t('video_views')}</span>
            <span>{video.uploadDate}</span>
            <span className="font-medium text-slate-200 ml-1">{language === 'ru' ? '...Ещё' : '...More'}</span>
          </div>

          <div className="flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-4 w-full sm:w-fit justify-between sm:justify-start">
              <div className="flex items-center gap-3">
                <Link to={`/channel/${video.uploaderId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                  <img 
                    src={video.channelAvatar} 
                    alt={video.channelName} 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-cold-border" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName || 'User')}&background=random`;
                    }}
                  />
                </Link>
                <div className="flex flex-col">
                <Link to={`/channel/${video.uploaderId}`} className="font-bold text-slate-100 hover:text-white transition-colors flex items-center gap-1 truncate max-w-[40vw] sm:max-w-none">
                  {video.channelName}
                  {video.verified && (
                      <div className="w-3.5 h-3.5 bg-[#70d6ff] text-black rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </Link>
                  <span className="text-xs text-slate-400">
                    {subsCount} {language === 'ru' ? (
                      subsCount % 10 === 1 && subsCount % 100 !== 11 ? 'подписчик' :
                      [2, 3, 4].includes(subsCount % 10) && ![12, 13, 14].includes(subsCount % 100) ? 'подписчика' :
                      'подписчиков'
                    ) : (subsCount === 1 ? 'subscriber' : 'subscribers')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Like/Dislike group */}
              <div className="flex items-center bg-white/5 border ice-border rounded-full overflow-hidden shrink-0">
                <button 
                  disabled={isLiking || !user}
                  onClick={() => handleLike(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors border-r ice-border text-sm ${likeState === 'liked' ? 'text-[#70d6ff]' : 'text-slate-300'}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likeState === 'liked' ? 'fill-current' : ''}`} />
                  <span className="font-medium tabular-nums">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount)}</span>
                </button>
                <button 
                  disabled={isLiking || !user}
                  onClick={() => handleLike(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors text-sm ${likeState === 'disliked' ? 'text-red-400' : 'text-slate-300'}`}
                >
                  <ThumbsDown className={`w-4 h-4 ${likeState === 'disliked' ? 'fill-current text-red-400' : ''}`} />
                  {dislikesCount > 0 && <span className="font-medium tabular-nums">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(dislikesCount)}</span>}
                </button>
              </div>

              <button 
                disabled={isSnowflaking || !user}
                onClick={handleSnowflake}
                className={`flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[#70d6ff]/10 px-3 py-2 rounded-full transition-colors text-sm shrink-0 ${hasSnowflaked ? 'text-[#70d6ff] border-[#70d6ff]/30 shadow-[0_0_10px_rgba(112,214,255,0.1)]' : 'text-slate-300'}`}
                title={t('video_snowflakes')}
              >
                <Snowflake className={`w-4 h-4 ${hasSnowflaked ? 'text-[#70d6ff] animate-pulse' : ''}`} />
                <span className="font-medium">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(snowflakesCount)}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] px-3 py-2 rounded-full transition-colors text-sm shrink-0 text-slate-300"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">{isCopied ? (language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!') : t('video_share')}</span>
              </button>

              <button 
                onClick={handleSave}
                className={`flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-3 py-2 rounded-full transition-colors text-sm shrink-0 ${isSaved ? 'text-[#70d6ff] border-[#70d6ff]/30' : 'text-slate-300 hover:text-[#70d6ff]'}`}
                title={t('video_save')}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="font-medium">{isSaved ? t('video_saved') : t('video_save')}</span>
              </button>

              <button 
                onClick={handleToggleWatchLater}
                className={`flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-3 py-2 rounded-full transition-colors text-sm shrink-0 ${isWatchLater ? 'text-[#70d6ff] border-[#70d6ff]/30' : 'text-slate-300 hover:text-[#70d6ff]'}`}
                title={t('video_watch_later')}
              >
                <Clock className={`w-4 h-4 ${isWatchLater ? 'fill-current' : ''}`} />
                <span className="font-medium">{isWatchLater ? t('video_added_to_watch_later') : t('video_watch_later')}</span>
              </button>

              <button 
                onClick={handleDownload}
                className={`flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-3 py-2 rounded-full transition-colors text-sm shrink-0 ${isDownloaded ? 'text-[#70d6ff] border-[#70d6ff]/30' : 'text-slate-300 hover:text-[#70d6ff]'}`}
                title={language === 'ru' ? 'Скачать' : 'Download'}
              >
                <Download className={`w-4 h-4 ${isDownloaded ? 'fill-current' : ''}`} />
                <span className="font-medium">{isDownloaded ? (language === 'ru' ? 'Скачано' : 'Downloaded') : (language === 'ru' ? 'Скачать' : 'Download')}</span>
              </button>

              <button 
                onClick={() => setShowSleepTimerModal(true)}
                className={`flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-3 py-2 rounded-full transition-colors text-sm shrink-0 ${sleepTimerActive ? 'text-yellow-400 border-yellow-400/40 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : 'text-slate-300 hover:text-[#70d6ff]'}`}
                title={language === 'ru' ? 'Таймер Сна' : 'Sleep Timer'}
              >
                <Moon className={`w-4 h-4 ${sleepTimerActive ? 'text-yellow-400 fill-current animate-pulse' : ''}`} />
                <span className="font-medium">
                  {sleepTimerActive 
                    ? `${Math.floor(sleepTimerTime / 60)}:${String(sleepTimerTime % 60).padStart(2, '0')}` 
                    : (language === 'ru' ? 'Таймер Сна' : 'Sleep Timer')
                  }
                </span>
              </button>

              <button 
                onClick={() => setShowPlaylistModal(true)}
                className="flex items-center gap-1.5 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] px-3 py-2 rounded-full transition-colors text-sm shrink-0 text-slate-300 hover:text-[#70d6ff]"
              >
                <ListFilter className="w-4 h-4" />
                <span className="font-medium">{t('video_add_to_playlist') || 'Add to playlist'}</span>
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
          
          {/* Comments Preview Box - Appears on Mobile to mimic the screenshot */}
          <div 
            onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-2 lg:hidden bg-white/5 hover:bg-white/10 border ice-border cursor-pointer rounded-xl p-3 flex flex-col gap-1.5 transition-colors"
          >
            <div className="text-sm font-medium text-slate-100">
              {language === 'ru' ? 'Комментарии' : 'Comments'} {comments.length}
            </div>
            {comments.length > 0 ? (
               <div className="flex items-center gap-2">
                 <img 
                   src={comments[0].authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comments[0].author)}`} 
                   alt="commenter" 
                   className="w-6 h-6 rounded-full bg-slate-800 shrink-0"
                 />
                 <span className="text-xs text-slate-300 line-clamp-1 flex-1 text-ellipsis overflow-hidden">
                   {comments[0].text}
                 </span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-xs text-slate-400">
                 <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0 flex justify-center items-center">?</div>
                 <span>{language === 'ru' ? 'Будьте первым!' : 'Be the first!'}</span>
               </div>
            )}
          </div>
          
          {/* Playlist Modal */}
          {showPlaylistModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-[#0a192f] border ice-border w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b ice-border flex justify-between items-center bg-[#05070a]">
                  <h3 className="text-white font-bold">{language === 'ru' ? 'Добавить в плейлист' : 'Add to playlist'}</h3>
                  <button onClick={() => setShowPlaylistModal(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                  {playlists.length > 0 ? (
                    playlists.map(pl => {
                      const hasVideo = pl.videos.some((v: any) => v.id === video.id);
                      return (
                        <div 
                          key={pl.id} 
                          onClick={() => handleToggleVideoInPlaylist(pl.id)}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-slate-200 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${hasVideo ? 'bg-[#70d6ff] border-[#70d6ff]' : 'border-slate-500 group-hover:border-slate-300'}`}>
                            {hasVideo && <Check className="w-3.5 h-3.5 text-[#05070a]" />}
                          </div>
                          <span className="truncate">{pl.name}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      {language === 'ru' ? 'Нет плейлистов. Создайте новый.' : 'No playlists yet. Create a new one.'}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#05070a]/50 border-t ice-border flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder={language === 'ru' ? 'Имя плейлиста...' : 'Playlist name...'}
                      value={newPlaylistName}
                      onChange={e => setNewPlaylistName(e.target.value)}
                      className="flex-1 bg-white/5 border ice-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#70d6ff] transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                    <button 
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                      className="px-4 py-2 bg-[#70d6ff] text-[#05070a] font-bold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {language === 'ru' ? 'Создать' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

        {/* Desktop Description Box */}
        <div 
          onClick={() => !isDescExpanded && setIsDescExpanded(true)}
          className={`mt-4 bg-white/5 hover:bg-white/10 transition-colors border ice-border p-4 rounded-xl text-sm mx-4 sm:mx-0 ${!isDescExpanded ? 'cursor-pointer hidden sm:block' : 'hidden sm:block'}`}
        >
          <div className="font-medium text-white mb-2">
            <span className="mr-2 font-bold">
              {new Intl.NumberFormat().format(video.views)} {language === 'ru' ? (
                video.views % 10 === 1 && video.views % 100 !== 11 ? 'просмотр' :
                [2, 3, 4].includes(video.views % 10) && ![12, 13, 14].includes(video.views % 100) ? 'просмотра' :
                'просмотров'
              ) : t('video_views_time').split('•')[0].trim()}
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

        {/* Mobile Description Bottom Sheet Overlay */}
        {isDescExpanded && (
          <div className="fixed inset-0 z-[100] sm:hidden bg-black/60 backdrop-blur-sm" onClick={() => setIsDescExpanded(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] min-h-[50vh] bg-[#0f1115] rounded-t-2xl overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-[#0f1115] z-10">
                <h3 className="font-bold text-white text-lg">{language === 'ru' ? 'Описание' : 'Description'}</h3>
                <button onClick={() => setIsDescExpanded(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto w-full">
                <div className="flex gap-6 mb-6 pb-6 border-b border-white/5 hide-scrollbar overflow-x-auto">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-white text-xl">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(likesCount)}</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">{language === 'ru' ? 'Отметки "Нравится"' : 'Likes'}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-white text-xl">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(video.views)}</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">{language === 'ru' ? 'Просмотры' : 'Views'}</span>
                  </div>
                  <div className="flex flex-col items-center whitespace-nowrap">
                    <span className="font-bold text-white text-xl">{video.uploadDate}</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">{t('video_upload_date') || 'Date'}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-200 pb-20 leading-relaxed">
                  {video.description || (language === 'ru' ? 'Нет описания' : 'No description provided.')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 mb-10 px-4 sm:px-0" id="comments-section">
          <div className="flex items-center gap-6 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 pb-1 inline-flex text-white">
              {comments.length} {language === 'ru' ? (
                comments.length % 10 === 1 && comments.length % 100 !== 11 ? 'комментарий' :
                [2, 3, 4].includes(comments.length % 10) && ![12, 13, 14].includes(comments.length % 100) ? 'комментария' :
                'комментариев'
              ) : (comments.length === 1 ? 'comment' : 'comments')}
            </h2>
            <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-medium text-sm">
              <ListFilter className="w-5 h-5" />
              {t('comment_sort')}
            </button>
          </div>

            <form onSubmit={handleAddComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#70d6ff] to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                {user ? (
                  profile?.avatar ? (
                    <img src={profile.avatar} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.name || user.name || 'U').charAt(0).toUpperCase()
                  )
                ) : (
                  'А'
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={newComment}
                  disabled={isCommenting}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={language === 'ru' ? 'Оставьте комментарий (как инкогнито)...' : "Add a comment (as anonymous)... (Press Enter to post)"} 
                  className="w-full bg-transparent border-b ice-border focus:border-[#70d6ff]/50 transition-colors pb-1 outline-none text-sm text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </form>

          <div className="mt-8 flex flex-col gap-6">
            {comments.filter(c => !c.parentId).map((comment) => (
              <div key={comment.id} className="flex gap-4 group flex-col">
                <div className="flex gap-4 group">
                  <Link to={`/channel/${comment.authorId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                    <img 
                      src={comment.authorAvatar} 
                      className="w-10 h-10 rounded-full object-cover bg-slate-700" 
                      alt={comment.author} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author || 'User')}&background=random`;
                      }}
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <Link to={`/channel/${comment.authorId}`} className="font-medium text-slate-200 hover:text-white transition-colors">
                          @{(user && user.$id === comment.authorId && profile?.name) ? profile.name : comment.author}
                        </Link>
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
                        <button 
                          onClick={() => {
                            setReplyingToId(replyingToId === comment.id ? null : comment.id);
                            setReplyText("");
                          }}
                          className="text-xs font-semibold hover:text-white transition-colors uppercase tracking-wider"
                        >
                          {t('comment_reply')}
                        </button>
                    </div>
                    
                    {replyingToId === comment.id && !editingCommentId && (
                      <div className="mt-3 flex gap-3 animate-in slide-in-from-top-1 duration-200">
                         <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center text-[10px] font-bold">
                           {user ? (
                             profile?.avatar ? (
                               <img src={profile.avatar} alt="You" className="w-full h-full object-cover" />
                             ) : (
                               (profile?.name || user?.name || 'U').charAt(0).toUpperCase()
                             )
                           ) : (
                             'А'
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
                      <Link to={`/channel/${reply.authorId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                        <img 
                          src={reply.authorAvatar} 
                          className="w-8 h-8 rounded-full object-cover bg-slate-700" 
                          alt={reply.author} 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author || 'User')}&background=random`;
                          }}
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <Link to={`/channel/${reply.authorId}`} className="font-medium text-slate-200 border bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors">
                              @{(user && user.$id === reply.authorId && profile?.name) ? profile.name : reply.author}
                            </Link>
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
        {video && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-4 sm:px-0 scroll-smooth">
            <button 
              onClick={() => setActiveSuggestionFilter('all')}
              className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium transition-colors active:scale-95 cursor-pointer ${activeSuggestionFilter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {language === 'ru' ? 'Все видео' : 'All videos'}
            </button>
            {video.category && video.category !== 'All' && (
              <button 
                onClick={() => setActiveSuggestionFilter('category')}
                className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium transition-colors active:scale-95 cursor-pointer ${activeSuggestionFilter === 'category' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {language === 'ru' ? 'Из той же серии' : 'From this series'}
              </button>
            )}
            <button 
              onClick={() => setActiveSuggestionFilter('author')}
              className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium transition-colors active:scale-95 cursor-pointer ${activeSuggestionFilter === 'author' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {language === 'ru' ? `Автор: ${video.channelName?.split(' ')[0]}` : `Author: ${video.channelName?.split(' ')[0]}`}
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-4 px-4 sm:px-0 pb-20 sm:pb-0">
          {filteredSuggestedVideos.length > 0 ? (
            (() => {
              const standards = filteredSuggestedVideos.filter(v => v.contentType !== 'shorts');
              const shortsItems = filteredSuggestedVideos.filter(v => v.contentType === 'shorts');
              
              // If there are no shorts or no standards, just render them directly
              if (shortsItems.length === 0) {
                return standards.map(vid => (
                  <div key={vid.id}>
                    <div className="block lg:hidden">
                      <VideoCard video={vid} layout="grid" />
                    </div>
                    <div className="hidden lg:block">
                      <VideoCard video={vid} layout="list" />
                    </div>
                  </div>
                ));
              }

              // We want to insert the shorts shelf after the 2nd video
              const firstBatch = standards.slice(0, 2);
              const secondBatch = standards.slice(2);

              return (
                <>
                  {firstBatch.map(vid => (
                    <div key={vid.id}>
                      <div className="block lg:hidden">
                        <VideoCard video={vid} layout="grid" />
                      </div>
                      <div className="hidden lg:block">
                        <VideoCard video={vid} layout="list" />
                      </div>
                    </div>
                  ))}

                  {/* Shorts Shelf */}
                  <div className="flex flex-col gap-3 py-4 border-y border-white/10 my-2">
                    <div className="flex items-center gap-2 px-2 text-white font-bold text-lg">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M10 15l5-3-5-3v6z"/><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>
                       Shorts
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x hide-scrollbar">
                      {shortsItems.map(short => (
                          <Link to={`/shorts`} key={short.id} className="min-w-[140px] max-w-[140px] flex flex-col gap-2 snap-start group">
                           <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-800 relative">
                             <img 
                               src={getOptimizedThumbnail(short.thumbnailUrl) || '/placeholder-thumb.jpg'} 
                               alt={short.title} 
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                               onError={(e) => {
                                 (e.target as HTMLImageElement).src = `https://placehold.co/140x250/0f1115/70d6ff?text=${encodeURIComponent(short.title.substring(0, 5))}`;
                               }}
                             />
                             <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">{short.duration}</div>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-blue-400">{short.title}</span>
                             <span className="text-xs text-slate-400 mt-1">{new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { notation: "compact" }).format(short.views)} views</span>
                           </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {secondBatch.map(vid => (
                    <div key={vid.id}>
                      <div className="block lg:hidden">
                        <VideoCard video={vid} layout="grid" />
                      </div>
                      <div className="hidden lg:block">
                        <VideoCard video={vid} layout="list" />
                      </div>
                    </div>
                  ))}
                </>
              );
            })()
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              {language === 'ru' ? 'Ничего не найдено.' : 'No videos found.'}
            </div>
          )}
        </div>
      </div>

      {/* Sleep Timer Setup Selection Modal */}
      {showSleepTimerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSleepTimerModal(false)}>
          <div 
            className="bg-[#070b13] border border-[#70d6ff]/30 p-6 rounded-3xl max-w-sm w-full relative shadow-[0_0_50px_rgba(112,214,255,0.2)] text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <Moon className="w-6 h-6 fill-current" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">
              {language === "ru" ? "Управление Таймером Сна" : "Player Sleep Timer"}
            </h3>
            <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto">
              {premiumEnabled 
                ? (language === "ru" ? "Выберите через сколько минут приостановить трансляцию." : "Configure automated playback sleep routines to drift off smoothly.")
                : (language === "ru" ? "Эта функция требует Icetube Premium! Активируйте в боковом меню бесплатно." : "Sleep timers are premium exclusive utilities. Activate your free VIP trial in the side panel.")
              }
            </p>

            {premiumEnabled ? (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[5, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setSleepTimerTime(mins * 60);
                      setSleepTimerActive(true);
                      setShowSleepTimerModal(false);
                    }}
                    className="bg-white/5 border ice-border text-xs text-white hover:bg-[#70d6ff]/20 hover:text-[#70d6ff] py-2 px-3 rounded-xl font-bold font-mono transition-colors cursor-pointer"
                  >
                    {mins} {language === "ru" ? "мин" : "mins"}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSleepTimerActive(false);
                    setSleepTimerTime(0);
                    setShowSleepTimerModal(false);
                  }}
                  className="col-span-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-xs text-red-400 py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer"
                >
                  {language === 'ru' ? 'Выключить таймер' : 'Cancel Sleep Timer'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSleepTimerModal(false);
                  navigate("/premium");
                }}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider text-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {language === "ru" ? "Включить Премиум Бесплатно" : "Get Premium Free"}
              </button>
            )}

            <button 
              onClick={() => setShowSleepTimerModal(false)}
              className="text-xs text-slate-500 hover:text-slate-200 mt-2 block mx-auto font-bold cursor-pointer"
            >
              {language === 'ru' ? 'Закрыть' : 'Nevermind'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
