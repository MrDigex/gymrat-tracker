import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * "× TITLE" header for the race form; the × goes back without saving.
 */
export function FormHeader({
    title,
    subtitle,
    closeHref,
}: {
    title: string;
    subtitle?: string;
    closeHref: string;
}) {
    return (
        <header className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="-ml-2 size-11 shrink-0"
                asChild
            >
                <Link href={closeHref} aria-label="Cancelar y volver">
                    <X className="size-6" />
                </Link>
            </Button>
            <div className="min-w-0">
                <h1 className="font-num text-2xl leading-tight uppercase">
                    {title}
                </h1>
                {subtitle && (
                    <p className="truncate text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </header>
    );
}
