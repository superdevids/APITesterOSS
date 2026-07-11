import { writable } from "svelte/store";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export const theme = writable<Theme>(getInitialTheme());

theme.subscribe((val) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", val === "dark");
    localStorage.setItem("theme", val);
  }
});

export function toggleTheme() {
  theme.update((t) => (t === "dark" ? "light" : "dark"));
}
