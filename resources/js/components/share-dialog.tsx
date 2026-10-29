import { router, usePage } from '@inertiajs/react';
import { toPng } from 'html-to-image';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { MASCOT_SRC } from '@/components/gymrat/suggestion-callout';
import { ResponsivePanel } from '@/components/responsive-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

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

const NETWORK_STYLES: Record<string, string> = {
    WhatsApp: 'bg-[#25d366] text-[#18181b] hover:bg-[#25d366]/90',
    X: 'border border-white/20 bg-black text-white hover:bg-black/80',
    Facebook: 'bg-[#1877f2] text-white hover:bg-[#1877f2]/90',
    Telegram: 'bg-[#229ed9] text-[#18181b] hover:bg-[#229ed9]/90',
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
    const [open, setOpen] = useState(false);
    const [copiedText, copy] = useClipboard();
    const [enabling, setEnabling] = useState(false);
    const [exporting, setExporting] = useState(false);
    const storyRef = useRef<HTMLDivElement>(null);
    const canNativeShare =
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function';

    const enable = () => {
        setEnabling(true);
        router.visit(enableShare.url, {
            method: enableShare.method,
            preserveScroll: true,
            onFinish: () => setEnabling(false),
        });
    };

    const copyLink = async () => {
        if (shareUrl && (await copy(shareUrl))) {
            toast.success('Enlace copiado');
        }
    };

    const nativeShare = async () => {
        if (shareUrl) {
            await navigator
                .share({ title, text, url: shareUrl })
                .catch(() => {});
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
        <ResponsivePanel
            open={open}
            onOpenChange={setOpen}
            trigger={
                trigger ?? (
                    <Button variant="outline">
                        <Share2 /> Compartir
                    </Button>
                )
            }
            title="Compártelo"
            description={
                shareUrl
                    ? 'Un enlace para tus chats o una imagen para tus historias.'
                    : 'Crea un enlace público para que cualquiera pueda verlo, sin cuenta.'
            }
            className="sm:max-w-md"
        >
            {shareUrl ? (
                <div className="grid gap-3">
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={shareUrl}
                            aria-label="Enlace público"
                            className="h-11 rounded-[12px] bg-muted text-sm"
                        />
                        <Button
                            variant="outline"
                            className="h-11 shrink-0 rounded-[12px] px-3.5 font-bold"
                            onClick={() => void copyLink()}
                        >
                            {copiedText === shareUrl ? <Check /> : <Copy />}
                            {copiedText === shareUrl
                                ? 'Copiado'
                                : 'Copiar enlace'}
                        </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {networks.map((network) => (
                            <a
                                key={network.name}
                                href={network.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex h-12 items-center justify-center rounded-[12px] px-1 text-[13px] font-bold transition-colors',
                                    NETWORK_STYLES[network.name],
                                )}
                            >
                                {network.name}
                            </a>
                        ))}
                    </div>
                    {canNativeShare && (
                        <Button
                            variant="outline"
                            className="h-12 rounded-[12px] font-bold"
                            onClick={() => void nativeShare()}
                        >
                            <Share2 /> Más opciones…
                        </Button>
                    )}
                    {storyCard && (
                        <Button
                            size="workout"
                            disabled={exporting}
                            onClick={() => void downloadStory()}
                        >
                            <Download />
                            {exporting ? 'Generando…' : 'Imagen para historias'}
                        </Button>
                    )}
                </div>
            ) : (
                <Button size="workout" onClick={enable} disabled={enabling}>
                    <Share2 />
                    {enabling ? 'Creando enlace…' : 'Crear enlace público'}
                </Button>
            )}

            {storyCard && (
                <div
                    aria-hidden
                    className="pointer-events-none fixed top-0 -left-[10000px]"
                >
                    <div ref={storyRef} style={{ width: 1080, height: 1920 }}>
                        {storyCard}
                    </div>
                </div>
            )}
        </ResponsivePanel>
    );
}

const INK = '#18181b';
const YELLOW = '#facc15';
const WHITE = '#fafafa';
const MUTED = '#a1a1aa';
const DISPLAY_FONT = "'Archivo Black', 'Arial Black', Impact, sans-serif";
const BODY_FONT = 'Archivo, ui-sans-serif, system-ui, sans-serif';

type StoryStat = { label: string; value: ReactNode; unit?: string };

function titleSize(title: string): number {
    const length = title.length;

    if (length <= 5) {
        return 210;
    }

    if (length <= 7) {
        return 168;
    }

    if (length <= 10) {
        return 132;
    }

    return length <= 14 ? 104 : 84;
}

/**
 * 1080×1920 story image ("Tiza y Hierro"). Uses inline styles so the PNG
 * export does not depend on CSS variables.
 *
 * Pass `stats`, `highlight` and `tiles` for the full layout (big numbers
 * next to the mascot, yellow record card, three tiles). Older callers that
 * only pass `children` get the list in place of the numbers.
 */
