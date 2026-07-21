import { useGLTF } from '@react-three/drei'
import { supabase } from '../../lib/supabaseClient'
import { Box3, Vector3 } from 'three'

const { data } = supabase
    .storage
    .from('models')
    // .getPublicUrl('complete build/default_pc.glb')
    .getPublicUrl('case/micro_atx_case.glb')

const MODEL_URL = data.publicUrl
useGLTF.preload(MODEL_URL)

export default function DefaultBuild(props) {
    const { scene } = useGLTF(MODEL_URL)

    const { nodes } = useGLTF(MODEL_URL)
    console.log(Object.keys(nodes).filter((n) => n.startsWith('ANCHOR_')))
    console.log(nodes['ANCHOR_psu'].position)
    
    // TEMP: measure the model's bounding box
    const box = new Box3().setFromObject(scene)
    const size = new Vector3()
    box.getSize(size)
    console.log('Model size (x, y, z in Three.js units):', size.x, size.y, size.z)

    return <primitive object={scene} {...props} />
}