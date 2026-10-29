import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/public/wordmark';
import { cn } from '@/lib/utils';
import { dashboard, home, login, register } from '@/routes';

/**
 * Standalone layout for public share pages (visitors are usually not logged
 * in): brand header, content, and a sticky sign-up call to action.
 */
export function PublicShareLayout({
    pitch,
    children,
}: {
    /** One-line pitch above the sign-up button. */
    pitch: string;
    children: ReactNode;
}) {
    const { auth } = usePage().props;
    const loggedIn = Boolean(auth.user);

    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
                <Link href={home()} className="rounded-md">
                    <Wordmark withIcon />
                    <span className="sr-only">Ir al inicio de GymRat</span>
                </Link>
                <Link
                    href={loggedIn ? dashboard() : login()}
                    className="inline-flex min-h-11 items-center rounded-[14px] border px-4 text-[15px] font-bold transition-colors hover:bg-muted"
                >
                    {loggedIn ? 'Mi panel' : 'Entrar'}
                </Link>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-1 pb-8">
                {children}
            </main>

            {!loggedIn && (
                <footer className="sticky bottom-0 z-10">
                    <div aria-hidden className="h-2.5 bg-hazard" />
                    <div className="bg-primary text-primary-foreground">
                        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:py-4">
                            <p className="text-[15px] leading-snug font-bold">
                                {pitch}
                            </p>
                            <Link
                                href={register()}
                                className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-[16px] bg-[#18181b] px-6 font-num text-[17px] text-[#facc15] uppercase transition-colors hover:bg-[#27272a]"
                            >
                                Crea tu cuenta gratis
                            </Link>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}

/**
 * Small label + big number, as used in the public page headers.
 */
export function PublicStat({
    label,
    value,
    unit,
    className,
    valueClassName,
}: {
    label: string;
    value: ReactNode;
    unit?: string;
    className?: string;
    valueClassName?: string;
}) {
    return (
        <div className={className}>
            <div className="text-[13px] text-muted-foreground">{label}</div>
            <div
                className={cn(
                    'font-num text-[26px] leading-tight whitespace-nowrap',
                    valueClassName,
                )}
            >
                {value}
                {unit && (
                    <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Initials for the author avatar ("Demo GymRat" → "DG").
 */
export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}
