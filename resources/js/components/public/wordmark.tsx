import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { cn } from '@/lib/utils';

/**
 * "GymRat" wordmark: Archivo Black, slanted, with "Rat" in the brand yellow.
 */
export function Wordmark({
    className,
    withIcon = false,
}: {
    className?: string;
    withIcon?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 font-num text-xl leading-none',
                className,
            )}
        >
            {withIcon && (
                <img
                    src="/images/logo/gymrat-icon-128.png"
                    alt=""
                    className="size-9 shrink-0 object-contain"
                />
            )}
            <span className="italic">
                Gym<span className="text-primary-text">Rat</span>
            </span>
        </span>
    );
}

/**
 * The mascot standing on the yellow/black hazard tape, used at the top of
 * auth and error screens.
 */
export function MascotOnTape({
    className,
    imageClassName,
    children,
}: {
    className?: string;
    imageClassName?: string;
    /** Rendered behind the mascot (e.g. a giant "404"). */
    children?: React.ReactNode;
}) {
    return (
        <div className={cn('relative', className)}>
            {children}
            <img
                src={MASCOT_SRC}
                alt=""
                className={cn(
                    'relative mx-auto block h-auto w-[62%] max-w-[260px]',
                    imageClassName,
                )}
            />
            <div aria-hidden className="h-3 bg-hazard" />
        </div>
    );
}
