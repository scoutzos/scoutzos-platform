'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    try {
        const { theme, toggleTheme } = useTheme();

        return (
            <button
                onClick={toggleTheme}
                className="
        p-2 rounded-lg
        text-white/80 hover:text-white hover:bg-white/10
        transition-colors duration-200
        relative
      "
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                ) : (
                    <Sun className="w-5 h-5" />
                )}
            </button>
        );
    } catch (error) {
        // Return null if ThemeProvider is not available (SSR)
        return null;
    }
}
