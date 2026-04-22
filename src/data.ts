export interface Video {
  id: string;
  uploaderId?: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  channelName: string;
  channelAvatar: string;
  views: number;
  uploadDate: string;
  duration: string;
  description: string;
  category: string;
}

export const mockVideos: Video[] = [
  {
    id: "1",
    uploaderId: "mock-user-1",
    title: "Exploring the Deep Freeze: Antarctica Documentary",
    thumbnailUrl: "https://picsum.photos/seed/ice1/640/360?grayscale&blur=2",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "Frost Media",
    channelAvatar: "https://picsum.photos/seed/avatar1/100/100",
    views: 124000,
    uploadDate: "2 days ago",
    duration: "14:20",
    description: "Join us as we explore the coldest continent on Earth. A deep dive into the icy tundras and wildlife.",
    category: "Explore"
  },
  {
    id: "2",
    uploaderId: "mock-user-2",
    title: "Cold Plunge Routine for Beginners",
    thumbnailUrl: "https://picsum.photos/seed/ice2/640/360?grayscale&blur=1",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "HealthHub Hub",
    channelAvatar: "https://picsum.photos/seed/avatar2/100/100",
    views: 89000,
    uploadDate: "1 week ago",
    duration: "08:45",
    description: "Learn how to safely start your cold plunge and ice bath journey for maximum health benefits.",
    category: "Lifestyle"
  },
  {
    id: "3",
    uploaderId: "mock-user-3",
    title: "Cyberpunk City in the Snow - Ambience 4K",
    thumbnailUrl: "https://picsum.photos/seed/cyber/640/360?blur=1",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "Lofi Chills",
    channelAvatar: "https://picsum.photos/seed/avatar3/100/100",
    views: 2100000,
    uploadDate: "3 months ago",
    duration: "4:00:00",
    description: "Relaxing cyberpunk city ambience in heavy snow. Perfect for studying and sleeping.",
    category: "Chill"
  },
  {
    id: "4",
    uploaderId: "mock-user-4",
    title: "Top 10 Ice Hotels in the World",
    thumbnailUrl: "https://picsum.photos/seed/icehotel/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "Travel Vibes",
    channelAvatar: "https://picsum.photos/seed/travel/100/100",
    views: 45000,
    uploadDate: "5 hours ago",
    duration: "12:15",
    description: "We rank the most spectacular ice hotels across Sweden, Canada, and beyond.",
    category: "Explore"
  },
  {
    id: "5",
    uploaderId: "mock-user-5",
    title: "Making Liquid Nitrogen Ice Cream",
    thumbnailUrl: "https://picsum.photos/seed/nitrogen/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "Science Kitchen",
    channelAvatar: "https://picsum.photos/seed/science/100/100",
    views: 670000,
    uploadDate: "1 month ago",
    duration: "10:30",
    description: "The fastest and coolest way to make ice cream at home using science!",
    category: "Science"
  },
  {
    id: "6",
    uploaderId: "mock-user-6",
    title: "Glacier Hiking in Iceland - 4K POV",
    thumbnailUrl: "https://picsum.photos/seed/glacier/640/360?grayscale",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "Extreme POV",
    channelAvatar: "https://picsum.photos/seed/pov/100/100",
    views: 12000,
    uploadDate: "12 hours ago",
    duration: "45:00",
    description: "A complete Point of View hike of the largest glacier in Iceland with no commentary.",
    category: "Explore"
  },
  {
    id: "7",
    uploaderId: "mock-user-7",
    title: "Coding a React App while freezing",
    thumbnailUrl: "https://picsum.photos/seed/code/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "DevIce",
    channelAvatar: "https://picsum.photos/seed/dev/100/100",
    views: 9500,
    uploadDate: "3 days ago",
    duration: "25:12",
    description: "I set the AC to minimum and coded an entire video streaming platform analogue to YouTube.",
    category: "Programming"
  },
  {
    id: "8",
    uploaderId: "mock-user-8",
    title: "The Sound of Ice Cracking",
    thumbnailUrl: "https://picsum.photos/seed/crack/640/360",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    channelName: "ASMR Frost",
    channelAvatar: "https://picsum.photos/seed/asmr/100/100",
    views: 3100000,
    uploadDate: "1 year ago",
    duration: "1:00:00",
    description: "1 hour of satisfying thick ice cracking sounds. Please wear headphones.",
    category: "ASMR"
  }
];
