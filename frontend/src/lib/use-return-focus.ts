import {useCallback, useRef} from 'react'

/**
 * Radix only returns focus to a <Trigger>. Dialogs are opened from table rows,
 * so the opener is remembered here and focused again when the dialog closes.
 */
export function useReturnFocus() {
    const openerRef = useRef<HTMLElement | null>(null)

    const capture = useCallback(() => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }, [])

    const restore = useCallback((event: Event) => {
        event.preventDefault()
        const opener = openerRef.current
        // After deleting a row its button is gone, so fall back to the page heading.
        const target = opener?.isConnected ? opener : document.getElementById('page-title')
        target?.focus()
    }, [])

    return {capture, restore}
}
