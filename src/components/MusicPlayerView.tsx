import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { CIYI_MUSIC_TRACKS } from '../data/cartridges';
import { consoleAudio } from '../utils/consoleAudio';

interface MusicPlayerViewProps {
  trackIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSelectTrack: (idx: number) => void;
}

const DEFAULT_BARS = [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18];

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const MusicPlayerView: React.FC<MusicPlayerViewProps> = ({
  trackIndex,
  isPlaying,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSelectTrack,
}) => {
  const [bars, setBars] = useState<number[]>(DEFAULT_BARS);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const track = CIYI_MUSIC_TRACKS[trackIndex] || CIYI_MUSIC_TRACKS[0];

  useEffect(() => {
    const syncState = () => {
      const state = consoleAudio.getPlaybackState();
      setCurrentTime(state.currentTime);
      setDuration(state.duration);
      setBars(state.bars);
    };

    syncState();
    const timer = window.setInterval(syncState, isPlaying ? 90 : 350);
    return () => window.clearInterval(timer);
  }, [isPlaying, trackIndex]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    consoleAudio.seekToRatio(ratio);
  };

  return (
    <div className="relative z-10 flex-1 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/70 pb-1 text-[8px] font-[family-name:var(--font-pixel)]">
        <span className="text-[#7DD3FC] flex items-center gap-1">
          <Music className="w-2.5 h-2.5" />
          <span>CIYI_TUNES.wav</span>
        </span>
        <span className="text-slate-300 tabular-nums">
          {isPlaying ? '♪ PLAYING' : 'PAUSED'}
        </span>
      </div>

      {/* Now Playing + Live Equalizer + Progress Bar */}
      <div className="my-1 rounded border border-slate-700/75 bg-[#080D16] px-2.5 py-2 flex flex-col items-center text-center">
        <p className="font-[family-name:var(--font-pixel)] text-[9.5px] sm:text-[10px] text-[#F8FAFC] tracking-wide truncate max-w-full">
          {track.number}. {track.title}
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-lcd)] text-sm text-[#BAE6FD]/90 truncate max-w-full">
          {track.artist}
        </p>

        {/* Live Web Audio Frequency Equalizer Bars */}
        <div className="mt-2 h-7 flex items-end justify-center gap-1" aria-hidden="true">
          {bars.map((heightPct, idx) => (
            <span
              key={idx}
              className="w-1.5 bg-gradient-to-t from-[#38BDF8] to-[#E0F2FE] transition-[height] duration-75"
              style={{ height: `${heightPct}%` }}
            />
          ))}
        </div>

        {/* Clickable Seek Bar + Elapsed / Total Time */}
        <div className="mt-2 w-full">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Audio playback progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            onClick={handleSeek}
            className="w-full h-2 rounded-sm bg-slate-800 border border-slate-700 overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] to-[#BAE6FD] transition-[width] duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between font-[family-name:var(--font-pixel)] text-[7px] text-slate-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="mt-1.5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrevTrack}
            aria-label="Previous track"
            className="p-1.5 rounded border border-slate-700 text-slate-300 hover:border-[#7DD3FC] hover:text-[#7DD3FC] cursor-pointer"
          >
            <SkipBack className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className="px-3.5 py-1 rounded border border-[#7DD3FC] bg-[#7DD3FC]/20 text-[#F8FAFC] font-[family-name:var(--font-pixel)] text-[8px] flex items-center gap-1.5 hover:bg-[#7DD3FC]/35 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            type="button"
            onClick={onNextTrack}
            aria-label="Next track"
            className="p-1.5 rounded border border-slate-700 text-slate-300 hover:border-[#7DD3FC] hover:text-[#7DD3FC] cursor-pointer"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4-Song Playlist Quick Select */}
      <div className="grid grid-cols-2 gap-1">
        {CIYI_MUSIC_TRACKS.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTrack(idx)}
            title={`${t.title} — ${t.artist}`}
            className={`px-1.5 py-1 rounded border text-left font-[family-name:var(--font-pixel)] text-[7px] truncate cursor-pointer ${
              idx === trackIndex
                ? 'border-[#7DD3FC] bg-[#7DD3FC]/15 text-[#F8FAFC]'
                : 'border-slate-800 bg-[#070B12] text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.number} {t.title}
          </button>
        ))}
      </div>
    </div>
  );
};
