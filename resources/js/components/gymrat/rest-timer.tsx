import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const mmss = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

type RestTimerProps = {
    /** Rest length in seconds. Remount (change `key`) to restart after each saved set. */
    seconds: number;
    onDone?: () => void;
    onSkip?: () => void;
    variant?: 'floating' | 'inline';
    className?: string;
};

/**
 * Rest countdown based on the real clock (Date.now), so it does not drift when
 * the tab is in the background. Vibrates when it reaches zero.
 */
export function RestTimer({
    seconds,
    onDone,
    onSkip,
    variant = 'floating',
    className,
}: RestTimerProps) {
    const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
    const [total, setTotal] = useState(seconds);
    const [left, setLeft] = useState(seconds);
    const finished = left === 0;

    useEffect(() => {
        if (finished) {
            return;
        }

        const id = setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil((endAt - Date.now()) / 1000),
            );

            setLeft(remaining);

            if (remaining === 0) {
                navigator.vibrate?.([200, 80, 200]);
                onDone?.();
            }
        }, 250);

        return () => clearInterval(id);
    }, [endAt, finished, onDone]);

    const addFifteen = () => {
        const nextEnd = Math.max(endAt, Date.now()) + 15_000;

        setEndAt(nextEnd);
        setTotal((current) => Math.max(current, left + 15));
        setLeft(Math.ceil((nextEnd - Date.now()) / 1000));
    };

    const percent = total > 0 ? (left / total) * 100 : 0;

    if (variant === 'inline') {
        const radius = 64;
        const circumference = 2 * Math.PI * radius;

        return (
            <div
                className={cn(
                    'overflow-hidden rounded-xl transition-colors duration-[180ms]',
                    finished
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-foreground text-background',
                    className,
                )}
                role="timer"
            >
                <div className="h-1.5 bg-hazard" aria-hidden />
                <div className="flex flex-col items-center gap-3 p-4 pt-3">
                    <span className="text-[13px] font-bold opacity-70">
                        {finished ? '¡A por la siguiente!' : 'Descanso'}
                    </span>
                    <div className="relative grid size-40 place-items-center">
                        <svg
                            className="absolute inset-0"
                            viewBox="0 0 160 160"
                            aria-hidden
                        >
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity={0.12}
                                strokeWidth="10"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={
                                    circumference * (1 - percent / 100)
                                }
                                transform="rotate(-90 80 80)"
                                className="transition-[stroke-dashoffset] duration-300 ease-linear"
                            />
                        </svg>
                        <span className="font-num text-[40px] leading-none">
                            {mmss(left)}
                        </span>
                    </div>
                    <span className="sr-only" aria-live="polite">
                        {finished ? 'Descanso terminado' : ''}
                    </span>
                    <div className="grid w-full grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={addFifteen}
                            className="h-12 rounded-md border-2 border-current text-[15px] font-extrabold active:scale-[.97]"
                        >
                            +15 s
                        </button>
                        <button
                            type="button"
                            onClick={onSkip}
                            className={cn(
                                'h-12 rounded-md text-[15px] font-extrabold active:scale-[.97]',
                                finished
                                    ? 'bg-[#18181b] text-primary'
                                    : 'bg-background text-primary-text dark:text-primary',
                            )}
                        >
                            {finished ? 'Cerrar' : 'Saltar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            role="timer"
            className={cn(
                'fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 animate-sheet-up overflow-hidden rounded-[20px] shadow-float sm:right-6 sm:left-auto sm:w-96',
                'transition-colors duration-[180ms]',
                finished
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground text-background',
                className,
            )}
        >
            <div className="h-1.5 bg-black/10">
                <div
                    className="h-full bg-current transition-[width] duration-300 ease-linear"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="flex items-center gap-2.5 py-2.5 pr-2.5 pl-4">
                <div className="flex flex-1 flex-col">
                    <span className="text-xs font-bold opacity-70">
                        {finished ? '¡A por la siguiente!' : 'Descanso'}
                    </span>
                    <span className="font-num text-[32px] leading-none">
                        {mmss(left)}
                    </span>
                    <span className="sr-only" aria-live="polite">
                        {finished ? 'Descanso terminado' : ''}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={addFifteen}
                    className="h-12 rounded-md border-2 border-current px-3.5 text-[15px] font-extrabold active:scale-[.97]"
                >
                    +15 s
                </button>
                <button
                    type="button"
                    onClick={onSkip}
                    className={cn(
                        'h-12 rounded-md px-4 text-[15px] font-extrabold active:scale-[.97]',
                        finished
                            ? 'bg-[#18181b] text-primary'
                            : 'bg-background text-primary-text dark:text-primary',
                    )}
                >
                    {finished ? 'Cerrar' : 'Saltar'}
                </button>
            </div>
        </div>
    );
}
