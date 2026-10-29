import type { Auth } from '@/types/auth';
import type { MuscleGroup } from '@/types/gym';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            muscleGroups: MuscleGroup[];
            [key: string]: unknown;
        };
    }
}
