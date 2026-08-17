'use client';

import { useEffect, useState } from 'react';
import { getSubjects, getClasses, getChapters, getLessons } from '@/app/actions/metadata';
import { getExams, createRandomExam, deleteExam, sendExamLinksToClass } from '@/app/actions/exams';
import { getQuestionCountStats, getCurriculumQuestionCounts } from '@/app/actions/questions';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Copy, 
  Mail, 
  Loader2, 
  Check, 
  Calendar, 
  Clock, 
  HelpCircle, 
  AlertCircle,
  Printer,
  FileText,
  CheckSquare,
  Key
} from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState(''); // Empty string for "De thi chung"
  const [numQuestions, setNumQuestions] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Advanced Question Constraints
  const [enableConfig, setEnableConfig] = useState(false);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [mcCount, setMcCount] = useState(0);
  const [tfCount, setTfCount] = useState(0);
  const [fillCount, setFillCount] = useState(0);
  const [essayCount, setEssayCount] = useState(0);

  // Question bank availability stats
  const [questionStats, setQuestionStats] = useState<any>({
    difficulty: { Easy: 0, Medium: 0, Hard: 0 },
    type: { MultipleChoice: 0, TrueFalse: 0, FillIn: 0, Essay: 0 },
    total: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const loadQuestionStats = async (subj: string, cId: string, chapIds?: string[], lesIds?: string[]) => {
    if (!subj) return;
    setStatsLoading(true);
    const selectedClassObj = classes.find(c => c.id === cId);
    const grade = selectedClassObj ? selectedClassObj.grade : null;
    const res = await getQuestionCountStats(subj, grade, chapIds, lesIds);
    if (res.success && res.stats) {
      setQuestionStats(res.stats);
    }
    setStatsLoading(false);
  };

  // Curriculum selection states (for filtering exam questions)
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumCounts, setCurriculumCounts] = useState<{
    chapterCounts: Record<string, number>;
    lessonCounts: Record<string, number>;
  }>({ chapterCounts: {}, lessonCounts: {} });

  const loadCurriculumForExam = async (subId: string, gr: string) => {
    if (!subId) return;
    setCurriculumLoading(true);
    const res = await getChapters(subId, gr);
    if (res.success && res.data) {
      setChaptersList(res.data);
      setSelectedChapters([]);
      setSelectedLessons([]);

      // Fetch question counts for chapters/lessons under this subject/grade
      const countsRes = await getCurriculumQuestionCounts(subId, gr);
      if (countsRes.success) {
        setCurriculumCounts({
          chapterCounts: countsRes.chapterCounts || {},
          lessonCounts: countsRes.lessonCounts || {}
        });
      } else {
        setCurriculumCounts({ chapterCounts: {}, lessonCounts: {} });
      }
      
      const map: Record<string, any[]> = {};
      await Promise.all(
        res.data.map(async (chap: any) => {
          const lRes = await getLessons(chap.id);
          if (lRes.success) {
            map[chap.id] = lRes.data || [];
          }
        })
      );
      setLessonsMap(map);
    } else {
      setChaptersList([]);
      setLessonsMap({});
      setSelectedChapters([]);
      setSelectedLessons([]);
      setCurriculumCounts({ chapterCounts: {}, lessonCounts: {} });
    }
    setCurriculumLoading(false);
  };

  const handleChapterToggle = (chapId: string) => {
    setSelectedChapters(prev => {
      const exists = prev.includes(chapId);
      const next = exists ? prev.filter(id => id !== chapId) : [...prev, chapId];
      
      const chapLessons = lessonsMap[chapId] || [];
      const chapLessonIds = chapLessons.map(l => l.id);
      if (exists) {
        setSelectedLessons(prevL => prevL.filter(id => !chapLessonIds.includes(id)));
      } else {
        setSelectedLessons(prevL => [...new Set([...prevL, ...chapLessonIds])]);
      }
      return next;
    });
  };

  const handleLessonToggle = (lesId: string, chapId: string) => {
    setSelectedLessons(prev => {
      const exists = prev.includes(lesId);
      const next = exists ? prev.filter(id => id !== lesId) : [...prev, lesId];
      
      const chapLessons = lessonsMap[chapId] || [];
      const chapLessonIds = chapLessons.map(l => l.id);
      const allSelected = chapLessonIds.length > 0 && chapLessonIds.every(id => next.includes(id));
      
      setSelectedChapters(prevC => {
        if (allSelected) {
          return prevC.includes(chapId) ? prevC : [...prevC, chapId];
        } else {
          return prevC.filter(id => id !== chapId);
        }
      });
      return next;
    });
  };

  // Trigger loading when subject or class changes
  useEffect(() => {
    if (subjectId) {
      const selectedClassObj = classes.find(c => c.id === classId);
      const grade = selectedClassObj ? selectedClassObj.grade : '10';
      loadCurriculumForExam(subjectId, grade);
      loadQuestionStats(subjectId, classId, [], []);
    }
  }, [subjectId, classId, classes]);

  // Re-load stats whenever selected chapters or lessons change
  useEffect(() => {
    if (subjectId) {
      loadQuestionStats(subjectId, classId, selectedChapters, selectedLessons);
    }
  }, [selectedChapters, selectedLessons]);

  // Operation states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ examId: string; success: boolean; msg: string } | null>(null);

  // Send link with due date modal states
  const [selectedExamForEmail, setSelectedExamForEmail] = useState<any | null>(null);
  const [dueModalOpen, setDueModalOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [gradingPolicy, setGradingPolicy] = useState<string>('highest');

  useEffect(() => {
    loadExams();
    loadMetadata();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    const res = await getExams();
    if (res.success) {
      setExams(res.data || []);
    }
    setLoading(false);
  };

  const loadMetadata = async () => {
    setMetadataLoading(true);
    const [subRes, classRes] = await Promise.all([getSubjects(), getClasses()]);
    if (subRes.success) setSubjects(subRes.data || []);
    if (classRes.success) {
      setClasses(classRes.data || []);
    }
    
    // Set default select values
    if (subRes.success && subRes.data && subRes.data.length > 0) {
      setSubjectId(subRes.data[0].id);
    }
    setMetadataLoading(false);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      setFormError('Vui lòng điền tiêu đề bài thi và chọn môn học.');
      return;
    }
    if (numQuestions <= 0 || durationMinutes <= 0) {
      setFormError('Số câu hỏi và thời gian thi phải lớn hơn 0.');
      return;
    }

    setFormError('');
    setCreating(true);

    if (enableConfig) {
      const diffSum = easyCount + mediumCount + hardCount;
      if (diffSum > 0 && diffSum !== numQuestions) {
        setFormError(`Tổng số câu theo độ khó (${diffSum}) phải bằng tổng số câu hỏi của đề (${numQuestions}).`);
        setCreating(false);
        return;
      }
      const typeSum = mcCount + tfCount + fillCount + essayCount;
      if (typeSum > 0 && typeSum !== numQuestions) {
        setFormError(`Tổng số câu theo dạng câu hỏi (${typeSum}) phải bằng tổng số câu hỏi của đề (${numQuestions}).`);
        setCreating(false);
        return;
      }

      // Check against database availability
      if (easyCount > (questionStats.difficulty.Easy || 0)) {
        setFormError(`Số câu Dễ yêu cầu (${easyCount} câu) vượt quá số lượng câu Dễ hiện có trong ngân hàng (${questionStats.difficulty.Easy} câu).`);
        setCreating(false);
        return;
      }
      if (mediumCount > (questionStats.difficulty.Medium || 0)) {
        setFormError(`Số câu Trung bình yêu cầu (${mediumCount} câu) vượt quá số lượng câu Trung bình hiện có trong ngân hàng (${questionStats.difficulty.Medium} câu).`);
        setCreating(false);
        return;
      }
      if (hardCount > (questionStats.difficulty.Hard || 0)) {
        setFormError(`Số câu Khó yêu cầu (${hardCount} câu) vượt quá số lượng câu Khó hiện có trong ngân hàng (${questionStats.difficulty.Hard} câu).`);
        setCreating(false);
        return;
      }
      if (mcCount > (questionStats.type.MultipleChoice || 0)) {
        setFormError(`Số câu Trắc nghiệm yêu cầu (${mcCount} câu) vượt quá số lượng câu Trắc nghiệm hiện có trong ngân hàng (${questionStats.type.MultipleChoice} câu).`);
        setCreating(false);
        return;
      }
      if (tfCount > (questionStats.type.TrueFalse || 0)) {
        setFormError(`Số câu Đúng/Sai yêu cầu (${tfCount} câu) vượt quá số lượng câu Đúng/Sai hiện có trong ngân hàng (${questionStats.type.TrueFalse} câu).`);
        setCreating(false);
        return;
      }
      if (fillCount > (questionStats.type.FillIn || 0)) {
        setFormError(`Số câu Trả lời ngắn yêu cầu (${fillCount} câu) vượt quá số lượng câu Trả lời ngắn hiện có trong ngân hàng (${questionStats.type.FillIn} câu).`);
        setCreating(false);
        return;
      }
      if (essayCount > (questionStats.type.Essay || 0)) {
        setFormError(`Số câu Tự luận yêu cầu (${essayCount} câu) vượt quá số lượng câu Tự luận hiện có trong ngân hàng (${questionStats.type.Essay} câu).`);
        setCreating(false);
        return;
      }
    }

    const configPayload = enableConfig ? {
      easyCount,
      mediumCount,
      hardCount,
      mcCount,
      tfCount,
      fillCount,
      essayCount
    } : {};

    const res = await createRandomExam({
      title: title.trim(),
      subjectId,
      classId: classId || null,
      numQuestions,
      durationMinutes,
      ...configPayload,
      chapterIds: selectedChapters,
      lessonIds: selectedLessons
    });

    if (res.success) {
      setTitle('');
      setNumQuestions(10);
      setDurationMinutes(15);
      // Reset config
      setEnableConfig(false);
      setEasyCount(0);
      setMediumCount(0);
      setHardCount(0);
      setMcCount(0);
      setTfCount(0);
      setFillCount(0);
      setEssayCount(0);
      setSelectedChapters([]);
      setSelectedLessons([]);
      loadExams();
    } else {
      setFormError(res.error || 'Lỗi xảy ra khi sinh đề thi ngẫu nhiên.');
    }
    setCreating(false);
  };

  const handleDeleteExam = async (id: string, examTitle: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đề thi "${examTitle}"? Việc này sẽ xóa toàn bộ bài nộp của học sinh đối với đề thi này.`)) {
      return;
    }
    const res = await deleteExam(id);
    if (res.success) {
      loadExams();
    } else {
      alert(`Lỗi khi xóa: ${res.error}`);
    }
  };

  const handleCopyLink = (examId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/exam/${examId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendEmails = (exam: any) => {
    setSelectedExamForEmail(exam);
    
    // Default due date: tomorrow at 23:59
    if (exam.due_at) {
      const d = new Date(exam.due_at);
      setDueDate(d.toISOString().split('T')[0]);
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setDueTime(`${hour}:${min}`);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setDueTime('23:59');
    }
    
    setMaxAttempts(exam.max_attempts !== undefined && exam.max_attempts !== null ? exam.max_attempts : 1);
    setGradingPolicy(exam.grading_policy || 'highest');
    setDueModalOpen(true);
  };

  const handleConfirmSendEmails = async () => {
    if (!selectedExamForEmail) return;
    const examId = selectedExamForEmail.id;
    setDueModalOpen(false);
    setSendingEmailId(examId);
    setEmailStatus(null);

    let isoDueAt: string | null = null;
    if (dueDate) {
      isoDueAt = new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString();
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await sendExamLinksToClass(examId, origin, isoDueAt, maxAttempts, gradingPolicy);

    if (res.success) {
      setEmailStatus({
        examId,
        success: true,
        msg: `Đã gửi thành công link đề thi cho ${res.sent} / ${res.total} học sinh trong lớp! Hạn nộp: ${isoDueAt ? new Date(isoDueAt).toLocaleString('vi-VN') : 'Không giới hạn'}`
      });
      loadExams();
    } else {
      setEmailStatus({
        examId,
        success: false,
        msg: `Gửi email thất bại: ${res.error}`
      });
    }
    setSendingEmailId(null);
    setSelectedExamForEmail(null);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản Lý Đề Thi</h1>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          Sinh đề thi trắc nghiệm ngẫu nhiên từ ngân hàng câu hỏi và phân phối cho học sinh.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Create Form */}
        <div className="xl:col-span-1">
          <div className="card-el p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Khởi Tạo Đề Thi Mới
            </h2>
            
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Tiêu đề bài thi *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra 15 phút Toán đại số"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Môn Học *</label>
                  {metadataLoading ? (
                    <p className="text-xs text-slate-400">Đang tải...</p>
                  ) : (
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Phân Phối Lớp</label>
                  {metadataLoading ? (
                    <p className="text-xs text-slate-400">Đang tải...</p>
                  ) : (
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Đề thi tự do (Không lớp) --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name} (Khối {cls.grade})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Chapters & Lessons Selection for Exam */}
              {chaptersList.length > 0 && (
                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="block text-xs font-bold text-slate-500">📁 Giới hạn theo Chương & Bài ({selectedChapters.length} chương, {selectedLessons.length} bài)</span>
                  <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-1">
                    {chaptersList.map((chap) => {
                      const lessons = lessonsMap[chap.id] || [];
                      const isChapSelected = selectedChapters.includes(chap.id);
                      return (
                        <div key={chap.id} className="space-y-1">
                          {/* Chapter selection */}
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={isChapSelected}
                              onChange={() => handleChapterToggle(chap.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{chap.title} <span className="text-slate-400 font-normal">({curriculumCounts.chapterCounts[chap.id] || 0} câu)</span></span>
                          </label>

                          {/* Lessons selection */}
                          {lessons.length > 0 && (
                            <div className="pl-5 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-1.5">
                              {lessons.map((les) => {
                                const isLesSelected = selectedLessons.includes(les.id);
                                return (
                                  <label key={les.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isLesSelected}
                                      onChange={() => handleLessonToggle(les.id, chap.id)}
                                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-3 h-3 cursor-pointer"
                                    />
                                    <span>{les.title} <span className="text-slate-400">({curriculumCounts.lessonCounts[les.id] || 0} câu)</span></span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Số lượng câu hỏi</label>
                  <input
                    type="number"
                    min={1}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Thời gian làm bài (Phút)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Advanced constraints toggler */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableConfig}
                    onChange={(e) => setEnableConfig(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cấu hình câu hỏi chi tiết (Độ khó & Dạng câu)</span>
                </label>
              </div>

              {enableConfig && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  
                  {/* Difficulty Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 border-b pb-1 flex items-center justify-between">
                      <span>🎯 Phân bổ Độ khó (Tổng = {numQuestions})</span>
                      {statsLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">
                          🟢 Dễ ({questionStats.difficulty.Easy})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={easyCount}
                          onChange={(e) => setEasyCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-0.5">
                          🟡 TB ({questionStats.difficulty.Medium})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={mediumCount}
                          onChange={(e) => setMediumCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-0.5">
                          🔴 Khó ({questionStats.difficulty.Hard})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={hardCount}
                          onChange={(e) => setHardCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Type Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 border-b pb-1 flex items-center justify-between">
                      <span>📋 Phân bổ Dạng câu (Tổng = {numQuestions})</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-0.5">
                          📝 Trắc nghiệm ({questionStats.type.MultipleChoice})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={mcCount}
                          onChange={(e) => setMcCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase mb-0.5">
                          ⚖️ Đúng / Sai ({questionStats.type.TrueFalse})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={tfCount}
                          onChange={(e) => setTfCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase mb-0.5">
                          ✏️ Trả lời ngắn ({questionStats.type.FillIn})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={fillCount}
                          onChange={(e) => setFillCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase mb-0.5">
                          📖 Tự luận ({questionStats.type.Essay})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={essayCount}
                          onChange={(e) => setEssayCount(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={creating || subjects.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Tạo Đề & Random Câu Hỏi
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Exams List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card-el p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Danh Sách Đề Thi Đang Hoạt Động ({exams.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Chưa có đề thi nào được tạo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="p-5 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl bg-white dark:bg-slate-900/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 text-xs font-semibold">
                          {exam.subjects?.name}
                        </span>
                        {exam.classes ? (
                          <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 text-xs font-semibold">
                            Lớp {exam.classes.name} (Khối {exam.classes.grade})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                            Đề thi tự do
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{exam.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {exam.duration_minutes} phút</span>
                        <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-violet-400" /> {exam.question_ids?.length || 0} câu hỏi</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>

                      {exam.is_sent && (
                        <div className="flex flex-wrap items-center gap-3 text-xs border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 mt-1.5">
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                            <CheckSquare className="w-3 h-3" /> Đã gửi lớp
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            Hạn nộp: <strong className="text-slate-800 dark:text-slate-200">{exam.due_at ? new Date(exam.due_at).toLocaleString('vi-VN') : 'Không giới hạn'}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            Số lần làm: <strong className="text-slate-800 dark:text-slate-200">{exam.max_attempts === 0 || exam.max_attempts === null ? 'Nhiều lần' : `${exam.max_attempts} lần`}</strong>
                          </span>
                          {(exam.max_attempts === 0 || exam.max_attempts === null || exam.max_attempts > 1) && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              Lấy điểm: <strong className="text-slate-800 dark:text-slate-200">{exam.grading_policy === 'highest' ? 'Cao nhất' : 'Lần đầu'}</strong>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Email Status Indicator */}
                      {emailStatus && emailStatus.examId === exam.id && (
                        <div className={`p-2 rounded text-xs mt-2 font-medium ${
                          emailStatus.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          {emailStatus.msg}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-800 self-end md:self-center">
                      <button
                        onClick={() => handleCopyLink(exam.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
                        title="Copy link làm bài"
                      >
                        {copiedId === exam.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Đã Copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {exam.class_id && (
                        <button
                          onClick={() => handleSendEmails(exam)}
                          disabled={sendingEmailId === exam.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                            exam.is_sent 
                              ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40' 
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                          title={exam.is_sent ? "Cập nhật cài đặt hoặc gửi lại bài thi" : "Gửi email cho học sinh trong lớp"}
                        >
                          {sendingEmailId === exam.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang Gửi...</span>
                            </>
                          ) : exam.is_sent ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Đã Gửi</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              <span>Gửi Lớp</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Đề Bài Button */}
                      <a
                        href={`/admin/exams/${exam.id}/print?type=questions`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        title="Xem / In / Tải Đề bài"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Đề bài</span>
                      </a>

                      {/* Phiếu Trả Lời Button */}
                      <a
                        href={`/admin/exams/${exam.id}/print?type=sheet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        title="Xem / In / Tải Phiếu tô trắc nghiệm"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-violet-500" />
                        <span>Phiếu tô</span>
                      </a>

                      {/* Đáp Án Button */}
                      <a
                        href={`/admin/exams/${exam.id}/print?type=key`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        title="Xem / In / Tải Đáp án & Lời giải chi tiết"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đáp án</span>
                      </a>

                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Due Date & Attempt Settings Selection Modal */}
      {dueModalOpen && selectedExamForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">⚙️ Cài đặt & Phân phối Đề thi</h3>
              <button 
                onClick={() => setDueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">Tên đề thi</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{selectedExamForEmail.title}</p>
            </div>

            {/* Friendly Expiration DateTime Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Hạn nộp bài (Ngày & Giờ)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </span>
                <input
                  type="datetime-local"
                  value={dueDate ? `${dueDate}T${dueTime || '00:00'}` : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [d, t] = val.split('T');
                      setDueDate(d);
                      setDueTime(t);
                    } else {
                      setDueDate('');
                      setDueTime('');
                    }
                  }}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Nhấp biểu tượng lịch/đồng hồ để chọn hạn nộp. Để trống nếu không muốn đặt hạn.
              </p>
            </div>

            {/* Attempts Limit Policy Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-105 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Cài đặt số lần làm bài</label>
              
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  maxAttempts === 1 
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-900/40'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="maxAttempts"
                      checked={maxAttempts === 1}
                      onChange={() => setMaxAttempts(1)}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Làm 1 lần</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Học sinh chỉ được làm và nộp duy nhất 1 lần.</span>
                </label>

                <label className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  maxAttempts === 0 || maxAttempts === null
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-900/40'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="maxAttempts"
                      checked={maxAttempts === 0 || maxAttempts === null}
                      onChange={() => setMaxAttempts(0)}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Làm nhiều lần</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Cho phép học sinh tự luyện thi nhiều lần.</span>
                </label>
              </div>

              {/* Lựa chọn Quy tắc tính điểm nếu cho làm nhiều lần */}
              {(maxAttempts === 0 || maxAttempts === null) && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 space-y-2 animate-fade-in">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Quy tắc tính điểm thi</label>
                  <select
                    value={gradingPolicy}
                    onChange={(e) => setGradingPolicy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="highest">Lấy điểm lần làm cao nhất (Khuyên dùng)</option>
                    <option value="first">Lấy điểm lần làm đầu tiên</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDueDate('');
                  setDueTime('');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all"
              >
                Không đặt hạn
              </button>
              <button
                type="button"
                onClick={() => setDueModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEmails}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md cursor-pointer transition-all"
              >
                Gửi Lớp
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
