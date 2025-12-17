// client/src/components/instructor-view/header/index.jsx

import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function InstructorHeader() {
  const { t, language } = useLanguage();
  const isRTL = language === "fa";

  return (
    <header className={`
      h-16 flex items-center justify-between 
      px-6 lg:px-8 
      border-b border-border 
      bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80
      shadow-sm sticky top-0 z-50
    `}>
      {/* لوگو و نام سایت */}
      <Link 
        to="/instructor" 
        className={`
          flex items-center gap-3 
          transition-all duration-300 
          hover:scale-105 active:scale-100
          ${isRTL ? "flex-row-reverse" : ""}
        `}
      >
        <div className="relative">
          <GraduationCap className="h-9 w-9 text-primary" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-foreground">
          {t("app.name") || "فجرانه"}
        </span>
      </Link>

      {/* سوئیچرها */}
      <div className={`
        flex items-center gap-4
        ${isRTL ? "flex-row-reverse" : ""}
      `}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default InstructorHeader;