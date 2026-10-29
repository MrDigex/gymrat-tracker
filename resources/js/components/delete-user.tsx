import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 lg:p-5"
            aria-labelledby="delete-account-title"
        >
            <div>
                <h2
                    id="delete-account-title"
                    className="text-lg leading-tight font-bold text-destructive"
                >
                    Eliminar cuenta
                </h2>
                <p className="mt-1 text-sm">
                    Se borran tus rutinas, entrenamientos y carreras. No se
                    puede deshacer.
                </p>
            </div>
            <div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="h-12 rounded-xl px-5 font-bold dark:text-destructive-foreground"
                            data-test="delete-user-button"
                        >
                            Eliminar mi cuenta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            ¿Seguro que quieres eliminar tu cuenta?
                        </DialogTitle>
                        <DialogDescription>
                            Al eliminar tu cuenta, todos tus datos (rutinas,
                            entrenamientos y carreras) se borrarán de forma
                            permanente. Introduce tu contraseña para confirmar
                            que quieres eliminar tu cuenta definitivamente.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            Contraseña
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Contraseña"
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Eliminar cuenta
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
