import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, ChevronLeft, ChevronRight, Lock, Check, Sparkles, ArrowUpFromLine } from 'lucide-react';
import {
  CIYI_REMINDERS,
  FINAL_SECRET_TITLE,
  FINAL_SECRET_PARAGRAPHS,
} from '../data/reminders';
import {
  SdCartridge,
  CIYI_LOVE_LETTERS,
  CIYI_MUSIC_TRACKS,
} from '../data/cartridges';
import { consoleAudio } from '../utils/consoleAudio';
import { PixelMiniGame, MiniGameHandle } from './PixelMiniGame';
import { LoveLettersView } from './LoveLettersView';
import { MusicPlayerView } from './MusicPlayerView';

export type ConsoleScreenMode =
  | 'locked'
  | 'inserting'
  | 'granted'
  | 'archive'
  | 'card'
  | 'secret'
  | 'minigame'
  | 'letters'
  | 'music';

interface ChromeConsoleProps {
  isOpen: boolean;
  isPoweringOn: boolean;
  screenMode: ConsoleScreenMode;
  activeCartridge: SdCartridge | null;
  insertingCartridge: SdCartridge | null;
  sdInserted: boolean;
  sdNearSlot: boolean;
  loadingProgress: number;
  slotRef: React.RefObject<HTMLDivElement | null>;
  onPowerOn: () => void;
  onCardSlotClick: () => void;
  onEjectSd: () => void;
  onSelectReminder: (index: number) => void;
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  openedIds: string[];
  onOpenSecret: () => void;
  onBackToArchive: () => void;
  onPlayAgain: () => void;
  trackIndex: number;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onSelectTrack: (idx: number) => void;
}

