import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, LayoutDashboard, Film, TrendingUp, MoreVertical, Edit2, Trash2, AlertCircle, Upload, Wand2, X } from 'lucide-react';
import { Query, ID } from 'appwrite';
import { UploadModal } from '../components/UploadModal';
import { Link } from 'react-router-dom';

export default function Studio() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalViews: 0, totalVideos: 0 });

  const handleDelete = async (videoId: string) => {
    if (!window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить это видео? Это действие нельзя отменить.' : 'Are you sure you want to delete this video? This action cannot be undone.')) return;
    
    setIsDeleting(videoId);
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    
    try {
      if (dbId && colId) {
        await databases.deleteDocument(dbId, colId, videoId);
        setVideos(prev => prev.filter(v => v.id !== videoId));
        fetchStats();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert('Failed to delete video.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    
    try {
      if (dbId && colId) {
        let updateData = {
          title: editingVideo.title,
          description: editingVideo.description,
          category: editingVideo.category,
          contentType: editingVideo.contentType,
          game: editingVideo.game
        };

        try {
          await databases.updateDocument(dbId, colId, editingVideo.id, updateData);
        } catch (firstErr: any) {
          if (firstErr.code === 400 && firstErr.message?.toLowerCase().includes('unknown attribute')) {
            console.log("Retrying update without category, contentType, and game");
            updateData = {
              title: editingVideo.title,
              description: editingVideo.description
            } as any;
            await databases.updateDocument(dbId, colId, editingVideo.id, updateData);
          } else {
            throw firstErr;
          }
        }
        
        setVideos(prev => prev.map(v => v.id === editingVideo.id ? editingVideo : v));
        setEditingVideo(null);
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert(language === 'ru' ? 'Не удалось обновить видео.' : 'Failed to update video.');
    }
  };

  const fetchStats = async () => {
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
        description: v.description,
        category: v.category,
        contentType: v.contentType,
        game: v.game,
        thumbnailUrl: v.thumbnailUrl,
        views: v.views || 0,
        uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
        status: 'Published',
        ...v
      }));

      setVideos(userVids.reverse());
      setStats({
        totalVideos: response.total,
        totalViews: userVids.reduce((acc, curr) => acc + curr.views, 0)
      });
    } catch (err) {
      console.error("Studio fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, language]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400">
        <AlertCircle className="w-16 h-16 mb-4 text-slate-600" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('your_vids_login_req')}</h1>
        <p className="max-w-sm">{t('your_vids_login_desc')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff] mb-4" />
        <span className="text-slate-400">Loading Studio...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b ice-border">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-[#70d6ff]" />
            {t('nav_studio')}
          </h1>
          <p className="text-slate-400 mt-1">{t('studio_analytics')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/studio/editor"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium transition-all border ice-border"
          >
            <Wand2 className="w-4 h-4 text-[#70d6ff]" />
            <span>{t('studio_customize')}</span>
          </Link>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-[#70d6ff] hover:bg-[#70d6ff]/90 text-[#05070a] px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(112,214,255,0.2)]"
          >
            <Upload className="w-4 h-4" />
            <span>{t('your_vids_upload_btn')}</span>
          </button>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={fetchStats}
      />

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/5 border ice-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#70d6ff]/10 rounded-full blur-2xl group-hover:bg-[#70d6ff]/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#70d6ff]/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#70d6ff]" />
            </div>
            <span className="text-slate-400 font-medium">{t('studio_total_views')}</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {new Intl.NumberFormat().format(stats.totalViews)}
          </div>
        </div>

        <div className="bg-white/5 border ice-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Film className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-slate-400 font-medium">{t('studio_total_videos')}</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {stats.totalVideos}
          </div>
        </div>
      </div>

      {/* Video Content Table */}
      <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b ice-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t('studio_content')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b ice-border bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Video</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Views</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y ice-border">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    No videos found. Upload your first clip to start tracking!
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={vid.thumbnailUrl} 
                          className="w-20 h-12 object-cover rounded-lg border ice-border shrink-0" 
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-medium truncate max-w-[200px] sm:max-w-[300px]">{vid.title}</span>
                          <span className="text-xs text-[#70d6ff]/70">{vid.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {vid.uploadDate}
                    </td>
                    <td className="px-6 py-4 text-center text-white font-medium">
                      {vid.views}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingVideo(vid)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title={t('studio_edit')}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(vid.id)} disabled={isDeleting === vid.id} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50" title={t('studio_delete')}>
                          {isDeleting === vid.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold font-display text-white">{language === 'ru' ? 'Редактировать видео' : 'Edit Video'}</h2>
              <button 
                onClick={() => setEditingVideo(null)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Название' : 'Title'}</label>
                <input 
                  type="text" 
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Описание' : 'Description'}</label>
                <textarea 
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors h-32 resize-none custom-scrollbar"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Категория' : 'Category'}</label>
                  <input 
                    type="text" 
                    value={editingVideo.category || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{language === 'ru' ? 'Игра' : 'Game'}</label>
                  <input 
                    type="text" 
                    value={editingVideo.game || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, game: e.target.value })}
                    className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#70d6ff]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('upload_type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, contentType: 'video' })}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${editingVideo.contentType !== 'shorts' ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    {t('upload_video')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, contentType: 'shorts' })}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${editingVideo.contentType === 'shorts' ? "bg-[#70d6ff]/20 border-[#70d6ff] text-white" : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    {t('upload_shorts')}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-white/5 transition-colors"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-medium bg-[#70d6ff] hover:bg-[#70d6ff]/90 text-black shadow-[0_0_15px_rgba(112,214,255,0.2)] transition-colors"
                >
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
