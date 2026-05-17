export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  aiUsageCount: number;
}

export type NoteStatus = 'draft' | 'published' | 'archived';

export interface ActionItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  status: NoteStatus;
  isPublic: boolean;
  shareId?: string;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  actionItems?: ActionItem[];
  suggestedTitle?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface AISummary {
  summary: string;
  actionItems: ActionItem[];
  suggestedTitle: string;
}

export interface ShareLink {
  id: string;
  noteId: string;
  createdAt: string;
  expiresAt?: string;
}

export interface InsightData {
  totalNotes: number;
  totalAiUsage: number;
  mostUsedTags: { tag: string; count: number }[];
  recentActivity: Note[];
}
