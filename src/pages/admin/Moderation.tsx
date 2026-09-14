import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Trash2, Film, Scissors, Image as ImageIcon, Users, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { useAuth } from '../../auth/AuthContext';
import { logAdminAction } from '../../lib/admin';
import { getOptimizedThumbnail } from '../../lib/cloudinary';

const AUTO_HIDE_THRESHOLD = 5;

export default function ModerationSection({ dbVideos, setDbVideos, dbUsers, reports, setReports, language }: any) {
  const { user } = useAuth();
  const [queueTab, setQueueTab] = useState<'videos' | 'shorts' | 'photos' | 'avatars'>('videos');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [schemaHint, setSchemaHint] = useState(false);
  const [autoHideMsg, setAutoHideMsg] = useState<string | null>(null);
  const [hideHidden, setHideHidden] = useState(false);

  const reportCounts = useMemo(() => {
    const m = new Map<string, number>();
    (reports || []).forEach((r: any) => {
      if (r.videoId) m.set(r.videoId, (m.get(r.videoId) || 0) + 1);
    });
    return m;
  }, [reports]);

  const isShort = (v: any) => v.contentType === 'shorts' || v.isShort || v.isShorts;
  const isPhoto = (v: any) => v.contentType === 'photo';
  const sorted = useMemo(
    () => [...dbVideos].sort((a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime()),
    [dbVideos]
  );
  const videos = sorted.filter(v => !isShort(v) && !isPhoto(v));
  const shorts = sorted.filter(v => isShort(v));
  const photos = sorted.filter(v => isPhoto(v));
  const avatars = useMemo(
    () => [...(dbUsers || [])].filter((u: any) => u.avatar).sort((a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime()),
    [dbUsers]
  );
  const rawList = queueTab === 'videos' ? videos : queueTab === 'shorts' ? shorts : photos;
  const list = hideHidden ? rawList.filter(v => !v.hidden) : rawList;

  const setHidden = async (videoId: string, hidden: boolean, title?: string) => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    setBusyId(videoId);
    try {
      await databases.updateDocument(dbId, videosColId, videoId, { hidden } as any);
      setDbVideos(dbVideos.map((v: any) => (v.$id === videoId ? { ...v, hidden } : v)));
      await logAdminAction(user, { action: hidden ? 'video.hide' : 'video.unhide', target: videoId, targetName: title || '', details: hidden ? 'Hidden from feeds' : 'Returned to feeds' });
    } catch (err: any) {
      console.error('setHidden failed:', err);
      if (String(err?.message || '').toLowerCase().includes('unknown attribute')) setSchemaHint(true);
      else alert('Failed: ' + (err?.message || err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteItem = async (videoId: string, title?: string) => {
    if (!window.confirm(language === 'ru' ? 'Удалить навсегда?' : 'Delete permanently?')) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    setBusyId(videoId);
    try {
      await databases.deleteDocument(dbId, videosColId, videoId);
      setDbVideos(dbVideos.filter((v: any) => v.$id !== videoId));
      await logAdminAction(user, { action: 'video.delete', target: videoId, targetName: title || '' });
    } catch (err: any) {
      alert('Failed: ' + (err?.message || err));
    } finally {
      setBusyId(null);
    }
  };

  const clearAvatar = async (docId: string, name?: string) => {
    if (!window.confirm(language === 'ru' ? `Снять аватар у ${name || 'пользователя'}?` : `Remove avatar of ${name || 'user'}?`)) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    if (!dbId || !usersColId) return;
    setBusyId(docId);
    try {
      await databases.updateDocument(dbId, usersColId, docId, { avatar: '' });
      await logAdminAction(user, { action: 'user.avatar_clear', target: docId, targetName: name || '' });
    } catch (err: any) {
      alert('Failed: ' + (err?.message || err));
    } finally {
      setBusyId(null);
    }
  };

  const autoHideByReports = async () => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    setAutoHideMsg(null);
    const victims = [...reportCounts.entries()].filter(([, n]) => n >= AUTO_HIDE_THRESHOLD);
    if (victims.length === 0) {
      setAutoHideMsg(language === 'ru' ? `Нет контента с ${AUTO_HIDE_THRESHOLD}+ жалобами.` : `No content with ${AUTO_HIDE_THRESHOLD}+ reports.`);
      return;
    }
    let hiddenCount = 0;
    for (const [videoId, n] of victims) {
      const v = dbVideos.find((x: any) => x.$id === videoId);
      if (!v || v.hidden) continue;
      try {
        await databases.updateDocument(dbId, videosColId, videoId, { hidden: true } as any);
        hiddenCount++;
        await logAdminAction(user, { action: 'video.autohide', target: videoId, targetName: v.title || '', details: `${n} reports (≥${AUTO_HIDE_THRESHOLD})` });
      } catch (err: any) {
        if (String(err?.message || '').toLowerCase().includes('unknown attribute')) { setSchemaHint(true); break; }
      }
    }
    setDbVideos(dbVideos.map((v: any) => (reportCounts.get(v.$id) || 0) >= AUTO_HIDE_THRESHOLD ? { ...v, hidden: true } : v));
    setAutoHideMsg(language === 'ru' ? `Скрыто: ${hiddenCount}.` : `Hidden: ${hiddenCount}.`);
  };

  const tabs = [
    { id: 'videos', label: language === 'ru' ? 'Видео' : 'Videos', icon: Film, count: videos.length },
    { id: 'shorts', label: 'Shorts', icon: Scissors, count: shorts.length },
    { id: 'photos', label: language === 'ru' ? 'Фото' : 'Photos', icon: ImageIcon, count: photos.length },
    { id: 'avatars', label: language === 'ru' ? 'Аватары' : 'Avatars', icon: Users, count: avatars.length },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">
            {language === 'ru' ? 'Очередь модерации' : 'Moderation Queue'}
          </h1>
          <p className="text-sm text-slate-400">{language === 'ru' ? 'Новое сверху. Скрытое не показывается в лентах.' : 'Newest first. Hidden items stay out of feeds.'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={hideHidden} onChange={e => setHideHidden(e.target.checked)} className="accent-[#70d6ff]" />
            {language === 'ru' ? 'Скрыть скрытые' : 'Hide hidden'}
          </label>
          <button
            onClick={autoHideByReports}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/25 transition-all text-xs font-bold"
            title={language === 'ru' ? `Скрыть всё с ${AUTO_HIDE_THRESHOLD}+ жалобами` : `Hide everything with ${AUTO_HIDE_THRESHOLD}+ reports`}
          >
            <ShieldAlert className="w-4 h-4" />
            {language === 'ru' ? `Автоскрытие (${AUTO_HIDE_THRESHOLD}+ жалоб)` : `Autohide (${AUTO_HIDE_THRESHOLD}+ reports)`}
          </button>
        </div>
      </div>

      {autoHideMsg && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {autoHideMsg}
        </div>
      )}

      {schemaHint && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <b>Appwrite → Databases → IcetubeDB → videos → Columns → +:</b> key <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">hidden</code>, type Boolean, default false, not required.
            {language === 'ru' ? ' Без этой колонки скрытие не работает (удаление работает).' : ' Hiding needs this column (deleting works anyway).'}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/5 pb-1 overflow-x-auto hide-scrollbar">
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setQueueTab(tb.id)}
            className={`flex items-center gap-2 px-4 pb-3 font-bold text-sm transition-all relative whitespace-nowrap ${queueTab === tb.id ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
          >
            <tb.icon className="w-4 h-4" />
            {tb.label}
            <span className="text-[10px] opacity-60">({tb.count})</span>
            {queueTab === tb.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
          </button>
        ))}
      </div>

      {queueTab !== 'avatars' ? (
        <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b ice-border">
                <tr>
                  <th className="px-4 py-4">{language === 'ru' ? 'Контент' : 'Content'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Жалобы' : 'Reports'}</th>
                  <th className="px-4 py-4">{language === 'ru' ? 'Статус' : 'Status'}</th>
                  <th className="px-4 py-4 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {list.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-16 text-slate-500 text-xs font-bold uppercase tracking-widest">{language === 'ru' ? 'Пусто' : 'Empty'}</td></tr>
                ) : list.map((v: any) => {
                  const n = reportCounts.get(v.$id) || 0;
                  const busy = busyId === v.$id;
                  return (
                    <tr key={v.$id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link to={v.contentType === 'photo' ? '/photos' : isShortLocal(v) ? `/shorts/${v.$id}` : `/watch/${v.$id}`} className="w-20 h-12 bg-black rounded-lg overflow-hidden shrink-0 border border-white/10 block">
                            {v.thumbnailUrl ? <img src={getOptimizedThumbnail(v.thumbnailUrl) || v.thumbnailUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" /> : null}
                          </Link>
                          <div className="min-w-0">
                            <div className="text-white font-bold text-sm truncate max-w-[220px]">{v.title || 'Untitled'}</div>
                            <div className="text-[11px] text-slate-500 truncate">{v.uploaderName || ''} · {v.views || 0} views · {v.$createdAt ? new Date(v.$createdAt).toLocaleDateString() : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {n > 0 ? (
                          <span className={`px-2 py-1 rounded text-[11px] font-black ${n >= AUTO_HIDE_THRESHOLD ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>{n}</span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {v.hidden ? (
                          <span className="px-2 py-1 rounded text-[10px] font-black uppercase bg-slate-500/15 text-slate-400 border border-white/10 flex items-center gap-1 w-fit"><EyeOff className="w-3 h-3" /> {language === 'ru' ? 'Скрыто' : 'Hidden'}</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit"><Eye className="w-3 h-3" /> {language === 'ru' ? 'Видно' : 'Visible'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button disabled={busy} onClick={() => setHidden(v.$id, !v.hidden, v.title)} title={v.hidden ? (language === 'ru' ? 'Показать' : 'Unhide') : (language === 'ru' ? 'Скрыть' : 'Hide')} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-300 disabled:opacity-40">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : v.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button disabled={busy} onClick={() => deleteItem(v.$id, v.title)} title={language === 'ru' ? 'Удалить' : 'Delete'} className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition-all disabled:opacity-40">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {avatars.length === 0 && <div className="col-span-full text-center py-16 text-slate-500 text-xs font-bold uppercase tracking-widest">{language === 'ru' ? 'Пусто' : 'Empty'}</div>}
          {avatars.map((u: any) => (
            <div key={u.$id} className="bg-white/5 border ice-border rounded-2xl p-4 flex flex-col items-center gap-2">
              <img src={u.avatar} alt={u.name} className="w-16 h-16 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" loading="lazy" />
              <div className="text-sm font-bold text-white truncate max-w-full">{u.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-full">{u.userId}</div>
              <div className="flex gap-2 mt-1">
                <Link to={`/channel/${u.userId}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10">{language === 'ru' ? 'Канал' : 'Channel'}</Link>
                <button disabled={busyId === u.$id} onClick={() => clearAvatar(u.$id, u.name)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-40">
                  {language === 'ru' ? 'Снять' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isShortLocal(v: any) {
  return v.contentType === 'shorts' || v.isShort || v.isShorts;
}
