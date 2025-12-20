
import { useState, useEffect, useCallback } from 'react';

export type ThemeOption = 'light' | 'dark' | 'system';

/**
 * Hook for managing theme state and system preference detection
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeOption>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = localStorage.getItem('theme') as ThemeOption | null;
        return stored || 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            const nextTheme = theme === 'system'
                ? (mediaQuery.matches ? 'dark' : 'light')
                : theme;
            setResolvedTheme(nextTheme);
            document.body.classList.toggle('dark', nextTheme === 'dark');
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
            if (prev === 'dark') return 'system';
            return 'light';
        });
    }, []);

    return {
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
        isDark: resolvedTheme === 'dark',
    };
};

export default useTheme;
