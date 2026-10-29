import { useState } from 'react';
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
import type { Passkey } from '@/types/auth';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center gap-3 py-3 last:pb-0">
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="truncate">{passkey.name}</span>
                    {passkey.authenticator && (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {passkey.authenticator}
                        </span>
                    )}
                </p>
                <p className="text-[13px] text-muted-foreground">
                    {passkey.last_used_at_diff
                        ? `Último uso: ${passkey.last_used_at_diff}`
                        : `Añadida ${passkey.created_at_diff}, sin usar todavía`}
                </p>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-11 rounded-lg font-bold text-destructive hover:text-destructive"
                        aria-label={`Eliminar la passkey ${passkey.name}`}
                    >
                        Eliminar
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Eliminar passkey</DialogTitle>
                    <DialogDescription>
                        ¿Seguro que quieres eliminar la passkey "{passkey.name}
                        "? Ya no podrás usarla para iniciar sesión.
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar passkey'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
