import { Search, Bell, Video, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-ice-glass border-b ice-border z-50 flex items-center px-6 justify-between transition-all">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-cold-hover rounded-full text-slate-300 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-4">
          {/* Logo provided by user */}
          <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-white/5 border ice-border shadow-[0_0_15px_rgba(112,214,255,0.15)]">
             <img src="https://res.cloudinary.com/du6zw4m8g/image/upload/v1776451556/5395585251976877323_gkvgwj.jpg" alt="Icetube 2.0" className="w-full h-full object-cover" />
          </div>
          <div className="ice-logo hidden sm:flex">
            <span>ICETUBE</span>
            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30 tracking-normal font-medium leading-none">2.0</div>
          </div>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl px-8 hidden md:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-ice-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search the arctic..." 
            className="w-full bg-white/5 border ice-border rounded-full py-2 px-6 pl-10 text-sm focus:outline-none focus:border-blue-400/50 transition-colors placeholder:text-slate-500 text-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="md:hidden p-2 hover:bg-cold-hover rounded-full text-slate-300 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-cold-hover rounded-full text-slate-300 transition-colors relative">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-[rgba(112,214,255,0.08)] rounded-full text-slate-300 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#70d6ff] rounded-full shadow-[0_0_8px_rgba(112,214,255,0.8)]"></span>
        </button>
        <button className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border border-white/20 flex items-center justify-center transition-colors">
          <User className="w-4 h-4 text-white" />
        </button>
      </div>
    </nav>
  );
}
