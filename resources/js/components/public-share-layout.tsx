import { Link, usePage } from '@inertiajs/react';
import { Check, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import { home, register } from '@/routes';

/**
 * Standalone layout for public share pages (visitors are not logged in).
 */
export function PublicShareLayout({
    badge,
    title,
    subtitle,
    author,
    shareUrl,
    shareText,
    children,
}: {
    badge: string;
    title: string;
    subtitle?: ReactNode;
    author: string;
    shareUrl: string;
    shareText: string;
    children: ReactNode;
}) {
    const { name: appName } = usePage().props;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
                    <Link href={home()} className="shrink-0">
                        <img
                            src="/images/logo/gymrat-lockup.png"
                            alt={appName}
                            className="h-10 w-auto"
                        />
                    </Link>
                    <Button asChild size="sm">
                        <Link href={register()}>Crea tu cuenta gratis</Link>
                    </Button>
                </div>
            </header>

            <section className="border-b bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 text-zinc-50">
                <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
                    <span className="inline-block rounded-md bg-yellow-400 px-2.5 py-1 text-xs font-extrabold tracking-widest text-zinc-900 uppercase">
                        {badge}
                    </span>
                    <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                        {title}
                    </h1>
                    {subtitle && (
                        <div className="mt-3 text-zinc-300">{subtitle}</div>
                    )}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="text-sm text-zinc-300">
                            Por{' '}
                            <span className="font-semibold text-zinc-50">
                                {author}
                            </span>
                        </span>
                        <ShareButton url={shareUrl} text={shareText} />
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                {children}
            </main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center">
                    <h2 className="text-xl font-bold">
                        Registra tus entrenamientos y supera tus marcas
                    </h2>
                    <p className="max-w-md text-sm text-muted-foreground">
                        {appName} te sugiere cuánto peso, repeticiones o tiempo
                        hacer en cada sesión para que sigas progresando.
                    </p>
                    <Button asChild size="lg">
                        <Link href={register()}>Crea tu cuenta gratis</Link>
                    </Button>
                </div>
            </footer>
        </div>
    );
}

function ShareButton({ url, text }: { url: string; text: string }) {
    const [copiedText, copy] = useClipboard();

    const share = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            await navigator.share({ url, text }).catch(() => {});

            return;
        }

        await copy(url);
    };

    return (
        <Button
            size="sm"
            variant="secondary"
            onClick={() => void share()}
            className="bg-zinc-50/10 text-zinc-50 hover:bg-zinc-50/20"
        >
            {copiedText === url ? (
                <>
                    <Check /> Enlace copiado
                </>
            ) : (
                <>
                    <Share2 /> Compartir
                </>
            )}
        </Button>
    );
}

/**
 * Big number tile used in the public pages.
 */
export function PublicStat({
    label,
    value,
    className,
}: {
    label: string;
    value: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('rounded-xl border bg-card p-4', className)}>
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
        </div>
    );
}
