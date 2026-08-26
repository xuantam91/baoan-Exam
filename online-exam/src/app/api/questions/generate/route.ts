import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import officeParser from 'officeparser';

// Cấu hình thời gian chạy tối đa của Vercel (nếu deploy)
export const maxDuration = 300; 

export async function POST(req: Request) {
  let requestBatchId: string | null = null;
  let apiKey = '';
  const uploadedFiles: string[] = [];
  
  try {
    const body = await req.json();
    const { 
      batchId, 
      subjectId, 
      grade, 
      chapterId, 
      lessonId, 
      documentText, 
      files, // Array<{ name: string, type: string, base64: string }>
      targetCount = 10,
      geminiKey 
    } = body;

    requestBatchId = batchId;

    if (!batchId || !subjectId || !grade || (!documentText && (!files || files.length === 0))) {
      return NextResponse.json(
        { success: false, error: 'Thiếu các thông tin bắt buộc (batchId, subjectId, grade, documentText hoặc files).' },
        { status: 400 }
      );
    }

    // 1. Lấy API Key của Gemini
    let resolvedKey = geminiKey || process.env.GEMINI_API_KEY;
    if (!resolvedKey) {
      const { data: configData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();
      if (configData && configData.value && configData.value.apiKey) {
        resolvedKey = configData.value.apiKey;
      }
    }

    if (!resolvedKey) {
      const errorMsg = 'Không tìm thấy API Key của Gemini. Vui lòng cấu hình trong file .env.local, nhập trực tiếp hoặc lưu cấu hình trên server.';
      await updateBatchStatus(batchId, 'failed', errorMsg);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    apiKey = resolvedKey;

    // 2. Lấy tên môn học để đưa vào Prompt
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single();

    const subjectName = subjectError ? 'Môn học' : subjectData?.name;

    // 3. Khởi tạo câu Prompt tối ưu cho Gemini
    const prompt = `Bạn là một chuyên gia giáo dục và biên soạn đề thi trắc nghiệm học thuật.
Dựa trên tài liệu học tập được cung cấp ở cuối, hãy biên soạn đúng ${targetCount} câu hỏi kiểm tra.
Môn học: ${subjectName}
Khối lớp: ${grade}

Yêu cầu kỹ thuật:
- Các câu hỏi phải đa dạng về độ khó (Easy, Medium, Hard).
- Hỗ trợ các dạng câu hỏi sau: 
  + 'MultipleChoice' (Trắc nghiệm 4 lựa chọn A, B, C, D).
  + 'TrueFalse' (Đúng / Sai tổ hợp: gồm một câu hỏi lớn dẫn và 4 ý nhỏ a, b, c, d cần xác định Đúng hay Sai).
  + 'FillIn' (Điền vào chỗ trống đáp án ngắn).
  + 'Essay' (Tự luận / Trả lời ngắn có kèm bài mẫu/hướng dẫn chấm).
- Đảm bảo công thức toán học, vật lý, hóa học hoặc biểu thức ký hiệu (nếu có) phải được bọc trong định dạng LaTeX bằng ký tự $ (ví dụ: $x^2 + y^2 = z^2$ hoặc $\\frac{a}{b}$).
- Trả về kết quả dưới dạng JSON khớp chính xác với JSON Schema được cấu hình.

Tài liệu tham khảo để sinh câu hỏi:
${documentText}`;

    // 4. Định nghĩa JSON Schema đầu ra cho Gemini (Structured Outputs)
    const jsonSchema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          description: "Danh sách các câu hỏi được sinh ra từ tài liệu.",
          items: {
            type: "object",
            properties: {
              question_type: {
                type: "string",
                enum: ["MultipleChoice", "TrueFalse", "FillIn", "Essay"],
                description: "Loại câu hỏi."
              },
              content: {
                type: "string",
                description: "Nội dung câu hỏi lớn. Cần ghi rõ yêu cầu đề bài. Hỗ trợ công thức LaTeX bọc trong ký tự $."
              },
              options: {
                type: "object",
                description: "Danh sách các lựa chọn đáp án. Với MultipleChoice, sử dụng các key 'A', 'B', 'C', 'D'. Với TrueFalse, sử dụng các key 'a', 'b', 'c', 'd' đại diện cho 4 ý con cần chọn Đúng/Sai. Với FillIn và Essay, để trống hoặc trả về null.",
                properties: {
                  A: { type: "string" },
                  B: { type: "string" },
                  C: { type: "string" },
                  D: { type: "string" },
                  a: { type: "string" },
                  b: { type: "string" },
                  c: { type: "string" },
                  d: { type: "string" }
                }
              },
              correct_answer: {
                type: "string",
                description: "Đáp án đúng của câu hỏi. Với MultipleChoice, ghi chữ cái viết hoa đại diện (ví dụ: 'A', 'B', 'C' hoặc 'D'). Với TrueFalse, bắt buộc ghi dưới dạng chuỗi JSON biểu thị đáp án Đúng (Đ) hoặc Sai (S) của 4 ý con, ví dụ: '{\"a\":\"Đ\",\"b\":\"S\",\"c\":\"Đ\",\"d\":\"S\"}'. Với FillIn, ghi đáp án chữ/số ngắn chính xác cần điền. Với Essay, ghi dàn ý đáp án mẫu chi tiết."
              },
              explanation: {
                type: "string",
                description: "Lời giải thích chi tiết tại sao đáp án đó là đúng và các bước giải bài tập."
              },
              difficulty: {
                type: "string",
                enum: ["Easy", "Medium", "Hard"],
                description: "Độ khó của câu hỏi."
              }
            },
            required: ["question_type", "content", "correct_answer", "difficulty"]
          }
        }
      },
      required: ["questions"]
    };

    // 5. Chuẩn bị các parts gửi cho Gemini (Hỗ trợ Nhiều files tài liệu & ảnh bằng Files API)
    const parts: any[] = [{ text: prompt }];
    let combinedText = '';

    if (files && files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(file.base64, 'base64');
        
        if (file.type.startsWith('image/')) {
          try {
            console.log(`Đang tải ảnh ${file.name} lên Gemini Files API...`);
            const fileInfo = await uploadToGeminiFilesAPI(buffer, file.type, file.name, apiKey);
            uploadedFiles.push(fileInfo.name);
            parts.push({
              fileData: {
                fileUri: fileInfo.uri,
                mimeType: file.type
              }
            });
          } catch (e: any) {
            console.error(`Lỗi upload ảnh ${file.name} lên Files API:`, e);
            // Fallback sang gửi inlineData (base64) nếu upload lỗi
            parts.push({
              inlineData: {
                mimeType: file.type,
                data: file.base64
              }
            });
          }
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            console.log(`Đang tải PDF ${file.name} lên Gemini Files API...`);
            const mime = file.type || 'application/pdf';
            const fileInfo = await uploadToGeminiFilesAPI(buffer, mime, file.name, apiKey);
            uploadedFiles.push(fileInfo.name);
            parts.push({
              fileData: {
                fileUri: fileInfo.uri,
                mimeType: mime
              }
            });
          } catch (e: any) {
            console.error(`Lỗi upload PDF ${file.name} lên Files API, chuyển sang phân tích text cục bộ:`, e);
            // Fallback sang parse text cục bộ bằng officeparser
            try {
              const ast = await (officeParser as any).parseOffice(buffer, { fileType: 'pdf' });
              const textContent = await ast.to('text');
              const text = typeof textContent === 'string' ? textContent : (textContent?.value || '');
              combinedText += `\n--- Nội dung tệp (PDF): ${file.name} ---\n${text}\n`;
            } catch (innerErr: any) {
              console.error(`Lỗi phân tích fallback PDF ${file.name}:`, innerErr);
              throw new Error(`Không thể xử lý tệp PDF "${file.name}". Lỗi: ${e.message || e}`);
            }
          }
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = buffer.toString('utf-8');
          combinedText += `\n--- Nội dung tệp: ${file.name} ---\n${text}\n`;
        } else {
          // Xử lý các định dạng Office khác (DOCX, PPTX, XLSX) thông qua officeparser v6+ AST
          try {
            const fileTypeHint = file.name.split('.').pop() || '';
            const ast = await (officeParser as any).parseOffice(buffer, { fileType: fileTypeHint });
            const textContent = await ast.to('text');
            const text = typeof textContent === 'string' ? textContent : (textContent?.value || '');
            combinedText += `\n--- Nội dung tệp: ${file.name} ---\n${text}\n`;
          } catch (e: any) {
            console.error(`Lỗi phân tích tệp ${file.name} bằng officeparser:`, e);
            throw new Error(`Không thể đọc văn bản từ tệp "${file.name}". Lỗi: ${e.message || e}`);
          }
        }
      }
    }

    if (documentText && documentText.trim()) {
      combinedText += `\n--- Tài liệu nhập tay ---\n${documentText}\n`;
    }

    if (combinedText.trim()) {
      parts.push({
        text: `Tài liệu tham khảo để sinh câu hỏi:\n${combinedText}`
      });
    }

    // Gọi Gemini API bằng fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: jsonSchema
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorText = errorData?.error?.message || response.statusText || 'Lỗi gọi API của Gemini';
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const resJson = await response.json();
    const candidates = resJson.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Gemini API không trả về câu trả lời hợp lệ.');
    }

    const textResponse = candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(textResponse);
    const generatedQuestions = parsedData.questions || [];

    if (generatedQuestions.length === 0) {
      throw new Error('Không có câu hỏi nào được tạo ra từ phản hồi của AI.');
    }

    // 6. Lưu các câu hỏi nháp vào bảng questions
    const questionRows = generatedQuestions.map((q: any) => ({
      subject_id: subjectId,
      grade: grade,
      question_type: q.question_type,
      content: q.content,
      options: q.options || {},
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      difficulty: q.difficulty || 'Medium',
      status: 'draft',
      batch_id: batchId,
      chapter_id: chapterId && chapterId !== 'all' ? chapterId : null,
      lesson_id: lessonId && lessonId !== 'all' ? lessonId : null
    }));

    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionRows);

    if (insertError) {
      throw new Error(`Lỗi insert dữ liệu câu hỏi vào Supabase: ${insertError.message}`);
    }

    // 7. Cập nhật trạng thái Batch thành pending (Chờ duyệt) và cập nhật số lượng thực tế
    await supabase
      .from('question_batches')
      .update({ 
        status: 'pending', 
        total_questions: questionRows.length 
      })
      .eq('id', batchId);

    return NextResponse.json({ success: true, count: questionRows.length });

  } catch (error: any) {
    console.error('API Questions Generate Error:', error);
    if (requestBatchId) {
      await updateBatchStatus(requestBatchId, 'failed', error.message || 'Lỗi không xác định khi sinh câu hỏi AI');
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý sinh đề thi AI.' },
      { status: 500 }
    );
  } finally {
    // Dọn dẹp các tệp tạm đã tải lên Google Files API để bảo mật thông tin và giải phóng bộ nhớ
    for (const fileName of uploadedFiles) {
      try {
        console.log(`Đang dọn dẹp file tạm trên Gemini: ${fileName}`);
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
          {
            method: 'DELETE'
          }
        );
      } catch (delError) {
        console.error(`Lỗi khi xóa file tạm ${fileName} trên Gemini:`, delError);
      }
    }
  }
}

