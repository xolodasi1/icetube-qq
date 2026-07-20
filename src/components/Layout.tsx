import { ReactNode, useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { StudioSidebar } from "./StudioSidebar";
import { BottomNav } from "./BottomNav";
import { useLocation } from "react-router-dom";
import { Box } from "lucide-react";

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
      {/* Background Aurora */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-60">
        <div className="absolute top-[-100px] left-[-10%] w-[60%] h-[300px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff80]/15 via-[#00f0ff]/5 to-transparent blur-[100px]"></div>
        <div className="absolute top-[-50px] right-[-10%] w-[50%] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#70d6ff]/15 via-[#6a00ff]/5 to-transparent blur-[120px]"></div>
      </div>

      {/* Background Floating Ice Cubes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
        <Box className="absolute top-[15%] left-[5%] w-12 h-12 text-[#70d6ff] animate-pulse" style={{ animationDuration: '3s' }} />
        <Box className="absolute top-[35%] right-[10%] w-8 h-8 text-[#00ff80] animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <Box className="absolute top-[65%] left-[15%] w-16 h-16 text-[#70d6ff] animate-pulse blur-[1px]" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <Box className="absolute top-[80%] right-[20%] w-10 h-10 text-[#70d6ff] animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        <Box className="absolute top-[45%] left-[45%] w-6 h-6 text-[#00ff80] animate-pulse blur-[2px]" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
        <Box className="absolute top-[25%] left-[35%] w-10 h-10 text-[#70d6ff] animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.2s' }} />
        <Box className="absolute top-[75%] left-[85%] w-14 h-14 text-[#70d6ff] animate-pulse blur-[1px]" style={{ animationDuration: '5.5s', animationDelay: '2.5s' }} />
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
          <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${!isAdminView && sidebarOpen ? 'sm:ml-64' : 'ml-0'} ${location.pathname.startsWith('/watch') ? 'pb-0' : 'pb-20 sm:pb-0'}`}>
            <div className="p-0 sm:p-6 lg:p-8 mx-auto max-w-[2000px]">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
