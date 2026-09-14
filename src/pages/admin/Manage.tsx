import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Tags, Rocket, Trash2, Pin, ArrowUp, ArrowDown, Save, Plus, X, AlertTriangle, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { useAuth } from '../../auth/AuthContext';
import { logAdminAction } from '../../lib/admin';
import { getSetting, setSetting, type AnnouncementSetting, type CategoriesSetting } from '../../lib/siteSettings';

function SettingsMissing({ language }: any) {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-sm text-amber-200">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
      <div>
        <b>Appwrite → Databases → IcetubeDB → + Create collection:</b> ID <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">settings</code>,
        attribute <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono">data</code> (String, size 10000, not required).
        {language === 'ru' ? ' Без неё анонсы, категории и промо не сохранятся.' : ' Announcements, categories and promo need it.'}
      </div>
    </div>
  );
}

export default function ManageSection({ dbVideos, setDbVideos, dbUsers, language }: any) {
  const { user } = useAuth();
  const [settingsMissing, setSettingsMissing] = useState(false);

  // ---- Announcement ----
  const [annText, setAnnText] = useState('');
  const [annActive, setAnnActive] = useState(false);
  const [annBusy, setAnnBusy] = useState(false);
  const [annMsg, setAnnMsg] = useState<string | null>(null);

  // ---- Categories ----
  const [catHidden, setCatHidden] = useState<string[]>([]);
  const [catOrder, setCatOrder] = useState<string[]>([]);
  const [catRenames, setCatRenames] = useState<Record<string, string>>({});
  const [catBusy, setCatBusy] = useState(false);
  const [catMsg, setCatMsg] = useState<string | null>(null);

  // ---- Promo ----
  const [promoIds, setPromoIds] = useState<string[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  // ---- Cleanup ----
  const [scan, setScan] = useState<{ orphans: any[]; empty: any[] } | null>(null);
  const [cleanBusy, setCleanBusy] = useState(false);
  const [cleanMsg, setCleanMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [ann, cats, promo] = await Promise.all([
        getSetting('announcement') as Promise<AnnouncementSetting | null>,
        getSetting('categories') as Promise<CategoriesSetting | null>,
        getSetting('promo') as Promise<{ videoIds?: string[] } | null>,
      ]);
      if (ann) { setAnnText(ann.text || ''); setAnnActive(!!ann.active); }
      if (cats) {
        setCatHidden(cats.hidden || []);
        setCatOrder(cats.order || []);
        setCatRenames(cats.renames || {});
      }
      if (promo?.videoIds) setPromoIds(promo.videoIds);
    })();
  }, []);

  const allCats = useMemo(() => {
    const m = new Map<string, number>();
    dbVideos.forEach((v: any) => {
      const c = (v.category || '').trim();
      if (c && c.toLowerCase() !== 'all' && c.toLowerCase() !== 'все') m.set(c, (m.get(c) || 0) + 1);
    });
    const names = [...m.keys()];
    const ordered = [...catOrder.filter(c => names.includes(c)), ...names.filter(c => !catOrder.includes(c)).sort((a, b) => a.localeCompare(b))];
    return ordered.map(name => ({ name, count: m.get(name) || 0, hidden: catHidden.includes(name), rename: catRenames[name] || '' }));
  }, [dbVideos, catHidden, catOrder, catRenames]);

  const publishAnnouncement = async () => {
    setAnnBusy(true); setAnnMsg(null);
    const r = await setSetting('announcement', { text: annText.trim(), active: annActive, updatedAt: Date.now() });
    if (r.missing) setSettingsMissing(true);
    else {
      setAnnMsg(r.ok ? (language === 'ru' ? 'Опубликовано.' : 'Published.') : (language === 'ru' ? 'Ошибка сохранения.' : 'Save failed.'));
      if (r.ok) await logAdminAction(user, { action: annActive ? 'announce.publish' : 'announce.unpublish', details: annText.trim().slice(0, 120) });
    }
    setAnnBusy(false);
  };

  const saveCategories = async () => {
    setCatBusy(true); setCatMsg(null);
    const r = await setSetting('categories', { hidden: catHidden, order: catOrder, renames: catRenames });
    if (r.missing) setSettingsMissing(true);
    else {
      setCatMsg(r.ok ? (language === 'ru' ? 'Сохранено.' : 'Saved.') : (language === 'ru' ? 'Ошибка.' : 'Failed.'));
      if (r.ok) await logAdminAction(user, { action: 'categories.save', details: `hidden=${catHidden.length}` });
    }
    setCatBusy(false);
  };

  const moveCat = (name: string, dir: -1 | 1) => {
    const base = allCats.map(c => c.name);
    const i = base.indexOf(name);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= base.length) return;
    const next = [...base];
    [next[i], next[j]] = [next[j], next[i]];
    setCatOrder(next);
  };

  const parseVideoId = (input: string): string => {
    const s = input.trim();
    if (!s) return '';
    const m = s.match(/[?&]v=([A-Za-z0-9_-]+)/) || s.match(/\/watch\/([A-Za-z0-9_-]+)/) || s.match(/\/shorts\/([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    return s.split('/').pop() || s;
  };

  const savePromo = async (ids: string[]) => {
    setPromoBusy(true); setPromoMsg(null);
    const r = await setSetting('promo', { videoIds: ids });
    if (r.missing) setSettingsMissing(true);
    else {
      setPromoMsg(r.ok ? (language === 'ru' ? 'Сохранено.' : 'Saved.') : (language === 'ru' ? 'Ошибка.' : 'Failed.'));
      if (r.ok) await logAdminAction(user, { action: 'promo.save', details: ids.join(',') });
    }
    setPromoBusy(false);
  };

  const runScan = () => {
    const userIds = new Set((dbUsers || []).flatMap((u: any) => [u.userId, u.$id].filter(Boolean)));
    const orphans = dbVideos.filter((v: any) => v.uploaderId && !userIds.has(v.uploaderId));
    const empty = dbVideos.filter((v: any) => !v.videoUrl && !v.thumbnailUrl);
    setScan({ orphans, empty });
    setCleanMsg(null);
  };

  const deleteIds = async (ids: string[], kind: string) => {
    if (ids.length === 0) return;
    if (!window.confirm(language === 'ru' ? `Удалить ${ids.length} шт. (${kind})?` : `Delete ${ids.length} (${kind})?`)) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    setCleanBusy(true);
    let n = 0;
    for (const vid of ids) {
      try { await databases.deleteDocument(dbId, videosColId, vid); n++; } catch {}
    }
    setDbVideos(dbVideos.filter((v: any) => !ids.includes(v.$id)));
    setScan(null);
    setCleanMsg(language === 'ru' ? `Удалено: ${n}.` : `Deleted: ${n}.`);
    await logAdminAction(user, { action: 'cleanup.delete', details: `${kind}: ${n}` });
    setCleanBusy(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">{language === 'ru' ? 'Управление' : 'Manage'}</h1>
        <p className="text-sm text-slate-400">{language === 'ru' ? 'Анонсы, категории, промо и чистка — без деплоя.' : 'Announcements, categories, promo and cleanup — no deploy needed.'}</p>
      </div>

      {settingsMissing && <SettingsMissing language={language} />}

      {/* Announcement */}
      <section className="bg-white/5 border ice-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Megaphone className="w-5 h-5 text-[#70d6ff]" /> {language === 'ru' ? 'Глобальное объявление' : 'Global announcement'}</h2>
        <p className="text-xs text-slate-500 mb-4">{language === 'ru' ? 'Баннер для всех пользователей поверх сайта.' : 'Banner for all users on top of the site.'}</p>
        <textarea value={annText} onChange={e => setAnnText(e.target.value)} rows={2} placeholder={language === 'ru' ? 'Техработы сегодня в 3:00…' : 'Maintenance at 3:00 AM…'}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#70d6ff] mb-3" />
        {annText.trim() && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-sm text-amber-100">{language === 'ru' ? 'Предпросмотр: ' : 'Preview: '}{annText.trim()}</div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={annActive} onChange={e => setAnnActive(e.target.checked)} className="accent-[#70d6ff] w-4 h-4" />
            {language === 'ru' ? 'Показывать' : 'Active'}
          </label>
          <button onClick={publishAnnouncement} disabled={annBusy} className="flex items-center gap-2 px-4 py-2 bg-[#70d6ff] text-black text-sm font-bold rounded-xl hover:bg-[#5bc0e6] disabled:opacity-50">
            {annBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {language === 'ru' ? 'Опубликовать' : 'Publish'}
          </button>
          {annMsg && <span className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{annMsg}</span>}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white/5 border ice-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Tags className="w-5 h-5 text-[#70d6ff]" /> {language === 'ru' ? 'Категории главной' : 'Home categories'}</h2>
        <p className="text-xs text-slate-500 mb-4">{language === 'ru' ? 'Скрыть, переименовать, поменять порядок. Системные «Все/Новые/Популярные» не трогаем.' : 'Hide, rename, reorder. System pills stay.'}</p>
        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 mb-4">
          {allCats.length === 0 && <div className="text-sm text-slate-500">{language === 'ru' ? 'Категорий пока нет.' : 'No categories yet.'}</div>}
          {allCats.map(c => (
            <div key={c.name} className={`flex items-center gap-2 p-2.5 rounded-xl border ${c.hidden ? 'bg-black/30 border-white/5 opacity-60' : 'bg-black/20 border-white/10'}`}>
              <input type="checkbox" checked={!c.hidden} onChange={e => {
                setCatHidden(e.target.checked ? catHidden.filter(x => x !== c.name) : [...catHidden, c.name]);
              }} title={language === 'ru' ? 'Показывать' : 'Visible'} className="accent-[#70d6ff] w-4 h-4 shrink-0" />
              <span className="text-sm font-bold text-white truncate min-w-[80px] max-w-[160px]">{c.name}</span>
              <span className="text-[10px] text-slate-500 shrink-0">{c.count}</span>
              <input value={c.rename} onChange={e => setCatRenames({ ...catRenames, [c.name]: e.target.value })} placeholder={language === 'ru' ? 'Переименовать…' : 'Rename…'}
                className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#70d6ff]" />
              <button onClick={() => moveCat(c.name, -1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => moveCat(c.name, 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveCategories} disabled={catBusy} className="flex items-center gap-2 px-4 py-2 bg-[#70d6ff] text-black text-sm font-bold rounded-xl hover:bg-[#5bc0e6] disabled:opacity-50">
            {catBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {language === 'ru' ? 'Сохранить' : 'Save'}
          </button>
          {catMsg && <span className="text-xs text-slate-400">{catMsg}</span>}
        </div>
      </section>

      {/* Promo */}
      <section className="bg-white/5 border ice-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Rocket className="w-5 h-5 text-[#70d6ff]" /> {language === 'ru' ? 'Промо-слоты' : 'Promo slots'}</h2>
        <p className="text-xs text-slate-500 mb-4">{language === 'ru' ? 'Закреплённые видео показываются первыми на главной. Вставь ссылку или ID.' : 'Pinned videos go first on Home. Paste a link or ID.'}</p>
        <div className="flex gap-2 mb-4">
          <input value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="https://…/watch/xxxx  /  xxxx"
            className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#70d6ff]" />
          <button onClick={() => {
            const vid = parseVideoId(promoInput);
            if (vid && !promoIds.includes(vid)) { const next = [...promoIds, vid]; setPromoIds(next); savePromo(next); }
            setPromoInput('');
          }} className="flex items-center gap-1 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white hover:bg-white/15 shrink-0">
            <Plus className="w-4 h-4" /> {language === 'ru' ? 'Добавить' : 'Add'}
          </button>
        </div>
        <div className="space-y-2">
          {promoIds.length === 0 && <div className="text-sm text-slate-500">{language === 'ru' ? 'Пусто.' : 'Empty.'}</div>}
          {promoIds.map(pid => {
            const v = dbVideos.find((x: any) => x.$id === pid);
            return (
              <div key={pid} className="flex items-center gap-3 p-2.5 bg-black/20 border border-[#70d6ff]/20 rounded-xl">
                <Pin className="w-4 h-4 text-[#70d6ff] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{v?.title || pid}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{pid} · {v ? `${v.views || 0} views` : (language === 'ru' ? 'видео не найдено' : 'video not found')}</div>
                </div>
                {v && <Link to={`/watch/${pid}`} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><Eye className="w-4 h-4" /></Link>}
                <button onClick={() => { const next = promoIds.filter(x => x !== pid); setPromoIds(next); savePromo(next); }} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
        {promoMsg && <div className="text-xs text-slate-400 mt-3">{promoMsg}</div>}
        {promoBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-500 mt-3" />}
      </section>

      {/* Cleanup */}
      <section className="bg-white/5 border ice-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Trash2 className="w-5 h-5 text-[#70d6ff]" /> {language === 'ru' ? 'Чистка мусора' : 'Cleanup'}</h2>
        <p className="text-xs text-slate-500 mb-4">{language === 'ru' ? 'Видео без автора (аккаунт удалён) и записи без файлов.' : 'Videos without author and records without files.'}</p>
        {!scan ? (
          <button onClick={runScan} className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white hover:bg-white/15">
            {language === 'ru' ? 'Просканировать' : 'Scan now'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-black/20 border border-white/10 rounded-xl">
                <div className="text-2xl font-black text-white">{scan.orphans.length}</div>
                <div className="text-xs text-slate-400">{language === 'ru' ? 'без автора' : 'orphaned'}</div>
                {scan.orphans.length > 0 && (
                  <button disabled={cleanBusy} onClick={() => deleteIds(scan.orphans.map((v: any) => v.$id), language === 'ru' ? 'без автора' : 'orphaned')}
                    className="mt-2 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/25 disabled:opacity-50">
                    {language === 'ru' ? 'Удалить все' : 'Delete all'}
                  </button>
                )}
              </div>
              <div className="p-4 bg-black/20 border border-white/10 rounded-xl">
                <div className="text-2xl font-black text-white">{scan.empty.length}</div>
                <div className="text-xs text-slate-400">{language === 'ru' ? 'без файлов' : 'no files'}</div>
                {scan.empty.length > 0 && (
                  <button disabled={cleanBusy} onClick={() => deleteIds(scan.empty.map((v: any) => v.$id), language === 'ru' ? 'без файлов' : 'no files')}
                    className="mt-2 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/25 disabled:opacity-50">
                    {language === 'ru' ? 'Удалить все' : 'Delete all'}
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => setScan(null)} className="text-xs text-slate-500 hover:text-white">{language === 'ru' ? 'Скрыть результат' : 'Hide results'}</button>
          </div>
        )}
        {cleanMsg && <div className="text-xs text-emerald-400 mt-3">{cleanMsg}</div>}
      </section>
    </div>
  );
}
