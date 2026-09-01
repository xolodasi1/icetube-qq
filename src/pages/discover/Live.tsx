import { Radio, Video } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

export default function Live() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-300">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border ice-border">
        <Radio className="w-10 h-10 text-rose-400" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black font-display text-white mb-2">
        {language === "ru" ? "Прямые эфиры" : "Live streams"}
      </h1>
      <p className="text-slate-400 max-w-md mb-4">
        {language === "ru"
          ? "Сейчас нет активных трансляций. Когда авторы запустят эфир, он появится здесь."
          : "There are no active live streams right now. When creators go live, their stream will appear here."}
      </p>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Video className="w-3.5 h-3.5" />
        <span>{language === "ru" ? "Попробуйте позже" : "Check back later"}</span>
      </div>
    </div>
  );
}
