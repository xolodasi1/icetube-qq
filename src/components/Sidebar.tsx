import { Home, Compass, Flame, PlaySquare, Clock, ThumbsUp, History, Settings, User, Video, Download, ChevronRight, ChevronDown, Scissors, Music, Film, Radio, Youtube, ListVideo, Send, Bookmark, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { useEffect, useState } from "react";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { t } = useLanguage();
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
            
            setSubscribedChannels(chanRes.documents.map((doc: any) => ({
              id: doc.$id,
              name: doc.name,
              avatar: doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}`
            })));
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

  const navItems = [
    { icon: Home, label: t('nav_home'), path: "/" },
    { icon: Compass, label: t('nav_shorts'), path: "/shorts" },
    { icon: Video, label: t('nav_videos'), path: "/videos" },
    { icon: PlaySquare, label: t('nav_subscriptions'), path: "/subscriptions" },
    { divider: true },
    ...(user ? [{ header: t('nav_you'), path: `/channel/${user.$id}` }] : []),
    ...(user ? [{ icon: User, label: t('nav_your_channel'), path: `/channel/${user.$id}` }] : []),
    { icon: History, label: t('nav_history'), path: "/history", requiresAuth: true },
    { icon: Trophy, label: t('nav_top_channels'), path: "/top-channels" },
    { icon: PlaySquare, label: t('nav_continue_watching'), path: "/continue-watching" },
    { icon: Bookmark, label: t('nav_favorites'), path: "/favorites" },
    { icon: ListVideo, label: t('nav_playlists'), path: "/playlists" },
    { icon: Clock, label: t('nav_watch_later'), path: "/watch-later" },
    { icon: ThumbsUp, label: t('nav_liked'), path: "/liked" },
    { icon: Video, label: t('nav_your_videos'), path: "/your-videos", requiresAuth: true },
    { icon: Download, label: t('nav_downloads'), path: "/downloads", requiresAuth: true },
    { icon: Scissors, label: t('nav_clips'), path: "/clips", requiresAuth: true },
    
    { divider: true },
    { icon: Settings, label: t('nav_settings'), path: "/settings" },
    
    { divider: true },
    { header_text: t('nav_socials') },
    { icon: Send, label: t('nav_telegram'), path: "https://t.me/SAOtop", isExternal: true, iconColor: "text-blue-400 group-hover:text-blue-300" },
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

      </div>
    </aside>
  );
}
