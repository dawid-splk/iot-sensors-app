import type {FormEvent} from 'react'
import {PrinterIcon, RefreshCwIcon} from 'lucide-react'
import {SeriesSwatch} from '@/components/SeriesSwatch'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import type {StyledSeries} from '@/lib/series-style'
import {cn} from '@/lib/utils'

export type QuickRange = 'day' | 'week' | 'all'

interface FiltersPanelProps {
    series: StyledSeries[]
    seriesStatus: 'loading' | 'error' | 'ready'
    hiddenSeriesIds: ReadonlySet<string>
    onToggleSeries: (seriesId: string, visible: boolean) => void
    from: string
    to: string
    onFromChange: (value: string) => void
    onToChange: (value: string) => void
    rangeError: string | null
    onQuickRange: (range: QuickRange) => void
    onRefresh: () => void
    isRefreshing: boolean
    onPrint: () => void
}

const RANGE_ERROR_ID = 'range-error'

export function FiltersPanel({
                                 series,
                                 seriesStatus,
                                 hiddenSeriesIds,
                                 onToggleSeries,
                                 from,
                                 to,
                                 onFromChange,
                                 onToChange,
                                 rangeError,
                                 onQuickRange,
                                 onRefresh,
                                 isRefreshing,
                                 onPrint,
                             }: FiltersPanelProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onRefresh()
    }

    const describedBy = rangeError ? RANGE_ERROR_ID : undefined

    return (
        <form
            aria-label="Filtry wyników"
            onSubmit={handleSubmit}
            className="space-y-6 self-start rounded-xl border p-4 print:hidden"
        >
            <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold">Przedział czasu</legend>

                <div className="space-y-2">
                    <Label htmlFor="filter-from">Od</Label>
                    <Input
                        id="filter-from"
                        type="datetime-local"
                        value={from}
                        onChange={(event) => onFromChange(event.target.value)}
                        aria-invalid={rangeError ? true : undefined}
                        aria-describedby={describedBy}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="filter-to">Do</Label>
                    <Input
                        id="filter-to"
                        type="datetime-local"
                        value={to}
                        onChange={(event) => onToChange(event.target.value)}
                        aria-invalid={rangeError ? true : undefined}
                        aria-describedby={describedBy}
                    />
                </div>

                {rangeError && (
                    <p id={RANGE_ERROR_ID} role="alert" className="text-sm font-medium text-destructive">
                        {rangeError}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onQuickRange('day')}>
                        Ostatnie 24 h
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onQuickRange('week')}>
                        Ostatnie 7 dni
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onQuickRange('all')}>
                        Wszystko
                    </Button>
                </div>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold">Serie</legend>

                {seriesStatus === 'loading' && <p className="text-sm text-muted-foreground">Ładowanie serii…</p>}
                {seriesStatus === 'error' && (
                    <p className="text-sm text-destructive">Nie udało się pobrać listy serii.</p>
                )}
                {seriesStatus === 'ready' && series.length === 0 && (
                    <p className="text-sm text-muted-foreground">Brak serii.</p>
                )}

                {series.map((item) => {
                    const id = String(item.series.id)
                    const inputId = `filter-series-${id}`
                    return (
                        <div key={id} className="flex items-center gap-2">
                            <Checkbox
                                id={inputId}
                                className="border-muted-foreground"
                                checked={!hiddenSeriesIds.has(id)}
                                onCheckedChange={(checked) => onToggleSeries(id, checked === true)}
                            />
                            <Label htmlFor={inputId} className="cursor-pointer leading-snug">
                                <SeriesSwatch
                                    color={item.color}
                                    pointStyle={item.pointStyle}
                                    borderDash={item.borderDash}
                                />
                                {item.label}
                            </Label>
                        </div>
                    )
                })}
            </fieldset>

            <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isRefreshing} aria-busy={isRefreshing}>
                    <RefreshCwIcon data-icon="inline-start" className={cn(isRefreshing && 'animate-spin')}/>
                    {isRefreshing ? 'Odświeżanie…' : 'Odśwież'}
                </Button>
                <Button type="button" variant="outline" onClick={onPrint}>
                    <PrinterIcon data-icon="inline-start"/>
                    Drukuj
                </Button>
            </div>
        </form>
    )
}