export const ChromeConsole: React.FC<ChromeConsoleProps> = ({
  isOpen,
  isPoweringOn,
  screenMode,
  activeCartridge,
  insertingCartridge,
  sdInserted,
  sdNearSlot,
  loadingProgress,
  slotRef,
  onPowerOn,
  onCardSlotClick,
  onEjectSd,
  onSelectReminder,
  selectedIndex,
  setSelectedIndex,
  openedIds,
  onOpenSecret,
  onBackToArchive,
  onPlayAgain,
  trackIndex,
  isMusicPlaying,
  onToggleMusic,
  onSelectTrack,
}) => {
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 30 });
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const secretScrollRef = useRef<HTMLDivElement | null>(null);

  const [letterIndex, setLetterIndex] = useState(0);
  const [readingLetter, setReadingLetter] = useState(false);
  const [readLetterIds, setReadLetterIds] = useState<string[]>([]);

  const miniGameRef = useRef<MiniGameHandle | null>(null);

  const allOpened = openedIds.length === CIYI_REMINDERS.length;
  const activeReminder = CIYI_REMINDERS[selectedIndex];

  useEffect(() => {
    if (screenMode === 'card') {
      setCardFlipped(false);
      const t = window.setTimeout(() => {
        setCardFlipped(true);
        consoleAudio.playCardFlip();
      }, 90);
      return () => window.clearTimeout(t);
    }
    setCardFlipped(false);
  }, [screenMode, selectedIndex]);

  useEffect(() => {
    if (screenMode === 'letters') {
      setReadingLetter(false);
    }
  }, [screenMode]);

  const handleOpenLetter = useCallback((idx: number) => {
    const ltr = CIYI_LOVE_LETTERS[idx];
    setLetterIndex(idx);
    setReadingLetter(true);
    setReadLetterIds((prev) => (prev.includes(ltr.id) ? prev : [...prev, ltr.id]));
    consoleAudio.playCardFlip();
  }, []);

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSheenPos({ x, y });
  };

  const flashButton = useCallback((id: string) => {
    setPressedBtn(id);
    window.setTimeout(() => setPressedBtn((p) => (p === id ? null : p)), 120);
  }, []);

  const handleDpad = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!isOpen) return;
      flashButton(`dpad-${dir}`);

      if (screenMode === 'minigame') {
        if (dir === 'left') miniGameRef.current?.moveLeft();
        if (dir === 'right') miniGameRef.current?.moveRight();
        return;
      }

      consoleAudio.playButtonClick('dpad');

      if (screenMode === 'archive') {
        setSelectedIndex((prev) => {
          if (dir === 'left') return (prev + CIYI_REMINDERS.length - 1) % CIYI_REMINDERS.length;
          if (dir === 'right') return (prev + 1) % CIYI_REMINDERS.length;
          if (dir === 'up') return (prev + CIYI_REMINDERS.length - 2) % CIYI_REMINDERS.length;
          return (prev + 2) % CIYI_REMINDERS.length;
        });
      } else if (screenMode === 'card') {
        if (dir === 'left' || dir === 'up') {
          onSelectReminder((selectedIndex + CIYI_REMINDERS.length - 1) % CIYI_REMINDERS.length);
        } else {
          onSelectReminder((selectedIndex + 1) % CIYI_REMINDERS.length);
        }
      } else if (screenMode === 'secret' && secretScrollRef.current) {
        const delta = dir === 'down' || dir === 'right' ? 70 : -70;
        secretScrollRef.current.scrollBy({ top: delta, behavior: 'smooth' });
      } else if (screenMode === 'letters') {
        if (!readingLetter) {
          setLetterIndex((prev) =>
            dir === 'up' || dir === 'left'
              ? (prev + CIYI_LOVE_LETTERS.length - 1) % CIYI_LOVE_LETTERS.length
              : (prev + 1) % CIYI_LOVE_LETTERS.length
          );
        } else {
          const nextIdx =
            dir === 'left' || dir === 'up'
              ? (letterIndex + CIYI_LOVE_LETTERS.length - 1) % CIYI_LOVE_LETTERS.length
              : (letterIndex + 1) % CIYI_LOVE_LETTERS.length;
          handleOpenLetter(nextIdx);
        }
      } else if (screenMode === 'music') {
        if (dir === 'left' || dir === 'up') {
          onSelectTrack((trackIndex + CIYI_MUSIC_TRACKS.length - 1) % CIYI_MUSIC_TRACKS.length);
        } else {
          onSelectTrack((trackIndex + 1) % CIYI_MUSIC_TRACKS.length);
        }
      }
    },
    [
      isOpen,
      flashButton,
      screenMode,
      setSelectedIndex,
      selectedIndex,
      onSelectReminder,
      readingLetter,
      letterIndex,
      handleOpenLetter,
      trackIndex,
      onSelectTrack,
    ]
  );

  const handleButtonA = useCallback(() => {
    if (!isOpen) return;
    flashButton('btn-a');
    consoleAudio.playButtonClick('a');

    if (screenMode === 'locked') {
      onCardSlotClick();
    } else if (screenMode === 'archive') {
      onSelectReminder(selectedIndex);
    } else if (screenMode === 'card') {
      if (allOpened) {
        onOpenSecret();
      } else {
        onSelectReminder((selectedIndex + 1) % CIYI_REMINDERS.length);
      }
    } else if (screenMode === 'secret') {
      onPlayAgain();
    } else if (screenMode === 'minigame') {
      miniGameRef.current?.pressAction();
    } else if (screenMode === 'letters') {
      if (!readingLetter) {
        handleOpenLetter(letterIndex);
      } else {
        handleOpenLetter((letterIndex + 1) % CIYI_LOVE_LETTERS.length);
      }
    } else if (screenMode === 'music') {
      onToggleMusic();
    }
  }, [
    isOpen,
    flashButton,
    screenMode,
    onCardSlotClick,
    onSelectReminder,
    selectedIndex,
    allOpened,
    onOpenSecret,
    onPlayAgain,
    readingLetter,
    letterIndex,
    handleOpenLetter,
    onToggleMusic,
  ]);

  const handleButtonB = useCallback(() => {
    if (!isOpen) return;
    flashButton('btn-b');
    consoleAudio.playButtonClick('b');

    if (screenMode === 'card' || screenMode === 'secret') {
      onBackToArchive();
    } else if (screenMode === 'letters' && readingLetter) {
      setReadingLetter(false);
    }
  }, [isOpen, flashButton, screenMode, onBackToArchive, readingLetter]);

  const handleSelectBtn = useCallback(() => {
    if (!isOpen) return;
    flashButton('btn-select');
    consoleAudio.playButtonClick('meta');

    if (screenMode === 'archive') {
      setSelectedIndex((prev) => (prev + 1) % CIYI_REMINDERS.length);
    } else if (screenMode === 'card') {
      setCardFlipped((f) => !f);
      consoleAudio.playCardFlip();
    } else if (screenMode === 'music') {
      onSelectTrack((trackIndex + 1) % CIYI_MUSIC_TRACKS.length);
    }
  }, [isOpen, flashButton, screenMode, setSelectedIndex, trackIndex, onSelectTrack]);

  const handleStartBtn = useCallback(() => {
    if (!isOpen) return;
    flashButton('btn-start');
    consoleAudio.playButtonClick('meta');

    if (screenMode === 'archive') {
      if (allOpened) onOpenSecret();
      else onSelectReminder(selectedIndex);
    } else if (screenMode === 'card') {
      if (allOpened) onOpenSecret();
      else onBackToArchive();
    } else if (screenMode === 'secret') {
      onPlayAgain();
    } else if (screenMode === 'minigame') {
      miniGameRef.current?.pressAction();
    } else if (screenMode === 'music') {
      onToggleMusic();
    } else if (screenMode === 'letters') {
      if (!readingLetter) handleOpenLetter(letterIndex);
      else setReadingLetter(false);
    }
  }, [
    isOpen,
    flashButton,
    screenMode,
    allOpened,
    onOpenSecret,
    onSelectReminder,
    selectedIndex,
    onBackToArchive,
    onPlayAgain,
    onToggleMusic,
    readingLetter,
    handleOpenLetter,
    letterIndex,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDpad('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDpad('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDpad('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDpad('right');
      } else if (e.key === 'Enter' || e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleButtonA();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleButtonB();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDpad, handleButtonA, handleButtonB]);

  return (
    <div
      onPointerMove={handleMouseMove}
      className="relative flex flex-col items-center justify-center select-none"
      style={{ perspective: '1400px' }}
    >
      <AnimatePresence mode="wait">
        {/* ==================== CLOSED CLAMSHELL INTRO (FLIPS UPWARD FROM TOP HINGE) ==================== */}
        {!isOpen ? (
          <motion.div
            key="closed-console"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 12,
              transition: { duration: 0.18 },
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[314px] sm:w-[376px]"
            style={{ perspective: '1300px' }}
          >
            {/* Subtle lower base peeking beneath closed clamshell lid */}
            <div
              className="absolute inset-x-1 -bottom-2.5 h-10 rounded-b-[28px] bg-gradient-to-b from-[#475569] to-[#1E293B] border border-slate-500/40 shadow-[0_24px_45px_-12px_rgba(0,0,0,0.85)]"
              aria-hidden="true"
            />

            {/* Hinged Clamshell Upper Lid that swings UPWARD (+rotateX around top hinge) */}
            <motion.div
              animate={{
                rotateX: isPoweringOn ? 92 : 0,
                y: isPoweringOn ? -24 : 0,
                opacity: isPoweringOn ? 0.15 : 1,
              }}
              transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
              className="relative rounded-[28px] p-[3px] brushed-chrome border border-white/80"
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-[28px] opacity-55 transition-opacity"
                style={{
                  background: `radial-gradient(circle 220px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.55), transparent 70%)`,
                }}
                aria-hidden="true"
              />

              {/* Top Hinge */}
              <div className="relative h-9 rounded-t-[25px] console-hinge flex items-center justify-between px-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full chrome-screw" />
                  <span className="w-6 h-1.5 rounded-full bg-slate-800/45 shadow-inner" />
                </div>
                <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-[0.28em] text-slate-800/70">
                  MODEL · C-01
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-1.5 rounded-full bg-slate-800/45 shadow-inner" />
                  <span className="w-2.5 h-2.5 rounded-full chrome-screw" />
                </div>
              </div>

              <div className="relative px-6 pt-7 pb-6 flex flex-col items-center justify-between min-h-[330px] sm:min-h-[360px]">
                <span className="absolute top-3 left-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />
                <span className="absolute top-3 right-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />
                <span className="absolute bottom-3 left-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />
                <span className="absolute bottom-3 right-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />

                <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#0F141C]/90 border border-slate-600/50 shadow-inner">
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isPoweringOn
                        ? 'bg-[#7DD3FC] shadow-[0_0_10px_#7DD3FC]'
                        : 'bg-slate-500/70'
                    }`}
                  />
                  <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-[0.18em] text-[#CBD5E1]">
                    {isPoweringOn ? 'FLIPPING OPEN...' : 'SYSTEM OFFLINE'}
                  </span>
                </div>

                <div className="w-full my-6 rounded-2xl p-6 brushed-chrome-dark border border-slate-500/35 text-center relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle 160px at ${sheenPos.x}% ${sheenPos.y}%, rgba(125,211,252,0.22), transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />

                  <h1 className="relative font-[family-name:var(--font-pixel)] text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#F8FAFC] drop-shadow-[0_0_12px_rgba(125,211,252,0.45)]">
                    CIYI.exe
                  </h1>
                  <p className="relative mt-2.5 font-[family-name:var(--font-lcd)] text-lg sm:text-xl text-[#BAE6FD]/90 tracking-wide">
                    A little something for someone special.
                  </p>

                  <div className="mt-4 mx-auto w-24 h-[1px] bg-gradient-to-r from-transparent via-[#7DD3FC]/65 to-transparent" />
                </div>

                <button
                  type="button"
                  onClick={onPowerOn}
                  disabled={isPoweringOn}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#0F141C] text-[#E0F2FE] border border-[#7DD3FC]/45 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.65),0_0_18px_rgba(125,211,252,0.18)] hover:border-[#7DD3FC] hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.7),0_0_24px_rgba(125,211,252,0.38)] active:translate-y-0.5 transition-all cursor-pointer disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7DD3FC]"
                >
                  <Power className="w-4 h-4 text-[#7DD3FC] group-hover:scale-110 transition-transform" />
                  <span className="font-[family-name:var(--font-pixel)] text-[10.5px] sm:text-xs tracking-[0.12em]">
                    [ PRESS TO POWER ON ]
                  </span>
                </button>
              </div>

              {/* Front Clamshell Thumb Notch */}
              <div
                className="mx-auto mb-1.5 w-14 h-1 rounded-full bg-slate-700/60"
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>
        ) : (
          /* ==================== OPENED METALLIC CHROME HANDHELD CONSOLE ==================== */
          <motion.div
            key="open-console"
            initial={{ opacity: 0.75, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: '1400px' }}
            className="relative flex flex-col items-center w-[328px] sm:w-[404px]"
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[28px] z-30 opacity-40"
              style={{
                background: `radial-gradient(circle 260px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.42), transparent 68%)`,
              }}
              aria-hidden="true"
            />

            {/* ---------- UPPER CLAMSHELL LID: UNFOLDS UPWARD FROM HINGE ---------- */}
            <motion.div
              initial={{ rotateX: -125, opacity: 0.35 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
              className="relative w-full rounded-t-[26px] rounded-b-[10px] p-3.5 sm:p-4 brushed-chrome border border-white/80 z-20"
            >
              <span className="absolute top-2.5 left-3 w-2 h-2 rounded-full chrome-screw" aria-hidden="true" />
              <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full chrome-screw" aria-hidden="true" />

              <div className="rounded-2xl p-2.5 sm:p-3 brushed-chrome-dark border border-slate-500/40">
                {/* Bezel Header with Active Cartridge & Quick Eject */}
                <div className="flex items-center justify-between px-1 pb-2 text-[8px] font-[family-name:var(--font-pixel)] text-slate-400">
                  <span className="tracking-widest truncate">
                    {activeCartridge ? activeCartridge.filename : 'CHROME-SP · DISPLAY'}
                  </span>

                  {sdInserted ? (
                    <button
                      type="button"
                      onClick={onEjectSd}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-[#7DD3FC]/40 text-[#7DD3FC] hover:bg-[#7DD3FC]/20 transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowUpFromLine className="w-2.5 h-2.5" />
                      <span>EJECT SD</span>
                    </button>
                  ) : (
                    <span className="text-[#7DD3FC]">
                      {insertingCartridge ? 'INSERTING...' : 'SD: EMPTY'}
                    </span>
                  )}
                </div>

                {/* Deep Black Retro CRT Display */}
                <div className="crt-screen crt-scanlines rounded-xl border border-slate-700/80 min-h-[242px] sm:min-h-[272px] p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden">
                  <div
                    className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 bg-gradient-to-bl from-white/10 to-transparent rotate-12"
                    aria-hidden="true"
                  />

                  <AnimatePresence mode="wait">
                    {/* LOCKED — INSERT SD CARD */}
                    {screenMode === 'locked' && (
                      <motion.div
                        key="scr-locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center"
                      >
                        <div className="mb-2.5 p-2 rounded-lg border border-[#7DD3FC]/35 bg-[#7DD3FC]/10">
                          <Lock className="w-5 h-5 text-[#7DD3FC]" />
                        </div>
                        <p className="font-[family-name:var(--font-pixel)] text-sm sm:text-base text-[#F8FAFC] tracking-wider">
                          HELLO, CIYI.
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-pixel)] text-[10px] sm:text-[11px] text-[#BAE6FD] tracking-wide">
                          YOU HAVE A SPECIAL PACKAGE.
                        </p>
                        <p className="mt-2.5 font-[family-name:var(--font-lcd)] text-base sm:text-lg text-slate-300 leading-tight max-w-[245px]">
                          INSERT YOUR MEMORY CARD TO CONTINUE.
                        </p>

                        <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded border border-[#7DD3FC]/40 bg-[#0B1220] text-[#7DD3FC]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC] animate-ping" />
                          <span className="font-[family-name:var(--font-pixel)] text-[8.5px] tracking-widest">
                            4 SD CARDS READY
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                      </motion.div>
                    )}

                    {/* INSERTING / LOADING */}
                    {screenMode === 'inserting' && (
                      <motion.div
                        key="scr-inserting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center"
                      >
                        <p className="font-[family-name:var(--font-pixel)] text-xs sm:text-sm text-[#7DD3FC] tracking-wider">
                          MEMORY CARD DETECTED.
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-lcd)] text-lg text-slate-200 tracking-wide">
                          {activeCartridge?.id === 'minigame'
                            ? 'BOOTING HEART_GAME.rom...'
                            : activeCartridge?.id === 'letters'
                            ? 'OPENING LOVE_LETTERS.txt...'
                            : activeCartridge?.id === 'music'
                            ? 'MOUNTING CIYI_TUNES.wav...'
                            : 'LOADING LITTLE REMINDERS...'}
                        </p>

                        <div className="mt-4 w-48 sm:w-56 h-4 p-0.5 border border-[#7DD3FC]/70 bg-[#09111E]">
                          <div
                            className="h-full bg-gradient-to-r from-[#38BDF8] to-[#BAE6FD] transition-all duration-150"
                            style={{ width: `${loadingProgress}%` }}
                          />
                        </div>
                        <span className="mt-1.5 font-[family-name:var(--font-pixel)] text-[9px] text-slate-400 tabular-nums">
                          {loadingProgress}% · {activeCartridge?.filename}
                        </span>
                      </motion.div>
                    )}

                    {/* ACCESS GRANTED */}
                    {screenMode === 'granted' && (
                      <motion.div
                        key="scr-granted"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center"
                      >
                        <div className="w-11 h-11 rounded-lg border-2 border-[#7DD3FC] bg-[#7DD3FC]/15 flex items-center justify-center mb-3 shadow-[0_0_22px_rgba(125,211,252,0.45)]">
                          <Check className="w-6 h-6 text-[#BAE6FD]" />
                        </div>
                        <p className="font-[family-name:var(--font-pixel)] text-sm sm:text-base text-[#F8FAFC] tracking-widest drop-shadow-[0_0_10px_rgba(125,211,252,0.65)]">
                          ACCESS GRANTED ♡
                        </p>
                      </motion.div>
                    )}

                    {/* CARTRIDGE 1: REMINDERS ARCHIVE */}
                    {screenMode === 'archive' && (
                      <motion.div
                        key="scr-archive"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col justify-between"
                      >
                        <div className="text-center border-b border-slate-700/70 pb-1.5">
                          <p className="font-[family-name:var(--font-pixel)] text-[9px] sm:text-[10px] text-[#F8FAFC] leading-tight">
                            WELCOME TO YOUR LITTLE REMINDER COLLECTION.
                          </p>
                          <p className="mt-0.5 font-[family-name:var(--font-lcd)] text-sm text-[#BAE6FD]/85">
                            Things I hope you&apos;ll never forget. ({openedIds.length}/6)
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 my-2">
                          {CIYI_REMINDERS.map((item, idx) => {
                            const isSelected = selectedIndex === idx;
                            const isOpened = openedIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectReminder(idx)}
                                className={`text-left px-2 py-1.5 rounded border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#7DD3FC] bg-[#7DD3FC]/18 shadow-[0_0_12px_rgba(125,211,252,0.28)]'
                                    : 'border-slate-700/80 bg-[#0B1018]/90 hover:border-slate-500'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-[family-name:var(--font-pixel)] text-[7.5px] text-[#7DD3FC]">
                                    {item.code}
                                  </span>
                                  <span className="font-[family-name:var(--font-pixel)] text-[7px] text-slate-400">
                                    {isOpened ? '✓ READ' : 'NEW'}
                                  </span>
                                </div>
                                <p className="mt-0.5 font-[family-name:var(--font-pixel)] text-[8px] sm:text-[8.5px] text-[#F1F5F9] truncate">
                                  {item.title}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {allOpened ? (
                          <button
                            type="button"
                            onClick={onOpenSecret}
                            className="w-full py-1.5 px-2 rounded border border-[#7DD3FC] bg-[#7DD3FC]/20 text-[#F8FAFC] font-[family-name:var(--font-pixel)] text-[8.5px] sm:text-[9px] tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#7DD3FC]/30 transition-colors cursor-pointer shadow-[0_0_16px_rgba(125,211,252,0.35)]"
                          >
                            <Sparkles className="w-3 h-3 text-[#7DD3FC]" />
                            <span>ALL UNLOCKED · OPEN SECRET ♡</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-[8px] font-[family-name:var(--font-pixel)] text-slate-400 pt-0.5">
                            <span>D-PAD: MOVE</span>
                            <span className="text-[#BAE6FD]">A / TAP: OPEN</span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* CARTRIDGE 1 DETAIL: 3D CARD FLIP */}
                    {screenMode === 'card' && (
                      <motion.div
                        key={`scr-card-${activeReminder.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 text-[8px] font-[family-name:var(--font-pixel)]">
                          <span className="text-[#7DD3FC]">{activeReminder.code}</span>
                          <span className="text-slate-400">
                            {selectedIndex + 1} / {CIYI_REMINDERS.length}
                          </span>
                        </div>

                        <div className="card-flip-perspective flex-1 flex items-center justify-center my-1.5">
                          <div
                            onClick={() => {
                              setCardFlipped((f) => !f);
                              consoleAudio.playCardFlip();
                            }}
                            className={`card-flip-inner relative w-full min-h-[146px] sm:min-h-[164px] cursor-pointer ${
                              cardFlipped ? 'is-flipped' : ''
                            }`}
                          >
                            <div className="card-flip-face absolute inset-0 rounded-lg border border-[#7DD3FC]/45 bg-[#0C1422] flex flex-col items-center justify-center p-3 text-center">
                              <span className="font-[family-name:var(--font-pixel)] text-[10px] text-[#7DD3FC]">
                                {activeReminder.code}
                              </span>
                              <p className="mt-1.5 font-[family-name:var(--font-pixel)] text-xs text-white">
                                {activeReminder.title}
                              </p>
                            </div>

                            <div className="card-flip-face card-flip-back absolute inset-0 rounded-lg border border-[#7DD3FC]/70 bg-gradient-to-b from-[#0E1828] to-[#080E18] p-3 flex flex-col justify-center text-left shadow-[inset_0_0_16px_rgba(125,211,252,0.12)]">
                              <p className="font-[family-name:var(--font-pixel)] text-[9.5px] sm:text-[10.5px] text-[#7DD3FC] tracking-wide mb-1.5">
                                {activeReminder.title}
                              </p>
                              <p className="font-[family-name:var(--font-lcd)] text-[16px] sm:text-[18px] leading-[1.2] text-[#F1F5F9]">
                                {activeReminder.message}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/70">
                          <button
                            type="button"
                            onClick={onBackToArchive}
                            className="font-[family-name:var(--font-pixel)] text-[8px] text-slate-300 hover:text-white cursor-pointer"
                          >
                            [B] ARCHIVE
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDpad('left')}
                              aria-label="Previous reminder"
                              className="p-0.5 text-slate-300 hover:text-[#7DD3FC] cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleButtonA()}
                              className="font-[family-name:var(--font-pixel)] text-[8px] text-[#7DD3FC] hover:text-white cursor-pointer"
                            >
                              {allOpened ? '[A] SECRET ♡' : '[A] NEXT >'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* CARTRIDGE 1 FINAL SECRET */}
                    {screenMode === 'secret' && (
                      <motion.div
                        key="scr-secret"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col justify-between max-h-[218px] sm:max-h-[246px]"
                      >
                        <div className="flex items-center justify-center gap-2 border-b border-[#7DD3FC]/30 pb-1.5">
                          <svg
                            className="w-5 h-5 text-[#7DD3FC] animate-heart-pulse shrink-0"
                            viewBox="0 0 16 14"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <rect x="2" y="0" width="4" height="2" />
                            <rect x="10" y="0" width="4" height="2" />
                            <rect x="0" y="2" width="16" height="4" />
                            <rect x="2" y="6" width="12" height="2" />
                            <rect x="4" y="8" width="8" height="2" />
                            <rect x="6" y="10" width="4" height="2" />
                            <rect x="7" y="12" width="2" height="2" />
                          </svg>
                          <p className="font-[family-name:var(--font-pixel)] text-[9.5px] sm:text-[10.5px] text-[#F8FAFC] tracking-wider">
                            {FINAL_SECRET_TITLE}
                          </p>
                        </div>

                        <div
                          ref={secretScrollRef}
                          className="my-1.5 flex-1 overflow-y-auto pr-1 space-y-2 text-left font-[family-name:var(--font-lcd)] text-[15.5px] sm:text-[17px] leading-[1.2] text-[#E2E8F0]"
                        >
                          {FINAL_SECRET_PARAGRAPHS.map((para, idx) => (
                            <p
                              key={idx}
                              className={
                                idx === FINAL_SECRET_PARAGRAPHS.length - 1
                                  ? 'text-[#7DD3FC] font-bold pt-0.5'
                                  : ''
                              }
                            >
                              {para}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-[#7DD3FC]/30">
                          <span className="font-[family-name:var(--font-pixel)] text-[7.5px] text-slate-400">
                            END OF MEMORY CARD.
                          </span>
                          <button
                            type="button"
                            onClick={onPlayAgain}
                            className="px-2 py-1 rounded bg-[#7DD3FC]/20 border border-[#7DD3FC] font-[family-name:var(--font-pixel)] text-[8px] text-[#F8FAFC] hover:bg-[#7DD3FC]/35 cursor-pointer"
                          >
                            [ PLAY AGAIN ♡ ]
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* CARTRIDGE 2: PIXEL MINI-GAME */}
                    {screenMode === 'minigame' && (
                      <motion.div
                        key="scr-minigame"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col"
                      >
                        <PixelMiniGame controlRef={miniGameRef} />
                      </motion.div>
                    )}

                    {/* CARTRIDGE 3: LOVE LETTERS */}
                    {screenMode === 'letters' && (
                      <motion.div
                        key="scr-letters"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col"
                      >
                        <LoveLettersView
                          selectedIndex={letterIndex}
                          isReading={readingLetter}
                          readIds={readLetterIds}
                          onOpenLetter={handleOpenLetter}
                          onBackToList={() => setReadingLetter(false)}
                          onNextLetter={() =>
                            handleOpenLetter((letterIndex + 1) % CIYI_LOVE_LETTERS.length)
                          }
                          onPrevLetter={() =>
                            handleOpenLetter(
                              (letterIndex + CIYI_LOVE_LETTERS.length - 1) %
                                CIYI_LOVE_LETTERS.length
                            )
                          }
                        />
                      </motion.div>
                    )}

                    {/* CARTRIDGE 4: MUSIC PLAYER */}
                    {screenMode === 'music' && (
                      <motion.div
                        key="scr-music"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex-1 flex flex-col"
                      >
                        <MusicPlayerView
                          trackIndex={trackIndex}
                          isPlaying={isMusicPlaying}
                          onTogglePlay={onToggleMusic}
                          onPrevTrack={() =>
                            onSelectTrack(
                              (trackIndex + CIYI_MUSIC_TRACKS.length - 1) %
                                CIYI_MUSIC_TRACKS.length
                            )
                          }
                          onNextTrack={() =>
                            onSelectTrack((trackIndex + 1) % CIYI_MUSIC_TRACKS.length)
                          }
                          onSelectTrack={onSelectTrack}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* ---------- MECHANICAL HINGE BARREL + LED INDICATORS ---------- */}
            <div className="relative w-[96%] h-7 console-hinge rounded-sm flex items-center justify-between px-4 z-10 border-y border-slate-800/70">
              <div className="flex items-center gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="w-1 h-2.5 rounded-full bg-slate-900/70" />
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7DD3FC] shadow-[0_0_8px_#7DD3FC]" />
                  <span className="font-[family-name:var(--font-pixel)] text-[7px] text-slate-900 font-bold">
                    PWR
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      insertingCartridge || screenMode === 'inserting'
                        ? 'bg-[#38BDF8] animate-ping'
                        : sdInserted
                        ? 'bg-[#7DD3FC] shadow-[0_0_8px_#7DD3FC]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <span className="font-[family-name:var(--font-pixel)] text-[7px] text-slate-900 font-bold">
                    SD
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="w-1 h-2.5 rounded-full bg-slate-900/70" />
                ))}
              </div>
            </div>

            {/* ---------- LOWER CLAMSHELL DECK: CONTROLS & PHYSICAL SD SLOT INSERTION ---------- */}
            <div className="relative w-full rounded-t-[10px] rounded-b-[28px] px-5 pt-5 pb-6 brushed-chrome border border-white/80">
              <span className="absolute bottom-3 left-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />
              <span className="absolute bottom-3 right-3.5 w-2.5 h-2.5 rounded-full chrome-screw" aria-hidden="true" />

              {/* RIGHT-EDGE SD CARD SLOT (With Physical Sliding-Into-Console Animation) */}
              <div
                ref={slotRef}
                onClick={sdInserted ? onEjectSd : onCardSlotClick}
                title={sdInserted ? 'Click to eject current SD card' : 'SD Card Slot'}
                className={`absolute -right-2.5 top-5 w-4 h-24 rounded-r-md border-2 transition-all flex flex-col items-center justify-center cursor-pointer z-30 ${
                  sdNearSlot
                    ? 'bg-[#0F172A] border-[#7DD3FC] shadow-[0_0_18px_rgba(125,211,252,0.85)] scale-105'
                    : sdInserted
                    ? 'bg-[#1E293B] border-[#7DD3FC]/75 shadow-[0_0_10px_rgba(125,211,252,0.3)] hover:border-[#7DD3FC]'
                    : 'bg-[#0F141C] border-slate-600 hover:border-[#7DD3FC]/70'
                }`}
              >
                {/* Animated Sliding SD Card Entering Inside the Console Slot */}
                <AnimatePresence>
                  {insertingCartridge && (
                    <motion.div
                      key={`slot-slide-${insertingCartridge.id}`}
                      initial={{ x: 64, opacity: 0.95 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.48, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-none absolute right-0 top-1 bottom-1 w-16 rounded-r-md border border-[#7DD3FC]/80 bg-gradient-to-l from-[#1B2029] via-[#2A313D] to-[#0F172A] shadow-[0_8px_18px_rgba(0,0,0,0.75)] flex items-center overflow-hidden"
                    >
                      {/* Metallic contact edge entering first */}
                      <div className="h-full w-2 bg-gradient-to-b from-[#FFFFFF] via-[#CBD5E1] to-[#64748B]" />
                      {/* Mini holographic badge */}
                      <div
                        className={`ml-1.5 mr-2 flex-1 h-[84%] rounded-[2px] bg-gradient-to-br ${insertingCartridge.accentGradient} holo-sticker flex items-center justify-center`}
                      >
                        <span className="font-[family-name:var(--font-pixel)] text-[5.5px] text-[#0F172A] font-bold -rotate-90 whitespace-nowrap">
                          {insertingCartridge.badge}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {sdInserted ? (
                  <div className="w-2.5 h-20 rounded-r-sm bg-gradient-to-b from-[#475569] via-[#1E293B] to-[#0F172A] border-l-2 border-[#7DD3FC] shadow-[0_0_8px_rgba(125,211,252,0.5)]" />
                ) : (
                  <span
                    className={`w-1.5 h-16 rounded-full ${
                      sdNearSlot ? 'bg-[#7DD3FC] animate-pulse' : 'bg-black/90'
                    }`}
                  />
                )}
              </div>

              <span
                className={`absolute right-3 top-2 font-[family-name:var(--font-pixel)] text-[7px] tracking-wider ${
                  sdNearSlot ? 'text-[#0284C7] font-bold' : 'text-slate-700'
                }`}
              >
                {insertingCartridge
                  ? 'SLIDING IN...'
                  : sdNearSlot
                  ? 'DROP SD!'
                  : sdInserted
                  ? 'SWAP ▸'
                  : 'SD SLOT ▸'}
              </span>

              {/* Main Control Row: D-Pad + A & B Buttons */}
              <div className="flex items-center justify-between px-1 sm:px-3 pt-2">
                <div className="relative w-[104px] h-[104px] sm:w-[114px] sm:h-[114px] rounded-full bg-slate-900/18 p-2 flex items-center justify-center shadow-inner">
                  <div className="relative w-full h-full">
                    <button
                      type="button"
                      onClick={() => handleDpad('up')}
                      aria-label="D-Pad Up"
                      className={`chrome-btn absolute top-0 left-1/3 w-1/3 h-[36%] rounded-t-md flex items-center justify-center text-[10px] font-bold text-slate-700 cursor-pointer ${
                        pressedBtn === 'dpad-up' ? 'is-pressed' : ''
                      }`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDpad('down')}
                      aria-label="D-Pad Down"
                      className={`chrome-btn absolute bottom-0 left-1/3 w-1/3 h-[36%] rounded-b-md flex items-center justify-center text-[10px] font-bold text-slate-700 cursor-pointer ${
                        pressedBtn === 'dpad-down' ? 'is-pressed' : ''
                      }`}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDpad('left')}
                      aria-label="D-Pad Left"
                      className={`chrome-btn absolute left-0 top-1/3 h-1/3 w-[36%] rounded-l-md flex items-center justify-center text-[10px] font-bold text-slate-700 cursor-pointer ${
                        pressedBtn === 'dpad-left' ? 'is-pressed' : ''
                      }`}
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDpad('right')}
                      aria-label="D-Pad Right"
                      className={`chrome-btn absolute right-0 top-1/3 h-1/3 w-[36%] rounded-r-md flex items-center justify-center text-[10px] font-bold text-slate-700 cursor-pointer ${
                        pressedBtn === 'dpad-right' ? 'is-pressed' : ''
                      }`}
                    >
                      ▶
                    </button>
                    <div
                      className="pointer-events-none absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-[#CBD5E1] flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* Circular Chrome A & B Action Buttons */}
                <div className="relative flex items-center gap-4 sm:gap-5 pr-2">
                  <div className="flex flex-col items-center translate-y-3">
                    <button
                      type="button"
                      onClick={handleButtonB}
                      aria-label="B Button (Back)"
                      className={`chrome-btn w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center font-[family-name:var(--font-pixel)] text-sm font-bold text-slate-800 border border-[#7DD3FC]/40 cursor-pointer ${
                        pressedBtn === 'btn-b' ? 'is-pressed' : ''
                      }`}
                    >
                      B
                    </button>
                    <span className="mt-1.5 font-[family-name:var(--font-pixel)] text-[8px] text-slate-700 tracking-wider">
                      BACK
                    </span>
                  </div>

                  <div className="flex flex-col items-center -translate-y-3">
                    <button
                      type="button"
                      onClick={handleButtonA}
                      aria-label="A Button (Confirm)"
                      className={`chrome-btn w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center font-[family-name:var(--font-pixel)] text-sm font-bold text-slate-800 border border-[#7DD3FC]/60 cursor-pointer ${
                        pressedBtn === 'btn-a' ? 'is-pressed' : ''
                      }`}
                    >
                      A
                    </button>
                    <span className="mt-1.5 font-[family-name:var(--font-pixel)] text-[8px] text-slate-700 tracking-wider">
                      OK
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom SELECT & START */}
              <div className="mt-5 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleSelectBtn}
                    aria-label="Select button"
                    className={`chrome-btn w-12 h-3.5 rounded-full cursor-pointer ${
                      pressedBtn === 'btn-select' ? 'is-pressed' : ''
                    }`}
                  />
                  <span className="mt-1.5 font-[family-name:var(--font-pixel)] text-[8px] tracking-widest text-slate-700">
                    SELECT
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleStartBtn}
                    aria-label="Start button"
                    className={`chrome-btn w-12 h-3.5 rounded-full cursor-pointer ${
                      pressedBtn === 'btn-start' ? 'is-pressed' : ''
                    }`}
                  />
                  <span className="mt-1.5 font-[family-name:var(--font-pixel)] text-[8px] tracking-widest text-slate-700">
                    START
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
