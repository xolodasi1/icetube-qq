import { Link } from "react-router-dom";
import { Video } from "../data";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";
import { Check, Zap } from "lucide-react";
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
  const isShortContentType = video.contentType === 'shorts' || video.title?.toLowerCase().includes('#shorts') || video.description?.toLowerCase().includes('#shorts');
  const targetUrl = (isClip || isShortContentType) ? `/shorts/${video.id}` : `/watch/${video.id}`;

  if (isClip) {
    return (
      <Link to={targetUrl} className="block relative group aspect-[9/16] rounded-2xl overflow-hidden ice-panel border ice-border">
        <img 
          src={getOptimizedThumbnail(video.thumbnailUrl)} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.startsWith('data:')) {
              target.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='100%25' height='100%25' fill='%230f1115'/%3E%3Ctext x='50%25' y='50%25' fill='%2370d6ff' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='24'%3EIMG%3C/text%3E%3C/svg%3E`;
            }
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col gap-1">
          <h3 className="text-white font-bold line-clamp-2 text-sm drop-shadow-md">{video.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-300">
             <span>{formatViews(video.views)} {t('video_views')}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-[#70d6ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="absolute top-2 left-2 z-20 bg-black/50 backdrop-blur-sm px-2 py-1 rounded inline-flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#70d6ff] fill-[#70d6ff]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('short_badge')}</span>
        </div>
      </Link>
    );
  }

  return (
    <div className={clsx("group flex block", isList ? "flex-row gap-3 w-full" : "video-card flex-col hover:border-[#70d6ff]/30 hover:shadow-[0_0_15px_rgba(112,214,255,0.05)] hover:bg-white/[0.01] transition-all duration-300")}>
      <Link to={targetUrl} className={clsx("shrink-0 video-thumb aspect-video block", isList ? "w-40 sm:w-48 rounded-xl overflow-hidden" : "w-full")}>
        <img 
          src={getOptimizedThumbnail(video.thumbnailUrl)} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 relative z-10 opacity-95"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.startsWith('data:')) {
              target.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='100%25' height='100%25' fill='%230f1115'/%3E%3Ctext x='50%25' y='50%25' fill='%2370d6ff' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='24'%3EIMG%3C/text%3E%3C/svg%3E`;
            }
          }}
        />
        <div className="absolute inset-0 bg-blue-900/10 z-20 pointer-events-none"></div>
        {isShortContentType ? (
          <div className="absolute top-2 left-2 z-30 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#70d6ff] fill-[#70d6ff]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('short_badge')}</span>
          </div>
        ) : (
          <div className="duration-badge z-30">
            {video.duration}
          </div>
        )}
      </Link>
      
      <div className={clsx("flex flex-col", isList ? "mt-0 pl-1 pr-4 sm:px-2 py-4 sm:py-1" : "p-3 sm:px-3 sm:py-3")}>
        <Link to={targetUrl} className={clsx("text-slate-100 font-semibold line-clamp-2 group-hover:text-[#70d6ff] transition-colors leading-snug", isList ? "text-sm sm:text-base" : "text-sm mb-2")}>
          {video.title}
        </Link>
        {!isList && (
          <div className="flex items-center gap-2 mb-1.5">
            <Link to={`/channel/${video.uploaderId}`} className="shrink-0">
              <img 
                src={video.channelAvatar} 
                alt={video.channelName} 
                className="w-5 h-5 rounded-full object-cover bg-slate-600 hover:ring-2 hover:ring-[#70d6ff] transition-all"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName || 'User')}&background=random`;
                }}
              />
            </Link>
            <div className="flex flex-col leading-tight min-w-0">
              <Link to={`/channel/${video.uploaderId}`} className="text-slate-400 text-xs hover:text-slate-200 transition-colors truncate flex items-center gap-1">
                <span className="truncate">{video.channelName}</span>
                {video.verified && (
                  <Check className="w-2.5 h-2.5 text-[#70d6ff] shrink-0" />
                )}
              </Link>
              {video.channelHandle && (
                <span className="text-[10px] text-slate-600 truncate">@{video.channelHandle}</span>
              )}
            </div>
          </div>
        )}
        <Link to={targetUrl} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400">
          <span>{formatViews(video.views)} {t('video_views')}</span>
          <span className="text-slate-600">•</span>
          <span>{video.uploadDate}</span>
        </Link>
      </div>
    </div>
  );
}
