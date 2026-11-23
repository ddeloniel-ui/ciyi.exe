import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ChromeConsole, ConsoleScreenMode } from './components/ChromeConsole';
import { MemoryCardSD } from './components/MemoryCardSD';
import { CIYI_REMINDERS } from './data/reminders';
import { SD_CARTRIDGES, SdCartridge, CIYI_MUSIC_TRACKS } from './data/cartridges';
import { consoleAudio } from './utils/consoleAudio';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPoweringOn, setIsPoweringOn] = useState(false);
  const [screenMode, setScreenMode] = useState<ConsoleScreenMode>('locked');

  const [activeCartridge, setActiveCartridge] = useState<SdCartridge | null>(null);
  const [insertingCartridge, setInsertingCartridge] = useState<SdCartridge | null>(null);
  const [sdNearSlot, setSdNearSlot] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const slotRef = useRef<HTMLDivElement | null>(null);
  const loadTimerRef = useRef<number | null>(null);
  const insertTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (loadTimerRef.current !== null) {
      window.clearInterval(loadTimerRef.current);
      loadTimerRef.current = null;
    }
    if (insertTimeoutRef.current !== null) {
      window.clearTimeout(insertTimeoutRef.current);
      insertTimeoutRef.current = null;
    }
  };

  // Auto-advance to the next MP3 track when a song finishes
  useEffect(() => {
    consoleAudio.setOnTrackEnded(() => {
      setTrackIndex((prev) => {
        const next = (prev + 1) % CIYI_MUSIC_TRACKS.length;
        if (consoleAudio.isEnabled()) {
          consoleAudio.startMusic(next);
          setIsMusicPlaying(true);
        }
        return next;
      });
    });
    return () => consoleAudio.setOnTrackEnded(null);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      consoleAudio.setEnabled(next);
      if (!next) {
        setIsMusicPlaying(false);
      } else {
        consoleAudio.playButtonClick('meta');
      }
      return next;
    });
  }, []);

  // 1. Clamshell Power-On & Upward Hinged Flip Sequence
  const handlePowerOn = useCallback(() => {
    if (isPoweringOn || isOpen) return;
    consoleAudio.playPowerOn();
    setIsPoweringOn(true);

    window.setTimeout(() => {
      setIsOpen(true);
      setIsPoweringOn(false);
      setScreenMode('locked');
    }, 540);
  }, [isPoweringOn, isOpen]);

  // 2. Insert or Hot-Swap any of the 4 Sparkling SD Cartridges into the console slot
  const handleInsertCartridge = useCallback(
    (cartridge: SdCartridge) => {
      if (!isOpen || insertingCartridge) return;
      clearTimers();

      if (activeCartridge) {
        consoleAudio.playSdEject();
        if (activeCartridge.id === 'music' && cartridge.id !== 'music') {
          consoleAudio.stopMusic();
          setIsMusicPlaying(false);
        }
      }
      consoleAudio.playSdInsert();
      setInsertingCartridge(cartridge);
      setActiveCartridge(cartridge);
      setSdNearSlot(false);

      insertTimeoutRef.current = window.setTimeout(() => {
        setInsertingCartridge(null);
        setScreenMode('inserting');
        setLoadingProgress(0);

        let step = 0;
        loadTimerRef.current = window.setInterval(() => {
          step += 1;
          const pct = Math.min(100, step * 14);
          setLoadingProgress(pct);
          consoleAudio.playLoadingBlip(step);

          if (pct >= 100) {
            if (loadTimerRef.current !== null) {
              window.clearInterval(loadTimerRef.current);
              loadTimerRef.current = null;
            }
            window.setTimeout(() => {
              consoleAudio.playAccessGranted();
              setScreenMode('granted');

              window.setTimeout(() => {
                if (cartridge.id === 'reminders') {
                  setScreenMode('archive');
                } else if (cartridge.id === 'minigame') {
                  setScreenMode('minigame');
                } else if (cartridge.id === 'letters') {
                  setScreenMode('letters');
                } else if (cartridge.id === 'music') {
                  setScreenMode('music');
                  if (consoleAudio.isEnabled()) {
                    consoleAudio.startMusic(trackIndex);
                    setIsMusicPlaying(true);
                  }
                }
              }, 1050);
            }, 180);
          }
        }, 115);
      }, 640);
    },
    [isOpen, insertingCartridge, activeCartridge, trackIndex]
  );

  // Eject current SD card back to the tray
  const handleEjectSd = useCallback(() => {
    if (!activeCartridge || insertingCartridge) return;
    clearTimers();
    consoleAudio.playSdEject();
    if (activeCartridge.id === 'music') {
      consoleAudio.stopMusic();
      setIsMusicPlaying(false);
    }
    setActiveCartridge(null);
    setScreenMode('locked');
  }, [activeCartridge, insertingCartridge]);

  // Default slot click inserts the first cartridge if none mounted
  const handleCardSlotClick = useCallback(() => {
    if (!activeCartridge) {
      handleInsertCartridge(SD_CARTRIDGES[0]);
    }
  }, [activeCartridge, handleInsertCartridge]);

  // Reminders Archive navigation
  const handleSelectReminder = useCallback((idx: number) => {
    const item = CIYI_REMINDERS[idx];
    setSelectedIndex(idx);
    setScreenMode('card');
    setOpenedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
  }, []);

  const handleBackToArchive = useCallback(() => {
    setScreenMode('archive');
  }, []);

  const handleOpenSecret = useCallback(() => {
    if (openedIds.length < CIYI_REMINDERS.length) return;
    consoleAudio.playFinalUnlock();
    setScreenMode('secret');
  }, [openedIds.length]);

  // Music Cartridge controls (pause/resume keeps current timestamp)
  const handleToggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      consoleAudio.pauseMusic();
      setIsMusicPlaying(false);
    } else if (consoleAudio.isEnabled()) {
      consoleAudio.startMusic(trackIndex);
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying, trackIndex]);

  const handleSelectTrack = useCallback((idx: number) => {
    setTrackIndex(idx);
    if (consoleAudio.isEnabled()) {
      consoleAudio.startMusic(idx);
      setIsMusicPlaying(true);
    }
  }, []);

  // Full Reset
  const handlePlayAgain = useCallback(() => {
    clearTimers();
    consoleAudio.stopMusic();
    consoleAudio.playButtonClick('meta');
    setIsMusicPlaying(false);
    setIsOpen(false);
    setIsPoweringOn(false);
    setScreenMode('locked');
    setActiveCartridge(null);
    setInsertingCartridge(null);
    setSdNearSlot(false);
    setLoadingProgress(0);
    setSelectedIndex(0);
    setOpenedIds([]);
  }, []);

  const sdInserted = Boolean(activeCartridge) && !insertingCartridge;

  const currentStep = !isOpen
    ? 1
    : !activeCartridge
    ? 2
    : screenMode === 'secret'
    ? 4
    : 3;

  return (
    <div className="relative min-h-screen studio-backdrop text-[#F1F5F9] flex flex-col justify-between overflow-x-hidden">
      {/* Subtle Ambient Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
        aria-hidden="true"
      />

      {/* Minimalist Top Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-slate-700/40">
        <div className="font-[family-name:var(--font-pixel)] text-xs sm:text-sm tracking-wider text-[#F8FAFC] whitespace-nowrap shrink-0">
          CIYI.exe
        </div>

        <nav
          aria-label="Console sequence"
          className="hidden md:flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap"
        >
          <span className={currentStep === 1 ? 'text-[#7DD3FC] font-semibold' : ''}>
            01 Power On
          </span>
          <span aria-hidden="true" className="opacity-35">·</span>
          <span className={currentStep === 2 ? 'text-[#7DD3FC] font-semibold' : ''}>
            02 Insert SD
          </span>
          <span aria-hidden="true" className="opacity-35">·</span>
          <span className={currentStep === 3 ? 'text-[#7DD3FC] font-semibold' : ''}>
            03 {activeCartridge ? activeCartridge.label : 'Explore SD Cards'}
          </span>
          <span aria-hidden="true" className="opacity-35">·</span>
          <span className={currentStep === 4 ? 'text-[#7DD3FC] font-semibold' : ''}>
            04 Secret Note
          </span>
        </nav>

        <button
          type="button"
          onClick={handleToggleSound}
          aria-label={soundEnabled ? 'Mute retro console audio' : 'Enable retro console audio'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-600/60 bg-slate-900/60 text-xs font-medium text-slate-200 hover:border-[#7DD3FC]/70 hover:text-[#BAE6FD] transition-colors cursor-pointer whitespace-nowrap"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-[#7DD3FC]" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </header>

      {/* Main Console + 4-SD-Card Dock Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-7 sm:py-9">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 w-full max-w-5xl mx-auto">
          <ChromeConsole
            isOpen={isOpen}
            isPoweringOn={isPoweringOn}
            screenMode={screenMode}
            activeCartridge={activeCartridge}
            insertingCartridge={insertingCartridge}
            sdInserted={sdInserted}
            sdNearSlot={sdNearSlot}
            loadingProgress={loadingProgress}
            slotRef={slotRef}
            onPowerOn={handlePowerOn}
            onCardSlotClick={handleCardSlotClick}
            onEjectSd={handleEjectSd}
            onSelectReminder={handleSelectReminder}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            openedIds={openedIds}
            onOpenSecret={handleOpenSecret}
            onBackToArchive={handleBackToArchive}
            onPlayAgain={handlePlayAgain}
            trackIndex={trackIndex}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            onSelectTrack={handleSelectTrack}
          />

          {/* 4-Card Sparkling Metallic Cartridge Tray */}
          {isOpen && (
            <aside
              aria-label="SD Cartridge Collection"
              className="flex flex-col items-center lg:items-start rounded-2xl p-4 sm:p-5 brushed-chrome-dark border border-slate-600/45 shadow-[0_24px_48px_-14px_rgba(0,0,0,0.75)] max-w-sm w-full lg:w-auto"
            >
              <div className="w-full flex items-center justify-between gap-4 border-b border-slate-700/70 pb-2.5 mb-4">
                <div>
                  <p className="font-[family-name:var(--font-pixel)] text-[10px] tracking-wider text-[#F8FAFC]">
                    SD CARTRIDGE CASE
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-lcd)] text-sm text-[#BAE6FD]/85">
                    Drag to SD slot or tap INSERT to swap.
                  </p>
                </div>
                {isMusicPlaying && (
                  <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#7DD3FC] animate-pulse shrink-0">
                    ♪ PLAYING
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                {SD_CARTRIDGES.map((cartridge) => (
                  <MemoryCardSD
                    key={cartridge.id}
                    cartridge={cartridge}
                    slotRef={slotRef}
                    isInserting={insertingCartridge?.id === cartridge.id}
                    isActiveInConsole={
                      activeCartridge?.id === cartridge.id && !insertingCartridge
                    }
                    onNearSlot={setSdNearSlot}
                    onInsert={handleInsertCartridge}
                  />
                ))}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/40">
        <span>Made with care for Ciyi</span>
        <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-slate-400">
          {!isOpen
            ? 'STANDBY'
            : !activeCartridge
            ? 'CHOOSE AN SD CARD'
            : activeCartridge.filename}
        </span>
      </footer>
    </div>
  );
}
