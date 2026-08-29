import React from 'react';
import { X, Settings, Volume2, Music, Video, Cpu, Globe, RotateCcw } from 'lucide-react';
import { GameSettings } from '../types';
import { soundManager } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
  onResetProgress,
}) => {
  const handleSoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ soundVolume: val });
    soundManager.setVolumes(val, settings.musicVolume);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ musicVolume: val });
    soundManager.setVolumes(settings.soundVolume, val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none font-sans text-white animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#080810]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase">
                SOZLAMALAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">/ SETTINGS</span>
              </h2>
              <p className="text-xs text-white/50 font-semibold tracking-wide">
                Ovoz, kamera, grafika va til parametrlarini moslang
              </p>
            </div>
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

        {/* Body Settings List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. Audio Volumes */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" /> OVOZ VA MUSIQA / AUDIO
            </h3>

            {/* Sound FX */}
            <div>
              <div className="flex justify-between text-xs font-bold text-white/70 mb-2">
                <span>Dvigatel va O‘yin Tovushlari (SFX)</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={handleSoundChange}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Music */}
            <div>
              <div className="flex justify-between text-xs font-bold text-white/70 mb-2">
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-purple-400" /> Synthwave Musiqa
                </span>
                <span className="font-mono text-purple-400 font-bold">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={handleMusicChange}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Camera View Mode */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-amber-400" /> KAMERA KO‘RINISHI / CAMERA
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'chase', label: 'Standart (Orqada)', desc: 'Chase' },
                { key: 'close', label: 'Yaqin (Close)', desc: 'Tight' },
                { key: 'hood', label: 'Kapot (Oldi)', desc: 'Hood' },
                { key: 'top', label: 'Tepadagi (Arkada)', desc: 'Top-down' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    soundManager.playClick();
                    onUpdateSettings({ cameraMode: c.key as any });
                  }}
                  className={`p-3 rounded-2xl border text-center transition ${
                    settings.cameraMode === c.key
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{c.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Graphics Quality */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-emerald-400" /> GRAFIKA SIFATI / GRAPHICS
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { key: 'high', label: 'Yuqori (High)', desc: 'Soyalar & Silliqlash' },
                { key: 'medium', label: 'O‘rta (Medium)', desc: 'Balanslashgan' },
                { key: 'low', label: 'Tezkor (Fast)', desc: 'Maksimal FPS' },
              ].map((q) => (
                <button
                  key={q.key}
                  onClick={() => {
                    soundManager.playClick();
                    onUpdateSettings({ graphicsQuality: q.key as any });
                  }}
                  className={`p-3 rounded-2xl border text-center transition ${
                    settings.graphicsQuality === q.key
                      ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{q.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider">{q.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Language */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-blue-400" /> INTERFEYS TILI / LANGUAGE
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'uz', label: 'O‘zbekcha 🇺🇿' },
                { key: 'en', label: 'English 🇺🇸' },
              ].map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    soundManager.playClick();
                    onUpdateSettings({ language: l.key as any });
                  }}
                  className={`py-3 px-4 rounded-2xl border text-center font-bold text-xs uppercase tracking-wider transition ${
                    settings.language === l.key
                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Reset Save Data */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm('Haqiqatan ham barcha o‘yin yutuqlari va tangalarni qayta boshlamoqchimisiz?')) {
                  onResetProgress();
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 flex items-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Barcha Yutuqlarni Qayta O‘rnatish (Reset)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
