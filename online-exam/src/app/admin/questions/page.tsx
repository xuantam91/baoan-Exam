'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSubjects, getChapters, getLessons } from '@/app/actions/metadata';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/app/actions/questions';
import { LatexRenderer } from '@/components/LatexRenderer';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Loader2, 
  X, 
  Check, 
  BookOpen, 
  HelpCircle,
  AlertCircle,
  ImageIcon,
  Sparkles
} from 'lucide-react';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Filter states
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null); // null means adding
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formGrade, setFormGrade] = useState('10');
  const [formType, setFormType] = useState('MultipleChoice');
  const [formContent, setFormContent] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formExplanation, setFormExplanation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form chapters & lessons states
  const [formChapterId, setFormChapterId] = useState('');
  const [formLessonId, setFormLessonId] = useState('');
  const [formChapters, setFormChapters] = useState<any[]>([]);
  const [formLessons, setFormLessons] = useState<any[]>([]);

  const loadChaptersForForm = async (subId: string, gr: string) => {
    const res = await getChapters(subId, gr);
    if (res.success) {
      setFormChapters(res.data || []);
    }
  };

  const loadLessonsForForm = async (chapId: string) => {
    const res = await getLessons(chapId);
    if (res.success) {
      setFormLessons(res.data || []);
    }
  };

  const handleFormSubjectGradeChange = async (newSubId: string, newGr: string) => {
    setFormSubjectId(newSubId);
    setFormGrade(newGr);
    setFormChapterId('');
    setFormLessonId('');
    setFormLessons([]);
    if (newSubId && newGr) {
      const res = await getChapters(newSubId, newGr);
      if (res.success) {
        setFormChapters(res.data || []);
      }
    } else {
      setFormChapters([]);
    }
  };

  const handleFormChapterChange = async (newChapId: string) => {
    setFormChapterId(newChapId);
    setFormLessonId('');
    if (newChapId) {
      const res = await getLessons(newChapId);
      if (res.success) {
        setFormLessons(res.data || []);
      }
    } else {
      setFormLessons([]);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `question_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      setFormImageUrl(publicUrl);
    } catch (err: any) {
      console.error('Lỗi tải ảnh lên:', err);
      setFormError(`Không thể tải ảnh lên: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Option states (for MultipleChoice or TrueFalse)
  const [mcOptions, setMcOptions] = useState<Array<{ key: string; text: string }>>([
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' }
  ]);
  const [mcCorrect, setMcCorrect] = useState('A');

  const [tfOptions, setTfOptions] = useState<Record<string, { text: string; ans: 'Đ' | 'S' }>>({
    a: { text: '', ans: 'Đ' },
    b: { text: '', ans: 'Đ' },
    c: { text: '', ans: 'Đ' },
    d: { text: '', ans: 'Đ' }
  });

  const [fillInCorrect, setFillInCorrect] = useState('');
  const [essayCorrect, setEssayCorrect] = useState('');

  useEffect(() => {
    loadSubjects();
    loadQuestions();
  }, []);

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    const res = await getSubjects();
    if (res.success) {
      setSubjects(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormSubjectId(res.data[0].id);
      }
    }
    setSubjectsLoading(false);
  };

  const loadQuestions = async () => {
    setLoading(true);
    const res = await getQuestions();
    if (res.success) {
      setQuestions(res.data || []);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormContent('');
    setFormExplanation('');
    setFormImageUrl('');
    setFormType('MultipleChoice');
    setFormDifficulty('Medium');
    setFormChapterId('');
    setFormLessonId('');
    setFormChapters([]);
    setFormLessons([]);
    if (subjects.length > 0) {
      setFormSubjectId(subjects[0].id);
      loadChaptersForForm(subjects[0].id, '10');
    }
    setMcOptions([
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]);
    setMcCorrect('A');
    setTfOptions({
      a: { text: '', ans: 'Đ' },
      b: { text: '', ans: 'Đ' },
      c: { text: '', ans: 'Đ' },
      d: { text: '', ans: 'Đ' }
    });
    setFillInCorrect('');
    setEssayCorrect('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = async (q: any) => {
    setEditingQuestion(q);
    setFormSubjectId(q.subject_id);
    setFormGrade(q.grade);
    setFormType(q.question_type);
    setFormContent(q.content);
    setFormDifficulty(q.difficulty);
    setFormExplanation(q.explanation || '');
    setFormImageUrl(q.image_url || '');
    setFormError('');

    // Prepopulate chapters and lessons asynchronously
    setFormChapterId(q.chapter_id || '');
    setFormLessonId(q.lesson_id || '');
    
    if (q.subject_id && q.grade) {
      const chapRes = await getChapters(q.subject_id, q.grade);
      if (chapRes.success) {
        setFormChapters(chapRes.data || []);
      }
    } else {
      setFormChapters([]);
    }

    if (q.chapter_id) {
      const lesRes = await getLessons(q.chapter_id);
      if (lesRes.success) {
        setFormLessons(lesRes.data || []);
      }
    } else {
      setFormLessons([]);
    }

    // Prepopulate answers by type
    if (q.question_type === 'MultipleChoice') {
      const opts = q.options || {};
      const list = Object.keys(opts).map(k => ({ key: k, text: opts[k] }));
      setMcOptions(list.length > 0 ? list : [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]);
      setMcCorrect(q.correct_answer || 'A');
    } else if (q.question_type === 'TrueFalse') {
      const opts = q.options || {};
      let correctObj: Record<string, 'Đ' | 'S'> = {};
      try {
        correctObj = JSON.parse(q.correct_answer);
      } catch (e) {
        correctObj = { a: 'Đ', b: 'Đ', c: 'Đ', d: 'Đ' };
      }
      setTfOptions({
        a: { text: opts.a || '', ans: correctObj.a || 'Đ' },
        b: { text: opts.b || '', ans: correctObj.b || 'Đ' },
        c: { text: opts.c || '', ans: correctObj.c || 'Đ' },
        d: { text: opts.d || '', ans: correctObj.d || 'Đ' }
      });
    } else if (q.question_type === 'FillIn') {
      setFillInCorrect(q.correct_answer || '');
    } else if (q.question_type === 'Essay') {
      setEssayCorrect(q.correct_answer || '');
    }

    setModalOpen(true);
  };

  const handleDelete = async (id: string, contentSnippet: string) => {
    if (!confirm(`Bạn có chắc muốn xóa câu hỏi này?\n"${contentSnippet.substring(0, 60)}..."`)) {
      return;
    }
    const res = await deleteQuestion(id);
    if (res.success) {
      loadQuestions();
    } else {
      alert(`Xóa thất bại: ${res.error}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || !formSubjectId) {
      setFormError('Vui lòng điền nội dung câu hỏi và chọn môn học.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    let finalOptions: any = {};
    let finalCorrectAnswer = '';

    if (formType === 'MultipleChoice') {
      mcOptions.forEach(opt => {
        if (opt.key) finalOptions[opt.key] = opt.text;
      });
      finalCorrectAnswer = mcCorrect;
      
      if (mcOptions.some(o => !o.text.trim())) {
        setFormError('Vui lòng điền nội dung cho tất cả phương án lựa chọn.');
        setSubmitting(false);
        return;
      }
    } else if (formType === 'TrueFalse') {
      finalOptions = {
        a: tfOptions.a.text,
        b: tfOptions.b.text,
        c: tfOptions.c.text,
        d: tfOptions.d.text
      };
      
      if (!tfOptions.a.text.trim() || !tfOptions.b.text.trim() || !tfOptions.c.text.trim() || !tfOptions.d.text.trim()) {
        setFormError('Vui lòng điền nội dung cho cả 4 mệnh đề a, b, c, d.');
        setSubmitting(false);
        return;
      }
      
      finalCorrectAnswer = JSON.stringify({
        a: tfOptions.a.ans,
        b: tfOptions.b.ans,
        c: tfOptions.c.ans,
        d: tfOptions.d.ans
      });
    } else if (formType === 'FillIn') {
      finalOptions = {};
      finalCorrectAnswer = fillInCorrect.trim();
      if (!finalCorrectAnswer) {
        setFormError('Vui lòng điền kết quả cần điền.');
        setSubmitting(false);
        return;
      }
    } else if (formType === 'Essay') {
      finalOptions = {};
      finalCorrectAnswer = essayCorrect.trim();
    }

    const payload = {
      subject_id: formSubjectId,
      grade: formGrade,
      question_type: formType,
      content: formContent.trim(),
      options: finalOptions,
      correct_answer: finalCorrectAnswer,
      explanation: formExplanation.trim() || undefined,
      difficulty: formDifficulty,
      image_url: formImageUrl.trim() || undefined,
      chapter_id: formChapterId || null,
      lesson_id: formLessonId || null
    };

    let res;
    if (editingQuestion) {
      res = await updateQuestion(editingQuestion.id, payload);
    } else {
      res = await createQuestion(payload);
    }

    if (res.success) {
      setModalOpen(false);
      loadQuestions();
    } else {
      setFormError(res.error || 'Lỗi lưu câu hỏi.');
    }
    setSubmitting(false);
  };

  const handleAddMcOption = () => {
    if (mcOptions.length >= 8) return;
    const alphabet = 'ABCDEFGH';
    const nextKey = alphabet[mcOptions.length];
    setMcOptions([...mcOptions, { key: nextKey, text: '' }]);
  };

  const handleRemoveMcOption = () => {
    if (mcOptions.length <= 2) return;
    setMcOptions(mcOptions.slice(0, -1));
    // Reset correct answer if it was deleted
    const keys = mcOptions.slice(0, -1).map(o => o.key);
    if (!keys.includes(mcCorrect)) {
      setMcCorrect(keys[0]);
    }
  };

  // Filter Logic
  const filteredQuestions = questions.filter(q => {
    const sMatch = subjectFilter === 'all' || q.subject_id === subjectFilter;
    const gMatch = gradeFilter === 'all' || q.grade === gradeFilter;
    const tMatch = typeFilter === 'all' || q.question_type === typeFilter;
    const qMatch = searchQuery === '' || q.content.toLowerCase().includes(searchQuery.toLowerCase()) || (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase()));
    return sMatch && gMatch && tMatch && qMatch;
  });

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ngân Hàng Câu Hỏi</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Xem, sửa, thêm thủ công và quản lý các câu hỏi trong ngân hàng đề thi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/questions/generate"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Sparkles className="w-4 h-4 text-purple-200" /> Tạo Câu Hỏi AI 🪄
          </Link>
          
          <button
            onClick={handleOpenAdd}
            disabled={subjects.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" /> Thêm Thủ Công
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-el p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Tổng số câu hỏi</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{questions.length}</span>
        </div>
        <div className="card-el p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Trắc nghiệm (MCQ)</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {questions.filter(q => q.question_type === 'MultipleChoice').length}
          </span>
        </div>
        <div className="card-el p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Đúng / Sai tổ hợp</span>
          <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
            {questions.filter(q => q.question_type === 'TrueFalse').length}
          </span>
        </div>
        <div className="card-el p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Tự luận & Điền khuyết</span>
          <span className="text-2xl font-black text-amber-500">
            {questions.filter(q => q.question_type === 'Essay' || q.question_type === 'FillIn').length}
          </span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="card-el p-6 shadow-sm">
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Môn Học</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả các môn</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Khối Lớp</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Dạng câu hỏi</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="MultipleChoice">Trắc nghiệm (MultipleChoice)</option>
              <option value="TrueFalse">Đúng / Sai tổ hợp (TrueFalse)</option>
              <option value="FillIn">Trả lời ngắn (FillIn)</option>
              <option value="Essay">Tự luận (Essay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Tìm kiếm nội dung</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Nhập nội dung tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Questions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Không tìm thấy câu hỏi nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500 w-1/2">Nội dung câu hỏi</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Thông tin</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">Dạng câu hỏi</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-500">Độ khó</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          <LatexRenderer text={q.content} />
                        </div>
                        {q.image_url && (
                          <div className="space-y-1.5 mt-1">
                            <div className="flex items-center gap-1 text-xs text-indigo-500 font-semibold">
                              <ImageIcon className="w-3.5 h-3.5" /> Ảnh minh họa:
                            </div>
                            <img src={q.image_url} alt="Minh họa câu hỏi" className="max-w-[150px] max-h-[100px] object-contain rounded border border-slate-200 dark:border-slate-800 bg-white p-1" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                          {q.subjects?.name}
                        </span>
                        <span className="block text-xs text-slate-400 font-medium">Khối {q.grade}</span>
                        {q.chapters?.title && (
                          <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[180px]" title={q.chapters.title}>
                            📁 {q.chapters.title}
                          </span>
                        )}
                        {q.lessons?.title && (
                          <span className="block text-[10px] text-violet-600 dark:text-violet-400 font-semibold truncate max-w-[180px]" title={q.lessons.title}>
                            📄 {q.lessons.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        q.question_type === 'MultipleChoice' ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                        q.question_type === 'TrueFalse' ? 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400' :
                        q.question_type === 'FillIn' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {q.question_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                        q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                          title="Sửa câu hỏi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.content)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold">
                {editingQuestion ? 'Cập Nhật Câu Hỏi' : 'Thêm Câu Hỏi Thủ Công'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Môn Học *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => handleFormSubjectGradeChange(e.target.value, formGrade)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Khối lớp (Grade)</label>
                  <select
                    value={formGrade}
                    onChange={(e) => handleFormSubjectGradeChange(formSubjectId, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Độ khó</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Easy">Dễ (Easy)</option>
                    <option value="Medium">Trung bình (Medium)</option>
                    <option value="Hard">Khó (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Chương (Chapter)</label>
                  <select
                    value={formChapterId}
                    onChange={(e) => handleFormChapterChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn Chương (Không bắt buộc) --</option>
                    {formChapters.map((chap) => (
                      <option key={chap.id} value={chap.id}>{chap.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Bài học (Lesson)</label>
                  <select
                    value={formLessonId}
                    onChange={(e) => setFormLessonId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    disabled={!formChapterId}
                  >
                    <option value="">-- Chọn Bài học (Không bắt buộc) --</option>
                    {formLessons.map((les) => (
                      <option key={les.id} value={les.id}>{les.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Dạng câu hỏi</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="MultipleChoice">Trắc nghiệm (MultipleChoice)</option>
                    <option value="TrueFalse">Đúng / Sai tổ hợp (TrueFalse)</option>
                    <option value="FillIn">Trả lời ngắn (FillIn)</option>
                    <option value="Essay">Tự luận (Essay)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Ảnh minh họa (Tải lên hoặc dùng Link URL)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nhập liên kết https://... hoặc tải ảnh lên bên dưới"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="px-3 py-2 text-xs font-semibold bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="admin-image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="admin-image-upload"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lên...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" /> Chọn file từ máy tính
                        </>
                      )}
                    </label>
                  </div>
                  
                  {formImageUrl && (
                    <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 max-w-[200px]">
                      <img
                        src={formImageUrl}
                        alt="Xem trước ảnh minh họa"
                        className="w-full h-auto rounded object-contain max-h-[120px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Nội dung câu hỏi * (Hỗ trợ LaTeX, vd: $x^2$)</label>
                <textarea
                  rows={3}
                  placeholder="Điền nội dung câu hỏi..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic options form based on selected type */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-4">
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Cấu hình Đáp án & Phương án</h4>
                
                {formType === 'MultipleChoice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Nhập các phương án lựa chọn:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddMcOption}
                          disabled={mcOptions.length >= 8}
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          + Thêm đáp án
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveMcOption}
                          disabled={mcOptions.length <= 2}
                          className="px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 hover:opacity-85 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          - Bớt đáp án
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {mcOptions.map((opt, oIdx) => (
                        <div key={opt.key} className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-400 w-4">{opt.key}.</span>
                          <input
                            type="text"
                            placeholder={`Nội dung đáp án ${opt.key}`}
                            value={opt.text}
                            onChange={(e) => {
                              const list = [...mcOptions];
                              list[oIdx].text = e.target.value;
                              setMcOptions(list);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="max-w-xs">
                      <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Phương án đúng nhất</label>
                      <select
                        value={mcCorrect}
                        onChange={(e) => setMcCorrect(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        {mcOptions.map(o => (
                          <option key={o.key} value={o.key}>Phương án {o.key}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formType === 'TrueFalse' && (
                  <div className="space-y-3">
                    <span className="text-xs text-slate-500">Điền nội dung và kết quả 4 mệnh đề a, b, c, d:</span>
                    {(['a', 'b', 'c', 'd'] as const).map(key => (
                      <div key={key} className="grid grid-cols-4 gap-3 items-center">
                        <span className="font-bold text-xs text-slate-400 w-4 uppercase text-center">{key}.</span>
                        <input
                          type="text"
                          placeholder={`Nội dung mệnh đề ${key}`}
                          value={tfOptions[key].text}
                          onChange={(e) => {
                            setTfOptions({
                              ...tfOptions,
                              [key]: { ...tfOptions[key], text: e.target.value }
                            });
                          }}
                          className="col-span-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                        <select
                          value={tfOptions[key].ans}
                          onChange={(e) => {
                            setTfOptions({
                              ...tfOptions,
                              [key]: { ...tfOptions[key], ans: e.target.value as 'Đ' | 'S' }
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Đ">Đúng</option>
                          <option value="S">Sai</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {formType === 'FillIn' && (
                  <div className="max-w-xs">
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Đáp án chính xác</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 5 hoặc Hà Nội"
                      value={fillInCorrect}
                      onChange={(e) => setFillInCorrect(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {formType === 'Essay' && (
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Ý chính cần đạt / Hướng dẫn chấm điểm tự luận</label>
                    <textarea
                      rows={2}
                      placeholder="Nhập hướng dẫn chấm điểm tự luận..."
                      value={essayCorrect}
                      onChange={(e) => setEssayCorrect(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Lời giải chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Nhập giải thích chi tiết cho câu hỏi..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-900 hover:opacity-80 font-medium text-sm cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 py-2 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Lưu Câu Hỏi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
