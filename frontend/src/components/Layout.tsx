import {type MouseEvent, useState} from 'react'
import {Link, NavLink, Outlet, useNavigate} from 'react-router-dom'
import {LogInIcon, LogOutIcon} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Toaster} from '@/components/ui/sonner'
import {useAuth} from '@/auth/auth-context'
import {cn} from '@/lib/utils'

const focusRing =
    'outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function navLinkClass({isActive}: { isActive: boolean }) {
    return cn(
        'rounded-md px-3 py-1.5 text-sm hover:bg-muted',
        focusRing,
        isActive ? 'font-semibold underline underline-offset-4' : 'font-medium',
    )
}

export function Layout() {
    const {isLoggedIn, logout} = useAuth()
    const navigate = useNavigate()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // A plain "#main-content" href would be read by HashRouter as a route change
    function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
    }

    async function handleLogout() {
        setIsLoggingOut(true)
        const pending = logout()
        // Leave the admin area first, otherwise ProtectedRoute would send the user to the login page
        navigate('/')
        await pending
        setIsLoggingOut(false)
        toast.success('Wylogowano')
    }

    return (
        <div className="flex min-h-screen flex-col">
            <a
                href="#main-content"
                onClick={skipToContent}
                className={cn(
                    'sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50',
                    'focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium',
                    'print:hidden',
                    focusRing,
                )}
            >
                Przejdź do treści
            </a>

            <header className="border-b print:hidden">
                <div
                    className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
                    <p className="text-lg font-semibold">ZAI</p>

                    <nav aria-label="Główna nawigacja" className="print:hidden">
                        <ul className="flex flex-wrap items-center gap-1">
                            <li>
                                <NavLink to="/" end className={navLinkClass}>Pulpit</NavLink>
                            </li>
                            {isLoggedIn && (
                                <>
                                    <li>
                                        <NavLink to="/admin/series" className={navLinkClass}>Serie</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/sensors" className={navLinkClass}>Czujniki</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/account" className={navLinkClass}>Konto</NavLink>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {isLoggedIn ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={cn('print:hidden', focusRing)}
                        >
                            <LogOutIcon data-icon="inline-start"/>
                            Wyloguj
                        </Button>
                    ) : (
                        <Button asChild variant="outline" className={cn('print:hidden', focusRing)}>
                            <Link to="/login">
                                <LogInIcon data-icon="inline-start"/>
                                Zaloguj
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            <main
                id="main-content"
                tabIndex={-1}
                className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6"
            >
                <Outlet/>
            </main>

            <Toaster/>
        </div>
    )
}
