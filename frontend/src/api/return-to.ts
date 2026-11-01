const RETURN_TO_KEY = 'zai.returnTo'

// Only in-app paths are accepted, so a tampered value can never send the user elsewhere
export function sanitizeReturnPath(path: unknown): string | null {
    if (typeof path !== 'string') return null
    if (!path.startsWith('/') || path.startsWith('//')) return null
    if (path === '/login' || path.startsWith('/login?')) return null
    return path
}

export function saveReturnTo(path: string): void {
    const safe = sanitizeReturnPath(path)
    if (!safe) return
    try {
        sessionStorage.setItem(RETURN_TO_KEY, safe)
    } catch {
        return
    }
}

export function peekReturnTo(): string | null {
    try {
        return sanitizeReturnPath(sessionStorage.getItem(RETURN_TO_KEY))
    } catch {
        return null
    }
}

export function clearReturnTo(): void {
    try {
        sessionStorage.removeItem(RETURN_TO_KEY)
    } catch {
        return
    }
}
