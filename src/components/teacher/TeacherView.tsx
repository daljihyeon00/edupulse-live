import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Award, 
  MessageSquare, 
  CheckSquare, 
  Dices, 
  FileText,
  QrCode
} from 'lucide-react';
import type { 
  ClassRoom, 
  ClassStudent, 
  ClassQuiz, 
  ClassQuizResponse, 
  ClassQuestion, 
  ClassExitTicket, 
  ClassReaction 
} from '../../types';
import { supabase } from '../../lib/supabase';
import { DashboardTab } from './DashboardTab';
import { QuizTab } from './QuizTab';
import { QnATab } from './QnATab';
import { ExitTicketTab } from './ExitTicketTab';
import { ToolsTab } from './ToolsTab';
import { ReportTab } from './ReportTab';
import { QRCodeModal } from './QRCodeModal';
import { sound } from '../../utils/sound';

interface TeacherViewProps {
  roomCode: string;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ roomCode }) => {
  const [room, setRoom] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [quizzes, setQuizzes] = useState<ClassQuiz[]>([]);
  const [responses, setResponses] = useState<ClassQuizResponse[]>([]);
  const [questions, setQuestions] = useState<ClassQuestion[]>([]);
  const [tickets, setTickets] = useState<ClassExitTicket[]>([]);
  const [reactions, setReactions] = useState<ClassReaction[]>([]);
  
  const [activeTab, setActiveTab] = useState<ClassRoom['active_tab']>('dashboard');
  const [isQROpen, setIsQROpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial fetch and Realtime subscriptions
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
        setActiveTab(roomData.active_tab || 'dashboard');
      }

      // 2. Fetch students
      const { data: studentsData } = await supabase
        .from('class_students')
        .select('*')
        .eq('room_code', roomCode)
        .order('joined_at', { ascending: true });
      if (studentsData) setStudents(studentsData);

      // 3. Fetch quizzes
      const { data: quizzesData } = await supabase
        .from('class_quizzes')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: true });
      if (quizzesData) setQuizzes(quizzesData);

      // 4. Fetch quiz responses
      const { data: responsesData } = await supabase
        .from('class_quiz_responses')
        .select('*')
        .eq('room_code', roomCode);
      if (responsesData) setResponses(responsesData);

      // 5. Fetch questions
      const { data: questionsData } = await supabase
        .from('class_questions')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: false });
      if (questionsData) setQuestions(questionsData);

      // 6. Fetch exit tickets
      const { data: ticketsData } = await supabase
        .from('class_exit_tickets')
        .select('*')
        .eq('room_code', roomCode);
      if (ticketsData) setTickets(ticketsData);

      // 7. Fetch reactions
      const { data: reactionsData } = await supabase
        .from('class_reactions')
        .select('*')
        .eq('room_code', roomCode);
      if (reactionsData) setReactions(reactionsData);

      setLoading(false);
    };

    fetchData();

    // Setup Supabase Realtime Channel
    const channel = supabase
      .channel(`room:${roomCode}:teacher`)
      // Listen to room updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_rooms', filter: `code=eq.${roomCode}` },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new as ClassRoom);
          }
        }
      )
      // Listen to students
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_students', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playPop();
            setStudents((prev) => [...prev.filter((s) => s.id !== payload.new.id), payload.new as ClassStudent]);
          } else if (payload.eventType === 'DELETE') {
            setStudents((prev) => prev.filter((s) => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setStudents((prev) => prev.map((s) => (s.id === payload.new.id ? (payload.new as ClassStudent) : s)));
          }
        }
      )
      // Listen to quizzes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_quizzes', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuizzes((prev) => [...prev, payload.new as ClassQuiz]);
          } else if (payload.eventType === 'DELETE') {
            setQuizzes((prev) => prev.filter((q) => q.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setQuizzes((prev) => prev.map((q) => (q.id === payload.new.id ? (payload.new as ClassQuiz) : q)));
          }
        }
      )
      // Listen to quiz responses
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_quiz_responses', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playTick();
            setResponses((prev) => [...prev.filter((r) => r.id !== payload.new.id), payload.new as ClassQuizResponse]);
          } else if (payload.eventType === 'DELETE') {
            setResponses((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      // Listen to questions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_questions', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playPop();
            setQuestions((prev) => [payload.new as ClassQuestion, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setQuestions((prev) => prev.map((q) => (q.id === payload.new.id ? (payload.new as ClassQuestion) : q)));
          }
        }
      )
      // Listen to exit tickets
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_exit_tickets', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playPop();
            setTickets((prev) => [...prev.filter((t) => t.id !== payload.new.id), payload.new as ClassExitTicket]);
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      // Listen to reactions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_reactions', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sound.playPop();
            setReactions((prev) => [...prev, payload.new as ClassReaction]);
          } else if (payload.eventType === 'DELETE') {
            setReactions([]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const handleTabChange = async (tab: ClassRoom['active_tab']) => {
    sound.playPop();
    setActiveTab(tab);
    // Update active tab in DB so students' screens will sync
    await supabase.from('class_rooms').update({ active_tab: tab }).eq('code', roomCode);
  };

  if (loading || !room) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">수업 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: ClassRoom['active_tab']; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'quiz', label: '퀴즈 / 형성평가', icon: <Award className="w-4 h-4" />, count: quizzes.length },
    { key: 'qa', label: '실시간 Q&A', icon: <MessageSquare className="w-4 h-4" />, count: questions.filter(q => !q.is_answered).length },
    { key: 'exit_ticket', label: '엑시트 티켓', icon: <CheckSquare className="w-4 h-4" />, count: tickets.length },
    { key: 'tools', label: '수업 도구 (룰렛/타이머/모둠)', icon: <Dices className="w-4 h-4" /> },
    { key: 'report', label: '수업 리포트 & 세특', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 overflow-x-auto">
        <div className="flex gap-1.5 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsQROpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>코드: {room.code}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dashboard' && (
        <DashboardTab
          room={room}
          students={students}
          reactions={reactions}
          onOpenQR={() => setIsQROpen(true)}
          onSwitchTab={handleTabChange}
        />
      )}

      {activeTab === 'quiz' && (
        <QuizTab
          room={room}
          quizzes={quizzes}
          responses={responses}
          students={students}
        />
      )}

      {activeTab === 'qa' && (
        <QnATab
          room={room}
          questions={questions}
        />
      )}

      {activeTab === 'exit_ticket' && (
        <ExitTicketTab
          room={room}
          tickets={tickets}
          students={students}
        />
      )}

      {activeTab === 'tools' && (
        <ToolsTab students={students} />
      )}

      {activeTab === 'report' && (
        <ReportTab
          room={room}
          students={students}
          quizzes={quizzes}
          responses={responses}
          questions={questions}
          tickets={tickets}
        />
      )}

      {/* QR Code Modal */}
      {isQROpen && (
        <QRCodeModal
          roomCode={room.code}
          roomTitle={room.title}
          onClose={() => setIsQROpen(false)}
        />
      )}
    </div>
  );
};
