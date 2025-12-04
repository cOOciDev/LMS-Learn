import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function AdminHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/80 lg:px-8">
      <Link
        to="/admin"
        className="flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            Fajrane
          </p>
          <p className="text-base font-bold">{t("admin.adminPanel") || "Admin Control"}</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default AdminHeader;

