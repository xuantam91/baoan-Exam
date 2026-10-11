-- SQL Migration: Add print_templates table and seed initial templates (including TQT_template.docx and TQT_Template_Sinh_hoc.docx)

-- 1. Create table public.print_templates
CREATE TABLE IF NOT EXISTS public.print_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false NOT NULL,
    
    -- Page layout & margins
    paper_size TEXT DEFAULT 'A4' NOT NULL,            -- 'A4' | 'A5' | 'Letter'
    orientation TEXT DEFAULT 'portrait' NOT NULL,     -- 'portrait' | 'landscape'
    margin_top NUMERIC DEFAULT 12.7 NOT NULL,          -- 12.7 mm = 0.5 in (narrow margins for TQT)
    margin_bottom NUMERIC DEFAULT 12.7 NOT NULL,
    margin_left NUMERIC DEFAULT 12.7 NOT NULL,
    margin_right NUMERIC DEFAULT 12.7 NOT NULL,
    font_family TEXT DEFAULT 'Times New Roman' NOT NULL,
    font_size TEXT DEFAULT '11pt' NOT NULL,            -- '10pt' | '11pt' | '12pt'
    
    -- Header styling & information
    header_style TEXT DEFAULT 'tqt_exam_only' NOT NULL, -- 'tqt_exam_only' | 'tqt_with_student_info' | 'boxed_student_info' | 'simple'
    school_name TEXT DEFAULT 'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    exam_title TEXT DEFAULT 'ĐỀ KIỂM TRA HỌC KỲ I',
    show_student_box BOOLEAN DEFAULT false,
    student_box_style TEXT DEFAULT 'dotted_lines',    -- 'grid_box' | 'dotted_lines'
    
    -- Notes & Footers
    instruction_note TEXT DEFAULT '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào đề)',
    footer_text TEXT DEFAULT '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    show_page_number BOOLEAN DEFAULT true,
    
    -- Answer key table style
    answer_table_style TEXT DEFAULT 'tqt_matrix',     -- 'tqt_matrix' | 'bubble_grid'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add print_template_id to public.exams
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS print_template_id UUID REFERENCES public.print_templates(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions on print_templates" ON public.print_templates;
CREATE POLICY "Allow all actions on print_templates" ON public.print_templates FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed initial templates (specifically 2 TQT templates requested by user + standard Ministry template)
INSERT INTO public.print_templates (
    id,
    name,
    description,
    is_default,
    paper_size,
    orientation,
    margin_top,
    margin_bottom,
    margin_left,
    margin_right,
    font_family,
    font_size,
    header_style,
    school_name,
    exam_title,
    show_student_box,
    student_box_style,
    instruction_note,
    footer_text,
    answer_table_style
) VALUES 
(
    '11111111-1111-1111-1111-111111111101',
    'Mẫu TQT - Không dòng thí sinh (TQT_template.docx)',
    'Mẫu đề thi chuẩn Trường THCS - THPT Trần Quốc Tuấn: Header 2 cột cân đối, không dòng tên (làm bài vào phiếu trắc nghiệm riêng), lề hẹp 1.27cm tiết kiệm giấy.',
    true,
    'A4',
    'portrait',
    12.7,
    12.7,
    12.7,
    12.7,
    'Times New Roman',
    '11pt',
    'tqt_exam_only',
    'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    'KIỂM TRA HỌC KỲ I',
    false,
    'dotted_lines',
    '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào phiếu trả lời trắc nghiệm)',
    '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    'tqt_matrix'
),
(
    '22222222-2222-2222-2222-222222222202',
    'Mẫu TQT - Kèm thông tin thí sinh (TQT_Template_Sinh_hoc.docx)',
    'Mẫu đề thi chuẩn Trường THCS - THPT Trần Quốc Tuấn (Sinh học): Header 2 cột 2 hàng, có dòng điền Họ tên & Số báo danh trực tiếp trên đề, không kể thời gian phát đề, lề 1.27cm.',
    false,
    'A4',
    'portrait',
    12.7,
    12.7,
    12.7,
    12.7,
    'Times New Roman',
    '11pt',
    'tqt_with_student_info',
    'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    'ĐỀ KIỂM TRA HỌC KỲ I',
    true,
    'dotted_lines',
    '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào đề thi)',
    '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    'tqt_matrix'
),
(
    '33333333-3333-3333-3333-333333333303',
    'Mẫu Chuẩn Bộ GD&ĐT (Khung thí sinh 4 ô)',
    'Mẫu chuẩn phòng thi với khung viền hình chữ nhật điền Họ tên, Lớp, Số báo danh, Phòng thi.',
    false,
    'A4',
    'portrait',
    15.0,
    15.0,
    15.0,
    15.0,
    'Times New Roman',
    '11pt',
    'boxed_student_info',
    'TRƯỜNG THPT CHUYÊN THI CỬ',
    'KỲ THI TRẮC NGHIỆM TRỰC TUYẾN',
    true,
    'grid_box',
    '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào tờ phiếu hoặc làm bài tự luận theo yêu cầu)',
    '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    'bubble_grid'
),
(
    '44444444-4444-4444-4444-444444444404',
    'Mẫu Tiết kiệm giấy Khổ A5',
    'Mẫu khổ giấy A5 nhỏ gọn, lề 10mm, cỡ chữ 10pt, phù hợp in đề kiểm tra 15 phút hoặc 45 phút tiết kiệm tối đa trang in.',
    false,
    'A5',
    'portrait',
    10.0,
    10.0,
    10.0,
    10.0,
    'Times New Roman',
    '10pt',
    'tqt_exam_only',
    'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    'BÀI KIỂM TRA THƯỜNG XUYÊN',
    false,
    'dotted_lines',
    '(Đề thi gồm {total_questions} câu hỏi)',
    '------ HẾT ------',
    'tqt_matrix'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    paper_size = EXCLUDED.paper_size,
    orientation = EXCLUDED.orientation,
    margin_top = EXCLUDED.margin_top,
    margin_bottom = EXCLUDED.margin_bottom,
    margin_left = EXCLUDED.margin_left,
    margin_right = EXCLUDED.margin_right,
    font_family = EXCLUDED.font_family,
    font_size = EXCLUDED.font_size,
    header_style = EXCLUDED.header_style,
    school_name = EXCLUDED.school_name,
    exam_title = EXCLUDED.exam_title,
    show_student_box = EXCLUDED.show_student_box,
    student_box_style = EXCLUDED.student_box_style,
    instruction_note = EXCLUDED.instruction_note,
    footer_text = EXCLUDED.footer_text,
    answer_table_style = EXCLUDED.answer_table_style,
    updated_at = now();
