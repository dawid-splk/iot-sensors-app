import type {Series} from '@/api/types'

// Names match Chart.js `pointStyle` values, so the admin form can store them directly in `icon`.
export const SERIES_ICONS = ['circle', 'triangle', 'rect', 'rectRot', 'cross', 'crossRot', 'star'] as const

export type SeriesIcon = (typeof SERIES_ICONS)[number]

export const SERIES_ICON_LABELS: Record<SeriesIcon, string> = {
    circle: 'Koło',
    triangle: 'Trójkąt',
    rect: 'Kwadrat',
    rectRot: 'Romb',
    cross: 'Plus',
    crossRot: 'Krzyżyk',
    star: 'Gwiazda',
}

export const SERIES_DASH_PATTERNS: readonly (readonly number[])[] = [
    [],
    [6, 4],
    [2, 3],
    [10, 3, 2, 3],
]

export interface StyledSeries {
    series: Series
    color: string
    pointStyle: SeriesIcon
    borderDash: number[]
    label: string
}

export function isSeriesIcon(value: unknown): value is SeriesIcon {
    return typeof value === 'string' && (SERIES_ICONS as readonly string[]).includes(value)
}

export function getSeriesPointStyle(icon: string | null | undefined, index: number): SeriesIcon {
    if (isSeriesIcon(icon)) return icon
    return SERIES_ICONS[index % SERIES_ICONS.length]
}

export function getSeriesDash(index: number): number[] {
    return [...SERIES_DASH_PATTERNS[index % SERIES_DASH_PATTERNS.length]]
}

export function formatSeriesLabel(series: Pick<Series, 'name' | 'unit'>): string {
    return series.unit ? `${series.name} (${series.unit})` : series.name
}

export function styleSeries(series: Series, index: number): StyledSeries {
    return {
        series,
        color: series.color,
        pointStyle: getSeriesPointStyle(series.icon, index),
        borderDash: getSeriesDash(index),
        label: formatSeriesLabel(series),
    }
}
