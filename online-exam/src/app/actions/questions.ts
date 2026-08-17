'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getQuestions(
  subjectId?: string, 
  grade?: string, 
  chapterId?: string, 
  lessonId?: string
) {
  try {
    let query = supabase.from('questions').select('*, subjects(name), chapters(title), lessons(title)');
    
    if (subjectId && subjectId !== 'all') {
      query = query.eq('subject_id', subjectId);
    }
    if (grade && grade !== 'all') {
      query = query.eq('grade', grade);
    }
    if (chapterId && chapterId !== 'all') {
      query = query.eq('chapter_id', chapterId);
    }
    if (lessonId && lessonId !== 'all') {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getQuestions error:', error);
    return { success: false, error: error.message };
  }
}

export async function createQuestion(questionData: {
  subject_id: string;
  grade: string;
  question_type: string;
  content: string;
  options: any;
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  image_url?: string;
  chapter_id?: string | null;
  lesson_id?: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/questions');
    return { success: true, data };
  } catch (error: any) {
    console.error('createQuestion error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateQuestion(
  id: string,
  questionData: {
    subject_id: string;
    grade: string;
    question_type: string;
    content: string;
    options: any;
    correct_answer: string;
    explanation?: string;
    difficulty: string;
    image_url?: string | null;
    chapter_id?: string | null;
    lesson_id?: string | null;
  }
) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/questions');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateQuestion error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteQuestion(id: string) {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/questions');
    return { success: true };
  } catch (error: any) {
    console.error('deleteQuestion error:', error);
    return { success: false, error: error.message };
  }
}

export async function getQuestionCountStats(
  subjectId: string, 
  grade?: string | null,
  chapterIds?: string[],
  lessonIds?: string[]
) {
  try {
    let query = supabase.from('questions').select('difficulty, question_type').eq('subject_id', subjectId);
    if (grade && grade !== '') {
      query = query.eq('grade', grade);
    }
    if (chapterIds && chapterIds.length > 0) {
      query = query.in('chapter_id', chapterIds);
    }
    if (lessonIds && lessonIds.length > 0) {
      query = query.in('lesson_id', lessonIds);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const stats = {
      difficulty: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      type: {
        MultipleChoice: 0,
        TrueFalse: 0,
        FillIn: 0,
        Essay: 0
      },
      total: 0
    };
    
    if (data) {
      stats.total = data.length;
      data.forEach((q: any) => {
        const diff = q.difficulty;
        const qtype = q.question_type;
        if (diff && diff in stats.difficulty) {
          stats.difficulty[diff as 'Easy' | 'Medium' | 'Hard']++;
        }
        if (qtype && qtype in stats.type) {
          stats.type[qtype as 'MultipleChoice' | 'TrueFalse' | 'FillIn' | 'Essay']++;
        }
      });
    }
    
    return { success: true, stats };
  } catch (error: any) {
    console.error('getQuestionCountStats error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurriculumQuestionCounts(subjectId: string, grade: string) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('chapter_id, lesson_id')
      .eq('subject_id', subjectId)
      .eq('grade', grade);
      
    if (error) throw error;
    
    const chapterCounts: Record<string, number> = {};
    const lessonCounts: Record<string, number> = {};
    
    data?.forEach((q: any) => {
      if (q.chapter_id) {
        chapterCounts[q.chapter_id] = (chapterCounts[q.chapter_id] || 0) + 1;
      }
      if (q.lesson_id) {
        lessonCounts[q.lesson_id] = (lessonCounts[q.lesson_id] || 0) + 1;
      }
    });
    
    return { success: true, chapterCounts, lessonCounts };
  } catch (error: any) {
    console.error('getCurriculumQuestionCounts error:', error);
    return { success: false, error: error.message };
  }
}
