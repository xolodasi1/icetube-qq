import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Check, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Categories helper for Russian descriptions
  const getSubDesc = (item: 'theme' | 'lang') => {
    if (language === 'ru') {
       return item === 'theme' ? 'Выберите визуальное оформление сайта' : 'Выберите основной язык интерфейса';
    }
    return item === 'theme' ? 'Choose the visual appearance of the site' : 'Select the primary interface language';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center gap-4 border-b ice-border pb-6">
        <div className="p-3 bg-[rgba(112,214,255,0.1)] rounded-2xl text-[#70d6ff]">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white font-display">{t('settings_title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('settings_subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Theme Setting */}
        <div className="bg-white/5 border ice-border rounded-2xl p-6 transition-all hover:bg-white/[0.07]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#70d6ff]/10 rounded-xl text-[#70d6ff]">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('settings_theme')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{getSubDesc('theme')}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'border-[#70d6ff] bg-[#70d6ff]/5 text-[#70d6ff]' 
                  : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="font-medium">{t('settings_dark')}</span>
              {theme === 'dark' && <Check className="w-4 h-4 ml-auto" />}
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                theme === 'light' 
                  ? 'border-[#70d6ff] bg-[#70d6ff]/5 text-[#70d6ff]' 
                  : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="font-medium">{t('settings_light')}</span>
              {theme === 'light' && <Check className="w-4 h-4 ml-auto" />}
            </button>
          </div>
        </div>

        {/* Language Setting */}
        <div className="bg-white/5 border ice-border rounded-2xl p-6 transition-all hover:bg-white/[0.07]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#70d6ff]/10 rounded-xl text-[#70d6ff]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('settings_lang')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{getSubDesc('lang')}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('ru')}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                language === 'ru' 
                  ? 'border-[#70d6ff] bg-[#70d6ff]/5 text-[#70d6ff]' 
                  : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🇷🇺</span>
                <span className="font-medium">{t('settings_ru')}</span>
              </div>
              {language === 'ru' && <Check className="w-4 h-4 text-[#70d6ff]" />}
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                language === 'en' 
                  ? 'border-[#70d6ff] bg-[#70d6ff]/5 text-[#70d6ff]' 
                  : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🇺🇸</span>
                <span className="font-medium">{t('settings_en')}</span>
              </div>
              {language === 'en' && <Check className="w-4 h-4 text-[#70d6ff]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
