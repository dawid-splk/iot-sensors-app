import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {apiFetch} from './client'
import {measurementKeys} from './measurements'
import {sensorKeys} from './sensors'
import type {Id, Series, SeriesInput} from './types'

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

export function useCreateSeries() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: SeriesInput) => apiFetch<Series>('/series', {method: 'POST', body: input}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: seriesKeys.all}),
    })
}

export function useUpdateSeries() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({id, input}: { id: Id; input: SeriesInput }) =>
            apiFetch<Series>(`/series/${id}`, {method: 'PUT', body: input}),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({queryKey: seriesKeys.all}),
                queryClient.invalidateQueries({queryKey: measurementKeys.all}),
            ]),
    })
}

// Deleting a series also removes its sensors and measurements on the server.
export function useDeleteSeries() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: Id) => apiFetch<void>(`/series/${id}`, {method: 'DELETE'}),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({queryKey: seriesKeys.all}),
                queryClient.invalidateQueries({queryKey: sensorKeys.all}),
                queryClient.invalidateQueries({queryKey: measurementKeys.all}),
            ]),
    })
}
