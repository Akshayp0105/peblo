import { Metadata } from "next";
import SharedNoteClient from "./SharedNoteClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SharedNote {
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  viewCount: number;
}

async function getSharedNote(shareId: string): Promise<SharedNote | null> {
  try {
    const res = await fetch(`${API_URL}/shared/${shareId}`, {
      // Re-validate every 60 s so viewCount is reasonably fresh
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Strip HTML tags and grab first 160 chars for og:description */
function htmlToExcerpt(html: string, maxLen = 160): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// ─── OG / Twitter meta ───────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const note = await getSharedNote(shareId);

  if (!note) {
    return {
      title: "Note Not Found — Peblo Notes",
      description: "This note does not exist or is no longer public.",
    };
  }

  const excerpt = htmlToExcerpt(note.content);
  const ogDescription = excerpt || "A note shared via Peblo Notes.";

  return {
    title: `${note.title} — Peblo Notes`,
    description: ogDescription,
    openGraph: {
      title: note.title,
      description: ogDescription,
      type: "article",
      siteName: "Peblo Notes",
    },
    twitter: {
      card: "summary",
      title: note.title,
      description: ogDescription,
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function SharedNotePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const note = await getSharedNote(shareId);
  return <SharedNoteClient note={note} shareId={shareId} />;
}
