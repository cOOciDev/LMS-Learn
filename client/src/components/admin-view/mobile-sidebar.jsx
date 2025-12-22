import {
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./sidebar";

function AdminMobileSidebar({ open, onClose }) {
  const { t } = useLanguage();
  const { resetCredentials } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const sections = NAV_SECTIONS(t);

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  function handleMenuClick(path) {
    navigate(path);
    onClose?.();
  }

  async function handleLogout() {
    await resetCredentials();
    sessionStorage.clear();
    navigate("/auth");
    onClose?.();
  }

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-40 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-opacity",
          open ? "bg-slate-900/40 opacity-100" : "bg-transparent opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 overflow-y-auto border-r border-slate-200/80 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 dark:border-slate-800/70 dark:bg-slate-950/90",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
            {t("admin.adminPanel") || "Admin Panel"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200/80 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200"
            aria-label={t("common.closeMenu") || "Close admin menu"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.items.map((menuItem) => {
                  const active = isActivePath(menuItem.path);
                  return (
                    <button
                      key={menuItem.path}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left font-medium transition-all",
                        active
                          ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/40"
                          : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                      )}
                      onClick={() => handleMenuClick(menuItem.path)}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-2xl border text-sm transition-all",
                          active
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-slate-200 bg-white text-indigo-500 dark:border-slate-700 dark:bg-slate-900/40"
                        )}
                      >
                        <menuItem.icon className="h-4 w-4" />
                      </div>
                      <span>{menuItem.label}</span>
                      {active && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-white/80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/75 p-4 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900/5 p-3 text-indigo-500 dark:bg-slate-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {t("admin.generalSettings") || "Security Center"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("admin.messagesDescription") ||
                  "Stay updated with platform insights."}
              </p>
            </div>
          </div>
          <Button
            className="w-full rounded-2xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            variant="outline"
            onClick={handleLogout}
          >
            {t("common.signOut") || "Sign Out"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default AdminMobileSidebar;
