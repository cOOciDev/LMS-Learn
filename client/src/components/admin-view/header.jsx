import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function AdminHeader() {
  const { t } = useLanguage();

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b bg-white shadow-sm">
      <Link to="/admin" className="flex items-center justify-center">
        <GraduationCap className="h-8 w-8 mr-4" />
        <span className="font-extrabold text-xl">LMS LEARN - Admin</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default AdminHeader;

