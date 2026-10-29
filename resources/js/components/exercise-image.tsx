import { Dumbbell } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/types';

/**
 * Exercise picture that shows the second frame (end position) on hover when available.
 */
export function ExerciseImage({
    exercise,
    className,
    animate = true,
}: {
    exercise: Pick<Exercise, 'name' | 'image_url' | 'image_alt_url'>;
    className?: string;
    animate?: boolean;
}) {
    const [hovered, setHovered] = useState(false);
    const [failed, setFailed] = useState(false);
    const source =
        animate && hovered && exercise.image_alt_url
            ? exercise.image_alt_url
            : exercise.image_url;

    if (!source || failed) {
        return (
            <div
                className={cn(
                    'flex aspect-[3/2] items-center justify-center bg-muted text-muted-foreground',
                    className,
                )}
            >
                <Dumbbell className="size-8" />
            </div>
        );
    }

    return (
        <img
            src={source}
            alt={exercise.name}
            loading="lazy"
            onError={() => setFailed(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                'aspect-[3/2] w-full bg-white object-cover',
                className,
            )}
        />
    );
}
