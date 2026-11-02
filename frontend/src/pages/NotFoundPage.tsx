import {Link} from 'react-router-dom'

export function NotFoundPage() {
    return (
        <section>
            <title>Nie znaleziono strony</title>
            <h1 className="text-2xl font-semibold">Nie znaleziono strony</h1>
            <p className="mt-2 text-muted-foreground">Strona, której szukasz, nie istnieje.</p>
            <p className="mt-4 print:hidden">
                <Link
                    to="/"
                    className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/70"
                >
                    Wróć na pulpit
                </Link>
            </p>
        </section>
    )
}
