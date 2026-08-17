import streamlit as st
import os
import json
import mimetypes
import io
import base64
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client, Client
from PIL import Image

# Set page layout and config
st.set_page_config(
    page_title="AI Exam Parser Pro - Offline Tool",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for custom premium styles (Light/Dark themes support)
st.markdown("""
<style>
    .card {
        background-color: var(--background-color);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 25px;
        border-left: 5px solid #4F46E5;
        border-right: 1px solid #e2e8f0;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
    }
    .saved-card {
        border-left: 5px solid #10B981 !important;
        background-color: rgba(16, 185, 129, 0.02);
    }
    .latex-preview {
        background-color: #f1f5f9;
        padding: 10px;
        border-radius: 5px;
        margin-top: 5px;
        font-family: monospace;
    }
    .stButton>button {
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# Load env file if exists
load_dotenv()

# Background HTTP server to receive pasted images securely bypassing CORS
class UploadHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            parsed_url = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_url.query)
            idx = int(query.get("idx", [0])[0])
            
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            
            data = json.loads(body.decode('utf-8'))
            base64_data = data.get("image", "")
            
            if base64_data.startswith("data:image/"):
                header, encoded = base64_data.split(",", 1)
                img_bytes = base64.b64decode(encoded)
                
                # Write to local disk scratch folder
                os.makedirs("scratch", exist_ok=True)
                with open(f"scratch/temp_paste_{idx}.jpg", "wb") as f:
                    f.write(img_bytes)
                
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

def start_server():
    try:
        server = HTTPServer(('localhost', 8502), UploadHandler)
        server.serve_forever()
    except Exception:
        pass

# Start background server
if "server_started" not in st.session_state:
    st.session_state.server_started = True
    t = threading.Thread(target=start_server, daemon=True)
    t.start()

# Initialize session states
if "subjects" not in st.session_state:
    st.session_state.subjects = []
if "classes" not in st.session_state:
    st.session_state.classes = []
if "parsed_questions" not in st.session_state:
    st.session_state.parsed_questions = []
if "saved_status" not in st.session_state:
    # Tracks which questions in the list have been saved to the DB
    st.session_state.saved_status = {}
if "total_tokens_used" not in st.session_state:
    st.session_state.total_tokens_used = 0
if "show_fireworks" not in st.session_state:
    st.session_state.show_fireworks = False

# Multi-account Gemini configuration states
if "gemini_accounts" not in st.session_state:
    env_key = os.getenv("GEMINI_API_KEY", "")
    if env_key:
        st.session_state.gemini_accounts = [
            {"name": "Tài khoản Mặc định (.env)", "key": env_key, "tokens_used": 0}
        ]
    else:
        st.session_state.gemini_accounts = []
if "active_account_idx" not in st.session_state:
    st.session_state.active_account_idx = 0

if "has_shown_welcome_toast" not in st.session_state:
    st.session_state.has_shown_welcome_toast = True
    st.toast("⚡ Đã khởi động hệ thống offline BaoAn Exam thành công!", icon="🚀")

# Sidebar Configuration
st.sidebar.title("⚙️ Cấu HÌnh Hệ Thốnɡ")

# 1. API Keys & Connections
with st.sidebar.expander("🔑 Cấu hình kết nối Gemini AI & Database", expanded=False):
    # Gemini Multi-account picker & creator
    st.markdown("#### 🤖 Quản lý Tài khoản Gemini")
    
    if st.session_state.gemini_accounts:
        account_options = []
        for i, acc in enumerate(st.session_state.gemini_accounts):
            masked_key = acc["key"][:4] + "..." + acc["key"][-4:] if len(acc["key"]) > 8 else "Key"
            account_options.append(f"{acc['name']} ({masked_key}) - {acc['tokens_used']:,} tokens")
            
        selected_idx = st.selectbox(
            "Tài khoản hoạt động", 
            options=range(len(st.session_state.gemini_accounts)),
            format_func=lambda i: account_options[i],
            index=st.session_state.active_account_idx
        )
        st.session_state.active_account_idx = selected_idx
    else:
        st.warning("Chưa cấu hình tài khoản Gemini nào. Vui lòng thêm bên dưới.")
        
    # Form to add a new account
    with st.expander("➕ Thêm tài khoản Gemini khác", expanded=False):
        new_acc_name = st.text_input("Tên gợi nhớ (ví dụ: Gmail phụ 1)", key="new_acc_name_input")
        new_acc_key = st.text_input("Gemini API Key mới", type="password", key="new_acc_key_input")
        if st.button("Lưu tài khoản Gemini", use_container_width=True):
            if new_acc_key.strip():
                st.session_state.gemini_accounts.append({
                    "name": new_acc_name.strip() or f"Tài khoản {len(st.session_state.gemini_accounts)+1}",
                    "key": new_acc_key.strip(),
                    "tokens_used": 0
                })
                st.session_state.active_account_idx = len(st.session_state.gemini_accounts) - 1
                st.success("Đã thêm tài khoản mới và chọn làm mặc định!")
                st.rerun()
            else:
                st.error("API Key không được trống.")
                
    st.markdown("---")
    st.markdown("#### 🗄️ Supabase Credentials")
    supabase_url = st.text_input(
        "Supabase Project URL", 
        value=os.getenv("SUPABASE_URL", "")
    )
    supabase_key = st.text_input(
        "Supabase Key", 
        value=os.getenv("SUPABASE_KEY", ""), 
        type="password"
    )

# Google Drive Configuration (Optional)
with st.sidebar.expander("📁 Tùy chọn Google Drive (Dự phòng)", expanded=False):
    st.markdown("Cấu hình thư mục lưu trữ ảnh nếu Supabase Storage đầy.")
    gdrive_folder_id = st.text_input("Google Drive Folder ID", value="")

# Connect Supabase helper
def get_supabase_client() -> Client:
    if not supabase_url or not supabase_key:
        return None
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        return None

# Upload to Supabase Storage
def upload_bytes_to_supabase(file_bytes, file_name, bucket_name="question-images"):
    client = get_supabase_client()
    if not client:
        return None
    try:
        # Determine mime type
        mime_type, _ = mimetypes.guess_type(file_name)
        if not mime_type:
            mime_type = "image/png"
            
        # Upload
        client.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
        
        # Get public url
        public_url = client.storage.from_(bucket_name).get_public_url(file_name)
        return public_url
    except Exception as e:
        st.error(f"Lỗi upload ảnh lên Supabase Storage: {e}")
        return None

# Fetch storage metrics
def get_supabase_storage_usage():
    client = get_supabase_client()
    if not client:
        return 0, 1024 * 1024 * 1024 # default 1GB
    try:
        files = client.storage.from_("question-images").list(options={"limit": 1000})
        total_bytes = 0
        if files:
            for f in files:
                metadata = f.get("metadata")
                if metadata:
                    total_bytes += metadata.get("size", 0)
        return total_bytes, 1024 * 1024 * 1024 # 1GB free tier limit
    except Exception:
        return 0, 1024 * 1024 * 1024

# Fetch metadata helper
def fetch_metadata():
    client = get_supabase_client()
    if not client:
        return
    try:
        subjects_res = client.from_("subjects").select("id, name").execute()
        classes_res = client.from_("classes").select("id, name, grade").execute()
        
        st.session_state.subjects = subjects_res.data if subjects_res.data else []
        st.session_state.classes = classes_res.data if classes_res.data else []
    except Exception as e:
        pass

# Auto-fetch categories on startup if Supabase is connected
if supabase_url and supabase_key and "metadata_fetched" not in st.session_state:
    st.session_state.metadata_fetched = True
    fetch_metadata()

# Sidebar resource utilization stats widget
with st.sidebar.expander("📊 Thống kê tài nguyên", expanded=False):
    # 1. Active Account token stats
    if st.session_state.gemini_accounts:
        active_acc = st.session_state.gemini_accounts[st.session_state.active_account_idx]
        st.markdown(f"**Tài khoản:** {active_acc['name']}")
        st.metric("Tokens đã dùng (TK này)", f"{active_acc['tokens_used']:,}")
    st.metric("Tổng Tokens tiêu thụ (Session)", f"{st.session_state.total_tokens_used:,}")
    
    # 2. Storage usage metrics
    st.markdown("---")
    st.markdown("**💾 Dung lượng Supabase Storage**")
    used_bytes, total_bytes = get_supabase_storage_usage()
    used_mb = used_bytes / (1024 * 1024)
    total_mb = total_bytes / (1024 * 1024)
    pct = used_bytes / total_bytes if total_bytes > 0 else 0
    st.progress(pct)
    st.markdown(f"Đã dùng: **{used_mb:.2f} MB** / **{total_mb:.0f} MB** ({pct * 100:.2f}%)")

# Sidebar Buttons
if st.sidebar.button("🔄 Làm mới dữ liệu danh mục", use_container_width=True):
    fetch_metadata()
    st.rerun()

st.sidebar.markdown("---")
if st.sidebar.button("🔴 Tắt ứng dụng (Đóng Server)", use_container_width=True, type="primary"):
    st.sidebar.info("Đang dừng ứng dụng... Bạn có thể đóng tab này.")
    import os
    import signal
    os.kill(os.getpid(), signal.SIGINT)

# Form to quickly add subjects/classes if database is empty
with st.sidebar.expander("➕ Thêm nhanh Môn / Lớp", expanded=False):
    st.markdown("#### Thêm Môn Học")
    new_sub_name = st.text_input("Tên môn học (ví dụ: Toán học)")
    new_sub_desc = st.text_input("Mô tả môn học")
    if st.button("Lưu môn học", use_container_width=True):
        client = get_supabase_client()
        if client and new_sub_name:
            try:
                client.from_("subjects").insert({"name": new_sub_name, "description": new_sub_desc}).execute()
                st.success("Đã thêm môn học!")
                fetch_metadata()
                st.rerun()
            except Exception as e:
                st.error(f"Lỗi: {e}")
        else:
            st.warning("Vui lòng kết nối database và điền tên môn học.")

    st.markdown("---")
    st.markdown("#### Thêm Lớp Học")
    new_class_name = st.text_input("Tên lớp (ví dụ: 10A1)")
    new_class_grade = st.selectbox("Khối lớp", ["10", "11", "12"])
    if st.button("Lưu lớp học", use_container_width=True):
        client = get_supabase_client()
        if client and new_class_name:
            try:
                client.from_("classes").insert({"name": new_class_name, "grade": new_class_grade}).execute()
                st.success("Đã thêm lớp học!")
                fetch_metadata()
                st.rerun()
            except Exception as e:
                st.error(f"Lỗi: {e}")
        else:
            st.warning("Vui lòng kết nối database và điền tên lớp.")

# MAIN AREA
st.title("🤖 Trợ Lý AI Bóc Tách Đề Thi & Tạo Câu Hỏi")
st.write("Bóc tách nội dung câu hỏi và đáp án bằng AI nhanh gọn. User tự kéo thả / dán ảnh minh họa cho mỗi câu hỏi khi kiểm duyệt.")

# Dynamic Dropdown configurations
col1, col2 = st.columns(2)
with col1:
    if st.session_state.subjects:
        subject_options = {s["name"]: s["id"] for s in st.session_state.subjects}
        selected_subject_name = st.selectbox("Chọn Môn Học", list(subject_options.keys()))
        selected_subject_id = subject_options[selected_subject_name]
    else:
        st.selectbox("Chọn Môn Học", ["Vui lòng kết nối database trong sidebar để tải môn"], disabled=True)
        selected_subject_id = None

with col2:
    grades = ["10", "11", "12"]
    selected_grade = st.selectbox("Chọn Khối Lớp (Grade)", grades)

# Fetch chapters & lessons for default assignment
default_chapter_id = None
default_lesson_id = None
default_chapters_list = []
default_lessons_list = []

if selected_subject_id:
    try:
        client = get_supabase_client()
        if client:
            chap_res = client.table("chapters").select("id, title").eq("subject_id", selected_subject_id).eq("grade", selected_grade).order("created_at").execute()
            if chap_res.data:
                default_chapters_list = chap_res.data
    except Exception as e:
        pass

col_chap, col_les = st.columns(2)
with col_chap:
    chap_options = {"-- Không chọn (Mặc định) --": None}
    for c in default_chapters_list:
        chap_options[c["title"]] = c["id"]
    selected_chap_title = st.selectbox("Chọn Chương Mặc Định", list(chap_options.keys()), help="Tự động gán chương này cho tất cả câu hỏi được bóc tách.")
    default_chapter_id = chap_options[selected_chap_title]

if default_chapter_id:
    try:
        client = get_supabase_client()
        if client:
            les_res = client.table("lessons").select("id, title").eq("chapter_id", default_chapter_id).order("created_at").execute()
            if les_res.data:
                default_lessons_list = les_res.data
    except Exception as e:
        pass

with col_les:
    les_options = {"-- Không chọn (Mặc định) --": None}
    for l in default_lessons_list:
        les_options[l["title"]] = l["id"]
    selected_les_title = st.selectbox("Chọn Bài Học Mặc Định", list(les_options.keys()), disabled=not default_chapter_id, help="Tự động gán bài học này cho tất cả câu hỏi được bóc tách.")
    default_lesson_id = les_options[selected_les_title]

# File Uploader
uploaded_file = st.file_uploader(
    "Tải lên Đề thi (PDF, Word hoặc File Ảnh chụp)", 
    type=["pdf", "docx", "png", "jpg", "jpeg"],
    help="Hỗ trợ file PDF, Word (.docx) hoặc file ảnh chụp đề thi"
)

# AI Question Parser Definition
def parse_exam_with_gemini(file_bytes, file_name):
    # Fetch active key from accounts
    active_key = ""
    if st.session_state.gemini_accounts and len(st.session_state.gemini_accounts) > st.session_state.active_account_idx:
        active_key = st.session_state.gemini_accounts[st.session_state.active_account_idx]["key"]
        
    if not active_key:
        st.error("Vui lòng cấu hình ít nhất một tài khoản Gemini API Key trong Sidebar để bắt đầu bóc tách.")
        return []
    
    # Identify mime-type
    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        if file_name.endswith('.pdf'):
            mime_type = 'application/pdf'
        elif file_name.endswith('.docx'):
            mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            mime_type = 'image/png'

    # Define Schema for JSON Structured Outputs
    response_schema = {
        "type": "ARRAY",
        "description": "Danh sách các câu hỏi bóc tách được từ đề thi.",
        "items": {
            "type": "OBJECT",
            "properties": {
                "question_type": {
                    "type": "STRING",
                    "enum": ["MultipleChoice", "TrueFalse", "FillIn", "Essay"],
                    "description": "Phân loại câu hỏi: 'MultipleChoice' (Trắc nghiệm nhiều lựa chọn), 'TrueFalse' (Trắc nghiệm đúng sai tổ hợp gồm nhiều ý a, b, c, d), 'FillIn' (Trắc nghiệm trả lời ngắn / điền số), 'Essay' (Tự luận cần chấm tay)."
                },
                "content": {
                    "type": "STRING", 
                    "description": "Nội dung câu hỏi. Hãy bóc tách chính xác như trong tài liệu đề bài tải lên, giữ nguyên tất cả công thức toán lý hóa dưới dạng LaTeX chuẩn (bọc trong ký tự $ hoặc $$)."
                },
                "options": {
                    "type": "ARRAY",
                    "description": "Danh sách phương án lựa chọn được trích xuất nguyên bản từ đề (ví dụ: các đáp án A, B, C, D, E...). Không tự tạo đáp án nhiễu mới. Đối với FillIn và Essay: Hãy để danh sách rỗng [].",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "key": {"type": "STRING", "description": "Ký tự phương án (ví dụ 'A', 'B', 'C', 'D', 'E' hoặc 'a', 'b', 'c', 'd')."},
                            "text": {"type": "STRING", "description": "Nội dung phương án."}
                        },
                        "required": ["key", "text"]
                    }
                },
                "correct_answer": {
                    "type": "STRING", 
                    "description": "Đáp án đúng. Đối với MultipleChoice: điền chữ cái (ví dụ 'A', hoặc danh sách ngăn cách bằng dấu phẩy 'A,C' nếu có nhiều đáp án đúng). Đối với TrueFalse: Chuỗi JSON lưu kết quả Đúng/Sai của các ý a, b, c, d (ví dụ '{\"a\":\"Đ\",\"b\":\"S\",\"c\":\"Đ\",\"d\":\"S\"}'). Đối với FillIn: Chuỗi kết quả ngắn."
                },
                "explanation": {
                    "type": "STRING", 
                    "description": "Lời giải chi tiết nếu có trong tài liệu, hoặc tự suy luận. Giữ nguyên định dạng LaTeX."
                },
                "difficulty": {
                    "type": "STRING", 
                    "enum": ["Easy", "Medium", "Hard"],
                    "description": "Độ khó ước lượng."
                }
            },
            "required": ["question_type", "content", "options", "correct_answer", "explanation", "difficulty"]
        }
    }

    try:
        # Initialize Google GenAI client with active key
        client = genai.Client(api_key=active_key)
        
        system_instruction = (
            "Bạn là trợ lý AI chuyên nghiệp phân tích đề thi trắc nghiệm Việt Nam. "
            "Nhiệm vụ của bạn là bóc tách tất cả các câu hỏi thuộc các nhóm: "
            "MultipleChoice (Trắc nghiệm có các lựa chọn A, B, C, D, E...), TrueFalse (Đúng sai có các mệnh đề a, b, c, d), FillIn (Điền khuyết), Essay (Tự luận). "
            "BẮT BUỘC: Chỉ lấy chính xác các nội dung và phương án lựa chọn thực tế ghi trên tài liệu đề bài, tuyệt đối KHÔNG tự sáng chế hay tạo thêm các phương án nhiễu (distractor options) khác ngoài các phương án ghi sẵn trong đề. "
            "Quan trọng: Bắt buộc giữ nguyên công thức Toán học, Vật lý, Hóa học dạng mã LaTeX."
        )

        # Define the custom pulsing double-ring loader
        loading_placeholder = st.empty()
        loader_html = """
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background-color: #0f172a; border-radius: 16px; border: 2px solid #334155; text-align: center; font-family: 'Courier New', Courier, monospace; color: #38bdf8; box-shadow: 0 10px 25px rgba(0,0,0,0.3); height: 230px; box-sizing: border-box;">
            
            <!-- Animated AI Face / Terminal Screen -->
            <div class="terminal-screen" style="position: relative; width: 120px; height: 90px; background-color: #1e293b; border-radius: 12px; border: 3px solid #64748b; padding: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 15px #000; margin: 0 auto 15px auto; box-sizing: border-box;">
                <!-- Animated Robot Eyes -->
                <div style="display: flex; gap: 20px; z-index: 2;">
                    <div class="eye" style="width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; box-shadow: 0 0 15px #22c55e; animation: blink 1.5s infinite alternate;"></div>
                    <div class="eye" style="width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; box-shadow: 0 0 15px #22c55e; animation: blink 1.5s infinite alternate; animation-delay: 0.2s;"></div>
                </div>
                <!-- Scanline effect -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 4px, 6px 100%; z-index: 3; pointer-events: none;"></div>
                <!-- Radar sweep line -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 10px #22c55e; animation: sweep 2.5s linear infinite; z-index: 1;"></div>
            </div>

            <style>
                @keyframes blink {
                    0%, 80% { transform: scaleY(1); }
                    90%, 100% { transform: scaleY(0.1); }
                }
                @keyframes sweep {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            </style>

            <div style="font-size: 15px; font-weight: bold; color: #4ade80; margin-bottom: 12px; letter-spacing: 1px;">
                ⚡ SYSTEM: AI AGENT IS PROCESSING EXAM...
            </div>

            <!-- Cycling Terminal Console Log Messages -->
            <div style="font-size: 13px; color: #94a3b8; min-height: 42px; text-align: left; background: #020617; padding: 12px 20px; border-radius: 8px; border: 1px solid #1e293b; width: 100%; max-width: 500px; margin: 0 auto; display: flex; align-items: center; box-sizing: border-box;">
                <span style="color: #38bdf8; margin-right: 8px;">$ </span><span id="log-text">Analyzing document layout and structure...</span>
            </div>

            <script>
                var logs = [
                  "Đang khởi tạo kết nối bộ não Gemini API...",
                  "Đang quét tệp tài liệu & xác định cấu trúc phân trang...",
                  "Phát hiện công thức phức tạp... Đang mã hóa sang LaTeX...",
                  "AI đang đọc kỹ đề thi & đề xuất đáp án chính xác nhất...",
                  "Đang phân loại độ khó & soạn lời giải chi tiết...",
                  "Đang đóng gói cấu trúc dữ liệu JSON để gửi về web...",
                  "Kiểm tra chất lượng hoàn tất! Đang hiển thị kết quả..."
                ];
                var currentIdx = 0;
                setInterval(function() {
                  currentIdx = (currentIdx + 1) % logs.length;
                  var el = document.getElementById('log-text');
                  if (el) el.innerText = logs[currentIdx];
                }, 2200);
            </script>
        </div>
        """
        with loading_placeholder.container():
            st.components.v1.html(loader_html, height=270)

        try:
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=[
                    types.Part.from_bytes(
                        data=file_bytes,
                        mime_type=mime_type
                    ),
                    "Hãy phân tích đề thi này, trích xuất nguyên bản tất cả câu hỏi và đáp án đúng, trả về kết quả JSON theo cấu trúc quy định."
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )
            
            # Record Token consumption stats dynamically
            token_count = 0
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                token_count = response.usage_metadata.total_token_count
                
                # Update current active account tokens
                if len(st.session_state.gemini_accounts) > st.session_state.active_account_idx:
                    st.session_state.gemini_accounts[st.session_state.active_account_idx]["tokens_used"] += token_count
                st.session_state.total_tokens_used += token_count
                
            questions = json.loads(response.text)
            
            # Convert options from Array to Dict for backward compatibility
            for q in questions:
                opts_list = q.get("options", [])
                opts_dict = {}
                if isinstance(opts_list, list):
                    for opt in opts_list:
                        if isinstance(opt, dict) and "key" in opt and "text" in opt:
                            opts_dict[opt["key"]] = opt["text"]
                q["options"] = opts_dict

            return questions
        finally:
            loading_placeholder.empty()
            
    except Exception as e:
        # Check if the error looks like a quota limit error, and if there are other keys
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            # Automatic key switching logic!
            next_idx = st.session_state.active_account_idx + 1
            if len(st.session_state.gemini_accounts) > next_idx:
                st.session_state.active_account_idx = next_idx
                st.sidebar.warning(f"⚠️ Tài khoản vừa dùng hết hạn mức quota! Tự động chuyển sang: {st.session_state.gemini_accounts[next_idx]['name']}")
                # Retry calling with new key
                return parse_exam_with_gemini(file_bytes, file_name)
            else:
                st.error("Tất cả tài khoản Gemini cấu hình đều đã hết quota hạn mức!")
        else:
            st.error(f"Lỗi gọi Gemini API hoặc phân tích kết quả: {error_msg}")
        return []

# Run parsing action
if uploaded_file is not None:
    if st.button("🚀 Bóc Tách AI", use_container_width=True):
        file_bytes = uploaded_file.read()
        questions = parse_exam_with_gemini(file_bytes, uploaded_file.name)
        if questions:
            st.session_state.parsed_questions = questions
            st.session_state.saved_status = {} # Reset saved status
            st.success(f"Đã bóc tách thành công {len(questions)} câu hỏi! Hãy kiểm duyệt bên dưới.")

# Image optimization helper
def optimize_image(image_bytes, max_width=900, quality=80):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA/P to RGB (JPEG requires no alpha channel)
        if img.mode in ("RGBA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        
        # Resize if width exceeds max_width
        if img.width > max_width:
            aspect_ratio = img.height / img.width
            new_width = max_width
            new_height = int(new_width * aspect_ratio)
            try:
                resample_filter = Image.Resampling.LANCZOS
            except AttributeError:
                resample_filter = Image.ANTIALIAS
            img = img.resize((new_width, new_height), resample_filter)
        
        # Save as optimized JPEG
        out_bytes = io.BytesIO()
        img.save(out_bytes, format="JPEG", quality=quality, optimize=True)
        return out_bytes.getvalue()
    except Exception as e:
        st.warning(f"Không thể tối ưu hóa ảnh, giữ nguyên bản gốc: {e}")
        return image_bytes

# Common save question logic
def save_question(idx, show_balloons=True):
    if not selected_subject_id:
        st.error("Lỗi: Chưa chọn Môn Học!")
        return False
    
    # Read active values from session state
    content_val = st.session_state.get(f"content_{idx}", "").strip()
    if not content_val:
        st.error("Lỗi: Chưa nhập nội dung câu hỏi!")
        return False
        
    type_val = st.session_state.get(f"qtype_{idx}", "MultipleChoice")
    explanation_val = st.session_state.get(f"explanation_{idx}", "").strip()
    diff_val = st.session_state.get(f"difficulty_{idx}", "Medium")
    
    # Re-calculate correct answer and options based on type
    opts_val = {}
    correct_val = ""
    
    if type_val == "MultipleChoice":
        alphabet = "ABCDEFGH"
        num_opt_val = st.session_state.get(f"num_opt_{idx}", 4)
        for o_idx in range(num_opt_val):
            key = alphabet[o_idx]
            opts_val[key] = st.session_state.get(f"opt_{key}_{idx}", "")
        # Read multiselect value from session state
        selected_correct = st.session_state.get(f"correct_{idx}", [])
        correct_val = ",".join(sorted(selected_correct))
    elif type_val == "TrueFalse":
        tf_correct = {}
        for key in ['a', 'b', 'c', 'd']:
            opts_val[key] = st.session_state.get(f"tf_opt_{key}_{idx}", "")
            ans_val = st.session_state.get(f"tf_ans_{key}_{idx}", "Đúng")
            tf_correct[key] = "Đ" if ans_val == "Đúng" else "S"
        correct_val = json.dumps(tf_correct)
    elif type_val == "FillIn":
        correct_val = st.session_state.get(f"fill_{idx}", "")
    elif type_val == "Essay":
        correct_val = st.session_state.get(f"essay_key_{idx}", "")

    try:
        client = get_supabase_client()
        final_img_url = None
        
        # Upload image if present (with resolution and format optimization to JPEG)
        img_key = f"image_bytes_{idx}"
        if st.session_state.get(img_key):
            optimized_bytes = optimize_image(st.session_state[img_key])
            file_name = f"question_{idx}_{selected_subject_id}_{selected_grade}.jpg"
            final_img_url = upload_bytes_to_supabase(optimized_bytes, file_name)
        
        # Resolve chapter & lesson for this question card
        q_chap_id = None
        q_les_id = None
        
        chap_title = st.session_state.get(f"card_chap_title_{idx}")
        if chap_title and chap_title != "-- Mặc định / Không --":
            q_chap_id = next((c["id"] for c in default_chapters_list if c["title"] == chap_title), None)
            
        if q_chap_id:
            les_title = st.session_state.get(f"card_les_title_{idx}")
            if les_title and les_title != "-- Mặc định / Không --":
                try:
                    client_meta = get_supabase_client()
                    if client_meta:
                        les_res = client_meta.table("lessons").select("id, title").eq("chapter_id", q_chap_id).execute()
                        if les_res.data:
                            q_les_id = next((l["id"] for l in les_res.data if l["title"] == les_title), None)
                except Exception:
                    pass

        payload = {
            "subject_id": selected_subject_id,
            "grade": selected_grade,
            "question_type": type_val,
            "content": content_val,
            "options": opts_val,
            "correct_answer": correct_val,
            "explanation": explanation_val,
            "difficulty": diff_val,
            "image_url": final_img_url,
            "chapter_id": q_chap_id,
            "lesson_id": q_les_id
        }
        
        client.from_("questions").insert(payload).execute()
        st.session_state.saved_status[idx] = True
        st.toast(f"Đã lưu câu hỏi {idx+1}!")
        
        # Check if all questions are now saved
        unsaved_rem = [i for i in range(len(st.session_state.parsed_questions)) if not st.session_state.saved_status.get(i, False)]
        if len(unsaved_rem) == 0:
            st.session_state.show_fireworks = True
        elif show_balloons:
            st.balloons()
        return True
    except Exception as e:
        st.error(f"Lỗi khi lưu câu hỏi {idx+1}: {e}")
        return False

# INTERACTIVE HUMAN-IN-THE-LOOP PREVIEW/EDIT AREA
if st.session_state.parsed_questions:
    st.markdown("---")
    st.subheader("🔍 Khu Vực Kiểm Duyệt & Biên Tập Câu Hỏi (Human-in-the-loop)")
    st.write("Vui lòng kiểm tra kỹ nội dung câu hỏi, chụp màn hình dán ảnh minh họa hoặc tải ảnh từ máy nếu cần, rồi bấm **Lưu Câu Này**.")

    # Display each parsed question in a card-like editor
    for idx, q in enumerate(st.session_state.parsed_questions):
        is_saved = st.session_state.saved_status.get(idx, False)
        card_class = "card saved-card" if is_saved else "card"
        
        st.markdown(f"<div class='{card_class}'>", unsafe_allow_html=True)
        col_header_left, col_header_right = st.columns([3, 1])
        
        with col_header_left:
            st.markdown(f"### Câu Hỏi {idx + 1} { '✅ (Đã lưu)' if is_saved else '⏳ (Chưa lưu)'}")
        with col_header_right:
            if st.button(f"🗑️ Xóa Câu {idx + 1}", key=f"del_{idx}"):
                st.session_state.parsed_questions.pop(idx)
                # Adjust saved_status keys
                new_saved = {}
                for k, v in st.session_state.saved_status.items():
                    if k < idx:
                        new_saved[k] = v
                    elif k > idx:
                        new_saved[k - 1] = v
                st.session_state.saved_status = new_saved
                st.rerun()
        
        # Split inputs layout (Inputs on left, Beautiful unified Image Dropzone on right)
        col_left_inputs, col_right_image = st.columns([5, 3])
        
        with col_left_inputs:
            # Question Type Select
            q_type = st.selectbox(
                "Loại câu hỏi", 
                ["MultipleChoice", "TrueFalse", "FillIn", "Essay"], 
                index=["MultipleChoice", "TrueFalse", "FillIn", "Essay"].index(q.get("question_type", "MultipleChoice")),
                key=f"qtype_{idx}",
                disabled=is_saved
            )
            
            # Question Content Area
            content = st.text_area(
                f"Nội dung câu hỏi {idx+1}", 
                value=q.get("content", ""), 
                key=f"content_{idx}", 
                height=90,
                disabled=is_saved
            )
            
            # LaTeX Preview Helper
            if "$" in content:
                with st.expander("👀 Xem trước Latex", expanded=False):
                    st.markdown(content)

            # OPTIONS & ANSWERS DYNAMIC FORMS BY TYPE
            opts = q.get("options", {})
            correct_answer = q.get("correct_answer", "")
            
            st.markdown("##### 🔑 Đáp án và cấu hình phương án")

            if q_type == "MultipleChoice":
                if not opts:
                    opts = {"A": "", "B": "", "C": "", "D": ""}
                
                opt_keys = list(opts.keys())
                num_opts = st.number_input(
                    f"Số lượng đáp án câu {idx+1}", 
                    min_value=2, 
                    max_value=8, 
                    value=len(opt_keys), 
                    key=f"num_opt_{idx}",
                    disabled=is_saved
                )
                
                alphabet = "ABCDEFGH"
                new_opts = {}
                cols = st.columns(2)
                for o_idx in range(num_opts):
                    key = alphabet[o_idx]
                    default_val = opts.get(key, "")
                    col_el = cols[o_idx % 2]
                    with col_el:
                        new_opts[key] = st.text_input(
                            f"Phương án {key}", 
                            value=default_val, 
                            key=f"opt_{key}_{idx}",
                            disabled=is_saved
                        )
                opts = new_opts
                
                correct_list = list(opts.keys())
                
                # MULTI-SELECT SUPPORT FOR MULTIPLE CHOICE
                # Decode comma-separated string correct answers if any
                default_correct = [c for c in correct_answer.split(",") if c in correct_list]
                
                selected_correct = st.multiselect(
                    "Phương án đúng (Chọn 1 hoặc nhiều đáp án đúng)",
                    options=correct_list,
                    default=default_correct,
                    key=f"correct_{idx}",
                    disabled=is_saved
                )
                correct_answer = ",".join(sorted(selected_correct))

            elif q_type == "TrueFalse":
                if not opts or list(opts.keys()) != ['a', 'b', 'c', 'd']:
                    opts = {"a": "", "b": "", "c": "", "d": ""}
                
                try:
                    tf_correct = json.loads(correct_answer)
                except Exception:
                    tf_correct = {"a": "Đ", "b": "Đ", "c": "Đ", "d": "Đ"}

                new_opts = {}
                new_correct = {}
                
                for key in ['a', 'b', 'c', 'd']:
                    col_txt, col_ans = st.columns([3, 1])
                    with col_txt:
                        new_opts[key] = st.text_input(
                            f"Mệnh đề {key}", 
                            value=opts.get(key, ""), 
                            key=f"tf_opt_{key}_{idx}",
                            disabled=is_saved
                        )
                    with col_ans:
                        default_tf_val = tf_correct.get(key, "Đ")
                        tf_index = 0 if default_tf_val == "Đ" else 1
                        ans_val = st.selectbox(
                            f"Đ/S {key}", 
                            ["Đúng", "Sai"], 
                            index=tf_index, 
                            key=f"tf_ans_{key}_{idx}",
                            disabled=is_saved
                        )
                        new_correct[key] = "Đ" if ans_val == "Đúng" else "S"
                opts = new_opts
                correct_answer = json.dumps(new_correct)

            elif q_type == "FillIn":
                opts = {}
                correct_answer = st.text_input(
                    "Kết quả đúng cần điền", 
                    value=correct_answer, 
                    key=f"fill_{idx}",
                    disabled=is_saved
                )

            elif q_type == "Essay":
                opts = {}
                correct_answer = st.text_area(
                    "Ý chính cần đạt / Hướng dẫn chấm", 
                    value=correct_answer, 
                    key=f"essay_key_{idx}",
                    disabled=is_saved
                )

            # Difficulty & Explanation
            c_diff, c_chap, c_les = st.columns([1, 1.5, 1.5])
            with c_diff:
                diff_list = ["Easy", "Medium", "Hard"]
                default_diff_idx = diff_list.index(q.get("difficulty", "Medium")) if q.get("difficulty", "Medium") in diff_list else 1
                difficulty = st.selectbox(
                    "Độ khó", 
                    diff_list, 
                    index=default_diff_idx, 
                    key=f"difficulty_{idx}",
                    disabled=is_saved
                )

            with c_chap:
                card_chap_options = {"-- Mặc định / Không --": None}
                for c in default_chapters_list:
                    card_chap_options[c["title"]] = c["id"]
                
                default_chap_index = 0
                if default_chapter_id:
                    for key_idx, (t, cid) in enumerate(card_chap_options.items()):
                        if cid == default_chapter_id:
                            default_chap_index = key_idx
                            break
                            
                selected_card_chap_title = st.selectbox(
                    "Chương",
                    list(card_chap_options.keys()),
                    index=default_chap_index,
                    key=f"card_chap_title_{idx}",
                    disabled=is_saved
                )
                card_chapter_id = card_chap_options[selected_card_chap_title]

            with c_les:
                card_lessons_list = []
                if card_chapter_id:
                    try:
                        client_meta = get_supabase_client()
                        if client_meta:
                            l_res = client_meta.table("lessons").select("id, title").eq("chapter_id", card_chapter_id).order("created_at").execute()
                            if l_res.data:
                                card_lessons_list = l_res.data
                    except Exception:
                        pass
                        
                card_les_options = {"-- Mặc định / Không --": None}
                for l in card_lessons_list:
                    card_les_options[l["title"]] = l["id"]
                    
                default_les_index = 0
                if default_lesson_id and card_chapter_id == default_chapter_id:
                    for key_idx, (t, lid) in enumerate(card_les_options.items()):
                        if lid == default_lesson_id:
                            default_les_index = key_idx
                            break
                            
                selected_card_les_title = st.selectbox(
                    "Bài học",
                    list(card_les_options.keys()),
                    index=default_les_index,
                    key=f"card_les_title_{idx}",
                    disabled=is_saved or not card_chapter_id
                )
                card_lesson_id = card_les_options[selected_card_les_title]

            explanation = st.text_area(
                "Lời giải chi tiết", 
                value=q.get("explanation", ""), 
                key=f"explanation_{idx}", 
                height=80,
                disabled=is_saved
            )

        with col_right_image:
            st.markdown("##### 🖼️ Ảnh minh họa câu hỏi")
            
            # Local session state image data holder
            img_key = f"image_bytes_{idx}"
            if img_key not in st.session_state:
                st.session_state[img_key] = None

            # 0. Sync pasted image from background http server if temp file exists
            temp_path = f"scratch/temp_paste_{idx}.jpg"
            if os.path.exists(temp_path):
                try:
                    with open(temp_path, "rb") as f:
                        st.session_state[img_key] = f.read()
                    os.remove(temp_path)
                except Exception:
                    pass

            # Render image preview with integrated Save/Delete buttons
            if st.session_state[img_key]:
                st.image(st.session_state[img_key], caption="Ảnh minh họa hiện tại", width=300)
                
                # Preview image action buttons directly below the frame
                if not is_saved:
                    col_img_save, col_img_del = st.columns(2)
                    with col_img_save:
                        if st.button("💾 Lưu Câu Này", key=f"save_btn_img_{idx}", type="primary", use_container_width=True):
                            if save_question(idx):
                                st.rerun()
                    with col_img_del:
                        if st.button("🗑️ Xóa ảnh", key=f"del_img_{idx}", use_container_width=True):
                            st.session_state[img_key] = None
                            st.rerun()

            # Beautiful Unified Drag & Drop / Paste / Upload Component
            if not is_saved and not st.session_state[img_key]:
                paste_placeholder = f"paste_placeholder_{idx}"
                
                # HTML template styled like the requested UI card: dashed border, cloud upload icon, clean typography
                paste_html = """
                <div id="dropzone" style="
                  border: 2px dashed #cbd5e1;
                  border-radius: 12px;
                  background-color: #f8fafc;
                  padding: 20px;
                  text-align: center;
                  cursor: pointer;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  transition: all 0.2s ease;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 120px;
                " onmouseover="this.style.borderColor='#4f46e5'; this.style.backgroundColor='#f1f5f9';"
                   onmouseout="this.style.borderColor='#cbd5e1'; this.style.backgroundColor='#f8fafc';">
                  
                  <!-- Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  
                  <div style="font-size: 13px; font-weight: 500; color: #334155; margin-bottom: 4px;">
                    Drop your image here, or <span style="color: #4f46e5; font-weight: 600;">browse</span>
                  </div>
                  <div style="font-size: 11px; color: #64748b;">
                    Supports: JPG, JPEG, PNG
                  </div>
                  
                  <input type="file" id="fileInput" accept="image/*" style="display: none;" />
                </div>

                <!-- Custom Paste Button with Image Icon below the frame -->
                <button id="pasteBtn" style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  background-color: #4f46e5;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  padding: 10px 16px;
                  font-size: 13px;
                  font-weight: 600;
                  cursor: pointer;
                  margin-top: 10px;
                  width: 100%;
                  transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='#4338ca';"
                   onmouseout="this.style.backgroundColor='#4f46e5';">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  Dán Ảnh Vừa Chụp
                </button>

                <script>
                  var dropzone = document.getElementById('dropzone');
                  var fileInput = document.getElementById('fileInput');
                  var pasteBtn = document.getElementById('pasteBtn');

                  // Click triggers file selector
                  dropzone.addEventListener('click', function() {
                    fileInput.click();
                  });

                  // File Input Change
                  fileInput.addEventListener('change', function() {
                    if (fileInput.files.length > 0) {
                      handleFile(fileInput.files[0]);
                    }
                  });

                  // Drag & Drop events
                  dropzone.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    dropzone.style.borderColor = '#4f46e5';
                    dropzone.style.backgroundColor = '#f1f5f9';
                  });

                  dropzone.addEventListener('dragleave', function() {
                    dropzone.style.borderColor = '#cbd5e1';
                    dropzone.style.backgroundColor = '#f8fafc';
                  });

                  dropzone.addEventListener('drop', function(e) {
                    e.preventDefault();
                    dropzone.style.borderColor = '#cbd5e1';
                    dropzone.style.backgroundColor = '#f8fafc';
                    if (e.dataTransfer.files.length > 0) {
                      handleFile(e.dataTransfer.files[0]);
                    }
                  });

                  // Paste event listener on global window (Ctrl+V)
                  document.addEventListener('paste', function(e) {
                    var items = e.clipboardData.items;
                    for (var i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        var blob = items[i].getAsFile();
                        handleFile(blob);
                        break;
                      }
                    }
                  });

                  // Paste Button handler (reads from Clipboard API)
                  pasteBtn.addEventListener('click', async function() {
                    try {
                      const clipboardItems = await navigator.clipboard.read();
                      for (const item of clipboardItems) {
                        for (const type of item.types) {
                          if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            handleFile(blob);
                            return;
                          }
                        }
                      }
                      alert("Không tìm thấy dữ liệu hình ảnh trong bộ nhớ tạm! Vui lòng chụp màn hình trước khi nhấn dán.");
                    } catch (err) {
                      // Fallback warning if browser permissions restrict reading clipboard directly
                      alert("Trình duyệt chặn quyền truy cập bộ nhớ tạm. Hãy click chọn hộp nét đứt ở trên rồi nhấn tổ hợp phím Ctrl+V / Cmd+V để dán ảnh.");
                    }
                  });

                  // Helper function to read file as Base64 and notify Streamlit
                  function handleFile(file) {
                    var reader = new FileReader();
                    reader.onload = function(event) {
                      var base64 = event.target.result;
                      
                      // POST to local background HTTP server to bypass iframe sandbox restrictions
                      fetch("http://localhost:8502/upload?idx={idx}", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ image: base64 })
                      })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          // Success - display message on dropzone
                          dropzone.style.borderColor = '#10b981';
                          dropzone.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            <div style="font-size: 13px; font-weight: 500; color: #10b981;">Đã nhận ảnh thành công!</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Nhấn nút 'Hiển thị ảnh vừa dán' bên dưới để xem.</div>
                          `;
                        }
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                </script>
                """.replace("{paste_placeholder}", paste_placeholder).replace("{idx}", str(idx))
                st.components.v1.html(paste_html, height=235)
                
                # Show load button only if image is not loaded yet
                if not st.session_state[img_key]:
                    if st.button("🔄 Hiển thị ảnh vừa dán", key=f"refresh_img_{idx}", use_container_width=True):
                        # Force check disk temp file again
                        check_temp = f"scratch/temp_paste_{idx}.jpg"
                        if os.path.exists(check_temp):
                            try:
                                with open(check_temp, "rb") as f:
                                    st.session_state[img_key] = f.read()
                                os.remove(check_temp)
                                st.rerun()
                            except Exception:
                                pass
                        else:
                            st.warning("Chưa nhận được ảnh dán nào. Vui lòng dán ảnh chụp màn hình trước.")

                # Traditional File Uploader as backup
                user_uploaded_img = st.file_uploader(
                    "Hoặc tải ảnh từ máy tính", 
                    type=["png", "jpg", "jpeg"], 
                    key=f"user_file_img_{idx}"
                )
                if user_uploaded_img is not None:
                    st.session_state[img_key] = user_uploaded_img.read()
            else:
                st.caption("Ảnh đã được lưu thành công vào câu hỏi.")

        # Card Footer Action (Only shown when not saved to keep the card compact)
        if not is_saved:
            st.markdown("<hr style='border-top: 1px solid #cbd5e1; margin: 10px 0;'>", unsafe_allow_html=True)
            col_footer_left, col_footer_right = st.columns([4, 1])
            
            with col_footer_left:
                st.caption("Hãy điền đủ thông tin rồi nhấn 'Lưu Câu Này' để đồng bộ.")
                    
            with col_footer_right:
                # Save button for individual question
                if st.button("💾 Lưu Câu Này", key=f"save_btn_{idx}", type="primary", use_container_width=True):
                    if save_question(idx):
                        st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)

    # Save all unsaved questions remaining
    st.markdown("---")
    unsaved_indices = [i for i in range(len(st.session_state.parsed_questions)) if not st.session_state.saved_status.get(i, False)]
    
    if len(unsaved_indices) > 0:
        if st.button(f"📥 Lưu tất cả {len(unsaved_indices)} câu hỏi chưa lưu còn lại", use_container_width=True):
            client = get_supabase_client()
            if not client or not selected_subject_id:
                st.error("Vui lòng kết nối database và chọn Môn Học trước.")
            else:
                with st.spinner("Đang lưu toàn bộ câu hỏi..."):
                    success_count = 0
                    for idx in unsaved_indices:
                        if save_question(idx, show_balloons=False):
                            success_count += 1
                    
                    if success_count > 0:
                        st.success(f"🎉 Đã lưu thành công {success_count} câu hỏi còn lại!")
                        st.session_state.show_fireworks = True
                        st.rerun()
    else:
        st.success("🎉 Toàn bộ câu hỏi đã được lưu thành công vào cơ sở dữ liệu!")

# Render full screen fireworks if flag is set
if st.session_state.get("show_fireworks", False):
    st.markdown("""
    <style>
    iframe[height="1"] {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 99999 !important;
        pointer-events: none !important;
        border: none !important;
        background: transparent !important;
    }
    </style>
    """, unsafe_allow_html=True)
    
    confetti_html = """
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
        <canvas id="confetti-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
    </div>
    <script>
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = function() {
            var myCanvas = document.getElementById('confetti-canvas');
            var myConfetti = confetti.create(myCanvas, {
                resize: true,
                useWorker: true
            });
            
            var duration = 4 * 1000;
            var animationEnd = Date.now() + duration;
            var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

            function randomInRange(min, max) {
              return Math.random() * (max - min) + min;
            }

            var interval = setInterval(function() {
              var timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              var particleCount = 50 * (timeLeft / duration);
              myConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
              myConfetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        };
        document.head.appendChild(script);
    </script>
    """
    
    st.components.v1.html(confetti_html, height=1)
    st.session_state.show_fireworks = False
