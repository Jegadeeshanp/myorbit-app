'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  duration?: number; // ms, default 3000
  particleCount?: number; // default 120
  onDone?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
  opacity: number;
}

const COLORS = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export default function Confetti({ duration = 3000, particleCount = 120, onDone }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x:             Math.random() * W,
      y:             -20 - Math.random() * 100,
      vx:            (Math.random() - 0.5) * 4,
      vy:            2 + Math.random() * 4,
      color:         COLORS[Math.floor(Math.random() * COLORS.length)],
      size:          6 + Math.random() * 8,
      rotation:      Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      shape:         Math.random() > 0.5 ? 'rect' : 'circle',
      opacity:       1,
    }));

    const startTime = Date.now();
    let raf: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;
      const fadeStart = duration * 0.6;

      particles.forEach((p) => {
        p.x        += p.vx;
        p.y        += p.vy;
        p.vy       += 0.08; // gravity
        p.rotation += p.rotationSpeed;

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (duration * 0.4));
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < duration) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [duration, particleCount, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
