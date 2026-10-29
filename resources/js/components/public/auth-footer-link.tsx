import type { ReactNode } from 'react';

/**
 * Secondary link pinned to the bottom of auth screens on mobile.
 */
export function AuthFooterLink({ children }: { children: ReactNode }) {
    return (
        <p className="mt-auto pt-8 text-center text-[15px] lg:mt-8">
            {children}
        </p>
    );
}
