import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { SafeStorage } from '../lib/storage';
import { Query } from 'appwrite';
import { Image, Loader2, X, ChevronLeft, ChevronRight, Heart, Eye, Calendar, User, Plus, Download } from 'lucide-react';

const ALBUMS_STORAGE_KEY = 'user_photo_albums';

export default function Photos() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [albumDropdownPhotoId, setAlbumDropdownPhotoId] = useState<string | null>(null);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPhotos();
    try {
      const saved = SafeStorage.get(ALBUMS_STORAGE_KEY, []);
      setAlbums(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAlbumDropdownPhotoId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (!dbId || !colId) return;

      const response = await databases.listDocuments(dbId, colId, [
        Query.equal('contentType', 'photo'),
        Query.limit(100)
      ]);

      setPhotos(response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title || 'Untitled',
        imageUrl: doc.videoUrl || doc.thumbnailUrl || '',
        description: doc.description || '',
        uploaderId: doc.uploaderId,
        uploaderName: doc.uploaderName || 'Anonymous',
        uploaderAvatar: doc.uploaderAvatar || '',
        views: doc.views || 0,
        createdAt: doc.$createdAt,
        category: doc.category || ''
      })));
    } catch (err) {
      console.error("Failed to fetch photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setSelectedPhoto(photos[index]);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
    setSelectedIndex(-1);
  };

  const addToAlbum = (albumId: string, photo: any) => {
    try {
      const saved = SafeStorage.get<any[]>(ALBUMS_STORAGE_KEY, []);
      const updated = saved.map(a => {
        if (a.id === albumId) {
          const exists = a.photos.some((p: any) => p.id === photo.id);
          if (exists) return a;
          return { ...a, photos: [...a.photos, photo] };
        }
        return a;
      });
      SafeStorage.set(ALBUMS_STORAGE_KEY, updated);
      setAlbums(updated);
      setAlbumDropdownPhotoId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPhoto = () => {
    if (!selectedPhoto) return;
    setIsDownloadingPhoto(true);
    const url = selectedPhoto.imageUrl;
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${selectedPhoto.title}.${ext}`;

    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => {
        console.error("Download failed:", err);
      })
      .finally(() => {
        setIsDownloadingPhoto(false);
      });
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300 max-w-7xl mx-auto px-4 py-8">
        <div className="skeleton-shimmer h-10 w-48 rounded-xl mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="skeleton-shimmer aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <Image className="w-8 h-8 text-[#70d6ff]" />
            {t('photos_title')}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{t('nav_photos')}</p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
          <span className="text-slate-400">{photos.length}</span>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Image className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">{t('photos_empty')}</p>
          <p className="text-slate-500 text-sm mt-2">{t('photos_upload_first')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5 cursor-pointer hover:border-[#70d6ff]/30 hover:shadow-[0_0_20px_rgba(112,214,255,0.1)] transition-all duration-300"
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-bold truncate">{photo.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-300 mt-1">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {photo.views}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setAlbumDropdownPhotoId(albumDropdownPhotoId === photo.id ? null : photo.id); }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#70d6ff] hover:text-[#05070a] backdrop-blur-md border border-white/10 z-10"
                title={t('photo_albums_add_to')}
              >
                <Plus className="w-4 h-4" />
              </button>
              {albumDropdownPhotoId === photo.id && (
                <div ref={dropdownRef} className="absolute top-12 right-2 z-20 bg-[#0a192f] border ice-border rounded-xl shadow-xl w-48 max-h-48 overflow-y-auto custom-scrollbar py-1" onClick={(e) => e.stopPropagation()}>
                  {albums.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">{language === 'ru' ? 'Нет альбомов' : 'No albums'}</div>
                  ) : (
                    albums.map(a => (
                      <button
                        key={a.id}
                        onClick={() => addToAlbum(a.id, photo)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{a.name}</span>
                        <span className="text-xs text-slate-500 shrink-0 ml-2">{a.photos.length}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(); }} disabled={isDownloadingPhoto} className="absolute top-4 right-16 z-10 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all" title={language === 'ru' ? 'Скачать' : 'Download'}>
            {isDownloadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
          </button>
          <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>

          {selectedIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div className="flex flex-col items-center max-w-4xl w-full px-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-h-[75vh] flex items-center justify-center">
              <img src={selectedPhoto.imageUrl} alt={selectedPhoto.title} className="max-w-full max-h-[75vh] object-contain rounded-2xl" referrerPolicy="no-referrer" />
            </div>
            <div className="mt-4 text-center max-w-lg">
              <h3 className="text-xl font-bold text-white">{selectedPhoto.title}</h3>
              {selectedPhoto.description && <p className="text-slate-400 text-sm mt-2">{selectedPhoto.description}</p>}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-3">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {selectedPhoto.views}</span>
                <Link to={`/channel/${selectedPhoto.uploaderId}`} className="flex items-center gap-1 hover:text-[#70d6ff] transition-colors">
                  <User className="w-3.5 h-3.5" /> {selectedPhoto.uploaderName}
                </Link>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(selectedPhoto.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}