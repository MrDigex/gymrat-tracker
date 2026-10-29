import { router } from '@inertiajs/react';
import { toPng } from 'html-to-image';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useClipboard } from '@/hooks/use-clipboard';

type ShareDialogProps = {
    /** Public URL, or null when the item has not been shared yet. */
    shareUrl: string | null;
    /** Wayfinder route that enables sharing (POST) and makes `shareUrl` available. */
    enableShare: { url: string; method: 'post' };
    title: string;
    text: string;
    /** 1080×1920 card rendered off-screen and exported as PNG for stories. */
    storyCard?: ReactNode;
    trigger?: ReactNode;
    fileName?: string;
};

export function ShareDialog({
    shareUrl,
    enableShare,
    title,
    text,
    storyCard,
    trigger,
    fileName = 'gymrat',
}: ShareDialogProps) {
    const [copiedText, copy] = useClipboard();
    const [enabling, setEnabling] = useState(false);
    const [exporting, setExporting] = useState(false);
    const storyRef = useRef<HTMLDivElement>(null);

    const enable = () => {
        setEnabling(true);
        router.visit(enableShare.url, {
            method: enableShare.method,
            preserveScroll: true,
            onFinish: () => setEnabling(false),
        });
    };

    const nativeShare = async () => {
        if (!shareUrl) {
            return;
        }

        if (navigator.share) {
            await navigator
                .share({ title, text, url: shareUrl })
                .catch(() => {});
        } else {
            await copy(shareUrl);
            toast.success('Enlace copiado');
        }
    };

    const renderStory = async (): Promise<string | null> => {
        if (!storyRef.current) {
            return null;
        }

        return toPng(storyRef.current, {
            width: 1080,
            height: 1920,
            pixelRatio: 1,
            cacheBust: true,
        });
    };

    const downloadStory = async () => {
        setExporting(true);

        try {
            const dataUrl = await renderStory();

            if (!dataUrl) {
                return;
            }

            const file = new File(
                [await (await fetch(dataUrl)).blob()],
                `${fileName}.png`,
                { type: 'image/png' },
            );

            if (navigator.canShare?.({ files: [file] })) {
                await navigator
                    .share({ files: [file], title, text })
                    .catch(() => {});
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = file.name;
                link.click();
            }
        } catch {
            toast.error('No se pudo generar la imagen');
        } finally {
            setExporting(false);
        }
    };

    const encodedUrl = encodeURIComponent(shareUrl ?? '');
    const encodedText = encodeURIComponent(text);
    const networks = [
        {
            name: 'WhatsApp',
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        },
        {
            name: 'X',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        },
        {
            name: 'Facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: 'Telegram',
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="outline">
                        <Share2 /> Compartir
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartir</DialogTitle>
                    <DialogDescription>
                        Comparte un enlace público o descarga una imagen para
                        tus historias.
                    </DialogDescription>
                </DialogHeader>

                {shareUrl ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input readOnly value={shareUrl} />
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Copiar enlace"
                                onClick={() => copy(shareUrl)}
                            >
                                {copiedText === shareUrl ? <Check /> : <Copy />}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {networks.map((network) => (
                                <Button
                                    key={network.name}
                                    variant="secondary"
                                    asChild
                                >
                                    <a
                                        href={network.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {network.name}
                                    </a>
                                </Button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button className="flex-1" onClick={nativeShare}>
                                <Share2 /> Compartir…
                            </Button>
                            {storyCard && (
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    disabled={exporting}
                                    onClick={downloadStory}
                                >
                                    <Download />
                                    {exporting
                                        ? 'Generando…'
                                        : 'Imagen para historias'}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Button onClick={enable} disabled={enabling}>
                        <Share2 />{' '}
                        {enabling
                            ? 'Generando enlace…'
                            : 'Crear enlace público'}
                    </Button>
                )}

                {storyCard && (
                    <div
                        aria-hidden
                        className="pointer-events-none fixed top-0 -left-[10000px]"
                    >
                        <div
                            ref={storyRef}
                            style={{ width: 1080, height: 1920 }}
                        >
                            {storyCard}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Base layout for 1080×1920 story images. Uses inline styles so the PNG export does not depend on CSS variables.
 */
export function StoryCard({
    badge,
    title,
    subtitle,
    children,
    footer,
}: {
    badge: string;
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: string;
}) {
    return (
        <div
            style={{
                width: 1080,
                height: 1920,
                padding: 96,
                background:
                    'linear-gradient(160deg, #18181b 0%, #27272a 60%, #3f3f46 100%)',
                color: '#fafafa',
                fontFamily:
                    'Instrument Sans, ui-sans-serif, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                gap: 48,
            }}
        >
            <div
                style={{
                    height: 16,
                    width: 220,
                    background: '#facc15',
                    borderRadius: 8,
                }}
            />
            <div
                style={{
                    alignSelf: 'flex-start',
                    background: '#facc15',
                    color: '#18181b',
                    fontWeight: 800,
                    fontSize: 36,
                    letterSpacing: 4,
                    padding: '12px 28px',
                    borderRadius: 12,
                    textTransform: 'uppercase',
                }}
            >
                {badge}
            </div>
            <div>
                <div
                    style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.05 }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontSize: 40,
                            color: '#a1a1aa',
                            marginTop: 24,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28,
                    fontSize: 44,
                }}
            >
                {children}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#facc15' }}>
                {footer ?? 'GymRat Tracker'}
            </div>
        </div>
    );
}
