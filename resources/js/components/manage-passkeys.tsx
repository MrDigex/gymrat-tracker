import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import { SettingsCard } from '@/components/settings/settings-card';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
            <KeyRound
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
            />
            <p className="text-sm text-muted-foreground">
                Aún no tienes passkeys. Añade una para iniciar sesión sin
                contraseña.
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <SettingsCard
            id="passkeys"
            title="Passkeys"
            description="Entra con Face ID o la huella, sin contraseña."
            action={<PasskeyRegistration onSuccess={handleRegisterSuccess} />}
        >
            {passkeys.length > 0 ? (
                <div className="flex flex-col divide-y border-t">
                    {passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState />
            )}
        </SettingsCard>
    );
}
