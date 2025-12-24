import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { INSTRUCTOR_MENU_ITEMS, getInstructorActiveTab } from "./sidebar";
import { useUnreadNotifications } from "@/hooks/use-notifications";

function InstructorMobileSidebar({ open, onClose }) {
  const { resetCredentials } = useContext(AuthContext);
  const { t } = useLanguage();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getInstructorActiveTab(location.pathname, location.search);
  const menuItems = INSTRUCTOR_MENU_ITEMS(t).map((item) =>
    item.value === "notifications"
      ? { ...item, badge: unreadCount }
      : item
  );

  const handleMenuClick = (item) => {
    if (item.routePath) {
      navigate(item.routePath);
    } else {
      navigate(`/instructor?tab=${item.value}`);
    }
    onClose?.();
  };

  const handleLogout = async () => {
    await resetCredentials();
    sessionStorage.clear();
    window.location.href = "/auth";
  };

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-40 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-opacity",
          open ? "bg-slate-900/60 opacity-100" : "bg-transparent opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-border/40 bg-card/95 p-5 shadow-2xl backdrop-blur-3xl transition-transform duration-300 dark:border-border/70 dark:bg-slate-950/90",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              {t("instructor.mobileMenuTitle") || "Instructor Menu"}
            </p>
            <button
              type="button"
              className="rounded-full border border-border/40 bg-card/80 p-2 text-foreground shadow-sm transition hover:border-border"
              onClick={onClose}
              aria-label={t("common.closeMenu") || "Close menu"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-3">
            {menuItems.map((menuItem) => (
              <Button
                key={menuItem.value}
                variant={activeTab === menuItem.value ? "default" : "ghost"}
                className="w-full justify-start h-12 px-4 text-base font-medium rounded-xl"
                onClick={() => handleMenuClick(menuItem)}
              >
                <div className="relative mr-2">
                  <menuItem.icon className="h-5 w-5" />
                  {menuItem.badge > 0 && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                      {menuItem.badge}
                    </span>
                  )}
                </div>
                <span>{menuItem.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t("common.logout")}
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default InstructorMobileSidebar;
