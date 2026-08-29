/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerProgress,
  RaceLiveState,
  RaceResult,
  GameSettings,
} from './types';
import {
  CARS_CATALOG,
  TRACKS_CATALOG,
  UPGRADE_PRICES,
  getInitialProgress,
  saveProgress,
} from './game/constants';
import { RaceEngine } from './game/RaceEngine';
import { soundManager } from './game/audio';
import { MainMenu } from './components/MainMenu';
import { RaceHUD } from './components/RaceHUD';
import { CountdownOverlay } from './components/CountdownOverlay';
import { GarageModal } from './components/GarageModal';
import { UpgradesModal } from './components/UpgradesModal';
import { TracksModal } from './components/TracksModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { FinishModal } from './components/FinishModal';

export default function App() {
  // 1. Core State
  const [progress, setProgress] = useState<PlayerProgress>(getInitialProgress);
  const [gameState, setGameState] = useState<'menu' | 'racing'>('menu');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveState, setLiveState] = useState<RaceLiveState | null>(null);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'garage' | 'upgrades' | 'tracks' | 'settings' | 'finish'>('none');

  // 2. Engine and DOM references
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const raceEngineRef = useRef<RaceEngine | null>(null);

  // Sync Audio Engine Volume with settings
  useEffect(() => {
    soundManager.setVolumes(progress.settings.soundVolume, progress.settings.musicVolume);
  }, [progress.settings]);

  // Save Progress helper
  const updateProgress = useCallback((updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  // 3. START RACE HANDLER
  const startRace = useCallback((trackId?: string) => {
    const activeTrackId = trackId || progress.selectedTrackId;
    const trackDef = TRACKS_CATALOG.find((t) => t.id === activeTrackId) || TRACKS_CATALOG[0];
    const carDef = CARS_CATALOG.find((c) => c.id === progress.selectedCarId) || CARS_CATALOG[0];

    // Destroy existing engine if any
    if (raceEngineRef.current) {
      raceEngineRef.current.destroy();
      raceEngineRef.current = null;
    }

    setGameState('racing');
    setIsPaused(false);
    setActiveModal('none');
    setRaceResult(null);

    // Allow DOM to mount game container before initializing WebGL
    setTimeout(() => {
      if (gameContainerRef.current) {
        const engine = new RaceEngine(gameContainerRef.current, trackDef, carDef, progress);

        engine.onStateUpdate = (state) => {
          setLiveState(state);
        };

        engine.onFinish = (result) => {
          setRaceResult(result);
          setActiveModal('finish');

          // Process race rewards and unlocks
          updateProgress((prev) => {
            const isWin = result.position === 1;
            const newTotalWins = prev.totalWins + (isWin ? 1 : 0);
            const newTotalRaces = prev.totalRaces + 1;
            const newCoins = prev.coins + result.prizeCoins;

            // Check new car unlocks based on wins
            const newlyUnlockedCars = [...prev.unlockedCars];
            CARS_CATALOG.forEach((car) => {
              if (!newlyUnlockedCars.includes(car.id) && car.requiredWins > 0 && newTotalWins >= car.requiredWins) {
                newlyUnlockedCars.push(car.id);
              }
            });

            // Check new track unlocks based on wins
            const newlyUnlockedTracks = [...prev.unlockedTracks];
            TRACKS_CATALOG.forEach((track) => {
              if (!newlyUnlockedTracks.includes(track.id) && track.requiredWins > 0 && newTotalWins >= track.requiredWins) {
                newlyUnlockedTracks.push(track.id);
              }
            });

            // Update best lap record
            const bestTimes = { ...prev.bestLapTimes };
            if (result.bestLapMs > 0) {
              const currentBest = bestTimes[trackDef.id];
              if (!currentBest || result.bestLapMs < currentBest) {
                bestTimes[trackDef.id] = result.bestLapMs;
              }
            }

            return {
              ...prev,
              coins: newCoins,
              totalWins: newTotalWins,
              totalRaces: newTotalRaces,
              unlockedCars: newlyUnlockedCars,
              unlockedTracks: newlyUnlockedTracks,
              bestLapTimes: bestTimes,
            };
          });
        };

        raceEngineRef.current = engine;
      }
    }, 50);
  }, [progress, updateProgress]);

  // 4. KEYBOARD CONTROLS DISPATCHER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'racing') return;

      const key = e.key.toLowerCase();

      // Pause toggle
      if (key === 'escape' || key === 'p') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      // Camera switch
      if (key === 'c') {
        e.preventDefault();
        handleToggleCamera();
        return;
      }

      if (!raceEngineRef.current || isPaused) return;

      // Throttle (W or ArrowUp)
      if (key === 'w' || key === 'arrowup') {
        raceEngineRef.current.setInputs({ forward: true });
      }
      // Brake / Reverse (S or ArrowDown)
      if (key === 's' || key === 'arrowdown') {
        raceEngineRef.current.setInputs({ backward: true });
      }
      // Steer Left (A or ArrowLeft)
      if (key === 'a' || key === 'arrowleft') {
        raceEngineRef.current.setInputs({ left: true });
      }
      // Steer Right (D or ArrowRight)
      if (key === 'd' || key === 'arrowright') {
        raceEngineRef.current.setInputs({ right: true });
      }
      // Drift / Handbrake (Space)
      if (key === ' ') {
        e.preventDefault();
        raceEngineRef.current.setInputs({ drift: true });
      }
      // Nitro (Shift or N)
      if (key === 'shift' || key === 'n') {
        e.preventDefault();
        raceEngineRef.current.triggerNitro();
        raceEngineRef.current.setInputs({ nitro: true });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'racing' || !raceEngineRef.current) return;

      const key = e.key.toLowerCase();

      if (key === 'w' || key === 'arrowup') {
        raceEngineRef.current.setInputs({ forward: false });
      }
      if (key === 's' || key === 'arrowdown') {
        raceEngineRef.current.setInputs({ backward: false });
      }
      if (key === 'a' || key === 'arrowleft') {
        raceEngineRef.current.setInputs({ left: false });
      }
      if (key === 'd' || key === 'arrowright') {
        raceEngineRef.current.setInputs({ right: false });
      }
      if (key === ' ') {
        raceEngineRef.current.setInputs({ drift: false });
      }
      if (key === 'shift' || key === 'n') {
        raceEngineRef.current.setInputs({ nitro: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isPaused]);

  // 5. TOUCH CONTROLS HANDLER
  const handleTouchInput = (key: 'forward' | 'backward' | 'left' | 'right' | 'drift' | 'nitro', active: boolean) => {
    if (!raceEngineRef.current || isPaused) return;

    if (key === 'nitro' && active) {
      raceEngineRef.current.triggerNitro();
    }
    raceEngineRef.current.setInputs({ [key]: active });
  };

  // 6. CAMERA SWITCH
  const handleToggleCamera = () => {
    const modes: GameSettings['cameraMode'][] = ['chase', 'close', 'hood', 'top'];
    const currentIdx = modes.indexOf(progress.settings.cameraMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];

    updateProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, cameraMode: nextMode },
    }));
  };

  // 7. GARAGE & UPGRADE ACTIONS
  const handleSelectCar = (carId: string) => {
    updateProgress((prev) => ({
      ...prev,
      selectedCarId: carId,
    }));
  };

  const handleUnlockCar = (carId: string) => {
    const carDef = CARS_CATALOG.find((c) => c.id === carId);
    if (!carDef || progress.coins < carDef.price) return;

    updateProgress((prev) => ({
      ...prev,
      coins: prev.coins - carDef.price,
      unlockedCars: [...prev.unlockedCars, carId],
      selectedCarId: carId,
    }));
  };

  const handleSelectColor = (carId: string, hexColor: string) => {
    updateProgress((prev) => ({
      ...prev,
      carColors: { ...prev.carColors, [carId]: hexColor },
    }));
  };

  const handleUpgradeStat = (carId: string, statKey: 'speed' | 'acceleration' | 'handling' | 'nitro') => {
    const currentUpgrades = progress.carUpgrades[carId] || { speedLevel: 0, accelLevel: 0, handlingLevel: 0, nitroLevel: 0 };
    const levelKey = `${statKey === 'speed' ? 'speed' : statKey === 'acceleration' ? 'accel' : statKey === 'handling' ? 'handling' : 'nitro'}Level` as keyof typeof currentUpgrades;
    const currentLevel = currentUpgrades[levelKey];

    if (currentLevel >= 5) return;
    const price = UPGRADE_PRICES[statKey][currentLevel];
    if (progress.coins < price) return;

    updateProgress((prev) => ({
      ...prev,
      coins: prev.coins - price,
      carUpgrades: {
        ...prev.carUpgrades,
        [carId]: {
          ...currentUpgrades,
          [levelKey]: currentLevel + 1,
        },
      },
    }));
  };

  const handleSelectTrack = (trackId: string) => {
    updateProgress((prev) => ({
      ...prev,
      selectedTrackId: trackId,
    }));
  };

  const handleUnlockTrack = (trackId: string) => {
    const trackDef = TRACKS_CATALOG.find((t) => t.id === trackId);
    if (!trackDef || progress.coins < trackDef.price) return;

    updateProgress((prev) => ({
      ...prev,
      coins: prev.coins - trackDef.price,
      unlockedTracks: [...prev.unlockedTracks, trackId],
      selectedTrackId: trackId,
    }));
  };

  const handleNextRace = () => {
    const currentIdx = TRACKS_CATALOG.findIndex((t) => t.id === progress.selectedTrackId);
    const nextTrack = TRACKS_CATALOG[(currentIdx + 1) % TRACKS_CATALOG.length];
    handleSelectTrack(nextTrack.id);
    startRace(nextTrack.id);
  };

  const handleQuitToMenu = () => {
    if (raceEngineRef.current) {
      raceEngineRef.current.destroy();
      raceEngineRef.current = null;
    }
    setGameState('menu');
    setIsPaused(false);
    setActiveModal('none');
    setRaceResult(null);
  };

  const handleResetProgress = () => {
    localStorage.removeItem('turbo_rush_save_v1');
    const fresh = getInitialProgress();
    setProgress(fresh);
    saveProgress(fresh);
  };

  const currentTrackDef = TRACKS_CATALOG.find((t) => t.id === progress.selectedTrackId) || TRACKS_CATALOG[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. 3D WebGL Game Canvas Container */}
      <div
        ref={gameContainerRef}
        className={`absolute inset-0 w-full h-full ${gameState === 'racing' ? 'block' : 'hidden'}`}
      />

      {/* 2. Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          progress={progress}
          onStartRace={() => startRace()}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenUpgrades={() => setActiveModal('upgrades')}
          onOpenTracks={() => setActiveModal('tracks')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* 3. In-Game HUD (Speedometer, Tachometer, Radar, Touch Controls) */}
      {gameState === 'racing' && !isPaused && (
        <>
          <RaceHUD
            liveState={liveState}
            trackDef={currentTrackDef}
            settings={progress.settings}
            onPause={() => setIsPaused(true)}
            onCameraToggle={handleToggleCamera}
            onTouchInput={handleTouchInput}
          />
          {liveState?.status === 'countdown' && <CountdownOverlay />}
        </>
      )}

      {/* 4. Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={() => startRace()}
          onOpenSettings={() => setActiveModal('settings')}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* 5. Finish Screen Modal */}
      {activeModal === 'finish' && raceResult && (
        <FinishModal
          result={raceResult}
          trackDef={currentTrackDef}
          onRestart={() => startRace()}
          onNextRace={handleNextRace}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenUpgrades={() => setActiveModal('upgrades')}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* 6. Garage Modal */}
      {activeModal === 'garage' && (
        <GarageModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onSelectCar={handleSelectCar}
          onUnlockCar={handleUnlockCar}
          onSelectColor={handleSelectColor}
        />
      )}

      {/* 7. Upgrades Modal */}
      {activeModal === 'upgrades' && (
        <UpgradesModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onUpgradeStat={handleUpgradeStat}
        />
      )}

      {/* 8. Tracks Modal */}
      {activeModal === 'tracks' && (
        <TracksModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onSelectTrack={handleSelectTrack}
          onUnlockTrack={handleUnlockTrack}
          onStartRaceDirect={(tId) => startRace(tId)}
        />
      )}

      {/* 9. Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          settings={progress.settings}
          onClose={() => setActiveModal('none')}
          onUpdateSettings={(newSettings) =>
            updateProgress((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...newSettings },
            }))
          }
          onResetProgress={handleResetProgress}
        />
      )}
    </div>
  );
}
