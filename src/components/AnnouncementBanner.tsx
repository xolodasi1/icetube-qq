import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getSetting } from '../lib/siteSettings';
import { SafeStorage } from '../lib/storage';

export default function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const ann = await getSetting('announcement');
        if (!alive) return;
        if (ann?.active && ann?.text) {
          const dismissed = SafeStorage.get<string | null>('announcement_dismissed', null);
          const stamp = String(ann.updatedAt || ann.text);
          if (dismissed !== stamp) setText(ann.text);
          else setText(null);
        } else {
          setText(null);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, []);

  if (!text) return null;

  const dismiss = () => {
    try {
      // запомнить именно этот анонс, чтобы новый показался снова
      SafeStorage.set('announcement_dismissed', text);
    } catch {}
    setText(null);
  };

  return (
    <div className="mx-auto max-w-[2000px] px-0 sm:px-4 lg:px-6 xl:px-8 pt-2">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-none sm:rounded-xl bg-[#70d6ff]/10 border-y sm:border border-[#70d6ff]/30 text-sm">
        <Megaphone className="w-4 h-4 text-[#70d6ff] shrink-0" />
        <p className="flex-1 min-w-0 text-slate-100 text-xs sm:text-sm">{text}</p>
        <button onClick={dismiss} className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
