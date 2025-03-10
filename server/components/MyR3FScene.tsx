// components/MyR3FScene.tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshProps } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function RotatingBox(props: MeshProps) {
  // useFrame to hook R3F do animacji w każdej klatce
  const ref = React.useRef<THREE.Mesh>(null!);

  // Ten hook jest dostępny, gdy importujemy: import { useFrame } from '@react-three/fiber';
  // Przykład:
  // useFrame((state, delta) => {
  //   ref.current.rotation.x += delta;
  //   ref.current.rotation.y += delta;
  // });

  return (
    <mesh ref={ref} {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

const MyR3FScene: React.FC = () => {
  return (
    <Canvas
      style={{ width: '100%', height: '600px' }}
      camera={{ position: [0, 0, 5], fov: 75 }}
    >
      {/* Oświetlenie */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Kostka */}
      <RotatingBox position={[0, 0, 0]} />

      {/* Kontroler kamery myszką */}
      <OrbitControls />
    </Canvas>
  );
};

export default MyR3FScene;
