import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

/**
 * Full "GymRat" wordmark; the collapsed (icon-only) sidebar shows the square mascot instead.
 */
export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <img
                src="/images/logo/gymrat-lockup.png"
                alt={name}
                draggable={false}
                className="h-10 w-auto group-data-[collapsible=icon]:hidden"
            />
            <AppLogoIcon
                alt={name}
                className="hidden size-8 group-data-[collapsible=icon]:block"
            />
        </>
    );
}
