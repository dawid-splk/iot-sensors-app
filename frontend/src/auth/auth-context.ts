import {createContext, useContext} from 'react'
import type {LoginRequest} from '@/api/types'

export interface AuthContextValue {
    isLoggedIn: boolean
    login: (credentials: LoginRequest) => Promise<void>
    /** Never rejects: the local token is removed even when the server request fails */
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth musi być użyty wewnątrz AuthProvider')
    return context
}
