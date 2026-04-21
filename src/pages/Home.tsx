import { mockVideos } from "../data";
import { VideoCard } from "../components/VideoCard";

export default function Home() {
  const tags = ["All", "Gaming", "Music", "Live", "Mixes", "Chill", "Programming", "Snowboards", "Ice Skating", "ASMR"];

  return (
    <div className="flex flex-col gap-6">
      {/* Category Tags */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar -mt-2">
        {tags.map((tag, i) => (
          <button 
            key={tag}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-colors ${
              i === 0 
                ? "bg-blue-500 text-white font-medium" 
                : "bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {mockVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
        {/* Duplicate some for a fuller page */}
        {mockVideos.map(video => (
          <VideoCard key={video.id + "_copy"} video={{...video, id: video.id + "_copy"}} />
        ))}
      </div>
    </div>
  );
}
