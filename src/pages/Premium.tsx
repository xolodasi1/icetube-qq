import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { Crown, Check, Zap, Download, Moon, Sparkles, Sliders, ShieldCheck, PlayCircle, Eye } from "lucide-react";

export default function Premium() {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [isPremium, setIsPremium] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [pipEnabled, setPipEnabled] = useState(true);
  const [customSpeed, setCustomSpeed] = useState("1.5");
  const [timerAlert, setTimerAlert] = useState<string | null>(null);

  useEffect(() => {
    // Check initial premium state
    const saved = localStorage.getItem("icetube_premium_enabled") === "true";
    setIsPremium(saved);
    
    // Check initial ambient/pip settings
    const cachedAmbient = localStorage.getItem("icetube_premium_ambient") !== "false";
    setAmbientEnabled(cachedAmbient);
    
    const cachedPip = localStorage.getItem("icetube_premium_pip") !== "false";
    setPipEnabled(cachedPip);
  }, []);

  const togglePremium = () => {
    const newState = !isPremium;
    setIsPremium(newState);
    localStorage.setItem("icetube_premium_enabled", String(newState));
    
    // Dispatch global event for realtime header status refresh
    window.dispatchEvent(new CustomEvent("icetube_premium_changed", { 
      detail: { isPremium: newState } 
    }));

    // Trigger XP achievement action!
    try {
      const xpEvent = new CustomEvent('icetube_add_xp', {
        detail: { 
          amount: newState ? 150 : 0, 
          reason: newState ? 'Premium Activation' : 'Canceling Trial' 
        }
      });
      window.dispatchEvent(xpEvent);
    } catch (e) {}

    setTimerAlert(
      newState 
        ? (language === "ru" ? "Премиум успешно активирован! Корона добавлена к вашему профилю." : "Premium successfully activated! A golden crown badge has been added to your profile.")
        : (language === "ru" ? "Премиум подписка приостановлена." : "Premium subscription deactivated.")
    );
    setTimeout(() => setTimerAlert(null), 4000);
  };

  const toggleAmbient = () => {
    const val = !ambientEnabled;
    setAmbientEnabled(val);
    localStorage.setItem("icetube_premium_ambient", String(val));
    window.dispatchEvent(new CustomEvent("icetube_ambient_changed", { detail: { enabled: val } }));
  };

  const togglePip = () => {
    const val = !pipEnabled;
    setPipEnabled(val);
    localStorage.setItem("icetube_premium_pip", String(val));
  };

  const handleSpeedChange = (speed: string) => {
    setCustomSpeed(speed);
    localStorage.setItem("icetube_premium_speed", speed);
  };

  const premiumFeatures = [
    {
      icon: Sparkles,
      title: language === "ru" ? "Режим Ambilight (Ambient Свечение)" : "Ambient Halo Glow Mode",
      desc: language === "ru" ? "Глубокое визуальное погружение со световой аурой вокруг плеера, меняющей цвета под видео." : "A colorful neon backlighting aura behind the video player that pulses matching the video colors.",
      control: (
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={ambientEnabled} 
            onChange={toggleAmbient} 
            disabled={!isPremium}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#70d6ff] peer-checked:after:bg-black peer-disabled:opacity-40"></div>
        </label>
      )
    },
    {
      icon: Moon,
      title: language === "ru" ? "Управление Таймером Сна" : "Sleep Timer Automation",
      desc: language === "ru" ? "Автоматическое выключение или приостановка воспроизведения через заданное время." : "Set a customized shutdown timer on the video screen to drift to sleep smoothly.",
      control: (
        <span className="text-xs font-mono text-[#70d6ff] bg-white/5 border ice-border px-2.5 py-1 rounded-lg">
          {isPremium ? (language === "ru" ? "Доступно в плеере" : "Active in Player") : (language === "ru" ? "При заблокировано" : "Locked")}
        </span>
      )
    },
    {
      icon: Sliders,
      title: language === "ru" ? "Сверхскоростной Мотор Воспроизведения" : "Overdrive Speed Controls",
      desc: language === "ru" ? "Разблокируйте супер-скорости воспроизведения до 3.0x и плавный шаг вплоть до 0.25x." : "Unlock high-precision speeds up to 3.0x and precision slow speeds down to 0.25x.",
      control: (
        <select 
          value={customSpeed} 
          onChange={(e) => handleSpeedChange(e.target.value)} 
          disabled={!isPremium}
          className="bg-black/40 border ice-border text-xs text-[#70d6ff] rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-[#70d6ff] disabled:opacity-40 cursor-pointer"
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="1.75">1.75x</option>
          <option value="2.0">2.0x</option>
          <option value="2.5">2.5x</option>
          <option value="3.0">3.0x</option>
        </select>
      )
    },
    {
      icon: Download,
      title: language === "ru" ? "Офлайн-Хранилище Премиум" : "Offline Download Vault",
      desc: language === "ru" ? "Оригинальное скачивание высокой точности прямо в локальную медиатеку вашего браузера." : "High-fidelity simulated offline saving to access content with absolute network independence.",
      control: (
        <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-md font-bold">
          {isPremium ? "Unlocked" : "Locked"}
        </span>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      
      {/* Toast Alert Banner */}
      {timerAlert && (
        <div className="fixed bottom-24 right-6 bg-[#070b13]/95 border-2 border-[#70d6ff] shadow-[0_0_20px_rgba(112,214,255,0.4)] text-[#70d6ff] px-6 py-4 rounded-xl z-50 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
          <span>{timerAlert}</span>
        </div>
      )}

      {/* Decorative Premium Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#70d6ff]/30 bg-gradient-to-br from-[#0c1824] via-[#050c12] to-[#040608] p-8 sm:p-12 mb-10 shadow-[0_0_50px_rgba(112,214,255,0.08)]">
        
        {/* Ice crystals background accents */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#70d6ff]/20 to-transparent blur-2xl pointer-events-none"></div>
        <div className="absolute left-10 bottom-[-50px] w-72 h-32 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-[#70d6ff]/10 border border-[#70d6ff]/30 rounded-full text-[#70d6ff] text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_12px_rgba(112,214,255,0.1)]">
              <Crown className="w-3.5 h-3.5" />
              <span>Icetube Premium VIP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-none mb-4">
              {language === "ru" ? "Сверхспособности" : "Next-Gen Audio &"}<br />
              <span className="text-[#70d6ff] bg-clip-text bg-gradient-to-r from-[#70d6ff] to-[#00f0ff]">
                {language === "ru" ? "Вашего Плеера" : "Visual Superpowers"}
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mt-2 font-medium leading-relaxed">
              {language === "ru" 
                ? "Активируйте премиум бесплатно и разблокируйте бесконечное удовольствие от просмотра: свечение Ambilight, таймер сна, сверхскорости и золотую корону рядом с вашим аватаром."
                : "Unlock full command over your watching loop instantly. Neon outline lighting, automated sleep routines, download vault integration, and a sleek crown insignia next to your name."}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center p-6 rounded-2xl bg-white/[0.02] border ice-border min-w-[240px] text-center backdrop-blur-md">
            <div className="relative mb-3">
              <Crown className={`w-14 h-14 ${isPremium ? 'text-yellow-400 animate-bounce' : 'text-slate-500'}`} style={{ animationDuration: "2s" }} />
              {isPremium && (
                <span className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse"></span>
              )}
            </div>
            
            <div className="text-xl font-bold text-white mb-1">
              {isPremium ? (language === "ru" ? "АКТИВЕН" : "ACTIVE") : (language === "ru" ? "БЕСПЛАТНЫЙ ТЕСТ" : "FREE TRIAL")}
            </div>
            <div className="text-xs text-slate-500 font-medium mb-5">
              {isPremium 
                ? (language === "ru" ? "С короной профиля v2.1.2" : "With profile crown v2.1.2") 
                : (language === "ru" ? "Мгновенное подключение" : "Instant activation")}
            </div>

            <button
              onClick={togglePremium}
              className={`w-full py-3 px-6 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer shadow-lg ${
                isPremium 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' 
                  : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:scale-105 shadow-amber-500/20'
              }`}
            >
              {isPremium 
                ? (language === "ru" ? "Отключить Премиум" : "Deactivate Premium") 
                : (language === "ru" ? "Активировать Бесплатно" : "Activate For Free")}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Configuration Grid */}
      <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#70d6ff]" />
        <span>{language === "ru" ? "Управление Функциями" : "Feature Configuration Workspace"}</span>
      </h2>

      <div className="grid gap-4 mb-10">
        {premiumFeatures.map((feat, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
              isPremium 
                ? 'bg-white/5 border-white/[0.08] hover:bg-white/[0.07]' 
                : 'bg-black/20 border-white/[0.03] opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${isPremium ? 'bg-blue-500/10 text-[#70d6ff]' : 'bg-slate-800 text-slate-500'}`}>
                <feat.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  {feat.title}
                  {!isPremium && (
                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-sans uppercase">
                      Premium
                    </span>
                  )}
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
                  {feat.desc}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex justify-end shrink-0 sm:pt-0">
              {feat.control}
            </div>
          </div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-2">
          <ShieldCheck className="w-8 h-8 text-[#00ff80] shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">{language === "ru" ? "100% Безопасно" : "Secure sandboxing"}</h4>
            <p className="text-slate-500 text-xs mt-1">{language === "ru" ? "Интегрированный sandbox без внешних платёжных систем." : "Sandboxed directly on device with zero tracking overheads."}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-2">
          <Zap className="w-8 h-8 text-yellow-400 shrink-0 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-white">{language === "ru" ? "Молниеносный Кеш" : "High Performance Cache"}</h4>
            <p className="text-slate-500 text-xs mt-1">{language === "ru" ? "Активация мгновенно записывается в долгоиграющий localStorage." : "Active attributes are stored efficiently inside state records."}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-2">
          <Crown className="w-8 h-8 text-[#70d6ff] shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">{language === "ru" ? "Элитный Статус" : "Elite Creator Identity"}</h4>
            <p className="text-slate-500 text-xs mt-1">{language === "ru" ? "Излучайте уверенность с золотым статусом зрителя в комментариях." : "Gain the unique crown distinction inside interaction pools."}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
