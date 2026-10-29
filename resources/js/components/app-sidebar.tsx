import { Link } from '@inertiajs/react';
import {
    BarChart3,
    ClipboardList,
    Dumbbell,
    Footprints,
    LayoutGrid,
    PlugZap,
    Timer,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useTrainHref } from '@/hooks/use-train-href';
import { dashboard } from '@/routes';
import activities from '@/routes/activities';
import exercises from '@/routes/exercises';
import integrations from '@/routes/integrations';
import routines from '@/routes/routines';
import stats from '@/routes/stats';
import workouts from '@/routes/workouts';
import type { NavItem } from '@/types';

export const mainNavItems: NavItem[] = [
    {
        title: 'Inicio',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Rutinas',
        href: routines.index(),
        icon: ClipboardList,
    },
    {
        title: 'Entrenamientos',
        href: workouts.index(),
        icon: Timer,
    },
    {
        title: 'Ejercicios',
        href: exercises.index(),
        icon: Dumbbell,
    },
    {
        title: 'Carreras',
        href: activities.index(),
        icon: Footprints,
    },
    {
        title: 'Estadísticas',
        href: stats.index(),
        icon: BarChart3,
    },
];

export const footerNavItems: NavItem[] = [
    {
        title: 'Integraciones',
        href: integrations.index(),
        icon: PlugZap,
    },
];

export function AppSidebar() {
    const trainHref = useTrainHref();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="mt-3">
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            tooltip={{ children: 'Entrenar' }}
                            className="justify-center bg-primary font-bold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/80 active:text-primary-foreground"
                        >
                            <Link href={trainHref}>
                                <Dumbbell className="-rotate-45" />
                                <span>Entrenar</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavMain items={footerNavItems} label={null} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
