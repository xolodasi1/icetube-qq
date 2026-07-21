interface VideoLike {
  id: string;
  uploaderId?: string;
  title?: string;
  category?: string;
  views?: number;
  contentType?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface RecommendOptions {
  currentVideo?: { category?: string; uploaderId?: string; id?: string; contentType?: string };
  limit?: number;
  excludeIds?: string[];
  preferCategory?: string;
  preferUploader?: string;
  preferContentType?: string;
}

export function getRecommendations(videos: VideoLike[], options: RecommendOptions = {}): VideoLike[] {
  const {
    currentVideo,
    limit = 20,
    excludeIds = [],
    preferCategory,
    preferUploader,
    preferContentType,
  } = options;

  const targetCategory = currentVideo?.category || preferCategory;
  const targetUploader = currentVideo?.uploaderId || preferUploader;
  const targetContentType = currentVideo?.contentType || preferContentType || 'video';
  const currentId = currentVideo?.id;
  const excludeSet = new Set(excludeIds);
  if (currentId) excludeSet.add(currentId);

  const maxViews = Math.max(...videos.map(v => v.views || 0), 1);

  const uploaderCounts = new Map<string, number>();
  const topCategory = videos
    .filter(v => v.category && v.category !== 'All')
    .reduce<Map<string, number>>((acc, v) => {
      acc.set(v.category, (acc.get(v.category) || 0) + 1);
      return acc;
    }, new Map());
  const topCategoryName = [...topCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const scored = videos
    .filter(v => !excludeSet.has(v.id))
    .map(v => {
      let score = 0;
      const views = v.views || 0;

      // Category match (highest weight)
      const cat = v.category || 'All';
      if (targetCategory && cat === targetCategory) score += 0.40;
      else if (topCategoryName && cat === topCategoryName) score += 0.15;

      // Same uploader (also high — "more from this creator")
      if (targetUploader && v.uploaderId === targetUploader) score += 0.25;
      else if (v.uploaderId) {
        const count = uploaderCounts.get(v.uploaderId) || 0;
        if (count < 2) score += 0.10;
        uploaderCounts.set(v.uploaderId, count + 1);
      }

      // Popularity (log scale to avoid view-count domination)
      const popularity = Math.log2(views + 1) / Math.log2(maxViews + 1);
      score += popularity * 0.15;

      // Recency based on createdAt
      if (v.createdAt) {
        const age = Date.now() - new Date(v.createdAt).getTime();
        const ageDays = age / (1000 * 60 * 60 * 24);
        const recency = Math.max(0, 1 - ageDays / 90);
        score += recency * 0.12;
      } else {
        score += 0.06;
      }

      // Content type relevance
      if (v.contentType === targetContentType) score += 0.08;

      // Penalize "All" category (generic)
      if (cat === 'All') score -= 0.05;

      return { video: v, score };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.video);
}
