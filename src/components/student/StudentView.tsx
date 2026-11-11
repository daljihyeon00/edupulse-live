import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  Zap, 
  HelpCircle, 
  Sparkles, 
  Send, 
  Star, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { 
  ClassRoom, 
  ClassQuiz, 
  ClassQuizResponse, 
  ClassQuestion, 
  ClassExitTicket 
} from '../../types';
import { supabase } from '../../lib/supabase';
import { sound } from '../../utils/sound';

interface StudentViewProps {
  roomCode: string;
  studentName: string;
  studentNumber?: string;
}

export const StudentView: React.FC<StudentViewProps> = ({
  roomCode,
  studentName,
  studentNumber,
}) => {
  const [room, setRoom] = useState<ClassRoom | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<ClassQuiz | null>(null);
  const [myQuizResponse, setMyQuizResponse] = useState<ClassQuizResponse | null>(null);
  const [questions, setQuestions] = useState<ClassQuestion[]>([]);
  const [upvotedQuestionIds, setUpvotedQuestionIds] = useState<Set<string>>(new Set());
  const [myExitTicket, setMyExitTicket] = useState<ClassExitTicket | null>(null);

  // Reaction debounce/cooldown
  const [reactionSentToast, setReactionSentToast] = useState(false);

  // Forms
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAnonymousQuestion, setIsAnonymousQuestion] = useState(false);

  // Exit ticket form
  const [starRating, setStarRating] = useState<number>(5);
  const [learnedSummary, setLearnedSummary] = useState('');
  const [curiousOrDifficult, setCuriousOrDifficult] = useState('');

  const [loading, setLoading] = useState(true);

  // Initial fetch and Realtime sync
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch room
      const { data: roomData } = await supabase
        .from('class_rooms')
        .select('*')
        .eq('code', roomCode)
        .single();
      if (roomData) {
        setRoom(roomData);
        if (roomData.active_quiz_id) {
          const { data: quizData } = await supabase
            .from('class_quizzes')
            .select('*')
            .eq('id', roomData.active_quiz_id)
            .single();
          if (quizData) setActiveQuiz(quizData);
        }
      }

      // 2. Fetch my quiz response if active
      if (roomData?.active_quiz_id) {
        const { data: respData } = await supabase
          .from('class_quiz_responses')
          .select('*')
          .eq('quiz_id', roomData.active_quiz_id)
          .eq('student_name', studentName)
          .maybeSingle();
        if (respData) setMyQuizResponse(respData);
      }

      // 3. Fetch questions
      const { data: qData } = await supabase
        .from('class_questions')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: false });
      if (qData) setQuestions(qData);

      // 4. Fetch upvotes by me
      const { data: upvoteData } = await supabase
        .from('class_question_upvotes')
        .select('question_id')
        .eq('student_name', studentName);
      if (upvoteData) {
        setUpvotedQuestionIds(new Set(upvoteData.map((u) => u.question_id)));
      }

      // 5. Fetch my exit ticket
      const { data: ticketData } = await supabase
        .from('class_exit_tickets')
        .select('*')
        .eq('room_code', roomCode)
        .eq('student_name', studentName)
        .maybeSingle();
      if (ticketData) setMyExitTicket(ticketData);

      setLoading(false);
    };

    fetchData();

    // Supabase Realtime Channel
    const channel = supabase
      .channel(`room:${roomCode}:student:${studentName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_rooms', filter: `code=eq.${roomCode}` },
        async (payload) => {
          if (payload.new) {
            const updatedRoom = payload.new as ClassRoom;
            setRoom(updatedRoom);

            if (updatedRoom.active_quiz_id) {
              const { data: qData } = await supabase
                .from('class_quizzes')
                .select('*')
                .eq('id', updatedRoom.active_quiz_id)
                .single();
              if (qData) {
                setActiveQuiz(qData);
                // check if already submitted
                const { data: resp } = await supabase
                  .from('class_quiz_responses')
                  .select('*')
                  .eq('quiz_id', qData.id)
                  .eq('student_name', studentName)
                  .maybeSingle();
                setMyQuizResponse(resp || null);
                setShortAnswerText('');
              }
            } else {
              setActiveQuiz(null);
              setMyQuizResponse(null);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_quizzes', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.new && (payload.new as ClassQuiz).is_active) {
            setActiveQuiz(payload.new as ClassQuiz);
          } else if (payload.new && !(payload.new as ClassQuiz).is_active && activeQuiz?.id === (payload.new as ClassQuiz).id) {
            setActiveQuiz(payload.new as ClassQuiz);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_questions', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuestions((prev) => [payload.new as ClassQuestion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setQuestions((prev) => prev.map((q) => (q.id === payload.new.id ? (payload.new as ClassQuestion) : q)));
          } else if (payload.eventType === 'DELETE') {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, studentName]);

  // Send real-time reaction
  const handleSendReaction = async (type: 'good' | 'fast' | 'question' | 'clap') => {
    sound.playPop();
    setReactionSentToast(true);
    setTimeout(() => setReactionSentToast(false), 2000);

    await supabase.from('class_reactions').insert({
      room_code: roomCode,
      student_name: studentName,
      reaction_type: type,
    });
  };

  // Submit Quiz Response
  const handleSubmitQuiz = async (answer: string) => {
    if (!activeQuiz) return;
    const isCorrect = answer.trim() === activeQuiz.correct_answer?.trim();

    try {
      const { data, error } = await supabase
        .from('class_quiz_responses')
        .insert({
          quiz_id: activeQuiz.id,
          room_code: roomCode,
          student_name: studentName,
          student_number: studentNumber || null,
          answer: answer.trim(),
          is_correct: isCorrect,
        })
        .select()
        .single();

      if (error) throw error;

      sound.playWin();
      setMyQuizResponse(data);
      if (isCorrect) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err) {
      console.error(err);
      alert('답안 제출 중 오류가 발생했습니다.');
    }
  };

  // Submit New Question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      await supabase.from('class_questions').insert({
        room_code: roomCode,
        student_name: isAnonymousQuestion ? '익명 학생' : studentName,
        content: newQuestionText.trim(),
        upvotes: 0,
      });

      sound.playPop();
      setNewQuestionText('');
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote Question
  const handleUpvoteQuestion = async (questionId: string) => {
    if (upvotedQuestionIds.has(questionId)) return;

    try {
      await supabase.from('class_question_upvotes').insert({
        question_id: questionId,
        student_name: studentName,
      });

      // Increment upvotes count
      const q = questions.find((item) => item.id === questionId);
      if (q) {
        await supabase
          .from('class_questions')
          .update({ upvotes: q.upvotes + 1 })
          .eq('id', questionId);
      }

      setUpvotedQuestionIds(new Set([...upvotedQuestionIds, questionId]));
      sound.playTick();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Exit Ticket
  const handleSubmitExitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnedSummary.trim()) return;

    try {
      const { data, error } = await supabase
        .from('class_exit_tickets')
        .upsert(
          {
            room_code: roomCode,
            student_name: studentName,
            student_number: studentNumber || null,
            understanding_rating: starRating,
            learned_summary: learnedSummary.trim(),
            curious_or_difficult: curiousOrDifficult.trim() || null,
          },
          { onConflict: 'room_code,student_name' }
        )
        .select()
        .single();

      if (error) throw error;

      sound.playWin();
      confetti();
      setMyExitTicket(data);
    } catch (err) {
      console.error(err);
      alert('엑시트 티켓 제출에 실패했습니다.');
    }
  };

  if (loading || !room) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">교실에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-extrabold text-slate-900 text-base">
              {studentName} 학생
            </h2>
            {studentNumber && (
              <span className="text-xs text-slate-400 font-medium">
                ({studentNumber})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
            {room.title}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {room.teacher_name}
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {reactionSentToast && (
        <div className="p-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold text-center shadow-lg shadow-indigo-200 animate-in fade-in zoom-in-95 duration-150">
          선생님 화면으로 반응을 전송했습니다! ✨
        </div>
      )}

      {/* --- 1. QUIZ MODE (When active quiz or room.active_tab === 'quiz') --- */}
      {room.active_tab === 'quiz' || activeQuiz ? (
        activeQuiz && activeQuiz.is_active ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-500 shadow-xl shadow-indigo-100 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold animate-pulse flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" /> LIVE 형성평가
              </span>
              <span className="text-xs font-bold text-slate-500">
                제한시간 {activeQuiz.time_limit}초 • {activeQuiz.points}점
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              Q. {activeQuiz.question}
            </h3>

            {/* Answer Interface */}
            {myQuizResponse ? (
              <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-indigo-600 mx-auto" />
                <h4 className="font-extrabold text-indigo-950 text-base">
                  답안 제출이 완료되었습니다!
                </h4>
                <div className="inline-block px-4 py-2 bg-white rounded-xl shadow-xs border border-indigo-100">
                  <span className="text-xs text-slate-400 font-semibold block">내가 제출한 답:</span>
                  <span className="text-base font-black text-indigo-700">
                    {myQuizResponse.answer}
                  </span>
                </div>
                <p className="text-xs text-indigo-600/80">
                  선생님이 정답을 공개할 때까지 잠시 기다려주세요!
                </p>
              </div>
            ) : (
              <div>
                {/* OX Quiz Options */}
                {activeQuiz.quiz_type === 'ox' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSubmitQuiz('O')}
                      className="py-10 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-400 text-blue-600 font-black text-5xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      O
                    </button>
                    <button
                      onClick={() => handleSubmitQuiz('X')}
                      className="py-10 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-400 text-rose-600 font-black text-5xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      X
                    </button>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {activeQuiz.quiz_type === 'multiple' && (
                  <div className="space-y-3">
                    {activeQuiz.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmitQuiz(opt)}
                        className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-slate-800 font-bold text-sm text-left transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3 shadow-2xs"
                      >
                        <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-mono text-xs flex items-center justify-center font-extrabold text-indigo-600 shrink-0 shadow-2xs">
                          {idx + 1}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Short Answer */}
                {activeQuiz.quiz_type === 'short' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="정답을 입력하세요..."
                      value={shortAnswerText}
                      onChange={(e) => setShortAnswerText(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-base font-semibold outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleSubmitQuiz(shortAnswerText)}
                      disabled={!shortAnswerText.trim()}
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      정답 제출하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-3">
            <Clock className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <h3 className="font-extrabold text-slate-800 text-base">
              퀴즈 대기 중입니다
            </h3>
            <p className="text-xs text-slate-500">
              선생님이 문제를 출제하면 이 화면에 자동으로 문제가 나타납니다.
            </p>
          </div>
        )
      ) : null}

      {/* --- 2. EXIT TICKET MODE (When room.active_tab === 'exit_ticket') --- */}
      {room.active_tab === 'exit_ticket' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold inline-block">
              오늘의 수업 마무리
            </span>
            <h3 className="text-xl font-black text-slate-900">
              엑시트 티켓 (Exit Ticket) 작성
            </h3>
            <p className="text-xs text-slate-500">
              오늘 수업에서 배운 핵심을 정리하고 나만의 생각을 표현해보세요.
            </p>
          </div>

          {myExitTicket ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-emerald-950 text-base">
                오늘의 엑시트 티켓이 제출되었습니다!
              </h4>
              <p className="text-xs text-emerald-700">
                수업에 성실히 참여해주셔서 감사합니다. 수고하셨습니다! 👏
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitExitTicket} className="space-y-5">
              {/* Star Rating */}
              <div className="text-center">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  오늘 수업 이해도 평가 <span className="text-rose-500">*</span>
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => {
                        sound.playPop();
                        setStarRating(star);
                      }}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= starRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 mt-1 block">
                  {starRating === 5
                    ? '완벽히 이해했어요! (5점)'
                    : starRating >= 4
                    ? '대부분 잘 이해했어요 (4점)'
                    : starRating >= 3
                    ? '보통이에요 (3점)'
                    : '조금 어려웠어요 (1~2점)'}
                </span>
              </div>

              {/* Learned Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  오늘 배운 핵심 내용 (한 줄 요약) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 디지털 저작물은 출처를 밝히고 정해진 규정에 맞게 사용해야 한다는 점을 배웠다."
                  value={learnedSummary}
                  onChange={(e) => setLearnedSummary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Curious or Difficult */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  어려웠거나 더 알고 싶은 점 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 폰트의 상업적 무료 라이선스 범위가 궁금합니다."
                  value={curiousOrDifficult}
                  onChange={(e) => setCuriousOrDifficult(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-100 transition-all cursor-pointer"
              >
                엑시트 티켓 제출하기
              </button>
            </form>
          )}
        </div>
      )}

      {/* --- 3. TRAFFIC LIGHT FEEDBACK & INTERACTION HUB (Always accessible) --- */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-center">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            선생님께 실시간 신호등 보내기
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            버튼을 누르면 선생님 화면에 학생의 피드백이 실시간으로 전달됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSendReaction('good')}
            className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <ThumbsUp className="w-6 h-6 text-emerald-600" />
            <span>이해 완료! 👍</span>
          </button>

          <button
            onClick={() => handleSendReaction('fast')}
            className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Zap className="w-6 h-6 text-amber-600" />
            <span>조금 빨라요! ⚡</span>
          </button>

          <button
            onClick={() => handleSendReaction('question')}
            className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-6 h-6 text-sky-600" />
            <span>질문 있어요! 🙋</span>
          </button>

          <button
            onClick={() => handleSendReaction('clap')}
            className="p-4 rounded-2xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-800 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-6 h-6 text-pink-600" />
            <span>짝짝짝 박수! 👏</span>
          </button>
        </div>
      </div>

      {/* --- 4. LIVE Q&A BOARD --- */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            수업 실시간 질문하기
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            총 {questions.length}개
          </span>
        </div>

        {/* Submit question */}
        <form onSubmit={handleCreateQuestion} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="수업 중 궁금한 점을 질문해보세요..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newQuestionText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>등록</span>
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymousQuestion}
              onChange={(e) => setIsAnonymousQuestion(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>익명으로 질문 남기기</span>
          </label>
        </form>

        {/* Question feed */}
        <div className="space-y-2.5 pt-2 max-h-72 overflow-y-auto">
          {questions.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">
              첫 번째 질문의 주인공이 되어보세요!
            </p>
          ) : (
            questions.map((q) => {
              const hasUpvoted = upvotedQuestionIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    q.is_answered
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <button
                    onClick={() => handleUpvoteQuestion(q.id)}
                    disabled={hasUpvoted}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                      hasUpvoted
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-extrabold">{q.upvotes}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-800">
                        {q.student_name}
                      </span>
                      {q.is_answered && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          답변 완료
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${q.is_answered ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                      {q.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
