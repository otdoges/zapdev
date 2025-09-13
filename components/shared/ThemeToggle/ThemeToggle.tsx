"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder button to avoid hydration mismatch
    return (
      <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 opacity-50">
        <div className="w-4 h-4 rounded-full bg-gray-300" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-black-alpha-4 hover:bg-black-alpha-6 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-300"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Sun icon (light mode) */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark 
            ? "opacity-0 rotate-90 scale-75" 
            : "opacity-100 rotate-0 scale-100"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      
      {/* Moon icon (dark mode) */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark 
            ? "opacity-100 rotate-0 scale-100" 
            : "opacity-0 -rotate-90 scale-75"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
      
      {/* Hover effect background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}