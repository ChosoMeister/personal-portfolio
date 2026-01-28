
import { useState, useEffect, useDeferredValue, useMemo, useCallback } from 'react';

/**
 * Hook for debounced search with useDeferredValue
 * Provides smooth UX by deferring expensive filtering operations
 */
export const useDebouncedSearch = <T,>(
    items: T[],
    searchQuery: string,
    searchFn: (item: T, query: string) => boolean,
    debounceMs: number = 200
) => {
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
    const deferredQuery = useDeferredValue(debouncedQuery);
    const isStale = debouncedQuery !== deferredQuery;

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchQuery, debounceMs]);

    // Filter items with deferred query
    const filteredItems = useMemo(() => {
        if (!deferredQuery.trim()) return items;
        return items.filter(item => searchFn(item, deferredQuery));
    }, [items, deferredQuery, searchFn]);

    return {
        filteredItems,
        isSearching: isStale,
        deferredQuery,
    };
};

/**
 * Simple debounced value hook
 */
export const useDebouncedValue = <T,>(value: T, delay: number = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for debounced callback
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T => {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    }, [callback, delay, timeoutId]) as T;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return debouncedCallback;
};

export default useDebouncedSearch;
