import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ru';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export const translations: Translations = {
  en: {
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_trending: 'Trending',
    nav_library: 'Library',
    nav_history: 'History',
    nav_your_videos: 'Your Videos',
    nav_watch_later: 'Watch Later',
    nav_liked: 'Liked',
    nav_settings: 'Settings',
    nav_admin: 'Admin Panel',
    nav_sign_in: 'Sign in',
    nav_sign_out: 'Sign Out',
    nav_upload: 'Upload Video',
    search_placeholder: 'Search Icetube...',
    hero_no_videos: 'No videos yet',
    hero_upload_prompt: 'Be the first to upload a video using the button top right!',
    your_vids_title: 'Your Videos',
    your_vids_subtitle: 'Manage and watch your uploaded content',
    your_vids_upload_btn: 'Upload New Video',
    your_vids_login_req: 'Login Required',
    your_vids_login_desc: 'You need to be signed in to view and manage your uploaded videos.',
    settings_title: 'Settings',
    settings_subtitle: 'Settings are saved automatically',
    settings_theme: 'Theme',
    settings_theme_desc: 'Choose the visual appearance of the site',
    settings_dark: 'Dark',
    settings_light: 'Light',
    settings_lang: 'Language',
    settings_lang_desc: 'Select the primary interface language',
    settings_ru: 'Russian',
    settings_en: 'English',
    video_views: 'views',
    video_recently: 'Recently'
  },
  ru: {
    nav_home: 'Главная',
    nav_explore: 'Навигатор',
    nav_trending: 'В тренде',
    nav_library: 'Библиотека',
    nav_history: 'История',
    nav_your_videos: 'Ваши видео',
    nav_watch_later: 'Смотреть позже',
    nav_liked: 'Понравившиеся',
    nav_settings: 'Настройки',
    nav_admin: 'Админка',
    nav_sign_in: 'Войти',
    nav_sign_out: 'Выйти',
    nav_upload: 'Загрузить',
    search_placeholder: 'Поиск Icetube...',
    hero_no_videos: 'Видео пока нет',
    hero_upload_prompt: 'Будьте первым, кто загрузит видео с помощью кнопки в углу!',
    your_vids_title: 'Ваши видео',
    your_vids_subtitle: 'Управляйте своим контентом',
    your_vids_upload_btn: 'Загрузить видео',
    your_vids_login_req: 'Требуется вход',
    your_vids_login_desc: 'Вам нужно войти в аккаунт, чтобы управлять своими видео.',
    settings_title: 'Настройки',
    settings_subtitle: 'Настройки сохраняются автоматически',
    settings_theme: 'Тема оформления',
    settings_theme_desc: 'Выберите визуальный стиль сайта',
    settings_dark: 'Темная',
    settings_light: 'Светлая',
    settings_lang: 'Язык',
    settings_lang_desc: 'Выберите язык интерфейса',
    settings_ru: 'Русский',
    settings_en: 'English',
    video_views: 'просмотров',
    video_recently: 'Недавно'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
