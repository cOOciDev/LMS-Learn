import {
  Users,
  UserPlus,
  BarChart3,
  LayoutGrid,
  BookOpenCheck,
  GraduationCap,
  DollarSign,
  MessageCircle,
  Settings2,
  Tags,
  ShieldCheck,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/language-context";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = (t) => [
  {
    title: t("admin.overview") || "Overview",
    items: [
      {
        icon: LayoutGrid,
        label: t("admin.dashboard") || "Dashboard",
        path: "/admin",
      },
      {
        icon: BarChart3,
        label: t("admin.financialReports") || "Financial Reports",
        path: "/admin/financial",
      },
    ],
  },
  {
    title: t("admin.people") || "People",
    items: [
      {
        icon: UserPlus,
        label: t("admin.registerUser") || "Register User",
        path: "/admin/register-user",
      },
      {
        icon: Users,
        label: t("admin.userManagement") || "User Management",
        path: "/admin/users",
      },
      {
        icon: GraduationCap,
        label: t("admin.instructorManagement") || "Instructors",
        path: "/admin/instructors",
      },
    ],
  },
  {
    title: t("admin.learning") || "Learning",
    items: [
      {
        icon: BookOpenCheck,
        label: t("common.courses") || "Courses",
        path: "/admin/courses",
      },
      {
        icon: Tags,
        label: t("admin.categoryManagement") || "Categories",
        path: "/admin/categories",
      },
      {
        icon: Map,
        label: t("admin.roadmapManagement") || "Roadmaps",
        path: "/admin/roadmaps",
      },
      {
        icon: MessageCircle,
        label: t("admin.messages") || "Messages",
        path: "/admin/messages",
      },
    ],
  },
  {
    title: t("admin.system") || "System",
    items: [
      {
        icon: DollarSign,
        label: t("admin.revenueTools") || "Revenue Tools",
        path: "/admin/financial",
      },
      {
        icon: Settings2,
        label: t("admin.settings") || "Settings",
        path: "/admin/settings",
      },
    ],
  },
];

function AdminSidebar() {
  const { t } = useLanguage();
  const { resetCredentials } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const sections = NAV_SECTIONS(t);

  function handleMenuClick(path) {
    navigate(path);
  }

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    navigate("/auth");
  }

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="hidden w-72 border-r border-slate-200/70 bg-white/80 text-sm text-slate-600 backdrop-blur-xl transition-colors dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 lg:flex">
      <div className="flex h-full w-full flex-col gap-6 p-5">
        <div className="rounded-3xl border border-white/40 bg-gradient-to-br from-indigo-500 via-purple-500 to-slate-900 p-5 text-white shadow-2xl shadow-indigo-500/30 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            {t("admin.adminPanel") || "Admin Panel"}
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            {t("admin.panelSubtitle") || "Manage everything in one place"}
          </h2>
          <p className="mt-3 text-xs text-white/70">
            {t("admin.overview") || "Overview"} · {t("admin.learning") || "Learning"} ·{" "}
            {t("admin.system") || "System"}
          </p>
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

        <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/70 p-4 text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
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
      </div>
    </aside>
  );
}

export default AdminSidebar;
