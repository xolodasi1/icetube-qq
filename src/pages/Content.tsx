import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, Film, Edit2, Trash2, AlertCircle, Search, Eye, Calendar, Clock, TrendingUp, Video, Scissors, CheckCircle2, X } from 'lucide-react';
import { Query, ID } from 'appwrite';
import { getOptimizedThumbnail } from '../lib/cloudinary';

export default function Content() {
  const { user, login } = useAuth();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'videos' | 'shorts'>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'new' | 'old' | 'views' | 'likes'>('new');

  const fetchVideos = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (!dbId || !colId) return;

      const response = await databases.listDocuments(dbId, colId, [
        Query.equal('uploaderId', user.$id)
      ]);

      const userVids = response.documents.map(v => ({
        id: v.$id,
        title: v.title,
        description: v.description || '',
        thumbnailUrl: v.thumbnailUrl,
        views: v.views || 0,
        likes: v.likes || v.likesCount || 0,
        contentType: v.contentType || 'video',
        category: v.category || '',
        game: v.game || '',
        verified: v.verified || false,
        uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
        createdAt: v.$createdAt,
        status: 'Published'
      }));

      setVideos(userVids.reverse());
    } catch (err) {
      console.error("Content fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user, language]);

  const regularVideos = useMemo(() => videos.filter(v => v.contentType !== 'shorts'), [videos]);
  const shortsVideos = useMemo(() => videos.filter(v => v.contentType === 'shorts'), [videos]);

  const filteredVideos = useMemo(() => {
    const source = tab === 'videos' ? regularVideos : shortsVideos;
    let result = searchQuery
      ? source.filter(v => v.title?.toLowerCase().includes(searchQuery.toLowerCase()))
      : [...source];
    if (sortBy === 'new') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === 'old') result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === 'views') result.sort((a, b) => b.views - a.views);
    else if (sortBy === 'likes') result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return result;
  }, [tab, regularVideos, shortsVideos, searchQuery, sortBy]);

  const handleDelete = async (videoId: string) => {
    if (!window.confirm(language === 'ru' ? 'Удалить навсегда?' : 'Delete permanently?')) return;
    setIsDeleting(videoId);
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (dbId && colId) {
      try {
        await databases.deleteDocument(dbId, colId, videoId);
        setVideos(prev => prev.filter(v => v.id !== videoId));
      } catch (err) {
        console.error("Delete failed:", err);
        alert('Failed to delete');
      }
    }
    setIsDeleting(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !colId) return;
    try {
      let isShorts = editingVideo.contentType === 'shorts' || editingVideo.title?.toLowerCase().includes('#shorts') || (editingVideo.description || '').toLowerCase().includes('#shorts');
      const desc = editingVideo.description || '';
      let updateData = {
        title: editingVideo.title,
        description: isShorts ? (desc.toLowerCase().includes('#shorts') ? desc : `${desc}\n\n#shorts`).trim() : desc,
        category: editingVideo.category,
        contentType: isShorts ? 'shorts' : (editingVideo.contentType || 'video'),
        game: editingVideo.game
      };
      try {
        await databases.updateDocument(dbId, colId, editingVideo.id, updateData);
      } catch (firstErr: any) {
        if (firstErr.code === 400 && firstErr.message?.toLowerCase().includes('unknown attribute')) {
          updateData = { title: editingVideo.title, description: editingVideo.description } as any;
          await databases.updateDocument(dbId, colId, editingVideo.id, updateData);
        } else {
          throw firstErr;
        }
      }
      setVideos(prev => prev.map(v => v.id === editingVideo.id ? { ...v, ...updateData } : v));
      setEditingVideo(null);
    } catch (err) {
      console.error("Edit failed:", err);
      alert(language === 'ru' ? 'Не удалось обновить видео.' : 'Failed to update video.');
    }
  };

  const totalViews = useMemo(() => videos.reduce((s, v) => s + v.views, 0), [videos]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400">
        <AlertCircle className="w-16 h-16 mb-4 text-slate-600" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('your_vids_login_req')}</h1>
        <p className="max-w-sm mb-6">{t('your_vids_login_desc')}</p>
        <button onClick={login} className="px-8 py-3 bg-[#70d6ff] text-[#05070a] font-bold rounded-xl hover:opacity-90 transition-opacity">
          {language === 'ru' ? 'Войти' : 'Sign In'}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff] mb-4" />
        <span className="text-slate-400">Loading Content...</span>
      </div>
    );
  }

  const currentList = tab === 'videos' ? regularVideos : shortsVideos;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative mb-10">
        <div className="absolute -top-6 -left-6 w-40 h-40 bg-[#70d6ff]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Film className="w-8 h-8 text-[#70d6ff]" />
              {t('studio_content')}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">{language === 'ru' ? 'Управляйте своим контентом' : 'Manage your content'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
              <span className="text-slate-400">{language === 'ru' ? 'Всего' : 'Total'}: </span>
              <span className="text-white font-bold">{videos.length}</span>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
              <span className="text-slate-400">{language === 'ru' ? 'Просмотры' : 'Views'}: </span>
              <span className="text-white font-bold">{new Intl.NumberFormat().format(totalViews)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setTab('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'videos' ? 'bg-[#70d6ff] text-black shadow-lg shadow-[#70d6ff]/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Video className="w-4 h-4" />
            <span>{language === 'ru' ? 'Видео' : 'Videos'}</span>
            <span className="text-[10px] opacity-60 ml-1">({regularVideos.length})</span>
          </button>
          <button
            onClick={() => setTab('shorts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'shorts' ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Scissors className="w-4 h-4" />
            <span>Shorts</span>
            <span className="text-[10px] opacity-60 ml-1">({shortsVideos.length})</span>
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск по названию...' : 'Search by title...'}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#70d6ff]/50 transition-all"
          />
        </div>
      </div>

      {/* Stats Summary */}
      {currentList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <span className="text-2xl font-black text-white">{currentList.length}</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{tab === 'videos' ? (language === 'ru' ? 'Видео' : 'Videos') : 'Shorts'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <span className="text-2xl font-black text-white">{currentList.reduce((s, v) => s + v.views, 0)}</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{language === 'ru' ? 'Просмотры' : 'Views'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <span className="text-2xl font-black text-white">
              {currentList.length > 0 ? Math.round(currentList.reduce((s, v) => s + v.views, 0) / currentList.length) : 0}
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{language === 'ru' ? 'В среднем' : 'Avg Views'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <span className="text-2xl font-black text-white">
              {currentList.filter(v => v.views > 0).length > 0 
                ? Math.round((currentList.filter(v => v.views > 0).length / currentList.length) * 100) + '%'
                : '0%'}
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{language === 'ru' ? 'С просмотрами' : 'With Views'}</p>
          </div>
        </div>
      )}

      {/* Sort Buttons */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {(['new', 'old', 'views', 'likes'] as const).map(key => (
          <button key={key} onClick={() => setSortBy(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${sortBy === key ? 'bg-[#70d6ff]/20 text-[#70d6ff] border border-[#70d6ff]/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
            {key === 'new' ? (language === 'ru' ? 'Новые' : 'New') : key === 'old' ? (language === 'ru' ? 'Старые' : 'Old') : key === 'views' ? (language === 'ru' ? 'По просмотрам' : 'By Views') : (language === 'ru' ? 'По лайкам' : 'By Likes')}
          </button>
        ))}
      </div>

      {/* Content Grid/Table */}
      <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/10 rounded-3xl overflow-hidden">
        {filteredVideos.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <Film className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
              {searchQuery 
                ? (language === 'ru' ? 'Ничего не найдено' : 'Nothing found')
                : (tab === 'videos' 
                  ? (language === 'ru' ? 'Нет видео. Загрузите первый ролик!' : 'No videos. Upload your first!')
                  : (language === 'ru' ? 'Нет шортсов. Создайте первый!' : 'No shorts. Create your first!'))}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredVideos.map((vid, i) => (
              <div key={vid.id} className="flex items-center gap-4 p-4 sm:px-6 hover:bg-white/[0.02] transition-all group">
                <span className="text-[10px] font-mono text-slate-600 w-6 shrink-0 text-right">{i + 1}</span>
                <div className="w-16 h-10 sm:w-24 sm:h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/5 relative">
                  <img
                    src={getOptimizedThumbnail(vid.thumbnailUrl)}
                    className="w-full h-full object-cover"
                    alt={vid.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/160x90/0f1115/70d6ff?text=${encodeURIComponent((vid.title || 'V').substring(0, 3))}`; }}
                  />
                  {tab === 'shorts' && (
                    <div className="absolute top-1 right-1 bg-teal-500/80 text-[7px] font-black px-1 py-0.5 rounded uppercase">Short</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{vid.title || 'Untitled'}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {vid.uploadDate}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {vid.views}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingVideo({ ...vid })}
                    className="p-2 hover:bg-[#70d6ff]/10 text-slate-400 hover:text-[#70d6ff] rounded-xl transition-all"
                    title={language === 'ru' ? 'Редактировать' : 'Edit'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vid.id)}
                    disabled={isDeleting === vid.id}
                    className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all disabled:opacity-30"
                    title={language === 'ru' ? 'Удалить' : 'Delete'}
                  >
                    {isDeleting === vid.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold font-display text-white">{language === 'ru' ? 'Редактировать' : 'Edit'} {tab === 'shorts' ? 'Short' : 'Video'}</h2>
              <button onClick={() => setEditingVideo(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Название' : 'Title'}</label>
                <input type="text" value={editingVideo.title} onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Описание' : 'Description'}</label>
                <textarea value={editingVideo.description || ''} onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors h-24 resize-none custom-scrollbar" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('upload_type')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEditingVideo({ ...editingVideo, contentType: 'video' })}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${editingVideo.contentType !== 'shorts' ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"}`}>
                      {t('upload_video')}
                    </button>
                    <button type="button" onClick={() => setEditingVideo({ ...editingVideo, contentType: 'shorts' })}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${editingVideo.contentType === 'shorts' ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"}`}>
                      {t('upload_shorts')}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Категория' : 'Category'}</label>
                  <input list="edit-category-suggestions" type="text" value={editingVideo.category || ''} onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors"
                    placeholder={language === 'ru' ? 'Введите или выберите...' : 'Enter or select...'} />
                  <datalist id="edit-category-suggestions">
                    {[
                      { id: 'All', label: language === 'ru' ? 'Все' : 'All' },
                      { id: 'Music', label: language === 'ru' ? 'Музыка' : 'Music' },
                      { id: 'Gaming', label: language === 'ru' ? 'Игры' : 'Gaming' },
                      { id: 'Live', label: language === 'ru' ? 'Стримы' : 'Live' },
                      { id: 'Tech', label: language === 'ru' ? 'Технологии' : 'Tech' },
                      { id: 'Nature', label: language === 'ru' ? 'Природа' : 'Nature' }
                    ].map(cat => (
                      <option key={cat.id} value={cat.label} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Игра' : 'Game'}</label>
                <input type="text" value={editingVideo.game || ''} onChange={(e) => setEditingVideo({ ...editingVideo, game: e.target.value })}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingVideo(null)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl font-medium bg-[#70d6ff] hover:bg-[#70d6ff]/90 text-black shadow-[0_0_15px_rgba(112,214,255,0.2)] transition-colors">
                  {language === 'ru' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
