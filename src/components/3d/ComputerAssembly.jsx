// src/components/ComputerAssembly.jsx
import { useEffect, useState } from "react"
import { fetchModel } from "../../lib/fetchModel"
import { useGLTF } from "@react-three/drei"
import { SkeletonUtils } from 'three-stdlib'

export default function ComputerAssembly() {
    const [model, setModel] = useState(null)

    useEffect(() => {
        async function loadModel() {
            const result = await fetchModel('complete-build')
            setModel(result)   // ✅ save into state, triggers a re-render
        }
        loadModel()
    }, [])   // ✅ empty dependency array = run once on mount

    if (!model) return null   // ✅ safe here — this return happens BEFORE any hook call in this component

    return <ComponentModel url={model.model_url} />
}

function ComponentModel({ url }) {
    const { scene } = useGLTF(url)   // ✅ only ever called with a real, defined url
    const clone = SkeletonUtils.clone(scene)

    return <primitive object={clone} />   // ✅ must wrap raw Three.js objects in <primitive>, can't return them bare
}