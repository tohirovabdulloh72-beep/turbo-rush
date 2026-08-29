import React, { useState } from 'react';
import { X, Lock, Check, Sparkles, Coins, Trophy, Gauge, Zap, Compass, Flame } from 'lucide-react';
import { CarDefinition, PlayerProgress } from '../types';
import { CARS_CATALOG } from '../game/constants';
import { CarPreview3D } from './CarPreview3D';
import { soundManager } from '../game/audio';

interface GarageModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string) => void;
  onSelectColor: (carId: string, color: string) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  progress,
  onClose,
  onSelectCar,
  onUnlockCar,
  onSelectColor,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const idx = CARS_CATALOG.findIndex((c) => c.id === progress.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const car = CARS_CATALOG[selectedIdx];
  const isUnlocked = progress.unlockedCars.includes(car.id);
  const isSelected = progress.selectedCarId === car.id;
  const activeColor = progress.carColors[car.id] || car.color;

  const canAfford = progress.coins >= car.price;
  const meetsWins = progress.totalWins >= car.requiredWins;

  const handleBuy = () => {
    if (canAfford) {
      soundManager.playVictoryFanfare();
      onUnlockCar(car.id);
    }
  };

  const handleEquip = () => {
    soundManager.playClick();
    onSelectCar(car.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase">
                GARAJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">/ GARAGE</span>
              </h2>
              <p className="text-xs text-white/50 font-semibold tracking-wide">
                Mashinalarni ko‘ring, yangilarini oching va bo‘yang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins Display */}
            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)]" />
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-base font-bold text-yellow-400">{progress.coins.toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left 3D View, Right Stats & Car Carousel */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 p-4 sm:p-6 gap-6">
          {/* Left: 3D Car Turntable & Color Palette (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 sm:p-6">
            <div className="h-64 sm:h-80 w-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#121220] to-[#080810] border border-white/5 shadow-inner">
              <CarPreview3D carDef={car} customColor={activeColor} autoRotate={true} />
              
              {/* Model Category Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                {car.category}
              </div>

              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                  <div className="p-4 rounded-full bg-white/5 border border-yellow-500/40 text-yellow-400 mb-3 shadow-lg">
                    <Lock className="w-8 h-8" />
                  </div>
                  <span className="text-lg font-black italic tracking-tight text-white uppercase">MASHINA QULFLANGAN</span>
                  <span className="text-xs text-white/60 mt-1 font-semibold">
                    {car.requiredWins > 0 && `${car.requiredWins} ta g‘alaba yoki `}{car.price.toLocaleString()} tanga
                  </span>
                </div>
              )}
            </div>

            {/* Color Palette Selector */}
            <div className="mt-5 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                RANG TANLASH / PAINT COLOR
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {car.availableColors.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectColor(car.id, hex);
                    }}
                    className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-md border-2 ${
                      activeColor === hex ? 'scale-110 border-white ring-2 ring-cyan-400' : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {activeColor === hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Stats, Descriptions, Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 sm:p-6">
            <div>
              <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">{car.uzName}</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{car.category}</span>
              </div>
              <p className="text-xs text-white/60 mt-3 font-medium leading-relaxed">
                {car.uzDescription}
              </p>

              {/* Stats Bars */}
              <div className="mt-5 space-y-3.5">
                {/* Top Speed */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Tezlik (Top Speed)
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{car.stats.topSpeed} km/h</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] rounded-full" style={{ width: `${(car.stats.topSpeed / 400) * 100}%` }} />
                  </div>
                </div>

                {/* Acceleration */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Tezlanish (Accel)
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{car.stats.acceleration * 10} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] rounded-full" style={{ width: `${car.stats.acceleration * 10}%` }} />
                  </div>
                </div>

                {/* Handling */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                      <Compass className="w-3.5 h-3.5 text-blue-400" /> Boshqaruv (Handling)
                    </span>
                    <span className="font-mono text-blue-400 font-bold">{car.stats.handling * 10} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] rounded-full" style={{ width: `${car.stats.handling * 10}%` }} />
                  </div>
                </div>

                {/* Nitro Boost */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white/60 uppercase tracking-wider text-[11px]">
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> Nitro Kuchlanishi
                    </span>
                    <span className="font-mono text-orange-400 font-bold">{car.stats.nitroBoost * 10} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] rounded-full" style={{ width: `${car.stats.nitroBoost * 10}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-6 pt-4 border-t border-white/10">
              {isUnlocked ? (
                isSelected ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> TANLANGAN (ACTIVE)
                  </div>
                ) : (
                  <button
                    onClick={handleEquip}
                    className="w-full py-3.5 rounded-xl bg-cyan-500 hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-sm transition shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  >
                    POYGA UCHUN TANLASH (SELECT)
                  </button>
                )
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={!canAfford}
                  className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition ${
                    canAfford
                      ? 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                      : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Lock className="w-4 h-4" /> OCHISH: {car.price.toLocaleString()} TANGA
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Car Selector Carousel */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center gap-3 overflow-x-auto">
          {CARS_CATALOG.map((c, idx) => {
            const unlocked = progress.unlockedCars.includes(c.id);
            const isEquipped = progress.selectedCarId === c.id;
            const isHighlighted = idx === selectedIdx;

            return (
              <button
                key={c.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedIdx(idx);
                }}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner"
                  style={{ backgroundColor: c.color }}
                >
                  {unlocked ? (isEquipped ? '✓' : idx + 1) : <Lock className="w-4 h-4 text-white drop-shadow" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-black italic tracking-tight text-white leading-tight">{c.name}</div>
                  <div className="text-[11px] font-semibold text-white/50">
                    {unlocked ? (isEquipped ? 'Tanlangan' : 'Ochiq') : `${c.price} tanga`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
