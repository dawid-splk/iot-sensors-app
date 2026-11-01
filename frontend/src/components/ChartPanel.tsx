import {useEffect, useMemo, useRef} from 'react'
import {
    Chart as ChartJS,
    type ChartData,
    type ChartOptions,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    TimeScale,
    Tooltip,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import {pl} from 'date-fns/locale/pl'
import {Line} from 'react-chartjs-2'
import type {Measurement} from '@/api/types'
import type {StyledSeries} from '@/lib/series-style'

ChartJS.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend)

interface ChartPanelProps {
    series: StyledSeries[]
    measurements: Measurement[]
    highlightedId: string | null
}

interface PointPosition {
    datasetIndex: number
    index: number
}

const NO_UNIT_AXIS_TITLE = 'Wartość'

function buildChart(series: StyledSeries[], measurements: Measurement[]) {
    const units: string[] = []
    for (const item of series) {
        const unit = item.series.unit ?? ''
        if (!units.includes(unit)) units.push(unit)
    }

    const bySeries = new Map<string, Measurement[]>()
    for (const measurement of measurements) {
        const key = String(measurement.seriesId)
        const list = bySeries.get(key)
        if (list) list.push(measurement)
        else bySeries.set(key, [measurement])
    }

    const positions = new Map<string, PointPosition>()

    const datasets: ChartData<'line'>['datasets'] = series.map((item, datasetIndex) => {
        const points = bySeries.get(String(item.series.id)) ?? []
        points.forEach((measurement, index) => {
            positions.set(String(measurement.id), {datasetIndex, index})
        })

        return {
            label: item.label,
            data: points.map((measurement) => ({x: Date.parse(measurement.timestamp), y: measurement.value})),
            yAxisID: `y${units.indexOf(item.series.unit ?? '')}`,
            borderColor: item.color,
            backgroundColor: item.color,
            borderDash: item.borderDash,
            borderWidth: 2,
            pointStyle: item.pointStyle,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            tension: 0,
        }
    })

    return {datasets, units, positions}
}

function buildOptions(units: string[]): ChartOptions<'line'> {
    const scales: NonNullable<ChartOptions<'line'>['scales']> = {
        x: {
            type: 'time',
            adapters: {date: {locale: pl}},
            time: {
                tooltipFormat: 'dd.MM.yyyy HH:mm:ss',
                displayFormats: {
                    minute: 'HH:mm',
                    hour: 'dd.MM HH:mm',
                    day: 'dd.MM',
                    month: 'MM.yyyy',
                },
            },
            title: {display: true, text: 'Czas'},
        },
    }

    units.forEach((unit, index) => {
        scales[`y${index}`] = {
            type: 'linear',
            position: index === 0 ? 'left' : 'right',
            title: {display: true, text: unit || NO_UNIT_AXIS_TITLE},
            grid: {drawOnChartArea: index === 0},
        }
    })

    return {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: false,
        interaction: {mode: 'nearest', intersect: true},
        scales,
        plugins: {
            legend: {position: 'bottom', labels: {usePointStyle: true}},
        },
    }
}

export function ChartPanel({series, measurements, highlightedId}: ChartPanelProps) {
    const chartRef = useRef<ChartJS<'line'> | null>(null)

    const {datasets, units, positions} = useMemo(
        () => buildChart(series, measurements),
        [series, measurements],
    )
    const data = useMemo<ChartData<'line'>>(() => ({datasets}), [datasets])
    const options = useMemo(() => buildOptions(units), [units])

    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return

        const position = highlightedId ? positions.get(highlightedId) : undefined
        const element = position ? chart.getDatasetMeta(position.datasetIndex).data[position.index] : undefined

        if (!position || !element) {
            chart.setActiveElements([])
            chart.tooltip?.setActiveElements([], {x: 0, y: 0})
        } else {
            chart.setActiveElements([position])
            chart.tooltip?.setActiveElements([position], {x: element.x, y: element.y})
        }
        chart.update()
    }, [highlightedId, positions, data, options])

    useEffect(() => {
        const resize = () => chartRef.current?.resize()
        const printQuery = window.matchMedia('print')

        window.addEventListener('beforeprint', resize)
        window.addEventListener('afterprint', resize)
        printQuery.addEventListener('change', resize)
        return () => {
            window.removeEventListener('beforeprint', resize)
            window.removeEventListener('afterprint', resize)
            printQuery.removeEventListener('change', resize)
        }
    }, [])

    const seriesNames = series.map((item) => item.label).join(', ')

    return (
        <figure
            aria-label="Wykres wartości pomiarów w czasie"
            className="rounded-xl border p-4 print:break-inside-avoid print:border-0 print:p-0"
        >
            <div className="relative h-[360px] w-full sm:h-[420px] print:h-[320px]">
                <Line ref={chartRef} data={data} options={options} aria-hidden="true"/>
            </div>
            <figcaption className="mt-3 text-sm text-muted-foreground">
                Wykres wartości w czasie dla serii: {seriesNames}. Te same dane znajdują się w tabeli poniżej.
            </figcaption>
        </figure>
    )
}
