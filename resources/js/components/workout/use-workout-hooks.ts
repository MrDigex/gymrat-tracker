import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Matches the `xl` breakpoint (1280px), where the active workout switches to
 * the three-column desktop layout.
 */
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1280px)');
}

/**
 * Wide enough (sidebar included) for the sets table and the logger side by side.
 */
export function useIsWide(): boolean {
    return useMediaQuery('(min-width: 1680px)');
}

function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (callback: () => void) => {
            const mql = window.matchMedia(query);

            mql.addEventListener('change', callback);

            return () => mql.removeEventListener('change', callback);
        },
        [query],
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false,
    );
}

/**
 * Current time, refreshed every `interval` ms while `active`.
 */
export function useNow(active: boolean, interval = 1000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!active) {
            return;
        }

        const id = window.setInterval(() => setNow(Date.now()), interval);

        return () => window.clearInterval(id);
    }, [active, interval]);

    return now;
}
