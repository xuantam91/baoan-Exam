-- SQL Script to insert Demo Questions extracted from de_thi_sinh_hoc_508.docx

-- 1. Insert Subject (Sinh học)
INSERT INTO subjects (id, name, description)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'Sinh học', 'Môn Sinh học Trung học phổ thông')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Class (12A1)
INSERT INTO classes (id, name, grade)
VALUES ('f1e2d3c4-b5a6-7988-9706-e5f4d3c2b1a0', '12A1', '12')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Student
INSERT INTO students (id, name, email, phone, class_id)
VALUES ('d3f2a1b0-c4e5-6f7a-8b9c-0d1e2f3a4b5c', 'Học sinh Demo', 'hocsinh.demo@gmail.com', '0988888888', 'f1e2d3c4-b5a6-7988-9706-e5f4d3c2b1a0')
ON CONFLICT (email) DO NOTHING;

-- 4. Insert 9 Questions
INSERT INTO questions (subject_id, grade, content, options, correct_answer, explanation, difficulty)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Phân tử DNA được đánh dấu $^{15}\text{N}$ trên cả 2 mạch đơn tiến hành nhân đôi trong môi trường chỉ có $^{14}\text{N}$. Sau ít nhất mấy đợt nhân đôi thì sẽ xuất hiện loại DNA có cả 2 mạch đều chỉ chứa $^{14}\text{N}$?',
 '{"A": "2", "B": "3", "C": "4", "D": "1"}'::jsonb,
 'A',
 'Đợt 1: Tạo ra 2 phân tử DNA lai (15N-14N). Đợt 2: Tạo ra 4 phân tử DNA, trong đó có 2 phân tử DNA lai (15N-14N) và 2 phân tử DNA hoàn toàn chứa 14N (14N-14N). Do đó sau ít nhất 2 đợt nhân đôi thì xuất hiện loại DNA có cả 2 mạch chỉ chứa 14N.',
 'Medium'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Ở sinh vật nhân thực, trình tự nucleotide trong vùng mã hóa của gene cấu trúc nhưng không mã hóa amino acid được gọi là gì?',
 '{"A": "vùng O", "B": "đoạn intron", "C": "gene phân mảnh", "D": "đoạn exon"}'::jsonb,
 'B',
 'Trong vùng mã hóa của gene ở sinh vật nhân thực có chứa các đoạn intron (không mã hóa amino acid) và các đoạn exon (mã hóa amino acid).',
 'Easy'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Phát biểu nào sau đây đúng khi nói về đặc điểm chung của phân tử DNA, RNA và protein?',
 '{"A": "Đều có 4 loại đơn phân.", "B": "Các đơn phân đều liên kết với nhau bằng liên kết phosphodiester.", "C": "Đơn phân đều là nucleotide.", "D": "Đều cấu tạo theo nguyên tắc đa phân."}'::jsonb,
 'D',
 'DNA, RNA và protein đều là các đại phân tử sinh học được cấu tạo theo nguyên tắc đa phân (DNA đơn phân là nucleotide A, T, G, C; RNA đơn phân là A, U, G, C; Protein đơn phân là các amino acid).',
 'Easy'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Trong quá trình nhân đôi DNA, enzyme DNA polymerase có vai trò nào sau đây?',
 '{"A": "Nối các đoạn Okazaki với nhau.", "B": "Hình thành liên kết phosphodiester giữa các nucleotide tự do theo một nguyên tắc nhất định.", "C": "Bẻ gãy liên kết hydrogen giữa các nucleotide trên 2 mạch khuôn của DNA mẹ.", "D": "Hình thành liên kết hydrogen giữa nucleotide tự do với nucleotide trên mạch khuôn của DNA mẹ."}'::jsonb,
 'B',
 'Enzyme DNA polymerase có vai trò xúc tác hình thành liên kết phosphodiester giữa các nucleotide tự do để kéo dài mạch polynucleotide mới.',
 'Medium'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Một phân tử DNA mạch kép có $750$ nucleotide loại adenine. Theo lí thuyết, số nucleotide loại thymine của DNA này là bao nhiêu?',
 '{"A": "1500", "B": "375", "C": "250", "D": "750"}'::jsonb,
 'D',
 'Theo nguyên tắc bổ sung trong cấu trúc DNA mạch kép, số lượng nucleotide loại Adenine (A) luôn bằng số lượng nucleotide loại Thymine (T). Do đó, T = A = 750.',
 'Easy'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Loại nucleic acid nào sau đây làm khuôn để tổng hợp nên phân tử protein (dịch mã)?',
 '{"A": "tRNA", "B": "DNA", "C": "rRNA", "D": "mRNA"}'::jsonb,
 'D',
 'mRNA (RNA thông tin) đóng vai trò làm khuôn cho quá trình dịch mã tổng hợp chuỗi polypeptide.',
 'Easy'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Trên phân tử tRNA (RNA vận chuyển), vị trí liên kết với amino acid nằm ở đầu nào?',
 '{"A": "Anticodon", "B": "Đầu 5''", "C": "Bộ ba đối mã", "D": "Đầu 3''"}'::jsonb,
 'D',
 'Đầu 3'' của phân tử tRNA có trình tự nucleotide đặc biệt (thường kết thúc bằng bộ ba ACC) là nơi liên kết với amino acid được vận chuyển.',
 'Medium'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Vật chất di truyền chính của hầu hết các loài sinh vật trên Trái Đất là gì?',
 '{"A": "DNA sợi đơn", "B": "DNA sợi kép", "C": "protein", "D": "RNA"}'::jsonb,
 'B',
 'Hầu hết các sinh vật nhân sơ và nhân thực đều sử dụng DNA sợi kép làm vật chất di truyền chứa đựng thông tin di truyền.',
 'Easy'),

('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', '12', 
 'Phát biểu nào sau đây đúng khi nói về gene điều hòa?',
 '{"A": "Sản phẩm của nó giúp điều hòa các chỉ tiêu sinh lý trong cơ thể (thân nhiệt, nhịp tim,...).", "B": "Gene điều hòa là một đoạn của phân tử RNA, mã hóa một sản phẩm nhất định.", "C": "Gene điều hòa là các gene không tạo ra sản phẩm trong tế bào.", "D": "Sản phẩm của nó có vai trò kiểm soát hoạt động của các gene khác thông qua tương tác."}'::jsonb,
 'D',
 'Gene điều hòa là gene mã hóa cho protein ức chế hoặc hoạt hóa, có vai trò kiểm soát mức độ phiên mã và hoạt động của các gene khác trong tế bào.',
 'Medium')
ON CONFLICT DO NOTHING;
