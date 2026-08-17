'use client';

import { useEffect, useRef } from 'react';

export default function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = containerRef.current?.offsetWidth || window.innerWidth);
    let height = (canvas.height = containerRef.current?.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      width = canvas.width = containerRef.current.offsetWidth;
      height = canvas.height = containerRef.current.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle net configuration
    const particleCount = Math.min(Math.floor((width * height) / 18000), 50); // Cleaner density
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25, // very slow drift
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 1,
        color: Math.random() > 0.5 ? '#6366F1' : '#8B5CF6',
      });
    }

    const mouse = { x: -1000, y: -1000, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseEnter = () => (mouse.active = true);
    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle constellation lines
      ctx.lineWidth = 0.75;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const distToMouse = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (distToMouse < 200) {
            const alpha = (1 - distToMouse / 200) * 0.28;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* 1. Canvas constellation connections */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />

      {/* 2. Soft tech background glow */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-pink-500/10 via-amber-500/5 to-transparent blur-3xl animate-pulse-slow" />

      {/* 3. Tech grid dots */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 0.75px, transparent 0.75px)`,
          backgroundSize: '28px 28px',
          color: 'hsl(var(--primary))',
        }}
      />

      {/* 4. Fine math gridlines */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.035]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <line x1="15%" y1="10%" x2="85%" y2="10%" stroke="currentColor" strokeWidth="1" strokeDasharray="5,15" />
          <line x1="25%" y1="90%" x2="75%" y2="90%" stroke="currentColor" strokeWidth="1" strokeDasharray="3,10" />
        </svg>
      </div>

      {/* 5. GORGEOUS FLOATING SCIENTIFIC AND AI ICONS */}
      
      {/* Biology: DNA Helix - Top Left */}
      <div className="absolute top-[18%] left-[8%] w-16 h-16 opacity-[0.07] dark:opacity-[0.14] animate-float-1 text-indigo-600 dark:text-indigo-400">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {/* Base strands */}
          <path d="M20 50 C 35 15, 65 85, 80 50" />
          <path d="M20 50 C 35 85, 65 15, 80 50" />
          {/* Connected base pairs */}
          <line x1="26" y1="42" x2="26" y2="58" strokeWidth="2" />
          <line x1="34" y1="31" x2="34" y2="69" strokeWidth="2" />
          <line x1="42" y1="28" x2="42" y2="72" strokeWidth="2" />
          <line x1="50" y1="35" x2="50" y2="65" strokeWidth="2" />
          <line x1="58" y1="48" x2="58" y2="52" strokeWidth="2" />
          <line x1="66" y1="63" x2="66" y2="37" strokeWidth="2" />
          <line x1="74" y1="58" x2="74" y2="42" strokeWidth="2" />
        </svg>
      </div>

      {/* Physics: Atom with Electron Orbits - Bottom Left */}
      <div className="absolute bottom-[22%] left-[10%] w-20 h-20 opacity-[0.08] dark:opacity-[0.15] animate-float-2 text-violet-600 dark:text-violet-400">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {/* Nucleus */}
          <circle cx="50" cy="50" r="6" fill="currentColor" />
          {/* Orbit 1 */}
          <ellipse cx="50" cy="50" rx="36" ry="12" transform="rotate(30 50 50)" />
          <circle cx="22" cy="34" r="2.5" fill="currentColor" />
          {/* Orbit 2 */}
          <ellipse cx="50" cy="50" rx="36" ry="12" transform="rotate(150 50 50)" />
          <circle cx="78" cy="34" r="2.5" fill="currentColor" />
          {/* Orbit 3 */}
          <ellipse cx="50" cy="50" rx="36" ry="12" transform="rotate(90 50 50)" />
          <circle cx="50" cy="86" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* Chemistry: Hexagonal Molecular Bond - Top Right */}
      <div className="absolute top-[15%] right-[10%] w-20 h-20 opacity-[0.07] dark:opacity-[0.13] animate-float-3 text-emerald-600 dark:text-emerald-400">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* Benzene Hexagon */}
          <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" />
          {/* Inner double bonds */}
          <line x1="50" y1="21" x2="75" y2="35" strokeWidth="1.5" />
          <line x1="75" y1="64" x2="50" y2="79" strokeWidth="1.5" />
          <line x1="25" y1="64" x2="25" y2="36" strokeWidth="1.5" />
          {/* Node points */}
          <circle cx="50" cy="15" r="3.5" fill="currentColor" />
          <circle cx="80" cy="32" r="3.5" fill="currentColor" />
          <circle cx="80" cy="68" r="3.5" fill="currentColor" />
          <circle cx="50" cy="85" r="3.5" fill="currentColor" />
          <circle cx="20" cy="68" r="3.5" fill="currentColor" />
          <circle cx="20" cy="32" r="3.5" fill="currentColor" />
        </svg>
      </div>

      {/* Chemistry: Flask/Beaker with bubbles - Middle Left */}
      <div className="absolute top-[48%] left-[4%] w-14 h-14 opacity-[0.06] dark:opacity-[0.12] animate-float-4 text-pink-600 dark:text-pink-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12" />
          <path d="M9 3v6L4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L15 9V3" />
          <path d="M6 14h12" strokeDasharray="2,2" />
          {/* Bubbles */}
          <circle cx="10" cy="17" r="1" fill="currentColor" />
          <circle cx="14" cy="16" r="1.5" fill="currentColor" />
          <circle cx="11" cy="12" r="0.8" fill="currentColor" />
        </svg>
      </div>

      {/* AI: Smart Nodes Network (Brain Structure) - Bottom Right */}
      <div className="absolute bottom-[16%] right-[8%] w-24 h-24 opacity-[0.09] dark:opacity-[0.16] animate-float-5 text-indigo-600 dark:text-indigo-400">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Connections */}
          <line x1="30" y1="50" x2="50" y2="25" />
          <line x1="30" y1="50" x2="50" y2="75" />
          <line x1="50" y1="25" x2="70" y2="35" />
          <line x1="50" y1="75" x2="70" y2="65" />
          <line x1="70" y1="35" x2="70" y2="65" />
          <line x1="50" y1="25" x2="50" y2="75" />
          <line x1="30" y1="50" x2="70" y2="50" />
          
          {/* Glowing node circles */}
          <circle cx="30" cy="50" r="4.5" fill="currentColor" />
          <circle cx="50" cy="25" r="4.5" fill="currentColor" />
          <circle cx="50" cy="75" r="4.5" fill="currentColor" />
          <circle cx="70" cy="35" r="4.5" fill="currentColor" />
          <circle cx="70" cy="65" r="4.5" fill="currentColor" />
          <circle cx="70" cy="50" r="3" fill="currentColor" />
          
          {/* Sparkles around AI core */}
          <path d="M50 12 L50 18 M62 17 L58 21" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Styling for floating keyframe animations */}
      <style jsx global>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-15px) rotate(8deg) scale(1.03); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(18px) rotate(-12deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-20px) rotate(15deg) scale(0.97); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(12px) rotate(6deg); }
        }
        @keyframes float-5 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-10px) rotate(-8deg) scale(1.05); }
        }
        .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 10s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 9s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 7s ease-in-out infinite; }
        .animate-float-5 { animation: float-5 11s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 14s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
