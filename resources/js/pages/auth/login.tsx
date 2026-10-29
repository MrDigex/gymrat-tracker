import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { AuthFooterLink } from '@/components/public/auth-footer-link';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            {status && (
                <div
                    role="status"
                    className="mb-4 rounded-[14px] bg-muted p-3 text-sm font-medium text-trend-up"
                >
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="correo@ejemplo.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Contraseña</Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="ml-auto text-sm font-bold text-primary-text decoration-current"
                                        tabIndex={5}
                                    >
                                        ¿La olvidaste?
                                    </TextLink>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Tu contraseña"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <label
                            htmlFor="remember"
                            className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]"
                        >
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                className="size-6 rounded-[6px]"
                            />
                            Recordarme en este móvil
                        </label>

                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            Iniciar sesión
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-4 [&_button]:h-14 [&_button]:rounded-[16px] [&_button]:bg-transparent [&_button]:text-base [&_button]:font-bold [&>.relative]:hidden">
                <PasskeyVerify
                    label="Entrar con passkey"
                    loadingLabel="Comprobando passkey…"
                />
            </div>

            <AuthFooterLink>
                ¿No tienes cuenta?{' '}
                <TextLink
                    href={register()}
                    tabIndex={6}
                    className="font-bold text-primary-text decoration-current"
                >
                    Regístrate gratis
                </TextLink>
            </AuthFooterLink>
        </>
    );
}

Login.layout = {
    title: 'Vuelve a la barra',
    description: 'Entra con tu correo y contraseña.',
};
