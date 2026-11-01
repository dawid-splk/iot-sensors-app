import {HashRouter, Navigate, Route, Routes} from 'react-router-dom'
import {ProtectedRoute} from '@/auth/ProtectedRoute'
import {Layout} from '@/components/Layout'
import {AdminAccountPage} from '@/pages/AdminAccountPage'
import {AdminSensorsPage} from '@/pages/AdminSensorsPage'
import {AdminSeriesPage} from '@/pages/AdminSeriesPage'
import {DashboardPage} from '@/pages/DashboardPage'
import {LoginPage} from '@/pages/LoginPage'
import {NotFoundPage} from '@/pages/NotFoundPage'

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout/>}>
                    <Route index element={<DashboardPage/>}/>
                    <Route path="login" element={<LoginPage/>}/>
                    <Route path="admin" element={<ProtectedRoute/>}>
                        <Route index element={<Navigate to="series" replace/>}/>
                        <Route path="series" element={<AdminSeriesPage/>}/>
                        <Route path="sensors" element={<AdminSensorsPage/>}/>
                        <Route path="account" element={<AdminAccountPage/>}/>
                    </Route>
                    <Route path="*" element={<NotFoundPage/>}/>
                </Route>
            </Routes>
        </HashRouter>
    )
}

export default App
