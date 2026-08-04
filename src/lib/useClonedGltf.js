import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

export function useClonedGltf(url) {
    const { scene } = useGLTF(url)
    return useMemo(() => clone(scene), [scene])
}