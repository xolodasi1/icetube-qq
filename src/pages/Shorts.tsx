import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

export default function Shorts() {
  const [videos, setVideos] = useState<any[]>([]);
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const fetchShorts = async () => {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (!dbId || !colId) return;

      try {
        const res = await databases.listDocuments(dbId, colId, [
           // Note: You would actually want a specific tag or duration filter for true shorts
           // For out of box demo, we just fetch random videos
        ]);
        setVideos(res.documents.reverse()); // Just show recent ones
      } catch (e) {
        console.error(e);
      }
    };
    fetchShorts();
  }, []);

  if (videos.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
         <p className="text-slate-400">Loading Shorts...</p>
      </div>
    );
  }

  const current = videos[currentVideoIndex];
  const uploaderAvatar = current.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.uploaderName)}`;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] px-4 sm:px-0 bg-black pt-4 sm:pt-6">
      
      {/* Video Container */}
      <div className="relative w-full max-w-[400px] aspect-[9/16] bg-slate-900 sm:rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 snap-center snap-always border border-white/10 group">
        
        {/* The short video */}
        <video 
          src={current.videoUrl} 
          loop 
          autoPlay 
          muted={false}
          className="w-full h-full object-cover"
        />

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10 flex justify-between">
           <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">Shorts</span>
        </div>

        {/* Bottom Overlay & Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-3 z-10">
          <div className="flex items-center gap-2">
            <Link to={`/channel/${current.uploaderId}`}>
              <img src={uploaderAvatar} alt={current.uploaderName} className="w-8 h-8 rounded-full border border-white/20" />
            </Link>
            <Link to={`/channel/${current.uploaderId}`} className="text-white font-bold text-sm tracking-tight">{current.uploaderName}</Link>
            <button className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold ml-1 hover:bg-slate-200 transition-colors">
              Подписаться
            </button>
          </div>
          <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
            {current.title}
          </p>
        </div>

        {/* Right Sidebar Interaction Buttons */}
        <div className="absolute right-2 sm:-right-16 bottom-20 flex flex-col items-center gap-6 z-20">
            <button className="flex flex-col items-center gap-1 group/btn min-w-[50px]">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ThumbsUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-xs drop-shadow-md">18 тыс.</span>
            </button>

            <button className="flex flex-col items-center gap-1 group/btn min-w-[50px]">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ThumbsDown className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-[10px] drop-shadow-md">Не...</span>
            </button>

            <button className="flex flex-col items-center gap-1 group/btn min-w-[50px]">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-xs drop-shadow-md">1 092</span>
            </button>

            <button className="flex flex-col items-center gap-1 group/btn min-w-[50px]">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-[10px] drop-shadow-md">Поделит...</span>
            </button>

            <button className="w-10 h-10 rounded-md overflow-hidden border-2 border-white/20 mt-2">
                <img src={uploaderAvatar} alt="audio" className="w-full h-full object-cover" />
            </button>
        </div>

      </div>

      <div className="mt-4 flex gap-4 text-white/50 pb-10">
         <button 
           onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
           disabled={currentVideoIndex === 0}
           className="px-4 py-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
         >
           Previous
         </button>
         <button 
           onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
           disabled={currentVideoIndex === videos.length - 1}
           className="px-4 py-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
         >
           Next
         </button>
      </div>

    </div>
  );
}
