import React, { useState, useEffect, useRef, useCallback } from 'react';
import { consoleAudio } from '../utils/consoleAudio';

export interface MiniGameHandle {
  moveLeft: () => void;
  moveRight: () => void;
  pressAction: () => void;
}

interface FallingItem {
  id: number;
  col: number; // 0..6
  y: number;   // 0..100
  kind: 'heart' | 'star' | 'glitch';
  speed: number;
}

interface PixelMiniGameProps {
  controlRef: React.MutableRefObject<MiniGameHandle | null>;
}

const COLS = 7;

export const PixelMiniGame: React.FC<PixelMiniGameProps> = ({ controlRef }) => {
  const [phase, setPhase] = useState<'title' | 'playing' | 'gameover'>('title');
  const [playerCol, setPlayerCol] = useState(3);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [items, setItems] = useState<FallingItem[]>([]);

  const playerColRef = useRef(3);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const nextIdRef = useRef(1);

  const startGame = useCallback(() => {
    playerColRef.current = 3;
    scoreRef.current = 0;
    livesRef.current = 3;
    setPlayerCol(3);
    setScore(0);
    setLives(3);
    setItems([]);
    setPhase('playing');
    consoleAudio.playAccessGranted();
  }, []);

  const moveLeft = useCallback(() => {
    if (phase !== 'playing') return;
    playerColRef.current = Math.max(0, playerColRef.current - 1);
    setPlayerCol(playerColRef.current);
  }, [phase]);

  const moveRight = useCallback(() => {
    if (phase !== 'playing') return;
    playerColRef.current = Math.min(COLS - 1, playerColRef.current + 1);
    setPlayerCol(playerColRef.current);
  }, [phase]);

  useEffect(() => {
    controlRef.current = {
      moveLeft,
      moveRight,
      pressAction: () => {
        if (phase !== 'playing') {
          startGame();
        }
      },
    };
  }, [controlRef, moveLeft, moveRight, phase, startGame]);

  // Main 60ms retro arcade game loop
  useEffect(() => {
    if (phase !== 'playing') return;

    let tickCount = 0;
    const loop = window.setInterval(() => {
      tickCount += 1;

      setItems((prev) => {
        const updated: FallingItem[] = [];

        for (const item of prev) {
          const ny = item.y + item.speed;

          // Check basket collision near bottom (y between 80 and 93)
          if (ny >= 80 && ny <= 94 && item.col === playerColRef.current) {
            if (item.kind === 'heart') {
              scoreRef.current += 10;
              setScore(scoreRef.current);
              setBestScore((b) => Math.max(b, scoreRef.current));
              consoleAudio.playGameCatch(false);
            } else if (item.kind === 'star') {
              scoreRef.current += 25;
              setScore(scoreRef.current);
              setBestScore((b) => Math.max(b, scoreRef.current));
              consoleAudio.playGameCatch(true);
            } else {
              livesRef.current -= 1;
              setLives(livesRef.current);
              consoleAudio.playGameHit();
              if (livesRef.current <= 0) {
                setPhase('gameover');
              }
            }
            continue;
          }

          if (ny < 102) {
            updated.push({ ...item, y: ny });
          }
        }

        // Spawn a new falling pixel item periodically
        if (tickCount % 10 === 0) {
          const roll = Math.random();
          const kind: FallingItem['kind'] =
            roll < 0.62 ? 'heart' : roll < 0.8 ? 'star' : 'glitch';
          updated.push({
            id: nextIdRef.current++,
            col: Math.floor(Math.random() * COLS),
            y: -4,
            kind,
            speed: 3.6 + Math.min(2.4, scoreRef.current / 120),
          });
        }

        return updated;
      });
    }, 60);

    return () => window.clearInterval(loop);
  }, [phase]);

  return (
    <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
      {/* Top Arcade HUD */}
      <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 text-[8px] font-[family-name:var(--font-pixel)]">
        <span className="text-[#7DD3FC] tabular-nums">SCR:{String(score).padStart(3, '0')}</span>
        <span className="text-slate-300">
          {score >= 100 ? 'CIYI PRO ♡' : 'HEART CATCHER'}
        </span>
        <span className="text-[#BAE6FD]">
          {'♥'.repeat(Math.max(0, lives))}
          <span className="opacity-25">{'♥'.repeat(Math.max(0, 3 - lives))}</span>
        </span>
      </div>

      {/* Playfield Area */}
      <div
        onClick={(e) => {
          if (phase !== 'playing') return;
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX - rect.left < rect.width / 2) moveLeft();
          else moveRight();
        }}
        className="relative flex-1 my-1.5 rounded border border-slate-800 bg-[#05080F] overflow-hidden min-h-[152px] sm:min-h-[172px]"
      >
        {phase === 'title' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            <p className="font-[family-name:var(--font-pixel)] text-xs text-[#7DD3FC] tracking-wider">
              HEART CATCHER ♡
            </p>
            <p className="mt-2 font-[family-name:var(--font-lcd)] text-base text-slate-300 leading-tight max-w-[215px]">
              Catch icy hearts (+10) &amp; silver stars (+25). Dodge dark glitches!
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="mt-3.5 px-3.5 py-1.5 rounded border border-[#7DD3FC] bg-[#7DD3FC]/18 font-[family-name:var(--font-pixel)] text-[9px] text-[#F8FAFC] hover:bg-[#7DD3FC]/30 cursor-pointer"
            >
              [ PRESS A TO PLAY ]
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <>
            {/* Falling Pixel Sprites */}
            {items.map((item) => (
              <div
                key={item.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${((item.col + 0.5) / COLS) * 100}%`,
                  top: `${item.y}%`,
                }}
              >
                {item.kind === 'heart' && (
                  <svg className="w-4 h-4 text-[#7DD3FC] drop-shadow-[0_0_6px_rgba(125,211,252,0.8)]" viewBox="0 0 12 10" fill="currentColor">
                    <rect x="2" y="0" width="3" height="2" />
                    <rect x="7" y="0" width="3" height="2" />
                    <rect x="0" y="2" width="12" height="3" />
                    <rect x="2" y="5" width="8" height="2" />
                    <rect x="4" y="7" width="4" height="2" />
                    <rect x="5" y="9" width="2" height="1" />
                  </svg>
                )}
                {item.kind === 'star' && (
                  <svg className="w-4 h-4 text-[#F8FAFC] drop-shadow-[0_0_7px_rgba(255,255,255,0.9)]" viewBox="0 0 10 10" fill="currentColor">
                    <rect x="4" y="0" width="2" height="10" />
                    <rect x="0" y="4" width="10" height="2" />
                    <rect x="2" y="2" width="6" height="6" opacity="0.65" />
                  </svg>
                )}
                {item.kind === 'glitch' && (
                  <div className="w-3.5 h-3.5 bg-slate-500 border border-red-400/70 rotate-45" />
                )}
              </div>
            ))}

            {/* Player Chrome Pixel Catcher Ship */}
            <div
              className="absolute bottom-2 -translate-x-1/2 transition-all duration-75"
              style={{
                left: `${((playerCol + 0.5) / COLS) * 100}%`,
              }}
            >
              <div className="w-9 h-3 rounded-sm bg-gradient-to-b from-[#F8FAFC] to-[#64748B] border border-[#7DD3FC] shadow-[0_0_10px_rgba(125,211,252,0.75)] flex items-center justify-center">
                <span className="w-3 h-1 bg-[#7DD3FC]" />
              </div>
            </div>
          </>
        )}

        {phase === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 bg-[#05080F]/95">
            <p className="font-[family-name:var(--font-pixel)] text-xs text-[#BAE6FD]">
              {score >= 100 ? 'YOU WON MY HEART ♡' : 'GAME OVER'}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-lcd)] text-lg text-white">
              SCORE: {score} · BEST: {bestScore}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="mt-3 px-3.5 py-1.5 rounded border border-[#7DD3FC] bg-[#7DD3FC]/18 font-[family-name:var(--font-pixel)] text-[9px] text-[#F8FAFC] hover:bg-[#7DD3FC]/30 cursor-pointer"
            >
              [ PLAY AGAIN ]
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Hint */}
      <div className="flex items-center justify-between text-[7.5px] font-[family-name:var(--font-pixel)] text-slate-400 pt-0.5">
        <span>◀ ▶ D-PAD: MOVE</span>
        <span>BEST: {bestScore}</span>
      </div>
    </div>
  );
};
