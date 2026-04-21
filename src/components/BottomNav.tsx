import { Home, Compass, PlusCircle, PlaySquare, Library } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

export function BottomNav() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get("category");

  const items = [
    { icon: Home, label: "Home", path: "/", active: location.pathname === "/" && !activeCategory },
    { icon: Compass, label: "Explore", path: "/?category=Explore", active: activeCategory === "Explore" },
    { icon: PlusCircle, label: "Upload", path: "/upload", active: false, center: true },
    { icon: PlaySquare, label: "Library", path: "/library", active: location.pathname === "/library" },
    { icon: Library, label: "You", path: "/your-videos", active: location.pathname === "/your-videos" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-ice-glass border-t ice-border z-50 flex items-center justify-around sm:hidden px-2 pb-safe">
      {items.map((item, idx) => {
        const Icon = item.icon;
        if (item.center) {
          return (
            <Link key={idx} to={item.path} className="flex flex-col items-center justify-center relative -top-3">
               <div className="w-12 h-12 bg-gradient-to-br from-[#70d6ff] to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(112,214,255,0.4)] text-black">
                 <Icon className="w-6 h-6 stroke-[2.5]" />
               </div>
            </Link>
          );
        }

        return (
          <Link key={idx} to={item.path} className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
            <Icon 
              className={clsx(
                "w-6 h-6 transition-colors", 
                item.active ? "text-[#70d6ff] fill-[rgba(112,214,255,0.1)]" : "text-slate-400"
              )} 
            />
            <span className={clsx("text-[10px] font-medium transition-colors", item.active ? "text-slate-100" : "text-slate-500")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  );
}
