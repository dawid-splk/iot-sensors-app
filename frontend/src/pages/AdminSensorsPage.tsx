import {useMemo, useState} from 'react'
import {PlusIcon, Trash2Icon} from 'lucide-react'
import {Link} from 'react-router-dom'
import {toast} from 'sonner'
import {getErrorMessage} from '@/api/client'
import {useDeleteSensor, useSensors} from '@/api/sensors'
import {useSeries} from '@/api/series'
import type {Sensor} from '@/api/types'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {SensorRegisterDialog} from '@/components/SensorRegisterDialog'
import {EmptyState, ErrorState, ListLoadingState} from '@/components/StateMessages'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {formatTimestamp} from '@/lib/datetime'
import {useReturnFocus} from '@/lib/use-return-focus'

export function AdminSensorsPage() {
    const sensorsQuery = useSensors()
    const seriesQuery = useSeries()
    const deleteSensor = useDeleteSensor()
    const {capture, restore} = useReturnFocus()

    const [registerOpen, setRegisterOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState<Sensor | null>(null)

    const seriesNames = useMemo(
        () => new Map((seriesQuery.data ?? []).map((series) => [String(series.id), series.name])),
        [seriesQuery.data],
    )

    function openRegister() {
        capture()
        setRegisterOpen(true)
    }

    function openDelete(sensor: Sensor) {
        capture()
        setDeleting(sensor)
        setDeleteOpen(true)
    }

    async function confirmDelete(): Promise<boolean> {
        if (!deleting) return false
        try {
            await deleteSensor.mutateAsync(deleting.id)
            toast.success(`Wyrejestrowano czujnik „${deleting.name}”`)
            return true
        } catch (error) {
            toast.error(getErrorMessage(error))
            return false
        }
    }

    function renderContent() {
        if (sensorsQuery.isPending || seriesQuery.isPending) return <ListLoadingState label="Ładowanie czujników…"/>

        const failed = sensorsQuery.isError ? sensorsQuery : seriesQuery.isError ? seriesQuery : null
        if (failed) {
            return (
                <ErrorState
                    message={getErrorMessage(failed.error)}
                    onRetry={() => void Promise.all([sensorsQuery.refetch(), seriesQuery.refetch()])}
                />
            )
        }

        const sensors = sensorsQuery.data ?? []
        if (sensors.length === 0) {
            return (
                <EmptyState>
                    <p>Brak czujników. Zarejestruj czujnik, aby otrzymać klucz API dla generatora danych.</p>
                    <Button type="button" onClick={openRegister} className="mt-4">
                        <PlusIcon data-icon="inline-start"/>
                        Zarejestruj czujnik
                    </Button>
                </EmptyState>
            )
        }

        return (
            <div className="rounded-xl border">
                <Table>
                    <TableCaption className="mt-0 mb-2 caption-top px-2 pt-3 text-left">
                        Zarejestrowane czujniki. Klucz API jest pokazywany tylko podczas rejestracji.
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col">Nazwa</TableHead>
                            <TableHead scope="col">Seria</TableHead>
                            <TableHead scope="col">Zarejestrowano</TableHead>
                            <TableHead scope="col">Ostatni wynik</TableHead>
                            <TableHead scope="col">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sensors.map((sensor) => (
                            <TableRow key={sensor.id}>
                                <TableHead scope="row">{sensor.name}</TableHead>
                                <TableCell>
                                    {seriesNames.get(String(sensor.seriesId)) ?? `Seria nr ${sensor.seriesId}`}
                                </TableCell>
                                <TableCell>{sensor.createdAt ? formatTimestamp(sensor.createdAt) : '—'}</TableCell>
                                <TableCell>
                                    {sensor.lastMeasurementAt ? formatTimestamp(sensor.lastMeasurementAt) : 'brak'}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        aria-label={`Wyrejestruj czujnik ${sensor.name}`}
                                        onClick={() => openDelete(sensor)}
                                    >
                                        <Trash2Icon data-icon="inline-start"/>
                                        Wyrejestruj
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    const hasSensors = (sensorsQuery.data?.length ?? 0) > 0
    const noSeries = seriesQuery.isSuccess && seriesQuery.data.length === 0

    return (
        <section className="space-y-6">
            <title>Czujniki</title>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 id="page-title" tabIndex={-1} className="text-2xl font-semibold outline-none">Czujniki</h1>
                {hasSensors && (
                    <Button type="button" onClick={openRegister}>
                        <PlusIcon data-icon="inline-start"/>
                        Zarejestruj czujnik
                    </Button>
                )}
            </div>

            {noSeries && (
                <p className="text-sm">
                    Czujnik musi należeć do serii.{' '}
                    <Link to="/admin/series" className="font-medium underline underline-offset-4">
                        Najpierw dodaj serię
                    </Link>
                    .
                </p>
            )}

            {renderContent()}

            <SensorRegisterDialog
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                series={seriesQuery.data ?? []}
                onCloseAutoFocus={restore}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={`Wyrejestrować czujnik „${deleting?.name ?? ''}”?`}
                description="Klucz API tego czujnika natychmiast przestanie działać. Wyniki zebrane przez czujnik pozostaną w serii."
                confirmLabel="Wyrejestruj"
                pendingLabel="Wyrejestrowywanie…"
                onConfirm={confirmDelete}
                onCloseAutoFocus={restore}
            />
        </section>
    )
}
