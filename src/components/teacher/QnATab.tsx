import React, { useState } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ArrowUpDown
} from 'lucide-react';
import type { ClassQuestion, ClassRoom } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../utils/sound';

interface QnATabProps {
  room: ClassRoom;
  questions: ClassQuestion[];
}

export const QnATab: React.FC<QnATabProps> = ({
  room,
  questions,
}) => {
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'latest'>('votes');

  const filteredQuestions = questions
    .filter((q) => {
      if (filter === 'unanswered') return !q.is_answered;
      if (filter === 'answered') return q.is_answered;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') {
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleToggleAnswered = async (question: ClassQuestion) => {
    sound.playPop();
    await supabase
      .from('class_questions')
      .update({ is_answered: !question.is_answered })
      .eq('id', question.id);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('이 질문을 삭제하시겠습니까?')) {
      await supabase.from('class_questions').delete().eq('id', id);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('모든 질문을 정리(초기화)하시겠습니까?')) {
      await supabase.from('class_questions').delete().eq('room_code', room.code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            실시간 수업 질문 보드 (Q&A)
          </h3>
          <p className="text-xs text-slate-500">
            학생들이 수업 중 올린 질문과 공감(추천) 현황이 실시간으로 집계됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              전체 ({questions.length})
            </button>
            <button
              onClick={() => setFilter('unanswered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'unanswered' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              미답변 ({questions.filter((q) => !q.is_answered).length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'answered' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              답변완료
            </button>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === 'votes' ? 'latest' : 'votes')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortBy === 'votes' ? '추천 많은 순' : '최신 질문 순'}</span>
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="질문 전체 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-base font-bold text-slate-700">등록된 질문이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              학생들이 질문을 남기면 실시간으로 이곳에 등록됩니다.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                q.is_answered
                  ? 'bg-slate-50/80 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 hover:border-sky-300 shadow-xs'
              }`}
            >
              {/* Upvote Pill */}
              <div className="flex flex-col items-center justify-center min-w-[50px] p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-800">
                <ThumbsUp className="w-4 h-4 mb-0.5 text-sky-600" />
                <span className="text-sm font-extrabold">{q.upvotes}</span>
              </div>

              {/* Question Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {q.student_name}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {q.is_answered && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> 답변 완료
                    </span>
                  )}
                </div>

                <p className={`text-base font-medium leading-relaxed ${q.is_answered ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                  {q.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleAnswered(q)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    q.is_answered
                      ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {q.is_answered ? '미답변 처리' : '답변 완료'}
                </button>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
