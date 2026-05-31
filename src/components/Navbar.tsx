import { Search, Bell, Video, User, Menu, ArrowLeft, LogOut, ShieldAlert, Settings, LayoutDashboard, Mic, Box, Snowflake, Crown } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import { UploadModal } from "./UploadModal";
import { getXP, getLevelInfo } from "../lib/achievements";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, profile, login, logoutUser } = useAuth();
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userXp, setUserXp] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremium = () => {
      setIsPremium(localStorage.getItem("icetube_premium_enabled") === "true");
    };
    checkPremium();
    window.addEventListener("icetube_premium_changed", checkPremium);
    return () => {
      window.removeEventListener("icetube_premium_changed", checkPremium);
    };
  }, []);

  useEffect(() => {
    const fetchInitialXp = () => {
      if (!user) {
        setUserXp(getXP("guest"));
      } else {
        setUserXp(getXP(user.$id));
      }
    };
    
    fetchInitialXp();

    const handleXpChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.userId === (user?.$id || "guest")) {
        setUserXp(customEvent.detail.xp);
      }
    };
    
    window.addEventListener('icetube_xp_changed', handleXpChange);
    return () => {
      window.removeEventListener('icetube_xp_changed', handleXpChange);
    };
  }, [user]);

  const levelInfo = getLevelInfo(userXp);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const notifCol = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
      if (!dbId || !notifCol) return;

      try {
        const res = await databases.listDocuments(dbId, notifCol, [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]);
        setNotifications(res.documents);
        setUnreadCount(res.documents.filter(n => !n.isRead).length);
      } catch (err) {
        // Collection might not exist yet
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const notifCol = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
    if (!dbId || !notifCol) return;

    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const notif of unreadNotifs) {
        databases.updateDocument(dbId, notifCol, notif.$id, { isRead: true });
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { }
  };

  const getNotificationText = (notif: any) => {
    switch (notif.type) {
      case 'like': return t('notif_like') || 'liked your video';
      case 'snowflake': return t('notif_snowflake') || 'gave a snowflake to your video';
      case 'comment': return t('notif_comment') || 'commented on your video';
      case 'subscribe': return t('notif_subscribe') || 'subscribed to your channel';
      case 'upload': 
        if (notif.contentType === 'shorts') {
          return language === 'ru' ? 'опубликовал(а) новый Short' : 'uploaded a new Short';
        }
        return t('notif_upload') || 'uploaded a new video';
      default: return 'interaction';
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/`);
    }
    setMobileSearchOpen(false);
  };

  if (mobileSearchOpen) {
    return (
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#05070a]/95 backdrop-blur-3xl border-b ice-border z-50 flex items-center px-2 sm:px-6 justify-between transition-all pt-safe">
        <button onClick={() => setMobileSearchOpen(false)} className="p-2 text-slate-300 hover:bg-white/5 rounded-full mr-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input 
            autoFocus
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')} 
            className="w-full bg-white/5 border ice-border rounded-full py-2 px-4 text-sm focus:outline-none focus:border-blue-400/50 transition-colors text-slate-200"
          />
        </form>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-ice-glass border-b ice-border z-50 flex items-center px-4 sm:px-6 justify-between transition-all pt-safe">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-[rgba(112,214,255,0.08)] rounded-full text-slate-300 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-4">
          {/* Logo provided by user */}
          <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-white/5 border ice-border shadow-[0_0_15px_rgba(112,214,255,0.15)]">
             <img src="https://res.cloudinary.com/du6zw4m8g/image/upload/v1776451556/5395585251976877323_gkvgwj.jpg" alt="Icetube 2.0" className="w-full h-full object-cover" />
          </div>
          <div className="ice-logo hidden sm:flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5 text-[#70d6ff] animate-pulse" />
            <span>ICETUBE</span>
            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30 tracking-normal font-medium leading-none">2.0</div>
            <Snowflake className="w-3.5 h-3.5 text-[#70d6ff] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl px-4 sm:px-8 hidden md:flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative group flex-1">
          <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center shrink-0">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-[#70d6ff] transition-colors" />
          </button>
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')} 
            className="w-full bg-white/5 border ice-border rounded-full py-2 px-6 pl-10 text-sm focus:outline-none focus:border-blue-400/50 transition-colors placeholder:text-slate-500 text-slate-200"
          />
        </form>
        <button 
          type="button"
          className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-[rgba(112,214,255,0.08)] border ice-border flex items-center justify-center transition-colors text-slate-300 hover:text-[#70d6ff]"
          title={language === 'ru' ? 'Голосовой поиск' : 'Voice Search'}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#70d6ff]/20 to-blue-600/20 hover:from-[#70d6ff]/30 hover:to-blue-600/30 rounded-full text-slate-100 transition-all border border-[#70d6ff]/30 hover:border-[#70d6ff]/60 group shadow-[0_0_15px_rgba(112,214,255,0.1)] active:scale-95"
            title={language === 'ru' ? 'Загрузить ролик' : 'Upload Video'}
          >
            <Video className="w-5 h-5 group-hover:text-[#70d6ff] transition-colors" />
            <span className="text-sm font-black italic uppercase tracking-tighter hidden lg:inline">{language === 'ru' ? 'Загрузить' : 'Upload'}</span>
          </button>
        )}

        <UploadModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)}
        />

        <button 
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 hover:bg-cold-hover rounded-full text-slate-300 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => { 
              if (!showNotification) handleMarkAsRead();
              setShowNotification(!showNotification); 
              setShowUserMenu(false); 
            }}
            className="p-2 hover:bg-[rgba(112,214,255,0.08)] rounded-full text-slate-300 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#70d6ff] rounded-full shadow-[0_0_8px_rgba(112,214,255,0.8)] border border-[#05070a]"></span>
            )}
          </button>
          
          {showNotification && (
            <div className="absolute top-12 right-0 w-[280px] sm:w-80 max-w-[calc(100vw-1.5rem)] bg-[#0a192f] border ice-border shadow-2xl rounded-xl z-50 flex flex-col max-h-[70vh]">
              <div className="p-4 border-b ice-border shrink-0 flex items-center justify-between">
                <span className="font-semibold text-slate-100">{t('notifications_title') || 'Notifications'}</span>
                {unreadCount > 0 && <span className="text-xs bg-[#70d6ff]/20 text-[#70d6ff] px-2 py-1 rounded-full">{unreadCount}</span>}
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    {t('notifications_empty') || 'No notifications right now'}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notif: any) => (
                      <Link 
                        key={notif.$id} 
                        to={notif.videoId ? `/watch/${notif.videoId}` : `/channel/${notif.actorId}`}
                        onClick={() => setShowNotification(false)}
                        className={`block p-4 hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-blue-500/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <img 
                            src={notif.actorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.actorName || 'User')}`} 
                            alt={notif.actorName} 
                            className="w-10 h-10 rounded-full shrink-0 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-300">
                              <strong className="text-white">{notif.actorName}</strong> {getNotificationText(notif)}
                            </span>
                            {notif.videoTitle && (
                              <span className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-[200px]">
                                {notif.videoTitle}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 mt-1">
                              {new Date(notif.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative ml-2">
          {user ? (
            <>
              <button 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotification(false); }}
                className={`w-9 h-9 rounded-full relative flex items-center justify-center transition-all text-white font-bold text-sm shrink-0 border ${levelInfo.borderClass} ${levelInfo.glowClass} hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-[#70d6ff]`}
                title={`${levelInfo.title} (Lvl ${levelInfo.level})`}
              >
                {profile?.avatar ? (
                  <img 
                    src={profile.avatar} 
                    className="w-full h-full object-cover rounded-full" 
                    alt="Profile" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.name || 'User')}&background=random`;
                    }}
                  />
                ) : (
                  (profile?.name || user.name) ? (profile?.name || user.name).charAt(0).toUpperCase() : <User className="w-4 h-4" />
                )}
                {/* Level Badge Overlay */}
                <span className="absolute -bottom-1 -right-1 bg-[#05070a]/90 border border-[#70d6ff]/40 rounded-full w-[15px] h-[15px] flex items-center justify-center text-[9px] select-none cursor-default shadow-md" title={`${levelInfo.title} (Уровень ${levelInfo.level})`}>
                  {levelInfo.badge}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute top-12 right-0 w-[260px] sm:w-72 max-w-[calc(100vw-1.5rem)] bg-[#070b13] border border-[#70d6ff]/20 shadow-[0_4px_30px_rgba(112,214,255,0.15)] rounded-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setShowUserMenu(false)}>
                  <div className="p-4 border-b ice-border bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full relative flex items-center justify-center shrink-0 text-white font-bold border ${levelInfo.borderClass}`}>
                         {profile?.avatar ? (
                           <img 
                              src={profile.avatar} 
                              className="w-full h-full object-cover rounded-full" 
                              alt="Profile" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.name || 'User')}&background=random`;
                              }}
                            />
                         ) : (
                           (profile?.name || user.name) ? (profile?.name || user.name).charAt(0).toUpperCase() : 'U'
                         )}
                         <span className="absolute -bottom-1 -right-1 bg-black border border-[#70d6ff]/35 rounded-full w-[14px] h-[14px] flex items-center justify-center text-[8px]">
                           {levelInfo.badge}
                         </span>
                      </div>
                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                          {profile?.name || user.name || "User"}
                          {isPremium && <Crown className="w-4 h-4 text-yellow-400 shrink-0 fill-current animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
                        </span>
                        <span className="text-xs text-slate-400 truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Gamified Level & Progress bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          {language === 'ru' ? 'Ранг:' : 'Rank:'} 
                          <span className={`font-bold ${levelInfo.color}`}>{levelInfo.title}</span>
                        </span>
                        <span className="text-[#70d6ff] font-bold">Lvl {levelInfo.level}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full border border-white/10 overflow-hidden relative" title={`${userXp} / ${levelInfo.nextLevelXp} XP`}>
                        <div 
                          className="h-full bg-gradient-to-r from-[#70d6ff] to-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(112,214,255,0.5)]" 
                          style={{ width: `${levelInfo.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{userXp} XP</span>
                        <span>{levelInfo.nextLevelXp} XP</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2 flex flex-col">
                    <Link 
                        to={`/channel/${user.$id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-[#70d6ff] hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border font-medium"
                      >
                        <User className="w-4 h-4" /> {language === 'ru' ? 'Ваш канал' : 'Your Channel'}
                    </Link>
                    <Link 
                        to="/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border"
                      >
                        <LayoutDashboard className="w-4 h-4" /> {t('nav_studio')}
                    </Link>
                    <Link 
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border"
                      >
                        <Settings className="w-4 h-4" /> {t('nav_settings')}
                    </Link>
                    <button 
                      onClick={logoutUser}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> {t('nav_sign_out')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 bg-white/5 border border-[#70d6ff]/20 text-[#70d6ff] hover:bg-[#70d6ff]/10 hover:border-[#70d6ff]/40 px-3 sm:px-4 py-1.5 rounded-full transition-all text-sm font-medium whitespace-nowrap shadow-[0_0_10px_rgba(112,214,255,0.05)]"
            >
              <Box className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav_sign_in')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
