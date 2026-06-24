"use client";

import { useEffect, useState } from "react";

// Reflects and toggles the `.dark` class on <html>, persisting the choice.
export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Sync to whatever the no-flash script already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore (private mode, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-cardborder text-muted transition hover:text-foreground"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
