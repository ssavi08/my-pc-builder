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
                title="Saved builds"
                autoSaved={false}
                emptyText="No saved builds yet."
                emptyHint="Generate a build, then use Save build in the sidebar."
            />
            <BuildListModal
                modalName="history"
                title="Recent builds"
                autoSaved={true}
                emptyText="No recent builds."
                emptyHint="Every build you generate is kept here automatically."
            />
        </>
    )
}