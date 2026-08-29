import React from 'react';
import { X, Wrench, Coins, Gauge, Zap, Compass, Flame, Check } from 'lucide-react';
import { PlayerProgress } from '../types';
import { CARS_CATALOG, UPGRADE_PRICES, UPGRADE_BOOSTS } from '../game/constants';
import { soundManager } from '../game/audio';

interface UpgradesModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onUpgradeStat: (carId: string, statType: 'speed' | 'acceleration' | 'handling' | 'nitro') => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  progress,
  onClose,
  onUpgradeStat,
}) => {
  const car = CARS_CATALOG.find((c) => c.id === progress.selectedCarId) || CARS_CATALOG[0];
  const upgrades = progress.carUpgrades[car.id] || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0 };

  const upgradeItems = [
    {
      key: 'speed' as const,
      name: 'Maksimal Tezlik',
      enName: 'Top Speed',
      icon: Gauge,
      color: 'text-red-400',
      bgBar: 'bg-red-500',
      currentLevel: upgrades.speedLevel,
      baseValue: `${car.stats.topSpeed} km/h`,
      upgradedValue: `${car.stats.topSpeed + (upgrades.speedLevel * UPGRADE_BOOSTS.speedPerLevel)} km/h`,
      nextBoost: `+${UPGRADE_BOOSTS.speedPerLevel} km/h`,
      price: UPGRADE_PRICES.speed[upgrades.speedLevel] || 0,
      isMax: upgrades.speedLevel >= 5,
    },
    {
      key: 'acceleration' as const,
      name: 'Tezlanish (Akkumulyatsiya)',
      enName: 'Acceleration',
      icon: Zap,
      color: 'text-amber-400',
      bgBar: 'bg-amber-400',
      currentLevel: upgrades.accelLevel,
      baseValue: `${car.stats.acceleration * 10}`,
      upgradedValue: `${Math.round((car.stats.acceleration + upgrades.accelLevel * UPGRADE_BOOSTS.accelPerLevel) * 10)}`,
      nextBoost: `+${UPGRADE_BOOSTS.accelPerLevel * 10} pts`,
      price: UPGRADE_PRICES.acceleration[upgrades.accelLevel] || 0,
      isMax: upgrades.accelLevel >= 5,
    },
    {
      key: 'handling' as const,
      name: 'Boshqaruv va Drayv',
      enName: 'Handling & Grip',
      icon: Compass,
      color: 'text-cyan-400',
      bgBar: 'bg-cyan-400',
      currentLevel: upgrades.handlingLevel,
      baseValue: `${car.stats.handling * 10}`,
      upgradedValue: `${Math.round((car.stats.handling + upgrades.handlingLevel * UPGRADE_BOOSTS.handlingPerLevel) * 10)}`,
      nextBoost: `+${UPGRADE_BOOSTS.handlingPerLevel * 10} pts`,
      price: UPGRADE_PRICES.handling[upgrades.handlingLevel] || 0,
      isMax: upgrades.handlingLevel >= 5,
    },
    {
      key: 'nitro' as const,
      name: 'Nitro Quvvati va Sig‘imi',
      enName: 'Nitro Capacity & Duration',
      icon: Flame,
      color: 'text-blue-400',
      bgBar: 'bg-blue-500',
      currentLevel: upgrades.nitroLevel,
      baseValue: `${car.stats.nitroBoost * 10}`,
      upgradedValue: `${Math.round((car.stats.nitroBoost + upgrades.nitroLevel * UPGRADE_BOOSTS.nitroPerLevel) * 10)}`,
      nextBoost: `+${UPGRADE_BOOSTS.nitroPerLevel * 10} pts`,
      price: UPGRADE_PRICES.nitro[upgrades.nitroLevel] || 0,
      isMax: upgrades.nitroLevel >= 5,
    },
  ];

  const handleUpgrade = (statKey: 'speed' | 'acceleration' | 'handling' | 'nitro', price: number, isMax: boolean) => {
    if (isMax || progress.coins < price) return;
    soundManager.playVictoryFanfare();
    onUpgradeStat(car.id, statKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase">
                MASHINANI YANGILASH <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">/ UPGRADES</span>
              </h2>
              <p className="text-xs text-white/50 font-semibold tracking-wide">
                Tanlangan mashina: <span className="text-cyan-400 font-bold">{car.uzName}</span>
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

        {/* Upgrade Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {upgradeItems.map((item) => {
            const Icon = item.icon;
            const canAfford = progress.coins >= item.price;

            return (
              <div
                key={item.key}
                className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-white/15"
              >
                {/* Stat Details */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black italic tracking-tight text-white leading-tight">
                          {item.name}
                        </h4>
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">{item.enName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">
                        {item.upgradedValue}
                      </span>
                      {!item.isMax && (
                        <span className="text-xs text-emerald-400 font-bold ml-1.5">
                          ({item.nextBoost})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Level Bars (0 to 5) */}
                  <div className="flex items-center gap-1.5 mt-3.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-2 flex-1 rounded-full border transition-all ${
                          lvl <= item.currentLevel
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                            : 'bg-white/5 border-white/10'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono font-bold text-white/50 ml-2 w-8 text-right">
                      {item.currentLevel}/5
                    </span>
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="w-full sm:w-auto flex justify-end">
                  {item.isMax ? (
                    <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> MAKSIMAL
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(item.key, item.price, item.isMax)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
                        canAfford
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                          : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-black" />
                      YANGILASH: {item.price.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-black/60 border-t border-white/10 text-center text-xs text-white/50 font-semibold">
          💡 Har bir mashina alohida yangilanadi. Tangalarni poygalarda g‘alaba qozonib yig‘ing!
        </div>
      </div>
    </div>
  );
};
