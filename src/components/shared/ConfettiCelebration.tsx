"use client";

import { useEffect, useState } from "react";

const COLORS = ["#ff6b35", "#1a2744", "#ffd700", "#ff4081", "#69f0ae", "#00b0ff", "#e040fb"];

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  shape: "circle" | "rect" | "triangle";
}

function randomPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 10,
    rotate: Math.random() * 360,
    shape: (["circle", "rect", "triangle"] as const)[Math.floor(Math.random() * 3)],
  }));
}

export function ConfettiCelebration({ message, onDone }: { message?: string; onDone?: () => void }) {
  const [pieces] = useState<Piece[]>(() => randomPieces(100));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 5500);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-30px) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
        @keyframes confetti-sway {
          0%, 100% { margin-left: 0; }
          25% { margin-left: 20px; }
          75% { margin-left: -20px; }
        }
      `}</style>

      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards,
                         confetti-sway ${p.duration * 0.6}s ${p.delay}s ease-in-out infinite`,
          }}
        >
          {p.shape === "circle" && (
            <div style={{ width: p.size, height: p.size, borderRadius: "50%", background: p.color }} />
          )}
          {p.shape === "rect" && (
            <div style={{
              width: p.size, height: p.size * 0.5,
              background: p.color,
              transform: `rotate(${p.rotate}deg)`,
            }} />
          )}
          {p.shape === "triangle" && (
            <div style={{
              width: 0, height: 0,
              borderLeft: `${p.size * 0.5}px solid transparent`,
              borderRight: `${p.size * 0.5}px solid transparent`,
              borderBottom: `${p.size}px solid ${p.color}`,
              transform: `rotate(${p.rotate}deg)`,
            }} />
          )}
        </div>
      ))}

      {message && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center">
          <div
            className="animate-bounce rounded-2xl bg-white px-8 py-5 shadow-2xl text-center"
            style={{ animation: "none", animationDelay: "0.5s" }}
          >
            <p className="text-3xl mb-1">🎉</p>
            <p className="text-lg font-bold text-navy-900">{message}</p>
            <p className="text-xs text-neutral-500 mt-1">Congratulations on your signed lease!</p>
          </div>
        </div>
      )}
    </div>
  );
}
