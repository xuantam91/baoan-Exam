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

    // Track resize
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      width = canvas.width = containerRef.current.offsetWidth;
      height = canvas.height = containerRef.current.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles array
    const particleCount = Math.min(Math.floor((width * height) / 15000), 75); // Density based
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }> = [];

    // Colors
    const isDark = document.documentElement.classList.contains('dark');
    const dotColor = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)';
    const lineColor = isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)';

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35, // slow drift
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#6366F1' : '#8B5CF6', // Indigo or Violet
      });
    }

    // Mouse interactive
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

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 0.85;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        // Connect to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.15;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect to mouse
        if (mouse.active) {
          const distToMouse = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (distToMouse < 180) {
            const alpha = (1 - distToMouse / 180) * 0.35;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Move particles
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce bounds
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
      {/* 1. Canvas constellations for digital nodes connecting */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />

      {/* 2. Delicate glowing background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-tl from-pink-500/10 via-amber-500/5 to-transparent blur-3xl animate-pulse-slow" />

      {/* 3. Tech grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          color: 'hsl(var(--primary))',
        }}
      />

      {/* 4. Fine math lines decoration */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none select-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="20%" x2="90%" y2="20%" stroke="currentColor" strokeWidth="1" strokeDasharray="5,15" />
          <line x1="30%" y1="80%" x2="70%" y2="80%" stroke="currentColor" strokeWidth="1" strokeDasharray="3,10" />
          <circle cx="15%" cy="35%" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4,8" />
          <circle cx="85%" cy="65%" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
