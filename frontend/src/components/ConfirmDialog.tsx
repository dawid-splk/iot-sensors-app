import {type ReactNode, useState} from 'react'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: ReactNode
    confirmLabel: string
    pendingLabel: string
    /** Resolves to true when the action succeeded and the dialog may close. */
    onConfirm: () => Promise<boolean>
    onCloseAutoFocus: (event: Event) => void
}

export function ConfirmDialog({
                                  open,
                                  onOpenChange,
                                  title,
                                  description,
                                  confirmLabel,
                                  pendingLabel,
                                  onConfirm,
                                  onCloseAutoFocus,
                              }: ConfirmDialogProps) {
    const [pending, setPending] = useState(false)

    async function handleConfirm() {
        setPending(true)
        try {
            if (await onConfirm()) onOpenChange(false)
        } finally {
            setPending(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
            <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus} className="data-[size=default]:sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Anuluj</AlertDialogCancel>
                    <Button type="button" variant="destructive" onClick={handleConfirm} disabled={pending}>
                        {pending ? pendingLabel : confirmLabel}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
