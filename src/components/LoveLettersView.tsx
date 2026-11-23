import React from 'react';
import { Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { CIYI_LOVE_LETTERS } from '../data/cartridges';

interface LoveLettersViewProps {
  selectedIndex: number;
  isReading: boolean;
  readIds: string[];
  onOpenLetter: (idx: number) => void;
  onBackToList: () => void;
  onNextLetter: () => void;
  onPrevLetter: () => void;
}

export const LoveLettersView: React.FC<LoveLettersViewProps> = ({
  selectedIndex,
  isReading,
  readIds,
  onOpenLetter,
  onBackToList,
  onNextLetter,
  onPrevLetter,
}) => {
  const letter = CIYI_LOVE_LETTERS[selectedIndex] || CIYI_LOVE_LETTERS[0];

  if (!isReading) {
    return (
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div className="text-center border-b border-slate-700/70 pb-1.5">
          <p className="font-[family-name:var(--font-pixel)] text-[9.5px] text-[#F8FAFC]">
            CIYI&apos;S SECRET LETTERS
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-lcd)] text-sm text-[#BAE6FD]/85">
            Select an envelope to read. ({readIds.length}/{CIYI_LOVE_LETTERS.length})
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1.5 my-2">
          {CIYI_LOVE_LETTERS.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isRead = readIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenLetter(idx)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#7DD3FC] bg-[#7DD3FC]/18 shadow-[0_0_10px_rgba(125,211,252,0.25)]'
                    : 'border-slate-700/80 bg-[#0B1018]/90 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" />
                  <span className="font-[family-name:var(--font-pixel)] text-[8px] sm:text-[8.5px] text-[#F1F5F9] truncate">
                    {item.title}
                  </span>
                </div>
                <span className="font-[family-name:var(--font-pixel)] text-[7px] text-slate-400 shrink-0 ml-2">
                  {isRead ? '✓' : 'NEW'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[7.5px] font-[family-name:var(--font-pixel)] text-slate-400 pt-0.5">
          <span>▲ ▼ D-PAD: SELECT</span>
          <span className="text-[#BAE6FD]">A / TAP: OPEN</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-1 flex flex-col justify-between max-h-[218px] sm:max-h-[246px]">
      <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 text-[8px] font-[family-name:var(--font-pixel)]">
        <span className="text-[#7DD3FC]">{letter.code}</span>
        <span className="text-slate-200 truncate max-w-[140px]">{letter.title}</span>
        <span className="text-slate-400">
          {selectedIndex + 1}/{CIYI_LOVE_LETTERS.length}
        </span>
      </div>

      <div className="my-1.5 flex-1 overflow-y-auto pr-1 space-y-1.5 text-left font-[family-name:var(--font-lcd)] text-[15.5px] sm:text-[17px] leading-[1.18] text-[#F1F5F9]">
        <p className="text-[#BAE6FD] font-bold">{letter.salutation}</p>
        {letter.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <p className="text-[#7DD3FC] pt-0.5">{letter.signoff}</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-700/70">
        <button
          type="button"
          onClick={onBackToList}
          className="font-[family-name:var(--font-pixel)] text-[8px] text-slate-300 hover:text-white cursor-pointer"
        >
          [B] INBOX
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevLetter}
            aria-label="Previous love letter"
            className="p-0.5 text-slate-300 hover:text-[#7DD3FC] cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onNextLetter}
            aria-label="Next love letter"
            className="font-[family-name:var(--font-pixel)] text-[8px] text-[#7DD3FC] hover:text-white cursor-pointer flex items-center"
          >
            <span>NEXT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
