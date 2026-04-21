import { LayoutDashboard, Film, Wand2, ShieldAlert, Settings, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";

export function StudioSidebar({ isOpen, onClose }: { isOpen: boolean, onClose?: () => void }) {
  const location = useLocation();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const studioItems = [
    { icon: LayoutDashboard, label: t('studio_title'), path: "/studio" },
    { icon: Film, label: t('studio_content'), path: "/studio" }, // Could lead to a sub-tab
    { icon: Wand2, label: t('studio_customize'), path: "/studio/editor" },
    { divider: true },
    { icon: Home, label: t('nav_home'), path: "/" },
  ];

  // If admin, show admin panel
  if (user?.email === 'xolodtop889@gmail.com') {
    studioItems.splice(2, 0, { icon: ShieldAlert, label: t('nav_admin'), path: "/admin" });
  }

  return (
    <aside className={clsx(
      "fixed left-0 top-16 bottom-0 w-64 bg-[#0a192f] border-r ice-border overflow-y-auto px-4 py-4 z-50 transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col gap-2">
        <Link to="/" className="flex items-center gap-2 text-[#70d6ff] mb-6 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t('studio_back_home')}</span>
        </Link>

        {studioItems.map((item, index) => {
          if ('divider' in item && item.divider) {
            return <hr key={index} className="my-2 ice-border opacity-20" />;
          }

          if (!('label' in item)) return null;

          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path || "#"}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group",
                isActive 
                  ? "bg-[#70d6ff]/10 text-[#70d6ff] font-medium" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5",
                isActive ? "text-[#70d6ff]" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
