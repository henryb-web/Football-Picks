"use client";

// Toggles the `.dark` class on <html> and remembers the choice. The icon
// reflects the current theme purely via CSS, so no React state is needed.
export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore (private mode, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      title="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-cardborder text-muted transition hover:text-foreground"
    >
      <span className="hidden dark:inline">☀</span>
      <span className="inline dark:hidden">☾</span>
    </button>
  );
}
