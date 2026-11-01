import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useAuth} from './auth-context'

export function ProtectedRoute() {
    const {isLoggedIn} = useAuth()
    const location = useLocation()

    if (!isLoggedIn) {
        return <Navigate to="/login" replace state={{from: `${location.pathname}${location.search}`}}/>
    }

    return <Outlet/>
}
