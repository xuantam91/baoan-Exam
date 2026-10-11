'use client';

import { useState, useEffect } from 'react';
import { PrintTemplate, BUILTIN_PRINT_TEMPLATES } from '@/types/print-templates';
import { 
  getPrintTemplates, 
  createPrintTemplate, 
  updatePrintTemplate, 
  deletePrintTemplate, 
  setDefaultPrintTemplate 
} from '@/app/actions/print-templates';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Star, 
  Check, 
  Loader2, 
  Layout, 
  Settings2, 
  Eye, 
  Sparkles,
  Printer,
  FileCheck
} from 'lucide-react';

export default function PrintTemplatesManager() {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<PrintTemplate> | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');

  // Load templates on mount
  const loadTemplates = async () => {
    setLoading(true);
    const res = await getPrintTemplates();
    if (res.success && res.data) {
      setTemplates(res.data);
    } else {
      setTemplates(BUILTIN_PRINT_TEMPLATES);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSetDefault = async (id: string) => {
    setActionLoading(true);
    await setDefaultPrintTemplate(id);
    await loadTemplates();
    setActionLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (templates.length <= 1) {
      alert('Hệ thống phải có ít nhất 1 mẫu đề in.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu in "${name}"?`)) return;
    
    setActionLoading(true);
    const res = await deletePrintTemplate(id);
    if (res.success) {
      await loadTemplates();
    } else {
      alert(`Lỗi: ${res.error || 'Không thể xóa mẫu này'}`);
    }
    setActionLoading(false);
  };

  const handleDuplicate = async (tmpl: PrintTemplate) => {
    setActionLoading(true);
    const copyData: Partial<PrintTemplate> = {
      ...tmpl,
      name: `${tmpl.name} (Bản sao)`,
      is_default: false,
    };
    delete (copyData as any).id;
    delete (copyData as any).created_at;
    delete (copyData as any).updated_at;

    const res = await createPrintTemplate(copyData);
    if (res.success) {
      await loadTemplates();
    } else {
      alert(`Lỗi nhân bản: ${res.error}`);
    }
    setActionLoading(false);
  };

  const handleOpenEdit = (tmpl: PrintTemplate) => {
    setEditingTemplate({ ...tmpl });
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    // Default base template
    setEditingTemplate({
      name: 'Mẫu Đề Thi Mới',
      description: 'Mô tả mẫu đề thi',
      is_default: false,
      paper_size: 'A4',
      orientation: 'portrait',
      margin_top: 12.7,
      margin_bottom: 12.7,
      margin_left: 12.7,
      margin_right: 12.7,
      font_family: 'Times New Roman',
      font_size: '11pt',
      header_style: 'tqt_exam_only',
      school_name: 'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
      exam_title: 'ĐỀ KIỂM TRA HỌC KỲ I',
      show_student_box: false,
      student_box_style: 'dotted_lines',
      instruction_note: '(Đề thi gồm {total_questions} câu hỏi. Thí sinh làm bài trực tiếp vào đề)',
      footer_text: '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
      show_page_number: true,
      answer_table_style: 'tqt_matrix',
    });
    setModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name?.trim()) {
      alert('Vui lòng nhập tên mẫu in.');
      return;
    }

    setActionLoading(true);
    if (editingTemplate.id) {
      const res = await updatePrintTemplate(editingTemplate.id, editingTemplate);
      if (!res.success) alert(res.error || 'Lỗi khi cập nhật mẫu.');
    } else {
      const res = await createPrintTemplate(editingTemplate);
      if (!res.success) alert(res.error || 'Lỗi khi tạo mẫu mới.');
    }

    setModalOpen(false);
    setEditingTemplate(null);
    await loadTemplates();
    setActionLoading(false);
  };

  return (
    <div className="card-el p-6 shadow-sm space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Cấu Hình Mẫu In & Định Dạng Đề Thi (Print Templates)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tiêu đề, khổ giấy A4/A5, căn lề và định dạng khi in ấn hoặc xuất file Word (.doc/docx). Đã bao gồm mẫu chuẩn TQT.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mẫu In Mới</span>
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs">Đang tải danh sách mẫu in...</p>
        </div>
      ) : (
        /* Template Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((tmpl) => (
            <div 
              key={tmpl.id} 
              className={`rounded-2xl border p-5 transition-all relative flex flex-col justify-between ${
                tmpl.is_default 
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Badges & Title */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-800 dark:text-slate-100">{tmpl.name}</span>
                      {tmpl.is_default && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Mặc định
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Khổ {tmpl.paper_size}
                      </span>
                    </div>
                    {tmpl.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
                    )}
                  </div>
                </div>

                {/* Specs overview pills */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kiểu Header:</span>
                    <span className="font-medium">
                      {tmpl.header_style === 'tqt_exam_only' && 'Bảng 2 cột TQT (Đề thi)'}
                      {tmpl.header_style === 'tqt_with_student_info' && 'Bảng 2x2 TQT (Kèm Họ tên & SBD)'}
                      {tmpl.header_style === 'boxed_student_info' && 'Khung viền 4 ô (Bộ GD)'}
                      {tmpl.header_style === 'simple' && 'Tối giản'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Căn lề (Top/Bot/Left/Right):</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {tmpl.margin_top} / {tmpl.margin_bottom} / {tmpl.margin_left} / {tmpl.margin_right} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Font chữ & Cỡ chữ:</span>
                    <span>{tmpl.font_family} - {tmpl.font_size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tên trường áp dụng:</span>
                    <span className="truncate block font-medium" title={tmpl.school_name}>{tmpl.school_name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                {!tmpl.is_default ? (
                  <button
                    onClick={() => handleSetDefault(tmpl.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Đặt làm Mặc định</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đang dùng mặc định
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(tmpl)}
                    disabled={actionLoading}
                    title="Nhân bản mẫu này"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(tmpl)}
                    disabled={actionLoading}
                    title="Chỉnh sửa cấu hình"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>

                  {!tmpl.is_default && (
                    <button
                      onClick={() => handleDelete(tmpl.id, tmpl.name)}
                      disabled={actionLoading}
                      title="Xóa mẫu"
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Create / Edit Template with Live Preview ── */}
      {modalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  {editingTemplate.id ? 'Chỉnh Sửa Mẫu In Đề Thi' : 'Tạo Mẫu In Đề Thi Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tùy chỉnh thông số in ấn, khổ giấy, căn lề và định dạng hiển thị.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split Form & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
              
              {/* Left Column: Form Settings (7 cols) */}
              <form onSubmit={handleSaveTemplate} id="template-form" className="lg:col-span-7 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                {/* Template Name & Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                      Tên mẫu in *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Ví dụ: Mẫu Trường Trần Quốc Tuấn (Khổ A4)"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                      Mô tả ghi chú
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      placeholder="Ghi chú về mẫu in này..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Header Style Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kiểu Bố Cục Tiêu Đề (Header Style) *
                  </label>
                  <select
                    value={editingTemplate.header_style || 'tqt_exam_only'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, header_style: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="tqt_exam_only">Mẫu TQT 1: Bảng 2 cột cân đối (Không dòng thí sinh - TQT_template.docx)</option>
                    <option value="tqt_with_student_info">Mẫu TQT 2: Bảng 2x2 hàng (Kèm dòng Họ tên & SBD - TQT_Template_Sinh_hoc.docx)</option>
                    <option value="boxed_student_info">Mẫu Chuẩn Bộ GD&ĐT: Khung viền hình chữ nhật điền Họ tên, SBD, Lớp, Phòng thi</option>
                    <option value="simple">Tối giản (Chỉ tiêu đề đơn giản)</option>
                  </select>
                </div>

                {/* School Name & Exam Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                      Tên Trường / Đơn vị *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.school_name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, school_name: e.target.value })}
                      placeholder="TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                      Tên Kỳ Thi / Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.exam_title || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, exam_title: e.target.value })}
                      placeholder="KIỂM TRA HỌC KỲ I"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Paper Size, Orientation, Font */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Khổ giấy</label>
                      <select
                        value={editingTemplate.paper_size || 'A4'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, paper_size: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                      >
                        <option value="A4">A4 (210 x 297 mm)</option>
                        <option value="A5">A5 (148 x 210 mm)</option>
                        <option value="Letter">Letter (216 x 279 mm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Font Chữ</label>
                      <select
                        value={editingTemplate.font_family || 'Times New Roman'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, font_family: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      >
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Inter">Inter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Cỡ Chữ In</label>
                      <select
                        value={editingTemplate.font_size || '11pt'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, font_size: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      >
                        <option value="10pt">10pt (Nhỏ/Tiết kiệm)</option>
                        <option value="11pt">11pt (Tiêu chuẩn TQT)</option>
                        <option value="12pt">12pt (Rõ ràng)</option>
                        <option value="13pt">13pt (Lớn)</option>
                      </select>
                    </div>
                  </div>

                  {/* Margins */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase text-slate-500">
                        Căn Lề Trang In (Đơn vị: mm)
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingTemplate({
                          ...editingTemplate,
                          margin_top: 12.7,
                          margin_bottom: 12.7,
                          margin_left: 12.7,
                          margin_right: 12.7
                        })}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer font-medium"
                      >
                        Đặt lề hẹp TQT (12.7mm = 0.5 in)
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Lề trên (Top)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editingTemplate.margin_top ?? 12.7}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, margin_top: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Lề dưới (Bot)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editingTemplate.margin_bottom ?? 12.7}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, margin_bottom: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Lề trái (Left)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editingTemplate.margin_left ?? 12.7}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, margin_left: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Lề phải (Right)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editingTemplate.margin_right ?? 12.7}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, margin_right: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions & Footers */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                      Lời dặn thí sinh (Hiển thị đầu đề)
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.instruction_note || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, instruction_note: e.target.value })}
                      placeholder="(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp...)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Gợi ý: Dùng <code>{'{total_questions}'}</code> để hệ thống tự điền số câu hỏi của đề thi.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                      Chú thích chân trang (Footer)
                    </label>
                    <textarea
                      rows={2}
                      value={editingTemplate.footer_text || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
                      placeholder="------ HẾT ------&#10;Cán bộ coi thi không giải thích gì thêm."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Default checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_default_check"
                    checked={editingTemplate.is_default || false}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, is_default: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="is_default_check" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Đặt mẫu này làm mẫu in mặc định cho toàn hệ thống
                  </label>
                </div>
              </form>

              {/* Right Column: Live Visual Paper Preview (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Xem trước mô phỏng trang in
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 font-mono">
                      Khổ: {editingTemplate.paper_size} | Lề: {editingTemplate.margin_left}mm
                    </span>
                  </div>

                  {/* Simulated Paper */}
                  <div 
                    className="bg-white text-black rounded-lg shadow-xl p-5 mx-auto transition-all text-xs border border-slate-300"
                    style={{
                      fontFamily: editingTemplate.font_family || 'Times New Roman',
                      maxWidth: editingTemplate.paper_size === 'A5' ? '280px' : '100%',
                      paddingTop: `${Math.max(8, (editingTemplate.margin_top || 12.7) * 0.8)}px`,
                      paddingBottom: `${Math.max(8, (editingTemplate.margin_bottom || 12.7) * 0.8)}px`,
                      paddingLeft: `${Math.max(8, (editingTemplate.margin_left || 12.7) * 0.8)}px`,
                      paddingRight: `${Math.max(8, (editingTemplate.margin_right || 12.7) * 0.8)}px`,
                    }}
                  >
                    {/* Render Header Preview based on style */}
                    {editingTemplate.header_style === 'tqt_exam_only' && (
                      <div className="grid grid-cols-2 gap-2 border-b border-black pb-2 mb-3 text-center text-[10px]">
                        <div>
                          <p className="font-bold uppercase">{editingTemplate.school_name || 'TÊN TRƯỜNG'}</p>
                          <p className="font-bold">ĐỀ SỐ 901</p>
                          <p className="italic text-[8px]">(Đề thi có 03 trang)</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase">{editingTemplate.exam_title || 'KỲ THI'}</p>
                          <p className="font-semibold">Môn: Sinh Học 10</p>
                          <p className="italic text-[8px]">Thời gian làm bài: 45 phút</p>
                        </div>
                      </div>
                    )}

                    {editingTemplate.header_style === 'tqt_with_student_info' && (
                      <div className="border border-black mb-3 text-[9px]">
                        <div className="grid grid-cols-2 border-b border-black p-1 text-center">
                          <div>
                            <p className="font-bold uppercase">{editingTemplate.school_name || 'TÊN TRƯỜNG'}</p>
                            <p className="font-bold">MÃ ĐỀ THI: 101</p>
                          </div>
                          <div>
                            <p className="font-bold uppercase">{editingTemplate.exam_title || 'KỲ THI'}</p>
                            <p className="font-semibold">Môn thi: Sinh Học 10</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 p-1 text-left">
                          <div>
                            <p>Họ tên thí sinh: .......................</p>
                            <p>Số báo danh: .............................</p>
                          </div>
                          <div className="text-center">
                            <p>Thời gian làm bài: 45 phút</p>
                            <p className="italic text-[8px]">(Không kể thời gian phát đề)</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {editingTemplate.header_style === 'boxed_student_info' && (
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-2 gap-1 border-b border-black pb-1 text-center text-[9px] uppercase">
                          <div>
                            <p className="font-bold">{editingTemplate.school_name || 'TÊN TRƯỜNG'}</p>
                            <p className="font-semibold">MÃ ĐỀ THI: 101</p>
                          </div>
                          <div>
                            <p className="font-bold">{editingTemplate.exam_title || 'KỲ THI'}</p>
                            <p className="font-semibold">MÔN THI: SINH HỌC</p>
                          </div>
                        </div>
                        <div className="border border-black p-1.5 rounded text-[8px] grid grid-cols-3 gap-1">
                          <div className="col-span-2">Họ tên: .......................................</div>
                          <div>Lớp: .............</div>
                          <div className="col-span-2">Số báo danh: .............................</div>
                          <div>Phòng thi: ...</div>
                        </div>
                      </div>
                    )}

                    {editingTemplate.header_style === 'simple' && (
                      <div className="text-center border-b border-black pb-2 mb-3 uppercase text-[10px]">
                        <p className="font-bold">{editingTemplate.school_name}</p>
                        <p className="font-extrabold">{editingTemplate.exam_title}</p>
                        <p className="text-[9px]">MÃ ĐỀ: 101 - THỜI GIAN: 45 PHÚT</p>
                      </div>
                    )}

                    {/* Instruction note preview */}
                    <p className="italic text-[8px] text-center mb-3 text-slate-600">
                      {(editingTemplate.instruction_note || '').replace('{total_questions}', '20')}
                    </p>

                    {/* Sample Question Mock */}
                    <div className="space-y-2 text-[9px] border-t border-dashed border-slate-200 pt-2">
                      <p className="font-bold uppercase text-[8px]">PHẦN I. Câu trắc nghiệm nhiều lựa chọn</p>
                      <p><strong>Câu 1:</strong> Thấu kính hội tụ là loại thấu kính có đặc điểm nào sau đây?</p>
                      <div className="grid grid-cols-2 gap-1 text-[8px] pl-2 text-slate-700">
                        <span>A. phần rìa mỏng hơn.</span>
                        <span>B. phần rìa dày hơn.</span>
                        <span>C. phần rìa và giữa bằng nhau.</span>
                        <span>D. hình dạng bất kì.</span>
                      </div>
                    </div>

                    {/* Footer Mock */}
                    <div className="mt-4 pt-2 border-t border-black text-center text-[8px] text-slate-500 whitespace-pre-line">
                      {editingTemplate.footer_text || '------ HẾT ------'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[11px] text-slate-400">
                    Bản in thực tế và file Word (.doc) sẽ tự động khớp hoàn toàn theo thiết kế này.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                form="template-form"
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Mẫu In</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
