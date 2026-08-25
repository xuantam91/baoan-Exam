'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createQuestionBatch(
  title: string,
  documentName?: string,
  totalQuestions?: number,
  subjectId?: string,
  grade?: string
) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { data, error } = await supabase
      .from('question_batches')
      .insert({
        title,
        document_name: documentName || null,
        status: 'processing',
        total_questions: totalQuestions || 0,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/questions/generate');
    return { success: true, data };
  } catch (error: any) {
    console.error('createQuestionBatch error:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionBatches() {
  try {
    const { data, error } = await supabase
      .from('question_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getQuestionBatches error:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionBatch(id: string) {
  try {
    const { data, error } = await supabase
      .from('question_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getQuestionBatch error:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionsByBatch(batchId: string) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*, subjects(name), chapters(title), lessons(title)')
      .eq('batch_id', batchId)
      .eq('status', 'draft')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getQuestionsByBatch error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDraftQuestion(
  questionId: string,
  questionData: {
    content: string;
    options: any;
    correct_answer: string;
    explanation?: string;
    difficulty: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', questionId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateDraftQuestion error:', error);
    return { success: false, error: error.message };
  }
}

export async function approveQuestionBatch(batchId: string, questionIdsToApprove: string[]) {
  try {
    if (!questionIdsToApprove || questionIdsToApprove.length === 0) {
      return { success: false, error: 'Không có câu hỏi nào được chọn để phê duyệt.' };
    }

    // 1. Cập nhật các câu hỏi được chọn sang approved
    const { error: qError } = await supabase
      .from('questions')
      .update({ status: 'approved' })
      .eq('batch_id', batchId)
      .in('id', questionIdsToApprove);

    if (qError) throw qError;

    // 2. Xóa bỏ các câu hỏi nháp không được phê duyệt trong bộ này
    const { error: delError } = await supabase
      .from('questions')
      .delete()
      .eq('batch_id', batchId)
      .eq('status', 'draft');

    if (delError) throw delError;

    // 3. Đánh dấu bộ đề đã duyệt xong
    const { error: bError } = await supabase
      .from('question_batches')
      .update({ status: 'approved' })
      .eq('id', batchId);

    if (bError) throw bError;

    revalidatePath('/admin/questions');
    revalidatePath('/admin/questions/generate');
    revalidatePath(`/admin/questions/approve/${batchId}`);

    return { success: true };
  } catch (error: any) {
    console.error('approveQuestionBatch error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteQuestionBatch(batchId: string) {
  try {
    // ON DELETE CASCADE sẽ tự động xóa sạch các câu hỏi có batch_id tương ứng
    const { error } = await supabase
      .from('question_batches')
      .delete()
      .eq('id', batchId);

    if (error) throw error;

    revalidatePath('/admin/questions');
    revalidatePath('/admin/questions/generate');

    return { success: true };
  } catch (error: any) {
    console.error('deleteQuestionBatch error:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyGeminiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond only with OK' }] }]
        })
      }
    );

    if (res.ok) {
      return { success: true };
    } else {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || res.statusText || 'Lỗi kiểm tra Key';
      return { success: false, error: errMsg };
    }
  } catch (error: any) {
    console.error('verifyGeminiKey error:', error);
    return { success: false, error: error.message || 'Lỗi mạng hoặc kết nối.' };
  }
}
