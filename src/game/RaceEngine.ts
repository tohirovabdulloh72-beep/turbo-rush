import * as THREE from 'three';
import {
  CarDefinition,
  TrackDefinition,
  PlayerProgress,
  RaceLiveState,
  RaceResult,
  CarUpgradeState,
} from '../types';
import {
  CARS_CATALOG,
  OPPONENTS_LIST,
  UPGRADE_BOOSTS,
  POSITION_REWARDS,
} from './constants';
import { create3DCar, Car3DInstance } from './carModel';
import { build3DTrack, Track3DResult } from './trackBuilder';
import { soundManager } from './audio';

export interface CarPhysicsState {
  progress: number; // 0 to 1 along track
  lap: number;      // 1-indexed
  laneOffset: number; // lateral offset in meters from center
  speed: number;    // meters / second
  steerAngle: number;
  driftAngle: number;
  isDrifting: boolean;
  nitro: number;    // 0 to 100
  isNitro: boolean;
  boostTimer: number;
  worldPos: THREE.Vector3;
  worldRot: THREE.Euler;
  collisionCooldown: number;
}

export interface InputControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}

export class RaceEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private track3D: Track3DResult;
  private trackDef: TrackDefinition;
  private playerCarDef: CarDefinition;
  private playerUpgrade: CarUpgradeState;
  private playerProgressData: PlayerProgress;

  private playerCar3D: Car3DInstance;
  private opponentCars3D: { carDef: CarDefinition; instance: Car3DInstance; state: CarPhysicsState; speedMult: number; skill: number; name: string }[] = [];

  private playerPhysics: CarPhysicsState;
  private inputs: InputControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  };

  // State Management
  private status: 'countdown' | 'racing' | 'finished' | 'paused' = 'countdown';
  private countdownTimer: number = 3.99;
  private countdownLastBeep: number = 4;
  private raceStartTime: number = 0;
  private elapsedTimeMs: number = 0;
  private lapStartTimes: number[] = [0];
  private currentLapTimeMs: number = 0;
  private bestLapTimeMs: number = 0;
  private coinsCollected: number = 0;
  private notification: RaceLiveState['notification'] = undefined;
  private notificationTimer: number = 0;

  // Particle Systems
  private nitroParticles: THREE.Points | null = null;
  private nitroGeo: THREE.BufferGeometry | null = null;
  private speedLinesMesh: THREE.Mesh | null = null;

  // Render Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  // Callbacks
  public onStateUpdate?: (state: RaceLiveState) => void;
  public onFinish?: (result: RaceResult) => void;

  constructor(
    container: HTMLElement,
    trackDef: TrackDefinition,
    playerCarDef: CarDefinition,
    progress: PlayerProgress
  ) {
    this.container = container;
    this.trackDef = trackDef;
    this.playerCarDef = playerCarDef;
    this.playerProgressData = progress;
    this.playerUpgrade = progress.carUpgrades[playerCarDef.id] || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0 };

    // 1. SETUP THREE.JS SCENE & RENDERER
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(trackDef.skyColor);
    this.scene.fog = new THREE.FogExp2(trackDef.fogColor, 0.0035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 1200);

    this.renderer = new THREE.WebGLRenderer({
      antialias: progress.settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, progress.settings.graphicsQuality === 'high' ? 2 : 1.25));
    this.renderer.shadowMap.enabled = progress.settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 2. LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(trackDef.ambientColor, 1.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(trackDef.sunColor, 2.2);
    sunLight.position.set(120, 200, 80);
    sunLight.castShadow = progress.settings.graphicsQuality !== 'low';
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 500;
    const d = 150;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // 3. BUILD 3D TRACK
    this.track3D = build3DTrack(trackDef);
    this.scene.add(this.track3D.group);

    // 4. SPAWN PLAYER & 5 AI OPPONENT CARS ON STARTING GRID
    const customPlayerColor = progress.carColors[playerCarDef.id] || playerCarDef.color;
    this.playerCar3D = create3DCar(playerCarDef, customPlayerColor);
    this.scene.add(this.playerCar3D.group);

    this.playerPhysics = {
      progress: 0.005, // Starting line offset
      lap: 1,
      laneOffset: -2.5,
      speed: 0,
      steerAngle: 0,
      driftAngle: 0,
      isDrifting: false,
      nitro: 100,
      isNitro: false,
      boostTimer: 0,
      worldPos: new THREE.Vector3(),
      worldRot: new THREE.Euler(),
      collisionCooldown: 0,
    };

    this.setupOpponents();
    this.setupParticles();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Start Engine Sounds
    soundManager.startEngine();
    soundManager.startMusic();

    // Start Game Loop
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  private setupOpponents() {
    // 5 Opponents on staggered starting grid positions
    const gridOffsets = [
      { progress: 0.008, lane: 2.5 },
      { progress: 0.012, lane: -2.2 },
      { progress: 0.016, lane: 2.2 },
      { progress: 0.020, lane: -1.8 },
      { progress: 0.024, lane: 1.8 },
    ];

    OPPONENTS_LIST.forEach((opp, i) => {
      const oppDef = CARS_CATALOG.find((c) => c.id === opp.carId) || CARS_CATALOG[1];
      const car3D = create3DCar(oppDef, opp.color);
      this.scene.add(car3D.group);

      const offset = gridOffsets[i] || { progress: 0.01 * (i + 1), lane: 0 };
      const oppState: CarPhysicsState = {
        progress: offset.progress,
        lap: 1,
        laneOffset: offset.lane,
        speed: 0,
        steerAngle: 0,
        driftAngle: 0,
        isDrifting: false,
        nitro: 100,
        isNitro: false,
        boostTimer: 0,
        worldPos: new THREE.Vector3(),
        worldRot: new THREE.Euler(),
        collisionCooldown: 0,
      };

      this.opponentCars3D.push({
        carDef: oppDef,
        instance: car3D,
        state: oppState,
        speedMult: opp.speedMultiplier,
        skill: opp.skill,
        name: opp.name,
      });
    });
  }

  private setupParticles() {
    // Nitro Flame particle buffer
    const particleCount = 120;
    this.nitroGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = -Math.random() * 2.5;

      // Cyan to Orange fiery particles
      colors[i * 3] = 0.2 + Math.random() * 0.8;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 2] = 1.0;
    }

    this.nitroGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.nitroGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.nitroParticles = new THREE.Points(this.nitroGeo, particleMat);
    this.nitroParticles.visible = false;
    this.playerCar3D.group.add(this.nitroParticles);
  }

  // --- INPUT HANDLING ---
  public setInputs(inputs: Partial<InputControls>) {
    this.inputs = { ...this.inputs, ...inputs };
  }

  public triggerNitro() {
    if (this.playerPhysics.nitro > 15 && !this.playerPhysics.isNitro && this.status === 'racing') {
      this.playerPhysics.isNitro = true;
      soundManager.playNitroWhoosh();
      this.showNotification('NITRO BOOST!', 'nitro');
    }
  }

  public showNotification(text: string, type: RaceLiveState['notification']['type'] = 'boost') {
    this.notification = { id: Date.now(), text, type };
    this.notificationTimer = 2.0;
  }

  // --- PHYSICS ENGINE CALCULATIONS ---
  private calculateEffectiveStats() {
    const base = this.playerCarDef.stats;
    const up = this.playerUpgrade;

    const topSpeedKmh = base.topSpeed + (up.speedLevel * UPGRADE_BOOSTS.speedPerLevel);
    const accelStat = base.acceleration + (up.accelLevel * UPGRADE_BOOSTS.accelPerLevel);
    const handlingStat = base.handling + (up.handlingLevel * UPGRADE_BOOSTS.handlingPerLevel);
    const nitroStat = base.nitroBoost + (up.nitroLevel * UPGRADE_BOOSTS.nitroPerLevel);

    return {
      maxSpeedMs: (topSpeedKmh / 3.6),
      accelRate: 6.5 + (accelStat * 1.6), // m/s^2
      brakeRate: 22.0,
      reverseMaxSpeedMs: 14.0,
      handlingSensitivity: 1.8 + (handlingStat * 0.25),
      nitroMultiplier: 1.25 + (nitroStat * 0.04),
    };
  }

  private updatePlayerPhysics(dt: number) {
    const stats = this.calculateEffectiveStats();
    const p = this.playerPhysics;

    // 1. NITRO BOOST HANDLING
    if (p.isNitro || (this.inputs.nitro && p.nitro > 0)) {
      if (p.nitro > 0) {
        p.isNitro = true;
        p.nitro = Math.max(0, p.nitro - dt * 25);
        if (this.nitroParticles) {
          this.nitroParticles.visible = true;
          this.nitroParticles.position.set(0, 0.3, -2.1);
        }
      } else {
        p.isNitro = false;
        if (this.nitroParticles) this.nitroParticles.visible = false;
      }
    } else {
      p.isNitro = false;
      if (this.nitroParticles) this.nitroParticles.visible = false;
      // Passive nitro recharge on high speed
      if (p.speed > 25) {
        p.nitro = Math.min(100, p.nitro + dt * 2.5);
      }
    }

    // Boost Pad extra surge timer
    if (p.boostTimer > 0) {
      p.boostTimer -= dt;
    }

    // 2. ACCELERATION / BRAKING
    let targetMaxSpeed = stats.maxSpeedMs;
    if (p.isNitro) targetMaxSpeed *= stats.nitroMultiplier;
    if (p.boostTimer > 0) targetMaxSpeed *= 1.3;

    const isAccelerating = this.inputs.forward && this.status === 'racing';
    const isBraking = this.inputs.backward && this.status === 'racing';

    if (isAccelerating) {
      const currentRatio = Math.min(1, Math.max(0, p.speed / targetMaxSpeed));
      const effectiveAccel = stats.accelRate * (1.2 - currentRatio * 0.4) * (p.isNitro ? 1.8 : 1.0);
      p.speed = Math.min(targetMaxSpeed, p.speed + effectiveAccel * dt);
    } else if (isBraking) {
      if (p.speed > 1.0) {
        p.speed = Math.max(0, p.speed - stats.brakeRate * dt);
      } else {
        // Reverse
        p.speed = Math.max(-stats.reverseMaxSpeedMs, p.speed - 8.0 * dt);
      }
    } else {
      // Natural rolling drag / engine brake
      if (p.speed > 0) {
        p.speed = Math.max(0, p.speed - 7.5 * dt);
      } else if (p.speed < 0) {
        p.speed = Math.min(0, p.speed + 7.5 * dt);
      }
    }

    this.playerCar3D.setBraking(isBraking && p.speed > 1.0);

    // 3. STEERING & DRIFTING
    let steerInput = 0;
    if (this.inputs.left) steerInput -= 1;
    if (this.inputs.right) steerInput += 1;

    // Speed-dependent steering dampening (avoids twitchiness at 300+ km/h)
    const speedRatio = Math.abs(p.speed) / stats.maxSpeedMs;
    const steerSpeedFactor = Math.max(0.4, 1.0 - speedRatio * 0.45);
    const targetSteerAngle = steerInput * 0.42 * steerSpeedFactor;
    p.steerAngle = THREE.MathUtils.lerp(p.steerAngle, targetSteerAngle, dt * 10);

    // Drift activation (Handbrake + Turning at speed)
    const wantsDrift = (this.inputs.drift || (isBraking && Math.abs(steerInput) > 0.5)) && p.speed > 18;
    if (wantsDrift) {
      if (!p.isDrifting) {
        p.isDrifting = true;
        soundManager.startSkid();
      }
      p.driftAngle = THREE.MathUtils.lerp(p.driftAngle, -steerInput * 0.45, dt * 8);
      // Earn bonus nitro during high-skill drift
      p.nitro = Math.min(100, p.nitro + dt * 15);
    } else {
      if (p.isDrifting) {
        p.isDrifting = false;
        soundManager.stopSkid();
      }
      p.driftAngle = THREE.MathUtils.lerp(p.driftAngle, 0, dt * 10);
    }

    // 4. PROGRESS ALONG SPLINE & LATERAL MOVEMENT
    const progressDelta = (p.speed * dt) / this.track3D.trackLength;
    p.progress += progressDelta;

    // Lateral displacement on track
    const lateralSpeed = steerInput * stats.handlingSensitivity * (p.isDrifting ? 1.3 : 1.0) * (p.speed / 20);
    p.laneOffset += lateralSpeed * dt * 5.0;

    // Road boundaries collision (road width = 16, halfWidth = 8)
    const maxOffset = (this.track3D.roadWidth / 2) - 1.2;
    if (p.laneOffset > maxOffset) {
      p.laneOffset = maxOffset;
      p.speed *= 0.94; // Curb friction
    } else if (p.laneOffset < -maxOffset) {
      p.laneOffset = -maxOffset;
      p.speed *= 0.94;
    }

    // 5. UPDATE 3D MESH POSITION AND ORIENTATION
    const trackFrame = this.track3D.getTrackFrame(p.progress);
    const carPos = trackFrame.position.clone().add(trackFrame.binormal.clone().multiplyScalar(p.laneOffset));
    carPos.y += 0.1; // Float above tarmac
    p.worldPos.copy(carPos);
    this.playerCar3D.group.position.copy(carPos);

    // Look along tangent + steer/drift rotation
    const tangent = trackFrame.tangent;
    const baseAngle = Math.atan2(tangent.x, tangent.z);
    this.playerCar3D.group.rotation.y = baseAngle + p.steerAngle * 0.4 + p.driftAngle;
    this.playerCar3D.group.rotation.z = -p.steerAngle * 0.08 - p.driftAngle * 0.05; // Body roll

    // Update 3D Wheels
    this.playerCar3D.updateWheels(p.speed * 3.6, p.steerAngle);

    // Update Engine audio
    soundManager.updateEngine(p.speed * 3.6, isAccelerating, p.isNitro);

    // 6. CHECK COLLECTIBLES INTERSECTIONS
    this.track3D.collectibles.forEach((item) => {
      if (!item.collected) {
        const dist = carPos.distanceTo(item.position);
        if (dist < 3.2) {
          item.collected = true;
          item.mesh.visible = false;
          item.respawnTimer = 15; // Respawn in 15 seconds

          if (item.type === 'coin') {
            this.coinsCollected += 25;
            soundManager.playCoinSound();
            this.showNotification('+25 TANGA', 'coin');
          } else if (item.type === 'nitro') {
            p.nitro = Math.min(100, p.nitro + 45);
            soundManager.playNitroWhoosh();
            this.showNotification('+45% NITRO!', 'nitro');
          } else if (item.type === 'boost_pad') {
            p.boostTimer = 1.8;
            p.speed = Math.max(p.speed, stats.maxSpeedMs * 1.15);
            soundManager.playBoostPadSound();
            this.showNotification('TEZLIKNI OSHIRISH (BOOST)!', 'boost');
          }
        }
      }
    });

    // 7. LAP & CHECKPOINT DETECTION
    if (p.progress >= 1.0) {
      p.progress -= 1.0;
      p.lap++;

      const lapTime = this.elapsedTimeMs - (this.lapStartTimes[this.lapStartTimes.length - 1] || 0);
      this.lapStartTimes.push(this.elapsedTimeMs);

      if (this.bestLapTimeMs === 0 || lapTime < this.bestLapTimeMs) {
        this.bestLapTimeMs = lapTime;
      }

      if (p.lap > this.trackDef.totalLaps) {
        this.finishRace();
      } else {
        this.showNotification(`AYLANA ${p.lap} / ${this.trackDef.totalLaps}`, 'lap');
      }
    }
  }

  private updateOpponentsPhysics(dt: number) {
    this.opponentCars3D.forEach((opp, i) => {
      const s = opp.state;
      if (this.status !== 'racing') return;

      // Base AI speed with skill scaling
      const baseTopSpeed = (opp.carDef.stats.topSpeed * 0.94 * opp.speedMult) / 3.6;
      const targetSpeed = baseTopSpeed;

      s.speed = THREE.MathUtils.lerp(s.speed, targetSpeed, dt * 1.5);

      // AI Spline progress
      const progressDelta = (s.speed * dt) / this.track3D.trackLength;
      s.progress += progressDelta;

      // AI Natural weaving & overtaking line
      const time = this.elapsedTimeMs * 0.001;
      const naturalLane = Math.sin(time * 0.4 + i * 1.8) * 3.5;
      s.laneOffset = THREE.MathUtils.lerp(s.laneOffset, naturalLane, dt * 1.2);

      // Position update
      const trackFrame = this.track3D.getTrackFrame(s.progress);
      const oppPos = trackFrame.position.clone().add(trackFrame.binormal.clone().multiplyScalar(s.laneOffset));
      oppPos.y += 0.1;
      s.worldPos.copy(oppPos);
      opp.instance.group.position.copy(oppPos);

      const tan = trackFrame.tangent;
      opp.instance.group.rotation.y = Math.atan2(tan.x, tan.z);
      opp.instance.updateWheels(s.speed * 3.6, 0);

      // Lap tracking for AI
      if (s.progress >= 1.0) {
        s.progress -= 1.0;
        s.lap++;
      }

      // COLLISION WITH PLAYER
      const distToPlayer = oppPos.distanceTo(this.playerPhysics.worldPos);
      if (distToPlayer < 2.4 && this.playerPhysics.collisionCooldown <= 0) {
        this.playerPhysics.collisionCooldown = 0.5;
        soundManager.playCollisionSound();

        // Bounce player and AI apart
        const bounceDir = this.playerPhysics.worldPos.clone().sub(oppPos).normalize();
        this.playerPhysics.laneOffset += bounceDir.x * 1.5;
        this.playerPhysics.speed *= 0.9;
        s.speed *= 0.85;
      }
    });

    if (this.playerPhysics.collisionCooldown > 0) {
      this.playerPhysics.collisionCooldown -= dt;
    }
  }

  // --- CAMERA CONTROLLER ---
  private updateCamera(dt: number) {
    const p = this.playerPhysics;
    const carPos = p.worldPos;
    const trackFrame = this.track3D.getTrackFrame(p.progress);
    const tangent = trackFrame.tangent;

    const mode = this.playerProgressData.settings.cameraMode;

    if (mode === 'hood') {
      // First person bonnet camera
      const hoodPos = carPos.clone().add(new THREE.Vector3(0, 0.9, 0)).add(tangent.clone().multiplyScalar(0.8));
      this.camera.position.lerp(hoodPos, dt * 25);
      const lookTarget = hoodPos.clone().add(tangent.clone().multiplyScalar(20));
      this.camera.lookAt(lookTarget);
    } else if (mode === 'top') {
      // High overhead top-down camera
      const topPos = carPos.clone().add(new THREE.Vector3(0, 32, -4));
      this.camera.position.lerp(topPos, dt * 15);
      this.camera.lookAt(carPos);
    } else if (mode === 'close') {
      // Close chase camera
      const camOffset = tangent.clone().multiplyScalar(-5.5);
      camOffset.y += 2.2;
      const targetCamPos = carPos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, dt * 18);
      const lookTarget = carPos.clone().add(new THREE.Vector3(0, 1.2, 0)).add(tangent.clone().multiplyScalar(10));
      this.camera.lookAt(lookTarget);
    } else {
      // Default Smooth Chase Camera
      const speedLag = Math.min(2.5, p.speed / 30);
      const camOffset = tangent.clone().multiplyScalar(-8.0 - speedLag);
      camOffset.y += 3.2;
      const targetCamPos = carPos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, dt * 12);
      const lookTarget = carPos.clone().add(new THREE.Vector3(0, 1.4, 0)).add(tangent.clone().multiplyScalar(12));
      this.camera.lookAt(lookTarget);
    }

    // Dynamic FOV speed rush expansion
    const targetFov = 65 + (p.speed * 3.6 > 200 ? 12 : 0) + (p.isNitro ? 8 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 6);
    this.camera.updateProjectionMatrix();
  }

  // --- LEADERBOARD & POSITION CALCULATION ---
  private calculatePositions(): number {
    // Total score = (lap - 1) + progress
    const playerTotalScore = (this.playerPhysics.lap - 1) + this.playerPhysics.progress;

    const allScores = [
      { id: 'player', score: playerTotalScore },
      ...this.opponentCars3D.map((opp) => ({
        id: opp.name,
        score: (opp.state.lap - 1) + opp.state.progress,
      })),
    ];

    allScores.sort((a, b) => b.score - a.score);
    const rank = allScores.findIndex((s) => s.id === 'player') + 1;
    return rank;
  }

  // --- RACE FINISH ---
  private finishRace() {
    this.status = 'finished';
    soundManager.stopEngine();
    soundManager.stopSkid();
    soundManager.stopMusic();

    const position = this.calculatePositions();
    if (position <= 3) {
      soundManager.playVictoryFanfare();
    }

    const reward = POSITION_REWARDS.find((r) => r.position === position) || POSITION_REWARDS[5];
    const totalPrize = reward.coins + this.coinsCollected;

    const result: RaceResult = {
      position,
      totalTimeMs: this.elapsedTimeMs,
      bestLapMs: this.bestLapTimeMs,
      lapTimesMs: this.lapStartTimes.map((t, idx) => {
        const next = this.lapStartTimes[idx + 1] || this.elapsedTimeMs;
        return next - t;
      }),
      coinsCollected: this.coinsCollected,
      prizeCoins: totalPrize,
      isNewRecord: this.bestLapTimeMs > 0 && (!this.playerProgressData.bestLapTimes[this.trackDef.id] || this.bestLapTimeMs < this.playerProgressData.bestLapTimes[this.trackDef.id]),
    };

    if (this.onFinish) {
      this.onFinish(result);
    }
  }

  // --- MAIN RENDER LOOP ---
  private renderLoop = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. COUNTDOWN LOGIC
    if (this.status === 'countdown') {
      this.countdownTimer -= dt;

      const currentBeep = Math.ceil(this.countdownTimer);
      if (currentBeep !== this.countdownLastBeep && currentBeep >= 0) {
        this.countdownLastBeep = currentBeep;
        soundManager.playCountdownBeep(currentBeep === 0);
      }

      if (this.countdownTimer <= 0) {
        this.status = 'racing';
        this.raceStartTime = performance.now();
      }

      // Starting camera cinematic pan
      const startFrame = this.track3D.getTrackFrame(0.005);
      const camPos = startFrame.position.clone().add(new THREE.Vector3(Math.cos(this.countdownTimer * 2) * 10, 4, Math.sin(this.countdownTimer * 2) * 10));
      this.camera.position.lerp(camPos, 0.1);
      this.camera.lookAt(this.playerPhysics.worldPos);
    }

    // 2. RACING SIMULATION
    if (this.status === 'racing') {
      this.elapsedTimeMs += dt * 1000;
      this.currentLapTimeMs = this.elapsedTimeMs - (this.lapStartTimes[this.lapStartTimes.length - 1] || 0);

      this.updatePlayerPhysics(dt);
      this.updateOpponentsPhysics(dt);
      this.updateCamera(dt);
    } else if (this.status === 'finished') {
      // Decelerate slowly on finish
      this.playerPhysics.speed = Math.max(0, this.playerPhysics.speed - 12 * dt);
      this.updateCamera(dt);
    }

    // 3. UPDATE TRACK OBJECTS & NOTIFICATIONS
    this.track3D.updateCollectibles(dt);

    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) {
        this.notification = undefined;
      }
    }

    // 4. EMIT LIVE STATE FOR REACT HUD
    if (this.onStateUpdate) {
      const position = this.calculatePositions();
      const speedKmh = Math.round(Math.abs(this.playerPhysics.speed * 3.6));
      const gear = Math.min(6, Math.max(1, Math.floor(speedKmh / 55) + 1));
      const rpm = 1200 + ((speedKmh % 60) / 60) * 6500;

      this.onStateUpdate({
        status: this.status,
        speedKmh,
        rpm,
        gear,
        currentLap: Math.min(this.trackDef.totalLaps, this.playerPhysics.lap),
        totalLaps: this.trackDef.totalLaps,
        position,
        totalRacers: 6,
        nitroAmount: this.playerPhysics.nitro,
        isNitroActive: this.playerPhysics.isNitro,
        coinsCollected: this.coinsCollected,
        elapsedTimeMs: this.elapsedTimeMs,
        currentLapTimeMs: this.currentLapTimeMs,
        bestLapTimeMs: this.bestLapTimeMs,
        wrongWay: false,
        notification: this.notification,
        playerProgress: this.playerPhysics.progress,
        opponentsData: this.opponentCars3D.map((opp, idx) => ({
          id: opp.name,
          name: opp.name,
          position: idx + 1,
          progress: opp.state.progress,
          color: opp.carDef.color,
        })),
      });
    }

    // 5. RENDER SCENE
    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- CLEANUP ---
  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    soundManager.stopEngine();
    soundManager.stopSkid();
    soundManager.stopMusic();

    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
