import { CarDefinition, TrackDefinition, PlayerProgress, RaceOpponent } from '../types';

export const CARS_CATALOG: CarDefinition[] = [
  {
    id: 'apex_gt',
    name: 'Apex GT',
    uzName: 'Apex GT',
    category: 'Sport Kupe',
    price: 0,
    unlockedByDefault: true,
    requiredWins: 0,
    stats: {
      topSpeed: 230,
      acceleration: 6.5,
      handling: 7.0,
      nitroBoost: 6.0,
    },
    color: '#ef4444',
    availableColors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#18181b'],
    description: 'Balanced street racer with solid aerodynamics and agile handling.',
    uzDescription: 'Har tomonlama muvozanatli, oson boshqariladigan sport kupe mashinasi.',
    modelStyle: 'coupe',
    wheelColor: '#334155',
    neonColor: '#ef4444',
  },
  {
    id: 'phantom_zx',
    name: 'Phantom ZX',
    uzName: 'Phantom ZX',
    category: 'Superkar',
    price: 1500,
    unlockedByDefault: false,
    requiredWins: 1,
    stats: {
      topSpeed: 260,
      acceleration: 7.8,
      handling: 7.5,
      nitroBoost: 7.0,
    },
    color: '#eab308',
    availableColors: ['#eab308', '#06b6d4', '#ec4899', '#f97316', '#22c55e', '#ffffff'],
    description: 'High-revving mid-engine supercar built for razor-sharp corners.',
    uzDescription: 'Tezlanishi juda yuqori, burilishlarda o‘ta chaqqon superkar.',
    modelStyle: 'supercar',
    wheelColor: '#1e293b',
    neonColor: '#eab308',
  },
  {
    id: 'inferno_spider',
    name: 'Inferno Spider',
    uzName: 'Inferno Spider',
    category: 'Giperkar',
    price: 3500,
    unlockedByDefault: false,
    requiredWins: 3,
    stats: {
      topSpeed: 295,
      acceleration: 8.5,
      handling: 8.0,
      nitroBoost: 8.5,
    },
    color: '#f97316',
    availableColors: ['#f97316', '#dc2626', '#6366f1', '#14b8a6', '#f43f5e', '#0f172a'],
    description: 'Aerodynamic twin-turbo beast that dominates long straights.',
    uzDescription: 'Ikkita turbo dvigatelli, to‘g‘ri yo‘llarda eng yuqori tezlik beruvchi giperkar.',
    modelStyle: 'exotic',
    wheelColor: '#0f172a',
    neonColor: '#f97316',
  },
  {
    id: 'cyber_hyper',
    name: 'Cyber Hyper',
    uzName: 'Cyber Hyper',
    category: 'Elektro-Giper',
    price: 6500,
    unlockedByDefault: false,
    requiredWins: 5,
    stats: {
      topSpeed: 325,
      acceleration: 9.3,
      handling: 8.8,
      nitroBoost: 9.2,
    },
    color: '#06b6d4',
    availableColors: ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#e2e8f0'],
    description: 'Next-gen electric hypercar with instantaneous torque and active aero.',
    uzDescription: 'Kelajak texnologiyasiga ega elektr giperkar, bir lahzada maksimal tezlikka chiqadi.',
    modelStyle: 'cyber',
    wheelColor: '#09090b',
    neonColor: '#06b6d4',
  },
  {
    id: 'vortex_f1',
    name: 'Vortex Formula',
    uzName: 'Vortex Formula',
    category: 'Formula Poygachi',
    price: 11000,
    unlockedByDefault: false,
    requiredWins: 8,
    stats: {
      topSpeed: 350,
      acceleration: 9.8,
      handling: 9.7,
      nitroBoost: 9.6,
    },
    color: '#10b981',
    availableColors: ['#10b981', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#09090b'],
    description: 'Ultimate open-wheel racing machine with extreme aerodynamic grip.',
    uzDescription: 'Cheksiz bosim kuchi va aqlbovar qilmas tezlikka ega haqiqiy formula poygachisi.',
    modelStyle: 'formula',
    wheelColor: '#18181b',
    neonColor: '#10b981',
  },
  {
    id: 'titan_beast',
    name: 'Titan Beast',
    uzName: 'Titan Beast',
    category: 'Maskl Poygachi',
    price: 16000,
    unlockedByDefault: false,
    requiredWins: 12,
    stats: {
      topSpeed: 375,
      acceleration: 9.5,
      handling: 8.5,
      nitroBoost: 10.0,
    },
    color: '#8b5cf6',
    availableColors: ['#8b5cf6', '#dc2626', '#f59e0b', '#06b6d4', '#18181b', '#ffffff'],
    description: 'V8 Supercharged muscle colossus that crushes competitors with pure brute power.',
    uzDescription: 'V8 kompressorli qudratli monstr, nitro yoqilganda yo‘ldagi barcha raqiblarni ortda qoldiradi.',
    modelStyle: 'muscle',
    wheelColor: '#18181b',
    neonColor: '#8b5cf6',
  },
];

export const TRACKS_CATALOG: TrackDefinition[] = [
  {
    id: 'dumaloq_arena',
    name: 'Ring Speedway',
    uzName: 'Dumaloq Trassa (Ring)',
    theme: 'ring',
    difficulty: 'Oson',
    lengthKm: 2.2,
    totalLaps: 3,
    price: 0,
    unlockedByDefault: true,
    requiredWins: 0,
    description: 'Continuous circular stadium ring speedway designed for high-speed circular laps and smooth steering.',
    uzDescription: 'Dumaloq stadion ring trassasi. Oson boshqaruv, yuqori tezlik va cheksiz aylanma poyga!',
    skyColor: 0x0f172a,
    fogColor: 0x1e1b4b,
    groundColor: 0x09090b,
    roadColor: 0x18181b,
    curbColor1: 0x06b6d4,
    curbColor2: 0xf59e0b,
    sunColor: 0x38bdf8,
    ambientColor: 0x818cf8,
    bannerColor: '#06b6d4',
  },
  {
    id: 'city_sprint',
    name: 'City Sprint',
    uzName: 'Shahar Poygasi',
    theme: 'city',
    difficulty: 'Oson',
    lengthKm: 2.8,
    totalLaps: 2,
    price: 0,
    unlockedByDefault: true,
    requiredWins: 0,
    description: 'Wide asphalt city streets through modern skyscrapers and flyovers.',
    uzDescription: 'Katta shahar ko‘chalari va osmono‘par binolar orasidagi keng va tezkor yo‘l.',
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    groundColor: 0x334155,
    roadColor: 0x1e293b,
    curbColor1: 0xef4444,
    curbColor2: 0xf8fafc,
    sunColor: 0xffedd5,
    ambientColor: 0x94a3b8,
    bannerColor: '#3b82f6',
  },
  {
    id: 'desert_canyon',
    name: 'Desert Canyon',
    uzName: 'Cho‘l Kanyoni',
    theme: 'desert',
    difficulty: 'O‘rta',
    lengthKm: 3.4,
    totalLaps: 2,
    price: 1200,
    unlockedByDefault: false,
    requiredWins: 1,
    description: 'Blazing red rocks, dust storms, sandy dunes and dramatic canyon curves.',
    uzDescription: 'Qizil qoyalar, qumtepalar va kanyonlar orasidagi qizg‘in va changli poyga yo‘li.',
    skyColor: 0xfdba74,
    fogColor: 0xfed7aa,
    groundColor: 0x9a3412,
    roadColor: 0x292524,
    curbColor1: 0xf59e0b,
    curbColor2: 0xfafaf9,
    sunColor: 0xffedd5,
    ambientColor: 0xfde047,
    bannerColor: '#f97316',
  },
  {
    id: 'mountain_pass',
    name: 'Mountain Pass',
    uzName: 'Tog‘ Dovoni',
    theme: 'mountain',
    difficulty: 'Qiyin',
    lengthKm: 3.9,
    totalLaps: 2,
    price: 2500,
    unlockedByDefault: false,
    requiredWins: 3,
    description: 'Elevated serpentine mountain roads, pine forests and snow-capped horizons.',
    uzDescription: 'Baland tog‘lar, archazorlar va xavfli ilonizi burilishlarga ega tog‘ yo‘li.',
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    groundColor: 0x14532d,
    roadColor: 0x1f2937,
    curbColor1: 0xef4444,
    curbColor2: 0xffffff,
    sunColor: 0xffffff,
    ambientColor: 0xa7f3d0,
    bannerColor: '#10b981',
  },
  {
    id: 'cyber_night',
    name: 'Cyber Night City',
    uzName: 'Tungi Cyber Shahar',
    theme: 'night_city',
    difficulty: 'Ekstremal',
    lengthKm: 4.5,
    totalLaps: 2,
    price: 4500,
    unlockedByDefault: false,
    requiredWins: 5,
    description: 'Futuristic neon metropolis drenched in vibrant cyber lights and wet tarmac reflections.',
    uzDescription: 'Neon nurlari bilan yoritilgan tungi kelajak shahri. Tezlik va yorqin effektlar makoni!',
    skyColor: 0x050510,
    fogColor: 0x0b0f24,
    groundColor: 0x09090b,
    roadColor: 0x111827,
    curbColor1: 0x06b6d4,
    curbColor2: 0xd946ef,
    sunColor: 0x818cf8,
    ambientColor: 0x6366f1,
    bannerColor: '#a855f7',
  },
];

export const OPPONENTS_LIST: RaceOpponent[] = [
  {
    id: 'opp_1',
    name: 'Viper (Tezkor)',
    carId: 'phantom_zx',
    color: '#eab308',
    speedMultiplier: 1.02,
    aggression: 0.8,
    skill: 0.9,
  },
  {
    id: 'opp_2',
    name: 'Ghost (Soya)',
    carId: 'cyber_hyper',
    color: '#06b6d4',
    speedMultiplier: 0.98,
    aggression: 0.6,
    skill: 0.85,
  },
  {
    id: 'opp_3',
    name: 'Blaze (Olov)',
    carId: 'inferno_spider',
    color: '#f97316',
    speedMultiplier: 1.0,
    aggression: 0.9,
    skill: 0.88,
  },
  {
    id: 'opp_4',
    name: 'Nitro (Shamol)',
    carId: 'apex_gt',
    color: '#3b82f6',
    speedMultiplier: 0.95,
    aggression: 0.5,
    skill: 0.78,
  },
  {
    id: 'opp_5',
    name: 'Rex (Qoplon)',
    carId: 'titan_beast',
    color: '#8b5cf6',
    speedMultiplier: 0.92,
    aggression: 0.75,
    skill: 0.75,
  },
];

export const UPGRADE_PRICES = {
  speed: [300, 700, 1400, 2500, 4500],
  acceleration: [250, 600, 1200, 2200, 4000],
  handling: [200, 500, 1000, 1800, 3500],
  nitro: [250, 600, 1200, 2200, 4000],
};

export const UPGRADE_BOOSTS = {
  speedPerLevel: 12,       // +12 km/h per level
  accelPerLevel: 0.5,      // +0.5 accel stat
  handlingPerLevel: 0.4,   // +0.4 handling stat
  nitroPerLevel: 0.6,      // +0.6 nitro stat
};

export const POSITION_REWARDS = [
  { position: 1, coins: 600, label: '1-O‘rin (G‘alaba!)', badge: '🥇' },
  { position: 2, coins: 350, label: '2-O‘rin', badge: '🥈' },
  { position: 3, coins: 200, label: '3-O‘rin', badge: '🥉' },
  { position: 4, coins: 100, label: '4-O‘rin', badge: '4️⃣' },
  { position: 5, coins: 60,  label: '5-O‘rin', badge: '5️⃣' },
  { position: 6, coins: 30,  label: '6-O‘rin', badge: '6️⃣' },
];

const LOCAL_STORAGE_KEY = 'turbo_rush_save_v1';

export function getInitialProgress(): PlayerProgress {
  const defaultProgress: PlayerProgress = {
    coins: 500, // starting bonus coins
    totalWins: 0,
    totalRaces: 0,
    unlockedCars: ['apex_gt'],
    unlockedTracks: ['dumaloq_arena', 'city_sprint'],
    selectedCarId: 'apex_gt',
    selectedTrackId: 'dumaloq_arena',
    carUpgrades: {
      apex_gt: { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0 },
    },
    carColors: {
      apex_gt: '#ef4444',
    },
    bestLapTimes: {},
    settings: {
      soundVolume: 0.8,
      musicVolume: 0.5,
      cameraMode: 'chase',
      graphicsQuality: 'high',
      controlScheme: 'wasd',
      language: 'uz',
    },
  };

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProgress,
        ...parsed,
        settings: { ...defaultProgress.settings, ...(parsed.settings || {}) },
        carUpgrades: { ...defaultProgress.carUpgrades, ...(parsed.carUpgrades || {}) },
        carColors: { ...defaultProgress.carColors, ...(parsed.carColors || {}) },
      };
    }
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
  }

  return defaultProgress;
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}
