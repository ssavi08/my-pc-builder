import { useGLTF } from '@react-three/drei'
import { useClonedGltf } from '../../lib/useClonedGltf'

export default function PartNode({ url, children }) {
    const scene = useClonedGltf(url)
    const { nodes } = useGLTF(url)   // anchors from the original — see below

    return (
        <group>
            <primitive object={scene} />
            {typeof children === 'function' ? children(nodes) : children}
        </group>
    )
}