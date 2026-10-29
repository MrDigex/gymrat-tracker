import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type MotivationalQuoteProps = {
    quote: { text: string; author: string | null } | null;
    quoteOffset: number;
    /** Always stack the quote and the button (for narrow columns). */
    stacked?: boolean;
    className?: string;
};

export default function MotivationalQuote({
    quote,
    quoteOffset,
    stacked = false,
    className,
}: MotivationalQuoteProps) {
    const [loading, setLoading] = useState(false);

    if (!quote) {
        return null;
    }

    const nextQuote = () => {
        router.get(
            dashboard.url({ query: { frase: quoteOffset + 1 } }),
            {},
            {
                only: ['quote', 'quoteOffset'],
                preserveScroll: true,
                preserveState: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <section
            aria-label="Frase del día"
            className={cn(
                'flex flex-col gap-4 rounded-xl border bg-card p-5',
                !stacked && 'md:flex-row md:items-center md:gap-5 md:px-6',
                className,
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'h-7 shrink-0 font-num text-6xl leading-[0.85] text-primary-text',
                    !stacked && 'md:self-start',
                )}
            >
                “
            </span>
            <figure aria-live="polite" className="min-w-0 flex-1 space-y-1">
                <blockquote className="text-lg leading-snug font-bold text-balance md:text-xl">
                    {quote.text}
                </blockquote>
                {quote.author && (
                    <figcaption className="text-sm text-muted-foreground">
                        {quote.author}
                    </figcaption>
                )}
            </figure>
            <Button
                variant="outline"
                onClick={nextQuote}
                disabled={loading}
                className={cn(
                    'h-11 self-start rounded-lg px-4 font-bold',
                    !stacked && 'md:self-center',
                )}
            >
                <RefreshCw
                    className={cn('size-4', loading && 'animate-spin')}
                    aria-hidden
                />
                Otra frase
            </Button>
        </section>
    );
}
