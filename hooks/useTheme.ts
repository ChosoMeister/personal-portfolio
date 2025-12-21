
import { useState, useEffect, useCallback } from 'react';

export type ThemeOption = 'light' | 'dark' | 'system' | 'amoled' | 'sunset' | 'ocean' | 'forest';

const ALL_THEME_CLASSES = ['dark', 'amoled', 'sunset', 'ocean', 'forest'];

/**
 * Hook for managing theme state and system preference detection
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeOption>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = localStorage.getItem('theme') as ThemeOption | null;
        return stored || 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'amoled' | 'sunset' | 'ocean' | 'forest'>('light');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let nextTheme: typeof resolvedTheme;

            if (theme === 'system') {
                nextTheme = mediaQuery.matches ? 'dark' : 'light';
            } else if (theme === 'light') {
                nextTheme = 'light';
            } else {
                nextTheme = theme;
            }

            setResolvedTheme(nextTheme);

            // Remove all theme classes first
            ALL_THEME_CLASSES.forEach(cls => document.body.classList.remove(cls));

            // Add appropriate class for non-light themes
            if (nextTheme !== 'light') {
                document.body.classList.add(nextTheme);
            }

            localStorage.setItem('theme', theme);
        };

        applyTheme();

        if (theme === 'system') {
            mediaQuery.addEventListener('change', applyTheme);
            return () => mediaQuery.removeEventListener('change', applyTheme);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'amoled';
            if (prev === 'amoled') return 'sunset';
            if (prev === 'sunset') return 'ocean';
            if (prev === 'ocean') return 'forest';
            if (prev === 'forest') return 'system';
            return 'light';
        });
    }, []);

    return {
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
        isDark: resolvedTheme !== 'light',
    };
};

export default useTheme;
