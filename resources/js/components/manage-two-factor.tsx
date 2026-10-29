import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SettingsCard } from '@/components/settings/settings-card';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { formatDate } from '@/lib/format';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorConfirmedAt?: string | null;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    const since = props.twoFactorConfirmedAt
        ? ` desde el ${formatDate(props.twoFactorConfirmedAt, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : '';

    return (
        <SettingsCard
            id="two-factor"
            title="Verificación en dos pasos"
            description={
                twoFactorEnabled ? (
                    <span className="flex items-center gap-1.5 text-success">
                        <ShieldCheck className="size-4 shrink-0" aria-hidden />
                        Activada con app de autenticación{since}.
                    </span>
                ) : (
                    'Desactivada. Al activarla te pediremos un código de tu app de autenticación (TOTP) al iniciar sesión.'
                )
            }
            action={
                twoFactorEnabled ? (
                    <Form {...disable.form()}>
                        {({ processing }) => (
                            <Button
                                variant="outline"
                                type="submit"
                                disabled={processing}
                                className="h-11 rounded-lg font-bold text-destructive hover:text-destructive"
                            >
                                Desactivar
                            </Button>
                        )}
                    </Form>
                ) : hasSetupData ? (
                    <Button
                        onClick={() => setShowSetupModal(true)}
                        className="h-11 rounded-lg font-bold"
                    >
                        <ShieldCheck />
                        Continuar configuración
                    </Button>
                ) : (
                    <Form
                        {...enable.form()}
                        onSuccess={() => setShowSetupModal(true)}
                    >
                        {({ processing }) => (
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 rounded-lg font-bold"
                            >
                                Activar
                            </Button>
                        )}
                    </Form>
                )
            }
        >
            {twoFactorEnabled && (
                <TwoFactorRecoveryCodes
                    recoveryCodesList={recoveryCodesList}
                    fetchRecoveryCodes={fetchRecoveryCodes}
                    errors={errors}
                />
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </SettingsCard>
    );
}
