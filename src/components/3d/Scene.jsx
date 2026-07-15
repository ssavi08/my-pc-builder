import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import DefaultBuild from './DefaultBuild';
import { MM } from '../../lib/constants'

export default function Scene() {
  return (
    <Canvas camera={{ position: [0.3, 0.2, 0.5], fov: 45}} style={{width: '100%', height: '98vh'}}>

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, 3, -5]} intensity={0.6} />

      <Suspense fallback={null}>
        <Environment preset='city' />
        <Center> 
          <DefaultBuild scale={MM}/>
        </Center>
      </Suspense>

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true}
        minDistance={0.5} maxDistance={1}
      />

    </Canvas>
  )
}