import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Coins, Timer, Sparkles, RotateCcw, ArrowRight, Home, Wrench } from 'lucide-react';
import { RaceResult, TrackDefinition } from '../types';
import { POSITION_REWARDS } from '../game/constants';
import { soundManager } from '../game/audio';

interface FinishModalProps {
  result: RaceResult;
  trackDef: TrackDefinition;
  onRestart: () => void;
  onNextRace: () => void;
  onOpenGarage: () => void;
  onOpenUpgrades: () => void;
  onQuitToMenu: () => void;
}

export const FinishModal: React.FC<FinishModalProps> = ({
  result,
  trackDef,
  onRestart,
  onNextRace,
  onOpenGarage,
  onOpenUpgrades,
  onQuitToMenu,
}) => {
  const isWinner = result.position === 1;
  const isPodium = result.position <= 3;
  const rewardConfig = POSITION_REWARDS.find((r) => r.position === result.position) || POSITION_REWARDS[5];

  useEffect(() => {
    if (isPodium) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ffffff'],
      });
    }
  }, [isPodium]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const getPositionHeader = () => {
    switch (result.position) {
      case 1:
        return {
          title: 'G‘ALABA! CHEMPION!',
          enTitle: 'VICTORY! 1ST PLACE!',
          color: 'from-amber-400 via-yellow-300 to-amber-500',
          badgeBg: 'bg-amber-500 text-amber-950 border-amber-300',
          badgeText: '🥇 1-O‘RIN',
        };
      case 2:
        return {
          title: 'AJOYIB NATIJA!',
          enTitle: 'GREAT RACE! 2ND PLACE!',
          color: 'from-slate-200 via-white to-slate-400',
          badgeBg: 'bg-slate-300 text-slate-900 border-white',
          badgeText: '🥈 2-O‘RIN',
        };
      case 3:
        return {
          title: 'SHOHSUPADA!',
          enTitle: 'PODIUM FINISH! 3RD PLACE!',
          color: 'from-amber-600 via-amber-500 to-amber-700',
          badgeBg: 'bg-amber-700 text-white border-amber-500',
          badgeText: '🥉 3-O‘RIN',
        };
      default:
        return {
          title: 'MARRAGA YETIB KELDINGIZ',
          enTitle: 'RACE COMPLETED',
          color: 'from-zinc-300 via-zinc-400 to-zinc-500',
          badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-600',
          badgeText: `${result.position}-O‘RIN`,
        };
    }
  };

  const posHead = getPositionHeader();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center max-h-[95vh] overflow-y-auto">
        {/* Top Trophy / Badge */}
        <div className="flex flex-col items-center mb-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 shadow-xl mb-3">
            <Trophy
              className={`w-12 h-12 ${
                result.position === 1
                  ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                  : result.position === 2
                  ? 'text-slate-300'
                  : result.position === 3
                  ? 'text-amber-500'
                  : 'text-zinc-500'
              }`}
            />
          </div>

          <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${posHead.badgeBg}`}>
            {posHead.badgeText}
          </span>

          <h2 className={`text-2xl sm:text-3xl font-black italic tracking-tight mt-2 bg-gradient-to-r ${posHead.color} bg-clip-text text-transparent uppercase`}>
            {posHead.title}
          </h2>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{posHead.enTitle}</span>
        </div>

        {/* Reward Summary Card */}
        <div className="w-full bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-3xl p-5 mb-4 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
          <span className="text-[10px] uppercase font-bold text-yellow-400/80 tracking-[0.2em]">MUKOFOT / REWARDS</span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <Coins className="w-7 h-7 text-yellow-400 animate-bounce" />
            <span className="text-4xl font-mono font-bold text-yellow-400">
              +{result.prizeCoins.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-yellow-300 tracking-wider">TANGA</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-semibold text-white/60">
            <span>O‘rin uchun: +{rewardConfig.coins}</span>
            <span>•</span>
            <span>Yig‘ilgan: +{result.coinsCollected}</span>
          </div>
        </div>

        {/* Race Time & Lap Breakdown */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-cyan-400" /> Umumiy Vaqt
            </span>
            <span className="text-lg font-mono font-bold text-white mt-1">
              {formatTime(result.totalTimeMs)}
            </span>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Eng Yaxshi Aylana
            </span>
            <span className="text-lg font-mono font-bold text-emerald-400 mt-1">
              {formatTime(result.bestLapMs)}
            </span>
            {result.isNewRecord && (
              <span className="text-[9px] text-yellow-400 font-bold tracking-wider uppercase">YANGI REKORD!</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          {isWinner ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextRace();
              }}
              className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black uppercase tracking-widest text-xs transition shadow-[0_0_25px_rgba(250,204,21,0.4)] flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" /> KEYINGI POYGA / XARITA
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playClick();
                onRestart();
              }}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-xs transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> QAYTA BOSHLASH (RESTART)
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenUpgrades();
              }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" /> YANGILASH
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenGarage();
              }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-cyan-400" /> GARAJ
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onQuitToMenu();
            }}
            className="w-full py-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-white/50 hover:text-white active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> BOSH MENYUGA QAYTISH
          </button>
        </div>
      </div>
    </div>
  );
};
