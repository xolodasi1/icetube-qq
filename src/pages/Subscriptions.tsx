import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { VideoCard } from '../components/VideoCard';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Subscriptions() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        const subsColId = import.meta.env.VITE_APPWRITE_SUBS_COLLECTION_ID;

        if (!dbId || !videosColId || !subsColId) {
          setIsLoading(false);
          return;
        }

        // 1. Get user's subscriptions
        const subsResponse = await databases.listDocuments(dbId, subsColId, [
          Query.equal('subscriberId', user.$id)
        ]);

        const subscribedChannelIds = subsResponse.documents.map(sub => sub.channelId);

        // 2. Fetch videos from these channels
        if (subscribedChannelIds.length > 0) {
          const videosResponse = await databases.listDocuments(dbId, videosColId, [
            Query.equal('uploaderId', subscribedChannelIds),
            Query.orderDesc('$createdAt'),
            Query.limit(20)
          ]);
          setVideos(videosResponse.documents);
        } else {
          setVideos([]);
        }

      } catch (error) {
        console.error("Error fetching subscription videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[50vh] text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          {language === 'ru' ? 'Не упускайте новые видео' : 'Don\'t miss new videos'}
        </h2>
        <p className="text-slate-400 mb-6 max-w-md">
          {language === 'ru' 
            ? 'Войдите в аккаунт, чтобы видеть обновления любимых каналов Ютуб' 
            : 'Sign in to see updates from your favorite YouTube channels'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-[2000px] mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">
          {language === 'ru' ? 'Новые' : 'Latest'}
        </h1>
        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
          {language === 'ru' ? 'Каналы, на которые вы подписаны' : 'Manage'}
        </button>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">
        {language === 'ru' ? 'Самые актуальные' : 'Most relevant'}
      </h2>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.$id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 h-[40vh] text-center">
          <p className="text-slate-400">
            {language === 'ru' 
              ? 'Здесь появятся новые видео с каналов, на которые вы подписаны.' 
              : 'New videos from channels you\'re subscribed to will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}
