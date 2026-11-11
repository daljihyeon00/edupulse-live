import React from 'react';
import { 
  Users, 
  ThumbsUp, 
  Zap, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Play, 
  MessageSquare, 
  CheckSquare, 
  QrCode,
  UserCheck
} from 'lucide-react';
import type { ClassStudent, ClassReaction, ClassRoom } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../utils/sound';

interface DashboardTabProps {
  room: ClassRoom;
  students: ClassStudent[];
  reactions: ClassReaction[];
  onOpenQR: () => void;
  onSwitchTab: (tab: ClassRoom['active_tab']) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  room,
  students,
  reactions,
  onOpenQR,
  onSwitchTab,
}) => {
  // Reaction counts
  const goodCount = reactions.filter((r) => r.reaction_type === 'good').length;
  const fastCount = reactions.filter((r) => r.reaction_type === 'fast').length;
  const questionCount = reactions.filter((r) => r.reaction_type === 'question').length;
  const clapCount = reactions.filter((r) => r.reaction_type === 'clap').length;

  const handleResetReactions = async () => {
    sound.playPop();
    await supabase.from('class_reactions').delete().eq('room_code', room.code);
  };

  const handleKickStudent = async (studentName: string) => {
    if (window.confirm(`'${studentName}' 학생을 퇴장 처리하시겠습니까?`)) {
      await supabase
        .from('class_students')
        .delete()
        .eq('room_code', room.code)
        .eq('student_name', studentName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Classroom Control Center */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>실시간 수업 진행 중</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {room.title}
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium">
            담당 교사: <span className="font-bold text-white">{room.teacher_name}</span> | 수업 코드: <span className="font-mono font-bold text-amber-300 text-base">{room.code}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenQR}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>QR / 참여 코드</span>
          </button>
        </div>
      </div>

      {/* Traffic Light Understanding Feedback */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              실시간 수업 신호등 (학생 이해도 & 반응)
            </h3>
            <p className="text-xs text-slate-500">
              학생들이 모바일/태블릿에서 실시간으로 누른 반응 피드백입니다.
            </p>
          </div>
          <button
            onClick={handleResetReactions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>반응 초기화</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Good */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800">이해 완료</p>
              <p className="text-2xl font-black text-emerald-950">{goodCount}<span className="text-xs font-normal text-emerald-700 ml-1">명</span></p>
            </div>
          </div>

          {/* Fast */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800">조금 빨라요</p>
              <p className="text-2xl font-black text-amber-950">{fastCount}<span className="text-xs font-normal text-amber-700 ml-1">명</span></p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-sky-800">질문 있어요</p>
              <p className="text-2xl font-black text-sky-950">{questionCount}<span className="text-xs font-normal text-sky-700 ml-1">명</span></p>
            </div>
          </div>

          {/* Clap */}
          <div className="bg-pink-50/70 border border-pink-200/70 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-pink-800">짝짝짝!</p>
              <p className="text-2xl font-black text-pink-950">{clapCount}<span className="text-xs font-normal text-pink-700 ml-1">명</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mode Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onSwitchTab('quiz')}
          className="p-5 bg-white hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all text-left flex items-start gap-4 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
              실시간 퀴즈 / 골든벨 모드
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              학생들 화면에 실시간 문제를 띄우고 즉석에서 정답을 수합합니다.
            </p>
          </div>
        </button>

        <button
          onClick={() => onSwitchTab('qa')}
          className="p-5 bg-white hover:bg-sky-50/40 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all text-left flex items-start gap-4 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
              실시간 익명 Q&A 보드
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              수업 중 궁금한 질문을 올리고 친구들의 공감 투표를 받습니다.
            </p>
          </div>
        </button>

        <button
          onClick={() => onSwitchTab('exit_ticket')}
          className="p-5 bg-white hover:bg-emerald-50/40 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all text-left flex items-start gap-4 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
              엑시트 티켓 (수업 마무리)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              오늘 배운 핵심 요약과 별점 이해도를 제출받아 수업을 정리합니다.
            </p>
          </div>
        </button>
      </div>

      {/* Connected Students List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              접속 중인 학생 명단
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {students.length}명
            </span>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">아직 접속한 학생이 없습니다.</p>
            <p className="text-xs mt-1 text-slate-400">
              상단의 <strong className="text-indigo-600 font-semibold">[QR / 참여 코드]</strong> 버튼을 눌러 학생들에게 안내하세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="group relative p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {student.student_name}
                    </p>
                  </div>
                  {student.student_number && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {student.student_number}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleKickStudent(student.student_name)}
                  title="학생 퇴장"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 text-xs px-1.5 py-0.5 rounded transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
