import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CarDefinition } from '../types';
import { create3DCar, Car3DInstance } from '../game/carModel';

interface CarPreview3DProps {
  carDef: CarDefinition;
  customColor?: string;
  autoRotate?: boolean;
  className?: string;
}

export const CarPreview3D: React.FC<CarPreview3DProps> = ({
  carDef,
  customColor,
  autoRotate = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const carInstanceRef = useRef<Car3DInstance | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.2, 2.2, 4.8);
    camera.lookAt(0, 0.4, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.0);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // 4. Showroom Turntable Floor
    const floorGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.2, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.1;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Glowing rim around turntable
    const ringGeo = new THREE.TorusGeometry(3.52, 0.04, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.01;
    scene.add(ringMesh);

    // 5. Spawn 3D Car
    const car = create3DCar(carDef, customColor);
    carInstanceRef.current = car;
    scene.add(car.group);

    // 6. Animation Loop
    let angle = 0;
    const animate = () => {
      if (autoRotate && carInstanceRef.current) {
        angle += 0.008;
        carInstanceRef.current.group.rotation.y = angle;
      }
      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
    };
  }, [carDef]);

  // Update color on change
  useEffect(() => {
    if (carInstanceRef.current && customColor) {
      carInstanceRef.current.setColor(customColor);
    }
  }, [customColor]);

  return <div ref={containerRef} className={`w-full h-full relative cursor-grab active:cursor-grabbing ${className}`} />;
};
