import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    ClipboardList,
    Dumbbell,
    Footprints,
    Home,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTrainHref } from '@/hooks/use-train-href';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import activities from '@/routes/activities';
import routines from '@/routes/routines';
import stats from '@/routes/stats';

type Tab = { title: string; href: string; icon: LucideIcon };

const leftTabs: Tab[] = [
    { title: 'Inicio', href: dashboard.url(), icon: Home },
    { title: 'Rutinas', href: routines.index.url(), icon: ClipboardList },
];

const rightTabs: Tab[] = [
    { title: 'Carreras', href: activities.index.url(), icon: Footprints },
    { title: 'Progreso', href: stats.index.url(), icon: BarChart3 },
];

/**
 * Bottom navigation on phones, with the raised "Entrenar" action in the middle.
 */
export function MobileTabBar() {
    const { currentUrl } = useCurrentUrl();
    const trainHref = useTrainHref();
    const isActive = (href: string) => currentUrl.startsWith(href);

    const tab = ({ title, href, icon: Icon }: Tab) => (
        <Link
            key={title}
            href={href}
            prefetch
            className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold',
                isActive(href) ? 'text-primary-text' : 'text-muted-foreground',
            )}
            aria-current={isActive(href) ? 'page' : undefined}
        >
            <Icon className="size-6" aria-hidden />
            {title}
        </Link>
    );

    return (
        <nav
            aria-label="Navegación principal"
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
            <div className="flex h-16 items-stretch">
                {leftTabs.map(tab)}
                <Link
                    href={trainHref}
                    className="flex flex-1 flex-col items-center justify-end gap-1 pb-1 text-[11px] font-bold text-foreground"
                >
                    <span className="-mt-7 grid size-14 place-items-center rounded-[18px] bg-primary text-primary-foreground shadow-float">
                        <Dumbbell className="size-6 -rotate-45" aria-hidden />
                    </span>
                    Entrenar
                </Link>
                {rightTabs.map(tab)}
            </div>
        </nav>
    );
}
