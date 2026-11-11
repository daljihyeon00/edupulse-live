# 🎓 EduPulse Live (에듀펄스 라이브)
> **선생님과 학생을 잇는 실시간 스마트 교실 에듀테크 플랫폼**  
> *Supabase Realtime & PostgreSQL DB + GitHub CLI + React 19 / TypeScript / Tailwind CSS v4*

---

## 🌟 프로젝트 소개
**EduPulse Live (에듀펄스 라이브)**는 학교 현장(초·중·고 및 대학교) 수업의 몰입도와 상호작용을 극대화하기 위해 개발된 실시간 에듀테크 웹 서비스입니다.

- **학생**: 복잡한 회원가입이나 앱 설치 없이, **수업 코드(PIN)** 또는 **QR 코드 스캔**만으로 3초 만에 입장
- **선생님**: 수업 방 개설, 실시간 형성평가/골든벨 출제, 질문 수합, 수업 도구(발표자 룰렛, 타이머, 모둠 편성) 활용부터 수업 종료 후 **생활기록부 세특 관찰 문안 자동 완성 & CSV 다운로드**까지 원스톱으로 관리

---

## 🛠️ 기술 스택 (Tech Stack)

| 영역 | 기술 스택 | 설명 |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | 빠르고 안정적인 최신 웹 런타임 |
| **Styling** | Tailwind CSS v4 | 유려하고 직관적인 모던 교실 UI/UX |
| **Backend & DB** | Supabase (PostgreSQL 17) | 서울 리전 (`ap-northeast-2`) 호스팅 |
| **Realtime** | Supabase Realtime (WebSocket) | 퀴즈, 정답률, 실시간 신호등, 질문 보드 양방향 동기화 |
| **Audio & FX** | Web Audio API + Canvas Confetti | 별도 음원 파일 없이 네이티브 합성음(차임, 골든벨, 카운트다운) & 축하 효과 |
| **Code & Repo** | Git & GitHub CLI (`gh`) | 소스코드 형상 관리 및 원격 저장소 자동 연동 |

---

## 🚀 주요 기능 (Key Features)

### 1. 🧑‍🏫 교사용 실시간 콘솔 (Teacher Dashboard)
- **실시간 수업 신호등 (Class Traffic Light)**
  - 학생들의 실시간 이해도 피드백 수합 (`이해 완료 👍`, `조금 빨라요 ⚡`, `질문 있어요 🙋`, `짝짝짝 👏`)
- **실시간 퀴즈 & 형성평가 (Live Quiz)**
  - OX 퀴즈, 4지선다, 주관식 단답형 즉석 출제
  - 실시간 학생 응답률 및 보기별 분포도 그래프 시각화
  - 원클릭 정답 공개 & 정답자 축하 콘페티(폭죽) 애니메이션
- **실시간 익명 Q&A 보드**
  - 발표를 주저하는 학생들도 자유롭게 실시간 질문 제출
  - 학생들 간 실시간 '좋아요(추천)' 투표 및 교사의 '답변 완료' 체크
- **엑시트 티켓 (Exit Ticket - 수업 마무리)**
  - 오늘 배운 핵심 한 줄 정리, 별점 이해도(1~5점), 더 알고 싶은 점 수합
- **수업 만능 스마트 도구 (Classroom Tools)**
  - 🎲 **발표자 룰렛**: 접속한 학생 명단 자동 연동 및 긴장감 넘치는 추첨 효과
  - ⏱️ **활동 카운트다운 타이머**: 1/3/5/10분 프리셋, 10초 전 알림음 및 종료 징 소리
  - 👥 **모둠 편성기**: 2인/3인/4인 모둠 자동 무작위 편성 및 클립보드 복사
- **AI-ready 수업 리포트 & 생기부/세특 관찰 초안 자동 생성**
  - 학생별 퀴즈 성취도 + 엑시트 티켓 요약을 종합하여 **나이스(NEIS) 기재용 세특 관찰 문안 초안 자동 작성**
  - 전체 학생 활동 기록 원클릭 **엑셀(CSV) 다운로드** 지원

---

### 2. 📱 학생용 실시간 웹앱 (Student Experience)
- **No-Login 초간편 접속**: 수업 코드(예: `EDU101`) + 이름만 입력하면 즉시 입장
- **선생님 화면과 100% 실시간 동기화**:
  - 교사가 퀴즈를 출제하면 즉시 모바일 퀴즈 패드로 전환
  - 교사가 정답을 공개하면 즉시 정답/오답 확인 및 축하 화면
- **수업 중 실시간 신호등 피드백**: "선생님 이해 잘 돼요!", "조금 빨라요 천천히 해주세요" 전송
- **질문 남기기 & 친구 질문 공감**: 익명/실명 질문 제출 및 추천

---

## 🗄️ Supabase 데이터베이스 설계

Supabase MCP를 통해 서울 리전 PostgreSQL에 다음 8개 테이블이 구축되었으며, `supabase_realtime` publication에 등록되어 초저지연 양방향 동기화를 지원합니다:

1. `class_rooms`: 수업 방 정보, 현재 활성 모드(`active_tab`), 교사 PIN
2. `class_students`: 접속한 학생 명단 및 상태
3. `class_quizzes`: 형성평가 문항, 보기, 정답, 배점, 제한시간
4. `class_quiz_responses`: 학생별 퀴즈 제출 답안 및 정답 여부
5. `class_questions`: 실시간 Q&A 질문 및 답변 완료 상태
6. `class_question_upvotes`: 질문 중복 추천 방지 테이블
7. `class_exit_tickets`: 수업 마무리 한 줄 요약 및 이해도 별점
8. `class_reactions`: 실시간 이해도 신호등 반응 로그

---

## 🏃 로컬 실행 방법 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
```env
VITE_SUPABASE_URL=https://nnagiswnnzwcxyaxgbge.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드 및 배포
```bash
npm run build
```

---

## 💡 빠른 체험 (Demo)
- **체험용 수업 코드**: `EDU101`
- **체험용 교사 PIN**: `1234`
- 메인 화면 하단의 **[체험용 샘플 데이터 자동 채우기]** 버튼을 누르면 1초 만에 바로 체험하실 수 있습니다.
