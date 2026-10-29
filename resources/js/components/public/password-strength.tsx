import { cn } from '@/lib/utils';

type Strength = { score: 0 | 1 | 2 | 3 | 4; message: string };

export function passwordStrength(value: string): Strength {
    if (value.length === 0) {
        return { score: 0, message: '' };
    }

    const hasSymbol = /[^A-Za-z0-9]/.test(value);
    const checks = [
        value.length >= 8,
        /[a-z]/.test(value) && /[A-Z]/.test(value),
        /\d/.test(value),
        hasSymbol,
    ];
    const score = Math.max(
        1,
        checks.filter(Boolean).length,
    ) as Strength['score'];

    if (value.length < 8) {
        return { score: 1, message: 'Débil. Usa al menos 8 caracteres.' };
    }

    if (score === 4) {
        return { score, message: 'Fuerte. La barra no se va a levantar sola.' };
    }

    if (score === 3) {
        return {
            score,
            message: hasSymbol
                ? 'Buena. Mezcla mayúsculas, minúsculas y números para que sea fuerte.'
                : 'Buena. Añade un símbolo para que sea fuerte.',
        };
    }

    return {
        score,
        message: 'Regular. Mezcla mayúsculas, números y algún símbolo.',
    };
}

/**
 * Four-bar strength meter shown under a new password field. The message
 * carries the meaning; the bars are decorative.
 */
export function PasswordStrength({
    value,
    id,
}: {
    value: string;
    id?: string;
}) {
    const { score, message } = passwordStrength(value);

    if (!message) {
        return null;
    }

    return (
        <div className="grid gap-1.5">
            <div aria-hidden className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((bar) => (
                    <span
                        key={bar}
                        className={cn(
                            'h-1.5 rounded-full',
                            bar <= score
                                ? score === 1
                                    ? 'bg-trend-down'
                                    : 'bg-primary'
                                : 'bg-muted',
                        )}
                    />
                ))}
            </div>
            <p id={id} aria-live="polite" className="text-[13px]">
                {message}
            </p>
        </div>
    );
}
