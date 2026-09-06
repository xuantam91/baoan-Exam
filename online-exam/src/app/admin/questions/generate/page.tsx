'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSubjects, getChapters, getLessons, getSystemSettings, updateSystemSettings, getGrades } from '@/app/actions/metadata';
import { createQuestionBatch, getQuestionBatches, deleteQuestionBatch, verifyGeminiKey } from '@/app/actions/question_batches';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Compass, 
  HelpCircle, 
  FileText, 
  Key, 
  Play, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FolderOpen,
  ArrowLeft,
  X
} from 'lucide-react';

export default function GenerateQuestionsPage() {
  const router = useRouter();

  // Metadata states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [gradesList, setGradesList] = useState<string[]>(['10', '11', '12']);
  
  // Selection states
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState('all');

  // Input states
  const [batchTitle, setBatchTitle] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [targetCount, setTargetCount] = useState(10);
  const [geminiKey, setGeminiKey] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; base64: string }[]>([]);

  // Loading/Operation states
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // History states
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Key verification states
  const [keyStatus, setKeyStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saveKeySuccess, setSaveKeySuccess] = useState('');

  // Live key checker using Server Action (avoiding CORS issues)
  async function verifyKey(keyToTest: string) {
    if (!keyToTest) {
      setKeyStatus('unchecked');
      return;
    }
    setIsValidatingKey(true);
    try {
      const res = await verifyGeminiKey(keyToTest);
      if (res.success) {
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
      }
    } catch (e) {
      setKeyStatus('invalid');
    } finally {
      setIsValidatingKey(false);
    }
  }

  // Save key to Server-wide configurations (supabase system_settings)
  async function handleSaveKeyToServer() {
    if (!geminiKey) {
      alert('Vui lòng nhập API Key trước khi lưu.');
      return;
    }
    setSaveKeySuccess('');
    setIsValidatingKey(true);
    
    // 1. Kiểm tra key live qua Server Action
    let isValid = false;
    try {
      const res = await verifyGeminiKey(geminiKey);
      if (res.success) {
        isValid = true;
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
      }
    } catch (e) {
      setKeyStatus('invalid');
    }
    
    if (!isValid) {
      alert('Không thể lưu vì API Key này không hoạt động (lỗi kết nối hoặc Key không hợp lệ).');
      setIsValidatingKey(false);
      return;
    }

    // 2. Lưu lên Server
    const res = await updateSystemSettings('gemini_api_key', { apiKey: geminiKey });
    setIsValidatingKey(false);

    if (res.success) {
      setSaveKeySuccess('Đã lưu cấu hình Key thành công lên Server!');
      localStorage.setItem('gemini_api_key', geminiKey);
      setTimeout(() => setSaveKeySuccess(''), 4000);
    } else {
      alert(`Lưu cấu hình thất bại: ${res.error}`);
    }
  }

  // Load API Key from localStorage or Supabase system_settings
  useEffect(() => {
    async function loadKey() {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setGeminiKey(savedKey);
        verifyKey(savedKey);
      } else {
        const res = await getSystemSettings('gemini_api_key');
        if (res.success && res.data && res.data.apiKey) {
          setGeminiKey(res.data.apiKey);
          verifyKey(res.data.apiKey);
        }
      }
    }
    loadKey();
  }, []);

  // Fetch subjects & batches initially
  useEffect(() => {
    async function init() {
      setLoadingMetadata(true);
      const subRes = await getSubjects();
      if (subRes.success && subRes.data) {
        setSubjects(subRes.data);
      }
      const gradeRes = await getGrades();
      if (gradeRes.success && gradeRes.data) {
        setGradesList(gradeRes.data);
      }
      setLoadingMetadata(false);

      await loadBatches();
    }
    init();
  }, []);

  // Poll active batches status every 4 seconds to show generation progress
  useEffect(() => {
    const activeInterval = setInterval(async () => {
      const hasActive = batches.some(b => b.status === 'processing');
      if (hasActive) {
        await loadBatches();
      }
    }, 4000);

    return () => clearInterval(activeInterval);
  }, [batches]);

  async function loadBatches() {
    setLoadingBatches(true);
    const res = await getQuestionBatches();
    if (res.success && res.data) {
      setBatches(res.data);
    }
    setLoadingBatches(false);
  }

  // Load chapters when subject/grade changes
  useEffect(() => {
    async function loadChaptersData() {
      if (selectedSubject && selectedGrade) {
        const res = await getChapters(selectedSubject, selectedGrade);
        if (res.success && res.data) {
          setChapters(res.data);
        } else {
          setChapters([]);
        }
      } else {
        setChapters([]);
      }
      setSelectedChapter('all');
      setSelectedLesson('all');
      setLessons([]);
    }
    loadChaptersData();
  }, [selectedSubject, selectedGrade]);

  // Load lessons when chapter changes
  useEffect(() => {
    async function loadLessonsData() {
      if (selectedChapter && selectedChapter !== 'all') {
        const res = await getLessons(selectedChapter);
        if (res.success && res.data) {
          setLessons(res.data);
        } else {
          setLessons([]);
        }
      } else {
        setLessons([]);
      }
      setSelectedLesson('all');
    }
    loadLessonsData();
  }, [selectedChapter]);

  // Save key to localStorage when changed
  function handleKeyChange(val: string) {
    setGeminiKey(val);
    if (val) {
      localStorage.setItem('gemini_api_key', val);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }

  // Handle multiple files upload (reads txt, pdf, docx, pptx, xlsx, images to base64)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileList = Array.from(selectedFiles);
    
    // Automatically set batch title from the first file name if not already set
    if (!batchTitle && fileList.length > 0) {
      const firstFile = fileList[0];
      const cleanName = firstFile.name.substring(0, firstFile.name.lastIndexOf('.')) || firstFile.name;
      setBatchTitle(`AI Sinh: ${cleanName}${fileList.length > 1 ? ` +${fileList.length - 1} file` : ''}`);
    }

    const processedFiles: { name: string; type: string; base64: string }[] = [];

    for (const file of fileList) {
      const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
      const isPdf = file.type === 'application/pdf';
      const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
      const isPpt = file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');
      const isImage = file.type.startsWith('image/');

      if (isText || isPdf || isWord || isPpt || isExcel || isImage) {
        try {
          const fileData = await new Promise<{ name: string; type: string; base64: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const base64 = dataUrl.split(',')[1];
              resolve({
                name: file.name,
                type: file.type || getMimeTypeFromExtension(file.name),
                base64
              });
            };
            reader.onerror = () => reject(new Error(`Lỗi đọc file ${file.name}`));
            reader.readAsDataURL(file);
          });

          processedFiles.push(fileData);
        } catch (err: any) {
          console.error(err);
          alert(err.message || 'Lỗi đọc tệp.');
        }
      } else {
        alert(`Không hỗ trợ định dạng của tệp "${file.name}". Hệ thống hỗ trợ .txt, .pdf, .docx, .pptx, .xlsx và hình ảnh.`);
      }
    }

    if (processedFiles.length > 0) {
      setUploadedFiles(prev => {
        const filteredPrev = prev.filter(p => !processedFiles.some(f => f.name === p.name));
        return [...filteredPrev, ...processedFiles];
      });
    }

    // Reset input value to allow uploading same file again if deleted
    e.target.value = '';
  }

  function getMimeTypeFromExtension(fileName: string): string {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === '.pdf') return 'application/pdf';
    if (ext === '.txt') return 'text/plain';
    return 'application/octet-stream';
  }

  function removeUploadedFile(name: string) {
    setUploadedFiles(prev => prev.filter(f => f.name !== name));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSubject || !selectedGrade || !batchTitle || (!documentText && uploadedFiles.length === 0)) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (Môn học, Khối, Tiêu đề và Tài liệu nhập tay hoặc Tệp tin tải lên).');
      return;
    }

    setGenerating(true);

    try {
      const docSummary = uploadedFiles.length > 0
        ? uploadedFiles.map(f => f.name).join(', ')
        : 'Văn bản dán trực tiếp';

      // 1. Tạo bản ghi Batch trong Database với trạng thái 'processing'
      const batchRes = await createQuestionBatch(
        batchTitle,
        docSummary.length > 250 ? docSummary.substring(0, 250) + '...' : docSummary,
        targetCount,
        selectedSubject,
        selectedGrade
      );

      if (!batchRes.success || !batchRes.data) {
        throw new Error(batchRes.error || 'Lỗi khởi tạo đợt sinh câu hỏi trên máy chủ.');
      }

      const batch = batchRes.data;

      // Cập nhật ngay danh sách local để hiển thị trạng thái đang chạy
      setBatches(prev => [batch, ...prev]);

      // 2. Kích hoạt gọi API sinh câu hỏi bất đồng bộ sang API Route
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          subjectId: selectedSubject,
          grade: selectedGrade,
          chapterId: selectedChapter,
          lessonId: selectedLesson,
          documentText: documentText,
          files: uploadedFiles,
          targetCount,
          geminiKey
        })
      });

      // Không chặn kết quả quá lâu, nếu API route phản hồi thành công/thất bại hoặc ngắt kết nối
      const resData = await response.json().catch(() => ({}));
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Lỗi xảy ra trong quá trình gọi AI sinh đề.');
      }

      setSuccessMsg('Đã kích hoạt tạo đề thành công! Vui lòng theo dõi trạng thái tiến trình ở danh sách bên dưới.');
      
      // Reset form
      setBatchTitle('');
      setDocumentText('');
      setUploadedFiles([]);

      // Reload list
      await loadBatches();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi không xác định khi sinh câu hỏi.');
      await loadBatches();
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteBatch(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa lượt tạo này và toàn bộ câu hỏi nháp của nó? Hành động này không thể hoàn tác.')) {
      return;
    }
    const res = await deleteQuestionBatch(id);
    if (res.success) {
      setBatches(prev => prev.filter(b => b.id !== id));
    } else {
      alert(`Xóa thất bại: ${res.error}`);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/questions" 
          className="p-2 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" /> Tạo Câu Hỏi AI
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Sử dụng trí tuệ nhân tạo Gemini để tự động sinh hàng loạt câu hỏi trắc nghiệm & tự luận từ tài liệu giảng dạy.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 flex items-start gap-3">
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Đã xảy ra lỗi</h4>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-green-200/50 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Thực hiện thành công</h4>
            <p className="text-xs mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── FORM CẤU HÌNH SINH ĐỀ (Cột Trái - 2 phần 3) ─────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleGenerate} className="card-el p-6 space-y-6 shadow-sm border" style={{ borderColor: 'hsl(var(--border))' }}>
            <h3 className="font-bold text-lg border-b pb-3 flex items-center gap-2" style={{ borderBottomColor: 'hsl(var(--border))' }}>
              <Layers className="w-5 h-5 text-indigo-500" /> 1. Cấu hình phân loại & Số lượng
            </h3>

            {loadingMetadata ? (
              <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải cấu hình môn học...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chọn môn học */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> MÔN HỌC <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <option value="" disabled>-- Chọn môn học --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Chọn khối lớp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> KHỐI LỚP <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <option value="" disabled>-- Chọn khối lớp --</option>
                    {gradesList.map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>

                {/* Chọn chương học */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> CHƯƠNG HỌC
                  </label>
                  <select
                    value={selectedChapter}
                    disabled={!selectedSubject || !selectedGrade}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <option value="all">Tất cả chương học</option>
                    {chapters.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Chọn bài học */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> BÀI HỌC
                  </label>
                  <select
                    value={selectedLesson}
                    disabled={selectedChapter === 'all'}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <option value="all">Tất cả bài học</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                {/* Tiêu đề Batch câu hỏi */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> TIÊU ĐỀ LƯỢT TẠO / BỘ ĐỀ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đề sinh học chương 4 lớp 12 - Lượt tạo 1"
                    value={batchTitle}
                    onChange={(e) => setBatchTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                </div>

                {/* Số lượng câu hỏi muốn sinh */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> SỐ CÂU HỎI CẦN SINH
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  />
                </div>

                {/* Tài liệu tải lên */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> TẢI TIỆN ÍCH / TỆP TIN (Chọn nhiều)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.pdf,.docx,.pptx,.xlsx,image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Danh sách tệp tin đã tải lên */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 border-t pt-4" style={{ borderColor: 'hsl(var(--border))' }}>
                <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  📎 DANH SÁCH TỆP TIN ĐÃ CHỌN ({uploadedFiles.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadedFiles.map(file => (
                    <div 
                      key={file.name} 
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-slate-50/50 dark:bg-slate-900/10"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <span className="truncate flex items-center gap-1.5 max-w-[85%] font-medium" title={file.name}>
                        📝 {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(file.name)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-bold text-lg border-b pb-3 pt-2 flex items-center gap-2" style={{ borderBottomColor: 'hsl(var(--border))' }}>
              <FileText className="w-5 h-5 text-indigo-500" /> 2. Nhập tài liệu văn bản tham khảo <span className="text-red-500">*</span>
            </h3>

            <div className="space-y-1.5">
              <textarea
                required={uploadedFiles.length === 0}
                rows={8}
                placeholder={uploadedFiles.length > 0 ? `Đã tải lên ${uploadedFiles.length} tệp tin. Bạn có thể nhập thêm ghi chú văn bản hoặc hướng dẫn sinh đề cụ thể tại đây...` : "Dán nội dung giáo trình, tóm tắt bài học hoặc nội dung đề cương vào đây để AI làm căn cứ biên soạn câu hỏi..."}
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm focus:ring-1 focus:ring-indigo-500 font-mono"
                style={{ borderColor: 'hsl(var(--border))' }}
              />
              <span className="text-[10px] text-slate-400 font-medium block">
                Khuyến nghị: Bạn có thể chọn nhiều tệp cùng lúc (PDF, Word, PowerPoint, Excel, TXT, Hình ảnh). Trình biên soạn sẽ phân tích và trích xuất văn bản tự động để tổng hợp làm tài liệu nguồn sinh đề.
              </span>
            </div>

            <button
              type="submit"
              disabled={generating || loadingMetadata}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang gửi yêu cầu sinh đề AI ngầm...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Bắt đầu tạo câu hỏi AI
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── CẤU HÌNH API KEY & TRẠNG THÁI (Cột Phải - 1 phần 3) ───────────────── */}
        <div className="space-y-6">
          {/* Cấu hình Gemini Key */}
          <div className="card-el p-6 space-y-4 shadow-sm border" style={{ borderColor: 'hsl(var(--border))' }}>
            <h3 className="font-bold text-md flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-500" /> Cấu hình Gemini API
              </span>
              <button 
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 font-black cursor-pointer"
                title="Hướng dẫn lấy key"
              >
                ?
              </button>
            </h3>

            {/* Help instructions (Expandable) */}
            {showHelp && (
              <div className="p-3 rounded-lg border text-xs bg-purple-50/30 border-purple-200/50 space-y-2 dark:bg-purple-950/10">
                <h4 className="font-bold text-purple-700 dark:text-purple-400">Cách lấy Gemini API Key:</h4>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-bold">Google AI Studio</a></li>
                  <li>Đăng nhập bằng tài khoản Google của bạn.</li>
                  <li>Click vào nút <strong>"Create API Key"</strong>.</li>
                  <li>Sao chép mã Key và dán vào ô bên dưới.</li>
                </ol>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              Mặc định hệ thống sử dụng Key trên server. Bạn có thể thay đổi và lưu Key này dùng lâu dài:
            </p>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setKeyStatus('unchecked');
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-lg border bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
                  style={{ borderColor: 'hsl(var(--border))' }}
                />
                
                {/* Tick xanh hoặc warning báo trạng thái Key */}
                {geminiKey && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                    {isValidatingKey ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : keyStatus === 'valid' ? (
                      <span className="text-emerald-500 font-bold text-xs" title="Key đang hoạt động tốt! ✓">✓</span>
                    ) : keyStatus === 'invalid' ? (
                      <span className="text-red-500 font-bold text-xs" title="Key không hợp lệ hoặc lỗi kết nối ✗">✗</span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Status messages */}
              {geminiKey && keyStatus === 'valid' && (
                <span className="text-[10px] text-green-600 font-semibold block">
                  ✓ Key đang hoạt động tốt và kết nối thành công.
                </span>
              )}
              {geminiKey && keyStatus === 'invalid' && (
                <span className="text-[10px] text-red-500 font-semibold block">
                  ⚠️ Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.
                </span>
              )}
              {saveKeySuccess && (
                <span className="text-[10px] text-green-600 font-semibold block">
                  {saveKeySuccess}
                </span>
              )}

              {/* Buttons to test & save */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isValidatingKey || !geminiKey}
                  onClick={() => verifyKey(geminiKey)}
                  className="flex-1 py-1.5 px-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  {isValidatingKey ? 'Đang kiểm...' : 'Kiểm tra Key'}
                </button>
                <button
                  type="button"
                  disabled={isValidatingKey || !geminiKey}
                  onClick={handleSaveKeyToServer}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50"
                >
                  Lưu lên Server
                </button>
              </div>
            </div>
          </div>

          {/* Lịch sử các đợt sinh câu hỏi */}
          <div className="card-el p-6 space-y-4 shadow-sm border" style={{ borderColor: 'hsl(var(--border))' }}>
            <h3 className="font-bold text-md flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-500" /> Lịch sử lượt tạo AI
            </h3>

            {loadingBatches && batches.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu...
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Chưa có lượt tạo AI nào được thực hiện.
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {batches.map(b => {
                  let statusBadge = null;
                  
                  if (b.status === 'processing') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200/50">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Đang sinh...
                      </span>
                    );
                  } else if (b.status === 'pending') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-200/50">
                        Chờ duyệt ({b.total_questions} câu)
                      </span>
                    );
                  } else if (b.status === 'approved') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-950/20 text-green-600 border border-green-200/50">
                        Đã duyệt ({b.total_questions} câu)
                      </span>
                    );
                  } else if (b.status === 'failed') {
                    statusBadge = (
                      <span 
                        title={b.error_message || 'Lỗi không xác định'}
                        className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200/50 cursor-help"
                      >
                        <XCircle className="w-2.5 h-2.5" /> Lỗi tạo đề
                      </span>
                    );
                  }

                  return (
                    <div 
                      key={b.id} 
                      className="p-3 rounded-lg border flex flex-col gap-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold truncate max-w-[170px]" title={b.title}>
                          {b.title}
                        </span>
                        {statusBadge}
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{new Date(b.created_at).toLocaleString('vi-VN')}</span>
                        {b.document_name && (
                          <span className="max-w-[100px] truncate" title={b.document_name}>
                            📂 {b.document_name}
                          </span>
                        )}
                      </div>

                      {/* Error message preview if failed */}
                      {b.status === 'failed' && b.error_message && (
                        <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/10 p-1.5 rounded border border-red-100 dark:border-red-950/30 font-medium">
                          ⚠️ {b.error_message.length > 80 ? `${b.error_message.substring(0, 80)}...` : b.error_message}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 border-t pt-2 mt-1" style={{ borderTopColor: 'hsl(var(--border))' }}>
                        {b.status === 'pending' && (
                          <Link
                            href={`/admin/questions/approve/${b.id}`}
                            className="py-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all"
                          >
                            Duyệt Ngay
                          </Link>
                        )}
                        {b.status === 'approved' && (
                          <Link
                            href={`/admin/questions/approve/${b.id}`}
                            className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] transition-all"
                          >
                            Xem Bộ Câu Hỏi
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
