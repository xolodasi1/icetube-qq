import { ReactNode, useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { StudioSidebar } from "../studio/StudioSidebar";
import { BottomNav } from "./BottomNav";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isStudioView = location.pathname.startsWith('/studio');
  const isAdminView = location.pathname.startsWith('/admin');

  // On mobile, close sidebar when changing routes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-transparent ice-gradient flex flex-col relative z-0">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[60%] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff80]/[0.04] via-[#00f0ff]/[0.02] to-transparent blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[300px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#70d6ff]/[0.03] via-[#6a00ff]/[0.01] to-transparent blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden pt-16 relative">
          {isAdminView ? null : isStudioView ? (
            <StudioSidebar isOpen={sidebarOpen} onClose={() => window.innerWidth < 1024 && setSidebarOpen(false)} />
          ) : (
            <Sidebar isOpen={sidebarOpen} />
          )}
          {/* Click-away overlay for mobile */}
          {!isAdminView && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 z-[55] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Adjusted padding: Main layout has padding bottom for mobile nav */}
          <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${!isAdminView && sidebarOpen ? 'sm:ml-64' : 'ml-0'} ${location.pathname.startsWith('/watch') || location.pathname.startsWith('/shorts') ? 'pb-0' : 'pb-20 sm:pb-0'}`}>
            <div className="mx-auto max-w-[2000px] p-0 sm:p-4 lg:p-6 xl:p-8">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
