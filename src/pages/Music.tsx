import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { Music, Play, Pause, SkipForward, SkipBack, Disc, Volume2, Maximize2, Sparkles, Zap, Radio, Sliders, PlayCircle } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  baseFreq: number;
  chordType: 'minor9' | 'major9' | 'dim7' | 'sus4';
}

export default function MusicPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [synthVolume, setSynthVolume] = useState(0.3);
  const [tempo, setTempo] = useState(85);
  const [echoEnabled, setEchoEnabled] = useState(true);
  const [visualBars, setVisualBars] = useState<number[]>(Array.from({ length: 24 }).map(() => 10));
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const visualizerInterval = useRef<any>(null);

  const tracks: Track[] = [
    { id: "track_1", title: "Glacier Chill", artist: "Icefall Synth System", duration: "3:45", genre: "Synth Lofi", baseFreq: 110, chordType: 'minor9' },
    { id: "track_2", title: "Neon Blizzard", artist: "Aurora Grid", duration: "4:02", genre: "Vaporwave", baseFreq: 146.83, chordType: 'major9' },
    { id: "track_3", title: "Aurora Nights", artist: "Siberian Resonance", duration: "5:12", genre: "Ambient Dream", baseFreq: 130.81, chordType: 'sus4' },
    { id: "track_4", title: "Frosty Orbit", artist: "Chronos Cosmic", duration: "3:20", genre: "Space Electro", baseFreq: 98, chordType: 'minor9' }
  ];

  const currentTrack = tracks[currentTrackIndex];

  // Helper: Play actual beautiful cyber scale chords in browser using Web Audio!
  const playSynthesizerChord = (frequency: number, chord: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const activeTime = ctx.currentTime;
      
      // Determine chord intervals
      let intervals = [1, 1.2, 1.5, 1.8]; // Root, Min3, Perf5, Maj7
      if (chord === 'major9') {
        intervals = [1, 1.25, 1.5, 1.875, 2.25]; // Root, Maj3, Perf5, Maj7, 9th
      } else if (chord === 'minor9') {
        intervals = [1, 1.189, 1.5, 1.782, 2.227]; // Root, Min3, Perf5, Min7, 9th
      } else if (chord === 'sus4') {
        intervals = [1, 1.334, 1.5, 1.782]; // Root, Perf4, Perf5, Min7
      }

      // Generate a resonant chord trigger
      intervals.forEach((multiplier, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Use a cold triangle or sine wave to fit "icy" style
        osc.type = index % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(frequency * multiplier, activeTime);
        
        // Ultra smooth bell envelope
        gainNode.gain.setValueAtTime(0, activeTime);
        gainNode.gain.linearRampToValueAtTime(synthVolume * 0.2, activeTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, activeTime + 1.8 + index * 0.2);

        osc.connect(gainNode);
        
        // Simple artificial Echo / Delay Node simulation
        if (echoEnabled) {
          const delay = ctx.createDelay();
          const delayGain = ctx.createGain();
          
          delay.delayTime.setValueAtTime(0.4, activeTime);
          delayGain.gain.setValueAtTime(0.15, activeTime);
          
          gainNode.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(ctx.destination);
        }

        gainNode.connect(ctx.destination);
        
        osc.start(activeTime);
        osc.stop(activeTime + 2.5);
      });

      // Cause immediate spectacular jump to visual bars
      setVisualBars(prev => prev.map(() => Math.floor(Math.random() * 80) + 20));

    } catch (err) {
      console.warn("Could not kick synthesizer oscillator:", err);
    }
  };

  // Pulse spectrum bars regularly when track is playing
  useEffect(() => {
    if (isPlaying) {
      visualizerInterval.current = setInterval(() => {
        setVisualBars(prev => prev.map(bar => {
          // randomized pulsing values
          const min = 12;
          const max = 95;
          const delta = Math.floor(Math.random() * 45) - 20;
          let next = bar + delta;
          if (next < min) next = min;
          if (next > max) next = max;
          return next;
        }));
      }, 120);
    } else {
      if (visualizerInterval.current) {
        clearInterval(visualizerInterval.current);
      }
      setVisualBars(Array.from({ length: 24 }).map(() => 8));
    }

    return () => {
      if (visualizerInterval.current) clearInterval(visualizerInterval.current);
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      playSynthesizerChord(currentTrack.baseFreq, currentTrack.chordType);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying) {
      setTimeout(() => {
        playSynthesizerChord(tracks[nextIdx].baseFreq, tracks[nextIdx].chordType);
      }, 100);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIdx);
    if (isPlaying) {
      setTimeout(() => {
        playSynthesizerChord(tracks[prevIdx].baseFreq, tracks[prevIdx].chordType);
      }, 100);
    }
  };

  const triggerPadNode = (noteName: string, multiplier: number) => {
    const base = currentTrack.baseFreq;
    const finalFreq = base * multiplier;
    playSynthesizerChord(finalFreq, currentTrack.chordType);
    
    // Grant tiny XP for exploring synth music structures
    try {
      window.dispatchEvent(new CustomEvent('icetube_add_xp', {
        detail: { amount: 5, reason: 'Composed a live synth chord' }
      }));
    } catch(e) {}
  };

  const synthPadKeys = [
    { label: "C3 (Root)", val: 1.0, color: "border-blue-500/30 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/15" },
    { label: "E♭3 (Min3)", val: 1.189, color: "border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15" },
    { label: "G3 (Perf5)", val: 1.5, color: "border-teal-500/30 hover:border-teal-400 bg-teal-500/5 hover:bg-teal-500/15" },
    { label: "B♭3 (Min7)", val: 1.782, color: "border-[#70d6ff]/30 hover:border-[#70d6ff] bg-[#70d6ff]/5 hover:bg-[#70d6ff]/15" },
    { label: "D4 (9th Over)", val: 2.227, color: "border-purple-500/30 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/15" },
    { label: "F4 (Perf11)", val: 2.668, color: "border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15" }
  ];

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#70d6ff] font-bold tracking-wider uppercase text-xs">
            <Radio className="w-3.5 h-3.5" />
            <span>{language === "ru" ? "Синтезаторный Центр" : "Cyber Synthesizer Workspace"}</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight mt-0.5">
            {language === "ru" ? "Музыкальный Плеер & Студия" : "Live Ambient Audio Engine"}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#70d6ff]/10 border border-[#70d6ff]/30 rounded-xl text-[#70d6ff] text-xs font-bold font-mono">
          <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span>CYBER AUDIO DEVICE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Visualized Audio Device Console (Takes 2 Columns) */}
        <div className="lg:col-span-2 flex flex-col p-6 rounded-3xl border ice-border bg-gradient-to-br from-[#070d13] via-[#04080c] to-[#040608] relative overflow-hidden shadow-2xl">
          
          {/* Background glowing gradients */}
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent blur-2xl pointer-events-none"></div>

          {/* Canvas-style Audio Analyzer Track display */}
          <div className="p-4 rounded-2xl bg-black/50 border ice-border mb-6 flex flex-col justify-end h-40 relative">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff80] animate-pulse"></span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono">Spectrum Telemetry</span>
            </div>

            {/* Glowing bar graph spectrum */}
            <div className="flex items-end justify-between gap-[2px] sm:gap-1.5 h-24">
              {visualBars.map((bar, index) => (
                <div 
                  key={index} 
                  className="flex-1 bg-gradient-to-t from-blue-600 via-[#70d6ff] to-[#00f0ff] rounded-t-sm transition-all duration-100"
                  style={{ height: `${bar}%` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Metatabs controls */}
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-[#70d6ff]/15 to-blue-500/30 border ice-border flex items-center justify-center text-blue-300 relative shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
                  <Music className="w-6 h-6" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs bg-white/5 border ice-border text-[#70d6ff] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] font-mono">
                  {currentTrack.genre}
                </span>
                <h3 className="font-bold text-white text-base truncate mt-1">{currentTrack.title}</h3>
                <p className="text-slate-500 text-xs truncate mt-0.5 font-medium">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Micro Controls button triggers */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
              <button 
                onClick={handlePrev}
                className="p-3 bg-white/5 border ice-border text-slate-300 hover:text-[#70d6ff] rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button 
                onClick={handlePlayPause}
                className="p-4 bg-[#70d6ff] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#70d6ff]/20"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button 
                onClick={handleNext}
                className="p-3 bg-white/5 border ice-border text-slate-300 hover:text-[#70d6ff] rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

        </div>

        {/* Live Audio Knobs Settings Desk */}
        <div className="flex flex-col p-6 rounded-3xl border ice-border bg-black/30 backdrop-blur-md shadow-xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#70d6ff]" />
            <span>Audio Parameters</span>
          </h3>

          <div className="space-y-5">
            {/* Volume Node scale */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 font-bold mb-2">
                <span>VOL LIMITER</span>
                <span className="font-mono text-[#70d6ff]">{Math.floor(synthVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="0.8" 
                step="0.05"
                value={synthVolume}
                onChange={(e) => setSynthVolume(parseFloat(e.target.value))}
                className="w-full accent-[#70d6ff] cursor-pointer" 
              />
            </div>

            {/* Synthesizer Delay Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Freeze Echo Pad</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Adds floating spatial reflections</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={echoEnabled} 
                  onChange={() => setEchoEnabled(!echoEnabled)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#70d6ff] peer-checked:after:bg-black"></div>
              </label>
            </div>

            {/* Quick Play Info card */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-400 leading-relaxed">
              <span className="font-bold text-[#70d6ff] uppercase block mb-1">PRO-TIP:</span>
              <span>{language === "ru" ? "Вы можете кликать по клавишам запускной сетки справа, чтобы синтезировать свои собственные замороженные аккорды в реальном времени!" : "Trigger modular freeze notes below to synthesize custom harmonic layers directly in your browser."}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Synthesizer Launch Grid Panel */}
      <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <span>{language === "ru" ? "Интерактивная Сетка Синтезатора" : "Interactive Synthetic Grid Launcher"}</span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {synthPadKeys.map((pad, idx) => (
          <button
            key={idx}
            onClick={() => triggerPadNode(pad.label, pad.val)}
            className={`cursor-pointer p-6 rounded-2xl border text-center transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${pad.color}`}
          >
            {/* Hover visual cue */}
            <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.04] transition-colors"></div>
            
            <PlayCircle className="w-8 h-8 text-slate-500 group-hover:text-[#70d6ff] transition-colors" />
            
            <div>
              <span className="font-mono font-black text-white text-xs block">{pad.label}</span>
              <span className="text-[9px] text-[#70d6ff] font-bold block mt-0.5">x{pad.val.toFixed(2)} freq</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
