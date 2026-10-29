import { Form, Head, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Check,
    Copy,
    Download,
    KeyRound,
    Link2Off,
    Smartphone,
    Trash2,
    Watch,
} from 'lucide-react';
import type { ReactNode } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDate, formatDateTime } from '@/lib/format';
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
    distance_km: 10.02,
    duration_minutes: 52.5,
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
        name: 'duration_minutes / duration_seconds',
        description: 'Duración en minutos o en segundos (uno de los dos).',
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
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Integraciones"
                    description="Importa automáticamente tus carreras del Apple Watch u otros relojes"
                />

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

function StravaSection({ strava }: { strava: IntegrationsProps['strava'] }) {
    const webhookUrl =
        typeof window === 'undefined'
            ? stravaWebhook.url()
            : `${window.location.origin}${stravaWebhook.url()}`;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="size-5 text-[#fc4c02]" />
                        Strava
                    </CardTitle>
                    <Badge variant="secondary">Recomendado</Badge>
                    {strava.connected && (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            <Check />
                            Conectado
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    La forma más sencilla de traer tus carreras del Apple Watch
                    sin hacer nada a mano.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <FlowSteps
                    steps={[
                        {
                            icon: <Watch className="size-4" />,
                            label: 'Apple Watch',
                        },
                        {
                            icon: <Smartphone className="size-4" />,
                            label: 'App Salud',
                        },
                        {
                            icon: <Activity className="size-4" />,
                            label: 'Strava',
                        },
                        { icon: <Check className="size-4" />, label: 'GymRat' },
                    ]}
                />
                <p className="text-sm text-muted-foreground">
                    Instala Strava en tu iPhone y, en{' '}
                    <em>
                        Ajustes → Aplicaciones, servicios y dispositivos → Salud
                    </em>
                    , activa la subida automática de entrenamientos. Cada
                    carrera que grabes con el Apple Watch pasará a Strava y, en
                    cuanto la conectes aquí, llegará sola a GymRat.
                </p>

                {!strava.configured ? (
                    <Alert>
                        <AlertTriangle />
                        <AlertTitle>
                            Strava no está configurado en este servidor
                        </AlertTitle>
                        <AlertDescription>
                            <p>El administrador debe completar estos pasos:</p>
                            <ol className="list-decimal space-y-1 pl-5">
                                <li>
                                    Crear una aplicación en{' '}
                                    <a
                                        href="https://www.strava.com/settings/api"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium underline underline-offset-4"
                                    >
                                        strava.com/settings/api
                                    </a>{' '}
                                    con el dominio de esta web como
                                    «Authorization Callback Domain».
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
                                    <code className="break-all">
                                        {webhookUrl}
                                    </code>{' '}
                                    con ese mismo verify token, para recibir las
                                    actividades nuevas automáticamente.
                                </li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                ) : strava.connected ? (
                    <div className="space-y-4">
                        <dl className="grid gap-4 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-muted-foreground">
                                    ID de atleta
                                </dt>
                                <dd className="font-medium">
                                    {strava.athlete_id ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Conectado desde
                                </dt>
                                <dd className="font-medium">
                                    {formatDate(strava.connected_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Carreras importadas
                                </dt>
                                <dd className="font-medium">
                                    {strava.imported_count}
                                </dd>
                            </div>
                        </dl>
                        <div className="flex flex-wrap gap-2">
                            <Form
                                {...backfill.form()}
                                options={{ preserveScroll: true }}
                            >
                                {({ processing }) => (
                                    <Button type="submit" disabled={processing}>
                                        <Download />
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
                                    >
                                        <Link2Off />
                                        Desconectar
                                    </Button>
                                )}
                            </Form>
                        </div>
                    </div>
                ) : (
                    <Button
                        asChild
                        className="bg-[#fc4c02] text-white hover:bg-[#e04402]"
                    >
                        {/* Full page visit: the server redirects to Strava's OAuth screen. */}
                        <a href={connect.url()}>
                            <Activity />
                            Conectar con Strava
                        </a>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function FlowSteps({ steps }: { steps: { icon: ReactNode; label: string }[] }) {
    return (
        <ol className="flex flex-wrap items-center gap-2 text-sm">
            {steps.map((step, index) => (
                <li key={step.label} className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 font-medium">
                        {step.icon}
                        {step.label}
                    </span>
                    {index < steps.length - 1 && (
                        <span className="text-muted-foreground" aria-hidden>
                            →
                        </span>
                    )}
                </li>
            ))}
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
    const exampleJson = JSON.stringify(EXAMPLE_BODY, null, 2);
    const curl = [
        `curl -X POST '${apiEndpoint}' \\`,
        `  -H 'Authorization: Bearer ${plainTextToken ?? 'TU_TOKEN'}' \\`,
        `  -H 'Accept: application/json' \\`,
        `  -H 'Content-Type: application/json' \\`,
        `  -d '${JSON.stringify({ started_at: EXAMPLE_BODY.started_at, distance_km: EXAMPLE_BODY.distance_km, duration_minutes: EXAMPLE_BODY.duration_minutes })}'`,
    ].join('\n');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="size-5" />
                    Atajo de iOS (Atajos / Shortcuts)
                </CardTitle>
                <CardDescription>
                    Alternativa sin Strava: un atajo de iPhone lee tu última
                    carrera de la app Salud y la envía a GymRat.{' '}
                    {shortcutImported > 0 &&
                        `Llevas ${shortcutImported} ${shortcutImported === 1 ? 'carrera importada' : 'carreras importadas'} con el atajo.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="space-y-4">
                    <h3 className="flex items-center gap-2 font-medium">
                        <KeyRound className="size-4" />
                        1. Crea un token de acceso
                    </h3>

                    {plainTextToken && <NewTokenAlert token={plainTextToken} />}

                    <Form
                        {...storeToken.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="flex flex-wrap items-start gap-2"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid min-w-56 flex-1 gap-1.5">
                                    <Label
                                        htmlFor="token-name"
                                        className="sr-only"
                                    >
                                        Nombre del token
                                    </Label>
                                    <Input
                                        id="token-name"
                                        name="name"
                                        placeholder="Ej.: iPhone de Ana"
                                        maxLength={60}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <Button type="submit" disabled={processing}>
                                    Crear token
                                </Button>
                            </>
                        )}
                    </Form>

                    {tokens.length > 0 ? (
                        <ul className="divide-y rounded-lg border">
                            {tokens.map((token) => (
                                <li
                                    key={token.id}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {token.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Creado el{' '}
                                            {formatDate(token.created_at)} ·{' '}
                                            {token.last_used_at
                                                ? `Último uso: ${formatDateTime(token.last_used_at)}`
                                                : 'Nunca usado'}
                                        </p>
                                    </div>
                                    <Form
                                        {...destroyToken.form(token.id)}
                                        options={{ preserveScroll: true }}
                                        onBefore={() =>
                                            confirm(
                                                `¿Revocar el token «${token.name}»? El atajo que lo use dejará de funcionar.`,
                                            )
                                        }
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="sm"
                                                disabled={processing}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 />
                                                Revocar
                                            </Button>
                                        )}
                                    </Form>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Aún no has creado ningún token.
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <h3 className="font-medium">
                        2. Crea el atajo en tu iPhone
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Los nombres de las acciones cambian según la versión de
                        iOS y el idioma del iPhone, así que puede que tengas que
                        adaptar algún paso.
                    </p>
                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                        <li>
                            Abre la app <strong>Atajos</strong> y crea un atajo
                            nuevo, por ejemplo «Enviar carrera a GymRat».
                        </li>
                        <li>
                            Añade la acción{' '}
                            <strong>Buscar muestras de salud</strong> («Find
                            Health Samples»). Tipo:{' '}
                            <strong>Entrenamientos</strong> (Workouts), filtra
                            por tipo de entrenamiento <em>Carrera</em>, ordena
                            por fecha de inicio (más reciente primero) y limita
                            a <strong>1</strong> resultado. La primera vez iOS
                            te pedirá permiso para leer Salud.
                        </li>
                        <li>
                            Añade{' '}
                            <strong>
                                Obtener detalles de muestras de salud
                            </strong>{' '}
                            (o usa directamente las propiedades de la variable)
                            para sacar la <em>fecha de inicio</em>, la{' '}
                            <em>duración</em> y la <em>distancia</em>.
                        </li>
                        <li>
                            Si la fecha no sale en formato ISO, pásala por{' '}
                            <strong>Formatear fecha</strong> con el formato{' '}
                            <strong>ISO 8601</strong>.
                        </li>
                        <li>
                            Añade <strong>Obtener contenido de URL</strong>{' '}
                            («Get Contents of URL») con:
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                                <li>
                                    URL:{' '}
                                    <code className="break-all">
                                        {apiEndpoint}
                                    </code>
                                </li>
                                <li>
                                    Método: <strong>POST</strong>
                                </li>
                                <li>
                                    Encabezados: <code>Authorization</code> ={' '}
                                    <code>Bearer TU_TOKEN</code> y{' '}
                                    <code>Accept</code> ={' '}
                                    <code>application/json</code>
                                </li>
                                <li>
                                    Cuerpo de la solicitud:{' '}
                                    <strong>JSON</strong>, con los campos de
                                    abajo (al menos <code>started_at</code>,{' '}
                                    <code>distance_km</code> y{' '}
                                    <code>duration_minutes</code>) usando las
                                    variables de los pasos anteriores.
                                </li>
                            </ul>
                        </li>
                        <li>
                            Opcional: en la pestaña{' '}
                            <strong>Automatización</strong> de Atajos crea una
                            automatización que lo ejecute, por ejemplo, al
                            terminar un entrenamiento en el Apple Watch o cada
                            noche.
                        </li>
                    </ol>
                    <p className="text-sm text-muted-foreground">
                        Puedes ejecutarlo tantas veces como quieras: las
                        carreras duplicadas (misma hora de inicio) se ignoran.
                    </p>
                </section>

                <section className="space-y-3">
                    <h3 className="font-medium">Campos aceptados</h3>
                    <div className="overflow-hidden rounded-lg border">
                        <dl className="divide-y text-sm">
                            {FIELDS.map((field) => (
                                <div
                                    key={field.name}
                                    className="grid gap-1 px-4 py-2 sm:grid-cols-[16rem_1fr]"
                                >
                                    <dt className="font-mono text-xs leading-5">
                                        {field.name}
                                        {field.required && (
                                            <span className="ml-1 text-destructive">
                                                *
                                            </span>
                                        )}
                                    </dt>
                                    <dd className="text-muted-foreground">
                                        {field.description}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <CodeBlock
                        label="Ejemplo de cuerpo JSON"
                        code={exampleJson}
                    />
                    <CodeBlock label="Prueba con curl" code={curl} />
                </section>
            </CardContent>
        </Card>
    );
}

function NewTokenAlert({ token }: { token: string }) {
    const [copied, copy] = useClipboard();

    return (
        <Alert className="border-yellow-400/60 bg-yellow-400/10">
            <AlertTriangle />
            <AlertTitle>Copia tu token ahora</AlertTitle>
            <AlertDescription className="space-y-2">
                <p>
                    Por seguridad solo lo mostraremos esta vez. Si lo pierdes,
                    revócalo y crea uno nuevo.
                </p>
                <div className="flex w-full items-center gap-2">
                    <Input
                        readOnly
                        value={token}
                        className="font-mono text-xs"
                        onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copy(token)}
                    >
                        {copied === token ? <Check /> : <Copy />}
                        {copied === token ? 'Copiado' : 'Copiar'}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
    const [copied, copy] = useClipboard();

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copy(code)}
                >
                    {copied === code ? <Check /> : <Copy />}
                    {copied === code ? 'Copiado' : 'Copiar'}
                </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
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
