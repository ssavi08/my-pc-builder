import Scene from '../components/3d/Scene'
import PanelToggle from '../components/ui/PanelToggle'
import { useBuildStore } from '../store/useBuildStore'

export default function MainPage() {
    const componentIds = useBuildStore((s) => s.componentIds)

    return (
        <div style={{ height: '100%', position: 'relative' }}>
            <Scene />
            {componentIds && <PanelToggle />}
        </div>
    )
}