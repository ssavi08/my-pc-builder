import { useGLTF } from '@react-three/drei'
import { useClonedGltf } from '../../lib/useClonedGltf'
import { supabase } from '../../lib/supabaseClient'

const { data } = supabase.storage
    .from('models')
    .getPublicUrl('complete build/default_pc.glb')

const MODEL_URL = data.publicUrl
useGLTF.preload(MODEL_URL)

export default function DefaultBuild(props) {
    const scene = useClonedGltf(MODEL_URL)
    return <primitive object={scene} {...props} />
}