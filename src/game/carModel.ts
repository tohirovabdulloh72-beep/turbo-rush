import * as THREE from 'three';
import { CarDefinition } from '../types';

export interface Car3DInstance {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterial: THREE.MeshStandardMaterial;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  brakeLightMaterial: THREE.MeshStandardMaterial;
  exhaustLeft: THREE.Vector3;
  exhaustRight: THREE.Vector3;
  underglowLight?: THREE.PointLight;
  setColor: (hexColor: string) => void;
  updateWheels: (speed: number, steerAngle: number) => void;
  setBraking: (isBraking: boolean) => void;
}

export function create3DCar(carDef: CarDefinition, customColor?: string): Car3DInstance {
  const group = new THREE.Group();
  const carColor = customColor || carDef.color;

  // Body Paint Material (Glossy car lacquer)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(carColor),
    metalness: 0.85,
    roughness: 0.18,
  });

  // Carbon Fiber / Black trim material
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Glass Material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  // Headlight material (Emissive Xenon/LED)
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x93c5fd,
    emissiveIntensity: 1.5,
  });

  // Taillight / Brake material
  const brakeLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
  });

  // Wheel Rim & Tire materials
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
    metalness: 0.1,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: carDef.wheelColor || 0xd1d5db,
    metalness: 0.9,
    roughness: 0.2,
  });

  // --- 1. CHASSIS / LOWER BODY ---
  let bodyGeo: THREE.BufferGeometry;
  if (carDef.modelStyle === 'formula') {
    // Narrow sleek formula body
    bodyGeo = new THREE.BoxGeometry(1.4, 0.45, 3.8);
  } else if (carDef.modelStyle === 'muscle') {
    // Wide muscle stance
    bodyGeo = new THREE.BoxGeometry(1.85, 0.6, 4.0);
  } else {
    // Supercar / Exotic / Coupe
    bodyGeo = new THREE.BoxGeometry(1.75, 0.52, 3.9);
  }

  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
  bodyMesh.position.y = 0.42;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // --- 2. CABIN / ROOF ---
  let cabinGeo: THREE.BufferGeometry;
  let cabinY = 0.82;
  let cabinZ = -0.15;

  if (carDef.modelStyle === 'formula') {
    // Formula open cockpit halo & intake
    cabinGeo = new THREE.BoxGeometry(0.7, 0.4, 1.2);
    cabinY = 0.72;
  } else if (carDef.modelStyle === 'muscle') {
    cabinGeo = new THREE.BoxGeometry(1.45, 0.48, 1.9);
    cabinZ = -0.3;
  } else {
    // Sleek sloped aerodynamic greenhouse
    cabinGeo = new THREE.BoxGeometry(1.35, 0.45, 1.8);
  }

  const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
  cabinMesh.position.set(0, cabinY, cabinZ);
  cabinMesh.castShadow = true;
  group.add(cabinMesh);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.3, 0.08, 1.4);
  const roofMesh = new THREE.Mesh(roofGeo, bodyMaterial);
  roofMesh.position.set(0, cabinY + 0.22, cabinZ + 0.05);
  group.add(roofMesh);

  // --- 3. FRONT SPLITTER & HOOD SCOOP ---
  const splitterGeo = new THREE.BoxGeometry(1.8, 0.08, 0.6);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, 0.2, 1.85);
  group.add(splitterMesh);

  if (carDef.modelStyle === 'muscle') {
    const scoopGeo = new THREE.BoxGeometry(0.6, 0.15, 0.8);
    const scoopMesh = new THREE.Mesh(scoopGeo, carbonMaterial);
    scoopMesh.position.set(0, 0.72, 0.8);
    group.add(scoopMesh);
  }

  // --- 4. REAR DIFFUSER & SPOILER / WING ---
  const diffuserGeo = new THREE.BoxGeometry(1.7, 0.15, 0.4);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(0, 0.25, -1.9);
  group.add(diffuserMesh);

  // Rear Spoiler
  const wingGroup = new THREE.Group();
  const wingBladeGeo = new THREE.BoxGeometry(1.8, 0.06, 0.35);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMaterial);
  wingBlade.position.set(0, 0.88, -1.75);

  const standGeo = new THREE.BoxGeometry(0.06, 0.3, 0.15);
  const leftStand = new THREE.Mesh(standGeo, carbonMaterial);
  leftStand.position.set(-0.55, 0.72, -1.75);
  const rightStand = new THREE.Mesh(standGeo, carbonMaterial);
  rightStand.position.set(0.55, 0.72, -1.75);

  wingGroup.add(wingBlade, leftStand, rightStand);
  group.add(wingGroup);

  // --- 5. HEADLIGHTS & TAILLIGHTS ---
  // Left Headlight
  const headGeo = new THREE.BoxGeometry(0.35, 0.1, 0.1);
  const leftHead = new THREE.Mesh(headGeo, headlightMaterial);
  leftHead.position.set(-0.65, 0.48, 1.95);

  const rightHead = new THREE.Mesh(headGeo, headlightMaterial);
  rightHead.position.set(0.65, 0.48, 1.95);
  group.add(leftHead, rightHead);

  // Taillight bar
  const tailGeo = new THREE.BoxGeometry(1.5, 0.1, 0.08);
  const tailMesh = new THREE.Mesh(tailGeo, brakeLightMaterial);
  tailMesh.position.set(0, 0.52, -1.95);
  group.add(tailMesh);

  // --- 6. EXHAUST PIPES ---
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12);
  exhaustGeo.rotateX(Math.PI / 2);

  const leftExhaust = new THREE.Mesh(exhaustGeo, rimMaterial);
  leftExhaust.position.set(-0.45, 0.28, -1.95);
  const rightExhaust = new THREE.Mesh(exhaustGeo, rimMaterial);
  rightExhaust.position.set(0.45, 0.28, -1.95);
  group.add(leftExhaust, rightExhaust);

  // --- 7. WHEEL GENERATOR ---
  const createWheel = (isFront: boolean, isLeft: boolean): THREE.Group => {
    const wheelHolder = new THREE.Group();
    const wheelMeshGroup = new THREE.Group();

    const tireRadius = 0.34;
    const tireWidth = 0.24;

    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;

    // Rim Disc
    const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, tireWidth + 0.02, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(tireWidth + 0.03, tireRadius * 1.1, 0.06);
    const spoke1 = new THREE.Mesh(spokeGeo, rimMaterial);
    const spoke2 = spoke1.clone();
    spoke2.rotation.x = Math.PI / 3;
    const spoke3 = spoke1.clone();
    spoke3.rotation.x = -Math.PI / 3;

    wheelMeshGroup.add(tireMesh, rimMesh, spoke1, spoke2, spoke3);
    wheelHolder.add(wheelMeshGroup);

    return wheelHolder;
  };

  const wheelOffsetX = 0.92;
  const wheelFrontZ = 1.15;
  const wheelRearZ = -1.15;
  const wheelY = 0.34;

  const frontLeftWheel = createWheel(true, true);
  frontLeftWheel.position.set(-wheelOffsetX, wheelY, wheelFrontZ);

  const frontRightWheel = createWheel(true, false);
  frontRightWheel.position.set(wheelOffsetX, wheelY, wheelFrontZ);

  const rearLeftWheel = createWheel(false, true);
  rearLeftWheel.position.set(-wheelOffsetX, wheelY, wheelRearZ);

  const rearRightWheel = createWheel(false, false);
  rearRightWheel.position.set(wheelOffsetX, wheelY, wheelRearZ);

  group.add(frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel);

  // --- 8. NEON UNDERGLOW ---
  let underglowLight: THREE.PointLight | undefined;
  if (carDef.neonColor) {
    underglowLight = new THREE.PointLight(new THREE.Color(carDef.neonColor), 1.2, 4);
    underglowLight.position.set(0, 0.15, 0);
    group.add(underglowLight);
  }

  // Helper Methods
  const setColor = (hexColor: string) => {
    bodyMaterial.color.set(hexColor);
    if (underglowLight) {
      underglowLight.color.set(hexColor);
    }
  };

  const updateWheels = (speedKmh: number, steerAngle: number) => {
    const rotationDelta = (speedKmh / 15) * 0.1;
    // Spin wheels
    (frontLeftWheel.children[0] as THREE.Group).rotation.x += rotationDelta;
    (frontRightWheel.children[0] as THREE.Group).rotation.x += rotationDelta;
    (rearLeftWheel.children[0] as THREE.Group).rotation.x += rotationDelta;
    (rearRightWheel.children[0] as THREE.Group).rotation.x += rotationDelta;

    // Steer front wheels
    frontLeftWheel.rotation.y = steerAngle;
    frontRightWheel.rotation.y = steerAngle;
  };

  const setBraking = (isBraking: boolean) => {
    brakeLightMaterial.emissiveIntensity = isBraking ? 2.5 : 0.8;
  };

  return {
    group,
    bodyMesh,
    bodyMaterial,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    brakeLightMaterial,
    exhaustLeft: new THREE.Vector3(-0.45, 0.28, -1.95),
    exhaustRight: new THREE.Vector3(0.45, 0.28, -1.95),
    underglowLight,
    setColor,
    updateWheels,
    setBraking,
  };
}
