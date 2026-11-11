import React from 'react';
import { 
  CheckSquare, 
  Star, 
  Users, 
  BookOpen, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import type { ClassExitTicket, ClassRoom, ClassStudent } from '../../types';
import { supabase } from '../../lib/supabase';

interface ExitTicketTabProps {
  room: ClassRoom;
  tickets: ClassExitTicket[];
  students: ClassStudent[];
}

export const ExitTicketTab: React.FC<ExitTicketTabProps> = ({
  room,
  tickets,
  students,
}) => {
  // Average calculation
  const totalRating = tickets.reduce((acc, t) => acc + t.understanding_rating, 0);
  const avgRating = tickets.length > 0 ? (totalRating / tickets.length).toFixed(1) : '0.0';

  // Distribution
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: tickets.filter((t) => t.understanding_rating === star).length,
  }));

  const handleClearTickets = async () => {
    if (window.confirm('모든 엑시트 티켓 응답을 삭제하시겠습니까?')) {
      await supabase.from('class_exit_tickets').delete().eq('room_code', room.code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rating Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-500 shadow-inner">
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              오늘 수업 평균 이해도
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{avgRating}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.0 만점</span>
            </div>
            <div className="flex gap-0.5 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(Number(avgRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Submission Rate */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              티켓 제출 완료율
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">
                {tickets.length}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {students.length}명 참여
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1">
              {students.length > 0 ? Math.round((tickets.length / students.length) * 100) : 0}% 제출 완료
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            별점 분포 현황
          </p>
          <div className="space-y-1">
            {starCounts.map(({ star, count }) => {
              const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 font-bold text-slate-700 flex items-center gap-0.5">
                    {star}<Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-500">{count}명</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">학생별 제출 티켓</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              총 {tickets.length}건
            </span>
          </div>

          {tickets.length > 0 && (
            <button
              onClick={handleClearTickets}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 비우기</span>
            </button>
          )}
        </div>

        {tickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">아직 제출된 엑시트 티켓이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              수업 종료 5분 전 학생들에게 엑시트 티켓 작성을 안내해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {t.student_name}
                    </span>
                    {t.student_number && (
                      <span className="text-xs text-slate-500">
                        ({t.student_number})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= t.understanding_rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Learned Summary */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                  <p className="text-[11px] font-bold text-indigo-600 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> 오늘 배운 핵심 한 줄
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {t.learned_summary}
                  </p>
                </div>

                {/* Confusion / Question */}
                {t.curious_or_difficult && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs">
                    <p className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> 어려웠거나 더 알고 싶은 점
                    </p>
                    <p className="text-slate-700 font-medium">
                      {t.curious_or_difficult}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
