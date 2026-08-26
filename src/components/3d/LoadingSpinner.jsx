import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Suspense fallback for the scene: shown while the GLTF models and the HDRI
// download. Pure three.js — no DOM, no React context — so it cannot get stuck
// on a stale loading-manager flag the way a DOM overlay can.
export default function LoadingSpinner() {
    const ref = useRef()

    useFrame((_, delta) => {
        if (!ref.current) return
        ref.current.rotation.x += delta * 0.6
        ref.current.rotation.y += delta * 0.9
    })

    return (
        <mesh ref={ref} raycast={() => null}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color="#8ec5ff" wireframe />
        </mesh>
    )
}
