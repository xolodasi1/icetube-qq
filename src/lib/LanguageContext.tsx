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
    video_recently: 'Recently',
    video_no_description: 'No description provided.',
    nav_studio: 'Icetube Studio',
    studio_title: 'Channel Analytics',
    studio_total_views: 'Total Views',
    studio_total_videos: 'Total Videos',
    studio_content: 'Channel Content',
    studio_edit: 'Edit',
    studio_delete: 'Delete',
    video_no_results: 'No videos found',
    video_search_try_again: 'Try searching for something else or pick a different category.',
    video_connecting: 'Connecting to Server...',
    video_comments: 'Comments',
    video_sign_in_comment: 'Sign in to leave a comment',
    video_not_found: 'Video not found',
    video_not_found_desc: 'This video may have been deleted or does not exist.',
    video_subscribers: 'subscribers',
    video_subscribed: 'Subscribed',
    video_subscribe: 'Subscribe',
    video_share: 'Share',
    comment_edit: 'Edit',
    comment_delete: 'Delete',
    comment_reply: 'Reply',
    comment_save: 'Save',
    comment_cancel: 'Cancel',
    comment_placeholder: 'Add a comment...',
    comment_reply_placeholder: 'Add a reply...',
    studio_video_header: 'Video',
    studio_date_header: 'Date',
    studio_views_header: 'Views',
    studio_no_videos: 'No videos found. Upload your first clip to start tracking!',
    studio_back_home: 'Back to Home',
    studio_customize: 'Customization',
    editor_title: 'Channel customization',
    editor_basic_info: 'Basic info',
    editor_name: 'Name',
    editor_handle: 'Handle',
    editor_description: 'Description',
    editor_avatar: 'Avatar URL',
    editor_banner: 'Banner URL',
    editor_save: 'Publish',
    editor_cancel: 'Cancel',
    editor_success: 'Changes published successfully!',
    upload_type: 'Content Type',
    upload_video: 'Video',
    upload_shorts: 'Shorts',
    channel_loading: 'Loading channel...',
    channel_not_found: 'Channel Not Found',
    channel_not_found_desc: 'This channel doesn\'t exist or hasn\'t uploaded any videos yet.',
    channel_subscribers: 'subscribers',
    channel_videos: 'videos',
    channel_videos_tab: 'Videos',
    channel_your_channel: 'Your Channel',
    channel_no_videos: 'This channel has no videos.'
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
    video_recently: 'Недавно',
    video_no_description: 'Описание отсутствует.',
    nav_studio: 'Студия Icetube',
    studio_title: 'Аналитика канала',
    studio_total_views: 'Всего просмотров',
    studio_total_videos: 'Всего видео',
    studio_content: 'Контент канала',
    studio_edit: 'Изменить',
    studio_delete: 'Удалить',
    video_no_results: 'Ничего не найдено',
    video_search_try_again: 'Попробуйте другой запрос или категорию',
    video_connecting: 'Подключаемся к льдине...',
    video_comments: 'комментариев',
    video_sign_in_comment: 'Войдите, чтобы оставить комментарий',
    video_not_found: 'Видео не найдено',
    video_not_found_desc: 'Возможно, ролик был удален или его не существует.',
    video_subscribers: 'подписчиков',
    video_subscribed: 'Вы подписаны',
    video_subscribe: 'Подписаться',
    video_share: 'Поделиться',
    comment_edit: 'Изменить',
    comment_delete: 'Удалить',
    comment_reply: 'Ответить',
    comment_save: 'Сохранить',
    comment_cancel: 'Отмена',
    comment_placeholder: 'Оставьте комментарий...',
    comment_reply_placeholder: 'Напишите ответ...',
    studio_video_header: 'Видео',
    studio_date_header: 'Дата',
    studio_views_header: 'Просмотры',
    studio_no_videos: 'Видео не найдено. Загрузите свой первый ролик!',
    studio_back_home: 'На главную',
    studio_customize: 'Настройка канала',
    editor_title: 'Настройка канала',
    editor_basic_info: 'Основные сведения',
    editor_name: 'Название',
    editor_handle: 'Псевдоним',
    editor_description: 'Описание',
    editor_avatar: 'Ссылка на аватар',
    editor_banner: 'Ссылка на шапку профиля',
    editor_save: 'Опубликовать',
    editor_cancel: 'Отмена',
    editor_success: 'Изменения успешно опубликованы!',
    upload_type: 'Тип контента',
    upload_video: 'Видео',
    upload_shorts: 'Shorts',
    channel_loading: 'Загрузка канала...',
    channel_not_found: 'Канал не найден',
    channel_not_found_desc: 'Этот канал не существует или еще не загрузил видео.',
    channel_subscribers: 'подписчиков',
    channel_videos: 'видео',
    channel_videos_tab: 'Видео',
    channel_your_channel: 'Ваш канал',
    channel_no_videos: 'На этом канале нет видео.'
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
