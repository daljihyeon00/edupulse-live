export interface ClassRoom {
  id: string;
  code: string;
  title: string;
  teacher_name: string;
  teacher_pin: string;
  status: 'open' | 'closed';
  active_tab: 'dashboard' | 'quiz' | 'qa' | 'exit_ticket' | 'tools' | 'report';
  active_quiz_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  id: string;
  room_code: string;
  student_name: string;
  student_number?: string;
  joined_at: string;
  last_active: string;
}

export type QuizType = 'multiple' | 'ox' | 'short';

export interface ClassQuiz {
  id: string;
  room_code: string;
  question: string;
  quiz_type: QuizType;
  options: string[];
  correct_answer?: string;
  points: number;
  time_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface ClassQuizResponse {
  id: string;
  quiz_id: string;
  room_code: string;
  student_name: string;
  student_number?: string;
  answer: string;
  is_correct: boolean;
  submitted_at: string;
}

export interface ClassQuestion {
  id: string;
  room_code: string;
  student_name: string;
  content: string;
  upvotes: number;
  is_answered: boolean;
  created_at: string;
}

export interface ClassExitTicket {
  id: string;
  room_code: string;
  student_name: string;
  student_number?: string;
  understanding_rating: number; // 1 to 5
  learned_summary: string;
  curious_or_difficult?: string;
  created_at: string;
}

export interface ClassReaction {
  id: string;
  room_code: string;
  student_name: string;
  reaction_type: 'good' | 'fast' | 'question' | 'clap';
  created_at: string;
}
