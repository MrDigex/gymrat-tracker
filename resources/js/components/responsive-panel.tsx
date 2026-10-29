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
 */
export function ResponsivePanel({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className={cn(
                    'flex max-h-[90dvh] flex-col gap-3 rounded-xl p-6 sm:max-w-lg',
                    className,
                )}
            >
                <DialogHeader className="shrink-0">
                    <DialogTitle className="font-num text-xl uppercase">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
