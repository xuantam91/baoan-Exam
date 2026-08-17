'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ThemePicker from '@/components/ThemePicker';
import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import { getCurrentUser, signOutAction } from '@/app/actions/auth';
import {
  GraduationCap,
  Settings,
  Users,
  FileSpreadsheet,
  BarChart3,
  Home,
  Menu,
  X,
  Database,
  LogOut,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<string>('admin');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function loadUser() {
      const res = await getCurrentUser();
      if (res.success && res.profile) {
        setRole(res.profile.role);
        setUserName(res.profile.name);
      }
    }
    loadUser();
  }, []);

  const isPrintPage = pathname.includes('/print');
  if (isPrintPage) {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Ngân Hàng Câu Hỏi', href: '/admin/questions', icon: Database },
    { name: 'Quản lý Môn & Lớp', href: '/admin/config', icon: Settings },
    { name: 'Quản lý Học Sinh', href: '/admin/students', icon: Users },
    { name: 'Quản lý Đề Thi', href: '/admin/exams', icon: FileSpreadsheet },
    { name: 'Thống Kê Điểm', href: '/admin/scores', icon: BarChart3 },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (role === 'teacher' && item.href === '/admin/config') return false;
    return true;
  });

  const initials = userName
    ? userName
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'hsl(var(--background))', transition: 'background-color 0.25s ease' }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] border-r
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderRightColor: 'hsl(var(--border))',
          transition: 'background-color 0.25s ease, border-color 0.25s ease, transform 0.3s ease',
        }}
      >
        {/* ── Logo ── */}
        <div
          className="h-16 flex items-center justify-between px-5 flex-shrink-0"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-1 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-xl border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Logo className="w-7 h-7" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              BaoAn Exam
            </span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── User card ── */}
        {userName && (
          <div
            className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: 'hsl(var(--accent))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                {userName}
              </p>
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {role === 'admin' ? '⚡ Quản trị viên' : '🎓 Giáo viên'}
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300'
                }`}
                style={isActive ? {} : { color: 'hsl(var(--muted-foreground))' }}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 p-3 space-y-2"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          {/* Row 1: Trang chủ — full width button */}
          <Link
            href="/"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <Home className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1">Trang Chủ</span>
          </Link>

          {/* Row 2: Theme and Language controls — clear, spacious */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 flex items-center gap-1.5">
              <LanguagePicker align="up" menuAlign="left" />
              <ThemePicker align="up" menuAlign="left" />
            </div>
            <ThemeToggle />
          </div>

          {/* Row 3: Đăng xuất — prominent, full width */}
          <button
            onClick={async () => {
              await signOutAction();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
              bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40
              text-rose-600 dark:text-rose-400
              border border-rose-200 dark:border-rose-900/40
              hover:shadow-md active:scale-[0.98]"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header
          className="h-16 flex items-center justify-between px-5 lg:hidden border-b"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderBottomColor: 'hsl(var(--border))',
          }}
        >
          <button
            className="p-2 rounded-xl border transition-colors"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-0.5 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-lg border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center">
              <Logo className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              BaoAn Exam
            </span>
          </div>

          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
