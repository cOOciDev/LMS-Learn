import { GraduationCap, TvMinimalPlay, Map } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function StudentViewCommonHeader() {
  const navigate = useNavigate();
  const { resetCredentials } = useContext(AuthContext);
  const { t } = useLanguage();

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  }

  return (
    <header className="flex items-center justify-between p-4 border-b relative">
      <div className="flex items-center space-x-4">
        <Link
          to="/home"
          className="flex items-center px-2 py-1 rounded-md hover:bg-[#262626]"
        >
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold md:text-xl text-[14px]">
            LMS LEARN
          </span>
        </Link>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => {
              location.pathname.includes("/courses")
                ? null
                : navigate("/courses");
            }}
            className="text-[14px] md:text-[16px] font-medium"
          >
            {t("common.exploreCourses")}
          </Button>
          {/* دکمه Roadmap */}
          <Button
            variant="ghost"
            onClick={() => navigate("/roadmap")}
            className="text-[14px] md:text-[16px] font-medium flex items-center gap-1"
          >
            <Map className="w-5 h-5" />
            {t("roadmap.title")}
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex gap-4 items-center">
          <div
            onClick={() => navigate("/student-courses")}
            className="flex cursor-pointer items-center gap-3"
          >
            <span className="font-extrabold md:text-xl text-[14px]">
              {t("common.myCourses")}
            </span>
            <TvMinimalPlay className="w-8 h-8 cursor-pointer" />
          </div>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Button onClick={handleLogout}>{t("common.signOut")}</Button>
        </div>
      </div>
    </header>
  );
}

export default StudentViewCommonHeader;
