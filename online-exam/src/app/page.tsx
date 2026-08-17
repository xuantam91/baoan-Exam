'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ThemePicker from '@/components/ThemePicker';
import Logo from '@/components/Logo';
import LanguagePicker from '@/components/LanguagePicker';
import { translations, Language } from '@/lib/translations';
import { getCurrentUser } from '@/app/actions/auth';
import {
  LogIn,
  BookOpen,
  GraduationCap,
  ClipboardList,
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Bot,
  Cpu,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  Layers,
  Send,
  Eye,
  Printer,
  ChevronDown,
  Heart,
  Activity,
  Smile,
  Atom,
  FlaskConical,
  Dna,
  Workflow,
  Compass,
} from 'lucide-react';

/* ── Typing effect ──────────────────────────────────────── */
function useTypingEffect(texts: string[], speed = 70, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Reset index and typing progress when text list changes (e.g. language changed)
  const textsKey = texts.join('|||');
  useEffect(() => {
    setIdx(0);
    setCharIdx(0);
    setDeleting(false);
    setDisplay('');
  }, [textsKey]);

  useEffect(() => {
    const current = texts[idx];
    if (!current) return;
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else {
      setDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* ── Counter animation ──────────────────────────────────── */
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let frame = 0;
          const totalFrames = 40;
          const step = () => {
            frame++;
            const progress = frame / totalFrames;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (frame < totalFrames) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <div ref={ref}>{count}{suffix}</div>;
}

/* ── Section wrapper with fade-in ───────────────────────── */
function Section({
  children,
  className = '',
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('vi');

  useEffect(() => {
    const saved = (localStorage.getItem('lang') as Language) || 'vi';
    setLang(saved);
  }, []);

  const t = translations[lang] || translations.vi;

  const [examId, setExamId] = useState('');
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Load user status, but do NOT automatically redirect away. Just remember status for UI buttons.
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await getCurrentUser();
        if (res.success && res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error('Lỗi khi tải phiên đăng nhập:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    loadUser();
  }, []);

  const getDashboardUrl = () => {
    if (!profile) return '/login';
    const role = profile.role;
    if (role === 'admin' || role === 'teacher') return '/admin/exams';
    if (role === 'student') return '/student/dashboard';
    if (role === 'parent') return '/parent/dashboard';
    return '/login';
  };

  const typingTexts = {
    vi: ['Thi Trắc Nghiệm Thông Minh', 'Chấm Điểm Tự Động AI', 'Số Hóa Giáo Dục Toàn Diện', 'Quản Lý Lớp Học 4.0'],
    en: ['Smart Online Exams', 'AI Automated Grading', 'Full Education Digitization', 'Class Management 4.0'],
    la: ['ການສອບເສັງອອນລາຍອັດສະລິຍະ', 'ກວດຄະແນນອັດຕະໂນມັດດ້ວຍ AI', 'ຫັນການສຶກສາເປັນດິຈິຕອນ', 'ການຈັດການຫ້ອງຮຽນ 4.0'],
    zh: ['智能在线考试系统', 'AI 自动阅卷批改', '全方位数字化教学', '班级教务管理 4.0'],
  };

  const typedText = useTypingEffect(
    typingTexts[lang] || typingTexts.vi,
    65,
    2000
  );

  const handleGoToExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId.trim()) { setError('Vui lòng nhập mã đề thi.'); return; }
    setError('');
    router.push(`/exam/${examId.trim()}`);
  };

  /* Pastel accent classes */
  const pastel = {
    indigo:  'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
    violet:  'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    amber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
    rose:    'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
    sky:     'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/40',
    pink:    'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/40',
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-xs font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Đang khởi tạo ứng dụng...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', transition: 'background-color 0.25s ease' }}>

      {/* ═══════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════ */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: 'hsl(var(--card) / 0.9)', borderBottomColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-1 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-xl border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center">
              <Logo className="w-8 h-8" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">BaoAn Exam</span>
              <p className="text-[10px] font-bold -mt-0.5 tracking-wider uppercase text-indigo-600 dark:text-indigo-400 hidden sm:block">AI-Powered Education</p>
            </div>
          </div>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.navFeatures}</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.navProcess}</a>
            <a href="#about-me" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.navTeacher}</a>
            <a href="#stats" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.navStats}</a>
            <a href="#start" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.navStart}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {profile ? (
              <a href={getDashboardUrl()} className="inline-flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-transform" title={`${t.dashboard} (${profile.name})`}>
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline ml-1.5 text-sm font-bold whitespace-nowrap">{t.dashboard} ({profile.name})</span>
              </a>
            ) : (
              <a href="/login" className="inline-flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 transition-transform" title={t.login}>
                <LogIn className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline ml-1.5 text-sm font-bold whitespace-nowrap">{t.login}</span>
              </a>
            )}
            <LanguagePicker align="down" />
            <ThemePicker align="down" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Pastel gradient backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-transparent dark:from-indigo-950/30 dark:via-violet-950/20 blur-3xl" />
          <div className="absolute -bottom-1/3 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-pink-200/30 via-amber-100/20 to-transparent dark:from-pink-950/20 dark:via-amber-950/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border" style={{ backgroundColor: 'hsl(var(--accent))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--accent-foreground))' }}>
              <Sparkles className="w-3.5 h-3.5" /> {t.heroBadge}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-2 leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
              {t.heroTitle1}
            </h1>

            {/* Typing line */}
            <div className="h-[1.4em] text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 bg-clip-text text-transparent mb-6 whitespace-nowrap overflow-hidden">
              {typedText}
              <span className="text-indigo-500" style={{ animation: 'blink 0.8s ease-in-out infinite' }}>|</span>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 text-slate-500 dark:text-slate-400">
              {t.heroDesc}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#start" className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer active:scale-95">
                🚀 {t.btnStart} <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#features" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer hover:shadow-md active:scale-95" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', backgroundColor: 'hsl(var(--card))' }}>
                {t.btnLearnMore} <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATISTICS BAR
          ═══════════════════════════════════════════════════ */}
      <Section id="stats">
        <div className="border-y" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: 90, suffix: '%', label: t.stat1Label, icon: Clock, color: 'text-indigo-500' },
                { value: 100, suffix: '%', label: t.stat2Label, icon: Cpu, color: 'text-violet-500' },
                { value: 5, suffix: '+', label: lang === 'vi' ? 'Dạng câu hỏi' : lang === 'en' ? 'Question Types' : lang === 'la' ? 'ປະເພດຄຳຖາມ' : '试题类型', icon: Layers, color: 'text-emerald-500' },
                { value: 24, suffix: '/7', label: lang === 'vi' ? 'Thi mọi lúc' : lang === 'en' ? 'Test Anytime' : lang === 'la' ? 'ສອບເສັງທຸກເວລາ' : '随时考', icon: Globe, color: 'text-amber-500' },
              ].map((s) => (
                <div key={s.label}>
                  <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: 'hsl(var(--foreground))' }}>
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </div>
                  <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          FEATURES GRID
          ═══════════════════════════════════════════════════ */}
      <Section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${pastel.indigo}`}>
              <Sparkles className="w-3 h-3" /> {t.featBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ color: 'hsl(var(--foreground))' }}>
              {t.featTitle}
            </h2>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t.featDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain,           title: t.feat1Title, desc: t.feat1Desc, p: pastel.indigo },
              { icon: FileSpreadsheet, title: t.feat2Title, desc: t.feat2Desc, p: pastel.violet },
              { icon: BarChart3,       title: t.feat3Title, desc: t.feat3Desc, p: pastel.emerald },
              { icon: Bot,             title: t.feat4Title, desc: t.feat4Desc, p: pastel.amber },
              { icon: Shield,          title: t.feat5Title, desc: t.feat5Desc, p: pastel.rose },
              { icon: Printer,         title: t.feat6Title, desc: t.feat6Desc, p: pastel.sky },
            ].map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              >
                <div className={`p-3 rounded-xl w-fit mb-4 border transition-transform group-hover:scale-110 ${f.p}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          ABOUT ME / PHILOSOPHY SECTION (Science & STEM Focus)
          ═══════════════════════════════════════════════════ */}
      <Section id="about-me" className="py-20 lg:py-24" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-y py-12" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-md w-full">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-emerald-200 dark:from-indigo-950/20 dark:to-emerald-950/20 rounded-2xl blur-lg opacity-85 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] aspect-[5/6]">
                  <img
                    src="/teacher-intro.jpg"
                    alt="Giáo viên Khoa học Tự nhiên & STEM"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                      {lang === 'vi' ? 'Khoa Học Tự Nhiên & STEM' : lang === 'en' ? 'Natural Science & STEM' : lang === 'la' ? 'ວິທະຍາສາດທຳມະຊາດ & STEM' : '自然科学与 STEM'}
                    </p>
                    <p className="text-white text-sm font-bold italic drop-shadow-md">
                      {lang === 'vi' ? '"Truyền cảm hứng · Tạo giá trị · Lan tỏa yêu thương ♡"' : lang === 'en' ? '"Inspiring · Value Creating · Love Spreading ♡"' : lang === 'la' ? '"ສ້າງແຮງບັນດານໃຈ · ສ້າງຄຸນຄ່າ · ເຜີຍແຜ່ຄວາມຮັກ ♡"' : '"启迪智慧 · 创造价值 · 传递爱心 ♡"'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quotes & Details */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${pastel.indigo}`}>
                  <Atom className="w-3.5 h-3.5" /> {t.aboutBadge}
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                  {t.aboutTitle}
                </h2>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {t.aboutSub}
                </p>
              </div>

              {/* Quotes */}
              <div className="p-4 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2">
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {t.aboutQuote}
                </p>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* STEM & Science Teaching */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <FlaskConical className="w-4 h-4" /> {t.aboutCol1Title}
                  </h4>
                  <ul className="space-y-2">
                    {[
                      { title: t.aboutCol1_1, desc: t.aboutCol1_1Desc },
                      { title: t.aboutCol1_2, desc: t.aboutCol1_2Desc },
                      { title: t.aboutCol1_3, desc: t.aboutCol1_3Desc },
                    ].map((item) => (
                      <li key={item.title} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{item.title}:</span>
                          <span className="text-xs block" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supplementary Health & Lifestyle */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                    <Heart className="w-4 h-4" /> {t.aboutCol2Title}
                  </h4>
                  <ul className="space-y-2">
                    {[
                      { title: t.aboutCol2_1, desc: t.aboutCol2_1Desc },
                      { title: t.aboutCol2_2, desc: t.aboutCol2_2Desc },
                      { title: t.aboutCol2_3, desc: t.aboutCol2_3Desc },
                    ].map((item) => (
                      <li key={item.title} className="text-sm flex items-start gap-2">
                        <Heart className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{item.title}:</span>
                          <span className="text-xs block" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Goal Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
                  {t.badgeKHTN}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                  {t.badgeSTEM}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/20">
                  {t.badgeDigit}
                </span>
              </div>
            </div>

          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — Quy trình 5 bước
          ═══════════════════════════════════════════════════ */}
      <Section id="how-it-works" className="py-20 lg:py-28">
        <div style={{ backgroundColor: 'hsl(var(--card))' }} className="border-y" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${pastel.violet}`}>
                <Zap className="w-3 h-3" /> {t.howBadge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                {t.howTitle}
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t.howDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 lg:gap-6">
              {[
                { step: '01', icon: Brain,           title: t.step1, desc: t.step1Desc, color: 'from-indigo-500 to-indigo-600' },
                { step: '02', icon: FileSpreadsheet, title: t.step2, desc: t.step2Desc, color: 'from-violet-500 to-violet-600' },
                { step: '03', icon: Send,            title: t.step3, desc: t.step3Desc, color: 'from-pink-500 to-pink-600' },
                { step: '04', icon: Eye,             title: t.step4, desc: t.step4Desc, color: 'from-amber-500 to-amber-600' },
                { step: '05', icon: BarChart3,       title: t.step5, desc: t.step5Desc, color: 'from-emerald-500 to-emerald-600' },
              ].map((s, i) => (
                <div key={s.step} className="text-center group">
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-black tracking-widest uppercase mb-1 text-indigo-500 dark:text-indigo-400">
                    {lang === 'vi' ? 'Bước' : lang === 'en' ? 'Step' : lang === 'la' ? 'ຂັ້ນຕອນ' : '步骤'} {s.step}
                  </div>
                  <h4 className="text-base font-bold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{s.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.desc}</p>
                  {i < 4 && (
                    <div className="hidden sm:block mt-3 mx-auto text-indigo-300 dark:text-indigo-800">
                      <ArrowRight className="w-4 h-4 mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          AI & DIGITALIZATION HIGHLIGHT
          ═══════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${pastel.amber}`}>
                <Bot className="w-3 h-3" /> {t.aiBadge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                {t.aiTitle1}<br />{t.aiTitle2} <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{t.aiTitle3}</span>
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t.aiDesc}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Brain,   text: t.aiItem1 },
                  { icon: Cpu,     text: t.aiItem2 },
                  { icon: TrendingUp, text: t.aiItem3 },
                  { icon: Sparkles, text: t.aiItem4 },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 border ${pastel.indigo}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain,           label: 'Gemini AI',     sub: lang === 'vi' ? 'Xử lý ngôn ngữ tự nhiên' : lang === 'en' ? 'Natural language processing' : lang === 'la' ? 'ປະມວນຜົນພາສາທຳມະຊາດ' : '自然语言处理',   p: pastel.indigo },
                { icon: FileSpreadsheet, label: 'Auto-Generate', sub: lang === 'vi' ? 'Sinh đề ngẫu nhiên' : lang === 'en' ? 'Random exam generation' : lang === 'la' ? 'ສ້າງຂໍ້ສອບແບບສຸ່ມ' : '智能随机组卷',          p: pastel.violet },
                { icon: BarChart3,       label: 'Analytics',     sub: lang === 'vi' ? 'Phân tích dữ liệu' : lang === 'en' ? 'Data analytics' : lang === 'la' ? 'ວິເຄາະຂໍ້ມູນ' : '学情数据分析',           p: pastel.emerald },
                { icon: Shield,          label: 'Security',      sub: lang === 'vi' ? 'UUID + hạn nộp + giới hạn' : lang === 'en' ? 'UUID + deadline + limit' : lang === 'la' ? 'UUID + ກຳນົດສົ່ງ + ຈຳກັດ' : 'UUID + 截止时间 + 限制',   p: pastel.rose },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-5 rounded-2xl border text-center transition-all hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                >
                  <div className={`p-3 rounded-xl w-fit mx-auto mb-3 border ${card.p}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{card.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          WHO IS IT FOR
          ═══════════════════════════════════════════════════ */}
      <Section className="py-20 lg:py-28">
        <div style={{ backgroundColor: 'hsl(var(--card))' }} className="border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 border ${pastel.emerald}`}>
                <Users className="w-3 h-3" /> {lang === 'vi' ? 'Dành Cho Ai?' : lang === 'en' ? 'Who is it for?' : lang === 'la' ? 'ເໝາະສຳລັບໃຜ?' : '适用对象'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                {lang === 'vi' ? 'Giải pháp cho mọi vai trò' : lang === 'en' ? 'Solutions for every role' : lang === 'la' ? 'ທາງເລືອກສຳລັບທຸກຄົນ' : '全角色覆盖的一站式解决方案'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  role: lang === 'vi' ? '🎓 Giáo Viên' : lang === 'en' ? '🎓 Teacher' : lang === 'la' ? '🎓 ຄູສອນ' : '🎓 教师',
                  items: lang === 'vi' ? [
                    'Tạo ngân hàng 1000+ câu hỏi', 'Sinh đề thi random 1 click', 'Gửi bài thi qua email', 'Xem thống kê điểm realtime', 'In đề & phiếu trả lời'
                  ] : lang === 'en' ? [
                    'Build 1000+ question banks', 'One-click random exam gen', 'Send exams via email notifications', 'Real-time score dashboard analytics', 'Print PDF exams & sheet keys'
                  ] : lang === 'la' ? [
                    'ສ້າງຄັງຄຳຖາມຫຼາຍກວ່າ 1000 ຂໍ້', 'ສ້າງຂໍ້ສອບແບບສຸ່ມໃນຄລິກດຽວ', 'ສົ່ງຂໍ້ສອບຜ່ານທາງອີເມວ', 'ເບິ່ງສະຖິຕິຄະແນນແບບຮຽວທາມ', 'ພິມຂໍ້ສອບ ແລະ ໃບຕອບ'
                  ] : [
                    '建设 1000+ 海量题库', '一键智能随机组卷', '系统自动发送邮件提醒', '实时大数据成绩分析看板', '导出 PDF 试卷与标准答题卡'
                  ],
                  gradient: 'from-indigo-500 to-violet-600',
                },
                {
                  role: lang === 'vi' ? '📚 Học Sinh' : lang === 'en' ? '📚 Student' : lang === 'la' ? '📚 ນັກຮຽນ' : '📚 学生',
                  items: lang === 'vi' ? [
                    'Vào thi chỉ bằng 1 link/mã', 'Giao diện dễ dùng, timer rõ ràng', 'Xem điểm ngay sau khi nộp', 'Hỗ trợ công thức Toán Lý Hóa', 'Làm bài trên mọi thiết bị'
                  ] : lang === 'en' ? [
                    'Join exams with a single link/code', 'Intuitive UI with visible countdown timers', 'Instant score results after submission', 'Math, Physics, Chemistry KaTeX display', 'Take tests seamlessly on any mobile/PC'
                  ] : lang === 'la' ? [
                    'ເຂົ້າເສັງງ່າຍໆຜ່ານລີ້ງ ຫຼື ລະຫັດ', 'ໜ້າຕ່າງໃຊ້ງ່າຍ ພ້ອມໂມງນັບຖອຍຫຼັງ', 'ເບິ່ງຄະແນນເສັງໄດ້ທັນທີຫຼັງສົ່ງ', 'ຮອງຮັບສູດຄະນິດສາດ ຟີຊິກ ເຄມີ', 'ເຮັດບົດເສັງໄດ້ໃນທຸກອຸປະກອນ'
                  ] : [
                    '仅需一个链接或邀请码即可开考', '界面简洁友好，内置清晰倒计时器', '交卷即刻查看客观题成绩', '完美支持数理化复杂公式显示', '完美适配手机、平板及电脑终端'
                  ],
                  gradient: 'from-emerald-500 to-teal-600',
                },
                {
                  role: lang === 'vi' ? '🏫 Quản Trị Viên' : lang === 'en' ? '🏫 School Admin' : lang === 'la' ? '🏫 ຜູ້ບໍລິຫານ' : '🏫 管理员',
                  items: lang === 'vi' ? [
                    'Quản lý toàn bộ hệ thống', 'Phân quyền Giáo viên / Học sinh', 'Theo dõi hoạt động toàn trường', 'Cấu hình môn học, lớp, khối', 'Export dữ liệu & báo cáo'
                  ] : lang === 'en' ? [
                    'Manage full platform settings', 'Configure permissions for Teachers/Students', 'Monitor system-wide active logs', 'Set up subjects, classes, and groups', 'Export excel sheets & analytical reports'
                  ] : lang === 'la' ? [
                    'ຄຸ້ມຄອງລະບົບທັງໝົດ', 'ແບ່ງສິດທiການໃຊ້ງານ ຄູ / ນັກຮຽນ', 'ຕິດຕາມການເຄື່ອນໄຫວໃນລະບົບ', 'ຕັ້ງຄ່າວິຊາຮຽນ, ຫ້ອງຮຽນ, ຊັ້ນຮຽນ', 'ສົ່ງອອກຂໍ້ມູນ ແລະ ລາຍງານ'
                  ] : [
                    '管理系统全局后台配置', '灵活划分教师、学生等角色权限', '监控全校范围内的考试与活跃 data', '统一配置科目、班级与年级信息', '支持一键导出 Excel 报表与分析'
                  ],
                  gradient: 'from-amber-500 to-orange-600',
                },
              ].map((r) => (
                <div
                  key={r.role}
                  className="p-6 rounded-2xl border transition-all hover:shadow-xl"
                  style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                >
                  <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${r.gradient} text-white text-sm font-bold mb-4 shadow-md`}>
                    {r.role}
                  </div>
                  <ul className="space-y-2.5">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          CTA — BẮT ĐẦU
          ═══════════════════════════════════════════════════ */}
      <Section id="start" className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Student */}
            <div className="p-8 rounded-2xl border relative overflow-hidden transition-all hover:shadow-xl" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {lang === 'vi' ? 'Học Sinh — Vào Thi' : lang === 'en' ? 'Student — Take Exam' : lang === 'la' ? 'ນັກຮຽນ — ເຂົ້າເສັງ' : '学生 — 进入考试'}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {lang === 'vi' ? 'Nhập mã đề thi để bắt đầu' : lang === 'en' ? 'Enter exam code to begin' : lang === 'la' ? 'ປ້ອນລະຫັດເສັງເພື່ອເລີ່ມຕົ້ນ' : '输入考试邀请码以开始'}
                    </p>
                  </div>
                </div>
                <form onSubmit={handleGoToExam} className="space-y-3">
                  <input
                    type="text"
                    placeholder={lang === 'vi' ? 'Nhập mã đề thi...' : lang === 'en' ? 'Enter exam code...' : lang === 'la' ? 'ປ້ອນລະຫັດເສັງ...' : '输入考试邀请码...'}
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  />
                  {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                    🚀 {lang === 'vi' ? 'Vào Phòng Thi' : lang === 'en' ? 'Enter Exam Room' : lang === 'la' ? 'ເຂົ້າຫ້ອງເສັງ' : '进入考场'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Teacher */}
            <div className="p-8 rounded-2xl border relative overflow-hidden transition-all hover:shadow-xl" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-pink-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {lang === 'vi' ? 'Giáo Viên / Admin' : lang === 'en' ? 'Teacher / Admin' : lang === 'la' ? 'ຄູສອນ / ຜູ້ບໍລິຫານ' : '教师 / 管理员'}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {lang === 'vi' ? 'Đăng nhập để quản trị hệ thống' : lang === 'en' ? 'Login to manage the system' : lang === 'la' ? 'ເຂົ້າສູ່ລະບົບເພື່ອຈັດການ' : '登录以管理系统'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {lang === 'vi' ? 'Truy cập bảng điều khiển quản trị để tạo đề thi, quản lý ngân hàng câu hỏi, theo dõi kết quả học sinh và xuất báo cáo.' : lang === 'en' ? 'Access the admin dashboard to create exams, manage question banks, track student results, and export analytics reports.' : lang === 'la' ? 'ເຂົ້າເຖິງແຜງຄວບຄຸມເພື່ອສ້າງຂໍ້ສອບ, ຈັດການຄັງຄຳຖາມ, ຕິດຕາມຜົນການຮຽນ ແລະ ສົ່ງອອກລາຍງານ.' : '访问管理员控制台以创建考试、管理题库、跟踪学生成绩并导出分析报表。'}
                  </p>
                  <div className="flex gap-3">
                    <a href={getDashboardUrl()} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm text-center transition-all shadow-lg shadow-violet-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                      {profile ? (lang === 'vi' ? 'Vào Làm Việc Ngay' : lang === 'en' ? 'Enter Dashboard' : lang === 'la' ? 'ເຂົ້າແຜງເຮັດວຽк' : '进入工作台') : t.login} <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-[10px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {profile ? (lang === 'vi' ? 'Phiên hoạt động: ' : lang === 'en' ? 'Active session: ' : lang === 'la' ? 'ເຊດຊັນປັດຈຸບັນ: ' : '当前在线: ') + profile.name : (lang === 'vi' ? 'Chưa có tài khoản? Liên hệ quản trị viên để được cấp quyền truy cập.' : lang === 'en' ? 'No account yet? Contact administrator for access rights.' : lang === 'la' ? 'ຍັງບໍ່ມີບັນຊີ? ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອຂໍສິດເຂົ້າໃຊ້ງານ.' : '尚未拥有账户？请联系管理员开通权限。')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="border-t py-10" style={{ backgroundColor: 'hsl(var(--card) / 0.5)', borderTopColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 rounded-lg border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-center">
                <Logo className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">BaoAn Exam</span>
            </div>
            <div className="flex items-center gap-5 text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500" /> Supabase</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Vercel</span>
              <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-violet-500" /> Gemini AI</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> KaTeX</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-center md:text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t.footerRights}
            </p>
          </div>
        </div>
      </footer>

      {/* ── Keyframes ──────────────────────────────────── */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
