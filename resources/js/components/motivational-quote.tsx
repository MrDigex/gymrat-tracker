import { router } from '@inertiajs/react';
import { Quote, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type MotivationalQuoteProps = {
    quote: { text: string; author: string | null } | null;
    quoteOffset: number;
    className?: string;
};

export default function MotivationalQuote({
    quote,
    quoteOffset,
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
        <Card className={cn('gap-0 py-0', className)}>
            <CardContent className="flex items-start gap-4 p-5">
                <Quote
                    className="mt-0.5 size-6 shrink-0 text-yellow-500 dark:text-yellow-400"
                    aria-hidden
                />
                <figure className="min-w-0 flex-1 space-y-1">
                    <blockquote className="text-base font-medium text-balance">
                        “{quote.text}”
                    </blockquote>
                    {quote.author && (
                        <figcaption className="text-sm text-muted-foreground">
                            — {quote.author}
                        </figcaption>
                    )}
                </figure>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextQuote}
                    disabled={loading}
                    className="shrink-0"
                >
                    <RefreshCw
                        className={cn('size-4', loading && 'animate-spin')}
                    />
                    <span className="hidden sm:inline">Otra frase</span>
                    <span className="sr-only sm:hidden">Otra frase</span>
                </Button>
            </CardContent>
        </Card>
    );
}
