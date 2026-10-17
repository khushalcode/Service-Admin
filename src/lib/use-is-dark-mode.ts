import { useEffect, useState } from "react";

/**
 * Tracks the `dark` class on <html>, toggled by theme-toggle.tsx. No
 * ThemeProvider wraps the app, so this mirrors that manual approach via
 * MutationObserver instead of next-themes' useTheme.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
