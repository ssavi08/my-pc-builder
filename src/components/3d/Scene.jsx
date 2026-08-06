import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import DefaultBuild from './DefaultBuild';
import { MM } from '../../lib/constants'
import ComputerAssembly from './ComputerAssembly';
import { useBuildStore } from '../../store/useBuildStore'

export default function Scene() {

  const componentIds = useBuildStore((s) => s.componentIds)
  console.log('Scene componentIds:', componentIds)
  
  return (
    <Canvas camera={{ position: [-0.5, 0, 0.5], fov: 45}} style={{width: '100%', height: '100%'}}>

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, 3, -5]} intensity={0.6} />

      <Suspense fallback={null}>
        <Environment preset='city' />
        <Center> 
          {componentIds ? <ComputerAssembly scale={MM} /> : <DefaultBuild scale={MM} />}
        </Center>
      </Suspense>

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true}
        minDistance={0.5} maxDistance={1}
      />

      {/* <axesHelper arg={[5]} /> */}
    </Canvas>
  )
}