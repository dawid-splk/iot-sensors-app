import {QueryClient} from '@tanstack/react-query'
import {isClientError} from '@/api/client'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Retrying a 4xx would only repeat the same rejected request
            retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_RETRIES,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
})
