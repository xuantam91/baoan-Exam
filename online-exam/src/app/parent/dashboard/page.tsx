'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOutAction } from '@/app/actions/auth';
import { getParentDashboardInfo } from '@/app/actions/exams';
import { 
  GraduationCap, 
  Clock, 
  HelpCircle, 
  Calendar, 
  User, 
  Award, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  HeartHandshake
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function ParentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'grades' | 'schedule'>('grades');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const userRes = await getCurrentUser();
      if (userRes.success && userRes.profile) {
        setParentName(userRes.profile.name);
        
        const dataRes = await getParentDashboardInfo(userRes.profile.id);
        if (dataRes.success) {
          setStudent(dataRes.student);
          setExams(dataRes.exams || []);
          setSubmissions(dataRes.submissions || []);
        } else {
          setErrorMsg(dataRes.error || 'Không thể liên kết thông tin con em.');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Đang tải bảng điều khiển phụ huynh...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Navbar */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-650 rounded-md text-white">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Phụ Huynh Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Hero Greeting & Child linkage banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-850 py-8 px-4 text-white shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Kính chào Phụ huynh {parentName}!</h1>
            <p className="text-xs text-indigo-200">
              Hệ thống kết nối giúp phụ huynh đồng hành và theo sát chặng đường học tập của con em.
            </p>
          </div>
          {student ? (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-4">
              <div>
                <p className="text-indigo-200 text-[10px] uppercase font-bold">Học sinh liên kết</p>
                <p className="text-sm font-bold">{student.name}</p>
              </div>
              <div className="border-l border-white/20 h-8"></div>
              <div>
                <p className="text-indigo-200 text-[10px] uppercase font-bold">Lớp học</p>
                <p>{student.classes?.name || 'Tự do'} (Khối {student.classes?.grade})</p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-500/20 px-4 py-2 rounded-xl text-xs border border-rose-500/30 text-rose-200">
              Chưa liên kết tài khoản con em.
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-xl border border-rose-100 dark:border-rose-900/40">
            ⚠️ {errorMsg}
          </div>
        )}

        {student && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('grades')}
                className={`pb-3 text-sm font-bold border-b-2 mr-6 cursor-pointer transition-all ${
                  activeTab === 'grades'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Bảng Điểm Của Con ({submissions.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${
                  activeTab === 'schedule'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Lịch Kiểm Tra & Luyện Tập ({exams.length})
              </button>
            </div>

            {/* Grades Tab */}
            {activeTab === 'grades' && (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                    <Award className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500">Con chưa thực hiện nộp bài kiểm tra nào.</p>
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const examTitle = sub.exams?.title || 'Đề thi';
                    const subjectName = sub.exams?.subjects?.name || 'Môn học';
                    const submissionDate = new Date(sub.submitted_at).toLocaleString('vi-VN');
                    
                    const isEssayGraded = sub.graded_score !== null;
                    const displayScore = isEssayGraded ? sub.graded_score : sub.score;

                    return (
                      <div 
                        key={sub.id} 
                        className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                              {subjectName}
                            </span>
                            <span className="text-xs text-slate-400">
                              Nộp lúc: {submissionDate}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">{examTitle}</h3>
                          
                          {/* Teacher Comment */}
                          {sub.comment && (
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-105 dark:border-slate-850 text-xs text-slate-500">
                              💬 <strong className="text-slate-650 dark:text-slate-350">Nhận xét của giáo viên:</strong> {sub.comment}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-900">
                          <div>
                            <p className="text-[10px] text-slate-400 text-right uppercase font-semibold">Điểm thi của con</p>
                            <div className="flex items-center gap-1">
                              <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{displayScore}</strong>
                              <span className="text-xs text-slate-400 font-semibold">/ 10 điểm</span>
                            </div>
                          </div>

                          <div>
                            {isEssayGraded ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-105 dark:border-emerald-950">
                                Đã Chấm Điểm
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-105 dark:border-amber-950">
                                Chờ chấm tự luận
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500">Lớp hiện tại chưa có đề thi hoặc bài luyện tập nào.</p>
                  </div>
                ) : (
                  exams.map((exam) => {
                    const examSubs = submissions.filter(sub => sub.exam_id === exam.id);
                    const attemptsDone = examSubs.length;
                    const maxAttempts = exam.max_attempts !== undefined && exam.max_attempts !== null ? exam.max_attempts : 1;
                    const isExpired = exam.due_at ? new Date() > new Date(exam.due_at) : false;
                    const formattedDue = exam.due_at 
                      ? new Date(exam.due_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                      : 'Không giới hạn';

                    return (
                      <div 
                        key={exam.id} 
                        className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-855 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                              {exam.subjects?.name}
                            </span>
                            
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                <AlertCircle className="w-3 h-3" /> Đã quá hạn nộp bài
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                Hạn nộp: {formattedDue}
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 line-clamp-1">{exam.title}</h3>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} phút</span>
                            <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> {exam.question_ids?.length || 0} câu hỏi</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-semibold">
                            Lượt làm của con: <strong className="text-slate-700 dark:text-slate-300">{attemptsDone} / {maxAttempts === 0 ? 'Nhiều lần' : `${maxAttempts} lần`}</strong>
                          </span>
                          
                          {attemptsDone > 0 ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950">
                              Đã làm bài
                            </span>
                          ) : isExpired ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-950">
                              Bỏ lỡ bài thi
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950 animate-pulse">
                              Chưa làm bài
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
