import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Fallback to check online-exam folder env
if not os.getenv("SUPABASE_URL"):
    load_dotenv(dotenv_path="../online-exam/.env.local")
if not os.getenv("SUPABASE_URL"):
    load_dotenv(dotenv_path="../online-exam/.env")

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def import_demo():
    if not supabase_url or not supabase_key:
        print("⚠️ LỖI: Không tìm thấy Supabase URL hoặc Key trong file .env!")
        print("Vui lòng cấu hình các biến môi trường trong file `.env` ở thư mục `offline-parser/` trước.")
        return

    print("🔌 Đang kết nối tới Supabase...")
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # 1. Subject (Sinh học)
        subject_id = "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6"
        print("📚 Đang tạo môn học 'Sinh học'...")
        supabase.table("subjects").upsert({
            "id": subject_id,
            "name": "Sinh học",
            "description": "Môn Sinh học Trung học phổ thông"
        }).execute()

        # 2. Class (12A1)
        class_id = "f1e2d3c4-b5a6-7988-9706-e5f4d3c2b1a0"
        print("🏫 Đang tạo lớp học '12A1'...")
        supabase.table("classes").upsert({
            "id": class_id,
            "name": "12A1",
            "grade": "12"
        }).execute()

        # 3. Student Demo
        print("👨‍🎓 Đang tạo học sinh demo 'Học sinh Demo'...")
        supabase.table("students").upsert({
            "id": "d3f2a1b0-c4e5-6f7a-8b9c-0d1e2f3a4b5c",
            "name": "Học sinh Demo",
            "email": "hocsinh.demo@gmail.com",
            "phone": "0988888888",
            "class_id": class_id
        }).execute()

        # 4. Questions
        questions = [
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Phân tử DNA được đánh dấu $^{15}\\text{N}$ trên cả 2 mạch đơn tiến hành nhân đôi trong môi trường chỉ có $^{14}\\text{N}$. Sau ít nhất mấy đợt nhân đôi thì sẽ xuất hiện loại DNA có cả 2 mạch đều chỉ chứa $^{14}\\text{N}$?",
                "options": {"A": "2", "B": "3", "C": "4", "D": "1"},
                "correct_answer": "A",
                "explanation": "Đợt 1: Tạo ra 2 phân tử DNA lai (15N-14N). Đợt 2: Tạo ra 4 phân tử DNA, trong đó có 2 phân tử DNA lai (15N-14N) và 2 phân tử DNA hoàn toàn chứa 14N (14N-14N). Do đó sau ít nhất 2 đợt nhân đôi thì xuất hiện loại DNA có cả 2 mạch chỉ chứa 14N.",
                "difficulty": "Medium"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Ở sinh vật nhân thực, trình tự nucleotide trong vùng mã hóa của gene cấu trúc nhưng không mã hóa amino acid được gọi là gì?",
                "options": {"A": "vùng O", "B": "đoạn intron", "C": "gene phân mảnh", "D": "đoạn exon"},
                "correct_answer": "B",
                "explanation": "Trong vùng mã hóa của gene ở sinh vật nhân thực có chứa các đoạn intron (không mã hóa amino acid) và các đoạn exon (mã hóa amino acid).",
                "difficulty": "Easy"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Phát biểu nào sau đây đúng khi nói về đặc điểm chung của phân tử DNA, RNA và protein?",
                "options": {"A": "Đều có 4 loại đơn phân.", "B": "Các đơn phân đều liên kết với nhau bằng liên kết phosphodiester.", "C": "Đơn phân đều là nucleotide.", "D": "Đều cấu tạo theo nguyên tắc đa phân."},
                "correct_answer": "D",
                "explanation": "DNA, RNA và protein đều là các đại phân tử sinh học được cấu tạo theo nguyên tắc đa phân (DNA đơn phân là nucleotide A, T, G, C; RNA đơn phân là A, U, G, C; Protein đơn phân là các amino acid).",
                "difficulty": "Easy"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Trong quá trình nhân đôi DNA, enzyme DNA polymerase có vai trò nào sau đây?",
                "options": {"A": "Nối các đoạn Okazaki với nhau.", "B": "Hình thành liên kết phosphodiester giữa các nucleotide tự do theo một nguyên tắc nhất định.", "C": "Bẻ gãy liên kết hydrogen giữa các nucleotide trên 2 mạch khuôn của DNA mẹ.", "D": "Hình thành liên kết hydrogen giữa nucleotide tự do với nucleotide trên mạch khuôn của DNA mẹ."},
                "correct_answer": "B",
                "explanation": "Enzyme DNA polymerase có vai trò xúc tác hình thành liên kết phosphodiester giữa các nucleotide tự do để kéo dài mạch polynucleotide mới.",
                "difficulty": "Medium"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Một phân tử DNA mạch kép có $750$ nucleotide loại adenine. Theo lí thuyết, số nucleotide loại thymine của DNA này là bao nhiêu?",
                "options": {"A": "1500", "B": "375", "C": "250", "D": "750"},
                "correct_answer": "D",
                "explanation": "Theo nguyên tắc bổ sung trong cấu trúc DNA mạch kép, số lượng nucleotide loại Adenine (A) luôn bằng số lượng nucleotide loại Thymine (T). Do đó, T = A = 750.",
                "difficulty": "Easy"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Loại nucleic acid nào sau đây làm khuôn để tổng hợp nên phân tử protein (dịch mã)?",
                "options": {"A": "tRNA", "B": "DNA", "C": "rRNA", "D": "mRNA"},
                "correct_answer": "D",
                "explanation": "mRNA (RNA thông tin) đóng vai trò làm khuôn cho quá trình dịch mã tổng hợp chuỗi polypeptide.",
                "difficulty": "Easy"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Trên phân tử tRNA (RNA vận chuyển), vị trí liên kết với amino acid nằm ở đầu nào?",
                "options": {"A": "Anticodon", "B": "Đầu 5'", "C": "Bộ ba đối mã", "D": "Đầu 3'"},
                "correct_answer": "D",
                "explanation": "Đầu 3' của phân tử tRNA có trình tự nucleotide đặc biệt (thường kết thúc bằng bộ ba ACC) là nơi liên kết với amino acid được vận chuyển.",
                "difficulty": "Medium"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Vật chất di truyền chính của hầu hết các loài sinh vật trên Trái Đất là gì?",
                "options": {"A": "DNA sợi đơn", "B": "DNA sợi kép", "C": "protein", "D": "RNA"},
                "correct_answer": "B",
                "explanation": "Hầu hết các sinh vật nhân sơ và nhân thực đều sử dụng DNA sợi kép làm vật chất di truyền chứa đựng thông tin di truyền.",
                "difficulty": "Easy"
            },
            {
                "subject_id": subject_id,
                "grade": "12",
                "content": "Phát biểu nào sau đây đúng khi nói về gene điều hòa?",
                "options": {"A": "Sản phẩm của nó giúp điều hòa các chỉ tiêu sinh lý trong cơ thể (thân nhiệt, nhịp tim,...).", "B": "Gene điều hòa là một đoạn của phân tử RNA, mã hóa một sản phẩm nhất định.", "C": "Gene điều hòa là các gene không tạo ra sản phẩm trong tế bào.", "D": "Sản phẩm của nó có vai trò kiểm soát hoạt động của các gene khác thông qua tương tác."},
                "correct_answer": "D",
                "explanation": "Gene điều hòa là gene mã hóa cho protein ức chế hoặc hoạt hóa, có vai trò kiểm soát mức độ phiên mã và hoạt động của các gene khác trong tế bào.",
                "difficulty": "Medium"
            }
        ]

        print(f"📝 Đang đẩy {len(questions)} câu hỏi sinh học vào database...")
        for idx, q in enumerate(questions):
            # Check if exists to prevent duplicates
            res = supabase.table("questions").select("id").eq("content", q["content"]).execute()
            if not res.data:
                supabase.table("questions").insert(q).execute()
                print(f"   [+] Đã chèn câu {idx+1}")
            else:
                print(f"   [=] Câu {idx+1} đã tồn tại, bỏ qua")

        print("🎉 THÀNH CÔNG: Đã import toàn bộ dữ liệu demo Sinh Học khối 12 vào hệ thống của bạn!")

    except Exception as e:
        print(f"❌ LỖI trong quá trình import: {str(e)}")

if __name__ == "__main__":
    import_demo()
