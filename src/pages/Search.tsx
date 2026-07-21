import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { databases } from '../lib/appwrite';
import { Search as SearchIcon, Loader2, SlidersHorizontal, X, Image, Film, Scissors, Eye, Clock, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getOptimizedThumbnail } from '../lib/cloudinary';

type ContentFilter = 'all' | 'video' | 'shorts' | 'photo';
type SortMode = 'relevance' | 'date' | 'views';

export default function SearchPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
        if (dbId && colId) {
          const res = await databases.listDocuments(dbId, colId);
          setDbVideos(res.documents);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    let items = [...dbVideos];

    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.uploaderName || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
      );
    }

    if (filter === 'video') {
      items = items.filter(v => v.contentType !== 'shorts' && v.contentType !== 'photo' && !v.isShort && !v.isShorts);
    } else if (filter === 'shorts') {
      items = items.filter(v => v.contentType === 'shorts' || v.isShort || v.isShorts);
    } else if (filter === 'photo') {
      items = items.filter(v => v.contentType === 'photo');
    }

    if (sort === 'date') {
      items.sort((a, b) => new Date(b.$createdAt || 0).getTime() - new Date(a.$createdAt || 0).getTime());
    } else if (sort === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return items;
  }, [dbVideos, query, filter, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    }
  };

  const filters: { key: ContentFilter; label: string; icon: any }[] = [
    { key: 'all', label: language === 'ru' ? 'Все' : 'All', icon: SearchIcon },
    { key: 'video', label: language === 'ru' ? 'Видео' : 'Videos', icon: Film },
    { key: 'shorts', label: 'Shorts', icon: Scissors },
    { key: 'photo', label: language === 'ru' ? 'Фото' : 'Photos', icon: Image },
  ];

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 mb-20 sm:mb-6 mt-16 sm:mt-0 animate-in fade-in duration-300">
      <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto mb-8">
        <button type="submit" className="absolute inset-y-0 left-0 pl-4 flex items-center">
          <SearchIcon className="w-5 h-5 text-slate-500 group-focus-within:text-[#70d6ff] transition-colors" />
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={t('search_placeholder') || 'Search...'}
          className="w-full bg-white/5 border ice-border rounded-2xl py-3.5 px-12 text-base focus:outline-none focus:border-[#70d6ff]/50 transition-colors placeholder:text-slate-500 text-slate-200"
        />
        {inputValue && (
          <button type="button" onClick={() => { setInputValue(''); setSearchParams({}); }} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                filter === f.key
                  ? 'bg-[#70d6ff] text-[#0a192f] border-[#70d6ff]'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <f.icon className="w-4 h-4" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 border ice-border transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {language === 'ru' ? 'Сортировка' : 'Sort'}
          </button>
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 bg-[#0a1628] border ice-border rounded-2xl p-2 shadow-2xl z-50 min-w-[160px]">
              {([
                { key: 'relevance', label: language === 'ru' ? 'По релевантности' : 'Relevance' },
                { key: 'date', label: language === 'ru' ? 'По дате' : 'Date' },
                { key: 'views', label: language === 'ru' ? 'По просмотрам' : 'Views' },
              ] as { key: SortMode; label: string }[]).map(s => (
                <button
                  key={s.key}
                  onClick={() => { setSort(s.key); setShowFilters(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                    sort === s.key ? 'bg-[#70d6ff]/10 text-[#70d6ff]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.key === 'relevance' && <ArrowUpDown className="w-4 h-4" />}
                  {s.key === 'date' && <Clock className="w-4 h-4" />}
                  {s.key === 'views' && <Eye className="w-4 h-4" />}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-[#70d6ff] animate-spin" />
        </div>
      ) : query && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <SearchIcon className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Ничего не найдено' : 'No results found'}</h2>
          <p className="text-slate-400 text-sm max-w-md">
            {language === 'ru' ? 'Попробуйте изменить запрос или фильтры' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : !query ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <SearchIcon className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Поиск по платформе' : 'Search the platform'}</h2>
          <p className="text-slate-400 text-sm">{language === 'ru' ? 'Введите запрос чтобы найти контент' : 'Enter a query to find content'}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {language === 'ru' ? `Найдено: ${filtered.length}` : `${filtered.length} results`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(v => (
              <Link
                key={v.$id}
                to={v.contentType === 'photo' ? `/photos` : `/watch/${v.$id}`}
                className="group block"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-black/40 border ice-border ${v.contentType === 'photo' ? 'aspect-square' : 'aspect-video'}`}>
                  <img
                    src={getOptimizedThumbnail(v.thumbnailUrl || v.videoUrl, 320)}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {(v.contentType === 'shorts' || v.isShort) && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-teal-500/80 text-white">Short</span>
                  )}
                  {v.contentType === 'photo' && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-purple-500/80 text-white">Photo</span>
                  )}
                </div>
                <div className="mt-2.5">
                  <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#70d6ff] transition-colors">{v.title || 'Untitled'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{v.uploaderName || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{v.views || 0} views</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
