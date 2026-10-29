import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * GymRat mascot icon (rounded dark tile).
 */
export default function AppLogoIcon({
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo/gymrat-icon-128.png"
            alt=""
            draggable={false}
            {...props}
            className={cn('aspect-square shrink-0 object-contain', className)}
        />
    );
}
