export interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  paper_size: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin_top: number;     // in mm
  margin_bottom: number;  // in mm
  margin_left: number;    // in mm
  margin_right: number;   // in mm
  font_family: string;
  font_size: string;
  header_style: 'tqt_exam_only' | 'tqt_with_student_info' | 'boxed_student_info' | 'simple';
  school_name: string;
  exam_title: string;
  show_student_box: boolean;
  student_box_style: 'grid_box' | 'dotted_lines';
  instruction_note: string;
  footer_text: string;
  show_page_number: boolean;
  answer_table_style: 'tqt_matrix' | 'bubble_grid';
  created_at?: string;
  updated_at?: string;
}

export const BUILTIN_PRINT_TEMPLATES: PrintTemplate[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Mẫu TQT - Không dòng thí sinh (TQT_template.docx)',
    description: 'Mẫu đề thi chuẩn Trường THCS - THPT Trần Quốc Tuấn: Header 2 cột cân đối, không dòng tên (làm bài vào phiếu trắc nghiệm riêng), lề hẹp 1.27cm tiết kiệm giấy.',
    is_default: true,
    paper_size: 'A4',
    orientation: 'portrait',
    margin_top: 12.7,
    margin_bottom: 12.7,
    margin_left: 12.7,
    margin_right: 12.7,
    font_family: 'Times New Roman',
    font_size: '11pt',
    header_style: 'tqt_exam_only',
    school_name: 'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    exam_title: 'KIỂM TRA HỌC KỲ I',
    show_student_box: false,
    student_box_style: 'dotted_lines',
    instruction_note: '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào phiếu trả lời trắc nghiệm)',
    footer_text: '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    show_page_number: true,
    answer_table_style: 'tqt_matrix',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Mẫu TQT - Kèm thông tin thí sinh (TQT_Template_Sinh_hoc.docx)',
    description: 'Mẫu đề thi chuẩn Trường THCS - THPT Trần Quốc Tuấn (Sinh học): Header 2 cột 2 hàng, có dòng điền Họ tên & Số báo danh trực tiếp trên đề, không kể thời gian phát đề, lề 1.27cm.',
    is_default: false,
    paper_size: 'A4',
    orientation: 'portrait',
    margin_top: 12.7,
    margin_bottom: 12.7,
    margin_left: 12.7,
    margin_right: 12.7,
    font_family: 'Times New Roman',
    font_size: '11pt',
    header_style: 'tqt_with_student_info',
    school_name: 'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    exam_title: 'ĐỀ KIỂM TRA HỌC KỲ I',
    show_student_box: true,
    student_box_style: 'dotted_lines',
    instruction_note: '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào đề thi)',
    footer_text: '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    show_page_number: true,
    answer_table_style: 'tqt_matrix',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Mẫu Chuẩn Bộ GD&ĐT (Khung thí sinh 4 ô)',
    description: 'Mẫu chuẩn phòng thi với khung viền hình chữ nhật điền Họ tên, Lớp, Số báo danh, Phòng thi.',
    is_default: false,
    paper_size: 'A4',
    orientation: 'portrait',
    margin_top: 15.0,
    margin_bottom: 15.0,
    margin_left: 15.0,
    margin_right: 15.0,
    font_family: 'Times New Roman',
    font_size: '11pt',
    header_style: 'boxed_student_info',
    school_name: 'TRƯỜNG THPT CHUYÊN THI CỬ',
    exam_title: 'KỲ THI TRẮC NGHIỆM TRỰC TUYẾN',
    show_student_box: true,
    student_box_style: 'grid_box',
    instruction_note: '(Đề thi gồm {total_questions} câu hỏi. Thí sinh trả lời trực tiếp vào tờ phiếu hoặc làm bài tự luận theo yêu cầu)',
    footer_text: '------ HẾT ------\nCán bộ coi thi không giải thích gì thêm.',
    show_page_number: true,
    answer_table_style: 'bubble_grid',
  },
  {
    id: '44444444-4444-4444-4444-444444444404',
    name: 'Mẫu Tiết kiệm giấy Khổ A5',
    description: 'Mẫu khổ giấy A5 nhỏ gọn, lề 10mm, cỡ chữ 10pt, phù hợp in đề kiểm tra 15 phút hoặc 45 phút tiết kiệm tối đa trang in.',
    is_default: false,
    paper_size: 'A5',
    orientation: 'portrait',
    margin_top: 10.0,
    margin_bottom: 10.0,
    margin_left: 10.0,
    margin_right: 10.0,
    font_family: 'Times New Roman',
    font_size: '10pt',
    header_style: 'tqt_exam_only',
    school_name: 'TRƯỜNG THCS- THPT TRẦN QUỐC TUẤN',
    exam_title: 'BÀI KIỂM TRA THƯỜNG XUYÊN',
    show_student_box: false,
    student_box_style: 'dotted_lines',
    instruction_note: '(Đề thi gồm {total_questions} câu hỏi)',
    footer_text: '------ HẾT ------',
    show_page_number: true,
    answer_table_style: 'tqt_matrix',
  }
];
