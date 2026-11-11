import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { TeacherView } from './components/teacher/TeacherView';
import { StudentView } from './components/student/StudentView';
import { supabase } from './lib/supabase';

export function App() {
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomTitle, setRoomTitle] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentNumber, setStudentNumber] = useState<string | undefined>();

  // Check URL query params on mount (for QR code join link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const roleParam = params.get('role');

    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
    }
    if (roleParam === 'teacher' && codeParam) {
      setRole('teacher');
    }
  }, []);

  // Fetch room title when roomCode changes
  useEffect(() => {
    if (roomCode) {
      supabase
        .from('class_rooms')
        .select('title')
        .eq('code', roomCode)
        .single()
        .then(({ data }) => {
          if (data) setRoomTitle(data.title);
        });
    } else {
      setRoomTitle('');
    }
  }, [roomCode]);

  const handleJoinStudent = (code: string, name: string, number?: string) => {
    setRoomCode(code);
    setStudentName(name);
    setStudentNumber(number);
    setRole('student');
  };

  const handleEnterTeacher = (code: string) => {
    setRoomCode(code);
    setRole('teacher');
  };

  const handleLeave = () => {
    if (window.confirm('현재 수업에서 나가시겠습니까?')) {
      setRole(null);
      setStudentName('');
      setStudentNumber(undefined);
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        roomCode={roomCode}
        roomTitle={roomTitle}
        role={role}
        userName={role === 'student' ? studentName : role === 'teacher' ? '선생님' : undefined}
        onLeave={role ? handleLeave : undefined}
      />

      <main className="flex-1">
        {!role && (
          <HomeView
            onJoinStudent={handleJoinStudent}
            onEnterTeacher={handleEnterTeacher}
          />
        )}

        {role === 'teacher' && roomCode && (
          <TeacherView roomCode={roomCode} />
        )}

        {role === 'student' && roomCode && (
          <StudentView
            roomCode={roomCode}
            studentName={studentName}
            studentNumber={studentNumber}
          />
        )}
      </main>
    </div>
  );
}

export default App;
