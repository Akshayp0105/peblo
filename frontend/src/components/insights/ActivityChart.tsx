"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// Recharts v3 injects these props at render time – define our own compatible type
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string; payload?: any; fill?: string }>;
  label?: string;
}
import type { DayActivity, TagCount } from "@/hooks/useInsights";

// ─── Shared palette ───────────────────────────────────────────────────────────

const PURPLE = "#a855f7";
const TEAL = "#14b8a6";
const AMBER = "#f59e0b";
const TAG_COLORS = [
  "#a855f7", "#14b8a6", "#f59e0b", "#3b82f6",
  "#ec4899", "#10b981", "#f97316", "#6366f1",
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,15,25,0.92)",
        border: "1px solid rgba(168,85,247,0.3)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.4rem" }}>{label}</p>
      {payload.map((entry, i) => (
        <p
          key={entry.dataKey ?? i}
          style={{
            color: entry.color,
            fontSize: "0.875rem",
            fontWeight: 600,
            margin: "0.15rem 0",
          }}
        >
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function TagTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const innerPayload = entry.payload;
  const value = entry.value;
  return (
    <div
      style={{
        background: "rgba(15,15,25,0.92)",
        border: "1px solid rgba(20,184,166,0.3)",
        borderRadius: "0.75rem",
        padding: "0.6rem 0.9rem",
        backdropFilter: "blur(12px)",
      }}
    >
      <p style={{ color: innerPayload?.fill ?? TEAL, fontSize: "0.875rem", fontWeight: 700 }}>
        #{innerPayload?.tag}
      </p>
      <p style={{ color: "#e2e8f0", fontSize: "0.8rem" }}>Used {value} times</p>
    </div>
  );
}

// ─── Format date label ─────────────────────────────────────────────────────────

function dayLabel(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

// ─── Weekly Activity Chart ────────────────────────────────────────────────────

interface ActivityChartProps {
  data: DayActivity[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    day: dayLabel(d.date),
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
          barCategoryGap="35%"
          barGap={3}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend
            wrapperStyle={{ fontSize: "0.78rem", paddingTop: "0.75rem", color: "#94a3b8" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="notesCreated"
            name="Created"
            stackId="a"
            fill={PURPLE}
            radius={[0, 0, 0, 0]}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="notesEdited"
            name="Edited"
            stackId="a"
            fill={TEAL}
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={900}
            animationBegin={150}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Tags Donut Chart ─────────────────────────────────────────────────────────

interface TagsChartProps {
  data: TagCount[];
}

export function TagsChart({ data }: TagsChartProps) {
  if (!data.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, color: "#64748b", fontSize: "0.9rem" }}>
        No tags yet
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="tag"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={3}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TAG_COLORS[index % TAG_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TagTooltip />} />
          <Legend
            formatter={(value) => `#${value}`}
            wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8", paddingTop: "0.5rem" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
