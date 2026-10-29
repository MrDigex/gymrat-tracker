import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { index as integrationsIndex } from '@/routes/integrations';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Perfil', href: edit(), icon: null },
    { title: 'Seguridad', href: editSecurity(), icon: null },
    { title: 'Apariencia', href: editAppearance(), icon: null },
    { title: 'Integraciones', href: integrationsIndex(), icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const onProfile = isCurrentOrParentUrl(edit());

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                {!onProfile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 size-11 lg:hidden"
                        asChild
                    >
                        <Link href={edit()} aria-label="Volver a ajustes">
                            <ChevronLeft className="size-6" />
                        </Link>
                    </Button>
                )}
                <h1 className="font-num text-[32px] leading-none uppercase lg:text-5xl">
                    Ajustes
                </h1>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <aside className="hidden w-56 shrink-0 lg:block">
                    <nav className="flex flex-col gap-1" aria-label="Ajustes">
                        {sidebarNavItems.map((item) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={toUrl(item.href)}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex h-11 items-center justify-between rounded-lg px-3.5 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                        active
                                            ? 'bg-card font-bold'
                                            : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                                    )}
                                >
                                    {item.title}
                                    {active && (
                                        <span
                                            className="h-5 w-1.5 rounded-full bg-primary"
                                            aria-hidden
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex w-full max-w-3xl min-w-0 flex-col gap-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
