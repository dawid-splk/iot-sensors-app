import {useCallback} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {apiFetch} from './client'
import type {Id, Sensor, SensorCreated, SensorInput} from './types'

export const sensorKeys = {
    all: ['sensors'] as const,
}

export function useSensors() {
    return useQuery({
        queryKey: sensorKeys.all,
        queryFn: ({signal}) => apiFetch<Sensor[]>('/sensors', {signal}),
    })
}

// Deliberately not useMutation: its result (including the one-time apiKey) would be kept in TanStack's mutation cache.
export function useRegisterSensor() {
    const queryClient = useQueryClient()

    return useCallback(
        async (input: SensorInput): Promise<SensorCreated> => {
            const created = await apiFetch<SensorCreated>('/sensors', {method: 'POST', body: input})
            await queryClient.invalidateQueries({queryKey: sensorKeys.all})
            return created
        },
        [queryClient],
    )
}

export function useDeleteSensor() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: Id) => apiFetch<void>(`/sensors/${id}`, {method: 'DELETE'}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: sensorKeys.all}),
    })
}
