import { useParams } from "react-router-dom";
import { mockVideos } from "../data";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, MessageSquare } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import React, { useState } from "react";

export default function Watch() {
  const { id } = useParams();
  // Strip _copy if it exists for finding the base video
  const baseId = id?.replace("_copy", "");
  const video = mockVideos.find(v => v.id === baseId) || mockVideos[0];

  const suggestedVideos = mockVideos.filter(v => v.id !== baseId);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeState, setLikeState] = useState<'none' | 'liked' | 'disliked'>('none');
  const [likesCount, setLikesCount] = useState(24000);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1, author: "FrostByte22", ts: "2 hours ago", text: "The editing in this video is absolutely chilling... I love it! The icy aesthetic really suits the channel.", likes: 142
    },
    {
      id: 2, author: "IceExplorer", ts: "1 day ago", text: "Icetube 2.0 is looking very sleek. Glad we have a true dark mode platform now.", likes: 89
    }
  ]);

  const formatViews = (views: number) => {
    return new Intl.NumberFormat('en-US').format(views);
  };

  const handleLike = () => {
    if (likeState === 'liked') {
      setLikeState('none');
      setLikesCount(prev => prev - 1);
    } else {
      setLikeState('liked');
      setLikesCount(prev => likeState === 'disliked' ? prev + 1 : prev + 1); // Mock increment
    }
  };

  const handleDislike = () => {
    if (likeState === 'disliked') {
      setLikeState('none');
    } else {
      if (likeState === 'liked') setLikesCount(prev => prev - 1);
      setLikeState('disliked');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setComments([
      { id: Date.now(), author: "You", ts: "Just now", text: newComment, likes: 0 },
      ...comments
    ]);
    setNewComment("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      {/* Primary Video Section */}
      <div className="flex-1 lg:w-[70%]">
        {/* Video Player Placeholder / HTML5 Player */}
        <div className="w-full aspect-video bg-black sm:rounded-xl overflow-hidden sm:border ice-border sm:shadow-2xl relative">
          <video 
            autoPlay 
            controls 
            className="w-full h-full object-contain"
            poster={video.thumbnailUrl}
            src={video.videoUrl} 
          />
        </div>

        {/* Video Info */}
        <div className="mt-4 flex flex-col gap-3 px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white">{video.title}</h1>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            {/* Channel Info */}
            <div className="flex items-center gap-4">
              <img src={video.channelAvatar} alt={video.channelName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-cold-border" />
              <div className="flex flex-col">
                <span className="font-medium text-slate-100">{video.channelName}</span>
                <span className="text-xs text-slate-400">1.2M subscribers</span>
              </div>
              <button 
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`ml-2 font-medium px-4 py-2 rounded-full transition-colors text-sm ${isSubscribed ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-slate-100 text-cold-bg hover:bg-slate-300'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <div className="flex items-center bg-white/5 border ice-border rounded-full overflow-hidden shrink-0 cursor-pointer text-slate-300">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors border-r ice-border text-sm ${likeState === 'liked' ? 'text-[#70d6ff]' : ''}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likeState === 'liked' ? 'fill-current' : ''}`} />
                  <span>{(likesCount / 1000).toFixed(1)}K</span>
                </button>
                <button 
                  onClick={handleDislike}
                  className={`px-4 py-2 hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] transition-colors text-sm ${likeState === 'disliked' ? 'text-[#70d6ff]' : ''}`}
                >
                  <ThumbsDown className={`w-4 h-4 ${likeState === 'disliked' ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <button className="flex items-center gap-2 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 px-4 py-2 rounded-full transition-colors text-sm shrink-0">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              <button className="flex items-center gap-2 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 px-4 py-2 rounded-full transition-colors text-sm shrink-0">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button className="flex items-center justify-center w-9 h-9 bg-white/5 border ice-border hover:bg-[rgba(112,214,255,0.08)] hover:text-[#70d6ff] text-slate-300 rounded-full transition-colors shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="mt-4 bg-white/5 border ice-border p-4 rounded-xl text-sm mx-4 sm:mx-0">
          <div className="font-medium text-slate-200 mb-2">
            {formatViews(video.views)} views • {video.uploadDate}
          </div>
          <p className="text-slate-300 whitespace-pre-wrap">{video.description}</p>
        </div>

        {/* Comments Section */}
        <div className="mt-8 mb-10 px-4 sm:px-0">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b-2 border-ice-500 pb-1 inline-flex">
              <MessageSquare className="w-5 h-5 text-ice-400" />
              {1248 + comments.length} Comments
            </h2>
          </div>
          
          <form onSubmit={handleAddComment} className="flex gap-4">
            <img src="https://picsum.photos/seed/useravatar/100/100" className="w-10 h-10 rounded-full bg-cold-surface shrink-0" alt="You" />
            <div className="flex-1">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (Press Enter to post)" 
                className="w-full bg-transparent border-b ice-border focus:border-[#70d6ff]/50 transition-colors pb-1 outline-none text-sm placeholder:text-slate-500"
              />
            </div>
          </form>

          <div className="mt-8 flex flex-col gap-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <img src={`https://picsum.photos/seed/${comment.author}/100/100`} className="w-10 h-10 rounded-full shrink-0 object-cover" alt={comment.author} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-medium text-slate-200">@{comment.author}</span>
                    <span className="text-slate-500">{comment.ts}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{comment.text}</p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors"><ThumbsUp className="w-4 h-4" /> {comment.likes > 0 && comment.likes}</button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors"><ThumbsDown className="w-4 h-4" /></button>
                    <button className="text-xs font-medium hover:text-white transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Videos Sidebar */}
      <div className="lg:w-[30%] flex flex-col gap-4">
        {suggestedVideos.map(vid => (
          <VideoCard key={vid.id} video={vid} layout="list" />
        ))}
      </div>
    </div>
  );
}
