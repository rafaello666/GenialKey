"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// components/MyR3FScene.tsx
const react_1 = __importDefault(require("react"));
const fiber_1 = require("@react-three/fiber");
const drei_1 = require("@react-three/drei");
function RotatingBox(props) {
    // useFrame to hook R3F do animacji w każdej klatce
    const ref = react_1.default.useRef(null);
    // Ten hook jest dostępny, gdy importujemy: import { useFrame } from '@react-three/fiber';
    // Przykład:
    // useFrame((state, delta) => {
    //   ref.current.rotation.x += delta;
    //   ref.current.rotation.y += delta;
    // });
    return (<mesh ref={ref} {...props}>
      <boxGeometry args={[1, 1, 1]}/>
      <meshStandardMaterial color="orange"/>
    </mesh>);
}
const MyR3FScene = () => {
    return (<fiber_1.Canvas style={{ width: '100%', height: '600px' }} camera={{ position: [0, 0, 5], fov: 75 }}>
      {/* Oświetlenie */}
      <ambientLight intensity={0.5}/>
      <pointLight position={[10, 10, 10]}/>

      {/* Kostka */}
      <RotatingBox position={[0, 0, 0]}/>

      {/* Kontroler kamery myszką */}
      <drei_1.OrbitControls />
    </fiber_1.Canvas>);
};
exports.default = MyR3FScene;
