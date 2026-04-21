import { Link } from "react-router-dom";
import { Video } from "../data";
import clsx from "clsx";

interface VideoCardProps {
  video: Video;
  layout?: "grid" | "list";
  key?: string | number;
}

export function VideoCard({ video, layout = "grid" }: VideoCardProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K";
    return views.toString();
  };

  const isList = layout === "list";

  return (
    <Link to={`/watch/${video.id}`} className={clsx("group flex block", isList ? "flex-row gap-3 w-full" : "video-card flex-col")}>
      <div className={clsx("shrink-0 video-thumb", isList ? "w-40 sm:w-48 rounded-xl overflow-hidden" : "w-full")}>
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 relative z-10 opacity-95"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-blue-900/10 z-20 pointer-events-none"></div>
        <div className="duration-badge z-30">
          {video.duration}
        </div>
      </div>
      
      <div className={clsx("flex gap-3 items-start", isList ? "mt-0 pl-1 pr-4 sm:px-2 py-4 sm:py-1" : "p-4 px-4 sm:px-0 sm:py-4")}>
        {!isList && (
          <div className="shrink-0">
            <img 
              src={video.channelAvatar} 
              alt={video.channelName} 
              className="w-9 h-9 rounded-full object-cover bg-slate-700"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <h3 className={clsx("text-slate-200 font-bold line-clamp-2 group-hover:text-[#70d6ff] transition-colors leading-tight mb-1", isList ? "text-sm sm:text-base" : "text-sm")}>
            {video.title}
          </h3>
          <div className="text-slate-500 text-xs sm:text-sm flex flex-col gap-0.5">
            <span className="group-hover:text-slate-300 transition-colors truncate">{video.channelName}</span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{video.uploadDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
