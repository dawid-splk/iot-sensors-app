import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {toast} from 'sonner'
import {z} from 'zod'
import {changePasswordRequest} from '@/api/auth'
import {ApiError} from '@/api/client'
import {FieldError, FormAlert} from '@/components/FieldError'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {applyServerError, fieldProps} from '@/lib/form-errors'

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Podaj bieżące hasło'),
        newPassword: z
            .string()
            .min(8, 'Nowe hasło musi mieć co najmniej 8 znaków')
            .max(72, 'Nowe hasło może mieć maksymalnie 72 znaki'),
        confirmPassword: z.string().min(1, 'Powtórz nowe hasło'),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Hasła nie są takie same',
    })

type PasswordFormValues = z.infer<typeof passwordSchema>

const SERVER_FIELDS = ['currentPassword', 'newPassword'] as const

const EMPTY_VALUES: PasswordFormValues = {currentPassword: '', newPassword: '', confirmPassword: ''}

export function AdminAccountPage() {
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: {errors, isSubmitting},
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: EMPTY_VALUES,
    })

    async function onSubmit(values: PasswordFormValues) {
        setFormError(null)
        try {
            await changePasswordRequest({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            })
            // The current token stays valid; the server only ends the other sessions.
            reset(EMPTY_VALUES)
            toast.success('Hasło zostało zmienione')
        } catch (error) {
            if (error instanceof ApiError && error.status === 403) {
                setError('currentPassword', {type: 'server', message: 'Niepoprawne bieżące hasło'})
                return
            }
            setFormError(applyServerError(error, setError, SERVER_FIELDS))
        }
    }

    return (
        <section className="mx-auto w-full max-w-md">
            <h1 id="page-title" tabIndex={-1} className="text-2xl font-semibold outline-none">Konto</h1>

            <h2 className="mt-6 text-lg font-semibold">Zmiana hasła</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Bieżące hasło</Label>
                    <Input
                        type="password"
                        autoComplete="current-password"
                        {...fieldProps('current-password', errors.currentPassword)}
                        {...register('currentPassword')}
                    />
                    <FieldError id="current-password" message={errors.currentPassword?.message}/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password">Nowe hasło</Label>
                    <Input
                        type="password"
                        autoComplete="new-password"
                        {...fieldProps('new-password', errors.newPassword)}
                        {...register('newPassword')}
                    />
                    <FieldError id="new-password" message={errors.newPassword?.message}/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Powtórz nowe hasło</Label>
                    <Input
                        type="password"
                        autoComplete="new-password"
                        {...fieldProps('confirm-password', errors.confirmPassword)}
                        {...register('confirmPassword')}
                    />
                    <FieldError id="confirm-password" message={errors.confirmPassword?.message}/>
                </div>

                <FormAlert message={formError}/>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Zapisywanie…' : 'Zmień hasło'}
                </Button>
            </form>
        </section>
    )
}
