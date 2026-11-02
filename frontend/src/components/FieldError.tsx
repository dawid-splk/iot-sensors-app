export function FieldError({id, message}: { id: string; message?: string }) {
    if (!message) return null

    return (
        <p id={`${id}-error`} className="text-sm text-destructive">
            {message}
        </p>
    )
}

export function FormAlert({message}: { message: string | null }) {
    if (!message) return null

    return (
        <p role="alert" className="rounded-lg border border-destructive p-3 text-sm font-medium text-destructive">
            {message}
        </p>
    )
}
