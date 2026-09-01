import { Routes, Route } from 'react-router-dom'
import Layout from './components/ui/Layout'
import MainPage from './pages/MainPage'
import AboutPage from './pages/AboutPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AuthModal from './components/ui/AuthModal'
import AccountModal from './components/ui/AccountModal'
import BuildListModal from './components/ui/BuildListModal'
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
            <ComponentModal />

            <BuildListModal
                modalName="saved-builds"
                title="Spremljene konfiguracije"
                autoSaved={false}
                emptyText="Još nemate spremljenih konfiguracija."
                emptyHint="Generirajte konfiguraciju, zatim u bočnoj traci odaberite Spremi konfiguraciju."
            />
            <BuildListModal
                modalName="history"
                title="Nedavne konfiguracije"
                autoSaved={true}
                emptyText="Nema nedavnih konfiguracija."
                emptyHint="Svaka generirana konfiguracija automatski se pohranjuje ovdje."
            />
        </>
    )
}