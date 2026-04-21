import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent ice-gradient flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <div className="p-8 mx-auto max-w-[2000px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
