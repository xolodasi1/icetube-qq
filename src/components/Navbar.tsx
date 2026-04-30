import { Search, Bell, Video, User, Menu, ArrowLeft, LogOut, ShieldAlert, Settings, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, profile, login, logoutUser } = useAuth();
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const getNotificationText = (action: string) => {
    switch (action) {
      case 'like': return t('notif_like') || 'liked your video';
      case 'snowflake': return t('notif_snowflake') || 'gave a snowflake to your video';
      case 'comment': return t('notif_comment') || 'commented on your video';
      case 'subscribe': return t('notif_subscribe') || 'subscribed to your channel';
      case 'upload': return t('notif_upload') || 'uploaded a new video';
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
          <div className="ice-logo hidden sm:flex">
            <span>ICETUBE</span>
            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30 tracking-normal font-medium leading-none">2.0</div>
          </div>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl px-4 sm:px-8 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative group">
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
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
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
            <div className="absolute top-12 -right-12 sm:right-0 w-[calc(100vw-32px)] sm:w-80 bg-[#0a192f] border ice-border shadow-2xl rounded-xl z-50 flex flex-col max-h-[70vh]">
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
                              <strong className="text-white">{notif.actorName}</strong> {getNotificationText(notif.type)}
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
                className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#70d6ff] to-blue-600 border border-white/20 flex items-center justify-center transition-colors text-white font-bold text-sm shrink-0 hover:ring-2 hover:ring-[#70d6ff]/50"
              >
                {profile?.avatar ? (
                  <img 
                    src={profile.avatar} 
                    className="w-full h-full object-cover" 
                    alt="Profile" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.name || 'User')}&background=random`;
                    }}
                  />
                ) : (
                  (profile?.name || user.name) ? (profile?.name || user.name).charAt(0).toUpperCase() : <User className="w-4 h-4" />
                )}
              </button>
              
              {showUserMenu && (
                <div className="absolute top-12 -right-4 sm:right-0 w-[calc(100vw-32px)] sm:w-64 bg-[#0a192f] border ice-border shadow-2xl rounded-xl z-50 overflow-hidden" onClick={() => setShowUserMenu(false)}>
                  <div className="p-4 border-b ice-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#70d6ff] to-blue-600 flex items-center justify-center shrink-0 text-white font-bold">
                       {profile?.avatar ? (
                         <img 
                            src={profile.avatar} 
                            className="w-full h-full object-cover" 
                            alt="Profile" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.name || 'User')}&background=random`;
                            }}
                          />
                       ) : (
                         (profile?.name || user.name) ? (profile?.name || user.name).charAt(0).toUpperCase() : 'U'
                       )}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <span className="font-semibold text-slate-100 text-sm truncate">{profile?.name || user.name || "User"}</span>
                      <span className="text-xs text-slate-400 truncate">{user.email}</span>
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
              className="flex items-center gap-2 border border-[#70d6ff]/40 text-[#70d6ff] hover:bg-[#70d6ff]/10 px-3 sm:px-4 py-1.5 rounded-full transition-colors text-sm font-medium whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav_sign_in')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
