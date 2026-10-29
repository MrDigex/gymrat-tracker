const fallbackName = 'GymRat Tracker';

let cachedName: string | null = null;

/**
 * App name as configured on the server (config('app.name')), read from the
 * initial Inertia page so it never goes stale after a rename. Used where React
 * hooks are not available, such as the document title callback.
 */
export function appName(): string {
    if (cachedName) {
        return cachedName;
    }

    if (typeof document === 'undefined') {
        return fallbackName;
    }

    try {
        const page = JSON.parse(
            document.querySelector('script[data-page="app"]')?.textContent ??
                '{}',
        ) as { props?: { name?: unknown } };

        cachedName =
            typeof page.props?.name === 'string' && page.props.name
                ? page.props.name
                : fallbackName;
    } catch {
        cachedName = fallbackName;
    }

    return cachedName;
}
