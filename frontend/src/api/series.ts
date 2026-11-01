import {useQuery} from '@tanstack/react-query'
import {apiFetch} from './client'
import type {Series} from './types'

export const seriesKeys = {
    all: ['series'] as const,
}

export function fetchSeries(signal?: AbortSignal): Promise<Series[]> {
    return apiFetch<Series[]>('/series', {signal})
}

export function useSeries() {
    return useQuery({
        queryKey: seriesKeys.all,
        queryFn: ({signal}) => fetchSeries(signal),
    })
}
