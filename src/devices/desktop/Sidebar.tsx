import { Home, Compass, Flame, PlaySquare, Clock, ThumbsUp, History, Settings, User, Video, Download, ChevronRight, Scissors, Music, Film, Radio, ListVideo, Send, Bookmark, Trophy, Image, Search, List } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../../language/LanguageContext";
import { useAuth } from "../../auth/AuthContext";
import { useEffect, useState } from "react";
import { databases } from "../../lib/appwrite";
import { Query } from "appwrite";

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [subs, setSubs] = useState<{id:string,name:string,avatar:string}[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
        if (!dbId || !usersColId || !subsColId) return;
        const subsRes = await databases.listDocuments(dbId, subsColId, [Query.equal('subscriberId', user.$id), Query.limit(50)]);
        if (subsRes.documents.length === 0) return;
        const ids = subsRes.documents.map((s:any)=>s.channelId).slice(0,12);
        const chanRes = await databases.listDocuments(dbId, usersColId, [Query.equal('$id', ids), Query.limit(12)]);
        setSubs(chanRes.documents.map((d:any)=>({ id: d.$id, name: d.name, avatar: d.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=0f172a&color=70d6ff` })));
      } catch {}
    })();
  }, [user]);

  const navItems: any[] = [
    { icon: Home, label: t('nav_home'), path: "/" },
    { icon: List, label: t('nav_browse'), path: "/browse" },
    { icon: Search as any, label: t('nav_search'), path: "/search" },
    { icon: Compass, label: t('nav_shorts'), path: "/shorts" },
    { icon: Image, label: t('nav_photos'), path: "/photos" },
    { icon: Image, label: t('nav_photo_albums'), path: "/albums" },
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
    { icon: Send, label: t('nav_telegram'), path: "https://t.me/SAOtop", isExternal: true, iconColor: "text-blue-400" },
  ];

  return (
    <aside className={clsx("fixed left-0 top-16 bottom-0 w-[264px] bg-[#05070a]/98 backdrop-blur-2xl border-r border-white/[0.06] overflow-y-auto px-3 pt-4 pb-6 z-[40] custom-scrollbar transition-transform duration-300 lg:z-40", isOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex flex-col gap-1">
        {navItems.map((item, i) => {
          if (item.divider) return <div key={i} className="my-3 h-px bg-white/[0.06] mx-2" />;
          if (item.header) return <Link key={i} to={item.path} className="mx-1 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-colors">{item.header} <ChevronRight className="w-4 h-4 ml-auto" /></Link>;
          if (item.header_text) return <div key={i} className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-widest uppercase text-white/40">{item.header_text}</div>;
          if (!item.label || !item.icon) return null;
          if (item.requiresAuth && !user) return null;
          const isActive = !item.isExternal && location.pathname === item.path;
          const Comp: any = item.isExternal ? 'a' : Link;
          const props: any = item.isExternal ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } : { to: item.path };
          return (
            <Comp key={item.label} {...props} className={clsx("flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium transition-all", isActive ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]")}>
              <item.icon className={clsx("w-[18px] h-[18px] shrink-0", isActive ? "text-black" : item.iconColor || "text-zinc-500")} />
              <span className="truncate">{item.label}</span>
            </Comp>
          );
        })}

        {subs.length > 0 && (
          <>
            <div className="my-3 h-px bg-white/[0.06] mx-2" />
            <div className="px-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-white/40">Подписки</div>
            {subs.map(s=>(
              <Link key={s.id} to={`/channel/${s.id}`} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors">
                <img src={s.avatar} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm text-zinc-300 truncate">{s.name}</span>
              </Link>
            ))}
          </>
        )}
        <div className="mt-6 px-3 text-[11px] leading-relaxed text-white/25">© 2025 Icetube • Сделано для холода ❄️</div>
      </div>
    </aside>
  );
}
