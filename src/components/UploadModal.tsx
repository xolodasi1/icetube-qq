import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/AuthContext';
import { uploadVideoToCloudinary } from '../lib/cloudinary';
import { databases } from '../lib/appwrite';
import { ID } from 'appwrite';
import { UploadCloud, X, Loader2, AlertCircle, PlayCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    // ... existing logic ...
    e.preventDefault();
    if (!file || !title || !user) return;
    
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const videoUrl = await uploadVideoToCloudinary(file, (p) => setProgress(p));
      const thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, ".jpg");

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      
      if (!dbId || !videosColId) {
        throw new Error("Missing 'Videos' collection ID in Environment Variables!");
      }

      await databases.createDocument(
        dbId, 
        videosColId, 
        ID.unique(), 
        {
          title: title,
          description: description || 'No description provided.',
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          uploaderId: user.$id,
          uploaderName: user.name || 'Anonymous',
          uploaderAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`,
          views: 0
        }
      );

      setFile(null);
      setTitle('');
      setDescription('');
      onUploadSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Upload flow error:', err);
      setError(err.message || 'Something went wrong during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold font-display text-white">Upload Video</h2>
          <button 
            onClick={onClose} 
            disabled={isUploading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 flex flex-col gap-6">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-[#70d6ff]/50 bg-white/5 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <UploadCloud className="w-12 h-12 text-[#70d6ff] mb-4" />
              <p className="text-slate-200 font-medium text-center">Click to select video</p>
              <p className="text-slate-500 text-sm mt-2 text-center">MP4, WebM, or OGG up to 100MB</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="w-12 h-12 bg-[#70d6ff]/20 rounded-lg flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6 text-[#70d6ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button 
                type="button"
                onClick={() => setFile(null)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-200">Title</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a catchy title..."
              disabled={isUploading}
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#70d6ff]/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-200">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={3}
              disabled={isUploading}
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#70d6ff]/50 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isUploading && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#70d6ff]">Uploading to Cloudinary...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#70d6ff] to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!file || !title || isUploading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#70d6ff] text-black hover:bg-[#5bc0e6] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : 'Publish Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
