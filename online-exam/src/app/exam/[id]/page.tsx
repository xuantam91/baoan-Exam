'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getExamForStudent } from '@/app/actions/exams';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  GraduationCap, 
  Clock, 
  HelpCircle, 
  UserCheck, 
  Loader2, 
  BookOpen, 
  AlertTriangle,
  Calendar 
} from 'lucide-react';

export default function ExamLoginPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form states
  const [credential, setCredential] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    const res = await getExamForStudent(examId);
    if (res.success && res.exam) {
      setExam(res.exam);
      if (res.exam.due_at && new Date() > new Date(res.exam.due_at)) {
        setError(`Bài thi này đã hết hạn nộp (Hạn chót: ${new Date(res.exam.due_at).toLocaleString('vi-VN')}).`);
      }
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại để xác thực.');
      return;
    }

    setError('');
    setVerifying(true);

    try {
      if (exam.due_at && new Date() > new Date(exam.due_at)) {
        setError(`Bài thi đã quá hạn nộp bài (Hạn chót: ${new Date(exam.due_at).toLocaleString('vi-VN')}). Bạn không thể làm bài lúc này.`);
        setVerifying(false);
        return;
      }

      const searchVal = credential.trim().toLowerCase();
      
      // Query student by email or phone
      const { data: student, error: qError } = await supabase
        .from('students')
        .select('id, name, email, class_id')
        .or(`email.eq.${searchVal},phone.eq.${searchVal}`)
        .maybeSingle();

      if (qError) throw qError;

      if (!student) {
        setError('Thông tin xác thực không đúng hoặc học sinh chưa được đăng ký trong hệ thống.');
        setVerifying(false);
        return;
      }

      // If exam is class-restricted, verify student belongs to the class
      if (exam.class_id && student.class_id !== exam.class_id) {
        setError('Học sinh không thuộc lớp học được phân phối đề thi này.');
        setVerifying(false);
        return;
      }

      // Check if student has already submitted this exam and check against attempts policy
      const { data: existingSubs, error: subError } = await supabase
        .from('submissions')
        .select('id')
        .eq('exam_id', exam.id)
        .eq('student_id', student.id);

      if (subError) throw subError;

      const maxAttempts = exam.max_attempts !== undefined && exam.max_attempts !== null ? exam.max_attempts : 1;
      if (maxAttempts > 0 && existingSubs && existingSubs.length >= maxAttempts) {
        setError(`Bạn đã làm bài thi này ${existingSubs.length} lần. Số lần làm bài tối đa được phép là ${maxAttempts} lần.`);
        setVerifying(false);
        return;
      }

      // Successfully verified. Redirect to the quiz page passing studentId
      router.push(`/exam/${exam.id}/quiz?studentId=${student.id}`);
      
    } catch (err: any) {
      console.error('Lỗi xác thực học sinh:', err);
      setError('Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.');
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị phòng thi...</p>
      </div>
    );
  }

  if (notFound || !exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="card-el p-8 max-w-md w-full text-center border-rose-200 dark:border-rose-950/40">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Đề Thi Không Tồn Tại</h2>
          <p className="text-sm text-slate-500 mb-6">
            Mã đề thi của bạn không hợp lệ hoặc đề thi đã bị xóa khỏi hệ thống.
          </p>
          <a
            href="/"
            className="inline-block py-2 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Cổng Thi Trực Tuyến</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 max-w-4xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 w-full">
          
          {/* Left Column: Exam Details */}
          <div className="md:col-span-3 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 text-xs font-semibold">
                  Môn {exam.subjects?.name}
                </span>
                {exam.classes && (
                  <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 text-xs font-semibold">
                    Lớp {exam.classes.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                {exam.title}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-400">Thời gian</p>
                  <p className="font-bold">{exam.duration_minutes} phút</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-400">Số câu hỏi</p>
                  <p className="font-bold">{exam.question_ids?.length || 0} câu</p>
                </div>
              </div>

              {exam.due_at && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10 col-span-2 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <div>
                    <p className="text-xs text-rose-500 font-semibold">Hạn nộp bài</p>
                    <p className="font-bold text-rose-600 dark:text-rose-400">{new Date(exam.due_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 leading-relaxed bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl">
              <p className="font-semibold mb-1 text-slate-700 dark:text-slate-300">💡 Lưu ý phòng thi:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Vui lòng chuẩn bị kết nối mạng ổn định trước khi bắt đầu.</li>
                <li>Hệ thống sẽ tự động nộp bài khi hết thời gian quy định.</li>
                <li>Không tải lại trang hoặc tắt trình duyệt trong quá trình làm bài.</li>
                <li>Kết quả và lời giải chi tiết sẽ được tự động gửi qua email của học sinh sau khi nộp bài.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Verification Portal Form */}
          <div className="md:col-span-2 flex items-center">
            <div className="card-el p-6 shadow-xl w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="text-center mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-full text-indigo-600 dark:text-indigo-400 w-fit mx-auto mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Xác Thực Thí Sinh</h3>
                <p className="text-xs text-slate-400 mt-1">Nhập thông tin đăng ký của bạn để vào thi</p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500">Email hoặc Số điện thoại *</label>
                  <input
                    type="text"
                    placeholder="hocsinh@gmail.com hoặc 0912..."
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Xác Nhận & Vào Thi
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        Phòng thi bảo mật bởi hệ thống ExamApp.
      </footer>
    </div>
  );
}
