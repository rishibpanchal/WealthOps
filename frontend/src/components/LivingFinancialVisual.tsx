import React, { useEffect, useRef } from 'react';

interface LivingFinancialVisualProps {
  mode?: 'hero' | 'unified' | 'compact';
}

interface FinancialNode {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

interface Connection {
  from: string;
  to: string;
  curveFactor: number;
}

interface Particle {
  connIndex: number;
  t: number;
  speed: number;
  size: number;
}

export const LivingFinancialVisual: React.FC<LivingFinancialVisualProps> = ({ mode = 'hero' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initLayout();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Damped mouse offset relative to center (-1 to 1)
      const rect = canvas.getBoundingClientRect();
      const relX = (e.clientX - rect.left - width / 2) / (width / 2);
      const relY = (e.clientY - rect.top - height / 2) / (height / 2);
      mouseRef.current.targetX = relX * 12; // 12px max shift
      mouseRef.current.targetY = relY * 12;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Define Nodes
    let nodes: FinancialNode[] = [];
    let connections: Connection[] = [];
    let particles: Particle[] = [];

    const initLayout = () => {
      const cx = width * 0.62;
      const cy = height * 0.52;

      nodes = [
        { id: 'portfolio', label: 'PORTFOLIO', sublabel: '₹24.8 Cr AUM', x: cx - 180, y: cy - 140, vx: 0, vy: 0, radius: 5, pulsePhase: 0 },
        { id: 'policy', label: 'POLICY RAG', sublabel: 'IPS-2026-04', x: cx + 160, y: cy - 160, vx: 0, vy: 0, radius: 4, pulsePhase: 1 },
        { id: 'risk', label: 'RISK ENGINE', sublabel: 'VaR 95% 1.85%', x: cx + 220, y: cy + 40, vx: 0, vy: 0, radius: 5, pulsePhase: 2 },
        { id: 'guardrail', label: 'GUARDRAILS', sublabel: '₹10L / 5% DRIFT', x: cx - 40, y: cy - 20, vx: 0, vy: 0, radius: 6, pulsePhase: 3 },
        { id: 'market', label: 'MARKET CONNECT', sublabel: 'TICK 545.10', x: cx - 220, y: cy + 100, vx: 0, vy: 0, radius: 4, pulsePhase: 4 },
        { id: 'approval', label: 'DUAL APPROVAL', sublabel: 'RISK OFFICER', x: cx + 110, y: cy + 170, vx: 0, vy: 0, radius: 5, pulsePhase: 5 },
        { id: 'audit', label: 'IMMUTABLE AUDIT', sublabel: 'CHECK #8F91', x: cx - 110, y: cy + 200, vx: 0, vy: 0, radius: 4, pulsePhase: 6 },
      ];

      connections = [
        { from: 'portfolio', to: 'guardrail', curveFactor: 0.15 },
        { from: 'policy', to: 'guardrail', curveFactor: -0.2 },
        { from: 'guardrail', to: 'risk', curveFactor: 0.1 },
        { from: 'market', to: 'portfolio', curveFactor: -0.15 },
        { from: 'guardrail', to: 'approval', curveFactor: 0.2 },
        { from: 'risk', to: 'approval', curveFactor: -0.1 },
        { from: 'approval', to: 'audit', curveFactor: 0.15 },
        { from: 'portfolio', to: 'audit', curveFactor: -0.25 },
      ];

      particles = [
        { connIndex: 0, t: 0.1, speed: 0.0035, size: 2.2 },
        { connIndex: 0, t: 0.6, speed: 0.0035, size: 2.0 },
        { connIndex: 1, t: 0.3, speed: 0.004, size: 2.4 },
        { connIndex: 2, t: 0.5, speed: 0.003, size: 2.0 },
        { connIndex: 3, t: 0.2, speed: 0.0045, size: 2.2 },
        { connIndex: 4, t: 0.7, speed: 0.0035, size: 2.5 },
        { connIndex: 5, t: 0.4, speed: 0.004, size: 2.1 },
        { connIndex: 6, t: 0.15, speed: 0.0035, size: 2.3 },
        { connIndex: 7, t: 0.8, speed: 0.003, size: 2.0 },
      ];
    };

    initLayout();

    let frameCount = 0;

    const render = () => {
      frameCount++;

      // Smooth mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Subtle atmospheric grid coordinates (hairline dots)
      ctx.fillStyle = 'rgba(214, 210, 200, 0.45)';
      const step = 80;
      for (let x = step / 2; x < width; x += step) {
        for (let y = step / 2; y < height; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw Connections (fine bezier curves)
      connections.forEach((conn) => {
        const n1 = nodes.find((n) => n.id === conn.from);
        const n2 = nodes.find((n) => n.id === conn.to);
        if (!n1 || !n2) return;

        const x1 = n1.x + mouseRef.current.x;
        const y1 = n1.y + mouseRef.current.y;
        const x2 = n2.x + mouseRef.current.x;
        const y2 = n2.y + mouseRef.current.y;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cpX = midX - dy * conn.curveFactor;
        const cpY = midY + dx * conn.curveFactor;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);
        ctx.strokeStyle = 'rgba(196, 191, 178, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw and Update Particles (capital/data streams)
      particles.forEach((p) => {
        const conn = connections[p.connIndex];
        if (!conn) return;
        const n1 = nodes.find((n) => n.id === conn.from);
        const n2 = nodes.find((n) => n.id === conn.to);
        if (!n1 || !n2) return;

        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const x1 = n1.x + mouseRef.current.x;
        const y1 = n1.y + mouseRef.current.y;
        const x2 = n2.x + mouseRef.current.x;
        const y2 = n2.y + mouseRef.current.y;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cpX = midX - dy * conn.curveFactor;
        const cpY = midY + dx * conn.curveFactor;

        // Quadratic bezier formula
        const t = p.t;
        const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpX + t * t * x2;
        const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpY + t * t * y2;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(158, 107, 71, 0.85)'; // Restrained bronze
        ctx.fill();
      });

      // Draw Financial Nodes
      nodes.forEach((node) => {
        // Slow organic idle breathing
        const idleX = Math.sin(frameCount * 0.015 + node.pulsePhase) * 3;
        const idleY = Math.cos(frameCount * 0.012 + node.pulsePhase) * 3;

        const nx = node.x + mouseRef.current.x + idleX;
        const ny = node.y + mouseRef.current.y + idleY;

        // Subtle outer pulse ring
        const pulse = (Math.sin(frameCount * 0.03 + node.pulsePhase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + 6 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(158, 107, 71, ${0.15 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node center
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.id === 'guardrail' ? '#121316' : '#9E6B47';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, node.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FBFBFA';
        ctx.fill();

        // Editorial Typography Labels
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillStyle = '#121316';
        ctx.textAlign = 'left';
        ctx.fillText(node.label, nx + 12, ny - 2);

        ctx.font = '500 8px JetBrains Mono, monospace';
        ctx.fillStyle = '#8A867E';
        ctx.fillText(node.sublabel, nx + 12, ny + 9);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};
