'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { PrintTemplate, BUILTIN_PRINT_TEMPLATES } from '@/types/print-templates';

export type { PrintTemplate };

export async function getPrintTemplates(): Promise<{ success: boolean; data: PrintTemplate[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      // Fallback gracefully to built-in templates if table not yet migrated
      console.warn('print_templates query error, falling back to built-in templates:', error.message);
      return { success: true, data: BUILTIN_PRINT_TEMPLATES };
    }

    if (!data || data.length === 0) {
      return { success: true, data: BUILTIN_PRINT_TEMPLATES };
    }

    return { success: true, data: data as PrintTemplate[] };
  } catch (err: any) {
    console.error('getPrintTemplates error:', err);
    return { success: true, data: BUILTIN_PRINT_TEMPLATES };
  }
}

export async function getPrintTemplateById(id: string): Promise<{ success: boolean; data?: PrintTemplate; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const fallback = BUILTIN_PRINT_TEMPLATES.find(t => t.id === id) || BUILTIN_PRINT_TEMPLATES[0];
      return { success: true, data: fallback };
    }

    return { success: true, data: data as PrintTemplate };
  } catch (err: any) {
    console.error('getPrintTemplateById error:', err);
    const fallback = BUILTIN_PRINT_TEMPLATES.find(t => t.id === id) || BUILTIN_PRINT_TEMPLATES[0];
    return { success: true, data: fallback };
  }
}

export async function getDefaultPrintTemplate(): Promise<PrintTemplate> {
  const res = await getPrintTemplates();
  if (res.success && res.data.length > 0) {
    return res.data.find(t => t.is_default) || res.data[0];
  }
  return BUILTIN_PRINT_TEMPLATES[0];
}

export async function createPrintTemplate(payload: Partial<PrintTemplate>) {
  try {
    const { id, created_at, updated_at, ...cleanPayload } = payload as any;
    
    // If set as default, unset other defaults
    if (cleanPayload.is_default) {
      await supabase
        .from('print_templates')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await supabase
      .from('print_templates')
      .insert({
        ...cleanPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    revalidatePath('/admin/exams');
    return { success: true, data };
  } catch (err: any) {
    console.error('createPrintTemplate error:', err);
    return { success: false, error: err.message };
  }
}

export async function updatePrintTemplate(id: string, payload: Partial<PrintTemplate>) {
  try {
    const { id: _, created_at, ...cleanPayload } = payload as any;

    if (cleanPayload.is_default) {
      await supabase
        .from('print_templates')
        .update({ is_default: false })
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('print_templates')
      .update({
        ...cleanPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/config');
    revalidatePath('/admin/exams');
    return { success: true, data };
  } catch (err: any) {
    console.error('updatePrintTemplate error:', err);
    return { success: false, error: err.message };
  }
}

export async function deletePrintTemplate(id: string) {
  try {
    const { error } = await supabase
      .from('print_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    return { success: true };
  } catch (err: any) {
    console.error('deletePrintTemplate error:', err);
    return { success: false, error: err.message };
  }
}

export async function setDefaultPrintTemplate(id: string) {
  try {
    // 1. Unset all
    await supabase
      .from('print_templates')
      .update({ is_default: false })
      .neq('id', id);

    // 2. Set this one
    const { error } = await supabase
      .from('print_templates')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/config');
    revalidatePath('/admin/exams');
    return { success: true };
  } catch (err: any) {
    console.error('setDefaultPrintTemplate error:', err);
    return { success: false, error: err.message };
  }
}
