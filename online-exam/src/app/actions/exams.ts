'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function getExams() {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name, grade)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getExams error:', error);
    return { success: false, error: error.message };
  }
}

export async function createRandomExam({
  title,
  subjectId,
  classId,
  numQuestions,
  durationMinutes,
  easyCount = 0,
  mediumCount = 0,
  hardCount = 0,
  mcCount = 0,
  tfCount = 0,
  fillCount = 0,
  essayCount = 0,
  chapterIds = [],
  lessonIds = [],
  isShuffled = false,
  numVariants = 1
}: {
  title: string;
  subjectId: string;
  classId: string | null;
  numQuestions: number;
  durationMinutes: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
  mcCount?: number;
  tfCount?: number;
  fillCount?: number;
  essayCount?: number;
  chapterIds?: string[];
  lessonIds?: string[];
  isShuffled?: boolean;
  numVariants?: number;
}) {
  try {
    // 1. Get class grade if classId is provided
    let grade: string | null = null;
    if (classId) {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('grade')
        .eq('id', classId)
        .single();
      
      if (classError) throw classError;
      grade = classData?.grade;
    }

    // 2. Query questions matching criteria (only select approved questions)
    let query = supabase.from('questions').select('id, question_type, difficulty').eq('subject_id', subjectId).eq('status', 'approved');
    if (grade) {
      query = query.eq('grade', grade);
    }

    // Apply chapter & lesson filters if specified
    const hasChapters = chapterIds && chapterIds.length > 0;
    const hasLessons = lessonIds && lessonIds.length > 0;

    if (hasChapters && hasLessons) {
      query = query.or(`lesson_id.in.(${lessonIds.map(id => `"${id}"`).join(',')}),chapter_id.in.(${chapterIds.map(id => `"${id}"`).join(',')})`);
    } else if (hasChapters) {
      query = query.in('chapter_id', chapterIds);
    } else if (hasLessons) {
      query = query.in('lesson_id', lessonIds);
    }

    const { data: questions, error: qError } = await query;
    if (qError) throw qError;

    if (!questions || questions.length === 0) {
      throw new Error('Không tìm thấy câu hỏi nào phù hợp với môn học và khối lớp đã chọn.');
    }

    let selectedIds: string[] = [];

    // Check if custom constraints are requested
    const hasDifficultyConstraints = easyCount > 0 || mediumCount > 0 || hardCount > 0;
    const hasTypeConstraints = mcCount > 0 || tfCount > 0 || fillCount > 0 || essayCount > 0;

    if (hasDifficultyConstraints || hasTypeConstraints) {
      const totalReq = hasDifficultyConstraints ? (easyCount + mediumCount + hardCount) : (mcCount + tfCount + fillCount + essayCount);
      if (totalReq !== numQuestions) {
        throw new Error(`Tổng số câu hỏi cấu hình (${totalReq} câu) phải bằng Tổng số lượng câu hỏi đề bài (${numQuestions} câu).`);
      }

      const diffReqs = hasDifficultyConstraints ? { Easy: easyCount, Medium: mediumCount, Hard: hardCount } : null;
      const typeReqs = hasTypeConstraints ? { MultipleChoice: mcCount, TrueFalse: tfCount, FillIn: fillCount, Essay: essayCount } : null;

      // Backtracking selector
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const selected: any[] = [];

      function backtrack(
        index: number,
        currDiff: Record<string, number>,
        currType: Record<string, number>
      ): boolean {
        if (selected.length === numQuestions) {
          if (diffReqs) {
            if (currDiff.Easy !== diffReqs.Easy || currDiff.Medium !== diffReqs.Medium || currDiff.Hard !== diffReqs.Hard) {
              return false;
            }
          }
          if (typeReqs) {
            if (currType.MultipleChoice !== typeReqs.MultipleChoice || 
                currType.TrueFalse !== typeReqs.TrueFalse || 
                currType.FillIn !== typeReqs.FillIn || 
                currType.Essay !== typeReqs.Essay) {
              return false;
            }
          }
          return true;
        }

        if (index >= shuffled.length) return false;
        if (selected.length + (shuffled.length - index) < numQuestions) return false;

        const q = shuffled[index];
        const nextDiff: Record<string, number> = { ...currDiff, [q.difficulty]: (currDiff[q.difficulty] || 0) + 1 };
        const nextType: Record<string, number> = { ...currType, [q.question_type]: (currType[q.question_type] || 0) + 1 };

        if (diffReqs) {
          if (nextDiff[q.difficulty] > (diffReqs[q.difficulty as 'Easy' | 'Medium' | 'Hard'] || 0)) {
            return backtrack(index + 1, currDiff, currType);
          }
        }
        if (typeReqs) {
          if (nextType[q.question_type] > (typeReqs[q.question_type as 'MultipleChoice' | 'TrueFalse' | 'FillIn' | 'Essay'] || 0)) {
            return backtrack(index + 1, currDiff, currType);
          }
        }

        // Try including
        selected.push(q);
        if (backtrack(index + 1, nextDiff, nextType)) {
          return true;
        }
        selected.pop();

        // Try excluding
        return backtrack(index + 1, currDiff, currType);
      }

      const success = backtrack(0, { Easy: 0, Medium: 0, Hard: 0 }, { MultipleChoice: 0, TrueFalse: 0, FillIn: 0, Essay: 0 });
      if (!success) {
        throw new Error('Không tìm thấy tổ hợp câu hỏi thỏa mãn chính xác các yêu cầu cấu hình. Vui lòng bổ sung thêm câu hỏi vào ngân hàng hoặc giảm số lượng yêu cầu.');
      }
      const typeOrder = { MultipleChoice: 1, TrueFalse: 2, FillIn: 3, Essay: 4 };
      const sortedSelected = [...selected].sort((a, b) => {
        const orderA = typeOrder[a.question_type as keyof typeof typeOrder] || 99;
        const orderB = typeOrder[b.question_type as keyof typeof typeOrder] || 99;
        return orderA - orderB;
      });
      selectedIds = sortedSelected.map(q => q.id);
    } else {
      // Fallback: simple random N questions
      if (questions.length < numQuestions) {
        throw new Error(`Kho câu hỏi chỉ có ${questions.length} câu, không đủ để sinh đề ${numQuestions} câu.`);
      }
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const chosenQuestions = shuffled.slice(0, numQuestions);
      const typeOrder = { MultipleChoice: 1, TrueFalse: 2, FillIn: 3, Essay: 4 };
      const sortedSelected = [...chosenQuestions].sort((a, b) => {
        const orderA = typeOrder[a.question_type as keyof typeof typeOrder] || 99;
        const orderB = typeOrder[b.question_type as keyof typeof typeOrder] || 99;
        return orderA - orderB;
      });
      selectedIds = sortedSelected.map(q => q.id);
    }

    const actualNumVariants = isShuffled ? Math.max(1, numVariants) : 1;

    // 4. Insert exam
    const { data, error } = await supabase
      .from('exams')
      .insert({
        title,
        subject_id: subjectId,
        class_id: classId || null,
        duration_minutes: durationMinutes,
        question_ids: selectedIds,
        is_shuffled: isShuffled,
        num_variants: actualNumVariants
      })
      .select()
      .single();

    if (error) throw error;

    // Generate variants
    await generateAndSaveVariants(data.id, selectedIds, actualNumVariants, isShuffled);

    revalidatePath('/admin/exams');
    return { success: true, data };
  } catch (error: any) {
    console.error('createRandomExam error:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Fisher-Yates array shuffling
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

import { reorderQuestionOptions } from '@/lib/variant-utils';

export async function generateAndSaveVariants(
  examId: string, 
  questionIds: string[], 
  numVariants: number,
  isShuffled: boolean
) {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_type, options, correct_answer')
      .in('id', questionIds);

    if (error || !questions) return;

    const qMap = new Map<string, any>();
    questions.forEach(q => qMap.set(q.id, q));

    const variantsToInsert = [];

    for (let v = 0; v < numVariants; v++) {
      const variantCode = String(101 + v);
      
      // If isShuffled is true, scramble questions for variant (v > 0 or all)
      const variantQIds = (isShuffled && v > 0) ? shuffleArray(questionIds) : [...questionIds];
      
      const optionOrders: Record<string, number[]> = {};
      const answerKey: Record<string, string> = {};

      for (const qId of variantQIds) {
        const q = qMap.get(qId);
        if (!q) continue;

        let optionCount = 0;
        if (Array.isArray(q.options)) {
          optionCount = q.options.length;
        } else if (q.options && typeof q.options === 'object') {
          optionCount = Object.keys(q.options).length;
        }

        if (q.question_type === 'MultipleChoice' && optionCount > 0) {
          const defaultIndices = Array.from({ length: optionCount }, (_, i) => i);
          const shuffledIndices = (isShuffled && v > 0) ? shuffleArray(defaultIndices) : defaultIndices;

          optionOrders[qId] = shuffledIndices;

          // Map correct answer letter(s)
          if (q.correct_answer) {
            const origAnsStr = String(q.correct_answer).trim();
            if (origAnsStr.includes(',')) {
              // Multi-select
              const origLetters = origAnsStr.split(',').map(l => l.trim().toUpperCase());
              const newLetters = origLetters.map(l => {
                const origIdx = LETTERS.indexOf(l);
                if (origIdx === -1) return l;
                const newPos = shuffledIndices.indexOf(origIdx);
                return newPos !== -1 ? LETTERS[newPos] : l;
              }).sort().join(',');
              answerKey[qId] = newLetters;
            } else {
              // Single choice
              const origIdx = LETTERS.indexOf(origAnsStr.toUpperCase());
              if (origIdx !== -1) {
                const newPos = shuffledIndices.indexOf(origIdx);
                answerKey[qId] = newPos !== -1 ? LETTERS[newPos] : origAnsStr;
              } else {
                answerKey[qId] = origAnsStr;
              }
            }
          } else {
            answerKey[qId] = '';
          }
        } else {
          // TrueFalse, FillIn, Essay
          optionOrders[qId] = [0, 1, 2, 3];
          answerKey[qId] = q.correct_answer || '';
        }
      }

      variantsToInsert.push({
        exam_id: examId,
        variant_code: variantCode,
        question_ids: variantQIds,
        option_orders: optionOrders,
        answer_key: answerKey
      });
    }

    await supabase.from('exam_variants').delete().eq('exam_id', examId);
    await supabase.from('exam_variants').insert(variantsToInsert);
  } catch (err) {
    console.error('generateAndSaveVariants error:', err);
  }
}

export async function regenerateExamVariants(examId: string) {
  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .select('id, question_ids, num_variants, is_shuffled')
      .eq('id', examId)
      .single();

    if (error || !exam) throw new Error('Không tìm thấy đề thi');

    await generateAndSaveVariants(
      exam.id, 
      exam.question_ids, 
      exam.num_variants || 1, 
      exam.is_shuffled || false
    );
    return { success: true };
  } catch (err: any) {
    console.error('regenerateExamVariants error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteExam(id: string) {
  try {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/exams');
    return { success: true };
  } catch (error: any) {
    console.error('deleteExam error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch exam details for teacher (includes correct answers)
export async function getExamDetailsForTeacher(examId: string) {
  try {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name)')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    // Fetch questions by ids in array
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .in('id', exam.question_ids);

    if (qError) throw qError;

    // Sort questions back to match exam.question_ids sequence
    const sortedQuestions = exam.question_ids.map((id: string) => 
      questions.find((q: any) => q.id === id)
    ).filter(Boolean);

    return { success: true, exam, questions: sortedQuestions };
  } catch (error: any) {
    console.error('getExamDetailsForTeacher error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch exam for student (security optimization: strips correct_answer & explanation, applies variant scramble)
export async function getExamForStudent(examId: string, studentId?: string) {
  try {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name)')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    let targetQIds: string[] = exam.question_ids;
    let optionOrders: Record<string, number[]> | null = null;
    let assignedVariantCode: string | null = null;
    let assignedVariantId: string | null = null;

    // Check if student has an assigned variant
    if (studentId) {
      const { data: assignment } = await supabase
        .from('student_exam_assignments')
        .select('variant_id, exam_variants(id, variant_code, question_ids, option_orders)')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (assignment && assignment.exam_variants) {
        const v = assignment.exam_variants as any;
        targetQIds = v.question_ids;
        optionOrders = v.option_orders;
        assignedVariantCode = v.variant_code;
        assignedVariantId = v.id;
      }
    }

    // Fetch questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, subject_id, grade, question_type, content, options, difficulty, correct_answer, image_url')
      .in('id', targetQIds);

    if (qError) throw qError;

    // Map questions securely & reorder options according to optionOrders
    const secureQuestions = questions.map((q: any) => {
      const isMultiSelect = q.question_type === 'MultipleChoice' && q.correct_answer && q.correct_answer.includes(',');
      const { correct_answer, ...rest } = q;

      let reorderedOptions = q.options;
      if (optionOrders && optionOrders[q.id]) {
        reorderedOptions = reorderQuestionOptions(q.options, optionOrders[q.id]);
      }

      return {
        ...rest,
        options: reorderedOptions,
        is_multiselect: isMultiSelect
      };
    });

    // Sort questions back to match targetQIds sequence
    const sortedQuestions = targetQIds.map((id: string) => 
      secureQuestions.find((q: any) => q.id === id)
    ).filter(Boolean);

    return { 
      success: true, 
      exam, 
      questions: sortedQuestions,
      variantCode: assignedVariantCode,
      variantId: assignedVariantId
    };
  } catch (error: any) {
    console.error('getExamForStudent error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch all variants for an exam
export async function getExamVariants(examId: string) {
  try {
    const { data, error } = await supabase
      .from('exam_variants')
      .select('*')
      .eq('exam_id', examId)
      .order('variant_code', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getExamVariants error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch specific variant details (reordered questions & options for print)
export async function getExamVariantDetails(examId: string, variantCode: string) {
  try {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name)')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    const { data: variant, error: varError } = await supabase
      .from('exam_variants')
      .select('*')
      .eq('exam_id', examId)
      .eq('variant_code', variantCode)
      .single();

    if (varError || !variant) throw new Error(`Không tìm thấy mã đề ${variantCode}`);

    // Fetch questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .in('id', variant.question_ids);

    if (qError) throw qError;

    // Apply variant question order & option orders
    const processedQuestions = variant.question_ids.map((qId: string) => {
      const q = questions.find((item: any) => item.id === qId);
      if (!q) return null;

      let reorderedOptions = q.options;
      if (variant.option_orders && variant.option_orders[q.id]) {
        reorderedOptions = reorderQuestionOptions(q.options, variant.option_orders[q.id]);
      }

      const variantCorrectAns = variant.answer_key[q.id] || q.correct_answer;

      return {
        ...q,
        options: reorderedOptions,
        variant_correct_answer: variantCorrectAns
      };
    }).filter(Boolean);

    return { 
      success: true, 
      exam, 
      variant, 
      questions: processedQuestions 
    };
  } catch (error: any) {
    console.error('getExamVariantDetails error:', error);
    return { success: false, error: error.message };
  }
}

// Send Exam Link to all students in the class & assign variants
export async function sendExamLinksToClass(
  examId: string, 
  baseUrl: string, 
  dueAt?: string | null,
  maxAttempts?: number,
  gradingPolicy?: string,
  resultDisplayMode?: string
) {
  try {
    const updateFields: any = { is_sent: true };
    if (dueAt !== undefined) updateFields.due_at = dueAt;
    if (maxAttempts !== undefined) updateFields.max_attempts = maxAttempts;
    if (gradingPolicy !== undefined) updateFields.grading_policy = gradingPolicy;
    if (resultDisplayMode !== undefined) updateFields.result_display_mode = resultDisplayMode;

    const { error: updateError } = await supabase
      .from('exams')
      .update(updateFields)
      .eq('id', examId);
    if (updateError) throw updateError;

    // 1. Get exam info
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name)')
      .eq('id', examId)
      .single();

    if (examError) throw examError;
    if (!exam.class_id) {
      throw new Error('Đề thi này không được phân phối cho lớp cụ thể.');
    }

    // 2. Fetch student list in that class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('class_id', exam.class_id);

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      throw new Error('Lớp học này hiện chưa có học sinh nào.');
    }

    // 3. Fetch variants if shuffled exam
    const { data: variants } = await supabase
      .from('exam_variants')
      .select('id, variant_code')
      .eq('exam_id', examId)
      .order('variant_code', { ascending: true });

    if (variants && variants.length > 0) {
      const assignments = students.map((std: any, idx: number) => {
        const assignedVariant = variants[idx % variants.length];
        return {
          exam_id: examId,
          student_id: std.id,
          variant_id: assignedVariant.id
        };
      });

      await supabase.from('student_exam_assignments').upsert(assignments, { onConflict: 'exam_id,student_id' });
    }

    const examLink = `${baseUrl}/exam/${exam.id}`;
    
    // 4. Dispatch emails
    const emailPromises = students.map((student: any) => {
      const formattedDue = exam.due_at ? new Date(exam.due_at).toLocaleString('vi-VN') : 'Không giới hạn';
      const formattedAttempts = exam.max_attempts === 0 || exam.max_attempts === null ? 'Làm nhiều lần' : `${exam.max_attempts} lần`;
      const formattedPolicy = exam.grading_policy === 'highest' ? 'Lấy điểm cao nhất' : 'Lấy điểm lần làm đầu tiên';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Thông báo Bài thi trực tuyến</h2>
          <p>Xin chào <strong>${student.name}</strong>,</p>
          <p>Giáo viên đã phân phối đề thi mới cho bạn:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tên bài thi:</strong> ${exam.title}</p>
            <p style="margin: 5px 0;"><strong>Môn học:</strong> ${exam.subjects?.name}</p>
            <p style="margin: 5px 0;"><strong>Thời gian làm bài:</strong> ${exam.duration_minutes} phút</p>
            <p style="margin: 5px 0;"><strong>Số lần làm bài:</strong> ${formattedAttempts}</p>
            <p style="margin: 5px 0;"><strong>Quy tắc tính điểm:</strong> ${formattedPolicy}</p>
            <p style="margin: 5px 0; color: #dc2626;"><strong>Hạn nộp bài:</strong> ${formattedDue}</p>
          </div>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${examLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">👉 Bắt Đầu Làm Bài Thi</a>
          </p>
          <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
            Nếu không click được nút, bạn có thể copy link này: <br/>
            <a href="${examLink}">${examLink}</a>
          </p>
        </div>
      `;

      return sendEmail({
        to: student.email,
        subject: `[LÀM BÀI THI] ${exam.title} - Môn ${exam.subjects?.name}`,
        html: htmlContent
      });
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r: any) => r.success).length;

    return { success: true, total: students.length, sent: successCount };
  } catch (error: any) {
    console.error('sendExamLinksToClass error:', error);
    return { success: false, error: error.message };
  }
}

export async function getStudentDashboardData(classId: string, studentId: string) {
  try {
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*, subjects(name)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (examsError) throw examsError;

    const { data: submissions, error: subsError } = await supabase
      .from('submissions')
      .select('*, exams(title, duration_minutes, subject_id, subjects(name))')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (subsError) throw subsError;

    return { success: true, exams: exams || [], submissions: submissions || [] };
  } catch (error: any) {
    console.error('getStudentDashboardData error:', error);
    return { success: false, error: error.message };
  }
}

export async function getParentDashboardInfo(parentUserId: string) {
  try {
    // 1. Fetch parent profile
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('student_id')
      .eq('id', parentUserId)
      .single();

    if (parentError || !parentProfile || !parentProfile.student_id) {
      throw new Error('Tài khoản phụ huynh chưa liên kết với học sinh nào.');
    }

    // 2. Fetch associated student's profile (name & class_id)
    const { data: student, error: stdError } = await supabase
      .from('students')
      .select('id, name, class_id, classes(name, grade)')
      .eq('id', parentProfile.student_id)
      .single();

    if (stdError || !student) {
      throw new Error('Không tìm thấy thông tin học sinh được liên kết.');
    }

    // 3. Get exams and submissions for this student
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*, subjects(name)')
      .eq('class_id', student.class_id)
      .order('created_at', { ascending: false });

    if (examsError) throw examsError;

    const { data: submissions, error: subsError } = await supabase
      .from('submissions')
      .select('*, exams(title, duration_minutes, subject_id, subjects(name))')
      .eq('student_id', student.id)
      .order('submitted_at', { ascending: false });

    if (subsError) throw subsError;

    return { 
      success: true, 
      student, 
      exams: exams || [], 
      submissions: submissions || [] 
    };
  } catch (error: any) {
    console.error('getParentDashboardInfo error:', error);
    return { success: false, error: error.message };
  }
}

// Fetch exam templates
export async function getExamTemplates() {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    // Allow users to see templates they created, plus global ones (where created_by is null)
    const { data, error } = await supabaseServer
      .from('exam_templates')
      .select('*')
      .or(`created_by.is.null,created_by.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getExamTemplates error:', error);
    return { success: false, error: error.message };
  }
}

interface CreateExamTemplateInput {
  name: string;
  durationMinutes: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  mcCount: number;
  tfCount: number;
  fillCount: number;
  essayCount: number;
}

// Create new exam template
export async function createExamTemplate(input: CreateExamTemplateInput) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) throw new Error('Yêu cầu đăng nhập để thực hiện hành động này.');

    const { data, error } = await supabaseServer
      .from('exam_templates')
      .insert({
        name: input.name,
        duration_minutes: input.durationMinutes,
        easy_count: input.easyCount,
        medium_count: input.mediumCount,
        hard_count: input.hardCount,
        mc_count: input.mcCount,
        tf_count: input.tfCount,
        fill_count: input.fillCount,
        essay_count: input.essayCount,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/admin/exams');
    return { success: true, data };
  } catch (error: any) {
    console.error('createExamTemplate error:', error);
    return { success: false, error: error.message };
  }
}

// Delete exam template
export async function deleteExamTemplate(id: string) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) throw new Error('Yêu cầu đăng nhập.');

    const { error } = await supabaseServer
      .from('exam_templates')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
    
    revalidatePath('/admin/exams');
    return { success: true };
  } catch (error: any) {
    console.error('deleteExamTemplate error:', error);
    return { success: false, error: error.message };
  }
}

