import { MonitorPlay } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";

export default function ComingSoon() {
  const location = useLocation();
  const { t } = useLanguage();
  
  const pathPart = location.pathname.split("/")[1];
  const translationKey = pathPart ? `page_${pathPart.replace('-', '_')}` : 'page_feature';
  const pageName = t(translationKey);
  
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-[rgba(112,214,255,0.05)] border ice-border flex justify-center items-center">
        <MonitorPlay className="w-12 h-12 text-[#70d6ff]" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100 capitalize mb-4">{pageName}</h1>
      <p className="text-slate-400 max-w-md mx-auto">
        {t('coming_soon_desc')}
      </p>
    </div>
  );
}
