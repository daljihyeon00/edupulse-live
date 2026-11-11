import React, { useState, useEffect, useRef } from 'react';
import { 
  Dices, 
  Timer, 
  Users, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Shuffle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ClassStudent } from '../../types';
import { sound } from '../../utils/sound';

interface ToolsTabProps {
  students: ClassStudent[];
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ students }) => {
  const [activeTool, setActiveTool] = useState<'roulette' | 'timer' | 'team'>('roulette');

  // --- 1. ROULETTE STATE ---
  const [candidateList, setCandidateList] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Sync connected students to candidate list initially
  useEffect(() => {
    if (students.length > 0 && candidateList.length === 0) {
      setCandidateList(students.map((s) => s.student_name));
    }
  }, [students]);

  const handleStartRoulette = () => {
    const list = candidateList.length > 0 ? candidateList : students.map((s) => s.student_name);
    if (list.length === 0) {
      alert('추첨할 학생이 없습니다. 학생이 접속했거나 명단을 입력해주세요.');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    let speed = 50;
    let currentIdx = 0;
    let spinsRemaining = 35 + Math.floor(Math.random() * 20);

    const step = () => {
      sound.playTick();
      currentIdx = (currentIdx + 1) % list.length;
      setHighlightedIndex(currentIdx);
      spinsRemaining--;

      if (spinsRemaining > 0) {
        speed = Math.floor(speed * 1.07);
        setTimeout(step, speed);
      } else {
        const finalWinner = list[currentIdx];
        setWinner(finalWinner);
        setIsSpinning(false);
        sound.playWin();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    };

    step();
  };

  const handleAddCustomCandidate = () => {
    if (customInput.trim()) {
      const names = customInput.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
      setCandidateList([...candidateList, ...names]);
      setCustomInput('');
      sound.playPop();
    }
  };

  // --- 2. TIMER STATE ---
  const [timerSeconds, setTimerSeconds] = useState(180); // default 3 mins
  const [initialSeconds, setInitialSeconds] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimerSeconds((prev) => {
          if (prev <= 11 && prev > 1) {
            sound.playTick();
          }
          if (prev === 1) {
            sound.playGong();
            confetti();
            setIsTimerRunning(false);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  const setTimerPreset = (secs: number) => {
    setIsTimerRunning(false);
    setTimerSeconds(secs);
    setInitialSeconds(secs);
    sound.playPop();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 3. TEAM GENERATOR STATE ---
  const [teamSize, setTeamSize] = useState(4); // 4 students per team
  const [generatedTeams, setGeneratedTeams] = useState<{ id: number; name: string; members: string[] }[]>([]);
  const [copiedTeams, setCopiedTeams] = useState(false);

  const handleGenerateTeams = () => {
    const list = candidateList.length > 0 ? [...candidateList] : students.map((s) => s.student_name);
    if (list.length < 2) {
      alert('모둠을 구성하려면 최소 2명 이상의 학생이 필요합니다.');
      return;
    }

    // Shuffle
    const shuffled = list.sort(() => Math.random() - 0.5);
    const teams: { id: number; name: string; members: string[] }[] = [];
    const teamCount = Math.ceil(shuffled.length / teamSize);

    for (let i = 0; i < teamCount; i++) {
      teams.push({
        id: i + 1,
        name: `${i + 1}모둠`,
        members: shuffled.slice(i * teamSize, (i + 1) * teamSize),
      });
    }

    setGeneratedTeams(teams);
    sound.playWin();
  };

  const copyTeams = () => {
    if (generatedTeams.length === 0) return;
    const text = generatedTeams
      .map((t) => `[${t.name}] ${t.members.join(', ')}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTeams(true);
    sound.playPop();
    setTimeout(() => setCopiedTeams(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tool Selector Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs max-w-md mx-auto">
        <button
          onClick={() => setActiveTool('roulette')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTool === 'roulette'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>발표자 룰렛</span>
        </button>

        <button
          onClick={() => setActiveTool('timer')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTool === 'timer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>활동 타이머</span>
        </button>

        <button
          onClick={() => setActiveTool('team')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTool === 'team'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>모둠 편성기</span>
        </button>
      </div>

      {/* --- TOOL 1: ROULETTE --- */}
      {activeTool === 'roulette' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>두근두근 오늘의 발표자 추첨!</span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-6">
            발표자 랜덤 뽑기
          </h3>

          {/* Winner Display Area */}
          <div className="min-h-[160px] bg-gradient-to-tr from-indigo-50 to-sky-50 rounded-3xl border-2 border-indigo-200 p-6 flex flex-col items-center justify-center mb-6 shadow-inner relative overflow-hidden">
            {winner ? (
              <div className="animate-in zoom-in-75 duration-300">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-white px-3 py-1 rounded-full shadow-xs mb-2 inline-block">
                  🎉 당첨을 축하합니다!
                </span>
                <p className="text-4xl sm:text-5xl font-black text-indigo-950 mt-1">
                  {winner}
                </p>
              </div>
            ) : isSpinning ? (
              <div>
                <p className="text-sm font-bold text-indigo-400 mb-1">추첨 중...</p>
                <p className="text-3xl sm:text-4xl font-black text-indigo-700 animate-pulse">
                  {candidateList[highlightedIndex ?? 0] || '추첨 중'}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 font-medium text-sm">
                [추첨 시작] 버튼을 누르면 랜덤으로 학생이 선정됩니다.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartRoulette}
            disabled={isSpinning}
            className="w-full sm:w-64 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-lg shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSpinning ? '두근두근 추첨 중...' : '🎲 발표자 추첨 시작!'}
          </button>

          {/* Candidate Pool Info */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">
                추첨 대상 명단 ({candidateList.length}명)
              </span>
              <button
                onClick={() => setCandidateList(students.map((s) => s.student_name))}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                접속 학생 자동 불러오기
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {candidateList.map((name, i) => (
                <span
                  key={i}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                    highlightedIndex === i
                      ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold scale-105'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="직접 학생 이름 추가 (쉼표로 구분)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCandidate()}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
              />
              <button
                onClick={handleAddCustomCandidate}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOOL 2: ACTIVITY TIMER --- */}
      {activeTool === 'timer' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-6">
            수업 활동 카운트다운 타이머
          </h3>

          {/* Big Digital Clock */}
          <div className="py-10 px-6 rounded-3xl bg-slate-900 text-white shadow-xl mb-6 relative overflow-hidden">
            <span
              className={`font-mono text-6xl sm:text-7xl font-black tracking-widest ${
                timerSeconds <= 10 && timerSeconds > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {formatTime(timerSeconds)}
            </span>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{
                  width: `${initialSeconds > 0 ? (timerSeconds / initialSeconds) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => {
                sound.playPop();
                setIsTimerRunning(!isTimerRunning);
              }}
              className={`py-3.5 px-8 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isTimerRunning ? '일시 정지' : '시작'}</span>
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(initialSeconds);
                sound.playPop();
              }}
              className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>초기화</span>
            </button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-slate-100">
            {[
              { label: '1분', secs: 60 },
              { label: '3분', secs: 180 },
              { label: '5분', secs: 300 },
              { label: '10분', secs: 600 },
            ].map((p) => (
              <button
                key={p.secs}
                onClick={() => setTimerPreset(p.secs)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  initialSeconds === p.secs
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- TOOL 3: TEAM GENERATOR --- */}
      {activeTool === 'team' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                자리 배치 & 모둠 편성기
              </h3>
              <p className="text-xs text-slate-500">
                수업 참여 학생들을 1초 만에 공평하게 모둠으로 편성합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span>모둠당 인원:</span>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value={2}>2명 (짝꿍 활동)</option>
                  <option value={3}>3명 (소모둠)</option>
                  <option value={4}>4명 (기본 모둠)</option>
                  <option value={5}>5명</option>
                  <option value={6}>6명</option>
                </select>
              </div>

              <button
                onClick={handleGenerateTeams}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>모둠 섞기</span>
              </button>

              {generatedTeams.length > 0 && (
                <button
                  onClick={copyTeams}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedTeams ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTeams ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>
          </div>

          {generatedTeams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">아직 생성된 모둠이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">
                상단의 [모둠 섞기] 버튼을 누르면 무작위로 팀이 편성됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {generatedTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                    <span className="font-extrabold text-sm text-indigo-700">
                      {team.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {team.members.length}명
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {team.members.map((m, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-semibold text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
