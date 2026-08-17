'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function signIn(formData: any) {
  try {
    const email = formData.email;
    const password = formData.password;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      // Default to student if no profile was synced yet
      return { success: true, user: data.user, role: 'student' };
    }

    return { success: true, user: data.user, role: profile.role };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function signUp(formData: any) {
  try {
    const email = formData.email;
    const password = formData.password;
    const name = formData.name;
    const role = formData.role || 'student';
    const classId = formData.classId || null;
    const studentId = formData.studentId || null;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          class_id: classId,
          student_id: studentId,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, user: null, profile: null };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, classes(name, grade)')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: true, user, profile: null };
    }

    return { success: true, user, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
