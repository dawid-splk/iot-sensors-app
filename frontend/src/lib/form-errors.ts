import type {FieldPath, FieldValues, UseFormSetError} from 'react-hook-form'
import {toast} from 'sonner'
import {ApiError, getErrorMessage} from '@/api/client'

// Maps a failed request onto the form
export function applyServerError<T extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<T>,
    fields: readonly FieldPath<T>[],
    statusMessages: Partial<Record<number, string>> = {},
): string | null {
    if (!(error instanceof ApiError)) {
        toast.error(getErrorMessage(error))
        return null
    }

    let assigned = 0
    for (const item of error.errors) {
        const field = fields.find((name) => name === item.field)
        if (field) {
            setError(field, {type: 'server', message: item.message})
            assigned += 1
        }
    }

    const override = statusMessages[error.status]
    if (override) return override
    return assigned > 0 ? null : error.message
}

export function fieldProps(id: string, error: unknown) {
    return {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
    } as const
}
