import { Home, Compass, Plus, Library, User, Video, ListVideo, X, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useState } from "react";
import { useLanguage } from "../../language/LanguageContext";
import { motion, AnimatePresence } from "motion";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [showYou, setShowYou] = useState(false);

  if (location.pathname.startsWith("/shorts")) return null;

  const haptic = () => {
    try { (navigator as any).vibrate?.(12); } catch {}
  };

  const items: Array<{ id: string; icon: any; label: string; path?: string; active?: boolean; center?: boolean; action?: () => void }> = [
    { id: "home", icon: Home, label: t('nav_home'), path: "/", active: location.pathname === "/" && !location.search.includes("category") },
    { id: "browse", icon: Compass, label: t('nav_browse'), path: "/browse", active: location.pathname === "/browse" },
    { id: "create", icon: Plus, label: "", center: true, action: () => { haptic(); setShowCreate(v=>!v); } },
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
                  <button key={it.id} onClick={it.action} className="relative flex flex-col items-center justify-center -mt-1">
                    <motion.div whileTap={{ scale: 0.92 }} className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#70d6ff] via-[#3b82f6] to-[#6a00ff] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(112,214,255,0.45),0_0_0_1px_rgba(255,255,255,0.3)_inset]">
                      <Plus className="w-7 h-7 stroke-[2.8]" />
                    </motion.div>
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

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3 sm:hidden" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-[24px] bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
              <div className="p-5 pb-3 flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#70d6ff]" /> {t('nav_create')}</span>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 pb-6">
                <button onClick={()=>{ setShowCreate(false); navigate("/studio/content"); }} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-[#70d6ff]/20 to-blue-600/20 border border-[#70d6ff]/20 text-white active:scale-[0.98] transition-transform">
                  <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center"><Video className="w-6 h-6" /></div>
                  <span className="font-bold text-sm">{t('nav_upload')}</span>
                  <span className="text-xs text-white/60">Видео, Shorts, Фото</span>
                </button>
                <button onClick={()=>{ setShowCreate(false); navigate("/playlists"); }} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.06] border border-white/10 text-white active:scale-[0.98] transition-transform">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><ListVideo className="w-6 h-6 text-[#70d6ff]" /></div>
                  <span className="font-bold text-sm">{t('nav_playlists')}</span>
                  <span className="text-xs text-white/60">Собрать плейлист</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showYou && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-3 sm:hidden" onClick={() => setShowYou(false)}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", damping: 26, stiffness: 320 }} onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-[24px] bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
