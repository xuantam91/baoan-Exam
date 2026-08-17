'use client';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-7 h-7" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Custom modern linear gradient for primary brand color theme */}
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary, #6366F1)" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      {/* ── 1. AUTOMATION: Rotating circular gear / dashed digital track ── */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="url(#logo-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="5 4 2 4"
        opacity="0.6"
        className="origin-center"
        style={{
          transformOrigin: 'center',
          animation: 'spin 15s linear infinite'
        }}
      />

      {/* ── 2. DIGITIZATION: Circuit board tracks and glowing nodes ── */}
      {/* Top Node */}
      <circle cx="16" cy="2" r="2.2" className="fill-indigo-600 dark:fill-indigo-400" />
      <path d="M16 2 V6" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" />

      {/* Right Node */}
      <circle cx="30" cy="16" r="2.2" className="fill-violet-600 dark:fill-violet-400" />
      <path d="M30 16 H26" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" />

      {/* Bottom Node */}
      <circle cx="16" cy="30" r="2.2" className="fill-indigo-600 dark:fill-indigo-400" />
      <path d="M16 30 V26" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" />

      {/* Left Node */}
      <circle cx="2" cy="16" r="2.2" className="fill-emerald-600 dark:fill-emerald-400" />
      <path d="M2 16 H6" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" />

      {/* ── 3. EDUCATION: Stylized Mortarboard Cap ── */}
      {/* Mortarboard Diamond (Filled with brand gradient and soft border) */}
      <path
        d="M16 7 L26 12 L16 17 L6 12 Z"
        fill="url(#logo-gradient)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
      
      {/* Cap Base (Underneath mortarboard) */}
      <path
        d="M10 14.5 V17.5 C10 19.5 12.5 20.8 16 20.8 C19.5 20.8 22 19.5 22 17.5 V14.5"
        stroke="url(#logo-gradient)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Tassel */}
      <path d="M16 17 V21.5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="16" cy="21.5" r="1" fill="#F59E0B" />

      {/* ── 4. AI: Glowing sparkles representing Intelligence ── */}
      {/* Top right sparkle */}
      <path
        d="M22 6.5 C22 5.5 22.5 5.5 22.5 4.5 C22.5 5.5 23 5.5 23 6.5 C23 7.5 22.5 7.5 22.5 8.5 C22.5 7.5 22 7.5 22 6.5 Z"
        fill="#F59E0B"
        className="animate-pulse"
      />

      {/* Left bottom sparkle */}
      <path
        d="M8 24.5 C8 23.7 8.4 23.7 8.4 22.9 C8.4 23.7 8.8 23.7 8.8 24.5 C8.8 25.3 8.4 25.3 8.4 26.1 C8.4 25.3 8 25.3 8 24.5 Z"
        fill="#10B981"
        className="animate-pulse"
      />
    </svg>
  );
}
