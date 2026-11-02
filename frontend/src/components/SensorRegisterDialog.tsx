import {useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Link} from 'react-router-dom'
import {toast} from 'sonner'
import {z} from 'zod'
import {useRegisterSensor} from '@/api/sensors'
import type {Series} from '@/api/types'
import {FieldError, FormAlert} from '@/components/FieldError'
import {Button} from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {applyServerError, fieldProps} from '@/lib/form-errors'

const sensorSchema = z.object({
    name: z.string().trim().min(1, 'Podaj nazwę czujnika').max(100, 'Nazwa może mieć maksymalnie 100 znaków'),
    seriesId: z.string().min(1, 'Wybierz serię'),
})

type SensorFormValues = z.infer<typeof sensorSchema>

const SERVER_FIELDS = ['name', 'seriesId'] as const

interface CreatedKey {
    sensorName: string
    apiKey: string
}

interface SensorRegisterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    series: Series[]
    onCloseAutoFocus: (event: Event) => void
}

export function SensorRegisterDialog({open, onOpenChange, series, onCloseAutoFocus}: SensorRegisterDialogProps) {
    // The key lives only in this state: never in the query cache, storage or logs.
    const [created, setCreated] = useState<CreatedKey | null>(null)

    function close() {
        setCreated(null)
        onOpenChange(false)
    }

    // While the key is shown, only the explicit button may close the dialog.
    const keepOpen = created !== null

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : keepOpen ? undefined : close())}>
            <DialogContent
                className="sm:max-w-lg"
                showCloseButton={!keepOpen}
                onCloseAutoFocus={onCloseAutoFocus}
                onEscapeKeyDown={(event) => keepOpen && event.preventDefault()}
                onInteractOutside={(event) => keepOpen && event.preventDefault()}
            >
                {created ? (
                    <KeyStage created={created} onDone={close}/>
                ) : (
                    <RegisterForm series={series} onRegistered={setCreated} onCancel={close}/>
                )}
            </DialogContent>
        </Dialog>
    )
}

function RegisterForm({
                          series,
                          onRegistered,
                          onCancel,
                      }: {
    series: Series[]
    onRegistered: (created: CreatedKey) => void
    onCancel: () => void
}) {
    const registerSensor = useRegisterSensor()
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: {errors, isSubmitting},
    } = useForm<SensorFormValues>({
        resolver: zodResolver(sensorSchema),
        defaultValues: {name: '', seriesId: ''},
    })

    async function onSubmit(values: SensorFormValues) {
        setFormError(null)

        const selected = series.find((item) => String(item.id) === values.seriesId)
        if (!selected) {
            setError('seriesId', {type: 'validate', message: 'Wybierz serię'})
            return
        }

        try {
            const response = await registerSensor({name: values.name, seriesId: selected.id})
            toast.success('Zarejestrowano czujnik')
            onRegistered({sensorName: response.name, apiKey: response.apiKey})
        } catch (error) {
            setFormError(applyServerError(error, setError, SERVER_FIELDS))
        }
    }

    if (series.length === 0) {
        return (
            <div className="grid gap-4">
                <DialogHeader>
                    <DialogTitle>Rejestracja czujnika</DialogTitle>
                    <DialogDescription>
                        Czujnik zapisuje wyniki do jednej serii, więc najpierw trzeba ją utworzyć.
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm">
                    Brak serii.{' '}
                    <Link to="/admin/series" onClick={onCancel} className="font-medium underline underline-offset-4">
                        Przejdź do serii
                    </Link>
                    , aby dodać pierwszą.
                </p>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Zamknij</Button>
                </DialogFooter>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <DialogHeader>
                <DialogTitle>Rejestracja czujnika</DialogTitle>
                <DialogDescription>
                    Podaj nazwę czujnika i serię, do której będzie zapisywał wyniki. Klucz API zostanie pokazany
                    tylko raz.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <Label htmlFor="sensor-name">Nazwa czujnika</Label>
                <Input type="text"
                       autoComplete="off" {...fieldProps('sensor-name', errors.name)} {...register('name')}/>
                <FieldError id="sensor-name" message={errors.name?.message}/>
            </div>

            <div className="space-y-2">
                <Label htmlFor="sensor-series">Seria</Label>
                <Controller
                    control={control}
                    name="seriesId"
                    render={({field}) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger
                                className="w-full"
                                onBlur={field.onBlur}
                                {...fieldProps('sensor-series', errors.seriesId)}
                            >
                                <SelectValue placeholder="Wybierz serię"/>
                            </SelectTrigger>
                            <SelectContent position="popper">
                                {series.map((item) => (
                                    <SelectItem key={item.id} value={String(item.id)}>
                                        {item.unit ? `${item.name} (${item.unit})` : item.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <FieldError id="sensor-series" message={errors.seriesId?.message}/>
            </div>

            <FormAlert message={formError}/>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
                        Anuluj
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Rejestrowanie…' : 'Zarejestruj'}
                </Button>
            </DialogFooter>
        </form>
    )
}

function KeyStage({created, onDone}: { created: CreatedKey; onDone: () => void }) {
    const [copyStatus, setCopyStatus] = useState('')

    async function copyKey() {
        try {
            await navigator.clipboard.writeText(created.apiKey)
            setCopyStatus('Skopiowano klucz do schowka.')
        } catch {
            setCopyStatus('Nie udało się skopiować. Zaznacz klucz i skopiuj go ręcznie.')
        }
    }

    return (
        <div className="grid gap-4">
            <DialogHeader>
                <DialogTitle>Klucz API czujnika „{created.sensorName}”</DialogTitle>
                <DialogDescription>
                    Użyj go w generatorze danych (parametr <code>--api-key</code> lub zmienna{' '}
                    <code>ZAI_API_KEY</code>).
                </DialogDescription>
            </DialogHeader>

            <p className="rounded-lg border border-orange-600 p-3 text-sm font-medium text-orange-700">
                Ten klucz jest pokazany tylko teraz. Po zamknięciu okna nie będzie już dostępny. Jeśli go zgubisz,
                trzeba będzie zarejestrować nowy czujnik.
            </p>

            <div className="space-y-2">
                <Label htmlFor="sensor-api-key">Klucz API</Label>
                <div className="flex gap-2">
                    <Input
                        id="sensor-api-key"
                        type="text"
                        readOnly
                        autoFocus
                        value={created.apiKey}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono"
                        onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button type="button" variant="outline" onClick={copyKey}>Kopiuj</Button>
                </div>
                <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
                    {copyStatus}
                </p>
            </div>

            <DialogFooter>
                <Button type="button" onClick={onDone}>Zapisałem klucz</Button>
            </DialogFooter>
        </div>
    )
}
