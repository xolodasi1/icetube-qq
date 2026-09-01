import { Link } from "react-router-dom";
import { History, ThumbsUp, Clock, Bookmark, Download, PlaySquare, Video, ListVideo, Scissors, Image, Film } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

export default function Library() {
  const { t, language } = useLanguage();

  const items = [
    { icon: History, label: t('nav_history'), path: "/history" },
    { icon: ThumbsUp, label: t('nav_liked'), path: "/liked" },
    { icon: Clock, label: t('nav_watch_later'), path: "/watch-later" },
    { icon: Bookmark, label: t('nav_favorites'), path: "/favorites" },
    { icon: Download, label: t('nav_downloads'), path: "/downloads" },
    { icon: PlaySquare, label: t('nav_continue_watching'), path: "/continue-watching" },
    { icon: Video, label: t('nav_your_videos'), path: "/your-videos" },
    { icon: ListVideo, label: t('nav_playlists'), path: "/playlists" },
    { icon: Scissors, label: t('nav_clips'), path: "/clips" },
    { icon: Image, label: t('nav_photos'), path: "/photos" },
    { icon: Film, label: t('nav_photo_albums'), path: "/albums" },
  ];

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mb-8">
        {language === "ru" ? "Библиотека" : "Library"}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border ice-border hover:bg-white/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#70d6ff]/10 flex items-center justify-center text-[#70d6ff] group-hover:bg-[#70d6ff]/20 transition-colors">
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
