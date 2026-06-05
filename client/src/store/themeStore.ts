import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: true,
      toggle: () => {
        const next = !get().isDark;
        document.documentElement.classList.toggle('dark', next);
        set({ isDark: next });
      },
    }),
    { name: 'lifescore-theme' }
  )
);

// Apply persisted theme on load
export function initTheme() {
  const raw = localStorage.getItem('lifescore-theme');
  const isDark = raw ? JSON.parse(raw).state?.isDark ?? true : true;
  document.documentElement.classList.toggle('dark', isDark);
}
