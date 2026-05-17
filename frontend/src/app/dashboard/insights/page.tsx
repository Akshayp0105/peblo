"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Sparkles,
  Flame,
  Clock,
  Brain,
  Trophy,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { useInsights } from "@/hooks/useInsights";
import { StatCard } from "@/components/insights/StatCard";
import { ActivityChart, TagsChart } from "@/components/insights/ActivityChart";

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 24, radius = 8 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "rgba(255,255,255,0.06)",
        animation: "shimmer 1.6s ease-in-out infinite",
      }}
    />
  );
}

function CardSkeleton() {
  return (
    <div
      style={{
        borderRadius: "1.25rem",
        padding: "1.5rem",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <Skeleton w={44} h={44} radius={14} />
      <Skeleton w="60%" h={14} />
      <Skeleton w="40%" h={40} radius={6} />
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1.25rem",
        padding: "1.5rem",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1.25rem",
        }}
      >
        <span style={{ color: "#a855f7" }}>{icon}</span>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--foreground, #f1f5f9)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ─── Motivational banner ──────────────────────────────────────────────────────

function MotivationalBanner({
  streak,
  totalNotes,
}: {
  streak: number;
  totalNotes: number;
}) {
  let message = "";
  let emoji = "✨";
  let accent = "#a855f7";

  if (streak >= 30) {
    emoji = "🏆";
    message = `${streak}-day streak! Legendary consistency. You're unstoppable.`;
    accent = "#f59e0b";
  } else if (streak >= 7) {
    emoji = "🔥";
    message = `${streak}-day streak! You're on fire!`;
    accent = "#f97316";
  } else if (streak >= 3) {
    emoji = "⚡";
    message = `${streak} days strong — keep the momentum going!`;
    accent = "#6366f1";
  } else if (totalNotes > 100) {
    emoji = "🧠";
    message = "Over 100 notes — you've built an impressive knowledge base!";
    accent = "#14b8a6";
  } else if (totalNotes > 50) {
    emoji = "📚";
    message = "You've written over 50 notes. That's a real knowledge base!";
    accent = "#3b82f6";
  } else if (totalNotes > 0) {
    emoji = "🌱";
    message = "Keep writing — every note is a seed of an idea!";
    accent = "#10b981";
  }

  if (!message) return null;

  return (
    <div
      style={{
        borderRadius: "1.25rem",
        padding: "1.25rem 1.5rem",
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
        border: `1px solid ${accent}35`,
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: "2rem" }}>{emoji}</span>
      <p style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 500, margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

// ─── Recently Edited list ─────────────────────────────────────────────────────

function RelativeTime({ iso }: { iso: string }) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  let label = "just now";
  if (diff > 86400 * 2) label = `${Math.floor(diff / 86400)}d ago`;
  else if (diff > 86400) label = "yesterday";
  else if (diff > 3600) label = `${Math.floor(diff / 3600)}h ago`;
  else if (diff > 60) label = `${Math.floor(diff / 60)}m ago`;
  return <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{label}</span>;
}

// ─── AI request type badge ────────────────────────────────────────────────────

function ReqTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    summary: { label: "Summary", color: "#a855f7" },
    tags: { label: "Tags", color: "#14b8a6" },
  };
  const { label = type, color = "#6366f1" } = map[type] ?? {};
  return (
    <span
      style={{
        fontSize: "0.68rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "0.15rem 0.45rem",
        borderRadius: "999px",
        background: `${color}25`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <div style={{ fontSize: "5rem" }}>📝</div>
      <div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem" }}>
          Write your first note to see insights
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Your personal analytics dashboard will come alive once you start writing.
        </p>
      </div>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          padding: "0.75rem 1.75rem",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #a855f7, #6366f1)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.9rem",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(168,85,247,0.35)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        Go write something ✍️
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { data, isLoading, error, refresh } = useInsights();
  const router = useRouter();

  const isEmpty = !isLoading && !error && data?.totalNotes === 0 && data?.totalArchived === 0;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .insights-root * { box-sizing: border-box; }
        .insights-root { font-family: 'Inter', system-ui, sans-serif; }
        .note-row:hover { background: rgba(168,85,247,0.07) !important; }
        .ai-row:hover { background: rgba(20,184,166,0.07) !important; }
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 480px) {
          .grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        className="insights-root"
        style={{
          minHeight: "100vh",
          background: "var(--background, #0a0a12)",
          color: "var(--foreground, #f1f5f9)",
          padding: "2rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2.5rem",
              animation: "fadeUp 0.5s ease both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                onClick={() => router.back()}
                title="Back"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.75rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    margin: 0,
                    background: "linear-gradient(135deg, #a855f7 0%, #14b8a6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Productivity Insights
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
                  Your personal writing analytics
                </p>
              </div>
            </div>

            <button
              onClick={refresh}
              title="Refresh insights"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "#a855f7",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.875rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
                marginBottom: "2rem",
                fontSize: "0.875rem",
              }}
            >
              ⚠️ Could not load insights: {error}
            </div>
          )}

          {/* ── Loading Skeletons ── */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div
                className="grid-4"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}
              >
                {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
              </div>
              <div
                className="grid-2"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}
              >
                <div style={{ borderRadius: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "1.5rem", height: 340 }}>
                  <Skeleton h={18} w="40%" />
                  <div style={{ marginTop: "1.5rem" }}><Skeleton h={220} radius={12} /></div>
                </div>
                <div style={{ borderRadius: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "1.5rem", height: 340 }}>
                  <Skeleton h={18} w="40%" />
                  <div style={{ marginTop: "1.5rem" }}><Skeleton h={220} radius={12} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty State ── */}
          {isEmpty && <EmptyState />}

          {/* ── Dashboard Content ── */}
          {!isLoading && !error && data && !isEmpty && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

              {/* Motivational Banner */}
              <div style={{ animation: "fadeUp 0.4s 0.05s ease both" }}>
                <MotivationalBanner streak={data.writingStreak} totalNotes={data.totalNotes} />
              </div>

              {/* ── Stat Cards Row ── */}
              <div
                className="grid-4"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1.25rem",
                  animation: "fadeUp 0.5s 0.1s ease both",
                }}
              >
                <StatCard
                  id="stat-total-notes"
                  icon={<FileText size={20} color="#a855f7" />}
                  title="Total Notes"
                  value={data.totalNotes}
                  gradientFrom="#a855f7"
                  gradientTo="#6366f1"
                  iconBg="rgba(168,85,247,0.18)"
                />
                <StatCard
                  id="stat-notes-week"
                  icon={<Calendar size={20} color="#14b8a6" />}
                  title="Notes This Week"
                  value={data.notesThisWeek}
                  gradientFrom="#14b8a6"
                  gradientTo="#06b6d4"
                  iconBg="rgba(20,184,166,0.18)"
                />
                <StatCard
                  id="stat-ai-week"
                  icon={<Sparkles size={20} color="#f59e0b" />}
                  title="AI Uses This Week"
                  value={data.aiUsageThisWeek}
                  gradientFrom="#f59e0b"
                  gradientTo="#f97316"
                  iconBg="rgba(245,158,11,0.18)"
                />
                <StatCard
                  id="stat-streak"
                  icon={<Flame size={20} color="#f97316" />}
                  title="Writing Streak"
                  value={data.writingStreak}
                  suffix=" d"
                  gradientFrom="#f97316"
                  gradientTo="#ef4444"
                  iconBg="rgba(249,115,22,0.18)"
                  fireMode
                />
              </div>

              {/* ── Charts Row ── */}
              <div
                className="grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.25rem",
                  animation: "fadeUp 0.5s 0.18s ease both",
                }}
              >
                <Section
                  title="Weekly Activity"
                  icon={<TrendingUp size={17} />}
                >
                  <ActivityChart data={data.weeklyActivity} />
                </Section>

                <Section
                  title="Most Used Tags"
                  icon={<Trophy size={17} />}
                >
                  <TagsChart data={data.mostUsedTags} />
                </Section>
              </div>

              {/* ── Lists Row ── */}
              <div
                className="grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.25rem",
                  animation: "fadeUp 0.5s 0.26s ease both",
                }}
              >
                {/* Recently Edited */}
                <Section
                  title="Recently Edited"
                  icon={<Clock size={17} />}
                >
                  {data.recentlyEdited.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No notes edited recently.</p>
                  ) : (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {data.recentlyEdited.map((note) => (
                        <li
                          key={note.noteId}
                          className="note-row"
                          onClick={() => router.push(`/notes/${note.noteId}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem 0.875rem",
                            borderRadius: "0.875rem",
                            cursor: "pointer",
                            border: "1px solid transparent",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(168,85,247,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                            <div
                              style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "0.5rem",
                                background: "rgba(168,85,247,0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={13} color="#a855f7" />
                            </div>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#e2e8f0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {note.title}
                            </span>
                          </div>
                          {note.updatedAt && <RelativeTime iso={note.updatedAt} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* AI Usage History */}
                <Section
                  title="AI Usage History"
                  icon={<Brain size={17} />}
                >
                  {data.aiUsageHistory.length === 0 ? (
                    <div>
                      <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>
                        No AI analyses yet.
                      </p>
                      <p style={{ color: "#475569", fontSize: "0.8rem", margin: 0 }}>
                        Total AI uses (all time):{" "}
                        <strong style={{ color: "#a855f7" }}>{data.aiUsageTotal}</strong>
                      </p>
                    </div>
                  ) : (
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {data.aiUsageHistory.map((rec, i) => (
                        <li
                          key={i}
                          className="ai-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem 0.875rem",
                            borderRadius: "0.875rem",
                            border: "1px solid transparent",
                            transition: "background 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                            <div
                              style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "0.5rem",
                                background: "rgba(20,184,166,0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Sparkles size={13} color="#14b8a6" />
                            </div>
                            <div style={{ overflow: "hidden" }}>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  color: "#e2e8f0",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {rec.noteTitle}
                              </span>
                              <ReqTypeBadge type={rec.requestType} />
                            </div>
                          </div>
                          {rec.timestamp && <RelativeTime iso={rec.timestamp} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>

              {/* ── Bottom Stats Row ── */}
              <div
                className="grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.25rem",
                  animation: "fadeUp 0.5s 0.34s ease both",
                }}
              >
                {/* Longest Note */}
                {data.longestNote && (
                  <Section title="Longest Note" icon={<Trophy size={17} />}>
                    <div
                      onClick={() => router.push(`/notes/${data.longestNote!.noteId}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "1rem",
                        borderRadius: "0.875rem",
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.07)"; }}
                    >
                      <span style={{ fontSize: "2.5rem" }}>📖</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0", fontSize: "0.95rem" }}>
                          {data.longestNote.title}
                        </p>
                        <p style={{ margin: "0.2rem 0 0", color: "#f59e0b", fontSize: "0.825rem", fontWeight: 600 }}>
                          {data.longestNote.wordCount.toLocaleString()} words
                        </p>
                      </div>
                    </div>
                  </Section>
                )}

                {/* AI Summary card */}
                <Section title="AI Overview" icon={<Sparkles size={17} />}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "1rem",
                        borderRadius: "0.875rem",
                        background: "rgba(168,85,247,0.07)",
                        border: "1px solid rgba(168,85,247,0.18)",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#a855f7", margin: 0 }}>
                        {data.aiUsageTotal}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                        Total AI uses
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "1rem",
                        borderRadius: "0.875rem",
                        background: "rgba(20,184,166,0.07)",
                        border: "1px solid rgba(20,184,166,0.18)",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#14b8a6", margin: 0 }}>
                        {data.totalArchived}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                        Archived notes
                      </p>
                    </div>
                  </div>
                </Section>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
