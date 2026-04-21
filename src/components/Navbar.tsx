import { Search, Bell, Video, User, Menu, ArrowLeft, LogOut, ShieldAlert, Settings, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, login, logoutUser } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/`);
    }
    setMobileSearchOpen(false);
  };

  if (mobileSearchOpen) {
    return (
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#05070a]/95 backdrop-blur-3xl border-b ice-border z-50 flex items-center px-2 sm:px-6 justify-between transition-all pt-safe">
        <button onClick={() => setMobileSearchOpen(false)} className="p-2 text-slate-300 hover:bg-white/5 rounded-full mr-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input 
            autoFocus
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')} 
            className="w-full bg-white/5 border ice-border rounded-full py-2 px-4 text-sm focus:outline-none focus:border-blue-400/50 transition-colors text-slate-200"
          />
        </form>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-ice-glass border-b ice-border z-50 flex items-center px-4 sm:px-6 justify-between transition-all pt-safe">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-[rgba(112,214,255,0.08)] rounded-full text-slate-300 transition-colors"
        >
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

      <div className="flex-1 max-w-2xl px-4 sm:px-8 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center shrink-0">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-[#70d6ff] transition-colors" />
          </button>
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')} 
            className="w-full bg-white/5 border ice-border rounded-full py-2 px-6 pl-10 text-sm focus:outline-none focus:border-blue-400/50 transition-colors placeholder:text-slate-500 text-slate-200"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 hover:bg-cold-hover rounded-full text-slate-300 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => { setShowNotification(!showNotification); setShowUserMenu(false); }}
            className="p-2 hover:bg-[rgba(112,214,255,0.08)] rounded-full text-slate-300 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#70d6ff] rounded-full shadow-[0_0_8px_rgba(112,214,255,0.8)]"></span>
          </button>
          
          {showNotification && (
            <div className="absolute top-12 -right-12 sm:right-0 w-[calc(100vw-32px)] sm:w-80 bg-[#0a192f] border ice-border shadow-2xl rounded-xl z-50 overflow-hidden">
              <div className="p-4 border-b ice-border">
                <span className="font-semibold text-slate-100">Notifications</span>
              </div>
              <div className="p-6 text-center text-sm text-slate-400">
                You have no new notifications right now. Keep exploring the ice!
              </div>
            </div>
          )}
        </div>
        <div className="relative ml-2">
          {user ? (
            <>
              <button 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotification(false); }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#70d6ff] to-blue-600 border border-white/20 flex items-center justify-center transition-colors text-white font-bold text-sm"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </button>
              
              {showUserMenu && (
                <div className="absolute top-12 -right-4 sm:right-0 w-[calc(100vw-32px)] sm:w-64 bg-[#0a192f] border ice-border shadow-2xl rounded-xl z-50 overflow-hidden" onClick={() => setShowUserMenu(false)}>
                  <div className="p-4 border-b ice-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#70d6ff] to-blue-600 flex items-center justify-center text-white font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <span className="font-semibold text-slate-100 text-sm truncate">{user.name || "User"}</span>
                      <span className="text-xs text-slate-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="py-2 flex flex-col">
                    <Link 
                        to="/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border"
                      >
                        <LayoutDashboard className="w-4 h-4" /> {t('nav_studio')}
                    </Link>
                    {user.email === 'xolodtop889@gmail.com' && (
                      <Link 
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-[#70d6ff] hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border"
                      >
                        <ShieldAlert className="w-4 h-4" /> {t('nav_admin')}
                      </Link>
                    )}
                    <Link 
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2 border-b ice-border"
                      >
                        <Settings className="w-4 h-4" /> {t('nav_settings')}
                    </Link>
                    <button 
                      onClick={logoutUser}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> {t('nav_sign_out')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 border border-[#70d6ff]/40 text-[#70d6ff] hover:bg-[#70d6ff]/10 px-3 sm:px-4 py-1.5 rounded-full transition-colors text-sm font-medium whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav_sign_in')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
