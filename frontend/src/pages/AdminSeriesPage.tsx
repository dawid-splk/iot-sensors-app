import {useMemo, useState} from 'react'
import {PencilIcon, PlusIcon, Trash2Icon} from 'lucide-react'
import {toast} from 'sonner'
import {getErrorMessage} from '@/api/client'
import {useDeleteSeries, useSeries} from '@/api/series'
import {ConfirmDialog} from '@/components/ConfirmDialog'
import {SeriesFormDialog} from '@/components/SeriesFormDialog'
import {SeriesSwatch} from '@/components/SeriesSwatch'
import {EmptyState, ErrorState, ListLoadingState} from '@/components/StateMessages'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {formatValue} from '@/lib/datetime'
import {isSeriesIcon, SERIES_ICON_LABELS, type StyledSeries, styleSeries} from '@/lib/series-style'
import {useReturnFocus} from '@/lib/use-return-focus'
import type {Series} from '@/api/types'

export function AdminSeriesPage() {
    const seriesQuery = useSeries()
    const deleteSeries = useDeleteSeries()
    const {capture, restore} = useReturnFocus()

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Series | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState<Series | null>(null)

    const rows = useMemo(
        () => (seriesQuery.data ?? []).map((series, index) => styleSeries(series, index)),
        [seriesQuery.data],
    )

    function openCreate() {
        capture()
        setEditing(null)
        setFormOpen(true)
    }

    function openEdit(series: Series) {
        capture()
        setEditing(series)
        setFormOpen(true)
    }

    function openDelete(series: Series) {
        capture()
        setDeleting(series)
        setDeleteOpen(true)
    }

    async function confirmDelete(): Promise<boolean> {
        if (!deleting) return false
        try {
            await deleteSeries.mutateAsync(deleting.id)
            toast.success(`Usunięto serię „${deleting.name}”`)
            return true
        } catch (error) {
            toast.error(getErrorMessage(error))
            return false
        }
    }

    function renderContent() {
        if (seriesQuery.isPending) return <ListLoadingState label="Ładowanie serii…"/>
        if (seriesQuery.isError) {
            return <ErrorState message={getErrorMessage(seriesQuery.error)} onRetry={() => void seriesQuery.refetch()}/>
        }
        if (rows.length === 0) {
            return (
                <EmptyState>
                    <p>Brak serii. Dodaj pierwszą serię, aby czujniki mogły zapisywać do niej wyniki.</p>
                    <Button type="button" onClick={openCreate} className="mt-4">
                        <PlusIcon data-icon="inline-start"/>
                        Dodaj serię
                    </Button>
                </EmptyState>
            )
        }

        return (
            <div className="rounded-xl border">
                <Table>
                    <TableCaption className="mt-0 mb-2 caption-top px-2 pt-3 text-left">
                        Serie pomiarowe. Usunięcie serii kasuje też jej czujniki i wyniki.
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col">Nazwa</TableHead>
                            <TableHead scope="col">Zakres</TableHead>
                            <TableHead scope="col">Kolor</TableHead>
                            <TableHead scope="col">Znacznik</TableHead>
                            <TableHead scope="col">Jednostka</TableHead>
                            <TableHead scope="col">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <SeriesRow key={row.series.id} row={row} onEdit={openEdit} onDelete={openDelete}/>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 id="page-title" tabIndex={-1} className="text-2xl font-semibold outline-none">Serie</h1>
                {rows.length > 0 && (
                    <Button type="button" onClick={openCreate}>
                        <PlusIcon data-icon="inline-start"/>
                        Dodaj serię
                    </Button>
                )}
            </div>

            {renderContent()}

            <SeriesFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                series={editing}
                onCloseAutoFocus={restore}
            />

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={`Usunąć serię „${deleting?.name ?? ''}”?`}
                description="Usunięcie serii kasuje też wszystkie jej czujniki oraz wszystkie zapisane wyniki. Tej operacji nie można cofnąć."
                confirmLabel="Usuń serię"
                pendingLabel="Usuwanie…"
                onConfirm={confirmDelete}
                onCloseAutoFocus={restore}
            />
        </section>
    )
}

function SeriesRow({
                       row,
                       onEdit,
                       onDelete,
                   }: {
    row: StyledSeries
    onEdit: (series: Series) => void
    onDelete: (series: Series) => void
}) {
    const {series} = row
    const iconLabel = SERIES_ICON_LABELS[row.pointStyle]

    return (
        <TableRow>
            <TableHead scope="row">{series.name}</TableHead>
            <TableCell className="tabular-nums">
                {formatValue(series.minValue)} – {formatValue(series.maxValue)}
            </TableCell>
            <TableCell>
                <span className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className="inline-block size-4 rounded border border-foreground/40"
                        style={{backgroundColor: series.color}}
                    />
                    <span className="font-mono">{series.color}</span>
                </span>
            </TableCell>
            <TableCell>
                <span className="flex items-center gap-2">
                    <SeriesSwatch color="currentColor" pointStyle={row.pointStyle} borderDash={row.borderDash}/>
                    {iconLabel}
                    {!isSeriesIcon(series.icon) && <span className="text-muted-foreground">(automatyczny)</span>}
                </span>
            </TableCell>
            <TableCell>{series.unit ?? '—'}</TableCell>
            <TableCell>
                <span className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`Edytuj serię ${series.name}`}
                        onClick={() => onEdit(series)}
                    >
                        <PencilIcon data-icon="inline-start"/>
                        Edytuj
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        aria-label={`Usuń serię ${series.name}`}
                        onClick={() => onDelete(series)}
                    >
                        <Trash2Icon data-icon="inline-start"/>
                        Usuń
                    </Button>
                </span>
            </TableCell>
        </TableRow>
    )
}
