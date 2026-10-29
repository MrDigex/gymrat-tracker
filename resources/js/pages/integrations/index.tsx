import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Plus,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { timeAgo } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import activitiesRoutes from '@/routes/activities';
import { index as integrationsIndex } from '@/routes/integrations';
import { backfill, connect, disconnect } from '@/routes/integrations/strava';
import {
    destroy as destroyToken,
    store as storeToken,
} from '@/routes/integrations/tokens';
import { handle as stravaWebhook } from '@/routes/webhooks/strava';

type IntegrationsProps = {
    strava: {
        configured: boolean;
        connected: boolean;
        athlete_id: number | null;
        athlete_name: string | null;
        last_import_at: string | null;
        connected_at: string | null;
        imported_count: number;
    };
    tokens: {
        id: number;
        name: string;
        last_used_at: string | null;
        created_at: string | null;
    }[];
    apiEndpoint: string;
    shortcutImported: number;
};

const EXAMPLE_BODY = {
    started_at: '2026-10-29T07:30:00+01:00',
    distance_km: 10,
    duration: '0:54:30',
    type: 'carrera',
    name: 'Rodaje matinal',
    avg_hr: 148,
    max_hr: 171,
    calories: 640,
    elevation_gain_m: 45,
};

const FIELDS: { name: string; description: string; required?: boolean }[] = [
    {
        name: 'started_at',
        description: 'Fecha y hora de inicio en formato ISO 8601.',
        required: true,
    },
    {
        name: 'distance_km / distance_m',
        description: 'Distancia en kilómetros o en metros (uno de los dos).',
        required: true,
    },
    {
        name: 'duration',
        description:
            'Duración como "h:mm:ss" o "mm:ss". También vale duration_seconds o duration_minutes.',
        required: true,
    },
    {
        name: 'type',
        description:
            'carrera, trail, cinta, hyrox u otro. Por defecto: carrera.',
    },
    { name: 'name', description: 'Nombre de la actividad (máx. 120).' },
    { name: 'avg_hr / max_hr', description: 'Pulso medio y máximo (ppm).' },
    { name: 'calories', description: 'Calorías activas (kcal).' },
    { name: 'elevation_gain_m', description: 'Desnivel positivo en metros.' },
    {
        name: 'external_id',
        description:
            'Identificador propio para evitar duplicados. Por defecto se usa la hora de inicio.',
    },
];

function relativeDay(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const days = Math.round(
        (new Date(today.toDateString()).getTime() -
            new Date(date.toDateString()).getTime()) /
            86_400_000,
    );

    if (days === 0) {
        return 'hoy';
    }

    if (days === 1) {
        return 'ayer';
    }

    return formatDate(value, { day: 'numeric', month: 'short' }).replace(
        '.',
        '',
    );
}

export default function IntegrationsIndex({
    strava,
    tokens,
    apiEndpoint,
    shortcutImported,
}: IntegrationsProps) {
    const { flash } = usePage();
    const plainTextToken =
        typeof flash.plainTextToken === 'string' ? flash.plainTextToken : null;

    return (
        <>
            <Head title="Integraciones" />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 lg:p-6">
                <header className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 size-11 lg:hidden"
                        asChild
                    >
                        <Link
                            href={activitiesRoutes.index()}
                            aria-label="Volver a carreras"
                        >
                            <ChevronLeft className="size-6" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-num text-[32px] leading-none uppercase lg:text-5xl">
                            Integraciones
                        </h1>
                        <p className="mt-1 hidden text-muted-foreground lg:block">
                            Trae tus carreras del Apple Watch sin escribir nada.
                        </p>
                    </div>
                </header>

                <StravaSection strava={strava} />

                <ShortcutSection
                    tokens={tokens}
                    apiEndpoint={apiEndpoint}
                    shortcutImported={shortcutImported}
                    plainTextToken={plainTextToken}
                />
            </div>
        </>
    );
}

function SectionCard({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: ReactNode;
    title: string;
    subtitle: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4 rounded-xl bg-card p-4 lg:p-5">
            <div className="flex items-center gap-3">
                {icon}
                <div className="min-w-0">
                    <h2 className="text-lg leading-tight font-bold">{title}</h2>
                    <div className="text-sm text-muted-foreground">
                        {subtitle}
                    </div>
                </div>
            </div>
            {children}
        </section>
    );
}

