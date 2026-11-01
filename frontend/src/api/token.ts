const TOKEN_KEY = 'zai.token'

const listeners = new Set<() => void>()

function notify() {
    listeners.forEach((listener) => listener())
}

// sessionStorage can throw (e.g. blocked storage), so the app degrades to "logged out" instead of crashing
export function getToken(): string | null {
    try {
        return sessionStorage.getItem(TOKEN_KEY)
    } catch {
        return null
    }
}

export function setToken(token: string): void {
    try {
        sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
        return
    }
    notify()
}

export function clearToken(): void {
    try {
        sessionStorage.removeItem(TOKEN_KEY)
    } catch {
        return
    }
    notify()
}

// Lets React follow token changes made outside components (e.g. a 401 handled in the API client).
export function subscribeToken(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
