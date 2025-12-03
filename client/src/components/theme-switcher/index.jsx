// client/src/components/theme-switcher/index.jsx
import { useTheme } from "@/context/theme-context";
import { Moon, Sun } from "lucide-react";

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      <div className="theme-switcher__icon-wrapper">
        {theme === "dark" ? (
          <Sun className="theme-switcher__icon" />
        ) : (
          <Moon className="theme-switcher__icon" />
        )}
      </div>
    </button>
  );
}

export default ThemeSwitcher;