async function updateBatchStatus(batchId: string, status: 'failed', errorMessage: string) {
  try {
    await supabase
      .from('question_batches')
      .update({ 
        status, 
        error_message: errorMessage 
      })
      .eq('id', batchId);
  } catch (e) {
    console.error('updateBatchStatus error:', e);
  }
}

async function uploadToGeminiFilesAPI(
  buffer: Buffer,
  mimeType: string,
  displayName: string,
  apiKey: string
): Promise<{ uri: string; name: string }> {
  // BƯỚC 1: Khởi tạo Resumable Upload
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: { display_name: displayName }
      })
    }
  );

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`Khởi tạo tải file lên Gemini thất bại: ${initRes.statusText} - ${errorText}`);
  }

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Không nhận được đường dẫn tải lên từ Gemini API');
  }

  // BƯỚC 2: Tải dữ liệu nhị phân của tệp lên
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Length': buffer.length.toString()
    },
    body: buffer as any
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Đẩy dữ liệu tệp lên Gemini thất bại: ${uploadRes.statusText} - ${errorText}`);
  }

  const data = await uploadRes.json();
  const fileUri = data.file?.uri;
  const fileName = data.file?.name; // e.g. "files/..."
  
  if (!fileUri || !fileName) {
    throw new Error('Gemini không trả về đường dẫn tệp sau khi tải lên thành công');
  }

  // BƯỚC 3: Polling trạng thái chờ file sang ACTIVE (thường chỉ dùng với các tệp nặng)
  let state = data.file?.state || 'ACTIVE';
  let attempts = 0;
  while (state === 'PROCESSING' && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
    const checkRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
      { method: 'GET' }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      state = checkData.state || 'ACTIVE';
      if (state === 'FAILED') {
        throw new Error('Quá trình xử lý tệp tin trên máy chủ Gemini thất bại');
      }
    }
  }

  return { uri: fileUri, name: fileName };
}
