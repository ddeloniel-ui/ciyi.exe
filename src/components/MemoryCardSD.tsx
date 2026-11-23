import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { HardDriveDownload } from 'lucide-react';
import { SdCartridge } from '../data/cartridges';

interface MemoryCardSDProps {
  cartridge: SdCartridge;
  slotRef: React.RefObject<HTMLDivElement | null>;
  isInserting: boolean;
  isActiveInConsole: boolean;
  onNearSlot: (near: boolean) => void;
  onInsert: (cartridge: SdCartridge) => void;
}

export const MemoryCardSD: React.FC<MemoryCardSDProps> = ({
  cartridge,
  slotRef,
  isInserting,
  isActiveInConsole,
  onNearSlot,
  onInsert,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [flyDelta, setFlyDelta] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    moved: boolean;
  } | null>(null);

  const checkNearSlot = useCallback((): boolean => {
    if (!cardRef.current || !slotRef.current) return false;
    const cardRect = cardRef.current.getBoundingClientRect();
    const slotRect = slotRef.current.getBoundingClientRect();

    const cardCx = cardRect.left + cardRect.width / 2;
    const cardCy = cardRect.top + cardRect.height / 2;
    const slotCx = slotRect.left + slotRect.width / 2;
    const slotCy = slotRect.top + slotRect.height / 2;

    const dist = Math.hypot(cardCx - slotCx, cardCy - slotCy);
    return dist < 135;
  }, [slotRef]);

  // Compute exact flight vector from this SD card to the console's right-edge SD slot
  useLayoutEffect(() => {
    if (!isInserting) {
      setFlyDelta(null);
      return;
    }
    if (!cardRef.current || !slotRef.current) {
      setFlyDelta({ x: -90, y: -24 });
      return;
    }
    const cardRect = cardRef.current.getBoundingClientRect();
    const slotRect = slotRef.current.getBoundingClientRect();

    const cardCx = cardRect.left + cardRect.width / 2;
    const cardCy = cardRect.top + cardRect.height / 2;
    const targetCx = slotRect.right + 16;
    const targetCy = slotRect.top + slotRect.height / 2;

    setFlyDelta({
      x: targetCx - cardCx,
      y: targetCy - cardCy,
    });
  }, [isInserting, slotRef]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;

      if (Math.hypot(dx, dy) > 6) {
        dragStartRef.current.moved = true;
      }

      setOffset({ x: dx, y: dy });
      onNearSlot(checkNearSlot());
    };

    const handleUp = () => {
      const wasClick = dragStartRef.current && !dragStartRef.current.moved;
      const aligned = checkNearSlot();

      setDragging(false);
      onNearSlot(false);
      dragStartRef.current = null;

      if (aligned || wasClick) {
        setOffset({ x: 0, y: 0 });
        onInsert(cartridge);
      } else {
        setOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, checkNearSlot, onNearSlot, onInsert, cartridge]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isInserting || isActiveInConsole) return;
    e.preventDefault();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      moved: false,
    };
    setDragging(true);
  };

  const insertingTransform = flyDelta
    ? `translate3d(${flyDelta.x}px, ${flyDelta.y}px, 0) rotate(-90deg) scale(0.56)`
    : 'translate3d(-70px, -16px, 0) rotate(-90deg) scale(0.58)';

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Draggable Sparkling Graphite & Holographic SD Cartridge */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={isActiveInConsole ? -1 : 0}
        aria-label={`${cartridge.label} (${cartridge.filename}). ${
          isActiveInConsole ? 'Currently inserted in console.' : 'Drag into SD slot or tap to insert.'
        }`}
        onPointerDown={handlePointerDown}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isInserting && !isActiveInConsole) {
            e.preventDefault();
            onInsert(cartridge);
          }
        }}
        style={{
          transform: isInserting
            ? insertingTransform
            : dragging
            ? `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.06)`
            : undefined,
          transition: dragging
            ? 'none'
            : isInserting
            ? 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease 360ms'
            : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease',
          opacity: isInserting ? 0 : isActiveInConsole ? 0.36 : 1,
          touchAction: 'none',
        }}
        className={`relative ${
          dragging
            ? 'z-50 cursor-grabbing'
            : isInserting
            ? 'z-50 pointer-events-none'
            : isActiveInConsole
            ? 'cursor-default'
            : 'z-30 cursor-grab hover:-translate-y-1'
        } focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7DD3FC]`}
      >
        <div
          className={`relative w-[112px] h-[142px] sm:w-[122px] sm:h-[154px] p-[2px] bg-gradient-to-br from-[#E2E8F0] via-[#475569] to-[#0F172A] shadow-[0_14px_28px_-8px_rgba(0,0,0,0.85),0_0_16px_rgba(125,211,252,0.22)] ${
            isActiveInConsole ? 'ring-1 ring-[#7DD3FC]/50' : ''
          }`}
          style={{
            clipPath:
              'polygon(0 5px, 5px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))',
          }}
        >
          <div
            className="relative w-full h-full bg-gradient-to-b from-[#2A313D] via-[#1B2029] to-[#11151C] flex flex-col justify-between p-2 overflow-hidden"
            style={{
              clipPath:
                'polygon(0 4px, 4px 0, calc(100% - 19px) 0, 100% 19px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
            }}
          >
            {/* Sparkling Diagonal Light Sweep across entire SD body */}
            {!isActiveInConsole && (
              <div
                className="pointer-events-none absolute -inset-y-8 -left-10 w-12 bg-gradient-to-r from-transparent via-white/45 to-transparent sd-sparkle-sweep z-20"
                aria-hidden="true"
              />
            )}

            {/* Twinkling 4-Point Sparkle Glints */}
            {!isActiveInConsole && (
              <>
                <svg
                  className="pointer-events-none absolute top-3 left-2.5 w-3 h-3 text-white drop-shadow-[0_0_6px_#BAE6FD] sd-glint z-20"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2Z" />
                </svg>
                <svg
                  className="pointer-events-none absolute top-11 right-2.5 w-2.5 h-2.5 text-[#E0F2FE] drop-shadow-[0_0_6px_#7DD3FC] sd-glint z-20"
                  style={{ animationDelay: '0.75s' }}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2Z" />
                </svg>
                <svg
                  className="pointer-events-none absolute bottom-5 left-3.5 w-2 h-2 text-white/95 drop-shadow-[0_0_5px_#FFFFFF] sd-glint z-20"
                  style={{ animationDelay: '1.35s' }}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2Z" />
                </svg>
              </>
            )}

            {/* Silver Contact Pins */}
            <div className="flex items-center gap-[2.5px] pr-4 pt-0.5" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, idx) => (
                <span
                  key={idx}
                  className="flex-1 h-2 rounded-b-[1px] bg-gradient-to-b from-[#FFFFFF] via-[#E2E8F0] to-[#64748B] shadow-[0_1px_2px_rgba(125,211,252,0.35)]"
                />
              ))}
            </div>

            {/* Write-protect side switch */}
            <div
              className="absolute left-0 top-10 w-1 h-4 bg-[#E2E8F0] rounded-r-[1px]"
              aria-hidden="true"
            />

            {/* Holographic Metallic Sticker with Sparkling Foil */}
            <div className="relative my-1.5 flex-1 rounded p-[1.5px] bg-gradient-to-b from-white/90 to-slate-400/60">
              <div
                className={`w-full h-full rounded-[3px] p-1.5 flex flex-col justify-between text-[#0F172A] relative overflow-hidden bg-gradient-to-br ${cartridge.accentGradient} holo-sticker`}
              >
                {/* Foil Micro-Shimmer */}
                {!isActiveInConsole && (
                  <div
                    className="pointer-events-none absolute -inset-y-6 -left-8 w-8 bg-gradient-to-r from-transparent via-white/75 to-transparent sd-sparkle-sweep"
                    style={{ animationDelay: '0.4s' }}
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between border-b border-slate-900/20 pb-0.5">
                  <span className="font-[family-name:var(--font-pixel)] text-[6px] font-bold">
                    {cartridge.badge}
                  </span>
                  <span className="font-[family-name:var(--font-pixel)] text-[6px] opacity-80">
                    {cartridge.capacity}
                  </span>
                </div>

                <div className="relative z-10 my-auto text-center">
                  <p className="font-[family-name:var(--font-pixel)] text-[8px] sm:text-[8.5px] font-bold leading-tight text-[#0B1120]">
                    {cartridge.label}
                  </p>
                  <div className="mt-1 py-0.5 px-1 bg-[#0F172A] text-[#7DD3FC] rounded-[2px]">
                    <p className="font-[family-name:var(--font-lcd)] text-[11px] tracking-wide leading-none truncate">
                      {cartridge.filename}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[6px] font-[family-name:var(--font-pixel)] text-slate-900/80">
                  <span>{isActiveInConsole ? 'MOUNTED' : 'READY'}</span>
                  <span>✦ ♡</span>
                </div>
              </div>
            </div>

            {/* Bottom Grip Lines */}
            <div className="flex flex-col gap-[2px] px-1.5 pb-0.5" aria-hidden="true">
              <span className="w-full h-[1.5px] rounded-full bg-black/55" />
              <span className="w-full h-[1.5px] rounded-full bg-black/55" />
            </div>
          </div>
        </div>
      </div>

      {/* Tap-to-Insert or Mounted Label */}
      {isActiveInConsole ? (
        <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider text-[#7DD3FC]">
          IN CONSOLE
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onInsert(cartridge)}
          disabled={isInserting}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#7DD3FC]/50 bg-[#0F172A]/90 text-[#E0F2FE] font-[family-name:var(--font-pixel)] text-[8px] tracking-wider hover:bg-[#7DD3FC]/20 hover:border-[#7DD3FC] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-[0_0_12px_rgba(125,211,252,0.18)]"
        >
          <HardDriveDownload className="w-3 h-3 text-[#7DD3FC]" />
          <span>INSERT</span>
        </button>
      )}
    </div>
  );
};
