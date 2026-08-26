import Scene from '../components/3d/Scene'
import PanelToggle from '../components/ui/PanelToggle'
import SceneStatus from '../components/ui/SceneStatus'

export default function MainPage() {
    return (
        <div style={{ height: '100%', position: 'relative' }}>
            <Scene />
            <PanelToggle />
            <SceneStatus />
        </div>
    )
}
