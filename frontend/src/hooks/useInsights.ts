import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagCount {
  tag: string;
  count: number;
}

export interface DayActivity {
  date: string;
  notesCreated: number;
  notesEdited: number;
}

export interface RecentNote {
  noteId: string;
  title: string;
  updatedAt: string;
}

export interface AIUsageRecord {
  noteId: string;
  noteTitle: string;
  requestType: "summary" | "tags" | string;
  timestamp: string;
}

export interface LongestNote {
  noteId: string;
  title: string;
  wordCount: number;
}

export interface InsightsData {
  totalNotes: number;
  totalArchived: number;
  notesThisWeek: number;
  mostUsedTags: TagCount[];
  aiUsageThisWeek: number;
  aiUsageTotal: number;
  weeklyActivity: DayActivity[];
  recentlyEdited: RecentNote[];
  longestNote: LongestNote | null;
  writingStreak: number;
  aiUsageHistory: AIUsageRecord[];
}

// ─── Local client-side cache (mirrors backend TTL) ────────────────────────────

interface CacheEntry {
  data: InsightsData;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let clientCache: CacheEntry | null = null;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      // Serve from cache if still fresh
      if (clientCache && clientCache.expiresAt > Date.now()) {
        setData(clientCache.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");

        const token = await user.getIdToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(`${apiUrl}/insights/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `HTTP ${res.status}`);
        }

        const json: InsightsData = await res.json();

        // Store in client cache
        clientCache = { data: json, expiresAt: Date.now() + CACHE_TTL_MS };

        if (!cancelled) {
          setData(json);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load insights");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchInsights();
    return () => { cancelled = true; };
  }, []);

  const refresh = () => {
    clientCache = null; // bust cache
    setData(null);
    setIsLoading(true);
  };

  return { data, isLoading, error, refresh };
}
