'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getSubjects() {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getSubjects error:', error);
    return { success: false, error: error.message };
  }
}

export async function createSubject(name: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true, data };
  } catch (error: any) {
    console.error('createSubject error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubject(id: string) {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true };
  } catch (error: any) {
    console.error('deleteSubject error:', error);
    return { success: false, error: error.message };
  }
}

export async function getClasses() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getClasses error:', error);
    return { success: false, error: error.message };
  }
}

export async function createClass(name: string, grade: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({ name, grade })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true, data };
  } catch (error: any) {
    console.error('createClass error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteClass(id: string) {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true };
  } catch (error: any) {
    console.error('deleteClass error:', error);
    return { success: false, error: error.message };
  }
}

// --- CHAPTERS AND LESSONS ACTIONS ---

export async function getChapters(subjectId: string, grade: string) {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('grade', grade)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getChapters error:', error);
    return { success: false, error: error.message };
  }
}

export async function createChapter(subjectId: string, grade: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .insert({ subject_id: subjectId, grade, title })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true, data };
  } catch (error: any) {
    console.error('createChapter error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteChapter(id: string) {
  try {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true };
  } catch (error: any) {
    console.error('deleteChapter error:', error);
    return { success: false, error: error.message };
  }
}

export async function getLessons(chapterId: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getLessons error:', error);
    return { success: false, error: error.message };
  }
}

export async function createLesson(chapterId: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ chapter_id: chapterId, title })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true, data };
  } catch (error: any) {
    console.error('createLesson error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLesson(id: string) {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true };
  } catch (error: any) {
    console.error('deleteLesson error:', error);
    return { success: false, error: error.message };
  }
}
