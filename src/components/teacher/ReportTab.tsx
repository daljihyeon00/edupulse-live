import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Copy, 
  Check, 
  Award, 
  BookOpen, 
  Search
} from 'lucide-react';
import type { 
  ClassRoom, 
  ClassStudent, 
  ClassQuiz, 
  ClassQuizResponse, 
  ClassQuestion, 
  ClassExitTicket 
} from '../../types';
import { sound } from '../../utils/sound';

interface ReportTabProps {
  room: ClassRoom;
  students: ClassStudent[];
  quizzes: ClassQuiz[];
  responses: ClassQuizResponse[];
  questions: ClassQuestion[];
  tickets: ClassExitTicket[];
}

export const ReportTab: React.FC<ReportTabProps> = ({
  room,
  students,
  quizzes: _quizzes,
  responses,
  questions,
  tickets,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate customized 세특 (School record narrative observation) for a student
  const generateObservationDraft = (student: ClassStudent) => {
    const studentResponses = responses.filter((r) => r.student_name === student.student_name);
    const correctCount = studentResponses.filter((r) => r.is_correct).length;
    const ticket = tickets.find((t) => t.student_name === student.student_name);
    const studentQuestions = questions.filter((q) => q.student_name === student.student_name);

    let narrative = `수업 '${room.title}'에 성실히 참여함. `;

    // Quiz performance sentence
    if (studentResponses.length > 0) {
      const accuracy = Math.round((correctCount / studentResponses.length) * 100);
      if (accuracy >= 80) {
        narrative += `형성평가 및 핵심 개념 확인 퀴즈에서 ${accuracy}%의 높은 정답률을 기록하며 학습 목표를 완벽히 이해하고 성취함. `;
      } else if (accuracy >= 50) {
        narrative += `형성평가 문항에 적극적으로 응시하며 주요 학습 내용을 차분히 점검하고 보완하는 모습을 보임. `;
      } else {
        narrative += `형성평가를 통해 부족한 개념을 스스로 확인하고 질문을 통해 개선하려는 의지를 보임. `;
      }
    }

    // Question activity sentence
    if (studentQuestions.length > 0) {
      narrative += `수업 중 궁금한 점("${studentQuestions[0].content}")을 자발적으로 질문하여 급우들과 활발하게 사고를 확장함. `;
    }

    // Exit ticket reflection sentence
    if (ticket) {
      if (ticket.learned_summary) {
        narrative += `수업 정리(엑시트 티켓) 과정에서 '${ticket.learned_summary}'라고 핵심 배움을 간결하고 명확하게 구조화하여 정리함. `;
      }
      if (ticket.curious_or_difficult) {
        narrative += `특히 '${ticket.curious_or_difficult}' 관련 심화 내용에 호기심을 표현하며 지속적인 탐구 태도를 지님.`;
      }
    } else {
      narrative += `전반적인 수업 활동에 바른 태도로 성실히 임함.`;
    }

    return narrative;
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    sound.playPop();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCSV = () => {
    sound.playWin();
    const headers = [
      '학번/반번호',
      '학생이름',
      '퀴즈응시수',
      '퀴즈정답수',
      '질문등록수',
      '이해도별점(1~5)',
      '배운내용요약',
      '어려웠던점',
      '세특/관찰기록초안',
    ];

    const rows = students.map((s) => {
      const studentResponses = responses.filter((r) => r.student_name === s.student_name);
      const correctCount = studentResponses.filter((r) => r.is_correct).length;
      const ticket = tickets.find((t) => t.student_name === s.student_name);
      const studentQuestions = questions.filter((q) => q.student_name === s.student_name);
      const draft = generateObservationDraft(s);

      return [
        `"${s.student_number || ''}"`,
        `"${s.student_name}"`,
        studentResponses.length,
        correctCount,
        studentQuestions.length,
        ticket?.understanding_rating || '',
        `"${(ticket?.learned_summary || '').replace(/"/g, '""')}"`,
        `"${(ticket?.curious_or_difficult || '').replace(/"/g, '""')}"`,
        `"${draft.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${room.title}_수업결과_세특리포트.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.student_number && s.student_number.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>수업 데이터 자동 분석 & 세특 초안 생성</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            수업 종합 리포트 및 생기부 관찰 기록
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            학생들의 퀴즈 응답, 질문, 엑시트 티켓을 바탕으로 과목별 세특 관찰 문안을 완성합니다.
          </p>
        </div>

        <button
          onClick={downloadCSV}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>전체 엑셀(CSV) 다운로드</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="학생 이름 또는 학번 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-2xl border border-slate-300 text-xs outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Student Cards List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-bold text-slate-700">기록할 학생 데이터가 없습니다.</p>
          </div>
        ) : (
          filteredStudents.map((s) => {
            const studentResponses = responses.filter((r) => r.student_name === s.student_name);
            const correctCount = studentResponses.filter((r) => r.is_correct).length;
            const ticket = tickets.find((t) => t.student_name === s.student_name);
            const draft = generateObservationDraft(s);

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {s.student_name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        {s.student_name}
                      </h4>
                      {s.student_number && (
                        <p className="text-xs text-slate-400 font-medium">
                          {s.student_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>퀴즈 {correctCount}/{studentResponses.length} 정답</span>
                    </span>

                    {ticket && (
                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
                        ⭐ 이해도 {ticket.understanding_rating}.0
                      </span>
                    )}
                  </div>
                </div>

                {/* Exit Ticket Snippet */}
                {ticket && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700">배운 내용: </span>
                      <span>{ticket.learned_summary}</span>
                      {ticket.curious_or_difficult && (
                        <p className="text-slate-500 mt-1">
                          <span className="font-bold text-amber-700">궁금한 점: </span>
                          {ticket.curious_or_difficult}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Auto Generated Observation Draft */}
                <div className="bg-gradient-to-r from-indigo-50/50 to-sky-50/50 p-4 rounded-xl border border-indigo-100 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      과목별 세부능력 및 특기사항(세특) 관찰 초안
                    </span>

                    <button
                      onClick={() => copyToClipboard(s.id, draft)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                    >
                      {copiedId === s.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600">복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>문안 복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {draft}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
