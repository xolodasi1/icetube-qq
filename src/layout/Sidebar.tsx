import { Home, Compass, Flame, PlaySquare, Clock, ThumbsUp, History, Settings, User, Video, Download, ChevronRight, ChevronDown, Scissors, Music, Film, Radio, Youtube, ListVideo, Send, Bookmark, Trophy, Image, Search, List } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../language/LanguageContext";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [subscribedChannels, setSubscribedChannels] = useState<{id: string, name: string, avatar: string}[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        if (!dbId || !usersColId) return;

        // Fetch user's subscriptions
        const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
        if (subsColId) {
          const subsRes = await databases.listDocuments(dbId, subsColId, [
            Query.equal('subscriberId', user.$id)
          ]);
          
          if (subsRes.documents.length > 0) {
            const channelIds = subsRes.documents.map((s: any) => s.channelId);
            
            const chanRes = await databases.listDocuments(dbId, usersColId, [
              Query.equal('$id', channelIds),
              Query.limit(10) // Limit to top 10 for sidebar
            ]);
            
            const merged = new Map<string, any>();
            chanRes.documents.forEach((doc: any) => {
              const key = doc.userId || doc.$id;
              if (!merged.has(key)) merged.set(key, doc);
            });
            // добираем legacy-профили, где $id != userId
            try {
              const missing = channelIds.filter((cid: string) => !merged.has(cid));
              if (missing.length > 0) {
                const extra = await databases.listDocuments(dbId, usersColId, [
                  Query.equal('userId', missing.slice(0, 10)),
                  Query.limit(10)
                ]).catch(()=>({documents:[]} as any));
                extra.documents.forEach((doc: any) => {
                  const key = doc.userId || doc.$id;
                  if (!merged.has(key)) merged.set(key, doc);
                });
              }
            } catch {}
            setSubscribedChannels(channelIds.map((cid: string) => {
              const doc: any = merged.get(cid) || [...merged.values()].find((d: any) => d.$id === cid);
              if (!doc) return null;
              return {
                id: doc.$id,
                name: doc.name || 'Channel',
                avatar: doc.avatar || doc.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'U')}`
              };
            }).filter(Boolean) as {id: string, name: string, avatar: string}[]);
          }
        }
      } catch (err) {
        // NetworkError is often transient or caused by blocking (e.g. adblocker)
        console.error("Error fetching sidebar data:", err);
        // Silently fail to avoid disrupting user experience for sidebar nav
      }
    };
    fetchUserData();
  }, [user]);

  const navItems: any[] = [
    { header_text: language === 'ru' ? 'Главная' : 'Main' },
    { icon: Home, label: t('nav_home'), path: "/" },
    { icon: Film, label: language === 'ru' ? 'Видео' : 'Videos', path: "/videos" },
    { icon: Compass, label: t('nav_shorts'), path: "/shorts" },
    { icon: Image, label: language === 'ru' ? 'Фото' : 'Photos', path: "/photos" },
    { divider: true },
    { header_text: language === 'ru' ? 'Вы' : 'You' },
    ...(user ? [{ icon: User, label: t('nav_your_channel'), path: `/channel/${user.$id}` }] : []),
    { icon: History, label: t('nav_history'), path: "/history", requiresAuth: true },
    { icon: PlaySquare, label: t('nav_continue_watching'), path: "/continue-watching" },
    { icon: Bookmark, label: t('nav_favorites'), path: "/favorites" },
    { icon: ListVideo, label: t('nav_playlists'), path: "/playlists" },
    { icon: Clock, label: t('nav_watch_later'), path: "/watch-later" },
    { icon: ThumbsUp, label: t('nav_liked'), path: "/liked" },
    { icon: Video, label: t('nav_your_videos'), path: "/your-videos", requiresAuth: true },
    { icon: Download, label: t('nav_downloads'), path: "/downloads", requiresAuth: true },
    { icon: Scissors, label: t('nav_clips'), path: "/clips", requiresAuth: true },
    { icon: Trophy, label: t('nav_top_channels'), path: "/top-channels" },
  ];

  return (
    <aside className={clsx(
      "fixed left-0 top-16 bottom-0 w-64 bg-[#05070a]/95 backdrop-blur-3xl border-r ice-border overflow-y-auto px-4 pt-4 pb-[72px] sm:pb-4 z-[60] lg:z-40 custom-scrollbar transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col px-1">
        {navItems.map((item, index) => {
          if ('divider' in item && item.divider) {
            return <hr key={index} className="my-4 ice-border opacity-20 mx-2" />;
          }

          if ('header' in item && item.header) {
            return (
              <Link 
                key={`hdr-${index}`} 
                to={item.path || "#"}
                className="flex items-center gap-2 px-3 py-2 text-white font-bold text-base hover:bg-white/5 rounded-xl transition-colors w-fit"
              >
                {item.header}
                <ChevronRight className="w-5 h-5" />
              </Link>
            )
          }

          if ('header_text' in item && item.header_text) {
            return (
              <div key={`hdrtxt-${index}`} className="px-3 py-2 text-white font-bold text-base">
                {item.header_text}
              </div>
            )
          }

          if (!('label' in item) || !item.icon) return null;
          
          if (item.requiresAuth && !user) return null;
          
          const isActive = !item.isExternal && (location.pathname === item.path || location.search === item.path?.replace('/', ''));
          
          const LinkComponent = item.isExternal ? 'a' : Link;
          const linkProps = item.isExternal ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } : { to: item.path || "#" };

          return (
            <LinkComponent
              key={item.label as string}
              {...linkProps as any}
              className={clsx(
                "sidebar-item flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:bg-white/5",
                isActive 
                  ? "bg-[rgba(112,214,255,0.08)] text-[#70d6ff] font-medium" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5 transition-colors",
                isActive ? "text-[#70d6ff]" : ('iconColor' in item ? item.iconColor : "text-slate-500 group-hover:text-white")
              )} />
              <span className="text-sm">{item.label as string}</span>
            </LinkComponent>
          );
        })}

        {subscribedChannels.length > 0 && (
          <>
            <hr className="my-4 ice-border opacity-20 mx-2" />
            <div className="px-3 py-2 text-white font-bold text-base">Подписки</div>
            {subscribedChannels.map(s=>(
              <Link key={s.id} to={`/channel/${s.id}`} className="sidebar-item flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:bg-white/5 text-slate-400 hover:text-white">
                <img
                  src={s.avatar}
                  alt={s.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={(e)=>{ (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'U')}`; }}
                  className="w-5 h-5 rounded-full object-cover bg-white/5 shrink-0"
                />
                <span className="text-sm truncate">{s.name}</span>
              </Link>
            ))}
          </>
        )}

        <hr className="my-4 ice-border opacity-20 mx-2" />
        <div className="px-3 py-2 text-white font-bold text-base">{t('nav_socials')}</div>
        <a href="https://t.me/SAOtop" target="_blank" rel="noopener noreferrer" className="sidebar-item flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:bg-white/5 text-slate-400 hover:text-white">
          <Send className="w-5 h-5 transition-colors text-blue-400 group-hover:text-blue-300" />
          <span className="text-sm">{t('nav_telegram')}</span>
        </a>

        <hr className="my-4 ice-border opacity-20 mx-2" />
        <Link
          to="/settings"
          className={clsx(
            "sidebar-item flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:bg-white/5",
            location.pathname === "/settings"
              ? "bg-[rgba(112,214,255,0.08)] text-[#70d6ff] font-medium"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Settings className={clsx("w-5 h-5 transition-colors", location.pathname === "/settings" ? "text-[#70d6ff]" : "text-slate-500 group-hover:text-white")} />
          <span className="text-sm">{t('nav_settings')}</span>
        </Link>

      </div>
    </aside>
  );
}
