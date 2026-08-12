"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
}

export default function BentoCard({ children, className = "" }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden border border-[#EAEAEA] bg-white rounded-2xl p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#DDD9CE] hover:shadow-[0_16px_40px_-20px_rgba(30,34,39,0.18)] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(242,183,5,0.09), transparent 70%)"
        }}
      />
      {children}
    </div>
  );
}
