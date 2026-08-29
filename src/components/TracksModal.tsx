import React from 'react';
import { X, Map, Lock, Check, Trophy, Timer, Flag, Route, Coins } from 'lucide-react';
import { PlayerProgress, TrackDefinition } from '../types';
import { TRACKS_CATALOG } from '../game/constants';
import { soundManager } from '../game/audio';

interface TracksModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
  onUnlockTrack: (trackId: string) => void;
  onStartRaceDirect?: (trackId: string) => void;
}

export const TracksModal: React.FC<TracksModalProps> = ({
  progress,
  onClose,
  onSelectTrack,
  onUnlockTrack,
  onStartRaceDirect,
}) => {
  const handleSelect = (trackId: string) => {
    soundManager.playClick();
    onSelectTrack(trackId);
    if (onStartRaceDirect) {
      onStartRaceDirect(trackId);
    }
  };

  const handleUnlock = (track: TrackDefinition) => {
    if (progress.coins >= track.price) {
      soundManager.playVictoryFanfare();
      onUnlockTrack(track.id);
    }
  };

  const formatTime = (ms: number) => {
    if (!ms) return '--:--.--';
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const getDifficultyBadge = (diff: TrackDefinition['difficulty']) => {
    switch (diff) {
      case 'Oson':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'O‘rta':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Qiyin':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    }
  };

  const getTrackThemeBg = (theme: TrackDefinition['theme']) => {
    switch (theme) {
      case 'ring':
        return 'from-cyan-900/60 via-indigo-950/80 to-zinc-950';
      case 'city':
        return 'from-blue-900/60 via-slate-900/80 to-zinc-950';
      case 'desert':
        return 'from-amber-900/60 via-orange-950/80 to-zinc-950';
      case 'mountain':
        return 'from-emerald-900/60 via-slate-900/80 to-zinc-950';
      default:
        return 'from-purple-900/60 via-indigo-950/80 to-zinc-950';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase">
                POYGA XARITALARI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">/ TRACKS</span>
              </h2>
              <p className="text-xs text-white/50 font-semibold tracking-wide">
                Xaritani tanlang va poygaga start bering
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

        {/* Tracks Grid (2x2) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {TRACKS_CATALOG.map((track) => {
            const isUnlocked = progress.unlockedTracks.includes(track.id);
            const isSelected = progress.selectedTrackId === track.id;
            const bestLap = progress.bestLapTimes[track.id];
            const canAfford = progress.coins >= track.price;

            return (
              <div
                key={track.id}
                className={`relative rounded-3xl border p-5 flex flex-col justify-between bg-black/40 backdrop-blur-xl transition-all ${
                  isSelected
                    ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Top Bar: Difficulty & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${getDifficultyBadge(
                        track.difficulty
                      )}`}
                    >
                      {track.difficulty}
                    </span>

                    {isSelected && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                        <Check className="w-3 h-3" /> TANLANGAN
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl sm:text-2xl font-black italic tracking-tight text-white leading-tight">{track.uzName}</h3>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{track.name}</span>
                  <p className="text-xs text-white/60 mt-2 line-clamp-2 leading-relaxed">
                    {track.uzDescription}
                  </p>

                  {/* Track Meta (Length, Laps, Best Lap) */}
                  <div className="grid grid-cols-3 gap-2 mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1">
                        <Route className="w-3 h-3 text-cyan-400" /> Masofa
                      </span>
                      <span className="text-sm font-mono font-bold text-white mt-0.5">{track.lengthKm} km</span>
                    </div>

                    <div className="flex flex-col items-center text-center border-x border-white/10">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-400" /> Aylana
                      </span>
                      <span className="text-sm font-mono font-bold text-white mt-0.5">{track.totalLaps} Lap</span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1">
                        <Timer className="w-3 h-3 text-emerald-400" /> Rekord
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{formatTime(bestLap)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-white/10">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleSelect(track.id)}
                      className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
                        isSelected
                          ? 'bg-cyan-500 hover:brightness-110 text-black shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                      }`}
                    >
                      {isSelected ? 'POYGANING BOSHLASH (PLAY)' : 'TANLASH VA O‘YNASH'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(track)}
                      disabled={!canAfford}
                      className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
                        canAfford
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                          : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {track.requiredWins > 0 && `${track.requiredWins} ta g‘alaba yoki `}
                      {track.price.toLocaleString()} TANGA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
