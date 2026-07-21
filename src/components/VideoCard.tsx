import { Link } from "react-router-dom";
import { Video } from "../data";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";
import { Check, Zap, MoreVertical } from "lucide-react";
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
    <div className={clsx("group", isList ? "flex flex-row gap-3 w-full" : "video-card flex-col")}>
      <Link to={targetUrl} className={clsx("shrink-0 video-thumb aspect-video block relative", isList ? "w-40 sm:w-48 rounded-xl overflow-hidden" : "w-full")}>
        <img 
          src={getOptimizedThumbnail(video.thumbnailUrl)} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.startsWith('data:')) {
              target.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='100%25' height='100%25' fill='%230f1115'/%3E%3Ctext x='50%25' y='50%25' fill='%2370d6ff' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='24'%3EIMG%3C/text%3E%3C/svg%3E`;
            }
          }}
        />
        {isShortContentType ? (
          <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#70d6ff] fill-[#70d6ff]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('short_badge')}</span>
          </div>
        ) : video.duration ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/90 px-1.5 py-0.5 rounded text-[11px] font-medium text-white leading-none">
            {video.duration}
          </div>
        ) : null}
      </Link>

      {!hideDetails && (
        <div className={clsx(isList ? "flex-1 flex flex-col justify-center py-1" : "p-2.5")}>
          {isList ? (
            <>
              <Link to={targetUrl} className="text-slate-100 font-semibold text-sm line-clamp-2 group-hover:text-[#70d6ff] transition-colors leading-snug mb-1">
                {video.title}
              </Link>
              <Link to={`/channel/${video.uploaderId}`} className="text-slate-400 text-xs hover:text-slate-200 transition-colors truncate mb-0.5">
                {video.channelName}
              </Link>
              <Link to={targetUrl} className="text-slate-500 text-xs flex items-center gap-1">
                <span>{formatViews(video.views)} {t('video_views')}</span>
                <span className="text-slate-600">•</span>
                <span>{video.uploadDate}</span>
              </Link>
            </>
          ) : (
            <div className="flex gap-2.5">
              <Link to={`/channel/${video.uploaderId}`} className="shrink-0 mt-0.5">
                <img 
                  src={video.channelAvatar} 
                  alt={video.channelName} 
                  className="w-9 h-9 rounded-full object-cover bg-slate-600"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName || 'User')}&background=random`;
                  }}
                />
              </Link>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <Link to={targetUrl} className="text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-[#70d6ff] transition-colors leading-snug">
                    {video.title}
                  </Link>
                  <button className="text-slate-500 hover:text-white shrink-0 p-0.5 -mr-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <Link to={`/channel/${video.uploaderId}`} className="text-slate-400 text-xs hover:text-slate-200 transition-colors truncate mt-0.5">
                  {video.channelName}
                  {video.verified && (
                    <Check className="w-2.5 h-2.5 text-[#70d6ff] inline ml-1 -mt-0.5" />
                  )}
                </Link>
                <Link to={targetUrl} className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <span>{formatViews(video.views)} {t('video_views')}</span>
                  <span className="text-slate-600">•</span>
                  <span>{video.uploadDate}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
