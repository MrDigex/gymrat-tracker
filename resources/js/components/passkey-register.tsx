import { Plus } from 'lucide-react';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = [
            { pattern: /Edg|Edge/, name: 'Edge' },
            { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
            { pattern: /Firefox|FxiOS/, name: 'Firefox' },
            { pattern: /Chrome|CriOS/, name: 'Chrome' },
            { pattern: /Safari/, name: 'Safari' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        const os = [
            { pattern: /iPhone/, name: 'iPhone' },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
            { pattern: /Android/, name: 'Android' },
            { pattern: /Mac/, name: 'Mac' },
            { pattern: /Windows/, name: 'Windows' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(' en ') || '';
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    if (!isSupported) {
        return (
            <div className="text-sm text-muted-foreground">
                Este navegador no admite passkeys.
            </div>
        );
    }

    if (!showForm) {
        return (
            <Button
                onClick={() => setShowForm(true)}
                className="h-11 rounded-lg bg-foreground font-bold text-background hover:bg-foreground/90"
            >
                <Plus />
                Añadir passkey
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex w-full basis-full flex-col gap-3 rounded-lg border border-dashed p-4"
        >
            <div className="grid gap-2">
                <Label htmlFor="passkey-name">Nombre de la passkey</Label>
                <Input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="p. ej., MacBook Pro, iPhone"
                    className="h-11"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    Te ayudará a reconocerla más adelante.
                </p>
            </div>

            {error && <InputError message={error} />}

            <div className="flex gap-2">
                <Button
                    type="submit"
                    className="h-11 rounded-lg font-bold"
                    disabled={isLoading || !name.trim()}
                >
                    {isLoading ? 'Registrando...' : 'Añadir passkey'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-11"
                    onClick={handleCancel}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
