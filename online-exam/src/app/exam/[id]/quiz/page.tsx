'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getExamForStudent } from '@/app/actions/exams';
import { submitExam } from '@/app/actions/submissions';
import { supabase } from '@/lib/supabase';
import { LatexRenderer } from '@/components/LatexRenderer';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  GraduationCap, 
  Clock, 
  Send, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  ChevronRight,
  BookmarkCheck
} from 'lucide-react';

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const examId = params.id as string;
  const studentId = searchParams.get('studentId') || '';

  // Data states
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  
  // Loading & Flow states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);
  
  // Quiz taking states
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [warningCount, setWarningCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Local storage key
  const storageKey = `exam_${examId}_student_${studentId}`;

  // 1. Initial Load: Fetch Student & Exam questions
  useEffect(() => {
    if (!examId || !studentId) {
      router.push('/');
      return;
    }

    const initData = async () => {
      setLoading(true);
      try {
        // Fetch student profile
        const { data: stdData, error: stdErr } = await supabase
          .from('students')
          .select('id, name, email')
          .eq('id', studentId)
          .single();

        if (stdErr || !stdData) {
          alert('Thông tin học sinh không tồn tại.');
          router.push('/');
          return;
        }
        setStudent(stdData);

        // Fetch Exam & questions (stripped of correct_answers)
        const examRes = await getExamForStudent(examId);
        if (examRes.success && examRes.exam) {
          // Check expiration
          if (examRes.exam.due_at && new Date() > new Date(examRes.exam.due_at)) {
            alert(`Bài thi đã hết hạn nộp lúc ${new Date(examRes.exam.due_at).toLocaleString('vi-VN')}. Bạn không thể làm bài.`);
            router.push(`/exam/${examId}`);
            return;
          }

          // Check attempts limit
          const { data: existingSubs, error: subError } = await supabase
            .from('submissions')
            .select('id')
            .eq('exam_id', examId)
            .eq('student_id', studentId);

          if (!subError) {
            const maxAttempts = examRes.exam.max_attempts !== undefined && examRes.exam.max_attempts !== null ? examRes.exam.max_attempts : 1;
            if (maxAttempts > 0 && existingSubs && existingSubs.length >= maxAttempts) {
              alert(`Bạn đã làm bài thi này ${existingSubs.length} lần. Số lần làm bài tối đa được phép là ${maxAttempts} lần.`);
              router.push(`/exam/${examId}`);
              return;
            }
          }

          setExam(examRes.exam);
          setQuestions(examRes.questions || []);

          // Initialize timer
          const durationSeconds = examRes.exam.duration_minutes * 60;
          setTimeLeft(durationSeconds);

          // Load local draft answers if any
          const savedDraft = localStorage.getItem(storageKey);
          if (savedDraft) {
            try {
              setAnswers(JSON.parse(savedDraft));
            } catch (e) {
              console.error('Lỗi phân tích cú pháp local storage draft:', e);
            }
          }
        } else {
          alert('Đề thi không tồn tại.');
          router.push('/');
        }
      } catch (err) {
        console.error('Lỗi khởi tạo phòng thi:', err);
        router.push('/');
      }
      setLoading(false);
    };

    initData();
  }, [examId, studentId]);

  // 2. Countdown Timer Logic
  useEffect(() => {
    if (loading || quizFinished || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit when time hits 0
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, quizFinished, timeLeft]);

  // 3. Anti-cheat: Track tab switches / focus changes
  useEffect(() => {
    if (loading || quizFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount(w => {
          const next = w + 1;
          alert(`⚠️ CẢNH BÁO GIAN LẬN: Bạn vừa rời khỏi màn hình làm bài thi! Số lần vi phạm: ${next}. Vui lòng tập trung làm bài.`);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, quizFinished]);

  // 4. Update and Save Answers to localstorage
  const handleSelectAnswer = (questionId: string, optionKey: string, isMulti = false) => {
    if (isMulti) {
      const currentVal = answers[questionId] || '';
      let selectedKeys = currentVal ? currentVal.split(',') : [];
      if (selectedKeys.includes(optionKey)) {
        selectedKeys = selectedKeys.filter(k => k !== optionKey);
      } else {
        selectedKeys.push(optionKey);
      }
      selectedKeys.sort();
      const nextAnswers = { ...answers, [questionId]: selectedKeys.join(',') };
      setAnswers(nextAnswers);
      localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
    } else {
      const nextAnswers = { ...answers, [questionId]: optionKey };
      setAnswers(nextAnswers);
      localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
    }
  };

  const handleSelectTrueFalse = (questionId: string, subKey: string, val: 'Đ' | 'S') => {
    let current = {};
    try {
      const existing = answers[questionId];
      current = existing ? (typeof existing === 'string' ? JSON.parse(existing) : existing) : {};
    } catch (e) {}

    const updatedVal = { ...current, [subKey]: val };
    const nextAnswers = { ...answers, [questionId]: JSON.stringify(updatedVal) };
    setAnswers(nextAnswers);
    localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
  };

  const handleTextChange = (questionId: string, val: string) => {
    const nextAnswers = { ...answers, [questionId]: val };
    setAnswers(nextAnswers);
    localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
  };

  // 5. Submit Exam
  const handleSubmit = async (isManual = true) => {
    if (isManual) {
      const unansweredCount = questions.length - Object.keys(answers).length;
      let msg = 'Bạn có chắc chắn muốn nộp bài thi?';
      if (unansweredCount > 0) {
        msg = `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn vẫn muốn nộp bài chứ?`;
      }
      if (!confirm(msg)) return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (exam?.due_at && new Date() > new Date(exam.due_at)) {
      alert(`Không thể nộp bài do bài thi đã quá hạn chót (${new Date(exam.due_at).toLocaleString('vi-VN')}).`);
      setSubmitting(false);
      router.push(`/exam/${examId}`);
      return;
    }

    try {
      const res = await submitExam({
        examId,
        studentId,
        answers
      });

      if (res.success) {
        setScoreResult(res);
        setQuizFinished(true);
        // Clear local storage draft
        localStorage.removeItem(storageKey);
      } else {
        alert(`Lỗi nộp bài: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Đã xảy ra lỗi bất ngờ: ${err.message}`);
    }
    setSubmitting(false);
  };

  const handleAutoSubmit = () => {
    alert('⏳ HẾT GIỜ LÀM BÀI! Hệ thống đang tự động nộp bài làm của bạn.');
    handleSubmit(false);
  };

  // Helper to format remaining time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang tải đề thi và kiểm tra bảo mật...</p>
      </div>
    );
  }

  // Score Screen after finishing quiz
  if (quizFinished && scoreResult) {
    const isPending = scoreResult.status === 'Pending';
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
        <div className="card-el p-8 max-w-xl w-full text-center border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 w-fit mx-auto mb-6">
            <CheckCircle className="w-16 h-16" />
          </div>

          <h1 className="text-3xl font-extrabold mb-1">Nộp Bài Thành Công!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Cảm ơn bạn đã hoàn thành bài thi.</p>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-8 space-y-4">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {isPending ? 'Kết quả trắc nghiệm sơ bộ' : 'Kết quả chính thức của bạn'}
            </div>
            <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
              {scoreResult.score} <span className="text-lg text-slate-500 font-normal">/ 10 điểm</span>
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isPending ? (
                <span className="text-amber-500 font-bold block animate-pulse">
                  Bài thi có câu tự luận, kết quả chính thức đang chờ giáo viên chấm.
                </span>
              ) : (
                <>Số câu đúng: <strong className="text-indigo-600 dark:text-indigo-400">{scoreResult.correctCount || 0}</strong> / {scoreResult.totalQuestions} câu.</>
              )}
            </div>
            {warningCount > 0 && (
              <div className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Số lần chuyển tab (cảnh báo gian lận): {warningCount}
              </div>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl text-xs text-slate-500 text-left mb-8">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">📧 Báo cáo điểm chi tiết:</p>
            {isPending ? (
              <p>Hệ thống đã gửi bảng điểm trắc nghiệm sơ bộ về email <strong>{student?.email}</strong>. Sau khi giáo viên hoàn tất chấm điểm tự luận, bạn sẽ nhận được email báo điểm chính thức.</p>
            ) : (
              <p>Hệ thống đã tự động chấm điểm và gửi bảng điểm chi tiết kèm lời giải từng câu hỏi về địa chỉ email của bạn: <strong>{student?.email}</strong>.</p>
            )}
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/10"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      
      {/* Student Quiz Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm sm:text-base hidden sm:inline">{exam?.title}</span>
            <span className="font-bold text-sm sm:hidden">Làm Bài Thi</span>
          </div>

          {/* Greet Student */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-slate-500">
              Xin chào, <strong className="text-slate-800 dark:text-slate-200">{student?.name}</strong>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Questions List (Takes 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {questions.map((q, idx) => {
            const selectedOpt = answers[q.id];
            const isFirstOfType = idx === 0 || questions[idx - 1].question_type !== q.question_type;
            
            let sectionHeader = null;
            if (isFirstOfType) {
              if (q.question_type === 'MultipleChoice') {
                sectionHeader = (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl text-sm border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wider mb-4">
                    Phần I: Câu hỏi trắc nghiệm nhiều lựa chọn
                  </div>
                );
              } else if (q.question_type === 'TrueFalse') {
                sectionHeader = (
                  <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 font-bold rounded-xl text-sm border border-violet-100 dark:border-violet-900/50 uppercase tracking-wider mb-4">
                    Phần II: Câu hỏi trắc nghiệm Đúng/Sai
                  </div>
                );
              } else if (q.question_type === 'FillIn') {
                sectionHeader = (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-bold rounded-xl text-sm border border-amber-100 dark:border-amber-900/50 uppercase tracking-wider mb-4">
                    Phần III: Câu hỏi trắc nghiệm trả lời ngắn (Điền đáp án)
                  </div>
                );
              } else if (q.question_type === 'Essay') {
                sectionHeader = (
                  <div className="p-4 bg-pink-50/50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 font-bold rounded-xl text-sm border border-pink-100 dark:border-pink-900/50 uppercase tracking-wider mb-4">
                    Phần IV: Câu hỏi tự luận
                  </div>
                );
              }
            }

            return (
              <div key={q.id} className="space-y-4 mb-6">
                {sectionHeader}
                <div 
                  id={`question-${idx + 1}`}
                  className="card-el p-6 shadow-sm scroll-mt-20 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                >
                {/* Question title and content */}
                <div className="flex gap-2 items-start mb-4">
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                    Câu {idx + 1}
                  </span>
                  <div className="text-base font-semibold leading-relaxed">
                    <LatexRenderer text={q.content} />
                  </div>
                </div>

                {/* Question Options / Inputs based on Question Type */}
                <div className="pl-0 sm:pl-8 mt-4 space-y-4">
                  {q.image_url && (
                    <div className="mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={q.image_url} 
                        alt="Hình minh họa câu hỏi" 
                        className="max-h-60 rounded object-contain border border-slate-200 dark:border-slate-800" 
                      />
                    </div>
                  )}

                  {q.question_type === 'MultipleChoice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.keys(q.options || {}).sort().map(key => {
                        const isSelected = q.is_multiselect
                          ? (selectedOpt || '').split(',').includes(key)
                          : selectedOpt === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, key, q.is_multiselect)}
                            className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 cursor-pointer group ${
                              isSelected 
                                ? 'border-indigo-600 bg-indigo-600/5 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400' 
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                            }`}
                          >
                            {q.is_multiselect ? (
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border font-bold shrink-0 ${
                                isSelected 
                                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400' 
                                  : 'border-slate-300 dark:border-slate-700 text-slate-500 group-hover:border-slate-400'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            ) : (
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border font-bold shrink-0 ${
                                isSelected 
                                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400' 
                                  : 'border-slate-300 dark:border-slate-700 text-slate-500 group-hover:border-slate-400'
                              }`}>
                                {key}
                              </span>
                            )}
                            <span className="flex-1">
                              {q.is_multiselect && <strong className="mr-1.5 text-slate-400">{key}.</strong>}
                              {q.options[key]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === 'TrueFalse' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 italic mb-2">Hãy chọn Đúng (Đ) hoặc Sai (S) cho từng ý:</p>
                      {Object.keys(q.options || {}).sort().map(key => {
                        let tfVal = '';
                        try {
                          const parsed = selectedOpt ? (typeof selectedOpt === 'string' ? JSON.parse(selectedOpt) : selectedOpt) : {};
                          tfVal = parsed[key] || '';
                        } catch(e){}

                        return (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded-xl text-sm gap-2">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-xs uppercase text-indigo-500 mt-0.5">{key}.</span>
                              <span className="text-slate-700 dark:text-slate-300">{q.options[key]}</span>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(q.id, key, 'Đ')}
                                className={`px-4 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                  tfVal === 'Đ'
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(q.id, key, 'S')}
                                className={`px-4 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                  tfVal === 'S'
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/10'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === 'FillIn' && (
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Đáp án của bạn:</label>
                      <input
                        type="text"
                        placeholder="Nhập kết quả ngắn (chữ hoặc số)..."
                        value={selectedOpt || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {q.question_type === 'Essay' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nội dung bài làm tự luận:</label>
                      <textarea
                        rows={6}
                        placeholder="Nhập nội dung câu trả lời tự luận chi tiết tại đây..."
                        value={selectedOpt || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {/* Right Column: Floating Panel for Stats & Actions (Takes 1 col) */}
        <div className="lg:col-span-1">
          <div className="card-el p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-24 space-y-6 shadow-md">
            
            {/* Countdown timer */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Thời gian còn lại:
              </span>
              <span className={`text-2xl font-black font-mono tracking-tight ${
                timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-800 dark:text-white'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Answer tracker map grid */}
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wider">
                Bản đồ câu trả lời ({Object.keys(answers).length} / {questions.length})
              </span>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  return (
                    <a
                      key={q.id}
                      href={`#question-${idx + 1}`}
                      className={`h-9 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${
                        isAnswered
                          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Warning indicator */}
            {warningCount > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <div>
                  <span className="font-semibold block">Phát hiện rời màn hình:</span>
                  Số lần cảnh báo: {warningCount}
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Nộp Bài...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Nộp Bài Thi</span>
                </>
              )}
            </button>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-950">
        Hệ thống thi và bảo mật tự động.
      </footer>
    </div>
  );
}
