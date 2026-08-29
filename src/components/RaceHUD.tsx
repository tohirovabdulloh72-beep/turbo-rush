import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Coins,
  Timer,
  Flag,
  Trophy,
  Pause,
  Camera,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Smartphone,
} from 'lucide-react';
import { RaceLiveState, TrackDefinition, GameSettings } from '../types';

interface RaceHUDProps {
  liveState: RaceLiveState | null;
  trackDef: TrackDefinition;
  settings: GameSettings;
  onPause: () => void;
  onCameraToggle: () => void;
  onTouchInput: (key: 'forward' | 'backward' | 'left' | 'right' | 'drift' | 'nitro', active: boolean) => void;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  liveState,
  trackDef,
  settings,
  onPause,
  onCameraToggle,
  onTouchInput,
}) => {
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
    }
    return false;
  });

  const [activeKeys, setActiveKeys] = useState<{ [k: string]: boolean }>({});

  if (!liveState) return null;

  const handlePointer = (
    key: 'forward' | 'backward' | 'left' | 'right' | 'drift' | 'nitro',
    active: boolean,
    e?: React.PointerEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveKeys((prev) => ({ ...prev, [key]: active }));
    if (active && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (err) {
        // Ignore vibration errors
      }
    }
    onTouchInput(key, active);
  };

  const {
    status,
    speedKmh,
    rpm,
    gear,
    currentLap,
    totalLaps,
    position,
    totalRacers,
    nitroAmount,
    isNitroActive,
    coinsCollected,
    elapsedTimeMs,
    currentLapTimeMs,
    notification,
    playerProgress,
    opponentsData,
  } = liveState;

  // Format milliseconds into MM:SS.ms
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-6 select-none overflow-hidden font-sans text-white">
      {/* 1. TOP BAR: Pill badges for Position/Lap, Center Timer, and Right Coins/Controls */}
      <div className="flex items-start justify-between w-full z-20">
        {/* Left: Position & Lap in Glass Pill */}
        <div className="bg-black/70 backdrop-blur-md border border-white/10 px-3 sm:px-6 py-1.5 sm:py-2 rounded-2xl sm:rounded-full flex items-center gap-2 sm:gap-4 shadow-xl">
          <div className="flex items-baseline gap-1">
            <span className="text-cyan-400 font-black italic text-xl sm:text-3xl tracking-tighter">
              {position}
            </span>
            <span className="text-white/40 text-[10px] sm:text-xs font-bold font-mono">/{totalRacers}</span>
          </div>
          <div className="w-px h-4 sm:h-5 bg-white/20" />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Flag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white/40" />
            <span className="text-white/90 font-mono text-xs sm:text-base font-bold uppercase tracking-tight">
              LAP {currentLap}/{totalLaps}
            </span>
          </div>
        </div>

        {/* Center: Live Race Timer Pill */}
        <div className="bg-black/70 backdrop-blur-md border border-white/10 px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-2xl sm:rounded-full flex items-center gap-2 sm:gap-2.5 shadow-xl">
          <Timer className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
          <span className="text-white font-mono text-sm sm:text-xl font-bold tracking-tight">
            {formatTime(elapsedTimeMs)}
          </span>
        </div>

        {/* Right: Coins & Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
          {/* Coins Badge */}
          <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg">
            <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)] animate-pulse" />
            <Coins className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-400" />
            <span className="text-xs sm:text-base font-bold text-yellow-400">+{coinsCollected}</span>
          </div>

          {/* Toggle Touch Controls */}
          <button
            onClick={() => setShowTouchControls((prev) => !prev)}
            className={`w-9 sm:w-10 h-9 sm:h-10 backdrop-blur-md border rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              showTouchControls
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Telefon boshqaruv tugmalari"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Camera View Switch */}
          <button
            onClick={onCameraToggle}
            className="w-9 sm:w-10 h-9 sm:h-10 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 rounded-2xl flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-lg"
            title="Kamera ko‘rinishini o‘zgartirish"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-9 sm:w-10 h-9 sm:h-10 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 rounded-2xl flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-lg"
            title="Pauza"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER NOTIFICATION POPUP */}
      {notification && (
        <div className="self-center flex items-center justify-center animate-bounce z-20 my-auto">
          <div
            className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-2xl border text-sm sm:text-lg font-black italic tracking-wide shadow-2xl backdrop-blur-xl flex items-center gap-2.5 ${
              notification.type === 'nitro'
                ? 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                : notification.type === 'coin'
                ? 'bg-amber-500/90 border-amber-300 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                : notification.type === 'lap'
                ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                : 'bg-cyan-500/90 border-cyan-300 text-black shadow-[0_0_30px_rgba(6,182,212,0.5)]'
            }`}
          >
            {notification.type === 'nitro' && <Flame className="w-4 sm:w-5 h-4 sm:h-5 animate-pulse" />}
            {notification.type === 'coin' && <Coins className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />}
            {notification.type === 'boost' && <Zap className="w-4 sm:w-5 h-4 sm:h-5 animate-pulse" />}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* 3. RADAR / MINI-MAP TRACK PROGRESS */}
      <div className="absolute left-3 top-20 hidden md:flex flex-col items-center bg-black/50 backdrop-blur-xl border border-white/5 rounded-3xl p-3 shadow-2xl w-28 lg:w-32 z-10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1.5">RADAR</span>
        <div className="w-full h-36 lg:h-44 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between py-2 items-center">
          {/* Finish Line */}
          <div className="absolute top-1 w-full flex items-center justify-center">
            <span className="text-[9px] font-black italic text-amber-400 tracking-wider">FINISH</span>
          </div>

          {/* Player Indicator */}
          <div
            className="absolute w-3.5 h-3.5 bg-cyan-400 border-2 border-white rounded-full shadow-[0_0_10px_rgba(34,211,238,1)] transition-all duration-75"
            style={{
              bottom: `${Math.min(92, Math.max(8, playerProgress * 100))}%`,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />

          {/* Opponent Indicators */}
          {opponentsData.map((opp, idx) => (
            <div
              key={opp.id}
              className="absolute w-2.5 h-2.5 rounded-full border border-black/80 transition-all duration-100"
              style={{
                backgroundColor: opp.color,
                bottom: `${Math.min(92, Math.max(8, opp.progress * 100))}%`,
                left: `${30 + (idx % 3) * 20}%`,
              }}
            />
          ))}

          {/* Start Line */}
          <div className="absolute bottom-1 w-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white/30">START</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM BAR: SPEEDOMETER, NITRO, & PHONE TOUCH CONTROLS */}
      <div className="flex items-end justify-between w-full z-20 gap-2">
        {/* Mobile Left Controls (A - Steer Left / D - Steer Right) */}
        {showTouchControls && (
          <div className="flex gap-2 sm:gap-3 pointer-events-auto items-end pb-1" style={{ touchAction: 'none' }}>
            {/* A Key / CHAPGA */}
            <button
              type="button"
              onPointerDown={(e) => handlePointer('left', true, e)}
              onPointerUp={(e) => handlePointer('left', false, e)}
              onPointerCancel={(e) => handlePointer('left', false, e)}
              onPointerLeave={(e) => handlePointer('left', false, e)}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-16 sm:w-20 h-16 sm:h-20 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-2xl active:scale-95 ${
                activeKeys['left']
                  ? 'bg-cyan-500/50 border-cyan-300 text-white shadow-[0_0_25px_rgba(6,182,212,0.8)] scale-95'
                  : 'bg-black/60 border-white/20 text-white/90 hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center gap-1 font-black text-base sm:text-lg">
                <ChevronLeft className="w-6 sm:w-7 h-6 sm:h-7" />
                <span>A</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                CHAPGA
              </span>
            </button>

            {/* D Key / O'NGA */}
            <button
              type="button"
              onPointerDown={(e) => handlePointer('right', true, e)}
              onPointerUp={(e) => handlePointer('right', false, e)}
              onPointerCancel={(e) => handlePointer('right', false, e)}
              onPointerLeave={(e) => handlePointer('right', false, e)}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-16 sm:w-20 h-16 sm:h-20 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-2xl active:scale-95 ${
                activeKeys['right']
                  ? 'bg-cyan-500/50 border-cyan-300 text-white shadow-[0_0_25px_rgba(6,182,212,0.8)] scale-95'
                  : 'bg-black/60 border-white/20 text-white/90 hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center gap-1 font-black text-base sm:text-lg">
                <span>D</span>
                <ChevronRight className="w-6 sm:w-7 h-6 sm:h-7" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                O‘NGA
              </span>
            </button>
          </div>
        )}

        {/* Speedometer, RPM & Nitro Panel (Center Glass Card) */}
        <div className="flex flex-col items-center mx-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-2xl max-w-xs sm:max-w-none">
          {/* Digital Speed & Gear */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-3xl sm:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              {speedKmh}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-[10px] sm:text-xs uppercase text-white/40 font-bold">KM/H</span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-cyan-400 font-mono">GEAR {gear}</span>
            </div>
          </div>

          {/* Speed / RPM Bar */}
          <div className="w-36 sm:w-64 h-1.5 bg-white/10 rounded-full overflow-hidden my-1.5 sm:my-2">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                rpm > 6500
                  ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
              }`}
              style={{ width: `${Math.min(100, (rpm / 8000) * 100)}%` }}
            />
          </div>

          {/* Nitro Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 w-full mt-0.5 sm:mt-1">
            <Flame className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isNitroActive ? 'text-orange-400 animate-pulse' : 'text-orange-400/60'}`} />
            <div className="flex-1 h-2 sm:h-2.5 bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-100 rounded-full ${
                  isNitroActive
                    ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-white animate-pulse shadow-[0_0_12px_rgba(249,115,22,1)]'
                    : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                }`}
                style={{ width: `${nitroAmount}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-orange-400 w-7 sm:w-8 text-right">
              {Math.round(nitroAmount)}%
            </span>
          </div>

          {/* Keyboard & Phone Control Helpers */}
          <div className="hidden lg:flex items-center gap-2.5 mt-2.5 text-[9px] text-white/50 font-bold uppercase tracking-wider">
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white mr-1">W / ↑</kbd> Oldinga (Tekis)</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white mr-1">A</kbd> Chapga</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white mr-1">D</kbd> O‘nga</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white mr-1">S / ↓</kbd> Tormoz</span>
          </div>
        </div>

        {/* Mobile Right Controls (W - Gaz/Oldinga, S - Tormoz, Drift, Nitro) */}
        {showTouchControls && (
          <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto items-end pb-1" style={{ touchAction: 'none' }}>
            {/* Nitro & Drift Row */}
            <div className="flex gap-1.5 sm:gap-2 justify-end">
              <button
                type="button"
                onPointerDown={(e) => handlePointer('drift', true, e)}
                onPointerUp={(e) => handlePointer('drift', false, e)}
                onPointerCancel={(e) => handlePointer('drift', false, e)}
                onPointerLeave={(e) => handlePointer('drift', false, e)}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-xl active:scale-95 ${
                  activeKeys['drift']
                    ? 'bg-amber-500/50 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-95'
                    : 'bg-black/60 border-amber-500/30 text-amber-400'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">DRIFT</span>
              </button>

              <button
                type="button"
                onPointerDown={(e) => handlePointer('nitro', true, e)}
                onPointerUp={(e) => handlePointer('nitro', false, e)}
                onPointerCancel={(e) => handlePointer('nitro', false, e)}
                onPointerLeave={(e) => handlePointer('nitro', false, e)}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-xl active:scale-95 ${
                  activeKeys['nitro']
                    ? 'bg-orange-500/70 border-orange-300 text-white shadow-[0_0_25px_rgba(249,115,22,1)] scale-95'
                    : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                }`}
              >
                <Flame className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase">NITRO</span>
              </button>
            </div>

            {/* S - Brake & W - Forward Gas Row */}
            <div className="flex gap-1.5 sm:gap-2 justify-end items-end">
              {/* S Key / TORMOZ */}
              <button
                type="button"
                onPointerDown={(e) => handlePointer('backward', true, e)}
                onPointerUp={(e) => handlePointer('backward', false, e)}
                onPointerCancel={(e) => handlePointer('backward', false, e)}
                onPointerLeave={(e) => handlePointer('backward', false, e)}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-xl active:scale-95 ${
                  activeKeys['backward']
                    ? 'bg-red-600/60 border-red-400 text-white shadow-[0_0_25px_rgba(239,68,68,0.9)] scale-95'
                    : 'bg-black/60 border-red-500/30 text-red-400'
                }`}
              >
                <div className="flex items-center gap-1 font-black text-sm sm:text-base">
                  <ArrowDown className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span>S</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider">TORMOZ</span>
              </button>

              {/* W Key / OLDINGA (GAZ) */}
              <button
                type="button"
                onPointerDown={(e) => handlePointer('forward', true, e)}
                onPointerUp={(e) => handlePointer('forward', false, e)}
                onPointerCancel={(e) => handlePointer('forward', false, e)}
                onPointerLeave={(e) => handlePointer('forward', false, e)}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-18 sm:w-22 h-18 sm:h-22 rounded-2xl backdrop-blur-xl border flex flex-col items-center justify-center transition-all select-none shadow-2xl active:scale-95 ${
                  activeKeys['forward']
                    ? 'bg-cyan-400 text-black border-white shadow-[0_0_30px_rgba(34,211,238,1)] scale-95'
                    : 'bg-cyan-500/30 border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/40'
                }`}
              >
                <div className="flex items-center gap-1 font-black text-lg sm:text-xl">
                  <ArrowUp className="w-5 sm:w-6 h-5 sm:h-6" />
                  <span>W</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  OLDINGA (GAZ)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
