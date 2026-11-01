import type {ReactNode} from 'react'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'

export function LoadingState({label = 'Ładowanie danych…'}: { label?: string }) {
    return (
        <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">{label}</span>
            <Skeleton className="h-[360px] w-full"/>
            <Skeleton className="h-6 w-1/3"/>
            <Skeleton className="h-40 w-full"/>
        </div>
    )
}

export function ErrorState({message, onRetry}: { message: string; onRetry: () => void }) {
    return (
        <div role="alert" className="space-y-3 rounded-lg border border-destructive p-4">
            <p className="font-medium text-destructive">{message}</p>
            <Button type="button" variant="outline" onClick={onRetry} className="print:hidden">
                Spróbuj ponownie
            </Button>
        </div>
    )
}

export function EmptyState({children}: { children: ReactNode }) {
    return (
        <div role="status" className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            {children}
        </div>
    )
}
