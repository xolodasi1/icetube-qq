import { mockVideos } from "../data";
import { VideoCard } from "../components/VideoCard";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tags = ["All", "Explore", "Gaming", "Music", "Tech", "Science", "Lifestyle", "Chill", "Programming", "ASMR"];
  
  const searchQuery = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All";

  const handleTagClick = (tag: string) => {
    if (tag === "All") {
      navigate("/");
    } else {
      navigate(`/?category=${tag}`);
    }
  };

  const filteredVideos = mockVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || video.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-0 pb-4 sm:pb-0">
      {/* Category Tags */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar px-4 sm:px-0 -mt-2">
        {tags.map((tag) => (
          <button 
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm transition-colors ${
              tag === activeCategory 
                ? "bg-blue-500 text-white font-medium shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                : "bg-white/5 border ice-border text-slate-300 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-2 sm:gap-y-8 gap-x-4 px-0 sm:px-0">
          {filteredVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
          {/* Duplicate some for a fuller page */}
          {filteredVideos.map(video => (
            <VideoCard key={video.id + "_copy"} video={{...video, id: video.id + "_copy"}} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-xl font-medium">No videos found</p>
          <p className="text-sm mt-2 text-slate-500">Try searching for something else or pick a different category.</p>
        </div>
      )}
    </div>
  );
}
