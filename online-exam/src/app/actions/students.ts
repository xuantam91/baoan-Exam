'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(name)')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getStudents error:', error);
    return { success: false, error: error.message };
  }
}

export async function createStudent(name: string, email: string, phone: string, classId: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        email,
        phone: phone || null,
        class_id: classId
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/students');
    return { success: true, data };
  } catch (error: any) {
    console.error('createStudent error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStudent(id: string) {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/students');
    return { success: true };
  } catch (error: any) {
    console.error('deleteStudent error:', error);
    return { success: false, error: error.message };
  }
}

interface ImportStudentInput {
  name: string;
  email: string;
  phone?: string;
  class_id: string;
}

export async function importStudents(studentsList: ImportStudentInput[]) {
  try {
    if (!studentsList || studentsList.length === 0) {
      return { success: false, error: 'Danh sách học sinh trống.' };
    }

    // Filter duplicates or formatting
    const formattedStudents = studentsList.map(s => ({
      name: s.name.trim(),
      email: s.email.trim().toLowerCase(),
      phone: s.phone ? s.phone.toString().trim() : null,
      class_id: s.class_id
    }));

    // Perform upsert (on conflict email, update name and phone)
    const { data, error } = await supabase
      .from('students')
      .upsert(formattedStudents, { onConflict: 'email' })
      .select();

    if (error) throw error;

    revalidatePath('/admin/students');
    return { success: true, count: data.length };
  } catch (error: any) {
    console.error('importStudents error:', error);
    return { success: false, error: error.message };
  }
}
