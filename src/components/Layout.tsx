import { ReactNode, useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

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
    <div className="min-h-screen bg-transparent ice-gradient flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden pt-16 relative">
        <Sidebar isOpen={sidebarOpen} />
        {/* Click-away overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Adjusted padding: Main layout has padding bottom for mobile nav */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${sidebarOpen ? 'sm:ml-64' : 'ml-0'} pb-20 sm:pb-0`}>
          <div className="p-0 sm:p-6 lg:p-8 mx-auto max-w-[2000px]">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
