'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getQuestionBatch, getQuestionsByBatch, updateDraftQuestion, approveQuestionBatch, deleteQuestionBatch } from '@/app/actions/question_batches';
import { deleteQuestion } from '@/app/actions/questions';
import { LatexRenderer } from '@/components/LatexRenderer';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft, 
  Loader2, 
  HelpCircle, 
  Info,
  Check,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

export default function ApproveBatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  // Data states
  const [batch, setBatch] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Medium');
  const [editExplanation, setEditExplanation] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  
  // Options states for editing
  const [editOptionsMC, setEditOptionsMC] = useState({ A: '', B: '', C: '', D: '' });
  const [editOptionsTF, setEditOptionsTF] = useState({ a: '', b: '', c: '', d: '' });
  const [editCorrectMC, setEditCorrectMC] = useState('A');
  const [editCorrectTF, setEditCorrectTF] = useState({ a: 'Đ', b: 'Đ', c: 'Đ', d: 'Đ' });
  const [editCorrectFillIn, setEditCorrectFillIn] = useState('');
  const [editCorrectEssay, setEditCorrectEssay] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!batchId) return;
      setLoading(true);
      
      const batchRes = await getQuestionBatch(batchId);
      if (batchRes.success && batchRes.data) {
        setBatch(batchRes.data);
      } else {
        alert('Không tìm thấy lượt tạo câu hỏi AI tương ứng.');
        router.push('/admin/questions/generate');
        return;
      }

      const questionsRes = await getQuestionsByBatch(batchId);
      if (questionsRes.success && questionsRes.data) {
        setQuestions(questionsRes.data);
        // Default select all questions for approval
        setSelectedIds(questionsRes.data.map(q => q.id));
      }
      
      setLoading(false);
    }
    loadData();
  }, [batchId]);

  // Handle individual checkbox selection
  function handleToggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Handle select/unselect all
  function handleToggleSelectAll() {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  }

  // Start editing a question
  function handleStartEdit(q: any) {
    setEditingId(q.id);
    setEditContent(q.content);
    setEditDifficulty(q.difficulty);
    setEditExplanation(q.explanation || '');
    setEditImageUrl(q.image_url || '');

    if (q.question_type === 'MultipleChoice') {
      setEditOptionsMC({
        A: q.options?.A || '',
        B: q.options?.B || '',
        C: q.options?.C || '',
        D: q.options?.D || ''
      });
      setEditCorrectMC(q.correct_answer);
    } else if (q.question_type === 'TrueFalse') {
      setEditOptionsTF({
        a: q.options?.a || '',
        b: q.options?.b || '',
        c: q.options?.c || '',
        d: q.options?.d || ''
      });
      
      // Parse correct answers (e.g. {"a":"Đ","b":"S",...})
      try {
        const parsed = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer;
        setEditCorrectTF({
          a: parsed?.a || 'Đ',
          b: parsed?.b || 'Đ',
          c: parsed?.c || 'Đ',
          d: parsed?.d || 'Đ'
        });
      } catch (e) {
        setEditCorrectTF({ a: 'Đ', b: 'S', c: 'Đ', d: 'S' });
      }
    } else if (q.question_type === 'FillIn') {
      setEditCorrectFillIn(q.correct_answer);
    } else if (q.question_type === 'Essay') {
      setEditCorrectEssay(q.correct_answer);
    }
  }

  // Handle image upload to Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageId(id);
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

      setEditImageUrl(publicUrl);
    } catch (err: any) {
      console.error('Lỗi tải ảnh lên:', err);
      alert(`Không thể tải ảnh lên: ${err.message}`);
    } finally {
      setUploadingImageId(null);
    }
  }

  function handleRemoveImage() {
    setEditImageUrl('');
  }

  // Save the edited question
  async function handleSaveEdit(id: string, type: string) {
    setSaveLoadingId(id);
    
    let finalOptions = {};
    let finalCorrectAnswer = '';

    if (type === 'MultipleChoice') {
      finalOptions = editOptionsMC;
      finalCorrectAnswer = editCorrectMC;
    } else if (type === 'TrueFalse') {
      finalOptions = editOptionsTF;
      finalCorrectAnswer = JSON.stringify(editCorrectTF);
    } else if (type === 'FillIn') {
      finalCorrectAnswer = editCorrectFillIn;
    } else if (type === 'Essay') {
      finalCorrectAnswer = editCorrectEssay;
    }

    const res = await updateDraftQuestion(id, {
      content: editContent,
      difficulty: editDifficulty,
      explanation: editExplanation,
      options: finalOptions,
      correct_answer: finalCorrectAnswer,
      image_url: editImageUrl || null
    });

    if (res.success && res.data) {
      // Cập nhật state local
      setQuestions(prev => prev.map(q => q.id === id ? res.data : q));
      setEditingId(null);
    } else {
      alert(`Lưu thất bại: ${res.error}`);
    }

    setSaveLoadingId(null);
  }

  // Delete an individual question from this draft batch
  async function handleDeleteQuestion(id: string) {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này khỏi đợt sinh?')) return;
    
    const res = await deleteQuestion(id);
    if (res.success) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      alert(`Xóa thất bại: ${res.error}`);
    }
  }

  // Approve the selected questions
  async function handleApproveBatch() {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để phê duyệt.');
      return;
    }

    if (!confirm(`Bạn có chắc muốn phê duyệt ${selectedIds.length} câu hỏi đã chọn? Các câu không được chọn sẽ tự động bị xóa bỏ.`)) {
      return;
    }

    setActionLoading(true);
    const res = await approveQuestionBatch(batchId, selectedIds);
    if (res.success) {
      alert('Phê duyệt bộ câu hỏi thành công! Các câu hỏi đã được đưa vào Ngân hàng chính.');
      router.push('/admin/questions/generate');
    } else {
      alert(`Phê duyệt thất bại: ${res.error}`);
      setActionLoading(false);
    }
  }

  // Reject the entire batch (deletes batch and cascade deletes questions)
  async function handleRejectBatch() {
    if (!confirm('Bạn có chắc chắn muốn TỪ CHỐI cả bộ đề này? Toàn bộ các câu hỏi nháp sẽ bị xóa sạch khỏi hệ thống.')) {
      return;
    }

    setActionLoading(true);
    const res = await deleteQuestionBatch(batchId);
    if (res.success) {
      alert('Đã xóa sạch bộ đề nháp.');
      router.push('/admin/questions/generate');
    } else {
      alert(`Từ chối thất bại: ${res.error}`);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-semibold">Đang tải chi tiết bộ câu hỏi nháp...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6" style={{ borderBottomColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/questions/generate" 
            className="p-2 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              {batch?.title}
            </h1>
            <p className="mt-1 text-xs md:text-sm font-medium text-slate-500 flex items-center gap-2">
              <span>Tài liệu nguồn: 📂 <strong>{batch?.document_name}</strong></span>
              <span>•</span>
              <span>Ngày tạo: {new Date(batch?.created_at).toLocaleString('vi-VN')}</span>
            </p>
          </div>
        </div>

        {/* Batch Operations Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRejectBatch}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Từ Chối Cả Bộ
          </button>
          
          <button
            onClick={handleApproveBatch}
            disabled={actionLoading || questions.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang duyệt...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Phê Duyệt {selectedIds.length}/{questions.length} Câu
              </>
            )}
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 card-el border p-8 space-y-3" style={{ borderColor: 'hsl(var(--border))' }}>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold">Không có câu hỏi nào</h3>
          <p className="text-sm text-slate-500">
            Không tìm thấy câu hỏi nháp nào trong đợt sinh này. Có thể bộ đề đã được phê duyệt từ trước.
          </p>
          <Link 
            href="/admin/questions/generate" 
            className="inline-block mt-4 py-2 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all"
          >
            Quay lại Dashboard AI
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Select all & Stats toolbar */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold text-slate-500" style={{ borderColor: 'hsl(var(--border))' }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === questions.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>CHỌN TẤT CẢ ({questions.length} CÂU HỎI)</span>
            </label>
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" /> Nhấp Duyệt ở đầu mỗi câu để chọn/bỏ chọn
            </span>
          </div>

          {/* List of draft questions */}
          <div className="space-y-6">
            {questions.map((q, index) => {
              const isSelected = selectedIds.includes(q.id);
              const isEditing = editingId === q.id;

              return (
                <div 
                  key={q.id}
                  className={`card-el border shadow-sm transition-all duration-300 overflow-hidden relative ${
                    isSelected 
                      ? 'border-indigo-200 dark:border-indigo-900/50' 
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderLeftWidth: '5px',
                    borderLeftColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                  }}
                >
                  
                  {/* Card Header Toolbar */}
                  <div className="px-4 py-3 flex items-center justify-between gap-4 border-b bg-slate-50/30 dark:bg-slate-900/10" style={{ borderBottomColor: 'hsl(var(--border))' }}>
                    <div className="flex items-center gap-3">
                      {/* Checkbox duyệt */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q.id)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        Câu {index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {q.question_type === 'MultipleChoice' ? 'Trắc nghiệm' : 
                         q.question_type === 'TrueFalse' ? 'Đúng/Sai tổ hợp' : 
                         q.question_type === 'FillIn' ? 'Điền khuyết' : 'Tự luận'}
                      </span>
                      
                      {isEditing ? (
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-transparent"
                        >
                          <option value="Easy">Dễ</option>
                          <option value="Medium">Trung bình</option>
                          <option value="Hard">Khó</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-950/20 text-green-600' :
                          q.difficulty === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-red-50 dark:bg-red-950/20 text-red-600'
                        }`}>
                          Độ khó: {q.difficulty === 'Easy' ? 'Dễ' : q.difficulty === 'Medium' ? 'Trung bình' : 'Khó'}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(q.id, q.question_type)}
                            disabled={saveLoadingId === q.id}
                            className="flex items-center gap-1 py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            {saveLoadingId === q.id ? (
                              <Loader2 className="w-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(q)}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Chỉnh sửa câu hỏi này"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Xóa câu hỏi khỏi bộ đề"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Content Display / Input */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">NỘI DUNG CÂU HỎI (HỖ TRỢ LATEX)</label>
                          <textarea
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500 font-mono"
                            style={{ borderColor: 'hsl(var(--border))' }}
                          />
                        </div>

                        {/* Edit Image URL & File Upload */}
                        {editImageUrl ? (
                          <div className="relative inline-block my-2 group">
                            <img
                              src={editImageUrl}
                              alt="Minh họa câu hỏi"
                              className="max-w-xs max-h-[180px] object-contain rounded border p-1 bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all shadow-md cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1">
                            <label className="text-[10px] font-bold text-slate-400 block">ẢNH MINH HỌA</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, q.id)}
                                disabled={uploadingImageId === q.id}
                                className="hidden"
                                id={`image-upload-${q.id}`}
                              />
                              <label
                                htmlFor={`image-upload-${q.id}`}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-500 cursor-pointer transition-all"
                              >
                                {uploadingImageId === q.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lên...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh tải lên
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                          <LatexRenderer text={q.content} />
                        </div>
                        {q.image_url && (
                          <div className="my-3">
                            <img
                              src={q.image_url}
                              alt="Hình minh họa"
                              className="max-w-md max-h-[250px] object-contain rounded border border-slate-200 dark:border-slate-800 bg-white p-1"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Options area based on question type */}
                    <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-3">
                      
                      {/* 1. MultipleChoice (Trắc nghiệm) */}
                      {q.question_type === 'MultipleChoice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map(key => {
                            const isCorrect = q.correct_answer === key;
                            
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                  isCorrect 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {key}
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={(editOptionsMC as any)[key]}
                                    onChange={(e) => setEditOptionsMC(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="flex-1 px-2 py-1 text-xs rounded border bg-transparent"
                                  />
                                ) : (
                                  <span className={`text-xs ${isCorrect ? 'font-bold text-emerald-600' : ''}`}>
                                    <LatexRenderer text={q.options?.[key] || ''} />
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {isEditing && (
                            <div className="sm:col-span-2 flex items-center gap-2.5 text-xs pt-2">
                              <span className="font-bold text-slate-400">ĐÁP ÁN ĐÚNG:</span>
                              <div className="flex gap-2">
                                {['A', 'B', 'C', 'D'].map(k => (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => setEditCorrectMC(k)}
                                    className={`w-7 h-7 rounded font-bold transition-all ${
                                      editCorrectMC === k
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                                    }`}
                                  >
                                    {k}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. TrueFalse (Đúng / Sai tổ hợp) */}
                      {q.question_type === 'TrueFalse' && (
                        <div className="space-y-3">
                          {['a', 'b', 'c', 'd'].map(key => {
                            let parsedCorrect: Record<string, string> = {};
                            try {
                              parsedCorrect = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer;
                            } catch (e) {}

                            const answerVal = parsedCorrect?.[key] || 'Đ';
                            
                            return (
                              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/30 dark:bg-slate-900/5 border" style={{ borderColor: 'hsl(var(--border))' }}>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="font-bold text-indigo-500 uppercase text-xs">({key})</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={(editOptionsTF as any)[key]}
                                      onChange={(e) => setEditOptionsTF(prev => ({ ...prev, [key]: e.target.value }))}
                                      className="flex-1 px-2 py-1 text-xs rounded border bg-transparent"
                                    />
                                  ) : (
                                    <span className="text-xs">
                                      <LatexRenderer text={q.options?.[key] || ''} />
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                                  {isEditing ? (
                                    <div className="flex gap-1 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => setEditCorrectTF(prev => ({ ...prev, [key]: 'Đ' }))}
                                        className={`px-2 py-0.5 rounded font-bold ${(editCorrectTF as any)[key] === 'Đ' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                                      >
                                        Đúng (Đ)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditCorrectTF(prev => ({ ...prev, [key]: 'S' }))}
                                        className={`px-2 py-0.5 rounded font-bold ${(editCorrectTF as any)[key] === 'S' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                                      >
                                        Sai (S)
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      answerVal === 'Đ' 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                                        : 'bg-red-50 dark:bg-red-950/20 text-red-600'
                                    }`}>
                                      {answerVal === 'Đ' ? '✓ Đúng (Đ)' : '✗ Sai (S)'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. FillIn (Điền đáp án) */}
                      {q.question_type === 'FillIn' && (
                        <div className="text-xs space-y-1.5">
                          <span className="font-bold text-slate-400">ĐÁP ÁN ĐÚNG CẦN ĐIỀN:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editCorrectFillIn}
                              onChange={(e) => setEditCorrectFillIn(e.target.value)}
                              className="w-full sm:max-w-xs px-2.5 py-1 rounded border bg-transparent"
                            />
                          ) : (
                            <div className="py-1.5 px-3 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600 inline-block">
                              {q.correct_answer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Essay (Tự luận / Trả lời ngắn) */}
                      {q.question_type === 'Essay' && (
                        <div className="text-xs space-y-1.5">
                          <span className="font-bold text-slate-400 block">HƯỚNG DẪN ĐÁP ÁN MẪU:</span>
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={editCorrectEssay}
                              onChange={(e) => setEditCorrectEssay(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                              style={{ borderColor: 'hsl(var(--border))' }}
                            />
                          ) : (
                            <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/10 leading-relaxed text-slate-600 dark:text-slate-400 italic">
                              <LatexRenderer text={q.correct_answer} />
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Explanation */}
                    <div className="pt-3 border-t text-xs space-y-1.5" style={{ borderTopColor: 'hsl(var(--border))' }}>
                      <span className="font-bold text-slate-400 block">💡 GIẢI THÍCH CHI TIẾT:</span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                          style={{ borderColor: 'hsl(var(--border))' }}
                        />
                      ) : q.explanation ? (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          <LatexRenderer text={q.explanation} />
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">Không có giải thích.</span>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
