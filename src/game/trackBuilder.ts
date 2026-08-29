import * as THREE from 'three';
import { TrackDefinition } from '../types';

export interface TrackCollectible {
  id: string;
  type: 'coin' | 'nitro' | 'boost_pad';
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  trackProgress: number; // 0 to 1
  collected: boolean;
  respawnTimer: number;
}

export interface Track3DResult {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  trackLength: number;
  roadWidth: number;
  collectibles: TrackCollectible[];
  startPosition: THREE.Vector3;
  startRotation: THREE.Euler;
  getPointAt: (u: number) => THREE.Vector3;
  getTangentAt: (u: number) => THREE.Vector3;
  getTrackFrame: (u: number) => { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 };
  updateCollectibles: (delta: number) => void;
}

export function build3DTrack(trackDef: TrackDefinition): Track3DResult {
  const group = new THREE.Group();
  const roadWidth = 16;

  // 1. GENERATE CONTROL POINTS PER TRACK THEME
  let controlPoints: THREE.Vector3[] = [];

  if (trackDef.theme === 'ring') {
    // Pure circular stadium speedway track (Dumaloq trassa)
    const numPts = 16;
    const radius = 150;
    for (let i = 0; i < numPts; i++) {
      const angle = (i / numPts) * Math.PI * 2;
      controlPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
  } else if (trackDef.theme === 'city') {
    // Fast city circuit with sweeping 90-degree corners and high-speed tunnel straight
    controlPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 180),
      new THREE.Vector3(80, 0, 280),
      new THREE.Vector3(220, 0, 320),
      new THREE.Vector3(340, 2, 240),
      new THREE.Vector3(360, 4, 100),
      new THREE.Vector3(280, 2, -40),
      new THREE.Vector3(180, 0, -80),
      new THREE.Vector3(60, 0, -180),
      new THREE.Vector3(-80, 0, -220),
      new THREE.Vector3(-200, 0, -140),
      new THREE.Vector3(-220, 0, 20),
      new THREE.Vector3(-140, 0, 120),
      new THREE.Vector3(-40, 0, 60),
    ];
  } else if (trackDef.theme === 'desert') {
    // Canyon loop with elevation dips and sweeping dunes
    controlPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(40, -2, 160),
      new THREE.Vector3(140, -4, 260),
      new THREE.Vector3(280, 4, 240),
      new THREE.Vector3(320, 8, 120),
      new THREE.Vector3(260, 10, -20),
      new THREE.Vector3(340, 6, -160),
      new THREE.Vector3(280, 2, -280),
      new THREE.Vector3(120, -2, -320),
      new THREE.Vector3(-60, -4, -260),
      new THREE.Vector3(-180, 0, -180),
      new THREE.Vector3(-260, 4, -40),
      new THREE.Vector3(-220, 2, 100),
      new THREE.Vector3(-100, 0, 140),
    ];
  } else if (trackDef.theme === 'mountain') {
    // High mountain serpentine with big elevation changes
    controlPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(60, 8, 140),
      new THREE.Vector3(180, 16, 200),
      new THREE.Vector3(140, 22, 300),
      new THREE.Vector3(20, 28, 340),
      new THREE.Vector3(-100, 32, 280),
      new THREE.Vector3(-180, 26, 160),
      new THREE.Vector3(-260, 20, 40),
      new THREE.Vector3(-320, 14, -80),
      new THREE.Vector3(-260, 8, -200),
      new THREE.Vector3(-140, 4, -280),
      new THREE.Vector3(20, 0, -320),
      new THREE.Vector3(160, 2, -240),
      new THREE.Vector3(180, 0, -100),
    ];
  } else {
    // Cyber Night City - Hyper-speed neon circuit with banked chicanes
    controlPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 220),
      new THREE.Vector3(100, 4, 340),
      new THREE.Vector3(260, 6, 380),
      new THREE.Vector3(400, 4, 280),
      new THREE.Vector3(420, 0, 140),
      new THREE.Vector3(320, -2, 0),
      new THREE.Vector3(380, 2, -140),
      new THREE.Vector3(300, 4, -280),
      new THREE.Vector3(140, 0, -360),
      new THREE.Vector3(-40, 0, -340),
      new THREE.Vector3(-180, 4, -240),
      new THREE.Vector3(-280, 2, -100),
      new THREE.Vector3(-240, 0, 80),
      new THREE.Vector3(-120, 0, 120),
    ];
  }

  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'centripetal', 0.5);
  const trackLength = curve.getLength();

  // 2. GENERATE ROAD RIBBON MESH
  const segments = 400;
  const halfWidth = roadWidth / 2;

  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  // Curbs geometry
  const leftCurbPositions: number[] = [];
  const rightCurbPositions: number[] = [];
  const curbIndices: number[] = [];

  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tan, up).normalize();

    points.push(pt);
    tangents.push(tan);
    binormals.push(binormal);

    // Left and Right road edge vertices
    const leftPt = pt.clone().add(binormal.clone().multiplyScalar(-halfWidth));
    const rightPt = pt.clone().add(binormal.clone().multiplyScalar(halfWidth));

    roadPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
    roadPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

    roadNormals.push(0, 1, 0, 0, 1, 0);

    const uvV = (i / segments) * 60; // Tiling
    roadUvs.push(0, uvV, 1, uvV);

    // Curbs vertices (raised slightly)
    const curbWidth = 1.2;
    const curbHeight = 0.25;

    const leftCurbOuter = leftPt.clone().add(binormal.clone().multiplyScalar(-curbWidth));
    leftCurbPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
    leftCurbPositions.push(leftCurbOuter.x, leftCurbOuter.y + curbHeight, leftCurbOuter.z);

    const rightCurbOuter = rightPt.clone().add(binormal.clone().multiplyScalar(curbWidth));
    rightCurbPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);
    rightCurbPositions.push(rightCurbOuter.x, rightCurbOuter.y + curbHeight, rightCurbOuter.z);

    if (i < segments) {
      const baseIdx = i * 2;
      // Two triangles for quad
      roadIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      roadIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);

      curbIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      curbIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }
  }

  // Build Road Mesh
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  // Procedural Road Texture with lane markings
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#' + trackDef.roadColor.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 512, 512);

  // Add subtle asphalt noise
  for (let i = 0; i < 6000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    const val = Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgba(${val},${val},${val},0.15)`;
    ctx.fillRect(nx, ny, 2, 2);
  }

  // White side lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 0, 8, 512);
  ctx.fillRect(512 - 28, 0, 8, 512);

  // Dashed center line
  ctx.fillStyle = trackDef.theme === 'night_city' ? '#06b6d4' : '#f59e0b';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(252, y, 8, 36);
  }

  const roadTex = new THREE.CanvasTexture(canvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 40);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.8,
    metalness: 0.1,
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Build Curbs Mesh
  const leftCurbGeo = new THREE.BufferGeometry();
  leftCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftCurbPositions, 3));
  leftCurbGeo.setIndex(curbIndices);
  leftCurbGeo.computeVertexNormals();

  const rightCurbGeo = new THREE.BufferGeometry();
  rightCurbGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightCurbPositions, 3));
  rightCurbGeo.setIndex(curbIndices);
  rightCurbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    color: trackDef.curbColor1,
    roughness: 0.6,
    metalness: 0.2,
  });

  const leftCurbMesh = new THREE.Mesh(leftCurbGeo, curbMat);
  const rightCurbMesh = new THREE.Mesh(rightCurbGeo, curbMat);
  group.add(leftCurbMesh, rightCurbMesh);

  // 3. TERRAIN / GROUND PLANE
  const groundGeo = new THREE.PlaneGeometry(1200, 1200, 64, 64);
  groundGeo.rotateX(-Math.PI / 2);

  // Add terrain height variation
  const posArr = groundGeo.attributes.position.array as Float32Array;
  for (let i = 0; i < posArr.length; i += 3) {
    const gx = posArr[i];
    const gz = posArr[i + 2];
    if (trackDef.theme === 'mountain') {
      posArr[i + 1] = Math.sin(gx * 0.01) * Math.cos(gz * 0.01) * 35 - 5;
    } else if (trackDef.theme === 'desert') {
      posArr[i + 1] = Math.sin(gx * 0.015) * 12 + Math.cos(gz * 0.012) * 8 - 4;
    } else {
      posArr[i + 1] = -0.2;
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: trackDef.groundColor,
    roughness: 0.95,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -0.1;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // 4. FINISH LINE / START ARCH
  const startPt = curve.getPointAt(0);
  const startTan = curve.getTangentAt(0).normalize();
  const startBin = new THREE.Vector3().crossVectors(startTan, new THREE.Vector3(0, 1, 0)).normalize();

  const archGroup = new THREE.Group();
  archGroup.position.copy(startPt);

  // Arch Posts
  const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.copy(startBin.clone().multiplyScalar(-halfWidth - 1.5));
  leftPost.position.y = 4;

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.copy(startBin.clone().multiplyScalar(halfWidth + 1.5));
  rightPost.position.y = 4;

  // Overhead Banner
  const bannerGeo = new THREE.BoxGeometry(roadWidth + 4, 2.2, 0.6);
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 128;
  const bCtx = bannerCanvas.getContext('2d')!;
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(0, 0, 512, 128);
  bCtx.fillStyle = trackDef.bannerColor;
  bCtx.fillRect(10, 10, 492, 108);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'bold 44px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';
  bCtx.fillText('TURBO RUSH - FINISH', 256, 64);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, emissive: 0x3b82f6, emissiveIntensity: 0.4 });
  const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
  bannerMesh.position.y = 7.2;

  // Align Arch with Track Direction
  const archAngle = Math.atan2(startTan.x, startTan.z);
  archGroup.rotation.y = archAngle;

  archGroup.add(leftPost, rightPost, bannerMesh);
  group.add(archGroup);

  // Chequered Finish line on road
  const finishLineGeo = new THREE.PlaneGeometry(roadWidth, 2.5);
  finishLineGeo.rotateX(-Math.PI / 2);
  const fCanvas = document.createElement('canvas');
  fCanvas.width = 256;
  fCanvas.height = 64;
  const fCtx = fCanvas.getContext('2d')!;
  const sqSize = 16;
  for (let x = 0; x < 256; x += sqSize) {
    for (let y = 0; y < 64; y += sqSize) {
      fCtx.fillStyle = ((x / sqSize) + (y / sqSize)) % 2 === 0 ? '#ffffff' : '#000000';
      fCtx.fillRect(x, y, sqSize, sqSize);
    }
  }
  const fTex = new THREE.CanvasTexture(fCanvas);
  const fMat = new THREE.MeshStandardMaterial({ map: fTex, roughness: 0.5 });
  const finishLineMesh = new THREE.Mesh(finishLineGeo, fMat);
  finishLineMesh.position.copy(startPt);
  finishLineMesh.position.y += 0.08;
  finishLineMesh.rotation.y = archAngle;
  group.add(finishLineMesh);

  // 5. COLLECTIBLES & BOOST PADS
  const collectibles: TrackCollectible[] = [];

  // Coin Geometry & Material
  const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.1,
  });

  // Nitro Canister Geometry & Material
  const nitroGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
  const nitroMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.2,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Boost Pad Geometry & Material
  const boostGeo = new THREE.PlaneGeometry(5, 3.5);
  boostGeo.rotateX(-Math.PI / 2);
  const boostCanvas = document.createElement('canvas');
  boostCanvas.width = 128;
  boostCanvas.height = 128;
  const boostCtx = boostCanvas.getContext('2d')!;
  boostCtx.fillStyle = 'rgba(6, 182, 212, 0.2)';
  boostCtx.fillRect(0, 0, 128, 128);
  boostCtx.fillStyle = '#06b6d4';
  // Chevrons
  for (let cy = 20; cy < 120; cy += 36) {
    boostCtx.beginPath();
    boostCtx.moveTo(64, cy);
    boostCtx.lineTo(110, cy + 24);
    boostCtx.lineTo(95, cy + 24);
    boostCtx.lineTo(64, cy + 8);
    boostCtx.lineTo(33, cy + 24);
    boostCtx.lineTo(18, cy + 24);
    boostCtx.closePath();
    boostCtx.fill();
  }
  const boostTex = new THREE.CanvasTexture(boostCanvas);
  const boostMat = new THREE.MeshBasicMaterial({ map: boostTex, transparent: true, opacity: 0.9 });

  // Place collectibles at strategic intervals along track
  const numItems = 28;
  for (let i = 1; i <= numItems; i++) {
    const progress = i / (numItems + 1);
    const pt = curve.getPointAt(progress);
    const tan = curve.getTangentAt(progress).normalize();
    const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Determine type: alternate Coins, Nitro bottles, Boost pads
    let type: 'coin' | 'nitro' | 'boost_pad' = 'coin';
    if (i % 6 === 0) {
      type = 'boost_pad';
    } else if (i % 3 === 0) {
      type = 'nitro';
    }

    // Offset lanes: left, center, right
    const laneOffset = ((i % 3) - 1) * (halfWidth * 0.55);
    const itemPos = pt.clone().add(bin.clone().multiplyScalar(laneOffset));

    let itemMesh: THREE.Object3D;
    if (type === 'coin') {
      itemPos.y += 1.0;
      itemMesh = new THREE.Mesh(coinGeo, coinMat);
      itemMesh.position.copy(itemPos);
    } else if (type === 'nitro') {
      itemPos.y += 1.0;
      const nGroup = new THREE.Group();
      const nMesh = new THREE.Mesh(nitroGeo, nitroMat);
      nGroup.add(nMesh);
      nGroup.position.copy(itemPos);
      itemMesh = nGroup;
    } else {
      itemPos.y += 0.08;
      itemMesh = new THREE.Mesh(boostGeo, boostMat);
      itemMesh.position.copy(itemPos);
      itemMesh.rotation.y = Math.atan2(tan.x, tan.z);
    }

    group.add(itemMesh);

    collectibles.push({
      id: `item_${i}`,
      type,
      mesh: itemMesh,
      position: itemPos.clone(),
      trackProgress: progress,
      collected: false,
      respawnTimer: 0,
    });
  }

  // 6. THEMED ROADSIDE PROPS (Scenery)
  if (trackDef.theme === 'ring') {
    // Grand Circular Speedway Stadium with LED Screens, Grandstands & Floodlights
    const grandstandMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.3 });
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x06b6d4, emissiveIntensity: 1.5 });
    const floodlightPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const lightGlowMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 3.0 });

    for (let i = 0; i < 32; i++) {
      const u = i / 32;
      const pt = curve.getPointAt(u);
      const bin = new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize();
      
      // Outer grandstand & floodlight towers
      const outerPos = pt.clone().add(bin.clone().multiplyScalar(halfWidth + 22));
      const standWidth = 28;
      const standHeight = 18;
      const standDepth = 12;

      const standMesh = new THREE.Mesh(new THREE.BoxGeometry(standWidth, standHeight, standDepth), grandstandMat);
      standMesh.position.set(outerPos.x, standHeight / 2, outerPos.z);
      standMesh.lookAt(pt);
      standMesh.castShadow = true;
      group.add(standMesh);

      // LED Video Ribbon atop grandstand
      const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(standWidth * 0.9, 3, 1), screenMat);
      screenMesh.position.set(outerPos.x, standHeight + 1.5, outerPos.z);
      screenMesh.lookAt(pt);
      group.add(screenMesh);

      // Floodlight tower every 4 steps
      if (i % 4 === 0) {
        const poleHeight = 36;
        const polePos = pt.clone().add(bin.clone().multiplyScalar(halfWidth + 34));
        const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, poleHeight, 8), floodlightPoleMat);
        poleMesh.position.set(polePos.x, poleHeight / 2, polePos.z);

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 3), lightGlowMat);
        headMesh.position.set(polePos.x, poleHeight, polePos.z);
        headMesh.lookAt(pt);

        group.add(poleMesh, headMesh);
      }
    }
  } else if (trackDef.theme === 'city') {
    // Add modern skyscrapers and streetlamps
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const buildingGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });

    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      const pt = curve.getPointAt(u);
      const bin = new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (halfWidth + 20 + Math.random() * 30);
      const bPos = pt.clone().add(bin.clone().multiplyScalar(side));

      const bWidth = 15 + Math.random() * 20;
      const bHeight = 35 + Math.random() * 65;
      const bDepth = 15 + Math.random() * 20;

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, i % 3 === 0 ? buildingGlassMat : buildingMat);
      bMesh.position.set(bPos.x, bHeight / 2, bPos.z);
      bMesh.castShadow = true;
      group.add(bMesh);
    }
  } else if (trackDef.theme === 'desert') {
    // Add sandstone rock formations and saguaro cacti
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.95 });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    for (let i = 0; i < 50; i++) {
      const u = i / 50;
      const pt = curve.getPointAt(u);
      const bin = new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (halfWidth + 12 + Math.random() * 45);
      const rPos = pt.clone().add(bin.clone().multiplyScalar(side));

      if (i % 2 === 0) {
        // Rock Mesa
        const rSize = 10 + Math.random() * 18;
        const rGeo = new THREE.DodecahedronGeometry(rSize, 1);
        const rMesh = new THREE.Mesh(rGeo, rockMat);
        rMesh.position.set(rPos.x, rSize * 0.4, rPos.z);
        rMesh.castShadow = true;
        group.add(rMesh);
      } else {
        // Cactus
        const cGeo = new THREE.CylinderGeometry(0.6, 0.6, 6 + Math.random() * 4, 8);
        const cMesh = new THREE.Mesh(cGeo, cactusMat);
        cMesh.position.set(rPos.x, 3, rPos.z);
        group.add(cMesh);
      }
    }
  } else if (trackDef.theme === 'mountain') {
    // Add Pine Trees and Snowy Cliffs
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });

    for (let i = 0; i < 60; i++) {
      const u = i / 60;
      const pt = curve.getPointAt(u);
      const bin = new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (halfWidth + 10 + Math.random() * 35);
      const tPos = pt.clone().add(bin.clone().multiplyScalar(side));

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3), trunkMat);
      trunk.position.y = 1.5;

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 5, 8), foliageMat);
      cone1.position.y = 4.5;
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4, 8), foliageMat);
      cone2.position.y = 7.0;

      treeGroup.add(trunk, cone1, cone2);
      treeGroup.position.set(tPos.x, pt.y, tPos.z);
      group.add(treeGroup);
    }
  } else {
    // Cyber Night City - Neon Towers and Cyber Arches
    const cyberMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
    const neonMat1 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.0 });
    const neonMat2 = new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xd946ef, emissiveIntensity: 2.0 });

    for (let i = 0; i < 45; i++) {
      const u = i / 45;
      const pt = curve.getPointAt(u);
      const bin = new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize();
      const side = (i % 2 === 0 ? 1 : -1) * (halfWidth + 18 + Math.random() * 25);
      const cPos = pt.clone().add(bin.clone().multiplyScalar(side));

      const towerHeight = 40 + Math.random() * 70;
      const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(16, towerHeight, 16), cyberMat);
      towerMesh.position.set(cPos.x, towerHeight / 2, cPos.z);

      // Neon edge strip
      const stripMesh = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.5, 16.2), i % 2 === 0 ? neonMat1 : neonMat2);
      stripMesh.position.set(cPos.x, towerHeight * 0.7, cPos.z);

      group.add(towerMesh, stripMesh);
    }
  }

  // Update animated collectibles (rotation & respawn)
  const updateCollectibles = (delta: number) => {
    collectibles.forEach((item) => {
      if (item.collected) {
        item.respawnTimer -= delta;
        if (item.respawnTimer <= 0) {
          item.collected = false;
          item.mesh.visible = true;
        }
      } else {
        if (item.type === 'coin') {
          item.mesh.rotation.z += delta * 3.5;
        } else if (item.type === 'nitro') {
          item.mesh.rotation.y += delta * 2.5;
          item.mesh.position.y = item.position.y + Math.sin(Date.now() * 0.005) * 0.15;
        }
      }
    });
  };

  const getPointAt = (u: number) => curve.getPointAt(((u % 1) + 1) % 1);
  const getTangentAt = (u: number) => curve.getTangentAt(((u % 1) + 1) % 1).normalize();

  const getTrackFrame = (u: number) => {
    const normU = ((u % 1) + 1) % 1;
    const pt = curve.getPointAt(normU);
    const tan = curve.getTangentAt(normU).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const bin = new THREE.Vector3().crossVectors(tan, up).normalize();
    const norm = new THREE.Vector3().crossVectors(bin, tan).normalize();
    return { position: pt, tangent: tan, normal: norm, binormal: bin };
  };

  return {
    group,
    curve,
    trackLength,
    roadWidth,
    collectibles,
    startPosition: startPt,
    startRotation: new THREE.Euler(0, archAngle, 0),
    getPointAt,
    getTangentAt,
    getTrackFrame,
    updateCollectibles,
  };
}
