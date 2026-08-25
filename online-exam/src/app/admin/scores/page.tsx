'use client';

import { useEffect, useState } from 'react';
import { getSubmissions, getSubmissionDetails, gradeEssaySubmission, getScoreStatistics } from '@/app/actions/submissions';
import { LatexRenderer } from '@/components/LatexRenderer';
import { 
  BarChart3, 
  Loader2, 
  Eye, 
  X, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  BookOpen, 
  Award,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  ClipboardCheck,
  Check,
  Users
} from 'lucide-react';

export default function ScoresPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics states
  const [statsExams, setStatsExams] = useState<any[]>([]);
  const [statsStudents, setStatsStudents] = useState<any[]>([]);
  const [statsSubmissions, setStatsSubmissions] = useState<any[]>([]);

  // Filters for stats grouping
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedClassId, setSelectedClassId] = useState<string>('All');
  const [selectedExamId, setSelectedExamId] = useState<string>('All');

  // Modal (Detailed Submission) states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [modalDetails, setModalDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Manual grading states
  const [essayGrades, setEssayGrades] = useState<Record<string, { score: number; comment: string }>>({});
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    const [subRes, statsRes] = await Promise.all([getSubmissions(), getScoreStatistics()]);
    if (subRes.success) {
      setSubmissions(subRes.data || []);
    }
    if (statsRes.success) {
      setStatsExams(statsRes.exams || []);
      setStatsStudents(statsRes.students || []);
      setStatsSubmissions(statsRes.submissions || []);
    }
    setLoading(false);
  };

  const handleOpenDetails = async (id: string) => {
    setSelectedSubId(id);
    setLoadingDetails(true);
    const res = await getSubmissionDetails(id);
    if (res.success) {
      setModalDetails(res);
      
      // Initialize essay grades inputs from existing essay_grades or empty
      const sub = res.submission;
      const initialEssayGrades: Record<string, { score: number; comment: string }> = {};
      
      res.questions.forEach((q: any) => {
        if (q.question_type === 'Essay') {
          const existing = sub.essay_grades?.[q.id] || { score: 0, comment: '' };
          initialEssayGrades[q.id] = {
            score: existing.score || 0,
            comment: existing.comment || ''
          };
        }
      });
      setEssayGrades(initialEssayGrades);
    } else {
      alert(`Lỗi tải chi tiết bài làm: ${res.error}`);
      setSelectedSubId(null);
    }
    setLoadingDetails(false);
  };

  const handleCloseModal = () => {
    setSelectedSubId(null);
    setModalDetails(null);
    setEssayGrades({});
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId) return;

    setGradingSubmitting(true);
    const res = await gradeEssaySubmission(selectedSubId, essayGrades);
    if (res.success) {
      alert('Đã lưu điểm chấm tự luận và gửi email báo điểm cho học sinh thành công!');
      handleCloseModal();
      loadSubmissions();
    } else {
      alert(`Lỗi chấm điểm: ${res.error}`);
    }
    setGradingSubmitting(false);
  };

  const handleGradeChange = (questionId: string, score: number, comment: string) => {
    setEssayGrades({
      ...essayGrades,
      [questionId]: { score, comment }
    });
  };

  // --- Dynamic Stats Calculations ---
  
  // Get unique grades from statsExams
  const gradesList = ['All', ...Array.from(new Set(statsExams.map(e => e.classes?.grade).filter(Boolean)))].sort();
  
  // Get unique classes filtered by selectedGrade
  const classesFiltered = statsExams
    .map(e => e.classes)
    .filter(c => c && (selectedGrade === 'All' || c.grade === selectedGrade));
  const uniqueClasses = Array.from(new Map(classesFiltered.map(c => [c.id, c])).values()).sort((a, b) => a.name.localeCompare(b.name));

  // Get unique exams filtered by grade & class for the dropdown selector options
  const examsDropdownList = statsExams.filter(e => {
    const matchesGrade = selectedGrade === 'All' || e.classes?.grade === selectedGrade;
    const matchesClass = selectedClassId === 'All' || e.class_id === selectedClassId;
    return matchesGrade && matchesClass;
  });

  // Get exams filtered by grade, class, AND selected exam for the statistics computation
  const examsFiltered = statsExams.filter(e => {
    const matchesGrade = selectedGrade === 'All' || e.classes?.grade === selectedGrade;
    const matchesClass = selectedClassId === 'All' || e.class_id === selectedClassId;
    const matchesExam = selectedExamId === 'All' || e.id === selectedExamId;
    return matchesGrade && matchesClass && matchesExam;
  });

  // Calculate statistics for each exam in the filtered list
  const examStatsList = examsFiltered.map(exam => {
    let classStudents = 0;
    if (exam.class_id) {
      classStudents = statsStudents.filter(s => s.class_id === exam.class_id).length;
    } else {
      // Free exam: count unique student submissions
      classStudents = statsSubmissions.filter(sub => sub.exam_id === exam.id).length;
    }

    const examSubmissions = statsSubmissions.filter(sub => sub.exam_id === exam.id);
    const submittedCount = examSubmissions.length;
    const pendingSubmissionCount = Math.max(0, classStudents - submittedCount);

    const gradedCount = examSubmissions.filter(sub => sub.graded_score !== null).length;
    const ungradedCount = examSubmissions.filter(sub => sub.graded_score === null).length;

    const completionRate = classStudents > 0 ? Math.round((submittedCount / classStudents) * 100) : 0;

    return {
      exam,
      classStudents,
      submittedCount,
      pendingSubmissionCount,
      gradedCount,
      ungradedCount,
      completionRate
    };
  });

  // Totals for Dashboard cards
  const totalDistributed = examStatsList.reduce((acc, curr) => acc + curr.classStudents, 0);
  const totalSubmitted = examStatsList.reduce((acc, curr) => acc + curr.submittedCount, 0);
  const totalPending = examStatsList.reduce((acc, curr) => acc + curr.pendingSubmissionCount, 0);
  const totalGraded = examStatsList.reduce((acc, curr) => acc + curr.gradedCount, 0);
  const totalUngraded = examStatsList.reduce((acc, curr) => acc + curr.ungradedCount, 0);

  // Filter submissions list below
  const filteredSubmissions = submissions.filter(sub => {
    const sName = sub.students?.name?.toLowerCase() || '';
    const eTitle = sub.exams?.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesQuery = sName.includes(query) || eTitle.includes(query);
    const matchesGrade = selectedGrade === 'All' || sub.students?.classes?.grade === selectedGrade;
    const matchesClass = selectedClassId === 'All' || sub.students?.class_id === selectedClassId;
    const matchesExam = selectedExamId === 'All' || sub.exam_id === selectedExamId;

    return matchesQuery && matchesGrade && matchesClass && matchesExam;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thống Kê Điểm & Chấm Thi</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Xem lịch sử làm bài, chấm điểm tự luận và thống kê chi tiết kết quả thi.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo học sinh, đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="card-el p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Bộ lọc thống kê gom nhóm</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grade Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Lọc theo Khối</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassId('All'); // Reset sub-filters
                setSelectedExamId('All');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Khối</option>
              {gradesList.filter(g => g !== 'All').map(grade => (
                <option key={grade} value={grade}>Khối {grade}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Lọc theo Lớp</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedExamId('All'); // Reset exam filter
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Lớp</option>
              {uniqueClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Exam Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Lọc theo Đề thi</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">Tất cả Đề thi</option>
              {examsDropdownList.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Distributed */}
        <div className="card-el p-4 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Học sinh nhận đề</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{totalDistributed}</h4>
          </div>
        </div>

        {/* Submitted */}
        <div className="card-el p-4 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Đã nộp bài</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{totalSubmitted}</h4>
          </div>
        </div>

        {/* Pending Submission */}
        <div className="card-el p-4 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Chưa làm bài</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{totalPending}</h4>
          </div>
        </div>

        {/* Graded */}
        <div className="card-el p-4 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Đã chấm xong</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{totalGraded}</h4>
          </div>
        </div>

        {/* Ungraded / Pending grading */}
        <div className="card-el p-4 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Chờ chấm tự luận</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{totalUngraded}</h4>
          </div>
        </div>
      </div>

      {/* Grouped Exams Stat Table */}
      <div className="card-el p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Thống Kê Tiến Độ Theo Từng Đề Thi ({examStatsList.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : examStatsList.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Không tìm thấy dữ liệu đề thi phù hợp bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Đề thi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Lớp / Khối</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Thời gian gửi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Hạn nộp bài</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Gửi cho</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Đã làm</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Chưa làm</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Đã chấm</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Chờ chấm</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {examStatsList.map(({ exam, classStudents, submittedCount, pendingSubmissionCount, gradedCount, ungradedCount, completionRate }) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>
                        <p>{exam.title}</p>
                        <p className="text-xs text-slate-400 font-normal">{exam.subjects?.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {exam.classes?.name || 'Tự do'} (Khối {exam.classes?.grade || exam.grade})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(exam.created_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {exam.due_at ? (
                        <span className={`font-semibold ${new Date() > new Date(exam.due_at) ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          {new Date(exam.due_at).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Không giới hạn</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {classStudents} HS
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                      {submittedCount}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-400">
                      {pendingSubmissionCount}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {gradedCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${ungradedCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400 font-normal'}`}>
                        {ungradedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-[120px] space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>{completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="card-el p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Chi Tiết Bài Đã Nộp Theo Bộ Lọc ({filteredSubmissions.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Chưa có bài thi nào được nộp khớp bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Học sinh</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Lớp</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Đề thi</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Môn học</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-500">Điểm trắc nghiệm</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-500">Số câu đúng</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-500">Điểm cuối cùng</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-500">Trạng thái</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Thời gian nộp</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-500">Xem/Chấm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSubmissions.map((sub) => {
                  const displayFinalScore = sub.graded_score !== null ? sub.graded_score : '-';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="px-6 py-3 font-semibold">
                        <div>
                          <p>{sub.students?.name}</p>
                          <p className="text-xs text-slate-400 font-normal">{sub.students?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                          {sub.students?.classes?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={sub.exams?.title}>
                        {sub.exams?.title}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {sub.exams?.subjects?.name}
                      </td>
                      <td className="px-6 py-3 text-center font-medium text-slate-500">
                        {sub.score}
                      </td>
                      <td className="px-6 py-3 text-center font-medium text-slate-500">
                        {sub.correct_count !== undefined && sub.correct_count !== null 
                          ? `${sub.correct_count} / ${sub.exams?.question_ids?.length || 0}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-base font-bold ${
                          displayFinalScore === '-' ? 'text-slate-400' :
                          Number(displayFinalScore) >= 8.0 ? 'text-emerald-600 dark:text-emerald-400' :
                          Number(displayFinalScore) >= 5.0 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {displayFinalScore}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {sub.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Chờ chấm
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                            <Check className="w-3 h-3" /> Đã chấm xong
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {formatDate(sub.submitted_at)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleOpenDetails(sub.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                          title={sub.status === 'Pending' ? 'Chấm tự luận' : 'Xem chi tiết'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detailed Submission & Grading Viewer */}
      {selectedSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold">Xem bài làm & Chấm điểm học sinh</h3>
                <p className="text-xs text-slate-400">Xem câu trả lời trắc nghiệm, điền số và nhập điểm cho câu tự luận.</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails || !modalDetails ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Đang tải chi tiết bài làm...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveGrades} className="space-y-6">
                  {/* Student & Exam Info Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> <strong>Học sinh:</strong> {modalDetails.submission?.students?.name}</div>
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /> <strong>Lớp:</strong> {modalDetails.submission?.students?.classes?.name}</div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> <strong>Nộp bài:</strong> {formatDate(modalDetails.submission?.submitted_at)}</div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-violet-500" /> <strong>Đề thi:</strong> {modalDetails.submission?.exams?.title}</div>
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-violet-500" /> <strong>Điểm trắc nghiệm sơ bộ:</strong> <span className="font-bold">{modalDetails.submission?.score} / 10</span></div>
                      <div className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-emerald-500" /> <strong>Số câu đúng:</strong> <span className="font-bold text-emerald-600 dark:text-emerald-400">{modalDetails.submission?.correct_count} / {modalDetails.submission?.exams?.question_ids?.length || 0} câu</span></div>
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-indigo-500" /> <strong>Điểm cuối cùng:</strong> <span className="font-bold text-indigo-600 dark:text-indigo-400">{modalDetails.submission?.graded_score !== null ? modalDetails.submission.graded_score : 'Chưa chấm tự luận'}</span></div>
                    </div>
                  </div>

                  {/* Question Answers Details */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-indigo-600" /> Chi Tiết Bài Làm
                    </h4>
                    
                    {modalDetails.questions?.map((q: any, idx: number) => {
                      const studentAnswer = modalDetails.submission?.answers?.[q.id] || '';
                      
                      if (q.question_type === 'Essay') {
                        // Essay Grading Form
                        const currentGrade = essayGrades[q.id] || { score: 0, comment: '' };
                        return (
                          <div key={q.id} className="p-5 rounded-xl border border-amber-200 bg-amber-50/10 dark:border-amber-950/40 dark:bg-amber-950/5 space-y-4">
                            <div className="flex gap-2 items-start">
                              <span className="font-bold text-sm text-amber-600 dark:text-amber-400 shrink-0 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                                Câu {idx + 1} [Tự luận]
                              </span>
                              <div className="text-sm font-semibold"><LatexRenderer text={q.content} /></div>
                            </div>
                            
                            {/* Student's answer */}
                            <div className="pl-0 md:pl-6 space-y-1">
                              <span className="text-xs font-semibold text-slate-500 block">Bài làm của học sinh:</span>
                              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 min-h-[80px]">
                                {studentAnswer || <span className="text-rose-500 italic">Không làm bài / Để trống</span>}
                              </div>
                            </div>

                            {/* Guideline answer key */}
                            {q.correct_answer && (
                              <div className="pl-0 md:pl-6 space-y-1">
                                <span className="text-xs font-semibold text-emerald-600 block">Đáp án gợi ý / Hướng dẫn chấm:</span>
                                <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                  <LatexRenderer text={q.correct_answer} />
                                </div>
                              </div>
                            )}

                            {/* Grading Inputs */}
                            {modalDetails.submission?.status === 'Pending' || selectedSubId ? (
                              <div className="pl-0 md:pl-6 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                  <label className="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Điểm số (Hệ số 0.00 đến 1.00) *</label>
                                  <select
                                    value={currentGrade.score}
                                    onChange={(e) => handleGradeChange(q.id, parseFloat(e.target.value), currentGrade.comment)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value={0}>0.00 (Sai hoàn toàn / Không làm)</option>
                                    <option value={0.25}>0.25 (Đúng một ít)</option>
                                    <option value={0.5}>0.50 (Đúng một nửa)</option>
                                    <option value={0.75}>0.75 (Đúng gần hết)</option>
                                    <option value={1.0}>1.00 (Đúng tuyệt đối / Đầy đủ)</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold mb-1 text-slate-600 dark:text-slate-400">Nhận xét bài làm</label>
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: Trình bày tốt, đủ ý..."
                                    value={currentGrade.comment}
                                    onChange={(e) => handleGradeChange(q.id, currentGrade.score, e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      }

                      // Auto-graded questions display
                      const isCorrect = q.question_type === 'TrueFalse' 
                        ? (function() {
                            try {
                              const corr = JSON.parse(q.correct_answer);
                              const std = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer;
                              return ['a','b','c','d'].every(k => corr[k] === std?.[k]);
                            } catch(e) { return false; }
                          })()
                        : studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();

                      return (
                        <div 
                          key={q.id}
                          className={`p-5 rounded-xl border ${
                            isCorrect 
                              ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/5' 
                              : 'border-rose-200 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/5'
                          }`}
                        >
                          <div className="flex gap-2 items-start mb-3">
                            <span className="font-bold text-sm text-slate-500 shrink-0 mt-0.5">
                              Câu {idx + 1} [{q.question_type}]:
                            </span>
                            <div className="text-sm font-medium"><LatexRenderer text={q.content} /></div>
                          </div>

                          {q.question_type === 'MultipleChoice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-6 mb-4">
                              {Object.keys(q.options || {}).map(key => {
                                const isSelected = studentAnswer === key;
                                const isCorrectOption = q.correct_answer === key;
                                let optionClass = 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                                
                                if (isSelected) {
                                  optionClass = isCorrect 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400'
                                    : 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-400';
                                } else if (isCorrectOption) {
                                  optionClass = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400';
                                }

                                return (
                                  <div key={key} className={`px-4 py-2.5 rounded-lg text-xs font-medium flex items-start gap-2 ${optionClass}`}>
                                    <span className="font-bold shrink-0">{key}.</span>
                                    <span>{q.options[key]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {q.question_type === 'TrueFalse' && (
                            <div className="pl-0 md:pl-6 space-y-2 mb-4">
                              {Object.keys(q.options || {}).map(key => {
                                let corrVal = 'Đ';
                                try { corrVal = JSON.parse(q.correct_answer)[key]; } catch(e){}
                                let stdVal = '-';
                                try { stdVal = (typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer)[key] || '-'; } catch(e){}
                                const subCorrect = corrVal === stdVal;

                                return (
                                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border border-slate-150 dark:border-slate-800 rounded-lg text-xs gap-2">
                                    <div className="flex items-start gap-2">
                                      <span className="font-bold uppercase text-indigo-500">{key}.</span>
                                      <span>{q.options[key]}</span>
                                    </div>
                                    <div className="flex gap-4 font-semibold">
                                      <span>Đáp án: <strong className="text-emerald-600">{corrVal}</strong></span>
                                      <span>Học sinh chọn: <strong className={subCorrect ? 'text-indigo-600' : 'text-rose-500'}>{stdVal}</strong></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {q.question_type === 'FillIn' && (
                            <div className="pl-0 md:pl-6 py-2 border-b border-dashed border-slate-200 dark:border-slate-800 mb-3 text-xs">
                              <p>Học sinh trả lời: <strong className="text-indigo-600 text-sm">{studentAnswer || 'Trống'}</strong></p>
                              <p className="mt-1">Đáp án chính xác: <strong className="text-emerald-600 text-sm">{q.correct_answer}</strong></p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pl-0 md:pl-6 text-sm">
                            {isCorrect ? (
                              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 shrink-0" /> Đúng
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-4 h-4 shrink-0" /> Sai
                              </span>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="pl-0 md:pl-6 border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 text-xs text-slate-500">
                              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Lời giải chi tiết:</span>
                              <div><LatexRenderer text={q.explanation} /></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Manual Grading submit area */}
                  {modalDetails.submission?.status === 'Pending' && (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/10 dark:border-indigo-950/40 dark:bg-indigo-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-400 text-sm">Chấm điểm tự luận hoàn tất?</h4>
                        <p className="text-xs text-slate-500">Bấm nút bên cạnh để hoàn tất, hệ thống sẽ tính lại điểm quy đổi 10 và gửi email kết quả cho học sinh.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={gradingSubmitting}
                        className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0 self-end sm:self-center"
                      >
                        {gradingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                        Lưu & Hoàn Tất Chấm Điểm
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="py-2 px-5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium text-sm hover:opacity-80 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
