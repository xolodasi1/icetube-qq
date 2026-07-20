import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, LayoutDashboard, Film, TrendingUp, Edit2, Trash2, AlertCircle, Upload, Wand2, X, Users, Clock, Eye, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Query, ID } from 'appwrite';
import { UploadModal } from '../components/UploadModal';
import { Link, useLocation } from 'react-router-dom';

export default function Studio() {
  const { user, login } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const isVerification = location.pathname === '/studio/verification';
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalViews: 0, totalVideos: 0, totalShorts: 0, subscriberCount: 0, snowflakesCount: 0 });
  const [requestingVerify, setRequestingVerify] = useState(false);

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
          let isShorts = editingVideo.contentType === 'shorts' || editingVideo.title?.toLowerCase().includes('#shorts') || editingVideo.description?.toLowerCase().includes('#shorts');
          
          let updateData = {
            title: editingVideo.title,
            description: isShorts ? (editingVideo.description.toLowerCase().includes('#shorts') ? editingVideo.description : `${editingVideo.description}\n\n#shorts`).trim() : editingVideo.description,
            category: editingVideo.category,
            contentType: isShorts ? 'shorts' : (editingVideo.contentType || 'video'),
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
        verified: v.verified || false,
        game: v.game,
        thumbnailUrl: v.thumbnailUrl,
        views: v.views || 0,
        uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
        createdAt: v.$createdAt,
        status: 'Published'
      }));

      setVideos(userVids.reverse());

      // Fetch subscriber count
      let subscriberCount = 0;
      const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;
      if (dbId && subsColId) {
        try {
          const subsRes = await databases.listDocuments(dbId, subsColId, [
            Query.equal('channelId', user.$id)
          ]);
          subscriberCount = subsRes.total;
        } catch (e) {
          console.warn("Subs collection error:", e);
        }
      }

      let snowflakesCount = 0;
      try {
        const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        if (profilesCol) {
          const profileRes = await databases.listDocuments(dbId, profilesCol, [
            Query.equal('userId', user.$id)
          ]);
          if (profileRes.documents.length > 0) {
            snowflakesCount = profileRes.documents[0].snowflakesCount || 0;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch snowflakes:", e);
      }

      setStats({
        totalVideos: response.total,
        totalViews: userVids.reduce((acc, curr) => acc + curr.views, 0),
        totalShorts: userVids.filter(v => v.contentType === 'shorts').length,
        subscriberCount,
        snowflakesCount
      });
    } catch (err) {
      console.error("Studio fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!user) return;
    setRequestingVerify(true);
    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const profilesCol = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
      if (!dbId || !profilesCol) {
        alert(language === 'ru' ? 'Ошибка конфигурации.' : 'Configuration error.');
        return;
      }

      const profileRes = await databases.listDocuments(dbId, profilesCol, [
        Query.equal('userId', user.$id)
      ]);
      if (profileRes.documents.length > 0) {
        await databases.updateDocument(dbId, profilesCol, profileRes.documents[0].$id, {
          verificationRequested: true
        });
      }

      alert(language === 'ru'
        ? 'Заявка на верификацию отправлена администратору!'
        : 'Verification request sent to admin!');
    } catch (err: any) {
      console.error("Verification request failed:", err);
      alert(language === 'ru' ? 'Ошибка при отправке заявки.' : 'Failed to send request.');
    } finally {
      setRequestingVerify(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [user, language]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400">
        <AlertCircle className="w-16 h-16 mb-4 text-slate-600" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('your_vids_login_req')}</h1>
        <p className="max-w-sm mb-6">{t('your_vids_login_desc')}</p>
        <button 
          onClick={login}
          className="px-8 py-3 bg-[#70d6ff] text-[#05070a] font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          {language === 'ru' ? 'Войти' : 'Sign In'}
        </button>
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

      <div className="mt-8">
        {/* Main Content */}
        <main className="min-w-0">
          {!isVerification ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#70d6ff]/10 rounded-full blur-2xl group-hover:bg-[#70d6ff]/20 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-[#70d6ff]/10 rounded-xl">
                      <Eye className="w-5 h-5 text-[#70d6ff]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {new Intl.NumberFormat().format(stats.totalViews)}
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{language === 'ru' ? 'Всего просмотров' : 'Total Views'}</p>
                </div>
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {new Intl.NumberFormat().format(stats.subscriberCount)}
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{language === 'ru' ? 'Подписчики' : 'Subscribers'}</p>
                </div>
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl">
                      <Film className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {stats.totalVideos}
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{language === 'ru' ? 'Всего видео' : 'Total Videos'}</p>
                </div>
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-teal-500/10 rounded-xl">
                      <Activity className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {stats.totalShorts}
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Shorts</p>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#70d6ff]" />
                    {language === 'ru' ? 'Последние видео' : 'Recent Uploads'}
                  </h3>
                  <div className="space-y-3">
                    {videos.slice(0, 5).length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">{language === 'ru' ? 'Нет видео' : 'No videos yet'}</p>
                    ) : videos.slice(0, 5).map(v => (
                      <div key={v.id} className="flex items-center gap-3">
                        <img src={v.thumbnailUrl} className="w-12 h-8 rounded-lg object-cover bg-slate-800 shrink-0" alt="" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{v.title}</p>
                          <p className="text-[10px] text-slate-500"><Eye className="w-3 h-3 inline mr-1" />{v.views}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.contentType === 'shorts' ? 'bg-teal-500/10 text-teal-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {v.contentType === 'shorts' ? 'Short' : 'Video'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    {language === 'ru' ? 'Производительность' : 'Performance'}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">{language === 'ru' ? 'Среднее просмотров' : 'Avg Views/Video'}</span><span className="text-white font-bold">{videos.length > 0 ? Math.round(stats.totalViews / videos.length) : 0}</span></div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="h-full bg-gradient-to-r from-[#70d6ff] to-blue-500 rounded-full" style={{ width: `${Math.min(100, (stats.totalViews / Math.max(1, stats.totalVideos)) * 10)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">{language === 'ru' ? 'Подписчиков' : 'Subscribers'}</span><span className="text-white font-bold">{stats.subscriberCount}</span></div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" style={{ width: `${Math.min(100, stats.subscriberCount * 5)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-400">{language === 'ru' ? 'Shorts' : 'Shorts'}</span><span className="text-white font-bold">{stats.totalShorts}</span></div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="h-full bg-gradient-to-r from-teal-400 to-green-400 rounded-full" style={{ width: `${videos.length > 0 ? (stats.totalShorts / videos.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-[#70d6ff]/5 border border-[#70d6ff]/10 rounded-xl">
                      <div className="flex items-center gap-2 text-[#70d6ff] text-xs font-bold">
                        <Clock className="w-3 h-3" />
                        {language === 'ru' ? 'Обновление каждые 15 сек' : 'Auto-updates every 15s'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#70d6ff]/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-[#70d6ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{language === 'ru' ? 'Верификация канала' : 'Channel Verification'}</h3>
                  <p className="text-xs text-slate-400">{language === 'ru' ? 'Получите синюю галочку' : 'Get your verified badge'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${stats.subscriberCount >= 1000 ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {stats.subscriberCount >= 1000 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-500" />}
                    <span className="text-sm font-bold text-white">1 000</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{language === 'ru' ? 'Подписчиков' : 'Subscribers'}</p>
                  <p className="text-xs text-slate-500 mt-1">{stats.subscriberCount} / 1 000</p>
                </div>
                <div className={`p-4 rounded-xl border ${stats.totalVideos >= 1000 ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {stats.totalVideos >= 1000 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-500" />}
                    <span className="text-sm font-bold text-white">1 000</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{language === 'ru' ? 'Загружено видео' : 'Videos Uploaded'}</p>
                  <p className="text-xs text-slate-500 mt-1">{stats.totalVideos} / 1 000</p>
                </div>
                <div className={`p-4 rounded-xl border ${stats.snowflakesCount >= 100 ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {stats.snowflakesCount >= 100 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-500" />}
                    <span className="text-sm font-bold text-white">100</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{language === 'ru' ? 'Снежинок' : 'Snowflakes'}</p>
                  <p className="text-xs text-slate-500 mt-1">{stats.snowflakesCount} / 100</p>
                </div>
              </div>

              {stats.subscriberCount >= 1000 && stats.totalVideos >= 1000 && stats.snowflakesCount >= 100 ? (
                <button
                  onClick={handleRequestVerification}
                  disabled={requestingVerify}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#70d6ff] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#70d6ff]/90 transition-all disabled:opacity-50"
                >
                  {requestingVerify ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {language === 'ru' ? 'Подать заявку на верификацию' : 'Request Verification'}
                </button>
              ) : (
                <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                  <p className="text-xs text-slate-400 text-center">
                    {language === 'ru'
                      ? 'Выполните все требования выше, чтобы подать заявку на верификацию.'
                      : 'Meet all requirements above to apply for verification.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
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
