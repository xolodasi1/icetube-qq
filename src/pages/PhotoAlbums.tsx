import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { SafeStorage } from '../lib/storage';
import { Trash2, Image, Plus, Eye } from 'lucide-react';

const STORAGE_KEY = 'user_photo_albums';

interface AlbumPhoto {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  views: number;
  createdAt: string;
  category: string;
}

interface Album {
  id: string;
  name: string;
  photos: AlbumPhoto[];
}

export default function PhotoAlbums() {
  const { t, language } = useLanguage();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  useEffect(() => {
    loadAlbums();
  }, []);

  const getAlbumsColId = () => import.meta.env.VITE_APPWRITE_ALBUMS_COLLECTION_ID;

  const loadAlbums = () => {
    try {
      const colId = getAlbumsColId();
      if (colId) {
        // For now fallback to localStorage even if env var is set,
        // since we still need a proper Appwrite schema.
        // This matches Playlists pattern.
      }
      const saved = SafeStorage.get<Album[]>(STORAGE_KEY, []);
      setAlbums(saved);
    } catch (e) {
      console.error(e);
    }
  };

  const saveAlbums = (updatedAlbums: Album[]) => {
    try {
      SafeStorage.set(STORAGE_KEY, updatedAlbums);
      setAlbums(updatedAlbums);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAlbum = () => {
    const name = newAlbumName.trim();
    if (!name) return;
    const newAlbum: Album = {
      id: Date.now().toString(),
      name,
      photos: []
    };
    saveAlbums([...albums, newAlbum]);
    setNewAlbumName('');
    setShowCreateModal(false);
  };

  const handleDeleteAlbum = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить этот альбом?' : 'Are you sure you want to delete this album?')) return;
    const updated = albums.filter(a => a.id !== id);
    saveAlbums(updated);
    if (activeAlbum?.id === id) setActiveAlbum(null);
  };

  const handleRemoveFromAlbum = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAlbum) return;
    const newPhotos = activeAlbum.photos.filter(p => p.id !== photoId);
    const updatedAlbum = { ...activeAlbum, photos: newPhotos };
    const updatedAlbums = albums.map(a => a.id === activeAlbum.id ? updatedAlbum : a);
    saveAlbums(updatedAlbums);
    setActiveAlbum(updatedAlbum);
  };

  return (
    <div className="flex-1 w-full max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative mt-16 sm:mt-0 flex flex-col lg:flex-row gap-6">

      {/* Sidebar - Album List */}
      <div className="w-full lg:w-80 border ice-border rounded-2xl bg-[#0a192f] overflow-hidden flex flex-col shrink-0 lg:h-[calc(100vh-120px)] lg:sticky top-24">
        <div className="p-4 border-b ice-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-display">
            {t('photo_albums_title')}
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-full bg-[#70d6ff] text-[#05070a] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
          {albums.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              {language === 'ru' ? 'Альбомов пока нет.' : 'No albums yet.'}
            </div>
          ) : (
            albums.map(a => (
              <div
                key={a.id}
                onClick={() => setActiveAlbum(a)}
                className={`flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-colors ${activeAlbum?.id === a.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-200 line-clamp-1">{a.name}</h3>
                  <button onClick={(e) => handleDeleteAlbum(a.id, e)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  {a.photos.length} {language === 'ru' ? 'фото' : 'photos'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Photos in Active Album */}
      <div className="flex-1 min-w-0">
        {!activeAlbum ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-32 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
            <Image className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Выберите альбом' : 'Select an album'}</h3>
            <p className="text-sm">{t('photo_albums_select')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-end justify-between border-b ice-border pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">
                  {activeAlbum.name}
                </h1>
                <p className="text-sm text-slate-400">{activeAlbum.photos.length} {language === 'ru' ? 'фото' : 'photos'}</p>
              </div>
            </div>

            {activeAlbum.photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 py-20 px-4 rounded-2xl border border-dashed border-white/10 ice-panel">
                <Image className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-sm">{t('photo_albums_no_photos')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {activeAlbum.photos.map(photo => (
                  <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
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
                      onClick={(e) => handleRemoveFromAlbum(photo.id, e)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-md border border-white/10 z-10"
                      title={language === 'ru' ? 'Удалить из альбома' : 'Remove from album'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#0a192f] border ice-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">{t('photo_albums_create')}</h3>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder={t('photo_albums_name')}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAlbum(); }}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateAlbum}
                className="px-5 py-2.5 rounded-xl bg-[#70d6ff] text-[#05070a] font-bold hover:opacity-90 transition-opacity"
              >
                {t('photo_albums_create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
