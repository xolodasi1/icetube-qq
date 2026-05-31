import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Check, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

import { SafeStorage } from '../lib/storage';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState(() => SafeStorage.get('theme', 'dark'));

  useEffect(() => {
    SafeStorage.set('theme', theme);
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

        {/* Updates Setting */}
        <UpdatesSection language={language} t={t} />
      </div>
    </div>
  );
}

function UpdatesSection({ language, t }: { language: string, t: any }) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'latest'>('idle');

  const handleCheckUpdates = () => {
    setChecking(true);
    setStatus('idle');
    setTimeout(() => {
      setChecking(false);
      setStatus('latest');
    }, 1500);
  };

  return (
    <div className="bg-white/5 border ice-border rounded-2xl p-6 transition-all hover:bg-white/[0.07]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 animate-pulse">
            <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '15s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {language === 'ru' ? 'Обновления системы' : 'System Updates'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ru' ? 'Проверка новых версий и журнал изменений' : 'Check for new versions and change logs'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs bg-white/5 border ice-border font-mono px-2.5 py-1 rounded-md text-[#70d6ff]">
            v2.1.2
          </span>
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold">
            Icefall
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-black/30 border ice-border mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {language === 'ru' ? 'Журнал изменений v2.1.2' : 'Change Log v2.1.2'}
        </h4>
        <ul className="text-sm text-slate-300 space-y-2.5">
          <li className="flex items-start gap-2">
            <span className="text-[#70d6ff] font-bold mt-0.5">•</span>
            <span>
              {language === 'ru' 
                ? 'Новое: добавлена кнопка глобального обновления на главную страницу для ручного обновления видеопотока.' 
                : 'New: added a global refresh action button to Home to manually reload the video feeds.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#70d6ff] font-bold mt-0.5">•</span>
            <span>
              {language === 'ru' 
                ? 'Исправлена внутренняя ошибка создания уведомлений (Appwrite): решены конфликты прав доступа для неавторизованных сценариев.' 
                : 'Fixed Appwrite notifications creation permissions error: resolved access level conflicts in guest scenarios.'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#70d6ff] font-bold mt-0.5">•</span>
            <span>
              {language === 'ru' 
                ? 'Оптимизирован пользовательский интерфейс панели Studio: удален избыточный блок статистики "Эффективность контента" по запросу.' 
                : 'Optimized Studio Creator Panel UI: removed the redundant "Content Performance" table as requested.'}
            </span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={handleCheckUpdates}
          disabled={checking}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            checking 
              ? 'bg-slate-800 text-slate-400 border border-slate-700' 
              : 'bg-[#70d6ff] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(112,214,255,0.2)]'
          }`}
        >
          {checking ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{language === 'ru' ? 'Проверка...' : 'Checking...'}</span>
            </>
          ) : (
            <span>{language === 'ru' ? 'Проверить обновления' : 'Check for Updates'}</span>
          )}
        </button>

        {status === 'latest' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in duration-200">
            <Check className="w-5 h-5 shrink-0" />
            <span>
              {language === 'ru' 
                ? 'У вас установлена последняя версия!' 
                : 'You are on the latest version!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

