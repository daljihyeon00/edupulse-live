import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Award, 
  HelpCircle, 
  StopCircle,
  Eye,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ClassQuiz, ClassQuizResponse, ClassRoom, ClassStudent } from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../utils/sound';

interface QuizTabProps {
  room: ClassRoom;
  quizzes: ClassQuiz[];
  responses: ClassQuizResponse[];
  students: ClassStudent[];
}

export const QuizTab: React.FC<QuizTabProps> = ({
  room,
  quizzes,
  responses,
  students,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [quizType, setQuizType] = useState<'multiple' | 'ox' | 'short'>('multiple');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);

  const [revealedQuizId, setRevealedQuizId] = useState<string | null>(null);

  const activeQuiz = quizzes.find((q) => q.is_active);
  const currentQuizResponses = responses.filter((r) => r.quiz_id === activeQuiz?.id);

  // Trigger confetti for celebration
  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleStartQuiz = async (quiz: ClassQuiz) => {
    sound.playChime();
    await supabase.from('class_quizzes').update({ is_active: false }).eq('room_code', room.code);
    await supabase.from('class_quizzes').update({ is_active: true }).eq('id', quiz.id);
    await supabase.from('class_rooms').update({
      active_tab: 'quiz',
      active_quiz_id: quiz.id,
    }).eq('code', room.code);
    setRevealedQuizId(null);
  };

  const handleStopQuiz = async () => {
    sound.playPop();
    if (activeQuiz) {
      await supabase.from('class_quizzes').update({ is_active: false }).eq('id', activeQuiz.id);
    }
    await supabase.from('class_rooms').update({
      active_quiz_id: null,
    }).eq('code', room.code);
  };

  const handleRevealAnswer = () => {
    if (activeQuiz) {
      setRevealedQuizId(activeQuiz.id);
      sound.playWin();
      fireConfetti();
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    let finalOptions: string[] = [];
    if (quizType === 'multiple') {
      finalOptions = options.map((o) => o.trim()).filter(Boolean);
      if (finalOptions.length < 2) {
        alert('최소 2개 이상의 보기를 입력해주세요.');
        return;
      }
    } else if (quizType === 'ox') {
      finalOptions = ['O', 'X'];
    }

    try {
      const { data, error } = await supabase
        .from('class_quizzes')
        .insert({
          room_code: room.code,
          question: newQuestion.trim(),
          quiz_type: quizType,
          options: finalOptions,
          correct_answer: correctAnswer.trim(),
          points: Number(points),
          time_limit: Number(timeLimit),
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;

      sound.playPop();
      setIsCreating(false);
      setNewQuestion('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');

      if (window.confirm('퀴즈가 등록되었습니다. 바로 학생들에게 출제하시겠습니까?')) {
        if (data) {
          handleStartQuiz(data);
        }
      }
    } catch (err) {
      console.error(err);
      alert('퀴즈 생성에 실패했습니다.');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (window.confirm('이 퀴즈를 삭제하시겠습니까?')) {
      await supabase.from('class_quizzes').delete().eq('id', id);
    }
  };

  const getOptionCount = (opt: string) => {
    return currentQuizResponses.filter((r) => r.answer === opt).length;
  };

  return (
    <div className="space-y-6">
      {activeQuiz ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-500 shadow-xl shadow-indigo-100 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs animate-pulse">
                LIVE 출제 중
              </span>
              <span className="text-xs font-semibold text-slate-500">
                제한시간: {activeQuiz.time_limit}초 | 배점: {activeQuiz.points}점
              </span>
            </div>

            <div className="flex items-center gap-2">
              {revealedQuizId !== activeQuiz.id ? (
                <button
                  onClick={handleRevealAnswer}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>정답 공개 & 축하</span>
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>정답 공개 완료</span>
                </div>
              )}

              <button
                onClick={handleStopQuiz}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <StopCircle className="w-4 h-4 text-rose-500" />
                <span>퀴즈 마감</span>
              </button>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
            Q. {activeQuiz.question}
          </h3>

          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-700">
              <span>학생 응답 현황</span>
              <span>
                {currentQuizResponses.length} / {students.length}명 제출 (
                {students.length > 0
                  ? Math.round((currentQuizResponses.length / students.length) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-300"
                style={{
                  width: `${
                    students.length > 0
                      ? Math.min(100, (currentQuizResponses.length / students.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {activeQuiz.options?.map((opt, idx) => {
              const count = getOptionCount(opt);
              const percentage =
                currentQuizResponses.length > 0
                  ? Math.round((count / currentQuizResponses.length) * 100)
                  : 0;
              const isCorrect = revealedQuizId === activeQuiz.id && opt === activeQuiz.correct_answer;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {opt}
                      {isCorrect && (
                        <span className="text-[11px] font-extrabold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 정답
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {count}명 ({percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCorrect ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 text-center">
          <p className="text-sm font-bold text-indigo-950 mb-1">
            현재 진행 중인 퀴즈가 없습니다.
          </p>
          <p className="text-xs text-indigo-700/80 mb-4">
            아래 목록에서 퀴즈를 선택해 [문제 출제]를 누르거나, 새로운 퀴즈를 즉석에서 만들어보세요!
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            수업 퀴즈 목록
          </h3>
          <p className="text-xs text-slate-500">등록된 형성평가 및 돌발 퀴즈 문항들입니다.</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>새 퀴즈 출제</span>
        </button>
      </div>

      <div className="space-y-3">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200/80">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">아직 등록된 퀴즈가 없습니다.</p>
            <p className="text-xs mt-1">상단의 [+ 새 퀴즈 출제] 버튼을 눌러 문제를 만들어보세요.</p>
          </div>
        ) : (
          quizzes.map((quiz) => {
            const quizResponsesCount = responses.filter((r) => r.quiz_id === quiz.id).length;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {quiz.quiz_type === 'ox' ? 'OX 퀴즈' : quiz.quiz_type === 'short' ? '단답형' : '4지선다'}
                    </span>
                    <span className="text-xs text-slate-400">
                      제한시간 {quiz.time_limit}초 • 배점 {quiz.points}점
                    </span>
                    {quizResponsesCount > 0 && (
                      <span className="text-xs text-indigo-600 font-semibold">
                        • {quizResponsesCount}명 응답
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{quiz.question}</h4>
                  {quiz.correct_answer && (
                    <p className="text-xs text-emerald-600 font-semibold">
                      정답: {quiz.correct_answer}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    disabled={quiz.is_active}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{quiz.is_active ? '출제 중' : '문제 출제'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">새 퀴즈 출제하기</h3>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  문제 질문 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 대한민국의 수도는 어디일까요?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">문항 유형</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['multiple', 'ox', 'short'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setQuizType(type)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        quizType === type
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'multiple' ? '4지선다' : type === 'ox' ? 'OX 퀴즈' : '단답형'}
                    </button>
                  ))}
                </div>
              </div>

              {quizType === 'multiple' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">보기 입력</label>
                  {options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`보기 ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...options];
                        copy[idx] = e.target.value;
                        setOptions(copy);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-sm"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  정답 입력 <span className="text-rose-500">*</span>
                </label>
                {quizType === 'ox' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {['O', 'X'].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setCorrectAnswer(val)}
                        className={`py-2 text-sm font-black rounded-xl border ${
                          correctAnswer === val
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="보기 중 하나 또는 단답형 정답 입력"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-sm font-semibold text-emerald-700"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">제한시간(초)</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">배점</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  퀴즈 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
