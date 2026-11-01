import {saveReturnTo} from './return-to'
import {clearToken, getToken} from './token'
import type {Problem, ProblemFieldError} from './types'

const API_PREFIX = '/api'

const NETWORK_ERROR_MESSAGE =
    'Brak połączenia z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie.'

export class ApiError extends Error {
    readonly status: number
    readonly title?: string
    readonly detail?: string
    readonly errors: ProblemFieldError[]

    constructor(status: number, message: string, problem?: Partial<Problem>, options?: ErrorOptions) {
        super(message, options)
        this.name = 'ApiError'
        this.status = status
        this.title = problem?.title
        this.detail = problem?.detail
        this.errors = problem?.errors ?? []
    }
}

export class NetworkError extends Error {
    constructor(options?: ErrorOptions) {
        super(NETWORK_ERROR_MESSAGE, options)
        this.name = 'NetworkError'
    }
}

export function isClientError(error: unknown): error is ApiError {
    return error instanceof ApiError && error.status >= 400 && error.status < 500
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError || error instanceof NetworkError) return error.message
    return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'
}

type QueryValue = string | number | undefined

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    query?: Record<string, QueryValue>
    signal?: AbortSignal
    /** For login and logout, where a 401 is an expected answer rather than an expired session. */
    skipUnauthorizedHandling?: boolean
}

function fallbackMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Nieprawidłowe dane żądania.'
        case 401:
            return 'Brak autoryzacji. Zaloguj się ponownie.'
        case 403:
            return 'Brak uprawnień do wykonania tej operacji.'
        case 404:
            return 'Nie znaleziono żądanego zasobu.'
        case 406:
            return 'Serwer nie obsługuje żądanego formatu odpowiedzi.'
        case 409:
            return 'Operacja jest sprzeczna z bieżącym stanem danych.'
        case 415:
            return 'Nieobsługiwany format danych żądania.'
        case 422:
            return 'Dane nie spełniają reguł walidacji.'
        default:
            return status >= 500
                ? 'Błąd serwera. Spróbuj ponownie później.'
                : `Nieoczekiwany błąd (HTTP ${status}).`
    }
}

async function readProblem(response: Response): Promise<Partial<Problem> | undefined> {
    const contentType = response.headers.get('Content-Type') ?? ''
    if (!contentType.includes('json')) return undefined

    try {
        const data: unknown = await response.json()
        if (typeof data !== 'object' || data === null) return undefined
        const raw = data as Record<string, unknown>
        const errors = Array.isArray(raw.errors)
            ? raw.errors.filter(
                (item): item is ProblemFieldError =>
                    typeof item === 'object' &&
                    item !== null &&
                    typeof (item as ProblemFieldError).field === 'string' &&
                    typeof (item as ProblemFieldError).message === 'string',
            )
            : undefined

        return {
            title: typeof raw.title === 'string' ? raw.title : undefined,
            detail: typeof raw.detail === 'string' ? raw.detail : undefined,
            errors,
        }
    } catch {
        return undefined
    }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== '') params.set(key, String(value))
    }
    const search = params.toString()
    return `${API_PREFIX}${path}${search ? `?${search}` : ''}`
}

function handleUnauthorized(): void {
    const currentPath = window.location.hash.replace(/^#/, '') || '/'
    const onLoginPage = currentPath.startsWith('/login')

    if (!onLoginPage) saveReturnTo(currentPath)
    clearToken()
    if (!onLoginPage) window.location.hash = '#/login'
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {method = 'GET', body, query, signal, skipUnauthorizedHandling = false} = options

    const headers = new Headers({Accept: 'application/json, application/problem+json'})
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (body !== undefined) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
        response = await fetch(buildUrl(path, query), {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new NetworkError({cause: error})
    }

    if (!response.ok) {
        const problem = await readProblem(response)
        const message = problem?.detail || problem?.title || fallbackMessage(response.status)

        if (response.status === 401 && !skipUnauthorizedHandling) handleUnauthorized()

        throw new ApiError(response.status, message, problem)
    }

    if (response.status === 204) return undefined as T

    try {
        return (await response.json()) as T
    } catch (error) {
        throw new ApiError(response.status, 'Serwer zwrócił nieprawidłową odpowiedź.', undefined, {cause: error})
    }
}
