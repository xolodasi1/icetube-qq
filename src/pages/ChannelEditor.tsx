import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../lib/AuthContext';
import { databases, account } from '../lib/appwrite';
import { useLanguage } from '../lib/LanguageContext';
import { Wand2, Save, X, Loader2, Image as ImageIcon, User, AlignLeft, AlertCircle, CheckCircle2, Upload, Tag } from 'lucide-react';
import { Query, ID } from 'appwrite';

export default function ChannelEditor() {
  const { user, login, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getFieldStatus = (field: string) => {
    const errorMap: Record<string, string> = {
      'name': language === 'ru' ? 'Имя канала' : 'Channel name',
      'handle': language === 'ru' ? 'Псевдоним' : 'Handle',
      'avatar': language === 'ru' ? 'Аватар' : 'Avatar',
      'bannerUrl': language === 'ru' ? 'Баннер' : 'Banner',
      'description': language === 'ru' ? 'Описание' : 'Description',
      'website': 'Website',
      'youtube': 'YouTube',
      'tiktok': 'TikTok',
      'telegram': 'Telegram',
      'vk': 'VK',
      'category': language === 'ru' ? 'Категория' : 'Category'
    };
    return errorMap[field] || field;
  };

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    avatar: '',
    bannerUrl: '',
    website: '',
    youtube: '',
    tiktok: '',
    telegram: '',
    vk: '',
    category: ''
  });

  const [dbDocId, setDbDocId] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    try {
        const avatarUrl = await uploadImageToCloudinary(file);
        setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    } catch (err: any) {
        setError(err.message || 'Failed to upload image');
    } finally {
        setIsUploading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsBannerUploading(true);
    setError(null);
    try {
        const url = await uploadImageToCloudinary(file);
        setFormData(prev => ({ ...prev, bannerUrl: url }));
    } catch (err: any) {
        setError(err.message || 'Failed to upload banner');
    } finally {
        setIsBannerUploading(false);
    }
  };

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
            handle: '',
            description: '',
            avatar: '',
            bannerUrl: ''
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
            handle: doc.handle || '',
            description: doc.description || doc.bio || '',
            avatar: doc.avatar || doc.photoUrl || '',
            bannerUrl: doc.bannerUrl || '',
            website: doc.website || '',
            youtube: doc.youtube || '',
            tiktok: doc.tiktok || '',
            telegram: doc.telegram || '',
            vk: doc.vk || '',
            category: doc.category || ''
          });
        } else {
          // No doc yet, use account info
          setFormData({
            name: user.name || '',
            handle: '',
            description: '',
            avatar: '',
            bannerUrl: '',
            website: '',
            youtube: '',
            tiktok: '',
            telegram: '',
            vk: '',
            category: ''
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError(language === 'ru' ? "Не удалось загрузить профиль. Проверьте консоль или настройки Appwrite." : "Failed to load profile. Check console or Appwrite settings.");
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
        handle: formData.handle,
        description: formData.description,
        avatar: formData.avatar,
        bannerUrl: formData.bannerUrl,
        website: formData.website,
        youtube: formData.youtube,
        tiktok: formData.tiktok,
        telegram: formData.telegram,
        vk: formData.vk,
        category: formData.category
      };

      try {
        if (dbDocId) {
          await databases.updateDocument(dbId, colId, dbDocId, payload);
        } else {
          await databases.createDocument(dbId, colId, ID.unique(), payload);
        }
      } catch (firstErr: any) {
        if (firstErr.code === 400 && firstErr.message?.toLowerCase().includes('unknown attribute')) {
          const basicPayload = {
            userId: user.$id,
            name: formData.name,
            handle: formData.handle,
            description: formData.description,
            avatar: formData.avatar
          };
          if (dbDocId) {
            await databases.updateDocument(dbId, colId, dbDocId, basicPayload);
          } else {
            await databases.createDocument(dbId, colId, ID.unique(), basicPayload);
          }
        } else {
          throw new Error(`Profile (Users Collection) Error: ${firstErr.message}`);
        }
      }

      // Update name in Appwrite Account
      try {
        await account.updateName(formData.name);
      } catch (err) {
        console.warn('Could not update account name (this is normal for OAuth users):', err);
      }

      // Update all videos by this user to reflect new profile info
      const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
      if (videosColId) {
        try {
          const videos = await databases.listDocuments(dbId, videosColId, [
            Query.equal('uploaderId', user.$id)
          ]);
          
          for (const video of videos.documents) {
            await databases.updateDocument(dbId, videosColId, video.$id, {
              uploaderName: formData.name,
              uploaderAvatar: formData.avatar
            });
          }
        } catch (err: any) {
           throw new Error(`Videos Collection Error: ${err.message}`);
        }
      }

      // Update all comments by this user
      const commentsColId = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
      if (commentsColId) {
        try {
          const comments = await databases.listDocuments(dbId, commentsColId, [
            Query.equal('authorId', user.$id)
          ]);
          
          for (const comment of comments.documents) {
            await databases.updateDocument(dbId, commentsColId, comment.$id, {
              authorName: formData.name,
              authorAvatar: formData.avatar
            });
          }
        } catch (err: any) {
          console.warn("Could not copy profile to comments, they might not have update permissions:", err.message);
          // throw new Error(`Comments Collection Error: ${err.message}`);
        }
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      const msg = err.message || '';
      if (msg.includes('Missing or insufficient permissions')) {
        setError(language === 'ru'
          ? 'Нет прав на запись в базу. Проверьте правила доступа в Appwrite Console (Users collection → Settings → Permissions → дайте Users права Read/Create/Update).'
          : 'Missing write permissions. Check Appwrite Console → Users collection → Settings → Permissions → grant Users Read/Create/Update.');
      } else if (msg.includes('attribute') && msg.includes('not found')) {
        const fieldMatch = msg.match(/"([^"]+)"/);
        const field = fieldMatch ? fieldMatch[1] : '?';
        setError(language === 'ru'
          ? `Не хватает поля "${getFieldStatus(field)}" в коллекции Users. Добавьте его в Appwrite Console → Databases → Users → Attributes.`
          : `Missing attribute "${field}" in Users collection. Add it in Appwrite Console.`);
      } else if (msg.includes('Document already exists') || msg.includes('unique')) {
        setError(language === 'ru'
          ? 'Этот handle уже занят. Выберите другой псевдоним (@handle).'
          : 'This handle is already taken. Choose a different one.');
      } else {
        setError(msg || (language === 'ru' ? 'Произошла ошибка при сохранении.' : 'An error occurred while saving.'));
      }
    } finally {
      setIsSaving(false);
    }
  };

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
        <span className="text-slate-400">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative mb-10">
        <div className="absolute -top-6 -left-6 w-40 h-40 bg-[#70d6ff]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-[#70d6ff]" />
              {language === 'ru' ? 'Настройка канала' : 'Channel Settings'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {language === 'ru' ? 'Измените внешний вид вашего канала Icetube' : 'Customize your Icetube channel appearance'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Icetube Studio</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Success/Error Alerts */}
        {success && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-5 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="p-1.5 bg-green-500/20 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-bold text-sm">{t('editor_success')}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl">
            <div className="p-1.5 bg-red-500/20 rounded-full shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">{language === 'ru' ? 'Ошибка' : 'Error'}</p>
              <p className="text-red-300/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8">
          {/* Avatar + Name Row */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-slate-600 bg-slate-800/50 flex items-center justify-center transition-all group-hover:border-[#70d6ff]/50 shadow-xl">
                {isUploading ? (
                    <Loader2 className="w-10 h-10 animate-spin text-[#70d6ff]" />
                ) : formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'U')}&background=70d6ff&color=fff`;
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <User className="w-10 h-10" />
                    <span className="text-[9px] mt-1 font-bold uppercase">Avatar</span>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2.5 bg-[#70d6ff] rounded-full text-black hover:bg-white hover:text-[#70d6ff] transition-all cursor-pointer shadow-lg shadow-[#70d6ff]/30 hover:shadow-[#70d6ff]/50 active:scale-90">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
              </label>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#70d6ff]" />
                  {language === 'ru' ? 'Название канала' : 'Channel Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#70d6ff]/50 focus:bg-black/60 transition-all"
                  placeholder={language === 'ru' ? 'Название канала' : 'Your channel name'}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-[#70d6ff] font-mono text-sm">@</span>
                  {language === 'ru' ? 'Псевдоним (handle)' : 'Handle'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({...formData, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#70d6ff]/50 focus:bg-black/60 transition-all font-mono"
                    placeholder="username"
                  />
                </div>
                {formData.handle && (
                  <p className="text-[10px] text-slate-500 font-mono">icetube.com/@{formData.handle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Avatar URL + Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#70d6ff]" />
                {language === 'ru' ? 'URL аватара' : 'Avatar URL'}
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#70d6ff]/50 transition-all font-mono text-[13px]"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-[#70d6ff]" />
                  {language === 'ru' ? 'Баннер' : 'Banner'}
                </label>
                <label className="cursor-pointer text-[10px] font-bold flex items-center gap-1 bg-[#70d6ff]/10 hover:bg-[#70d6ff]/20 text-[#70d6ff] px-3 py-1.5 rounded-lg transition-colors border border-[#70d6ff]/20">
                  {isBannerUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  <span>{language === 'ru' ? 'Файл' : 'File'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={isBannerUploading} />
                </label>
              </div>
              <div className="relative group overflow-hidden rounded-xl bg-black/40 border border-white/10">
                <input
                  type="url"
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})}
                  className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all font-mono text-[13px]"
                  placeholder="https://example.com/banner.jpg"
                />
                {formData.bannerUrl && (
                  <div className="w-full h-24 border-t border-white/5 relative">
                    <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <AlignLeft className="w-3.5 h-3.5 text-[#70d6ff]" />
              {language === 'ru' ? 'Описание канала' : 'Channel Description'}
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#70d6ff]/50 focus:bg-black/60 transition-all resize-none"
              placeholder={language === 'ru' ? 'Расскажите о своём канале...' : 'Tell viewers about your channel...'}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#70d6ff]" />
              {language === 'ru' ? 'Категория канала' : 'Channel Category'}
            </label>
            <input
              list="channel-category-suggestions"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#70d6ff]/50 focus:bg-black/60 transition-all"
              placeholder={language === 'ru' ? 'Введите или выберите...' : 'Enter or select...'}
            />
            <datalist id="channel-category-suggestions">
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

          {/* Social Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#70d6ff] rounded-full" />
              {language === 'ru' ? 'Ссылки' : 'Social Links'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <LinkInput icon="🌐" label="Website" value={formData.website} onChange={(v) => setFormData({...formData, website: v})} />
               <LinkInput icon="▶️" label="YouTube" value={formData.youtube} onChange={(v) => setFormData({...formData, youtube: v})} />
               <LinkInput icon="🎵" label="TikTok" value={formData.tiktok} onChange={(v) => setFormData({...formData, tiktok: v})} />
               <LinkInput icon="✈️" label="Telegram" value={formData.telegram} onChange={(v) => setFormData({...formData, telegram: v})} />
               <LinkInput icon="🔵" label="VK" value={formData.vk} onChange={(v) => setFormData({...formData, vk: v})} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
          <Link
            to="/channel/me"
            className="px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-[11px] sm:text-sm bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 transition-all"
          >
            {language === 'ru' ? 'Канал' : 'Channel'}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-[11px] sm:text-sm bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 transition-all"
          >
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#70d6ff] to-[#5bc0e6] hover:from-[#5bc0e6] hover:to-[#70d6ff] text-[#05070a] px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-bold text-[11px] sm:text-sm transition-all shadow-lg shadow-[#70d6ff]/20 hover:shadow-[#70d6ff]/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{language === 'ru' ? 'Сохранить' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function LinkInput({ icon, label, value, onChange }: { icon: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-xl px-4 py-3 focus-within:border-[#70d6ff]/30 focus-within:bg-black/50 transition-all">
      <span className="text-base shrink-0">{icon}</span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none font-mono text-[13px]"
        placeholder={`https://${label.toLowerCase()}.com/`}
      />
    </div>
  );
}
