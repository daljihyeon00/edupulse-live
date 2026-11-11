import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Sparkles, 
  HelpCircle, 
  Timer, 
  BarChart3, 
  ArrowRight, 
  Zap, 
  Lock,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sound } from '../utils/sound';

interface HomeViewProps {
  onJoinStudent: (roomCode: string, studentName: string, studentNumber?: string) => void;
  onEnterTeacher: (roomCode: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onJoinStudent,
  onEnterTeacher,
}) => {
  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  
  // Teacher form
  const [teacherMode, setTeacherMode] = useState<'create' | 'login'>('create');
  const [newTitle, setNewTitle] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginPin, setLoginPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate 6-char random alphanumeric room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = studentCode.trim().toUpperCase();
    const name = studentName.trim();

    if (!code || !name) {
      setErrorMsg('수업 코드와 이름을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Check if room exists
      const { data: room, error } = await supabase
        .from('class_rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !room) {
        setErrorMsg('존재하지 않거나 유효하지 않은 수업 코드입니다.');
        setLoading(false);
        return;
      }

      if (room.status === 'closed') {
        setErrorMsg('이미 종료된 수업입니다.');
        setLoading(false);
        return;
      }

      // Upsert student
      await supabase.from('class_students').upsert(
        {
          room_code: code,
          student_name: name,
          student_number: studentNumber.trim() || null,
          last_active: new Date().toISOString(),
        },
        { onConflict: 'room_code,student_name' }
      );

      sound.playPop();
      onJoinStudent(code, name, studentNumber.trim() || undefined);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('입장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newTitle.trim() || !newTeacherName.trim() || !newPin.trim()) {
      setErrorMsg('수업 제목, 선생님 이름, 관리자 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const code = generateRoomCode();
      const { error } = await supabase.from('class_rooms').insert({
        code,
        title: newTitle.trim(),
        teacher_name: newTeacherName.trim(),
        teacher_pin: newPin.trim(),
        status: 'open',
        active_tab: 'dashboard',
      });

      if (error) throw error;

      sound.playWin();
      onEnterTeacher(code);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('수업 방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = loginCode.trim().toUpperCase();

    if (!code || !loginPin.trim()) {
      setErrorMsg('수업 코드와 관리자 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data: room, error } = await supabase
        .from('class_rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !room) {
        setErrorMsg('존재하지 않는 수업 코드입니다.');
        setLoading(false);
        return;
      }

      if (room.teacher_pin !== loginPin.trim()) {
        setErrorMsg('관리자 비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }

      sound.playChime();
      onEnterTeacher(code);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoStudent = () => {
    setStudentCode('EDU101');
    setStudentName('김하늘');
    setStudentNumber('2학년 3반 7번');
  };

  const handleQuickDemoTeacher = () => {
    setMode('teacher');
    setTeacherMode('login');
    setLoginCode('EDU101');
    setLoginPin('1234');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>선생님과 학생을 잇는 실시간 스마트 교실 에듀테크</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            수업에 생기를 불어넣는{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
              EduPulse Live
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            별도 회원가입 없이 코드로 즉시 참여! 실시간 퀴즈, 골든벨, 질문 보드, 발표자 룰렛부터 
            수업 결과 세특 참고 문안 자동 생성까지 한 번에 해결하세요.
          </p>
        </div>

        {/* Mode Switch Pills */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 shadow-inner">
            <button
              onClick={() => { setMode('student'); setErrorMsg(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>학생 참여하기</span>
            </button>
            <button
              onClick={() => { setMode('teacher'); setErrorMsg(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>선생님 콘솔</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl shadow-indigo-100/60 border border-slate-200/80 p-6 sm:p-8 transition-all">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'student' ? (
            /* Student Entry Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  수업 코드 (6자리) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="예: EDU101"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 text-center tracking-widest uppercase font-mono text-lg font-bold rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  학번 / 반 번호 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 2학년 3반 15번"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>입장하는 중...</span>
                ) : (
                  <>
                    <span>수업 참여하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleQuickDemoStudent}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>체험용 샘플 데이터 자동 채우기</span>
                </button>
              </div>
            </form>
          ) : (
            /* Teacher Entry Form */
            <div>
              <div className="flex border-b border-slate-100 mb-5">
                <button
                  type="button"
                  onClick={() => setTeacherMode('create')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
                    teacherMode === 'create'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  새 수업방 개설
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherMode('login')}
                  className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
                    teacherMode === 'login'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  개설된 방 관리
                </button>
              </div>

              {teacherMode === 'create' ? (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      수업 / 과목 제목 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="예: 2학년 3반 사회: 정보 사회와 디지털 시민성"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      선생님 성함 / 호칭 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="예: 김민준 선생님"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      방 관리 비밀번호 (숫자 4자리) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="예: 1234"
                      maxLength={10}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-mono transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? '수업 방 개설 중...' : '새 수업 시작하기'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      수업 코드 (6자리) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="예: EDU101"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 text-center tracking-widest uppercase font-mono text-lg font-bold rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      관리자 비밀번호 <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="비밀번호 입력"
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm transition-all"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? '확인 중...' : '선생님 콘솔 열기'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={handleQuickDemoTeacher}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>체험용 교사 콘솔 (EDU101) 바로 채우기</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">실시간 퀴즈 & 골든벨</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              OX, 4지선다, 주관식 즉석 출제와 실시간 정답률 그래프, 정답자 축하 효과
            </p>
          </div>

          <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">실시간 질문 & 신호등</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              부끄러움 많은 학생도 언제든 질문 등록! 친구들 공감 투표 및 이해도 신호등
            </p>
          </div>

          <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Timer className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">발표 룰렛 & 모둠 편성</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              수업 중 가장 필요한 발표자 랜덤 룰렛, 활동 카운트다운 타이머, 자동 모둠 구성
            </p>
          </div>

          <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">세특/생기부 참고 문안</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              학생들의 퀴즈와 엑시트 티켓 답변을 분석해 교사용 생활기록부 관찰 초안 자동 생성
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-8 text-xs text-slate-400">
        <p>EduPulse Live • Supabase Realtime & PostgreSQL Powered • 학교 현장을 위한 스마트 교육 플랫폼</p>
      </footer>
    </div>
  );
};
