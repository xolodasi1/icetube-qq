import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/AuthContext';
import { uploadVideoToCloudinary, uploadImageToCloudinaryWithProgress, getOptimizedThumbnail } from '../lib/cloudinary';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { UploadCloud, X, Loader2, AlertCircle, PlayCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { createNotification } from '../lib/notifications';
import clsx from 'clsx';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [game, setGame] = useState('');
  const [contentType, setContentType] = useState<'video' | 'shorts' | 'photo'>('video');
  const [isImage, setIsImage] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'All', label: language === 'ru' ? 'Все' : 'All' },
    { id: 'Music', label: language === 'ru' ? 'Музыка' : 'Music' },
    { id: 'Gaming', label: language === 'ru' ? 'Игры' : 'Gaming' },
    { id: 'Live', label: language === 'ru' ? 'Стримы' : 'Live' },
    { id: 'Tech', label: language === 'ru' ? 'Технологии' : 'Tech' },
    { id: 'Nature', label: language === 'ru' ? 'Природа' : 'Nature' }
  ];

  const commonGames = [
    'Minecraft', 'Roblox', 'Fortnite', 'GTA V', 'CS:GO', 'Valorant', 'League of Legends'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const isImageFile = selectedFile.type.startsWith('image/');
      const maxSize = isImageFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError(isImageFile
          ? (language === 'ru' ? 'Фото слишком большое (макс. 50МБ)' : 'Photo too large (max 50MB)')
          : (language === 'ru' ? 'Файл слишком большой (макс. 10ГБ)' : 'File too large (max 10GB)'));
        return;
      }
      setFile(selectedFile);
      setIsImage(isImageFile);
      if (isImageFile) setContentType('photo');
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !user) return;
    
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const fileUrl = isImage
        ? await uploadImageToCloudinaryWithProgress(file, (p) => setProgress(p))
        : await uploadVideoToCloudinary(file, (p) => setProgress(p));
      const thumbnailUrl = isImage ? fileUrl : (getOptimizedThumbnail(fileUrl) || fileUrl.replace(/\.[^/.]+$/, ".jpg"));

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      
      if (!dbId || !videosColId) {
        throw new Error(language === 'ru' ? "Отсутствует ID коллекции Videos в настройках!" : "Missing 'Videos' collection ID in Environment Variables!");
      }

      let createdVideoDoc: any = null;
      const isPhoto = contentType === 'photo';
      const isShorts = !isPhoto && (contentType === 'shorts' || title.toLowerCase().includes('#shorts') || description.toLowerCase().includes('#shorts'));
      
      const finalContentType = isPhoto ? 'photo' : (isShorts ? 'shorts' : 'video');
      
      const uploadData: any = {
        title: title,
        description: isPhoto ? (description || '') : (isShorts ? (description.toLowerCase().includes('#shorts') ? description : `${description}\n\n#shorts`).trim() : (description || t('video_no_description'))),
        videoUrl: fileUrl,
        thumbnailUrl: thumbnailUrl,
        uploaderId: user.$id,
        uploaderName: user.name || 'Anonymous',
        uploaderAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`,
        views: 0,
        category: category.trim() || 'All',
        contentType: finalContentType,
        game: isPhoto ? undefined : (game.trim() || undefined),
        verified: false
      };

      try {
        createdVideoDoc = await databases.createDocument(
      dbId, 
      videosColId, 
      ID.unique(), 
      uploadData
    );
  } catch (firstErr: any) {
    if (firstErr.code === 400 && firstErr.message?.toLowerCase().includes('unknown attribute')) {
      const fallbackData: any = {
        title: uploadData.title,
        description: uploadData.description,
        videoUrl: uploadData.videoUrl,
        thumbnailUrl: uploadData.thumbnailUrl,
        uploaderId: uploadData.uploaderId,
        uploaderName: uploadData.uploaderName,
        uploaderAvatar: uploadData.uploaderAvatar,
        views: uploadData.views,
        contentType: uploadData.contentType,
        verified: false
      };
      if (uploadData.category) fallbackData.category = uploadData.category;
      if (uploadData.game) fallbackData.game = uploadData.game;
      try {
        createdVideoDoc = await databases.createDocument(dbId, videosColId, ID.unique(), fallbackData);
      } catch (secondErr: any) {
        if (secondErr.code === 400 && secondErr.message?.toLowerCase().includes('unknown attribute')) {
          const minimalData: any = {
            title: uploadData.title,
            description: uploadData.description,
            videoUrl: uploadData.videoUrl,
            thumbnailUrl: uploadData.thumbnailUrl,
            uploaderId: uploadData.uploaderId,
            uploaderName: uploadData.uploaderName,
            uploaderAvatar: uploadData.uploaderAvatar,
            views: uploadData.views,
            verified: false
          };
          if (uploadData.contentType) minimalData.contentType = uploadData.contentType;
          createdVideoDoc = await databases.createDocument(dbId, videosColId, ID.unique(), minimalData);
        } else {
          throw secondErr;
        }
      }
    } else {
      throw firstErr;
    }
  }

      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('');
      setGame('');
      onUploadSuccess?.();
      onClose();

      // Increment videosCount in profile (don't block the UI)
      const updateStats = async () => {
        try {
          const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
          if (profilesCol) {
            // Try to fetch by document ID first (the new standard)
            try {
              const doc = await databases.getDocument(dbId, profilesCol, user.$id);
              if (doc) {
                await databases.updateDocument(dbId, profilesCol, user.$id, {
                  videosCount: (doc.videosCount || 0) + 1
                });
                return;
              }
            } catch (e) {
              // Continue to list if not found
            }

            const profileRes = await databases.listDocuments(dbId, profilesCol, [Query.equal('userId', user.$id)]);
            if (profileRes.documents.length > 0) {
              const profileDoc = profileRes.documents[0];
              await databases.updateDocument(dbId, profilesCol, profileDoc.$id, {
                videosCount: (profileDoc.videosCount || 0) + 1
              });
            }
          }
        } catch (err) {
          console.error("Failed to update videosCount:", err);
        }

        // Fan out notifications to subscribers
        try {
          const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
          if (subsColId) {
            const subsRes = await databases.listDocuments(dbId, subsColId, [
              Query.equal('channelId', user.$id),
              Query.limit(100) // Optimization: limit to 100 for now to prevent long loops
            ]);
            
            // Run notifications in parallel for speed
            await Promise.all(subsRes.documents.map(sub => 
              createNotification({
                userId: sub.subscriberId,
                actorId: user.$id,
                actorName: user.name || 'Anonymous',
                actorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`,
                type: 'upload',
                videoId: createdVideoDoc?.$id || '',
                videoTitle: title.trim() || 'Untitled Video',
                contentType: finalContentType
              }).catch(e => console.error("Notification failed for", sub.subscriberId, e))
            ));
          }
        } catch (err) {
          console.error("Failed to fan out notifications:", err);
        }
      };

      // Fire and forget
      updateStats();

    } catch (err: any) {
      console.error('UPLOAD ERROR:', err);
      let msg = err.message || (language === 'ru' ? 'Что-то пошло не так при загрузке' : 'Something went wrong during upload');
      
      if (err.code === 404) {
        msg = language === 'ru' ? "Коллекция не найдена. Проверьте VITE_APPWRITE_VIDEOS_COLLECTION_ID." : "Collection not found. Check your environment variables.";
      } else if (err.code === 401) {
        msg = language === 'ru' ? "Доступ запрещен. Проверьте права коллекции в Appwrite." : "Permission denied. Check collection settings in Appwrite.";
      } else if (err.message?.includes('Network error') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        msg = language === 'ru' ? "Ошибка сети. Проверьте подключение к серверу (возможно нужен VPN)." : "Network error. Check your server connection (VPN may be required).";
      }

      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold font-display text-white">
            {isImage
              ? (language === 'ru' ? 'Загрузка фото' : 'Upload Photo')
              : (contentType === 'photo' ? (language === 'ru' ? 'Загрузка фото' : 'Upload Photo') : (language === 'ru' ? 'Загрузка видео' : 'Upload Video'))}
          </h2>
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
              <p className="text-slate-200 font-medium text-center">
                {contentType === 'photo'
                  ? (language === 'ru' ? 'Нажмите для выбора фото' : 'Click to select photo')
                  : (language === 'ru' ? 'Нажмите для выбора видео' : 'Click to select video')}
              </p>
              <p className="text-slate-500 text-sm mt-2 text-center">
                {contentType === 'photo'
                  ? (language === 'ru' ? 'PNG, JPG, WebP до 50МБ' : 'PNG, JPG, WebP up to 50MB')
                  : (language === 'ru' ? 'MP4, WebM до 10ГБ' : 'MP4, WebM up to 10GB')}
              </p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept={contentType === 'photo' ? "image/*" : "video/*,image/*"} 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="w-12 h-12 bg-[#70d6ff]/20 rounded-lg flex items-center justify-center shrink-0">
                {isImage ? <UploadCloud className="w-6 h-6 text-[#70d6ff]" /> : <PlayCircle className="w-6 h-6 text-[#70d6ff]" />}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">{t('upload_type')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setContentType('video'); if (isImage) { setIsImage(false); } }}
                  className={clsx(
                    "px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors",
                    contentType === 'video' && !isImage ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                  )}
                >
                  {t('upload_video')}
                </button>
                <button
                  type="button"
                  onClick={() => { setContentType('shorts'); if (isImage) { setIsImage(false); } }}
                  className={clsx(
                    "px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors",
                    contentType === 'shorts' && !isImage ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                  )}
                >
                  {t('upload_shorts')}
                </button>
                <button
                  type="button"
                  onClick={() => { setContentType('photo'); if (file && !file.type.startsWith('image/')) { setFile(null); } setIsImage(true); }}
                  className={clsx(
                    "px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors",
                    contentType === 'photo' || isImage ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                  )}
                >
                  {language === 'ru' ? 'Фото' : 'Photo'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">{language === 'ru' ? 'Заголовок' : 'Title'}</label>
              <input 
                required
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'ru' ? 'Название ролика...' : "Give your video a catchy title..."}
                disabled={isUploading}
                className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#70d6ff]/50 w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">{language === 'ru' ? 'Категория' : 'Category'}</label>
              <div className="relative">
                <input 
                  list="category-suggestions"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isUploading}
                  placeholder={language === 'ru' ? 'Введите или выберите категорию...' : 'Enter or select category...'}
                  className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#70d6ff]/50 w-full"
                />
                <datalist id="category-suggestions">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.label} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">{language === 'ru' ? 'Игра (Опционально)' : 'Game (Optional)'}</label>
              <div className="relative">
                <input 
                  list="game-suggestions"
                  type="text"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  disabled={isUploading}
                  placeholder={language === 'ru' ? 'Название игры...' : 'Enter or select game...'}
                  className="bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#70d6ff]/50 w-full"
                />
                <datalist id="game-suggestions">
                  {commonGames.map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-200">{language === 'ru' ? 'Описание' : 'Description'}</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ru' ? 'О чем это видео?' : "Tell viewers about your video..."}
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
                <span className="text-[#70d6ff]">{language === 'ru' ? 'Загрузка в облако...' : 'Uploading to Cloudinary...'}</span>
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
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button 
              type="submit"
              disabled={!file || !title || isUploading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#70d6ff] text-black hover:bg-[#5bc0e6] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {language === 'ru' ? 'Выполняется...' : 'Uploading...'}
                </>
              ) : isImage || contentType === 'photo'
                ? (language === 'ru' ? 'Опубликовать фото' : 'Publish Photo')
                : (language === 'ru' ? 'Опубликовать' : 'Publish Video')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
