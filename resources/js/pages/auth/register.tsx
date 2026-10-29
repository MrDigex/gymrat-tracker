import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { AuthFooterLink } from '@/components/public/auth-footer-link';
import { PasswordStrength } from '@/components/public/password-strength';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [password, setPassword] = useState('');

    return (
        <>
            <Head title="Crear cuenta" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                name="name"
                                placeholder="Cómo quieres que te llamemos"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                name="email"
                                placeholder="correo@ejemplo.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <PasswordInput
                                id="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                name="password"
                                placeholder="Mínimo 8 caracteres"
                                passwordrules={passwordRules}
                                aria-describedby="password-strength"
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                            <PasswordStrength
                                id="password-strength"
                                value={password}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Repite la contraseña
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                name="password_confirmation"
                                placeholder="La misma otra vez"
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-1"
                            tabIndex={5}
                            data-test="register-user-button"
                        >
                            {processing && <Spinner />}
                            Crear cuenta
                        </Button>
                    </>
                )}
            </Form>

            <AuthFooterLink>
                ¿Ya tienes cuenta?{' '}
                <TextLink
                    href={login()}
                    tabIndex={6}
                    className="font-bold text-primary-text decoration-current"
                >
                    Inicia sesión
                </TextLink>
            </AuthFooterLink>
        </>
    );
}

Register.layout = {
    title: 'Empieza gratis',
    description: 'Crea tu cuenta y monta tu primera rutina en dos minutos.',
};
