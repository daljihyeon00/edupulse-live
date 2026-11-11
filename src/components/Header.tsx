import React, { useState } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, LogOut, Sparkles, School } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  roomCode?: string;
  roomTitle?: string;
  role?: 'teacher' | 'student' | null;
  userName?: string;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  roomTitle,
  role,
  userName,
  onLeave,
}) => {
  const [soundOn, setSoundOn] = useState(sound.isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    const newState = sound.toggleSound();
    setSoundOn(newState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                EduPulse Live
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                에듀펄스
              </span>
            </div>
            {roomTitle ? (
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {roomTitle}
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                선생님과 학생을 잇는 실시간 스마트 교실
              </p>
            )}
          </div>
        </div>

        {/* Center / Room Code Pill */}
        {roomCode && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">수업 코드:</span>
            <span className="text-sm font-mono font-bold text-indigo-600 tracking-wider">
              {roomCode}
            </span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{userName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-500 shadow-2xs font-semibold">
                {role === 'teacher' ? '교사' : '학생'}
              </span>
            </div>
          )}

          <button
            onClick={toggleSound}
            title={soundOn ? '효과음 끄기' : '효과음 켜기'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면 모드'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onLeave && (
            <button
              onClick={onLeave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>나가기</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
