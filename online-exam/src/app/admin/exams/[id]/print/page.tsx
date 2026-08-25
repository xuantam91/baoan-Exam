'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getSubmissionDetails } from '@/app/actions/submissions'; // retrieves exam + questions sorted
import { LatexRenderer } from '@/components/LatexRenderer';
import { Loader2, Printer, ArrowLeft, Download, FileText } from 'lucide-react';

export default function ExamPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const printType = searchParams.get('type') || 'questions'; // 'questions' | 'sheet' | 'key'

  const [exam, setExam] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExportWord = () => {
    // 1. Prepare HTML Content with DOM manipulation to convert CSS grids to HTML Tables for MS Word
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = document.getElementById('printable-content')?.innerHTML || '';

    // Transform Header: grid grid-cols-2 -> Table
    const headers = tempDiv.querySelectorAll('.grid-cols-2.border-b-2');
    headers.forEach(header => {
      const children = Array.from(header.children);
      if (children.length === 2) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px;');
        const tr = document.createElement('tr');
        
        children.forEach(child => {
          const td = document.createElement('td');
          td.setAttribute('style', 'width: 50%; border: none; text-align: center; vertical-align: top; font-family: Arial, sans-serif; font-size: 10pt;');
          td.innerHTML = child.innerHTML;
          tr.appendChild(td);
        });
        
        table.appendChild(tr);
        header.replaceWith(table);
      }
    });

    // Transform Student Info Box (Questions view): border-black.grid-cols-3 -> Table
    const infoBoxes = tempDiv.querySelectorAll('.grid-cols-3.border-black, .border-black.grid-cols-3');
    infoBoxes.forEach(box => {
      const children = Array.from(box.children);
      if (children.length >= 4) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 10pt;');
        
        const tr1 = document.createElement('tr');
        const td1_1 = document.createElement('td');
        td1_1.setAttribute('style', 'width: 66%; border: none; text-align: left; padding: 6px;');
        td1_1.innerHTML = children[0].innerHTML;
        const td1_2 = document.createElement('td');
        td1_2.setAttribute('style', 'width: 33%; border: none; text-align: left; padding: 6px;');
        td1_2.innerHTML = children[1].innerHTML;
        tr1.appendChild(td1_1);
        tr1.appendChild(td1_2);
        table.appendChild(tr1);

        const tr2 = document.createElement('tr');
        const td2_1 = document.createElement('td');
        td2_1.setAttribute('style', 'width: 66%; border: none; text-align: left; padding: 6px;');
        td2_1.innerHTML = children[2].innerHTML;
        const td2_2 = document.createElement('td');
        td2_2.setAttribute('style', 'width: 33%; border: none; text-align: left; padding: 6px;');
        td2_2.innerHTML = children[3].innerHTML;
        tr2.appendChild(td2_1);
        tr2.appendChild(td2_2);
        table.appendChild(tr2);

        box.replaceWith(table);
      }
    });

    // Transform Student Info Box (Sheet/Key view): grid-cols-2.border-black -> Table
    const sheetInfoBoxes = tempDiv.querySelectorAll('.grid-cols-2.border-black, .border-black.grid-cols-2');
    sheetInfoBoxes.forEach(box => {
      const children = Array.from(box.children);
      if (children.length === 2) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 10pt;');
        const tr = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.setAttribute('style', 'width: 50%; border: none; padding: 10px; vertical-align: top; text-align: left;');
        td1.innerHTML = children[0].innerHTML;
        
        const td2 = document.createElement('td');
        td2.setAttribute('style', 'width: 50%; border: none; border-left: 1px solid black; padding: 10px; vertical-align: top; text-align: left;');
        td2.innerHTML = children[1].innerHTML;
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
        box.replaceWith(table);
      }
    });

    // Transform SBD & Code Area (Sheet/Key view): grid-cols-3 with col-span-2 -> Table
    const bubbleAreas = tempDiv.querySelectorAll('.grid-cols-3.border-t');
    bubbleAreas.forEach(area => {
      const children = Array.from(area.children);
      if (children.length === 2) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: none; margin-top: 15px;');
        const tr = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.setAttribute('style', 'width: 66%; border: 1px solid black; padding: 10px; vertical-align: top;');
        td1.innerHTML = children[0].innerHTML;
        
        const td2 = document.createElement('td');
        td2.setAttribute('style', 'width: 33%; border: 1px solid black; padding: 10px; vertical-align: middle; text-align: center;');
        td2.innerHTML = children[1].innerHTML;
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
        area.replaceWith(table);
      }
    });

    // Transform SBD & Mã Đề columns inner container: flex gap-8 justify-around
    const innerBubbleCols = tempDiv.querySelectorAll('.flex.gap-8.justify-around');
    innerBubbleCols.forEach(container => {
      const children = Array.from(container.children);
      if (children.length === 2) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: none;');
        const tr = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.setAttribute('style', 'width: 60%; border: none; padding: 5px; vertical-align: top;');
        td1.innerHTML = children[0].innerHTML;
        
        const td2 = document.createElement('td');
        td2.setAttribute('style', 'width: 40%; border: none; padding: 5px; vertical-align: top;');
        td2.innerHTML = children[1].innerHTML;
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
        container.replaceWith(table);
      }
    });

    // Transform SBD / Code individual columns (horizontal bubbles representation)
    const bubbleCols = tempDiv.querySelectorAll('.flex.gap-1');
    bubbleCols.forEach(col => {
      const children = Array.from(col.children);
      if (children.length > 0) {
        const table = document.createElement('table');
        table.setAttribute('style', 'border-collapse: collapse; border: none; margin: 0 auto;');
        const tr = document.createElement('tr');
        
        children.forEach(child => {
          const td = document.createElement('td');
          td.setAttribute('style', 'border: none; padding: 2px; vertical-align: top;');
          td.innerHTML = child.innerHTML;
          tr.appendChild(td);
        });
        
        table.appendChild(tr);
        col.replaceWith(table);
      }
    });

    // Transform Multiple Choice Options
    const mcGrids = tempDiv.querySelectorAll('.pl-6.grid-cols-4, .pl-6.grid-cols-1');
    mcGrids.forEach(grid => {
      const children = Array.from(grid.children);
      if (children.length > 0) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: none; margin-left: 20px; margin-top: 5px; margin-bottom: 5px;');
        const tr = document.createElement('tr');
        
        children.forEach(child => {
          const td = document.createElement('td');
          td.setAttribute('style', 'border: none; padding: 4px; vertical-align: top; text-align: left; font-family: Arial, sans-serif; font-size: 10pt;');
          td.innerHTML = child.innerHTML;
          tr.appendChild(td);
        });
        
        table.appendChild(tr);
        grid.replaceWith(table);
      }
    });

    // Transform Sheet Answer Bubbles Grid
    const answerGrids = tempDiv.querySelectorAll('.grid-cols-2.sm\\:grid-cols-3');
    answerGrids.forEach(grid => {
      const children = Array.from(grid.children);
      if (children.length > 0) {
        const table = document.createElement('table');
        table.setAttribute('style', 'width: 100%; border-collapse: collapse; border: none; margin-top: 10px;');
        
        const colsCount = 3;
        for (let i = 0; i < children.length; i += colsCount) {
          const tr = document.createElement('tr');
          for (let j = 0; j < colsCount; j++) {
            const td = document.createElement('td');
            td.setAttribute('style', 'width: 33%; border: none; border-bottom: 1px solid #f1f5f9; padding: 6px; vertical-align: middle; text-align: left; font-family: sans-serif; font-size: 10pt;');
            const item = children[i + j];
            if (item) {
              td.innerHTML = item.innerHTML;
            }
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
        grid.replaceWith(table);
      }
    });

    const content = tempDiv.innerHTML;
    const style = `
      <style>
        @page Section1 {
          size: 8.27in 11.69in; /* A4 size */
          margin: 0.79in 0.79in 0.79in 0.79in; /* A4 2cm margins */
          mso-header-margin: .5in;
          mso-footer-margin: .5in;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body { 
          font-family: 'Times New Roman', serif; 
          font-size: 12pt; 
          line-height: 1.5; 
          color: black; 
        }
        h2, h3, h4, h5 { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          margin-top: 10px; 
          margin-bottom: 5px; 
        }
        .text-center, p.text-center { 
          text-align: center !important; 
        }
        .font-bold { 
          font-weight: bold; 
        }
        .italic { 
          font-style: italic; 
        }
        .border { 
          border: 1px solid black; 
        }
        .p-4 { 
          padding: 15px; 
        }
        .rounded { 
          border-radius: 4px; 
        }
        .space-y-6 > * { 
          margin-bottom: 20px; 
        }
        .space-y-3 > * { 
          margin-bottom: 10px; 
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-top: 10px; 
          margin-bottom: 10px; 
        }
        th, td { 
          border: 1px solid black; 
          padding: 6px; 
          text-align: center; 
        }
        .no-print { 
          display: none !important; 
        }
      </style>
    `;
    const fullHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${exam?.title || 'De_Thi'}</title>
          ${style}
        </head>
        <body>
          <div class="Section1">
            ${content}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + fullHtml], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam?.title || 'De_Thi'}_${printType}.doc`;
    a.click();
  };

  useEffect(() => {
    async function loadExamData() {
      setLoading(true);
      // We can use getSubmissionDetails (by mocking the submission details or rather, let's just query the database directly for exam and questions!)
      // Wait, let's use supabase client directly to get exam and questions
      try {
        const { supabase } = await import('@/lib/supabase');
        
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*, subjects(name), classes(name)')
          .eq('id', examId)
          .single();

        if (examError) throw examError;
        setExam(examData);

        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .in('id', examData.question_ids);

        if (qError) throw qError;

        // Sort questions in original order
        const sorted = examData.question_ids.map((id: string) => 
          qData.find((q: any) => q.id === id)
        ).filter(Boolean);

        setQuestions(sorted);
      } catch (e) {
        console.error('Error loading print exam details:', e);
      }
      setLoading(false);
    }
    
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  // Trigger print dialog or auto-download once loaded
  useEffect(() => {
    if (!loading && exam && questions.length > 0) {
      const autoDownload = searchParams.get('autodownload');
      if (autoDownload === 'word') {
        const timer = setTimeout(() => {
          handleExportWord();
          // Close window after downloading
          window.close();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, exam, questions, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-2 text-indigo-600" />
        <p className="text-sm">Đang tải và chuẩn bị đề thi in ấn...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <p className="text-lg font-bold text-rose-500">Không tìm thấy đề thi này!</p>
        <button 
          onClick={() => window.close()} 
          className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm cursor-pointer"
        >
          Đóng tab
        </button>
      </div>
    );
  }

  const renderAnswerSheet = () => {
    return (
      <div className="space-y-6 font-sans text-black">
        {/* Header Title */}
        <div className="text-center space-y-2 uppercase">
          <h2 className="text-xl font-bold">PHIẾU TRẢ LỜI TRẮC NGHIỆM</h2>
          <h3 className="text-sm font-semibold">MÔN THI: {exam.subjects?.name} - KHỐI {exam.grade}</h3>
          <p className="text-xs italic lowercase">(Thí sinh dùng bút chì tô kín vào ô câu trả lời lựa chọn)</p>
        </div>

        {/* Student Info Box */}
        <div className="grid grid-cols-2 gap-4 border border-black p-4 rounded text-sm">
          <div className="space-y-3">
            <p>Họ và tên thí sinh: .....................................................................</p>
            <p>Ngày sinh: .................................................................................</p>
            <p>Lớp: ........................ Trường: .....................................................</p>
          </div>
          <div className="space-y-3 pl-4 border-l border-black">
            <p>Số báo danh: ...........................................................................</p>
            <p>Phòng thi: ................................................................................</p>
            <p>Mã đề thi: <strong className="text-base">{exam.id.substring(0, 4).toUpperCase()}</strong></p>
          </div>
        </div>

        {/* Grid for SBD and Code Bubble Boxes */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-dashed border-slate-300">
          <div className="col-span-2 border border-black rounded p-3">
            <h4 className="text-xs font-bold text-center mb-2 uppercase">Khu vực tô Số báo danh & Mã đề</h4>
            <div className="flex gap-8 justify-around">
              {/* SBD Columns (6 digits) */}
              <div>
                <span className="block text-[10px] text-center font-bold mb-1">SỐ BÁO DANH</span>
                <div className="flex gap-1">
                  {[...Array(6)].map((_, col) => (
                    <div key={col} className="flex flex-col gap-0.5 border border-slate-300 p-0.5 rounded bg-slate-50">
                      <div className="h-4 border-b border-slate-300 mb-1"></div>
                      {[...Array(10)].map((_, val) => (
                        <span key={val} className="w-4 h-4 rounded-full border border-black text-[9px] flex items-center justify-center font-bold">
                          {val}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mã Đề Columns (3 digits) */}
              <div>
                <span className="block text-[10px] text-center font-bold mb-1">MÃ ĐỀ</span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, col) => (
                    <div key={col} className="flex flex-col gap-0.5 border border-slate-300 p-0.5 rounded bg-slate-50">
                      <div className="h-4 border-b border-slate-300 mb-1"></div>
                      {[...Array(10)].map((_, val) => (
                        <span key={val} className="w-4 h-4 rounded-full border border-black text-[9px] flex items-center justify-center font-bold">
                          {val}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-black rounded p-3 flex flex-col justify-center items-center text-center">
            <span className="block text-xs font-bold uppercase mb-2">ĐIỂM SỐ</span>
            <div className="w-20 h-20 border-2 border-black rounded-lg flex items-center justify-center text-slate-300 text-xs italic">
              Giám khảo
            </div>
            <span className="block text-[10px] text-slate-400 mt-2">Chữ ký giám khảo</span>
          </div>
        </div>

        {/* Answer Bubbles Grid */}
        <div className="border border-black rounded-xl p-4 mt-6">
          <h4 className="text-xs font-bold uppercase mb-4 text-center border-b pb-2">PHẦN TRẢ LỜI CỦA THÍ SINH</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {questions.map((q, idx) => {
              return (
                <div key={q.id} className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
                  <span className="font-bold w-12 text-slate-500">Câu {idx + 1}:</span>
                  
                  {q.question_type === 'MultipleChoice' && (
                    <div className="flex gap-1.5 font-bold">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <span key={opt} className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px]">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'TrueFalse' && q.options && (
                    <div className="flex flex-col gap-1 text-[9px]">
                      {Object.keys(q.options).sort().map((subKey) => (
                        <div key={subKey} className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-400 uppercase w-2">{subKey}:</span>
                          <span className="w-4 h-4 rounded border border-black flex items-center justify-center font-bold">Đ</span>
                          <span className="w-4 h-4 rounded border border-black flex items-center justify-center font-bold">S</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'FillIn' && (
                    <div className="flex-1">
                      <div className="h-6 border border-slate-300 rounded bg-slate-50/50 w-full"></div>
                    </div>
                  )}

                  {q.question_type === 'Essay' && (
                    <span className="text-[10px] text-slate-400 italic">(Làm trên giấy riêng)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAnswerKey = () => {
    return (
      <div className="space-y-6 text-black">
        {/* PAGE 1: PRE-FILLED BUBBLE ANSWER SHEET FOR QUICK GRADING */}
        <div className="space-y-6 font-sans">
          {/* Header Title */}
          <div className="text-center space-y-2 uppercase">
            <h2 className="text-xl font-bold">PHIẾU ĐÁP ÁN ĐỤC LỖ / CHẤM NHANH</h2>
            <h3 className="text-sm font-semibold">MÔN THI: {exam.subjects?.name} - KHỐI {exam.grade}</h3>
            <p className="text-xs italic lowercase">(Bản in dùng để đối chiếu hoặc đục lỗ đặt lên bài thi của học sinh)</p>
          </div>

          {/* Student Info Box (Preserved for alignment) */}
          <div className="grid grid-cols-2 gap-4 border border-black p-4 rounded text-sm">
            <div className="space-y-3">
              <p>Họ và tên: <strong className="text-indigo-600 font-bold uppercase">(BẢN ĐÁP ÁN CHUẨN)</strong></p>
              <p>Ngày sinh: .................................................................................</p>
              <p>Lớp: ........................ Trường: .....................................................</p>
            </div>
            <div className="space-y-3 pl-4 border-l border-black">
              <p>Số báo danh: ...........................................................................</p>
              <p>Phòng thi: ................................................................................</p>
              <p>Mã đề thi: <strong className="text-base">{exam.id.substring(0, 4).toUpperCase()}</strong></p>
            </div>
          </div>

          {/* Grid for SBD and Code Bubble Boxes */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-dashed border-slate-300">
            <div className="col-span-2 border border-black rounded p-3">
              <h4 className="text-xs font-bold text-center mb-2 uppercase">Khu vực tô Số báo danh & Mã đề</h4>
              <div className="flex gap-8 justify-around">
                {/* SBD Columns (6 digits) */}
                <div>
                  <span className="block text-[10px] text-center font-bold mb-1">SỐ BÁO DANH</span>
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, col) => (
                      <div key={col} className="flex flex-col gap-0.5 border border-slate-300 p-0.5 rounded bg-slate-50">
                        <div className="h-4 border-b border-slate-300 mb-1"></div>
                        {[...Array(10)].map((_, val) => (
                          <span key={val} className="w-4 h-4 rounded-full border border-black text-[9px] flex items-center justify-center font-bold">
                            {val}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mã Đề Columns (3 digits) */}
                <div>
                  <span className="block text-[10px] text-center font-bold mb-1">MÃ ĐỀ</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, col) => (
                      <div key={col} className="flex flex-col gap-0.5 border border-slate-300 p-0.5 rounded bg-slate-50">
                        <div className="h-4 border-b border-slate-300 mb-1"></div>
                        {[...Array(10)].map((_, val) => (
                          <span key={val} className="w-4 h-4 rounded-full border border-black text-[9px] flex items-center justify-center font-bold">
                            {val}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-black rounded p-3 flex flex-col justify-center items-center text-center">
              <span className="block text-xs font-bold uppercase mb-2">ĐIỂM SỐ</span>
              <div className="w-20 h-20 border-2 border-black rounded-lg flex items-center justify-center text-slate-900 text-xs font-bold uppercase">
                10.0
              </div>
              <span className="block text-[10px] text-slate-400 mt-2">Điểm tuyệt đối</span>
            </div>
          </div>

          {/* Answer Bubbles Grid */}
          <div className="border border-black rounded-xl p-4 mt-6">
            <h4 className="text-xs font-bold uppercase mb-4 text-center border-b pb-2">PHẦN ĐÁP ÁN ĐÚNG CỦA CÁC CÂU HỎI</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {questions.map((q, idx) => {
                const correctAns = q.correct_answer || '';
                
                return (
                  <div key={q.id} className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold w-12 text-slate-600">Câu {idx + 1}:</span>
                    
                    {q.question_type === 'MultipleChoice' && (
                      <div className="flex gap-1.5 font-bold">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const isCorrect = correctAns.toUpperCase() === opt;
                          return (
                            <span 
                              key={opt} 
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                                isCorrect 
                                  ? 'bg-black text-white border-black font-extrabold print:bg-black print:text-white' 
                                  : 'border-black text-black'
                              }`}
                            >
                              {opt}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === 'TrueFalse' && q.options && (
                      <div className="flex flex-col gap-1 text-[9px]">
                        {Object.keys(q.options).sort().map((subKey) => {
                          let correctSubVal = '';
                          try {
                            const parsed = JSON.parse(correctAns);
                            correctSubVal = parsed[subKey] || '';
                          } catch (e) {}

                          return (
                            <div key={subKey} className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-400 uppercase w-2">{subKey}:</span>
                              <span className={`w-4 h-4 rounded border flex items-center justify-center font-bold ${
                                correctSubVal === 'Đ' 
                                  ? 'bg-black text-white border-black print:bg-black print:text-white' 
                                  : 'border-black text-black'
                              }`}>Đ</span>
                              <span className={`w-4 h-4 rounded border flex items-center justify-center font-bold ${
                                correctSubVal === 'S' 
                                  ? 'bg-black text-white border-black print:bg-black print:text-white' 
                                  : 'border-black text-black'
                              }`}>S</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.question_type === 'FillIn' && (
                      <div className="flex-1">
                        <div className="h-6 border border-black rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-black px-2">
                          {correctAns}
                        </div>
                      </div>
                    )}

                    {q.question_type === 'Essay' && (
                      <span className="text-[10px] text-slate-500 italic font-semibold">(Tự luận - xem lời giải)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Page Break for print mode */}
        <div className="page-break" style={{ pageBreakBefore: 'always' }} />

        {/* PAGE 2+: SOLUTIONS AND DETAILED SOLUTION GUIDELINES */}
        <div className="space-y-6 font-serif pt-8">
          {/* Header */}
          <div className="text-center space-y-1 uppercase border-b-2 border-black pb-4 mb-6">
            <h2 className="text-xl font-bold">HƯỚNG DẪN GIẢI CHI TIẾT</h2>
            <h3 className="text-sm font-semibold">MÔN THI: {exam.subjects?.name} - KHỐI {exam.grade}</h3>
            <p className="text-xs font-mono lowercase">Mã đề: {exam.id.substring(0, 4).toUpperCase()}</p>
          </div>

          <div className="space-y-6 text-sm">
            {questions.map((q, idx) => {
              const isFirstOfType = idx === 0 || questions[idx - 1].question_type !== q.question_type;
              let sectionHeader = null;
              if (isFirstOfType) {
                if (q.question_type === 'MultipleChoice') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-slate-300 pb-1 mb-4 uppercase text-xs tracking-wider text-slate-800">
                      PHẦN I. Đáp án câu hỏi trắc nghiệm nhiều lựa chọn
                    </div>
                  );
                } else if (q.question_type === 'TrueFalse') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-slate-300 pb-1 mb-4 uppercase text-xs tracking-wider text-slate-800 mt-6">
                      PHẦN II. Đáp án câu hỏi trắc nghiệm Đúng/Sai
                    </div>
                  );
                } else if (q.question_type === 'FillIn') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-slate-300 pb-1 mb-4 uppercase text-xs tracking-wider text-slate-800 mt-6">
                      PHẦN III. Đáp án câu hỏi trắc nghiệm trả lời ngắn (Điền đáp án)
                    </div>
                  );
                } else if (q.question_type === 'Essay') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-slate-300 pb-1 mb-4 uppercase text-xs tracking-wider text-slate-800 mt-6">
                      PHẦN IV. Đáp án câu hỏi tự luận
                    </div>
                  );
                }
              }

              let displayAns = q.correct_answer;
              if (q.question_type === 'TrueFalse') {
                try {
                  const parsed = JSON.parse(q.correct_answer);
                  displayAns = Object.keys(parsed)
                    .sort()
                    .map((k) => `${k.toUpperCase()}: ${parsed[k] === 'Đ' ? 'Đúng' : 'Sai'}`)
                    .join(', ');
                } catch (e) {
                  displayAns = q.correct_answer;
                }
              }
              return (
                <div key={q.id} className="space-y-2 border-b border-slate-200 pb-4">
                  {sectionHeader}
                  <p className="font-bold font-sans">Câu {idx + 1} ({q.question_type === 'MultipleChoice' ? 'Trắc nghiệm' : q.question_type === 'TrueFalse' ? 'Đúng/Sai' : q.question_type === 'FillIn' ? 'Điền đáp án' : 'Tự luận'}):</p>
                  <div className="pl-4 border-l-2 border-slate-300 space-y-2">
                    <div className="italic text-slate-700">
                      <LatexRenderer text={q.content} />
                    </div>
                    <p className="text-xs">
                      <strong>Đáp án đúng:</strong> <span className="font-bold text-indigo-600">{displayAns}</span>
                    </p>
                    {q.explanation && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <strong>Lời giải chi tiết:</strong>
                        <div className="mt-1">
                          <LatexRenderer text={q.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto font-serif selection:bg-slate-100">
      
      {/* Printable CSS Settings */}
      <style jsx global>{`
        @page {
          size: auto;
          margin: 15mm;
        }
        @media print {
          html, body {
            background-color: white !important;
            color: black !important;
            font-size: 12pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
            page-break-inside: avoid;
          }
          .bg-black {
            background-color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-white {
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Floating Action Bar (Hidden during print) */}
      <div className="no-print mb-8 p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between font-sans">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => window.close()} />
          <span>Quay lại trang quản trị</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportWord}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" /> Tải file Word (.doc)
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" /> In / Lưu PDF (Ctrl + P)
          </button>
        </div>
      </div>

      <div id="printable-content">
        {printType === 'sheet' && renderAnswerSheet()}
        {printType === 'key' && renderAnswerKey()}
        {printType === 'questions' && (
          <>
            {/* Exam Header */}
            <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-6 text-center text-sm font-sans uppercase">
              <div className="space-y-1">
                <h4 className="font-bold">TRƯỜNG THPT CHUYÊN THI CỬ</h4>
                <h5>ĐỀ THI KHẢO SÁT CHẤT LƯỢNG</h5>
                <p className="font-bold text-xs">Mã đề thi: {exam.id.substring(0, 4).toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold">KỲ THI TRẮC NGHIỆM TRỰC TUYẾN</h4>
                <h5>MÔN THI: {exam.subjects?.name} - KHỐI {exam.grade}</h5>
                <p className="text-xs">Thời gian làm bài: <strong>{exam.duration_minutes} phút</strong></p>
              </div>
            </div>

            {/* Student Identity Boxes */}
            <div className="border border-black p-4 rounded mb-8 grid grid-cols-3 gap-4 text-sm font-sans">
              <div className="col-span-2">
                Họ và tên thí sinh: ............................................................................
              </div>
              <div>
                Lớp: .............................
              </div>
              <div className="col-span-2">
                Số báo danh / Email: ......................................................................
              </div>
              <div>
                Phòng thi: .....................
              </div>
            </div>

            {/* Exam Instruction */}
            <div className="text-xs italic mb-6 text-center font-sans border-b border-dashed border-slate-300 pb-4">
              (Đề thi gồm {questions.length} câu hỏi. Thí sinh trả lời trực tiếp vào tờ phiếu hoặc làm bài tự luận theo yêu cầu)
            </div>

            {/* Questions Listing */}
            <div className="space-y-8 font-serif leading-relaxed text-sm">
            {questions.map((q, idx) => {
              const isFirstOfType = idx === 0 || questions[idx - 1].question_type !== q.question_type;
              let sectionHeader = null;
              if (isFirstOfType) {
                if (q.question_type === 'MultipleChoice') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-black pb-1 mb-4 uppercase text-xs tracking-wider">
                      PHẦN I. Câu hỏi trắc nghiệm nhiều lựa chọn
                    </div>
                  );
                } else if (q.question_type === 'TrueFalse') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-black pb-1 mb-4 uppercase text-xs tracking-wider mt-6">
                      PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai
                    </div>
                  );
                } else if (q.question_type === 'FillIn') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-black pb-1 mb-4 uppercase text-xs tracking-wider mt-6">
                      PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn (Điền đáp án)
                    </div>
                  );
                } else if (q.question_type === 'Essay') {
                  sectionHeader = (
                    <div className="font-sans font-bold border-b border-black pb-1 mb-4 uppercase text-xs tracking-wider mt-6">
                      PHẦN IV. Câu hỏi tự luận
                    </div>
                  );
                }
              }

              return (
                <div key={q.id} className="space-y-3">
                  {sectionHeader}
                    
                    {/* Content */}
                    <div className="flex gap-1.5 items-start">
                      <span className="font-bold shrink-0">Câu {idx + 1}:</span>
                      <div>
                        <LatexRenderer text={q.content} />
                      </div>
                    </div>

                    {/* Image URL if present */}
                    {q.image_url && (
                      <div className="pl-6 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={q.image_url} 
                          alt={`Hình minh họa Câu ${idx+1}`} 
                          className="max-h-60 max-w-full rounded object-contain border border-slate-200" 
                        />
                      </div>
                    )}

                    {/* Dynamic options layout by type */}
                    {q.question_type === 'MultipleChoice' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pl-6 font-sans text-xs">
                        {Object.keys(q.options).sort().map(key => (
                          <div key={key} className="flex items-start gap-1">
                            <span className="font-bold">{key}.</span>
                            <div>{q.options[key]}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'TrueFalse' && q.options && (
                      <div className="pl-6 space-y-2 font-sans text-xs">
                        <p className="italic text-slate-500 mb-1">(Hãy chọn Đúng (Đ) hoặc Sai (S) cho mỗi mệnh đề sau:)</p>
                        {Object.keys(q.options).sort().map(key => (
                          <div key={key} className="flex justify-between items-start border border-dashed border-slate-200 p-2 rounded max-w-2xl">
                            <div className="flex gap-2">
                              <span className="font-bold uppercase text-indigo-600">{key}.</span>
                              <span>{q.options[key]}</span>
                            </div>
                            <div className="flex gap-4 shrink-0 font-bold ml-4">
                              <span>[ ] Đúng</span>
                              <span>[ ] Sai</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'FillIn' && (
                      <div className="pl-6 font-sans text-xs text-slate-500">
                        <span>Đáp án của thí sinh: ............................................................................................</span>
                      </div>
                    )}

                    {q.question_type === 'Essay' && (
                      <div className="pl-6 font-sans text-xs text-slate-500 italic space-y-1">
                        <p>(Học sinh làm bài tự luận chi tiết vào tờ giấy thi riêng)</p>
                        <div className="border border-dashed border-slate-200 h-28 rounded max-w-3xl flex items-center justify-center">
                          (Vùng dành cho lời giải tự luận của thí sinh)
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Exam Footer */}
            <div className="mt-16 pt-6 border-t border-black text-center text-xs font-sans text-slate-500">
              <p className="text-center" style={{ textAlign: 'center' }}>------ HẾT ------</p>
              <p className="mt-1 font-semibold text-center" style={{ textAlign: 'center' }}>Cán bộ coi thi không giải thích gì thêm.</p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