function StravaSection({ strava }: { strava: IntegrationsProps['strava'] }) {
    const webhookUrl =
        typeof window === 'undefined'
            ? stravaWebhook.url()
            : `${window.location.origin}${stravaWebhook.url()}`;

    return (
        <SectionCard
            icon={
                <span
                    className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#fc4c02] font-num text-xl text-white"
                    aria-hidden
                >
                    S
                </span>
            }
            title="Strava"
            subtitle={
                strava.connected ? (
                    <span className="flex items-center gap-1.5 text-success">
                        <span
                            className="size-2 rounded-full bg-success"
                            aria-hidden
                        />
                        {strava.athlete_name
                            ? `Conectado como ${strava.athlete_name}`
                            : `Conectado desde el ${formatDate(strava.connected_at)}`}
                    </span>
                ) : (
                    'Recomendado: la forma más sencilla, sin hacer nada a mano'
                )
            }
        >
            <FlowChain steps={['Apple Watch', 'Salud', 'Strava', 'GymRat']} />

            {!strava.configured ? (
                <div className="flex gap-3 rounded-lg border border-dashed p-4 text-sm">
                    <AlertTriangle
                        className="mt-0.5 size-5 shrink-0 text-primary-text"
                        aria-hidden
                    />
                    <div className="flex flex-col gap-2">
                        <p className="font-bold">
                            Strava no está configurado en este servidor
                        </p>
                        <p className="text-muted-foreground">
                            El administrador debe completar estos pasos:
                        </p>
                        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                            <li>
                                Crear una aplicación en{' '}
                                <a
                                    href="https://www.strava.com/settings/api"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-foreground underline underline-offset-4"
                                >
                                    strava.com/settings/api
                                </a>{' '}
                                con el dominio de esta web como «Authorization
                                Callback Domain».
                            </li>
                            <li>
                                Añadir al <code>.env</code> las variables{' '}
                                <code>STRAVA_CLIENT_ID</code>,{' '}
                                <code>STRAVA_CLIENT_SECRET</code> y{' '}
                                <code>STRAVA_WEBHOOK_VERIFY_TOKEN</code> (un
                                texto secreto cualquiera).
                            </li>
                            <li>
                                Registrar el webhook de Strava apuntando a{' '}
                                <code className="break-all">{webhookUrl}</code>{' '}
                                con ese mismo verify token, para recibir las
                                actividades nuevas automáticamente.
                            </li>
                        </ol>
                    </div>
                </div>
            ) : strava.connected ? (
                <>
                    <p className="text-sm">
                        Tus carreras del reloj llegan solas: en cuanto Strava
                        recibe una actividad nueva, avisa a GymRat y aparece al
                        momento.{' '}
                        <span className="text-muted-foreground">
                            {strava.imported_count === 1
                                ? 'Llevas 1 carrera importada'
                                : `Llevas ${strava.imported_count} carreras importadas`}
                            {strava.last_import_at
                                ? `; la última, ${timeAgo(strava.last_import_at)}.`
                                : '.'}
                        </span>
                    </p>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Form
                            {...backfill.form()}
                            options={{ preserveScroll: true }}
                        >
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-12 w-full rounded-xl bg-foreground font-bold text-background hover:bg-foreground/90"
                                >
                                    Importar últimos 30 días
                                </Button>
                            )}
                        </Form>
                        <Form
                            {...disconnect.form()}
                            options={{ preserveScroll: true }}
                            onBefore={() =>
                                confirm(
                                    '¿Seguro que quieres desconectar Strava? Las carreras ya importadas se mantendrán.',
                                )
                            }
                        >
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing}
                                    className="h-12 rounded-xl font-bold text-destructive hover:text-destructive"
                                >
                                    Desconectar
                                </Button>
                            )}
                        </Form>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        Instala Strava en tu iPhone y, en{' '}
                        <em>
                            Ajustes → Aplicaciones, servicios y dispositivos →
                            Salud
                        </em>
                        , activa la subida automática de entrenamientos. Cada
                        carrera que grabes con el Apple Watch pasará a Strava y,
                        en cuanto la conectes aquí, llegará sola a GymRat.
                    </p>
                    <Button
                        asChild
                        className="h-12 rounded-xl bg-[#fc4c02] font-bold text-white hover:bg-[#e04402]"
                    >
                        {/* Full page visit: the server redirects to Strava's OAuth screen. */}
                        <a href={connect.url()}>Conectar con Strava</a>
                    </Button>
                </>
            )}
        </SectionCard>
    );
}

