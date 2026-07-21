import { useGLTF } from "@react-three/drei";
import { supabase } from "../../lib/supabaseClient";

const url = (path) => supabase.storage.from('models').getPublicUrl(path).data.publicUrl

const CASE_URL = url('case/micro_atx_case.glb')
const MOTHERBOARD_URL = url('motherboard/micro_atx.glb')

useGLTF.preload(CASE_URL)
useGLTF.preload(MOTHERBOARD_URL)

export default function ComputerAssembly(props) {
    const pcCase = useGLTF(CASE_URL)
    const motherboard = useGLTF(MOTHERBOARD_URL)

    const mbAnchor = pcCase.nodes['ANCHOR_motherboard']

    return (
        <group {...props}>
            <primitive object={pcCase.scene} />
            <group position={mbAnchor.position} rotation={mbAnchor.rotation}>
                <primitive object={motherboard.scene} />
            </group>
        </group>
    )
}