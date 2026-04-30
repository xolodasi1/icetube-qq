import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Loader2, Film, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Query } from 'appwrite';

import { getOptimizedThumbnail } from '../lib/cloudinary';

export default function Content() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        thumbnailUrl: v.thumbnailUrl,
        views: v.views || 0,
        uploadDate: new Date(v.$createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US'),
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
        <span className="text-slate-400">Loading Content...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10 pb-6 border-b ice-border">
        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
          <Film className="w-8 h-8 text-[#70d6ff]" />
          {t('studio_content')}
        </h1>
      </div>

      <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b ice-border bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('studio_video_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">{t('studio_date_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">{t('studio_views_header')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y ice-border">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    {t('studio_no_videos')}
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-12 rounded-lg border ice-border shrink-0 overflow-hidden bg-slate-800">
                          <img 
                            src={getOptimizedThumbnail(vid.thumbnailUrl) || '/placeholder-thumb.jpg'} 
                            className="w-full h-full object-cover" 
                            alt={vid.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/160x90/0f1115/70d6ff?text=${encodeURIComponent(vid.title.substring(0, 5))}`;
                            }}
                          />
                        </div>
                        <span className="text-white font-medium truncate max-w-[200px] sm:max-w-[300px]">{vid.title}</span>
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
