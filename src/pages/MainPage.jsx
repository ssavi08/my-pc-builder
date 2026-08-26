import { Loader as SceneLoader } from '@react-three/drei'
import Scene from '../components/3d/Scene'
import PanelToggle from '../components/ui/PanelToggle'

export default function MainPage() {
    return (
        <div style={{ height: '100%', position: 'relative' }}>
            <Scene />
            <PanelToggle />
            <SceneLoader />
        </div>
    )
}