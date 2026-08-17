'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/app/actions/auth';
import { getClasses } from '@/app/actions/metadata';
import { getStudents } from '@/app/actions/students';
import ThemeToggle from '@/components/ThemeToggle';
import ThemePicker from '@/components/ThemePicker';
import Logo from '@/components/Logo';
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
  HeartHandshake,
  ArrowRight,
  Sparkles,
  CheckCircle2,
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
      const res = await signIn({ email, password });
      if (res.success) {
        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
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
        }, 1000);
      } else {
        setError(res.error || 'Email hoặc mật khẩu không chính xác.');
        setLoading(false);
      }
    } else {
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
        setSuccess('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setIsLogin(true);
        setPassword('');
      } else {
        setError(res.error || 'Có lỗi xảy ra trong quá trình đăng ký.');
      }
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      }}
    >
      {/* Decorative background glow elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      {/* Floating Theme Tools */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <ThemePicker align="down" />
        <ThemeToggle />
      </div>

      {/* Main card */}
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transform transition-all duration-300 animate-fade-in"
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        
        {/* Banner header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white text-center space-y-2 relative">
          <div className="absolute top-3 right-3 text-white/20 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-white shadow-inner border border-white/20">
            <Logo className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Hệ Thống Thi Trực Tuyến BaoAn</h2>
          <p className="text-xs text-indigo-100 font-medium">Số hóa giáo dục · Chấm điểm tự động bằng AI</p>
        </div>

        {/* Tab Selector */}
        <div 
          className="flex border-b"
          style={{ borderBottomColor: 'hsl(var(--border))' }}
        >
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            className="flex-1 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer text-center outline-none"
            style={{
              borderColor: isLogin ? 'hsl(var(--primary))' : 'transparent',
              color: isLogin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            className="flex-1 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer text-center outline-none"
            style={{
              borderColor: !isLogin ? 'hsl(var(--primary))' : 'transparent',
              color: !isLogin ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-150 dark:border-rose-900/30 flex items-center gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-150 dark:border-emerald-900/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name (Registration only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Họ và Tên
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@school.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selection & Associated IDs (Registration only) */}
          {!isLogin && (
            <div 
              className="space-y-4 pt-4 border-t"
              style={{ borderTopColor: 'hsl(var(--border))' }}
            >
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Vai trò người dùng
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'student', label: 'Học sinh', icon: Users },
                    { key: 'parent', label: 'Phụ huynh', icon: HeartHandshake },
                    { key: 'teacher', label: 'Giáo viên', icon: BookOpen },
                    { key: 'admin', label: 'Admin', icon: Shield }
                  ].map((r) => {
                    const Icon = r.icon;
                    const isActive = role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key as any)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer outline-none"
                        style={{
                          backgroundColor: isActive ? 'hsl(var(--accent))' : 'transparent',
                          borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--accent))';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class association for Student */}
              {role === 'student' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Lớp học hiện tại
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Liên kết con em (Học sinh)
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-650/10 cursor-pointer transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                {isLogin ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản'} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
