import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Wand2, Save, X, Loader2, Image as ImageIcon, User, AlignLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Query } from 'appwrite';

export default function ChannelEditor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: ''
  });

  const [dbDocId, setDbDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        
        if (!dbId || !colId) {
          // Fallback to basic info from account if collection is not set
          setFormData({
            name: user.name || '',
            description: '',
            avatar: ''
          });
          setIsLoading(false);
          return;
        }

        // Try to find the user document
        const response = await databases.listDocuments(dbId, colId, [
          Query.equal('userId', user.$id)
        ]);

        if (response.documents.length > 0) {
          const doc = response.documents[0];
          setDbDocId(doc.$id);
          setFormData({
            name: doc.name || doc.displayName || user.name || '',
            description: doc.description || doc.bio || '',
            avatar: doc.avatar || doc.photoUrl || ''
          });
        } else {
          // No doc yet, use account info
          setFormData({
            name: user.name || '',
            description: '',
            avatar: ''
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const colId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

      if (!dbId || !colId) {
        throw new Error("Missing Database or Collection ID configuration.");
      }

      const payload = {
        userId: user.$id,
        name: formData.name,
        description: formData.description,
        avatar: formData.avatar
      };

      if (dbDocId) {
        // Update existing
        await databases.updateDocument(dbId, colId, dbDocId, payload);
      } else {
        // Create new
        await databases.createDocument(dbId, colId, 'unique()', payload);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

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
        <span className="text-slate-400">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b ice-border">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-[#70d6ff]" />
            {t('editor_title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('editor_basic_info')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Success/Error Alerts */}
        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{t('editor_success')}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Profile Preview */}
        <div className="bg-white/5 border ice-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center transition-all group-hover:border-[#70d6ff]/50">
                {formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'U')}`;
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-600" />
                )}
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#70d6ff]" />
                  {t('editor_name')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#70d6ff] transition-colors"
                  placeholder="Your channel name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#70d6ff]" />
                  {t('editor_avatar')}
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#70d6ff] transition-colors"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-[#70d6ff]" />
              {t('editor_description')}
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/40 border ice-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#70d6ff] transition-colors resize-none"
              placeholder="Tell viewers about your channel"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
          >
            {t('editor_cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#70d6ff] hover:bg-[#70d6ff]/90 text-[#05070a] px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(112,214,255,0.3)] hover:shadow-[0_0_30px_rgba(112,214,255,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{t('editor_save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
