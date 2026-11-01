import {useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'
import {getErrorMessage} from '@/api/client'
import {useMeasurements} from '@/api/measurements'
import {useSeries} from '@/api/series'
import type {Measurement, MeasurementsParams} from '@/api/types'
import {ChartPanel} from '@/components/ChartPanel'
import {FiltersPanel, type QuickRange} from '@/components/FiltersPanel'
import {MeasurementsTable} from '@/components/MeasurementsTable'
import {EmptyState, ErrorState, LoadingState} from '@/components/StateMessages'
import {datetimeLocalToIso, daysAgoInput, hoursAgoInput, isRangeInverted} from '@/lib/datetime'
import {styleSeries} from '@/lib/series-style'

const MEASUREMENTS_LIMIT = 10000
const RANGE_ERROR = 'Data „Od” nie może być późniejsza niż data „Do”.'

function useErrorToast(error: unknown, id: string) {
    useEffect(() => {
        if (error) toast.error(getErrorMessage(error), {id})
    }, [error, id])
}

export function DashboardPage() {
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [hiddenSeriesIds, setHiddenSeriesIds] = useState<ReadonlySet<string>>(() => new Set())
    const [highlightedId, setHighlightedId] = useState<string | null>(null)

    const seriesQuery = useSeries()

    const allSeries = useMemo(
        () => (seriesQuery.data ?? []).map((series, index) => styleSeries(series, index)),
        [seriesQuery.data],
    )
    const selectedSeries = useMemo(
        () => allSeries.filter((item) => !hiddenSeriesIds.has(String(item.series.id))),
        [allSeries, hiddenSeriesIds],
    )

    const rangeError = isRangeInverted(from, to) ? RANGE_ERROR : null

    const params: MeasurementsParams = {
        series: selectedSeries.map((item) => item.series.id),
        from: datetimeLocalToIso(from),
        to: datetimeLocalToIso(to),
        sort: 'timestamp',
        limit: MEASUREMENTS_LIMIT,
    }
    const measurementsQuery = useMeasurements(params, {enabled: rangeError === null})

    // Placeholder data from the previous filter may still contain series that were just unchecked.
    const measurements = useMemo<Measurement[]>(() => {
        const visibleIds = new Set(selectedSeries.map((item) => String(item.series.id)))
        return (measurementsQuery.data ?? []).filter((measurement) => visibleIds.has(String(measurement.seriesId)))
    }, [measurementsQuery.data, selectedSeries])

    useErrorToast(seriesQuery.error, 'series-error')
    useErrorToast(measurementsQuery.error, 'measurements-error')

    function changeFrom(value: string) {
        setFrom(value)
        setHighlightedId(null)
    }

    function changeTo(value: string) {
        setTo(value)
        setHighlightedId(null)
    }

    function applyQuickRange(range: QuickRange) {
        // The upper bound stays open so results arriving later are still included after a refresh.
        setFrom(range === 'day' ? hoursAgoInput(24) : range === 'week' ? daysAgoInput(7) : '')
        setTo('')
        setHighlightedId(null)
    }

    function toggleSeries(seriesId: string, visible: boolean) {
        setHiddenSeriesIds((current) => {
            const next = new Set(current)
            if (visible) next.delete(seriesId)
            else next.add(seriesId)
            return next
        })
        setHighlightedId(null)
    }

    function refresh() {
        void seriesQuery.refetch()
        if (rangeError === null && selectedSeries.length > 0) void measurementsQuery.refetch()
    }

    function selectMeasurement(measurement: Measurement) {
        const id = String(measurement.id)
        setHighlightedId((current) => (current === id ? null : id))
    }

    const seriesStatus = seriesQuery.isPending ? 'loading' : seriesQuery.isError ? 'error' : 'ready'
    const tableKey = `${selectedSeries.map((item) => item.series.id).join(',')}|${from}|${to}`

    function renderResults() {
        if (seriesQuery.isPending) return <LoadingState label="Ładowanie serii…"/>
        if (seriesQuery.isError) {
            return <ErrorState message={getErrorMessage(seriesQuery.error)} onRetry={() => void seriesQuery.refetch()}/>
        }
        if (allSeries.length === 0) return <EmptyState>Brak serii pomiarowych.</EmptyState>
        if (selectedSeries.length === 0) {
            return <EmptyState>Nie zaznaczono żadnej serii. Zaznacz co najmniej jedną serię w filtrach.</EmptyState>
        }
        if (rangeError) return <EmptyState>Popraw przedział czasu, aby zobaczyć wyniki.</EmptyState>
        if (measurementsQuery.isPending) return <LoadingState label="Ładowanie wyników…"/>
        if (measurementsQuery.isError) {
            return (
                <ErrorState
                    message={getErrorMessage(measurementsQuery.error)}
                    onRetry={() => void measurementsQuery.refetch()}
                />
            )
        }
        if (measurements.length === 0) return <EmptyState>Brak wyników w wybranym przedziale</EmptyState>

        return (
            <>
                {(measurementsQuery.data?.length ?? 0) >= MEASUREMENTS_LIMIT && (
                    <p role="status" className="text-sm font-medium print:hidden">
                        Wyświetlono pierwsze {MEASUREMENTS_LIMIT} wyników. Zawęź przedział czasu, aby zobaczyć
                        pozostałe.
                    </p>
                )}
                <ChartPanel series={selectedSeries} measurements={measurements} highlightedId={highlightedId}/>
                <MeasurementsTable
                    key={tableKey}
                    series={selectedSeries}
                    measurements={measurements}
                    highlightedId={highlightedId}
                    onSelect={selectMeasurement}
                />
            </>
        )
    }

    return (
        <section>
            <h1 className="text-2xl font-semibold">Pulpit</h1>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] print:block">
                <FiltersPanel
                    series={allSeries}
                    seriesStatus={seriesStatus}
                    hiddenSeriesIds={hiddenSeriesIds}
                    onToggleSeries={toggleSeries}
                    from={from}
                    to={to}
                    onFromChange={changeFrom}
                    onToChange={changeTo}
                    rangeError={rangeError}
                    onQuickRange={applyQuickRange}
                    onRefresh={refresh}
                    isRefreshing={seriesQuery.isFetching || measurementsQuery.isFetching}
                    onPrint={() => window.print()}
                />

                <div aria-busy={measurementsQuery.isFetching} className="min-w-0 space-y-6">
                    {renderResults()}
                </div>
            </div>
        </section>
    )
}
