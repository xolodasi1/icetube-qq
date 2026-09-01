import { Home, Compass, Plus, Library, User, Video, ListVideo, X, Sparkles, Smartphone, Image } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useState } from "react";
import { useLanguage } from "../../language/LanguageContext";
import { useAuth } from "../../auth/AuthContext";
import { UploadChoiceModal } from "../../components/UploadChoiceModal";
import { UploadModal } from "../../studio/UploadModal";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, login } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showYou, setShowYou] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialType, setUploadInitialType] = useState<'video'|'shorts'|'photo'>('video');

  if (location.pathname.startsWith("/shorts")) return null;

  const haptic = () => {
    try { (navigator as any).vibrate?.(12); } catch {}
  };

  const isStudio = location.pathname.startsWith('/studio');
  const handleChoiceSelect = (type: 'video'|'shorts'|'photo') => {
    setShowCreate(false);
    setUploadInitialType(type);
    if (isStudio) {
      setIsUploadOpen(true);
    } else {
      navigate('/studio');
      setTimeout(() => setIsUploadOpen(true), 250);
    }
  };
  const handleCreateClick = () => {
    haptic();
    if (!user) { login(); return; }
    if (isStudio) {
      setUploadInitialType('video');
      setIsUploadOpen(true);
    } else {
      setShowCreate(v=>!v);
    }
  };

  const items: Array<{ id: string; icon: any; label: string; path?: string; active?: boolean; center?: boolean; action?: () => void }> = [
    { id: "home", icon: Home, label: t('nav_home'), path: "/", active: location.pathname === "/" && !location.search.includes("category") },
    { id: "browse", icon: Compass, label: t('nav_browse'), path: "/browse", active: location.pathname === "/browse" },
    { id: "create", icon: Plus, label: "", center: true, action: handleCreateClick },
    { id: "library", icon: Library, label: t('nav_library'), path: "/library", active: location.pathname.startsWith("/library") },
    { id: "you", icon: User, label: t('nav_you'), active: location.pathname.startsWith("/channel") || location.pathname.startsWith("/you"), action: () => { haptic(); setShowYou(v=>!v); } },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="mx-auto max-w-[600px] px-2 pb-[calc(6px+env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center justify-between gap-1 rounded-[24px] bg-[#0b1220]/90 backdrop-blur-2xl border border-white/10 px-2 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(112,214,255,0.08)_inset]">
            {items.map((it) => {
              const Icon = it.icon;
              if (it.center) {
                return (
                  <button key={it.id} onClick={it.action} className="relative flex flex-col items-center justify-center -mt-1 active:scale-95 transition-transform">
                    <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#70d6ff] via-[#3b82f6] to-[#6a00ff] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(112,214,255,0.45),0_0_0_1px_rgba(255,255,255,0.3)_inset]">
                      <Plus className="w-7 h-7 stroke-[2.8]" />
                    </div>
                  </button>
                );
              }
              if (it.action) {
                return (
                  <button key={it.id} onClick={it.action} className={clsx("flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all active:scale-95", it.active ? "text-white" : "text-slate-400")}>
                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center transition-all", it.active ? "bg-white text-black shadow-md" : "bg-transparent")}>
                      <Icon className={clsx("w-5 h-5", it.active && "fill-current")} />
                    </div>
                    <span className={clsx("text-[10px] font-semibold tracking-tight leading-none", it.active ? "text-white" : "text-slate-500")}>{it.label}</span>
                  </button>
                );
              }
              return (
                <Link key={it.id} to={it.path!} onClick={haptic} className={clsx("flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all active:scale-95", it.active ? "text-white" : "text-slate-400")}>
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center transition-all", it.active ? "bg-white text-black shadow-md" : "bg-transparent group")}>
                    <Icon className={clsx("w-5 h-5 transition-colors", it.active ? "fill-black/10" : "")} />
                  </div>
                  <span className={clsx("text-[10px] font-semibold tracking-tight leading-none", it.active ? "text-white" : "text-slate-500")}>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showCreate && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3 sm:hidden animate-in fade-in duration-200" onClick={() => setShowCreate(false)}>
            <div onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-[24px] bg-[#0f1115] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
              <div className="p-5 pb-3 flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#70d6ff]" /> {language === 'ru' ? 'Что загрузим?' : 'What to upload?'}</span>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 grid gap-3 pb-6">
                <button onClick={()=>handleChoiceSelect('video')} className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br from-[#70d6ff]/20 to-blue-600/20 border-[#70d6ff]/30 text-white active:scale-[0.99] transition-transform text-left">
                  <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0"><Video className="w-6 h-6" /></div>
                  <div className="flex-1"><div className="font-bold">{language === 'ru' ? 'Видео' : 'Video'}</div><div className="text-xs text-white/60">{language === 'ru' ? 'Обычное видео до 10 ГБ' : 'Standard video up to 10GB'}</div></div>
                </button>
                <button onClick={()=>handleChoiceSelect('shorts')} className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 text-white active:scale-[0.99] transition-transform text-left">
                  <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0"><Smartphone className="w-6 h-6" /></div>
                  <div className="flex-1"><div className="font-bold">Shorts</div><div className="text-xs text-white/60">{language === 'ru' ? 'Вертикальный Short до 60с' : 'Vertical Short up to 60s'}</div></div>
                </button>
                <button onClick={()=>handleChoiceSelect('photo')} className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-white active:scale-[0.99] transition-transform text-left">
                  <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0"><Image className="w-6 h-6" /></div>
                  <div className="flex-1"><div className="font-bold">{language === 'ru' ? 'Фото' : 'Photo'}</div><div className="text-xs text-white/60">{language === 'ru' ? 'Изображение до 50 МБ' : 'Image up to 50MB'}</div></div>
                </button>
              </div>
            </div>
          </div>
        )}

      {showYou && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3 sm:hidden animate-in fade-in duration-200" onClick={() => setShowYou(false)}>
            <div onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-[24px] bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
              <div className="p-5 pb-2 flex items-center justify-between">
                <span className="text-white font-bold">{t('nav_you')}</span>
                <button onClick={()=>setShowYou(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 grid gap-2 pb-6">
                <Link to="/channel/me" onClick={()=>setShowYou(false)} className="flex items-center gap-3 p-4 rounded-2xl bg-white text-black font-bold active:scale-[0.99] transition-transform"><User className="w-5 h-5" /> {t('nav_go_to_channel')}</Link>
                <Link to="/studio" onClick={()=>setShowYou(false)} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white active:scale-[0.99] transition-transform"><Video className="w-5 h-5 text-[#70d6ff]" /> {t('nav_go_to_studio')}</Link>
                <Link to="/library" onClick={()=>setShowYou(false)} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white"><Library className="w-5 h-5" /> {t('nav_library')}</Link>
              </div>
            </div>
          </div>
        )}
      <UploadModal isOpen={isUploadOpen} onClose={()=>setIsUploadOpen(false)} initialType={uploadInitialType} />
    </>
  );
}
