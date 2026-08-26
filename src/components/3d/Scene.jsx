import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { MM } from '../../lib/constants'
import ComputerAssembly from './ComputerAssembly';
import LoadingSpinner from './LoadingSpinner';
import { useSceneBuild } from '../../lib/useSceneBuild'

export default function Scene() {

  const { componentIds, fanCount } = useSceneBuild()

  return (
    <Canvas camera={{ position: [-0.5, 0, 0.5], fov: 45}} style={{width: '100%', height: '100%'}}>

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, 3, -5]} intensity={0.6} />

      <Suspense fallback={<LoadingSpinner />}>
        <Environment files="/hdri/studio_small_03_1k.hdr" />
        <Center>
          <ComputerAssembly
            scale={MM}
            componentIds={componentIds}
            fanCount={fanCount}
          />
        </Center>
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={0.35}
        maxDistance={1.5}
      />

      {/* <axesHelper args={[5]} /> */}
    </Canvas>
  )
}
