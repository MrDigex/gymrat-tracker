import { Link } from '@inertiajs/react';
import { Check, ChevronRight } from 'lucide-react';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index as integrationsIndex } from '@/routes/integrations';
import { index as routinesIndex } from '@/routes/routines';
import type { Onboarding } from '@/types';

/**
 * Mascot card for new users: first a plan (routine), then the first workout.
 */
export function OnboardingHero({
    onboarding,
    trainHref,
}: {
    onboarding: Onboarding;
    trainHref: string;
}) {
    const needsRoutine = !onboarding.has_routine;

    return (
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#18181b] text-white">
            <div className="flex justify-center px-6 pt-4">
                <img
                    src={MASCOT_SRC}
                    alt=""
                    className="h-52 w-auto object-contain md:h-60"
                />
            </div>
            <div className="h-2.5 bg-hazard" aria-hidden />
            <div className="space-y-4 p-5 md:p-6">
                <div className="space-y-2">
                    <h2 className="font-num text-[28px] leading-tight">
                        {needsRoutine ? 'Primero, un plan' : 'Hora de entrenar'}
                    </h2>
                    <p className="text-[15px] leading-relaxed text-white/80">
                        {needsRoutine
                            ? 'Crea tu primera rutina con los ejercicios que ya haces. Después de cada sesión te diremos cuándo subir peso o repeticiones.'
                            : 'Tu rutina está lista. Registra tu primer entrenamiento y te diremos cuándo subir peso o repeticiones.'}
                    </p>
                </div>
                <Button
                    asChild
                    className="h-14 w-full rounded-lg text-base font-bold"
                >
                    <Link href={needsRoutine ? routinesIndex() : trainHref}>
                        {needsRoutine
                            ? 'Crear mi primera rutina'
                            : 'Empezar mi primer entrenamiento'}
                    </Link>
                </Button>
                {needsRoutine && (
                    <div className="text-center">
                        <Link
                            href={trainHref}
                            className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4 hover:text-primary"
                        >
                            O empieza un entrenamiento libre
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}

/**
 * "Tu primera semana" checklist.
 */
export function FirstWeekChecklist({
    onboarding,
    trainHref,
    className,
}: {
    onboarding: Onboarding;
    trainHref: string;
    className?: string;
}) {
    const steps = [
        { label: 'Crear la cuenta', done: true, href: null },
        {
            label: 'Crear una rutina',
            done: onboarding.has_routine,
            href: routinesIndex.url(),
        },
        {
            label: 'Registrar tu primer entrenamiento',
            done: onboarding.has_workout,
            href: trainHref,
        },
        {
            label: 'Conectar Strava o el Apple Watch',
            done: onboarding.has_integration,
            href: integrationsIndex.url(),
        },
    ];
    const next = steps.findIndex((step) => !step.done);
    const doneCount = steps.filter((step) => step.done).length;

    return (
        <section
            className={cn(
                'rounded-xl border bg-card p-5 text-card-foreground',
                className,
            )}
        >
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">Tu primera semana</h2>
                <span className="text-[13px] text-muted-foreground">
                    {doneCount} de {steps.length}
                </span>
            </div>
            <ol className="space-y-1">
                {steps.map((step, index) => {
                    const current = index === next;
                    const content = (
                        <>
                            <span
                                className={cn(
                                    'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                                    step.done
                                        ? 'bg-primary text-primary-foreground'
                                        : current
                                          ? 'border-2 border-foreground'
                                          : 'border-2 border-border text-muted-foreground',
                                )}
                            >
                                {step.done ? (
                                    <Check
                                        className="size-4"
                                        strokeWidth={3}
                                        aria-hidden
                                    />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'flex-1 text-[15px]',
                                    step.done &&
                                        'text-muted-foreground line-through',
                                    current && 'font-bold',
                                )}
                            >
                                {step.label}
                                {step.done && (
                                    <span className="sr-only"> (hecho)</span>
                                )}
                            </span>
                            {!step.done && (
                                <ChevronRight
                                    className="size-4 text-muted-foreground"
                                    aria-hidden
                                />
                            )}
                        </>
                    );

                    return (
                        <li key={step.label}>
                            {step.done || !step.href ? (
                                <div className="flex min-h-11 items-center gap-3">
                                    {content}
                                </div>
                            ) : (
                                <Link
                                    href={step.href}
                                    className="-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-muted"
                                >
                                    {content}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
