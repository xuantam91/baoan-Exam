'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/app/actions/auth';
import { getClasses } from '@/app/actions/metadata';
import { getStudents } from '@/app/actions/students';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  Users, 
  BookOpen, 
  HeartHandshake
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>('student');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');

  // Dropdown lists
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  useEffect(() => {
    // Load metadata for dropdowns
    async function loadData() {
      const [classRes, studentRes] = await Promise.all([getClasses(), getStudents()]);
      if (classRes.success) setClassesList(classRes.data || []);
      if (studentRes.success) setStudentsList(studentRes.data || []);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isLogin) {
      // Handle login
      const res = await signIn({ email, password });
      if (res.success) {
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        
        // Dynamic redirection based on role
        setTimeout(() => {
          if (res.role === 'admin' || res.role === 'teacher') {
            router.push('/admin/exams');
          } else if (res.role === 'student') {
            router.push('/student/dashboard');
          } else if (res.role === 'parent') {
            router.push('/parent/dashboard');
          } else {
            router.push('/');
          }
          router.refresh();
        }, 1200);
      } else {
        setError(res.error || 'Email hoặc mật khẩu không chính xác.');
        setLoading(false);
      }
    } else {
      // Handle register
      if (!name.trim()) {
        setError('Vui lòng nhập họ và tên.');
        setLoading(false);
        return;
      }
      
      const payload = {
        email,
        password,
        name,
        role,
        classId: role === 'student' ? classId : null,
        studentId: role === 'parent' ? studentId : null
      };

      const res = await signUp(payload);
      if (res.success) {
        setSuccess('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
        setIsLogin(true);
        setPassword('');
      } else {
        setError(res.error || 'Có lỗi xảy ra trong quá trình đăng ký.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors duration-250 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all duration-300">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center space-y-2 relative">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto text-white">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Hệ Thống Thi Trực Tuyến BaoAn</h2>
          <p className="text-xs text-indigo-150">Học tập hiệu quả - Đánh giá khách quan</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              isLogin 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              !isLogin 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg border border-rose-100 dark:border-rose-900/40">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-100 dark:border-emerald-900/40">
              ✓ {success}
            </div>
          )}

          {/* Full Name (Registration only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Họ và Tên</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Địa chỉ Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@school.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selection & Associated IDs (Registration only) */}
          {!isLogin && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-900">
              
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase">Vai trò người dùng</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'student', label: 'Học sinh', icon: Users },
                    { key: 'parent', label: 'Phụ huynh', icon: HeartHandshake },
                    { key: 'teacher', label: 'Giáo viên', icon: BookOpen },
                    { key: 'admin', label: 'Admin', icon: Shield }
                  ].map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          role === r.key 
                            ? 'border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold' 
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[10px]">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class association for Student */}
              {role === 'student' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Lớp học hiện tại</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>Lớp {c.name} (Khối {c.grade})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student association for Parent */}
              {role === 'parent' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Liên kết con em (Học sinh)</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Chọn học sinh để liên kết --</option>
                    {studentsList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 italic">
                    * Lựa chọn này giúp phụ huynh có thể theo dõi bảng điểm học tập của con.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/10 cursor-pointer transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isLogin ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản'}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
