import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { Radio, Users, Send, Heart, Flame, Sparkles, MessageSquare, Play, X, Eye, ThumbsUp, Plus } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  category: string;
  streamer: string;
  avatar: string;
  viewers: string;
  description: string;
  colorGrad: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  avatar: string;
  role?: 'moderator' | 'streamer' | 'user';
  timestamp: string;
}

export default function Live() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; symbol: string; left: number }[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPremiumUser, _setIsPremiumUser] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const emojiIdCounter = useRef(0);

  // Load premium status (deprecated - preserved for compatibility)
  useEffect(() => {
    _setIsPremiumUser(localStorage.getItem("icetube_premium_enabled") === "true");
  }, []);

  const streams: LiveStream[] = [
    {
      id: "live_1",
      title: language === "ru" ? "🔴 ОТЕЛИ И ГЛЭМПИНГ: Путешествия в Сибирь | 4K Прямой Эфир" : "🔴 Arctic Lofi Radio - Chill beats to study & rest your soul",
      category: "Music & Vibe",
      streamer: "GlacierBeats",
      avatar: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100&h=100&fit=crop",
      viewers: "12,453",
      description: "Welcome to the ultimate arctic relaxation deck. Tune in, chill down, and let the ice beats melt your everyday anxieties. Powered by Icefall Synth systems is active.",
      colorGrad: "from-blue-900 via-slate-900 to-[#070b13]"
    },
    {
      id: "live_2",
      title: language === "ru" ? "🎄 Северное Сияние и Костер на Озере | 24/7 Эмбиент" : "🎄 Aurora Borealis Cam - Live Real-time Lapland Feed",
      category: "Ambiance & Nature",
      streamer: "AuroraWatch",
      avatar: "https://images.unsplash.com/photo-1546483875-5f014b922c39?w=100&h=100&fit=crop",
      viewers: "4,192",
      description: "Streaming direct camera views from our lakeside cabin in Lapland, Finland. The high atmospheric activity has created vibrant frozen lights overhead tonight.",
      colorGrad: "from-emerald-950 via-zinc-900 to-black"
    },
    {
      id: "live_3",
      title: language === "ru" ? "🔥 Снежное Утро в Уютной Каюте | Камин и Звуки Метели" : "🔥 Cyberpunk City Speedrun 100% Ultra Graphics [RTX ON]",
      category: "Gaming",
      streamer: "FrostbiteGamer",
      avatar: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=100&h=100&fit=crop",
      viewers: "8,910",
      description: "Tearing through the cold streets under frozen neon skies. Going for the absolute world-record completion rating with custom cybernetic overdrive speed presets.",
      colorGrad: "from-purple-950 via-slate-950 to-[#050608]"
    },
    {
      id: "live_4",
      title: language === "ru" ? "❄️ Ледяное Выживание в Тайге: Строим Иглу в Снегопад" : "❄️ Absolute Zero Coding: Building a JS browser compiler live",
      category: "Science & Tech",
      streamer: "CodeGlaze",
      avatar: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=100&h=100&fit=crop",
      viewers: "1,540",
      description: "Live typescript module compilers written live without any structural blueprints. Exploring zero-dependency react render hooks and dynamic shadow visual canvases.",
      colorGrad: "from-[#0a1d2c] via-[#050e14] to-black"
    }
  ];

  // List of random simulated bot messages
  const randomUserNames = [
    "SnowFlake99", "GlacierWalker", "NeoGlow", "SiberianGuy", "IceCutter", 
    "CrystalQueen", "Frosty_JS", "FrostDev", "CyberChilly", "NordicCoder",
    "BlizzardMaster", "AlpineBreeze", "PolarAurora", "AuroraSiren", "CosmicGlaze"
  ];

  const randomTexts = [
    "This track is incredibly chill!",
    "Привет из Сибири! Очень атмосферный стрим 😊",
    "Wow, look at those neon reflections!",
    "Is this being hosted on Appwrite database?",
    "That combo was absolutely sick @FrostbiteGamer!!",
    "Who is playing the background synth pads?",
    "Can you turn on the sleep timer for the steam? Great ambient sounds.",
    "Subscribed! Amazing content guys.",
    "Best livestream on Icetube 2.0 so far ❄️❄️❄️",
    "Love from Canada! Simply breathtaking lights.",
    "Are you coding everything in TypeScript? Incredible speed.",
    "I active the Premium and the glowing bar looks stunning!",
    "Amazing visualizer patterns, simply beautiful."
  ];

  const avatars = [
    "https://ui-avatars.com/api/?name=SF&background=random",
    "https://ui-avatars.com/api/?name=GW&background=random",
    "https://ui-avatars.com/api/?name=NG&background=random",
    "https://ui-avatars.com/api/?name=IC&background=random",
    "https://ui-avatars.com/api/?name=FM&background=random",
    "https://ui-avatars.com/api/?name=AB&background=random",
    "https://ui-avatars.com/api/?name=PA&background=random"
  ];

  // Set up initial stream chat
  useEffect(() => {
    if (selectedStream) {
      setIsSubscribed(false);
      // Initialize with 10 random chats
      const initial: ChatMessage[] = Array.from({ length: 12 }).map((_, i) => {
        const u = randomUserNames[Math.floor(Math.random() * randomUserNames.length)];
        return {
          id: `msg_init_${i}`,
          user: u,
          text: randomTexts[Math.floor(Math.random() * randomTexts.length)],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u)}&background=random`,
          role: Math.random() > 0.85 ? 'moderator' : 'user',
          timestamp: new Date(Date.now() - (12 - i) * 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });
      setChatMessages(initial);
    }
  }, [selectedStream]);

  // Continuously push new chats
  useEffect(() => {
    if (!selectedStream) return;
    
    const interval = setInterval(() => {
      const u = randomUserNames[Math.floor(Math.random() * randomUserNames.length)];
      const text = randomTexts[Math.floor(Math.random() * randomTexts.length)];
      const r = Math.random() > 0.85 ? 'moderator' : 'user';
      
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        user: u,
        text: text,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u)}&background=random`,
        role: r,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => {
        const kept = prev.slice(-35); // Keep last 35
        return [...kept, newMsg];
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [selectedStream]);

  // Auto scroll watch chat
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const usrName = profile?.name || user?.name || "Guest";
    const myMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      user: usrName,
      text: currentMessage,
      avatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(usrName)}&background=3b82f6&color=fff`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, myMsg]);
    const textSnapshot = currentMessage;
    setCurrentMessage("");

    // Trigger positive response from stream bot comments after 1.5 seconds!
    setTimeout(() => {
      const botNames = ["SnowyMod", "Siberian_Warden", "ChillCompanion"];
      const botResponses = [
        `Welcome to the stream @${usrName}! Great having you with us ❄️`,
        `Exactly! Spot on comment, @${usrName}.`,
        `Glad you matched our chill deck, @${usrName}!`,
        `Hey @${usrName}! Do you think we need to test some custom shaders?`,
      ];
      
      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        user: botNames[Math.floor(Math.random() * botNames.length)],
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        avatar: `https://ui-avatars.com/api/?name=Mod&background=ef4444&color=fff`,
        role: 'moderator',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
    }, 1500);
  };

  const throwEmoji = (symbol: string) => {
    const id = ++emojiIdCounter.current;
    const left = Math.floor(Math.random() * 80) + 10; // offset percentage
    setFloatingEmojis(prev => [...prev, { id, symbol, left }]);
    
    // Clear out emoji node after animation concludes (3 seconds)
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  return (
    <div className="py-2 px-4 animate-in fade-in duration-300">
      
      {!selectedStream ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-rose-500 font-bold tracking-wider uppercase text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>{language === "ru" ? "Прямой Эфир" : "Live Streaming Portal"}</span>
              </div>
              <h1 className="text-3xl font-black font-display text-white tracking-tight mt-1">
                {language === "ru" ? "Интерактивные Трансляции" : "Cybernetic Broadcasting Deck"}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
                {language === "ru" 
                  ? "Смотрите живые потоки, участвуйте в динамических чатах с миллионами зрителей и бросайте живые реакции."
                  : "Jump into live feedback telemetry boards, engage in lively modular comments chat, and trigger rapid-fire reactions."}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold font-mono">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>{streams.length} BROADCASTING</span>
            </div>
          </div>

          {/* Streams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {streams.map((st) => (
              <div 
                key={st.id}
                onClick={() => setSelectedStream(st)}
                className={`group relative rounded-3xl border ice-border bg-gradient-to-br ${st.colorGrad} p-6 overflow-hidden cursor-pointer shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] hover:border-[#70d6ff]/40 transition-all duration-300`}
              >
                {/* Visualizer card accent decoration */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
                  <Radio className="w-40 h-40 text-white" />
                </div>

                <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                  <div className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>{t('live_badge')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                    <Users className="w-3.5 h-3.5 text-[#70d6ff]" />
                    <span>{st.viewers}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug group-hover:text-[#70d6ff] transition-colors mb-2 line-clamp-2 pr-6">
                  {st.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">
                  {st.description}
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto relative z-10 w-full">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={st.avatar} 
                      alt={st.streamer} 
                      className="w-8 h-8 rounded-full border border-white/10 shrink-0" 
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{st.streamer}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{st.category}</span>
                    </div>
                  </div>

                  <button className="p-2.5 bg-white/5 border ice-border text-[#70d6ff] group-hover:bg-[#70d6ff] group-hover:text-black rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(112,214,255,0.05)]">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Single Stream Viewing Theater Room */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-200">
          
          {/* Video Player Column */}
          <div className="lg:col-span-2 flex flex-col">
            <button 
              onClick={() => setSelectedStream(null)}
              className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-white mb-4 w-fit pb-1 border-b border-transparent hover:border-white/20 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>{language === "ru" ? "Назад к трансляциям" : "All Livestreams"}</span>
            </button>

            {/* Custom Interactive Stream Player Container */}
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-rose-500/20 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
              
              {/* Drift Floating Reaction Emojis inside stage overlay */}
              <div className="absolute inset-x-0 bottom-12 top-0 pointer-events-none z-30 overflow-hidden">
                {floatingEmojis.map(e => (
                  <div
                    key={e.id}
                    className="absolute text-3xl select-none animate-bounce"
                    style={{
                      left: `${e.left}%`,
                      bottom: "0px",
                      transform: "translateY(0px)",
                      animation: "driftUp 2.8s forwards ease-out"
                    }}
                  >
                    {e.symbol}
                  </div>
                ))}
              </div>

              {/* Simulated Ambient Stream Feed Visualizers */}
              <div className={`absolute inset-0 bg-gradient-to-b ${selectedStream.colorGrad} flex flex-col items-center justify-center p-8 text-center overflow-hidden`}>
                
                {/* Frozen floating neon shapes representing visual stream */}
                <div className="absolute w-80 h-80 bg-cyan-500/20 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDuration: '6s' }}></div>
                <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-[70px] animate-pulse pointer-events-none" style={{ animationDuration: '4s', animationDelay: '1.5s' }}></div>

                {/* Animated spectrum bar tracks */}
                <div className="flex items-end gap-1.5 h-16 mb-6">
                  {Array.from({ length: 18 }).map((_, i) => {
                    const rndDur = Math.random() * 0.8 + 0.4;
                    return (
                      <div 
                        key={i} 
                        className="w-1.5 bg-gradient-to-t from-[#70d6ff] to-cyan-400 rounded-full animate-pulse" 
                        style={{ 
                          height: `${Math.floor(Math.random() * 100) + 1}px`,
                          animationDuration: `${rndDur}s`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      ></div>
                    );
                  })}
                </div>

                <div className="relative z-10 max-w-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <Radio className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                    <span>{t('live_broadcast_active')}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {selectedStream.title}
                  </h2>
                  <p className="text-slate-400 text-xs">
                    {language === "ru" ? "Аудиопоток дешифрован" : "Simulated direct camera feed. Press buttons below to reaction-cast."}
                  </p>
                </div>

                {/* Top Statistics Bar inside Player */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Users className="w-3.5 h-3.5 text-rose-500" />
                  <span>{selectedStream.viewers} {language === 'ru' ? 'смотрят сейчас' : 'watching now'}</span>
                </div>
              </div>

              {/* Live Overlay controls bar */}
              <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md px-6 py-3 flex items-center justify-between border-t border-white/5 z-20">
                <span className="text-xs font-mono font-bold text-rose-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>00:14:32</span>
                </span>
                
                {/* Live Quick reaction trigger board */}
                <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                  <button onClick={() => throwEmoji("❄️")} className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-base">❄️</button>
                  <button onClick={() => throwEmoji("💖")} className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-base font-bold">💖</button>
                  <button onClick={() => throwEmoji("🔥")} className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-base">🔥</button>
                  <button onClick={() => throwEmoji("👍")} className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-base">👍</button>
                  <button onClick={() => throwEmoji("😂")} className="hover:scale-130 active:scale-90 transition-transform cursor-pointer text-base">😂</button>
                </div>
              </div>

            </div>

            {/* Profile & Description Card */}
            <div className="mt-5 p-6 bg-white/[0.03] border ice-border rounded-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedStream.avatar} 
                    alt={selectedStream.streamer} 
                    className="w-12 h-12 rounded-full border border-white/10 shrink-0" 
                  />
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                      {selectedStream.streamer}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Streamer Online"></span>
                    </h2>
                    <span className="text-xs text-[#70d6ff] font-bold uppercase tracking-wider">{selectedStream.category}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsSubscribed(!isSubscribed);
                    // trigger notification/XP
                    try {
                      window.dispatchEvent(new CustomEvent('icetube_add_xp', {
                        detail: { amount: 50, reason: 'Joined live community' }
                      }));
                    } catch(e) {}
                  }}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${
                    isSubscribed 
                      ? 'bg-white/10 text-slate-300 hover:bg-white/20' 
                      : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                  }`}
                >
                  {isSubscribed ? (language === "ru" ? "Вы подписаны" : "Subscribed") : (language === "ru" ? "Подписаться" : "Subscribe")}
                </button>
              </div>

              <div className="text-sm text-slate-400 font-medium leading-relaxed mt-4 border-t border-white/5 pt-4">
                <p>{selectedStream.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/5 border ice-border text-xs text-[#70d6ff] font-mono">#cyberstream</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border ice-border text-xs text-slate-300 font-mono">#ambient_gaming</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border ice-border text-xs text-rose-400 font-mono">#live</span>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Live Chat Column */}
          <div className="flex flex-col h-[600px] border ice-border rounded-3xl overflow-hidden bg-black/40 backdrop-blur-md shadow-2xl relative">
            
            {/* Header */}
            <div className="px-4 py-3 bg-white/[0.02] border-b ice-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                <MessageSquare className="w-4 h-4 text-[#70d6ff]" />
                <span>{language === "ru" ? "Чат трансляции" : "LIVESTREAM CHAT"}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 rounded-md text-[10px] font-bold text-rose-400">
                <span>●</span>
                <span>{selectedStream.viewers}</span>
              </div>
            </div>

            {/* Scrolling list */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar scroll-smooth"
            >
              {chatMessages.map(msg => (
                <div key={msg.id} className="flex gap-2.5 items-start text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <img 
                    src={msg.avatar} 
                    alt={msg.user} 
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10" 
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-black text-slate-200 hover:opacity-80 transition-opacity truncate max-w-[120px] ${
                        msg.role === 'moderator' ? 'text-rose-400' : ''
                      }`}>
                        {msg.user}
                      </span>
                      
                      {/* Identity Role Badges */}
                      {msg.role === 'moderator' && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold px-1 rounded text-[8px] transform uppercase scale-90">Mod</span>
                      )}

                      <span className="text-[9px] text-slate-600 font-bold">{msg.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5 font-medium leading-relaxed break-all">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input typing board */}
            <form 
              onSubmit={handlePostMessage} 
              className="p-3 bg-[#05070a] border-t ice-border flex items-center gap-2 shrink-0 relative z-10"
            >
              <input 
                type="text" 
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={language === "ru" ? "Отправить сообщение в чат..." : "Chat as guest..."}
                className="flex-1 bg-white/5 border ice-border text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#70d6ff] transition-all font-medium"
              />
              <button 
                type="submit"
                className="p-2.5 bg-[#70d6ff] text-black hover:scale-105 active:scale-95 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Styled animation keyframe declarations inside inline stylesheet */}
      <style>{`
        @keyframes driftUp {
          0% {
            transform: translateY(0px) scale(0.6);
            opacity: 1;
          }
          100% {
            transform: translateY(-380px) scale(1.3);
            opacity: 0;
          }
        }
      `}</style>

    </div>
  );
}
