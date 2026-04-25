import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import ComingSoon from "./pages/ComingSoon";
import Channel from "./pages/Channel";
import AdminPanel from "./pages/AdminPanel";
import YourVideos from "./pages/YourVideos";
import Settings from "./pages/Settings";
import Studio from "./pages/Studio";
import Content from "./pages/Content";
import ChannelEditor from "./pages/ChannelEditor";
import Shorts from "./pages/Shorts";
import Subscriptions from "./pages/Subscriptions";
import ContinueWatching from "./pages/ContinueWatching";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/channel/:id" element={<Channel />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/continue-watching" element={<ContinueWatching />} />
          <Route path="/playlists" element={<ComingSoon />} />
          <Route path="/downloads" element={<ComingSoon />} />
          <Route path="/library" element={<ComingSoon />} />
          <Route path="/history" element={<ComingSoon />} />
          <Route path="/your-videos" element={<YourVideos />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/content" element={<Content />} />
          <Route path="/studio/editor" element={<ChannelEditor />} />
          <Route path="/watch-later" element={<ComingSoon />} />
          <Route path="/liked" element={<ComingSoon />} />
          <Route path="/clips" element={<ComingSoon />} />
          <Route path="/music" element={<ComingSoon />} />
          <Route path="/movies" element={<ComingSoon />} />
          <Route path="/live" element={<ComingSoon />} />
          <Route path="/premium" element={<ComingSoon />} />
          <Route path="/yt-music" element={<ComingSoon />} />
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

