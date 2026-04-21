import { Home, Compass, Flame, PlaySquare, Clock, ThumbsUp, History, Film, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, label: t('nav_home'), path: "/" },
    { icon: Compass, label: t('nav_explore'), path: "/?category=Explore" },
    { icon: Flame, label: t('nav_trending'), path: "/?category=Trending" },
    { divider: true },
    { icon: PlaySquare, label: t('nav_library'), path: "/library" },
    { icon: History, label: t('nav_history'), path: "/history" },
    { icon: Film, label: t('nav_your_videos'), path: "/your-videos" },
    { icon: Clock, label: t('nav_watch_later'), path: "/watch-later" },
    { icon: ThumbsUp, label: t('nav_liked'), path: "/liked" },
    { divider: true },
    { icon: Settings, label: t('nav_settings'), path: "/settings" },
  ];

  return (
    <aside className={clsx(
      "fixed left-0 top-16 bottom-0 w-64 bg-[#05070a]/95 backdrop-blur-3xl border-r ice-border overflow-y-auto px-4 py-4 z-50 sm:z-40 custom-scrollbar transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col px-1">
        {navItems.map((item, index) => {
          if ('divider' in item && item.divider) {
            return <hr key={index} className="my-4 ice-border opacity-20 mx-2" />;
          }

          if (!('label' in item)) return null;

          // Very simple active check
          const isActive = location.pathname === item.path || location.search === item.path.replace('/', '');

          return (
            <Link
              key={item.label}
              to={item.path || "#"}
              className={clsx(
                "sidebar-item flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group",
                isActive 
                  ? "bg-[rgba(112,214,255,0.08)] text-[#70d6ff] font-medium" 
                  : "text-slate-400"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5 transition-colors",
                isActive ? "text-[#70d6ff]" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
