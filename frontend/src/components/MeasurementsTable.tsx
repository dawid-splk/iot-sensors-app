import {useEffect, useMemo, useState} from 'react'
import {flushSync} from 'react-dom'
import type {Measurement} from '@/api/types'
import {SeriesSwatch} from '@/components/SeriesSwatch'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {formatTimestamp, formatValue} from '@/lib/datetime'
import type {StyledSeries} from '@/lib/series-style'
import {cn} from '@/lib/utils'

const PAGE_SIZE = 50

interface MeasurementsTableProps {
    series: StyledSeries[]
    measurements: Measurement[]
    highlightedId: string | null
    onSelect: (measurement: Measurement) => void
}

interface Row {
    time: number
    iso: string
    // A series can hold two results with the same timestamp (two sensors), hence an array.
    cells: Map<string, Measurement[]>
}

function buildRows(measurements: Measurement[]): Row[] {
    const rows = new Map<number, Row>()

    for (const measurement of measurements) {
        const time = Date.parse(measurement.timestamp)
        let row = rows.get(time)
        if (!row) {
            row = {time, iso: measurement.timestamp, cells: new Map()}
            rows.set(time, row)
        }
        const key = String(measurement.seriesId)
        const cell = row.cells.get(key)
        if (cell) cell.push(measurement)
        else row.cells.set(key, [measurement])
    }

    return [...rows.values()].sort((a, b) => a.time - b.time)
}

export function MeasurementsTable({series, measurements, highlightedId, onSelect}: MeasurementsTableProps) {
    const [page, setPage] = useState(0)
    const [printAll, setPrintAll] = useState(false)

    const rows = useMemo(() => buildRows(measurements), [measurements])

    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount - 1)
    const firstIndex = currentPage * PAGE_SIZE
    const visibleRows = printAll ? rows : rows.slice(firstIndex, firstIndex + PAGE_SIZE)

    // The printout has to contain every row, not only the current page; flushSync renders them before printing starts.
    useEffect(() => {
        const beforePrint = () => flushSync(() => setPrintAll(true))
        const afterPrint = () => setPrintAll(false)
        window.addEventListener('beforeprint', beforePrint)
        window.addEventListener('afterprint', afterPrint)
        return () => {
            window.removeEventListener('beforeprint', beforePrint)
            window.removeEventListener('afterprint', afterPrint)
        }
    }, [])

    return (
        <section aria-labelledby="table-heading" className="space-y-3">
            <h2 id="table-heading" className="text-lg font-semibold">Tabela wyników</h2>

            <div className="rounded-xl border print:border-0">
                <Table>
                    <TableCaption className="mt-0 mb-2 caption-top px-2 pt-3 text-left">
                        Wyniki pomiarów: jeden wiersz to jeden znacznik czasu, jedna kolumna to jedna seria. Wybranie
                        wartości wyróżnia odpowiedni punkt na wykresie.
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col">Czas</TableHead>
                            {series.map((item) => (
                                <TableHead key={item.series.id} scope="col">
                                    <span className="flex items-center gap-2">
                                        <SeriesSwatch
                                            color={item.color}
                                            pointStyle={item.pointStyle}
                                            borderDash={item.borderDash}
                                        />
                                        {item.label}
                                    </span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleRows.map((row) => {
                            const isRowHighlighted = [...row.cells.values()].some((cell) =>
                                cell.some((measurement) => String(measurement.id) === highlightedId),
                            )
                            return (
                                <TableRow
                                    key={row.time}
                                    data-highlighted={isRowHighlighted || undefined}
                                    className={cn(
                                        'print:break-inside-avoid',
                                        isRowHighlighted && 'bg-muted font-semibold',
                                    )}
                                >
                                    <TableHead scope="row" className="font-normal">
                                        <time dateTime={row.iso}>{formatTimestamp(row.iso)}</time>
                                    </TableHead>
                                    {series.map((item) => {
                                        const cell = row.cells.get(String(item.series.id))
                                        return (
                                            <TableCell key={item.series.id}>
                                                {cell ? (
                                                    <span className="flex flex-wrap gap-1">
                                                        {cell.map((measurement) => {
                                                            const isPressed = String(measurement.id) === highlightedId
                                                            return (
                                                                <button
                                                                    key={measurement.id}
                                                                    type="button"
                                                                    aria-pressed={isPressed}
                                                                    aria-label={`${item.label}, ${formatTimestamp(measurement.timestamp)}: ${formatValue(measurement.value)}`}
                                                                    onClick={() => onSelect(measurement)}
                                                                    className={cn(
                                                                        'rounded-md border border-transparent px-2 py-1 tabular-nums underline decoration-dotted underline-offset-4 outline-none hover:bg-muted',
                                                                        'focus-visible:ring-3 focus-visible:ring-ring/70',
                                                                        'aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:no-underline',
                                                                        'print:border-transparent! print:bg-transparent! print:p-0 print:text-foreground! print:no-underline',
                                                                    )}
                                                                >
                                                                    {formatValue(measurement.value)}
                                                                </button>
                                                            )
                                                        })}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span aria-hidden="true">—</span>
                                                        <span className="sr-only">brak wartości</span>
                                                    </>
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <nav
                aria-label="Paginacja tabeli"
                className="flex flex-wrap items-center justify-between gap-3 print:hidden"
            >
                <p aria-live="polite" className="text-sm text-muted-foreground">
                    Wiersze {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, rows.length)} z {rows.length}
                    {' '}(strona {currentPage + 1} z {pageCount})
                </p>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={currentPage === 0}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        Poprzednia
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={currentPage >= pageCount - 1}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        Następna
                    </Button>
                </div>
            </nav>
        </section>
    )
}
