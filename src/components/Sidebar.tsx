import { Home, Compass, Flame, PlaySquare, Clock, ThumbsUp, History, Film } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Flame, label: "Trending", path: "/trending" },
  { divider: true },
  { icon: PlaySquare, label: "Library", path: "/library" },
  { icon: History, label: "History", path: "/history" },
  { icon: Film, label: "Your Videos", path: "/your-videos" },
  { icon: Clock, label: "Watch Later", path: "/watch-later" },
  { icon: ThumbsUp, label: "Liked", path: "/liked" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-transparent border-r ice-border overflow-y-auto px-4 py-4 hidden lg:block z-40 custom-scrollbar">
      <div className="flex flex-col px-3">
        {navItems.map((item, index) => {
          if (item.divider) {
            return <hr key={index} className="my-4 ice-border opacity-20 mx-2" />;
          }

          const isActive = location.pathname === item.path;

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
                isActive ? "text-ice-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
