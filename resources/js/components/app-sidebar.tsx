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
import { dashboard } from '@/routes';
import activities from '@/routes/activities';
import exercises from '@/routes/exercises';
import integrations from '@/routes/integrations';
import routines from '@/routes/routines';
import stats from '@/routes/stats';
import workouts from '@/routes/workouts';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
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

const footerNavItems: NavItem[] = [
    {
        title: 'Integraciones',
        href: integrations.index(),
        icon: PlugZap,
    },
];

export function AppSidebar() {
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
