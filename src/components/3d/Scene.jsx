import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { MM, DEFAULT_BUILD_IDS, DEFAULT_FAN_COUNT } from '../../lib/constants'
import ComputerAssembly from './ComputerAssembly';
import { useBuildStore } from '../../store/useBuildStore'

export default function Scene() {

  const componentIds = useBuildStore((s) => s.componentIds)

  return (
    <Canvas camera={{ position: [-0.5, 0, 0.5], fov: 45}} style={{width: '100%', height: '100%'}}>

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, 3, -5]} intensity={0.6} />

      <Suspense fallback={null}>
        <Environment files="/hdri/studio_small_03_1k.hdr" />
        <Center> 
                    {componentIds ? (
              <ComputerAssembly scale={MM} />
          ) : (
              <ComputerAssembly
                  scale={MM}
                  componentIds={DEFAULT_BUILD_IDS}
                  fanCount={DEFAULT_FAN_COUNT}
              />
          )}
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