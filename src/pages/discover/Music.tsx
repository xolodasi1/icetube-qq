import { useState, useEffect, useMemo } from "react";
import { VideoCard } from "../../components/VideoCard";
import { Loader2, Music } from "lucide-react";
import { databases } from "../../lib/appwrite";
import { Query } from "appwrite";
import { useLanguage } from "../../language/LanguageContext";

export default function MusicPage() {
  const { language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setIsLoading(true);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        if (!dbId || !colId) return;
        const res = await databases.listDocuments(dbId, colId, [
          Query.equal("category", "Music"),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]);
        const formatted = res.documents.map((v: any) => ({
          id: v.$id,
          uploaderId: v.uploaderId,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          channelName: v.uploaderName || "Unknown",
          channelAvatar: v.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.uploaderName || "User")}`,
          views: v.views || 0,
          uploadDate: v.$createdAt,
          contentType: v.contentType || "video",
          verified: v.verified || false,
          category: v.category,
        }));
        setVideos(formatted);
      } catch (err) {
        console.error("Failed to fetch music videos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMusic();
  }, []);

  const filtered = useMemo(() => videos.filter((v) => v.contentType !== "shorts" && v.contentType !== "photo"), [videos]);

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#70d6ff]">
          <Music className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          {language === "ru" ? "Музыка" : "Music"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin mb-4" />
          <p className="text-slate-400">{language === "ru" ? "Загрузка..." : "Loading..."}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
          <Music className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center">
            {language === "ru" ? "Музыкальных видео пока нет." : "No music videos yet."}
          </p>
          <p className="text-sm mt-2 text-center">
            {language === "ru" ? "Загрузите видео с категорией «Музыка», и оно появится здесь." : "Upload a video with category “Music” and it will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
