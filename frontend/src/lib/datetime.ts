import {format, subDays, subHours} from 'date-fns'

const INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm"

export function toDatetimeLocalValue(date: Date): string {
    return format(date, INPUT_FORMAT)
}

export function hoursAgoInput(hours: number): string {
    return toDatetimeLocalValue(subHours(new Date(), hours))
}

export function daysAgoInput(days: number): string {
    return toDatetimeLocalValue(subDays(new Date(), days))
}

// An empty field means "no bound"; datetime-local values are interpreted in the browser's time zone.
export function datetimeLocalToIso(value: string): string | undefined {
    if (!value) return undefined
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function isRangeInverted(from: string, to: string): boolean {
    const fromIso = datetimeLocalToIso(from)
    const toIso = datetimeLocalToIso(to)
    return fromIso !== undefined && toIso !== undefined && fromIso > toIso
}

export function formatTimestamp(iso: string): string {
    return format(new Date(iso), 'dd.MM.yyyy HH:mm:ss')
}

const valueFormatter = new Intl.NumberFormat('pl-PL', {maximumFractionDigits: 4})

export function formatValue(value: number): string {
    return valueFormatter.format(value)
}
