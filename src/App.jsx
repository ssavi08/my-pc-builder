import { Routes, Route } from 'react-router-dom'
import Layout from './components/ui/Layout'
import MainPage from './pages/MainPage'
import AboutPage from './pages/AboutPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthModal from './components/ui/AuthModal'
import AccountModal from './components/ui/AccountModal'
import SavedBuildsModal from './components/ui/SavedBuildsModal'
import ComponentModal from './components/ui/ComponentModal'

export default function App() {
    return (
        <>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<MainPage />} />
                </Route>
                <Route path="/about" element={<AboutPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>

            <AuthModal />
            <AccountModal />
            <SavedBuildsModal />
            <ComponentModal />
        </>
    )
}