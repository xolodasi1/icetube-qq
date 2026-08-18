import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import Home from "./pages/home/Home";
import Watch from "./pages/watch/Watch";
import ComingSoon from "./pages/misc/ComingSoon";
import Channel from "./pages/channel/Channel";
import AdminPanel from "./pages/admin/AdminPanel";
import YourVideos from "./pages/library/YourVideos";
import Settings from "./pages/account/Settings";
import Favorites from "./pages/library/Favorites";
import Playlists from "./pages/library/Playlists";
import WatchLater from "./pages/library/WatchLater";
import History from "./pages/library/History";
import Liked from "./pages/library/Liked";
import TopChannels from "./pages/discover/TopChannels";
import Downloads from "./pages/library/Downloads";
import Clips from "./pages/discover/Clips";
import Studio from "./studio/Studio";
import Content from "./studio/Content";
import ChannelEditor from "./studio/ChannelEditor";
import Shorts from "./pages/shorts/Shorts";
import Subscriptions from "./pages/discover/Subscriptions";
import ContinueWatching from "./pages/library/ContinueWatching";
import Videos from "./pages/discover/Videos";
import Photos from "./pages/discover/Photos";
import PhotoAlbums from "./pages/discover/PhotoAlbums";
import Live from "./pages/discover/Live";
import MusicPage from "./pages/discover/Music";
import SearchPage from "./pages/discover/Search";
import Browse from "./pages/discover/Browse";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/albums" element={<PhotoAlbums />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shorts/:id?" element={<Shorts />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/channel/:id" element={<Channel />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/continue-watching" element={<ContinueWatching />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/library" element={<ComingSoon />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/history" element={<History />} />
          <Route path="/your-videos" element={<YourVideos />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/verification" element={<Studio />} />
          <Route path="/studio/content" element={<Content />} />
          <Route path="/studio/editor" element={<ChannelEditor />} />
          <Route path="/watch-later" element={<WatchLater />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/top-channels" element={<TopChannels />} />
          <Route path="/clips" element={<Clips />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/movies" element={<ComingSoon />} />
          <Route path="/live" element={<Live />} />
          <Route path="/yt-music" element={<MusicPage />} />
          <Route path="/yt-kids" element={<ComingSoon />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/settings" element={<Settings />} />
          {/* Catch-all route to redirect back to home for unhandled tabs */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}

