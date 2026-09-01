import { createPortal } from 'react-dom';
import { X, Video, Smartphone, Image, Sparkles } from 'lucide-react';
import { useLanguage } from '../language/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface UploadChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'video' | 'shorts' | 'photo') => void;
}

export function UploadChoiceModal({ isOpen, onClose, onSelect }: UploadChoiceModalProps) {
  const { language } = useLanguage();
  if (!isOpen) return null;

  const cards: Array<{ type: 'video'|'shorts'|'photo'; icon: any; title: string; desc: string; gradient: string }> = [
    { type: 'video', icon: Video, title: language === 'ru' ? 'Видео' : 'Video', desc: language === 'ru' ? 'Обычное видео до 10 ГБ' : 'Standard video up to 10GB', gradient: 'from-[#70d6ff]/20 to-blue-600/20 border-[#70d6ff]/30' },
    { type: 'shorts', icon: Smartphone, title: 'Shorts', desc: language === 'ru' ? 'Вертикальный Short до 60с' : 'Vertical Short up to 60s', gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
    { type: 'photo', icon: Image, title: language === 'ru' ? 'Фото' : 'Photo', desc: language === 'ru' ? 'Изображение до 50 МБ' : 'Image up to 50MB', gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
  ];

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-[#0f1115] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#70d6ff]" />
            {language === 'ru' ? 'Что загрузим?' : 'What to upload?'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 grid gap-3">
          {cards.map(card => (
            <button
              key={card.type}
              onClick={() => onSelect(card.type)}
              className={`flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br ${card.gradient} hover:scale-[1.01] active:scale-[0.99] transition-all text-left group`}
            >
              <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{card.title}</div>
                <div className="text-xs text-slate-300">{card.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 pb-4 px-4">
          {language === 'ru' ? 'Сперва перейдём в студию, затем откроется форма загрузки' : 'We will go to Studio first, then open the upload form'}
        </p>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}
