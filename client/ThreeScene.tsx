// components/ThreeScene.tsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '500px', background: '#ccc' }}
    />
  );
};

export default ThreeScene;
