import { memo, useMemo, useRef, useState } from 'react'
import { useCursor } from '@react-three/drei'
import { useClonedGltf } from '../../lib/useClonedGltf'
import { useUIStore } from '../../store/useUIStore'

const DRAG_THRESHOLD = 5   // pixels of movement still counted as a click

function PartNode({ url, componentId, children }) {
    const scene = useClonedGltf(url)
    const selectComponent = useUIStore((s) => s.selectComponent)
    const [hovered, setHovered] = useState(false)
    const downPos = useRef(null)

    useCursor(hovered && !!componentId)

    const nodes = useMemo(() => {
        const map = {}
        scene.traverse((o) => { if (o.name) map[o.name] = o })
        return map
    }, [scene])

    return (
        <group
            onPointerDown={(e) => {
                downPos.current = { x: e.clientX, y: e.clientY }
            }}
            onClick={(e) => {
                if (!componentId) return

                const down = downPos.current
                downPos.current = null
                if (!down) return

                const dx = e.clientX - down.x
                const dy = e.clientY - down.y
                if (Math.hypot(dx, dy) > DRAG_THRESHOLD) return   // it was a drag

                e.stopPropagation()
                selectComponent(componentId)
            }}
            onPointerOver={(e) => {
                if (!componentId) return
                e.stopPropagation()
                setHovered(true)
            }}
            onPointerOut={() => setHovered(false)}
        >
            <primitive object={scene} />
            {typeof children === 'function' ? children(nodes) : children}
        </group>
    )
}

export default memo(PartNode)