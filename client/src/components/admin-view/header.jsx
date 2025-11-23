import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

function AdminHeader() {
  const { resetCredentials } = useContext(AuthContext);
  const { t } = useLanguage();

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  }

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b bg-white shadow-sm">
      <Link to="/admin" className="flex items-center justify-center">
        <GraduationCap className="h-8 w-8 mr-4" />
        <span className="font-extrabold text-xl">LMS LEARN - Admin</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Button onClick={handleLogout} variant="ghost" size="sm">
          {t("common.signOut")}
        </Button>
      </div>
    </header>
  );
}

export default AdminHeader;

