import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, LayoutDashboard, Film, TrendingUp, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Query } from 'appwrite';

export default function Studio() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalViews: 0, totalVideos: 0 });

  useEffect(() => {
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
          thumbnailUrl: v.thumbnailUrl,
          views: v.views || 0,
          uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
          status: 'Published'
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
      </div>

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
                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title={t('studio_edit')}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors" title={t('studio_delete')}>
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
