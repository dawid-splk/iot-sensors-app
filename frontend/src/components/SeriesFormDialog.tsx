import {useState} from 'react'
import {Controller, useForm, useWatch} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {toast} from 'sonner'
import {z} from 'zod'
import {useCreateSeries, useUpdateSeries} from '@/api/series'
import type {Series, SeriesInput} from '@/api/types'
import {FieldError, FormAlert} from '@/components/FieldError'
import {SeriesSwatch} from '@/components/SeriesSwatch'
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
import {isSeriesIcon, SERIES_ICON_LABELS, SERIES_ICONS} from '@/lib/series-style'

const AUTO_ICON = 'auto'
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const DEFAULT_COLOR = '#1f77b4'

const seriesSchema = z
    .object({
        name: z.string().trim().min(1, 'Podaj nazwę serii').max(100, 'Nazwa może mieć maksymalnie 100 znaków'),
        minValue: z.number({error: 'Podaj liczbę'}),
        maxValue: z.number({error: 'Podaj liczbę'}),
        color: z.string().regex(HEX_COLOR, 'Podaj kolor w formacie #RRGGBB'),
        icon: z.string(),
        unit: z.string().trim().max(20, 'Jednostka może mieć maksymalnie 20 znaków'),
    })
    .refine((values) => values.minValue < values.maxValue, {
        path: ['maxValue'],
        message: 'Wartość maksymalna musi być większa od minimalnej',
    })

type SeriesFormValues = z.infer<typeof seriesSchema>

const SERVER_FIELDS = ['name', 'minValue', 'maxValue', 'color', 'icon', 'unit'] as const

interface SeriesFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** null means creating a new series. */
    series: Series | null
    onCloseAutoFocus: (event: Event) => void
}

export function SeriesFormDialog({open, onOpenChange, series, onCloseAutoFocus}: SeriesFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" onCloseAutoFocus={onCloseAutoFocus}>
                <SeriesForm series={series} onDone={() => onOpenChange(false)}/>
            </DialogContent>
        </Dialog>
    )
}

function SeriesForm({series, onDone}: { series: Series | null; onDone: () => void }) {
    const createSeries = useCreateSeries()
    const updateSeries = useUpdateSeries()
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setError,
        formState: {errors, isSubmitting},
    } = useForm<SeriesFormValues>({
        resolver: zodResolver(seriesSchema),
        defaultValues: {
            name: series?.name ?? '',
            minValue: series?.minValue,
            maxValue: series?.maxValue,
            color: series?.color ?? DEFAULT_COLOR,
            icon: isSeriesIcon(series?.icon) ? series.icon : AUTO_ICON,
            unit: series?.unit ?? '',
        },
    })

    const color = useWatch({control, name: 'color'})
    const pickerColor = HEX_COLOR.test(color) ? color : '#000000'

    async function onSubmit(values: SeriesFormValues) {
        setFormError(null)

        const input: SeriesInput = {
            name: values.name,
            minValue: values.minValue,
            maxValue: values.maxValue,
            color: values.color,
            icon: values.icon === AUTO_ICON ? null : values.icon,
            unit: values.unit === '' ? null : values.unit,
        }

        try {
            if (series) await updateSeries.mutateAsync({id: series.id, input})
            else await createSeries.mutateAsync(input)

            toast.success(series ? 'Zapisano zmiany w serii' : 'Dodano serię')
            onDone()
        } catch (error) {
            setFormError(
                applyServerError(error, setError, SERVER_FIELDS, {
                    409: 'Nowy przedział wyklucza już zapisane wyniki tej serii. Zmień zakres tak, aby obejmował wszystkie zapisane wartości.',
                }),
            )
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <DialogHeader>
                <DialogTitle>{series ? 'Edycja serii' : 'Nowa seria'}</DialogTitle>
                <DialogDescription>
                    {series
                        ? 'Zmień nazwę, zakres wartości lub wygląd serii na wykresie.'
                        : 'Podaj nazwę, dopuszczalny zakres wartości i wygląd serii na wykresie.'}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <Label htmlFor="series-name">Nazwa</Label>
                <Input type="text"
                       autoComplete="off" {...fieldProps('series-name', errors.name)} {...register('name')}/>
                <FieldError id="series-name" message={errors.name?.message}/>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="series-min">Wartość minimalna</Label>
                    <Input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        {...fieldProps('series-min', errors.minValue)}
                        {...register('minValue', {valueAsNumber: true})}
                    />
                    <FieldError id="series-min" message={errors.minValue?.message}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="series-max">Wartość maksymalna</Label>
                    <Input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        {...fieldProps('series-max', errors.maxValue)}
                        {...register('maxValue', {valueAsNumber: true})}
                    />
                    <FieldError id="series-max" message={errors.maxValue?.message}/>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="series-color">Kolor (#RRGGBB)</Label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        aria-label="Selektor koloru"
                        value={pickerColor}
                        onChange={(event) =>
                            setValue('color', event.target.value, {shouldDirty: true, shouldValidate: true})
                        }
                        className="h-8 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <Input
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={7}
                        className="font-mono"
                        {...fieldProps('series-color', errors.color)}
                        {...register('color')}
                    />
                </div>
                <FieldError id="series-color" message={errors.color?.message}/>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="series-icon">Znacznik punktu</Label>
                    <Controller
                        control={control}
                        name="icon"
                        render={({field}) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="series-icon" className="w-full" onBlur={field.onBlur}>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value={AUTO_ICON}>Automatyczny</SelectItem>
                                    {SERIES_ICONS.map((icon) => (
                                        <SelectItem key={icon} value={icon}>
                                            <SeriesSwatch color="currentColor" pointStyle={icon} borderDash={[]}/>
                                            {SERIES_ICON_LABELS[icon]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="series-unit">Jednostka (opcjonalnie)</Label>
                    <Input type="text"
                           autoComplete="off" {...fieldProps('series-unit', errors.unit)} {...register('unit')}/>
                    <FieldError id="series-unit" message={errors.unit?.message}/>
                </div>
            </div>

            <FormAlert message={formError}/>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>Anuluj</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Zapisywanie…' : 'Zapisz'}
                </Button>
            </DialogFooter>
        </form>
    )
}
