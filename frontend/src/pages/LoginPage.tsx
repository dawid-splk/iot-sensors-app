import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Navigate, useLocation} from 'react-router-dom'
import {z} from 'zod'
import {ApiError, getErrorMessage} from '@/api/client'
import {peekReturnTo, sanitizeReturnPath} from '@/api/return-to'
import {useAuth} from '@/auth/auth-context'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'

const DEFAULT_TARGET = '/admin/series'

const loginSchema = z.object({
    username: z.string().trim().min(1, 'Podaj nazwę użytkownika'),
    password: z.string().min(1, 'Podaj hasło'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
    const {isLoggedIn, login} = useAuth()
    const location = useLocation()
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {username: '', password: ''},
    })

    // After a successful login isLoggedIn flips and this redirect fires, so there is a single exit path.
    if (isLoggedIn) {
        const from = sanitizeReturnPath((location.state as { from?: unknown } | null)?.from)
        return <Navigate to={from ?? peekReturnTo() ?? DEFAULT_TARGET} replace/>
    }

    async function onSubmit(values: LoginFormValues) {
        setServerError(null)
        try {
            await login(values)
        } catch (error) {
            setServerError(
                error instanceof ApiError && error.status === 401
                    ? 'Niepoprawna nazwa użytkownika lub hasło'
                    : getErrorMessage(error),
            )
        }
    }

    return (
        <section className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl font-semibold">Logowanie administratora</h1>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Nazwa użytkownika</Label>
                    <Input
                        id="username"
                        type="text"
                        autoComplete="username"
                        aria-invalid={errors.username ? true : undefined}
                        aria-describedby={errors.username ? 'username-error' : undefined}
                        {...register('username')}
                    />
                    {errors.username && (
                        <p id="username-error" className="text-sm text-destructive">
                            {errors.username.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Hasło</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={errors.password ? true : undefined}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                        {...register('password')}
                    />
                    {errors.password && (
                        <p id="password-error" className="text-sm text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full print:hidden">
                    {isSubmitting ? 'Logowanie…' : 'Zaloguj'}
                </Button>

                {serverError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {serverError}
                    </p>
                )}
            </form>
        </section>
    )
}
