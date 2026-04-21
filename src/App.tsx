import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import ComingSoon from "./pages/ComingSoon";
import AdminPanel from "./pages/AdminPanel";
import YourVideos from "./pages/YourVideos";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/library" element={<ComingSoon />} />
          <Route path="/history" element={<ComingSoon />} />
          <Route path="/your-videos" element={<YourVideos />} />
          <Route path="/watch-later" element={<ComingSoon />} />
          <Route path="/liked" element={<ComingSoon />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/settings" element={<Settings />} />
          {/* Catch-all route to redirect back to home for unhandled tabs */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}

