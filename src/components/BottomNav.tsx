import { Home, Compass, PlusCircle, PlaySquare, Library, FileVideo, ListPlus, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import React, { useState } from "react";

export function BottomNav() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get("category");
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const items = [
    { icon: Home, label: "Home", path: "/", active: location.pathname === "/" && !activeCategory },
    { icon: Compass, label: "Explore", path: "/?category=Explore", active: activeCategory === "Explore" },
    { icon: PlusCircle, label: "Upload", path: "#", active: false, center: true, action: () => setShowCreateMenu(!showCreateMenu) },
    { icon: PlaySquare, label: "Library", path: "/library", active: location.pathname === "/library" },
    { icon: Library, label: "You", path: "/your-videos", active: location.pathname === "/your-videos" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-ice-glass border-t ice-border z-50 flex items-center justify-around sm:hidden px-2 pb-safe">
        {items.map((item, idx) => {
          const Icon = item.icon;
          if (item.center) {
            return (
              <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center relative -top-3">
                 <div className="w-12 h-12 bg-gradient-to-br from-[#70d6ff] to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(112,214,255,0.4)] text-black">
                   <Icon className="w-6 h-6 stroke-[2.5]" />
                 </div>
              </button>
            );
          }

          return (
            <Link key={idx} to={item.path} className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
              <Icon 
                className={clsx(
                  "w-6 h-6 transition-colors", 
                  item.active ? "text-[#70d6ff] fill-[rgba(112,214,255,0.1)]" : "text-slate-400"
                )} 
              />
              <span className={clsx("text-[10px] font-medium transition-colors", item.active ? "text-slate-100" : "text-slate-500")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
      {showCreateMenu && (
        <div className="fixed inset-0 bg-[#05070a]/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4" onClick={() => setShowCreateMenu(false)}>
           <div className="bg-[#0a192f] border ice-border rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b ice-border flex justify-between items-center">
               <span className="font-semibold text-white">Create</span>
               <button onClick={() => setShowCreateMenu(false)} className="text-slate-400 hover:text-white"><X /></button>
             </div>
             <div className="p-2">
                 <Link to="/studio/content" onClick={() => setShowCreateMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                    <FileVideo className="w-6 h-6 text-[#70d6ff]" />
                    Upload Video
                 </Link>
                 <Link to="/playlists" onClick={() => setShowCreateMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                    <ListPlus className="w-6 h-6 text-[#70d6ff]" />
                    Create Playlist
                 </Link>
             </div>
           </div>
        </div>
      )}
    </>
  );
}
