import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 *
 * With `aside`, the desktop dialog becomes two panes: the main content
 * (with the title) on the left and `aside` on the right. Phones ignore
 * `aside`, so the caller decides what the sheet shows.
 */
export function ResponsivePanel({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
    aside,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    /** Right pane of the desktop dialog. */
    aside?: ReactNode;
    className?: string;
}) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
                <SheetContent
                    side="bottom"
                    className={cn(
                        'flex max-h-[92dvh] animate-sheet-up flex-col gap-3 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
                        className,
                    )}
                >
                    <div
                        aria-hidden
                        className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-border"
                    />
                    <SheetHeader className="shrink-0 p-0 text-left">
                        <SheetTitle className="font-num text-xl uppercase">
                            {title}
                        </SheetTitle>
                        {description && (
                            <SheetDescription>{description}</SheetDescription>
                        )}
                    </SheetHeader>
                    {children}
                </SheetContent>
            </Sheet>
        );
    }

    const header = (
        <DialogHeader className="shrink-0">
            <DialogTitle className="font-num text-xl uppercase">
                {title}
            </DialogTitle>
            {description && (
                <DialogDescription>{description}</DialogDescription>
            )}
        </DialogHeader>
    );

    if (aside !== undefined) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent
                    className={cn(
                        'grid h-[min(46rem,90dvh)] grid-cols-2 gap-0 overflow-hidden rounded-2xl bg-card p-0 shadow-float sm:max-w-[min(58rem,calc(100%-4rem))]',
                        className,
                    )}
                >
                    <div className="flex min-h-0 min-w-0 flex-col gap-3 p-6">
                        {header}
                        {children}
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto border-l p-6">
                        {aside}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className={cn(
                    'flex max-h-[90dvh] flex-col gap-3 rounded-xl p-6 sm:max-w-lg',
                    className,
                )}
            >
                {header}
                {children}
            </DialogContent>
        </Dialog>
    );
}
