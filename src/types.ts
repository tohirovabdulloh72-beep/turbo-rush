export interface CarStats {
  topSpeed: number;     // km/h base
  acceleration: number; // 0-100 time factor (higher is better)
  handling: number;     // turning responsiveness (1-10)
  nitroBoost: number;   // extra boost power (1-10)
}

export interface CarUpgradeState {
  speedLevel: number;      // 0 to 5
  accelLevel: number;      // 0 to 5
  handlingLevel: number;   // 0 to 5
  nitroLevel: number;      // 0 to 5
}

export interface CarDefinition {
  id: string;
  name: string;
  uzName: string;
  category: string;
  price: number;
  unlockedByDefault: boolean;
  requiredWins: number;
  stats: CarStats;
  color: string;
  availableColors: string[];
  description: string;
  uzDescription: string;
  modelStyle: 'coupe' | 'supercar' | 'exotic' | 'cyber' | 'formula' | 'muscle';
  wheelColor?: string;
  neonColor?: string;
}

export interface TrackDefinition {
  id: string;
  name: string;
  uzName: string;
  theme: 'ring' | 'city' | 'desert' | 'mountain' | 'night_city';
  difficulty: 'Oson' | 'O‘rta' | 'Qiyin' | 'Ekstremal';
  lengthKm: number;
  totalLaps: number;
  price: number;
  unlockedByDefault: boolean;
  requiredWins: number;
  description: string;
  uzDescription: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  roadColor: number;
  curbColor1: number;
  curbColor2: number;
  sunColor: number;
  ambientColor: number;
  bannerColor: string;
}

export interface RaceOpponent {
  id: string;
  name: string;
  carId: string;
  color: string;
  speedMultiplier: number;
  aggression: number;
  skill: number;
}

export interface RaceResult {
  position: number;
  totalTimeMs: number;
  bestLapMs: number;
  lapTimesMs: number[];
  coinsCollected: number;
  prizeCoins: number;
  isNewRecord: boolean;
  unlockedNewItem?: string;
}

export interface PlayerProgress {
  coins: number;
  totalWins: number;
  totalRaces: number;
  unlockedCars: string[];
  unlockedTracks: string[];
  selectedCarId: string;
  selectedTrackId: string;
  carUpgrades: Record<string, CarUpgradeState>;
  carColors: Record<string, string>;
  bestLapTimes: Record<string, number>;
  settings: GameSettings;
}

export interface GameSettings {
  soundVolume: number;    // 0 to 1
  musicVolume: number;    // 0 to 1
  cameraMode: 'chase' | 'close' | 'hood' | 'top';
  graphicsQuality: 'high' | 'medium' | 'low';
  controlScheme: 'wasd' | 'arrows' | 'touch';
  language: 'uz' | 'en';
}

export interface RaceLiveState {
  status: 'countdown' | 'racing' | 'finished' | 'paused';
  speedKmh: number;
  rpm: number;
  gear: number;
  currentLap: number;
  totalLaps: number;
  position: number;
  totalRacers: number;
  nitroAmount: number; // 0 to 100
  isNitroActive: boolean;
  coinsCollected: number;
  elapsedTimeMs: number;
  currentLapTimeMs: number;
  bestLapTimeMs: number;
  wrongWay: boolean;
  notification?: {
    id: number;
    text: string;
    type: 'boost' | 'coin' | 'lap' | 'warn' | 'nitro';
  };
  opponentsData: {
    id: string;
    name: string;
    position: number;
    progress: number;
    color: string;
  }[];
  playerProgress: number; // 0 to 1 along the track
}
