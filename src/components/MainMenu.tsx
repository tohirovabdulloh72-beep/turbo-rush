import React from 'react';
import {
  Play,
  Car,
  Wrench,
  Map,
  Settings,
  Coins,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  Compass,
} from 'lucide-react';
import { PlayerProgress, CarDefinition, TrackDefinition } from '../types';
import { CARS_CATALOG, TRACKS_CATALOG, UPGRADE_BOOSTS } from '../game/constants';
import { CarPreview3D } from './CarPreview3D';
import { soundManager } from '../game/audio';

interface MainMenuProps {
  progress: PlayerProgress;
  onStartRace: () => void;
  onOpenGarage: () => void;
  onOpenUpgrades: () => void;
  onOpenTracks: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onStartRace,
  onOpenGarage,
  onOpenUpgrades,
  onOpenTracks,
  onOpenSettings,
}) => {
  const selectedCar = CARS_CATALOG.find((c) => c.id === progress.selectedCarId) || CARS_CATALOG[0];
  const selectedTrack = TRACKS_CATALOG.find((t) => t.id === progress.selectedTrackId) || TRACKS_CATALOG[0];
  const upgrades = progress.carUpgrades[selectedCar.id] || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0 };
  const carColor = progress.carColors[selectedCar.id] || selectedCar.color;

  const currentSpeed = selectedCar.stats.topSpeed + (upgrades.speedLevel * UPGRADE_BOOSTS.speedPerLevel);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 select-none font-sans overflow-hidden bg-[#050508] text-white"
      style={{ background: 'radial-gradient(circle at 50% 120%, #1a1a2e 0%, #050508 70%)' }}
    >
      {/* Immersive Road Perspective Illusion Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Distant Perspective Road */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-[#0c0c16] opacity-60"
          style={{
            clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            background: 'linear-gradient(to top, #161625 0%, #0c0c16 100%)',
            borderTop: '2px solid #3f3f5a',
          }}
        />
        {/* Dashed Center Stripes */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[6px] h-[400px] opacity-40"
          style={{
            clipPath: 'polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)',
            background: 'repeating-linear-gradient(to top, #facc15 0, #facc15 40px, transparent 40px, transparent 80px)',
          }}
        />
        {/* Distant Tail Lights Glow */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-24 bg-red-600 rounded-t-xl blur-2xl opacity-25 shadow-[0_-20px_60px_rgba(220,38,38,0.8)]" />

        {/* Ambient Neon Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* 1. TOP HEADER: Title, Stats, Coins, Settings */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Title */}
        <div className="flex flex-col">
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 uppercase leading-none">
            TURBO RUSH
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-white/40 mt-1 font-bold">
            EXTREME ARCADE RACING • 3D POYGA
          </p>
        </div>

        {/* User Stats, Coins & Settings */}
        <div className="flex items-center gap-3">
          {/* Trophies / Wins */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full flex items-center gap-3 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black italic text-amber-400">{progress.totalWins}</span>
              <span className="text-[10px] tracking-wider uppercase text-white/50 font-bold">G‘alaba</span>
            </div>
          </div>

          {/* Coins Balance */}
          <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-5 py-2 rounded-full flex items-center gap-2.5 shadow-lg">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)] animate-pulse" />
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-base font-bold text-yellow-400">
              {progress.coins.toLocaleString()}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="w-11 h-11 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 rounded-2xl flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-lg"
            title="Sozlamalar"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CENTER SHOWROOM: 3D Car Model Preview + Floating Glass Stats */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-4">
        {/* Left Side: Active Car Stats Card (4 cols) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">{selectedCar.category}</span>
              <h3 className="text-2xl font-black italic tracking-tight text-white">{selectedCar.uzName}</h3>
            </div>
            <div className="w-5 h-5 rounded-full border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: carColor }} />
          </div>

          <p className="text-xs text-white/60 mt-3 line-clamp-2 leading-relaxed">{selectedCar.uzDescription}</p>

          {/* Quick Specs Bars */}
          <div className="space-y-3.5 mt-5">
            <div>
              <div className="flex justify-between items-end text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Tezlik
                </span>
                <span className="font-mono text-cyan-400 font-bold">{currentSpeed} km/h</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] rounded-full transition-all duration-300"
                  style={{ width: `${(currentSpeed / 400) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Tezlanish
                </span>
                <span className="font-mono text-amber-400 font-bold">Lvl {upgrades.accelLevel}/5</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] rounded-full transition-all duration-300"
                  style={{ width: `${(selectedCar.stats.acceleration * 10)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                  <Compass className="w-3.5 h-3.5 text-blue-400" /> Boshqaruv
                </span>
                <span className="font-mono text-blue-400 font-bold">Lvl {upgrades.handlingLevel}/5</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] rounded-full transition-all duration-300"
                  style={{ width: `${(selectedCar.stats.handling * 10)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenGarage();
              }}
              className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 text-white/80 hover:text-white"
            >
              <Car className="w-4 h-4 text-cyan-400" /> Garaj
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenUpgrades();
              }}
              className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 text-white/80 hover:text-white"
            >
              <Wrench className="w-4 h-4 text-amber-400" /> Yangilash
            </button>
          </div>
        </div>

        {/* Center 3D Car Showroom (8 cols or full on mobile) */}
        <div className="lg:col-span-8 h-64 sm:h-96 w-full relative flex items-center justify-center">
          <CarPreview3D carDef={selectedCar} customColor={carColor} autoRotate={true} />

          {/* Quick Track Pill Overlay */}
          <div
            onClick={() => {
              soundManager.playClick();
              onOpenTracks();
            }}
            className="absolute bottom-2 right-2 sm:right-6 bg-black/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/50 cursor-pointer px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl transition active:scale-95 group"
          >
            <Map className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Xarita / Track</div>
              <div className="text-sm font-black italic tracking-tight text-white">{selectedTrack.uzName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION: Immersive Action Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-5xl mx-auto items-center">
        {/* START RACE (Hero Button) */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartRace();
          }}
          className="col-span-2 sm:col-span-2 py-4 px-8 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-lg sm:text-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 border border-cyan-300/40"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>START RACE</span>
        </button>

        {/* GARAGE */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenGarage();
          }}
          className="bg-white/5 border border-white/10 py-4 rounded-xl text-xs uppercase font-bold tracking-widest text-white/90 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Car className="w-4 h-4 text-cyan-400" />
          <span>GARAGE</span>
        </button>

        {/* UPGRADES */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenUpgrades();
          }}
          className="bg-white/5 border border-white/10 py-4 rounded-xl text-xs uppercase font-bold tracking-widest text-white/90 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>UPGRADES</span>
        </button>

        {/* TRACKS */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenTracks();
          }}
          className="bg-white/5 border border-white/10 py-4 rounded-xl text-xs uppercase font-bold tracking-widest text-white/90 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Map className="w-4 h-4 text-emerald-400" />
          <span>TRACKS</span>
        </button>
      </div>

      {/* Ambient Bottom Edge Glow */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none" />
    </div>
  );
};
