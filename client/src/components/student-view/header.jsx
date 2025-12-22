// components/student/StudentViewCommonHeader.jsx
import { BookOpen, TvMinimalPlay, Map, Menu, X, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeSwitcher from "@/components/theme-switcher";

function StudentViewCommonHeader() {
  const navigate = useNavigate();
  const { resetCredentials } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const isRTL = language === "fa";
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await resetCredentials();
    sessionStorage.clear();
    navigate("/auth");
  }

  const navItems = [

    {
      label: t("common.exploreCourses"),
      icon: <BookOpen className="w-5 h-5" />,
      onClick: () => {
        navigate("/courses");
        setOpen(false);
      },
    },
    {
      label: t("roadmap.title"),
      icon: <Map className="w-5 h-5" />,
      onClick: () => {
        navigate("/roadmap");
        setOpen(false);
      },
    },
    {
      label: t("common.myCourses"),
      icon: <TvMinimalPlay className="w-6 h-6" />,
      onClick: () => {
        navigate("/student-courses");
        setOpen(false);
      },
    },
    {
      label: t("common.tickets") || t("common.support"),
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: () => {
        navigate("/tickets");
        setOpen(false);
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* لوگو و اسم - همیشه وسط یا چپ/راست بسته به زبان */}
        <div
          className={`flex items-center ${
            isRTL ? "ml-auto" : "mr-auto"
          } absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          
        </div>

        <Link
            to="/home"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <img
              src="/favicon.png"
              alt="logo"
              className="h-9 w-9 object-contain"
            />
            <span
              className="font-black text-xl tracking-tighter"
              style={{ color: "#002F60" }}
            >
              Fajrane
            </span>
          </Link>
        {/* منوی دسکتاپ - فقط تو lg نشون بده */}
        <nav className="hidden lg:flex items-center gap-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/courses")}
            className="font-medium hover:bg-accent flex items-center gap-2"
          >  <BookOpen className="w-5 h-5" />

            {t("common.exploreCourses")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/roadmap")}
            className="font-medium hover:bg-accent flex items-center gap-2"
          >
            <Map className="w-5 h-5" />
            {t("roadmap.title")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/student-courses")}
            className="font-medium hover:bg-accent flex items-center gap-3"
          >
            <TvMinimalPlay className="w-6 h-6" />
            {t("common.myCourses")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/tickets")}
            className="font-medium hover:bg-accent flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            {t("common.tickets") || t("common.support")}
          </Button>
        </nav>

        {/* دکمه‌های راست - دسکتاپ */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Button onClick={handleLogout} variant="destructive" size="sm">
            {t("common.signOut")}
          </Button>
        </div>

        {/* منوی موبایل - همبرگری خفن */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">منو</span>
            </Button>
          </SheetTrigger>
          <SheetContent side={isRTL ? "right" : "left"} className="w-80 pt-12">
            <div className="flex flex-col space-y-6">
              <div className="space-y-4">
                {navItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-lg font-medium h-14"
                    onClick={item.onClick}
                  >
                    <div
                      className={`flex items-center gap-4 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">
                    {t("common.theme")}
                  </span>
                  <ThemeSwitcher />
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">
                    {t("common.language")}
                  </span>
                  <LanguageSwitcher />
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full mt-8"
              >
                {t("common.signOut")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default StudentViewCommonHeader;
