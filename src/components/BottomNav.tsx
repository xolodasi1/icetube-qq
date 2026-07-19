import { Home, Compass, PlusCircle, PlaySquare, Library, FileVideo, ListPlus, X, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import React, { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";

export function BottomNav() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get("category");
  // Скрываем навигацию на странице Shorts
  if (location.pathname.startsWith('/shorts')) {
    return null;
  }
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showLibraryMenu, setShowLibraryMenu] = useState(false);
  const { t } = useLanguage();
  const { profile } = useAuth();

  const items = [
    { icon: Home, label: t('nav_home'), path: "/", active: location.pathname === "/" && !activeCategory },
    { icon: Compass, label: t('nav_explore'), path: "/?category=Explore", active: activeCategory === "Explore" },
    { icon: PlusCircle, label: t('nav_upload'), path: "#", active: false, center: true, action: () => setShowCreateMenu(!showCreateMenu) },
    { icon: PlaySquare, label: t('nav_library'), path: "/library", active: location.pathname === "/library" },
    { icon: Library, label: t('nav_you'), path: "#", active: location.pathname === "/your-videos", action: () => setShowLibraryMenu(!showLibraryMenu) },
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

          if (item.action) {
            return (
              <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center gap-1 flex-1">
                <Icon 
                  className={clsx(
                    "w-6 h-6 transition-colors", 
                    item.active ? "text-[#70d6ff] fill-[rgba(112,214,255,0.1)]" : "text-slate-400"
                  )} 
                />
                <span className={clsx("text-[10px] font-medium transition-colors whitespace-nowrap", item.active ? "text-slate-100" : "text-slate-500")}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link key={idx} to={item.path} className="flex flex-col items-center justify-center gap-1 flex-1">
              <Icon 
                className={clsx(
                  "w-6 h-6 transition-colors", 
                  item.active ? "text-[#70d6ff] fill-[rgba(112,214,255,0.1)]" : "text-slate-400"
                )} 
              />
              <span className={clsx("text-[10px] font-medium transition-colors whitespace-nowrap", item.active ? "text-slate-100" : "text-slate-500")}>
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
               <span className="font-semibold text-white">{t('nav_create')}</span>
               <button onClick={() => setShowCreateMenu(false)} className="text-slate-400 hover:text-white"><X /></button>
             </div>
             <div className="p-2">
                 <Link to="/studio/content" onClick={() => setShowCreateMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                    <FileVideo className="w-6 h-6 text-[#70d6ff]" />
                    {t('nav_upload')}
                 </Link>
                 <Link to="/playlists" onClick={() => setShowCreateMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                    <ListPlus className="w-6 h-6 text-[#70d6ff]" />
                    {t('nav_playlists')}
                 </Link>
             </div>
           </div>
        </div>
      )}
      {showLibraryMenu && (
          <div className="fixed inset-0 bg-[#05070a]/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4" onClick={() => setShowLibraryMenu(false)}>
            <div className="bg-[#0a192f] border ice-border rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b ice-border flex justify-between items-center">
                <span className="font-semibold text-white">{t('nav_you')}</span>
                <button onClick={() => setShowLibraryMenu(false)} className="text-slate-400 hover:text-white"><X /></button>
              </div>
              <div className="p-2">
                  <Link to={`/channel/me`} onClick={() => setShowLibraryMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                     <Library className="w-6 h-6 text-[#70d6ff]" />
                     {t('nav_go_to_channel')}
                  </Link>
                  <Link to="/studio" onClick={() => setShowLibraryMenu(false)} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-lg text-slate-200">
                     <LayoutDashboard className="w-6 h-6 text-[#70d6ff]" />
                     {t('nav_go_to_studio')}
                  </Link>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
