"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  suffix?: string;
  /** positive = gain, negative = loss, undefined = no trend */
  trend?: number;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  /** If true, renders a small fire emoji animation when value > 3 */
  fireMode?: boolean;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, active = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) { setCount(0); return; }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);

  return count;
}

// ─── Fire Animation ────────────────────────────────────────────────────────────

function FireBadge() {
  return (
    <span
      className="fire-badge"
      aria-label="on fire"
      style={{
        display: "inline-flex",
        alignItems: "center",
        animation: "firePulse 0.9s ease-in-out infinite alternate",
        fontSize: "1.25rem",
        marginLeft: "0.4rem",
      }}
    >
      🔥
    </span>
  );
}

// ─── StatCard Component ───────────────────────────────────────────────────────

export function StatCard({
  id,
  icon,
  title,
  value,
  suffix = "",
  trend,
  gradientFrom,
  gradientTo,
  iconBg,
  fireMode = false,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const displayCount = useCountUp(value, 1100, visible);

  // IntersectionObserver to trigger animation on scroll-into-view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trendPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;
  const showFire = fireMode && value > 3;

  return (
    <>
      <style>{`
        @keyframes firePulse {
          from { transform: scale(1) rotate(-5deg); }
          to   { transform: scale(1.2) rotate(5deg); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          animation: cardReveal 0.5s ease both;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        }
      `}</style>

      <div
        id={id}
        ref={ref}
        className="stat-card"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          background: `linear-gradient(135deg, ${gradientFrom}22 0%, ${gradientTo}18 100%)`,
          border: `1px solid ${gradientFrom}30`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          cursor: "default",
        }}
      >
        {/* Watermark icon */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-1rem",
            bottom: "-1rem",
            fontSize: "7rem",
            opacity: 0.06,
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {icon}
        </div>

        {/* Icon pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem",
            borderRadius: "0.875rem",
            background: iconBg,
            marginBottom: "1rem",
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--muted-foreground, #9ca3af)",
            marginBottom: "0.35rem",
          }}
        >
          {title}
        </p>

        {/* Value row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "2.6rem",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "var(--foreground, #f1f5f9)",
            }}
          >
            {displayCount}
            {suffix}
          </span>
          {showFire && <FireBadge />}
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <div
            style={{
              marginTop: "0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              background: trendPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: trendPositive ? "#4ade80" : "#f87171",
            }}
          >
            <span>{trendPositive ? "▲" : "▼"}</span>
            <span>{trendAbs}%</span>
            <span style={{ fontWeight: 400, color: "var(--muted-foreground, #9ca3af)", marginLeft: "0.1rem" }}>
              vs last week
            </span>
          </div>
        )}
      </div>
    </>
  );
}