function FlowChain({ steps }: { steps: string[] }) {
    return (
        <ol
            className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[13px] font-bold"
            aria-label="Cómo llegan tus carreras"
        >
            {steps.map((step, index) => {
                const last = index === steps.length - 1;

                return (
                    <li key={step} className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                'rounded-full px-3 py-1',
                                last
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary',
                            )}
                        >
                            {step}
                        </span>
                        {!last && (
                            <ChevronRight
                                className="size-4 text-muted-foreground"
                                aria-hidden
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

function ShortcutSection({
    tokens,
    apiEndpoint,
    shortcutImported,
    plainTextToken,
}: {
    tokens: IntegrationsProps['tokens'];
    apiEndpoint: string;
    shortcutImported: number;
    plainTextToken: string | null;
}) {
    const [creating, setCreating] = useState(false);
    const token = plainTextToken ?? '$TOKEN';
    const curl = [
        `curl -X POST ${apiEndpoint} \\`,
        `  -H "Authorization: Bearer ${token}" \\`,
        `  -H "Accept: application/json" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${JSON.stringify({ started_at: EXAMPLE_BODY.started_at, distance_km: EXAMPLE_BODY.distance_km, duration: EXAMPLE_BODY.duration })}'`,
    ].join('\n');
    const exampleJson = JSON.stringify(EXAMPLE_BODY, null, 2);

    return (
        <SectionCard
            icon={
                <span
                    className="grid size-12 shrink-0 place-items-center rounded-lg bg-foreground text-background"
                    aria-hidden
                >
                    <Zap className="size-6" />
                </span>
            }
            title="Atajo de iOS"
            subtitle={
                shortcutImported > 0
                    ? `Envía entrenos desde Salud sin Strava. Llevas ${shortcutImported} ${shortcutImported === 1 ? 'carrera importada' : 'carreras importadas'}.`
                    : 'Envía entrenos desde Salud sin Strava'
            }
        >
            {plainTextToken && <NewTokenAlert token={plainTextToken} />}

            {tokens.length > 0 && (
                <ul className="flex flex-col divide-y">
                    {tokens.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center gap-3 py-3 first:pt-0"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">
                                    {item.name}
                                </p>
                                <p className="text-[13px] text-muted-foreground">
                                    {item.last_used_at
                                        ? `Último uso: ${relativeDay(item.last_used_at)}`
                                        : `Creado ${item.created_at ? relativeDay(item.created_at) : ''}, nunca usado`}
                                </p>
                            </div>
                            <Form
                                {...destroyToken.form(item.id)}
                                options={{ preserveScroll: true }}
                                onBefore={() =>
                                    confirm(
                                        `¿Revocar el token «${item.name}»? El atajo que lo use dejará de funcionar.`,
                                    )
                                }
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                        className="h-11 rounded-lg font-bold text-destructive hover:text-destructive"
                                    >
                                        Revocar
                                    </Button>
                                )}
                            </Form>
                        </li>
                    ))}
                </ul>
            )}

            {creating ? (
                <Form
                    {...storeToken.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => setCreating(false)}
                    className="flex flex-col gap-2 rounded-xl border border-dashed p-3"
                >
                    {({ processing, errors }) => (
                        <>
                            <Label htmlFor="token-name">
                                Nombre del token (el dispositivo que lo usará)
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="token-name"
                                    name="name"
                                    placeholder="iPhone de Ana"
                                    maxLength={60}
                                    className="h-11 flex-1"
                                    autoFocus
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 rounded-lg font-bold"
                                >
                                    Crear
                                </Button>
                            </div>
                            <InputError message={errors.name} />
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 self-start"
                                onClick={() => setCreating(false)}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}
                </Form>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl border-dashed bg-transparent font-bold"
                    onClick={() => setCreating(true)}
                >
                    <Plus /> Crear token
                </Button>
            )}

            <div className="flex flex-col gap-3">
                <h3 className="font-bold">Crea el atajo en tu iPhone</h3>
                <ol className="flex flex-col gap-3 text-sm">
                    <Step number={1}>
                        Crea un token arriba y cópialo: solo se muestra una vez.
                    </Step>
                    <Step number={2}>
                        En la app <strong>Atajos</strong>, crea un atajo nuevo
                        con <strong>Buscar muestras de salud</strong>:
                        entrenamientos de tipo <em>Carrera</em>, ordenados por
                        fecha de inicio (el más reciente) y límite 1. Saca su
                        fecha de inicio, duración y distancia.
                    </Step>
                    <Step number={3}>
                        Añade <strong>Obtener contenido de URL</strong>: método
                        POST a{' '}
                        <code className="rounded bg-muted px-1 break-all">
                            {apiEndpoint}
                        </code>
                        , cabecera <code>Authorization</code> ={' '}
                        <code>Bearer</code> + tu token, y cuerpo JSON con{' '}
                        <code>started_at</code>, <code>distance_km</code> y{' '}
                        <code>duration</code> (h:mm:ss).
                    </Step>
                    <Step number={4}>
                        Opcional: en <strong>Automatización</strong>, crea una
                        que ejecute el atajo «Al terminar un entreno».
                    </Step>
                </ol>
                <p className="text-[13px] text-muted-foreground">
                    Los nombres de las acciones cambian según la versión de iOS
                    y el idioma del iPhone, así que puede que tengas que adaptar
                    algún paso. Puedes ejecutarlo tantas veces como quieras: las
                    carreras con la misma hora de inicio no se duplican.
                </p>
            </div>

            <Tabs defaultValue="curl" className="gap-3">
                <TabsList className="h-11 bg-transparent p-0">
                    <TabsTrigger value="curl" className="h-11 px-4 font-bold">
                        curl
                    </TabsTrigger>
                    <TabsTrigger value="json" className="h-11 px-4 font-bold">
                        JSON
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                    <CodeBlock code={curl} label="Ejemplo con curl" />
                </TabsContent>
                <TabsContent value="json">
                    <CodeBlock code={exampleJson} label="Cuerpo JSON" />
                </TabsContent>
            </Tabs>

            <details className="group rounded-lg border">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 text-sm font-bold">
                    Todos los campos aceptados
                    <ChevronRight
                        className="size-4 transition-transform group-open:rotate-90"
                        aria-hidden
                    />
                </summary>
                <dl className="divide-y border-t text-sm">
                    {FIELDS.map((field) => (
                        <div
                            key={field.name}
                            className="grid gap-1 px-4 py-2 sm:grid-cols-[14rem_1fr]"
                        >
                            <dt className="font-mono text-xs leading-5">
                                {field.name}
                                {field.required && (
                                    <span className="ml-1 text-destructive">
                                        *
                                        <span className="sr-only">
                                            (obligatorio)
                                        </span>
                                    </span>
                                )}
                            </dt>
                            <dd className="text-muted-foreground">
                                {field.description}
                            </dd>
                        </div>
                    ))}
                </dl>
            </details>
        </SectionCard>
    );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
    return (
        <li className="flex gap-3">
            <span
                className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary font-num text-xs"
                aria-hidden
            >
                {number}
            </span>
            <span className="pt-0.5">{children}</span>
        </li>
    );
}

function NewTokenAlert({ token }: { token: string }) {
    const [copied, copy] = useClipboard();

    return (
        <div
            className="overflow-hidden rounded-xl bg-primary text-primary-foreground"
            role="status"
        >
            <div className="h-[5px] bg-hazard" aria-hidden />
            <div className="flex flex-col gap-2 p-3">
                <p className="font-bold">
                    Copia tu token ahora. No volverás a verlo.
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-background p-1.5 pl-3 text-foreground">
                    <Input
                        readOnly
                        value={token}
                        aria-label="Token nuevo"
                        className="h-9 flex-1 border-0 bg-transparent px-0 font-mono text-sm shadow-none dark:bg-transparent"
                        onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button
                        type="button"
                        className="h-11 rounded-lg font-bold"
                        onClick={() => copy(token)}
                    >
                        {copied === token ? <Check /> : <Copy />}
                        {copied === token ? 'Copiado' : 'Copiar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
    const [copied, copy] = useClipboard();

    return (
        <div className="overflow-hidden rounded-xl bg-background">
            <div className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-4">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => copy(code)}
                >
                    {copied === code ? <Check /> : <Copy />}
                    {copied === code ? 'Copiado' : 'Copiar'}
                </Button>
            </div>
            <pre className="p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                <code>{code}</code>
            </pre>
        </div>
    );
}

IntegrationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Integraciones',
            href: integrationsIndex(),
        },
    ],
};
