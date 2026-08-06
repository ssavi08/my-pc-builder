import { useMemo } from 'react'
import { useClonedGltf } from '../../lib/useClonedGltf'

export default function PartNode({ url, children }) {
    const scene = useClonedGltf(url)

    const nodes = useMemo(() => {
        const map = {}
        scene.traverse((o) => { if (o.name) map[o.name] = o })
        return map
    }, [scene])

    return (
        <group>
            <primitive object={scene} />
            {typeof children === 'function' ? children(nodes) : children}
        </group>
    )
}