export function StoryCard({
    badge,
    title,
    subtitle,
    children,
    footer,
    date,
    stats,
    highlight,
    tiles,
}: {
    /** Yellow kicker above the title, e.g. "Entrenamiento terminado". */
    badge: string;
    title: string;
    subtitle?: string;
    children?: ReactNode;
    /** Bottom-right text; defaults to the current domain. */
    footer?: string;
    /** Top-right date, e.g. "29 oct 2026". */
    date?: string;
    /** Up to two big numbers shown next to the mascot. */
    stats?: StoryStat[];
    /** Yellow card, e.g. a new personal record. */
    highlight?: { label: string; title: ReactNode; detail?: ReactNode };
    /** Up to three small tiles above the footer. */
    tiles?: StoryStat[];
}) {
    // Same value on the server and the client, so SSR hydration matches.
    const { name: appName } = usePage().props;
    const domain = footer ?? appName;
    const hasStats = Boolean(stats?.length);
    const tile: CSSProperties = {
        flex: 1,
        background: '#26262b',
        borderRadius: 28,
        padding: '28px 32px',
    };

    return (
        <div
            style={{
                position: 'relative',
                width: 1080,
                height: 1920,
                overflow: 'hidden',
                background: INK,
                backgroundImage:
                    'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.8px)',
                backgroundSize: '12px 12px',
                color: WHITE,
                fontFamily: BODY_FONT,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    height: 24,
                    flexShrink: 0,
                    background: `repeating-linear-gradient(-45deg, ${YELLOW} 0 22px, ${INK} 22px 44px)`,
                }}
            />
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '96px 90px 80px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        style={{
                            fontFamily: DISPLAY_FONT,
                            fontSize: 64,
                            fontStyle: 'italic',
                            letterSpacing: -1,
                        }}
                    >
                        Gym<span style={{ color: YELLOW }}>Rat</span>
                    </div>
                    {date && (
                        <div
                            style={{
                                fontSize: 40,
                                fontWeight: 700,
                                color: '#d4d4d8',
                            }}
                        >
                            {date}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        marginTop: 64,
                        fontSize: 44,
                        fontWeight: 700,
                        color: YELLOW,
                    }}
                >
                    {badge}
                </div>
                <div
                    style={{
                        fontFamily: DISPLAY_FONT,
                        fontSize: titleSize(title),
                        lineHeight: 0.92,
                        letterSpacing: -4,
                        textTransform: 'uppercase',
                        marginTop: 8,
                        overflowWrap: 'anywhere',
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontSize: 40,
                            color: MUTED,
                            marginTop: 24,
                            maxWidth: hasStats ? undefined : 560,
                        }}
                    >
                        {subtitle}
                    </div>
                )}

                <div
                    style={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: hasStats ? 56 : 28,
                        marginTop: hasStats ? 72 : 48,
                        fontSize: 44,
                    }}
                >
                    <img
                        src={MASCOT_SRC}
                        alt=""
                        style={{
                            position: 'absolute',
                            right: -20,
                            top: hasStats ? -40 : -110,
                            width: hasStats ? 620 : 300,
                            height: 'auto',
                        }}
                    />
                    {stats?.slice(0, 2).map((stat) => (
                        <div key={stat.label} style={{ position: 'relative' }}>
                            <div style={{ fontSize: 40, color: MUTED }}>
                                {stat.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: DISPLAY_FONT,
                                    fontSize: 136,
                                    lineHeight: 1,
                                    letterSpacing: -3,
                                }}
                            >
                                {stat.value}
                                {stat.unit && (
                                    <span
                                        style={{
                                            fontFamily: BODY_FONT,
                                            fontSize: 48,
                                            color: MUTED,
                                            letterSpacing: 0,
                                        }}
                                    >
                                        {stat.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {children && (
                        <div
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 28,
                                marginTop: hasStats ? 0 : 190,
                            }}
                        >
                            {children}
                        </div>
                    )}
                </div>

                {highlight && (
                    <div
                        style={{
                            position: 'relative',
                            background: YELLOW,
                            color: INK,
                            borderRadius: 36,
                            padding: '52px 52px 48px',
                            marginTop: 40,
                        }}
                    >
                        <div style={{ fontSize: 40, fontWeight: 700 }}>
                            {highlight.label}
                        </div>
                        <div
                            style={{
                                fontFamily: DISPLAY_FONT,
                                fontSize: 84,
                                lineHeight: 1.05,
                                marginTop: 8,
                            }}
                        >
                            {highlight.title}
                        </div>
                        {highlight.detail && (
                            <div
                                style={{
                                    fontSize: 36,
                                    fontWeight: 700,
                                    marginTop: 12,
                                }}
                            >
                                {highlight.detail}
                            </div>
                        )}
                    </div>
                )}

                {tiles && tiles.length > 0 && (
                    <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
                        {tiles.slice(0, 3).map((item) => (
                            <div key={item.label} style={tile}>
                                <div style={{ fontSize: 36, color: MUTED }}>
                                    {item.label}
                                </div>
                                <div
                                    style={{
                                        fontFamily: DISPLAY_FONT,
                                        fontSize: 76,
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {item.value}
                                    {item.unit && (
                                        <span style={{ fontSize: 52 }}>
                                            {' '}
                                            {item.unit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: 32,
                        marginTop: 48,
                    }}
                >
                    <div style={{ fontSize: 40, lineHeight: 1.3 }}>
                        Entrena con un plan.
                        <br />
                        Mide cada progreso.
                    </div>
                    <div
                        style={{
                            fontSize: 40,
                            fontWeight: 800,
                            color: YELLOW,
                            textAlign: 'right',
                        }}
                    >
                        {domain}
                    </div>
                </div>
            </div>
        </div>
    );
}
