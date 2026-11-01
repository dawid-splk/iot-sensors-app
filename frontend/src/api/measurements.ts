import {useQuery} from '@tanstack/react-query'
import {apiFetch} from './client'
import type {Measurement, MeasurementsParams} from './types'

export const measurementKeys = {
    all: ['measurements'] as const,
    list: (params: MeasurementsParams) => ['measurements', params] as const,
}

export function fetchMeasurements(params: MeasurementsParams, signal?: AbortSignal): Promise<Measurement[]> {
    return apiFetch<Measurement[]>('/measurements', {
        signal,
        query: {
            series: params.series?.join(','),
            from: params.from,
            to: params.to,
            sort: params.sort,
            limit: params.limit,
        },
    })
}

export function useMeasurements(params: MeasurementsParams = {}) {
    // An empty selection must not become "series=" (the API reads a missing parameter as "all series")
    const hasEmptySelection = params.series !== undefined && params.series.length === 0

    return useQuery({
        queryKey: measurementKeys.list(params),
        queryFn: ({signal}) => fetchMeasurements(params, signal),
        enabled: !hasEmptySelection,
    })
}
