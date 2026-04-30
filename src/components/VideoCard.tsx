import { Link } from "react-router-dom";
import { Video } from "../data";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";
import { Check } from "lucide-react";
import { getOptimizedThumbnail } from "../lib/cloudinary";

interface VideoCardProps {
  video: Video;
  layout?: "grid" | "list" | "clip";
  hideDetails?: boolean;
  key?: string | number;
}

export function VideoCard({ video, layout = "grid", hideDetails = false }: VideoCardProps) {
  const { t, language } = useLanguage();
  const formatViews = (views: number) => {
    if (language === 'ru') {
      if (views >= 1000000) return (views / 1000000).toFixed(1) + " млн";
      if (views >= 1000) return (views / 1000).toFixed(1) + " тыс.";
      return views.toString();
    }
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K";
    return views.toString();
  };

  const isList = layout === "list";
  const isClip = layout === "clip";

  if (isClip) {
    return (
      <Link to={`/shorts/${video.id}`} className="block relative group aspect-[9/16] rounded-2xl overflow-hidden ice-panel border ice-border">
        <img 
          src={getOptimizedThumbnail(video.thumbnailUrl)} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/640x360/0f1115/70d6ff?text=${encodeURIComponent(video.title.substring(0, 10))}`;
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col gap-1">
          <h3 className="text-white font-bold line-clamp-2 text-sm drop-shadow-md">{video.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-300">
             <span>{formatViews(video.views)} {t('video_views')}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-[#70d6ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Link>
    );
  }

  return (
    <div className={clsx("group flex block", isList ? "flex-row gap-3 w-full" : "video-card flex-col")}>
      <Link to={`/watch/${video.id}`} className={clsx("shrink-0 video-thumb", isList ? "w-40 sm:w-48 rounded-xl overflow-hidden" : "w-full")}>
        <img 
          src={getOptimizedThumbnail(video.thumbnailUrl)} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 relative z-10 opacity-95"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/640x360/0f1115/70d6ff?text=${encodeURIComponent(video.title.substring(0, 10))}`;
          }}
        />
        <div className="absolute inset-0 bg-blue-900/10 z-20 pointer-events-none"></div>
        <div className="duration-badge z-30">
          {video.duration}
        </div>
      </Link>
      
      <div className={clsx("flex gap-3 items-start", isList ? "mt-0 pl-1 pr-4 sm:px-2 py-4 sm:py-1" : "p-4 px-4 sm:px-0 sm:py-4")}>
        {!isList && (
          <Link to={`/channel/${video.uploaderId}`} className="shrink-0 z-20">
            <img 
              src={video.channelAvatar} 
              alt={video.channelName} 
              className="w-9 h-9 rounded-full object-cover bg-slate-700 hover:ring-2 hover:ring-[#70d6ff] transition-all"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName || 'User')}&background=random`;
              }}
            />
          </Link>
        )}
        <div className="flex flex-col overflow-hidden">
          <Link to={`/watch/${video.id}`} className={clsx("text-slate-200 font-bold line-clamp-2 group-hover:text-[#70d6ff] transition-colors leading-tight mb-1", isList ? "text-sm sm:text-base" : "text-sm")}>
            {video.title}
          </Link>
          <div className="text-slate-500 text-xs sm:text-sm flex flex-col gap-0.5">
            <Link to={`/channel/${video.uploaderId}`} className="hover:text-slate-300 transition-colors truncate flex items-center gap-1 w-full">
              <span className="truncate">{video.channelName}</span>
              <div className="w-3 h-3 bg-slate-500 text-black rounded-full flex items-center justify-center shrink-0">
                <Check className="w-2 h-2" />
              </div>
            </Link>
            <Link to={`/watch/${video.id}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 focus:outline-none w-full">
              <span className="truncate">{formatViews(video.views)} {t('video_views')}</span>
              <span>•</span>
              <span className="truncate">{video.uploadDate}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
