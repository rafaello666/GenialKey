"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// components/ThreeScene.tsx
const react_1 = __importStar(require("react"));
const THREE = __importStar(require("three"));
const ThreeScene = () => {
    const mountRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const mount = mountRef.current;
        if (!mount)
            return;
        // Rozmiar renderowania
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        // Scena
        const scene = new THREE.Scene();
        // Kamera (FOV, aspect, near, far)
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;
        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);
        // Prosty box
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        // Pętla animacji
        const animate = () => {
            requestAnimationFrame(animate);
            // Obracamy kostkę
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            // Render sceny
            renderer.render(scene, camera);
        };
        animate();
        // Obsługa resize
        const handleResize = () => {
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);
        // Sprzątanie przy odmontowaniu
        return () => {
            window.removeEventListener('resize', handleResize);
            mount.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);
    return (<div ref={mountRef} style={{ width: '100%', height: '500px', background: '#ccc' }}/>);
};
exports.default = ThreeScene;
