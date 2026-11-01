import {type ReactNode, useCallback, useMemo, useSyncExternalStore} from 'react'
import {loginRequest, logoutRequest} from '@/api/auth'
import {clearReturnTo} from '@/api/return-to'
import {clearToken, getToken, setToken, subscribeToken} from '@/api/token'
import type {LoginRequest} from '@/api/types'
import {AuthContext, type AuthContextValue} from './auth-context'

export function AuthProvider({children}: { children: ReactNode }) {
    const token = useSyncExternalStore(subscribeToken, getToken)

    const login = useCallback(async (credentials: LoginRequest) => {
        const response = await loginRequest(credentials)
        setToken(response.accessToken)
    }, [])

    const logout = useCallback(async () => {
        try {
            await logoutRequest()
        } catch {
            // The server-side token expires on its own; the local session must end regardless
        } finally {
            clearToken()
            clearReturnTo()
        }
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({isLoggedIn: token !== null, login, logout}),
        [token, login, logout],
    )

    return <AuthContext value={value}>{children}</AuthContext>
}
