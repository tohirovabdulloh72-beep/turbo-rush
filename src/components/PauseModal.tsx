import React from 'react';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';
import { soundManager } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="w-full max-w-sm bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase mb-1">
          PAUZA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">/ PAUSED</span>
        </h2>
        <p className="text-xs text-white/50 font-semibold mb-6">Poyga to‘xtatib turilibdi</p>

        <div className="w-full space-y-3">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:brightness-110 active:scale-95 text-black font-black uppercase tracking-widest text-xs transition shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> DAVOM ETTIRISH (RESUME)
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> QAYTA BOSHLASH (RESTART)
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-2"
          >
            <Settings className="w-3.5 h-3.5" /> SOZLAMALAR (SETTINGS)
          </button>

          {/* Quit to Menu */}
          <button
            onClick={() => {
              soundManager.playClick();
              onQuitToMenu();
            }}
            className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 active:scale-95 font-bold uppercase tracking-wider text-xs transition flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" /> BOSH MENYUGA CHIQISH
          </button>
        </div>
      </div>
    </div>
  );
};
