import {apiFetch} from './client'
import type {LoginRequest, LoginResponse, PasswordChange} from './types'

export function loginRequest(credentials: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: credentials,
        skipUnauthorizedHandling: true,
    })
}

export function logoutRequest(): Promise<void> {
    return apiFetch<void>('/auth/logout', {
        method: 'POST',
        skipUnauthorizedHandling: true,
    })
}

export function changePasswordRequest(body: PasswordChange): Promise<void> {
    return apiFetch<void>('/auth/password', {method: 'PUT', body})
}
