import { auth } from "./firebase";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  ai_summary?: string;
  ai_action_items?: string[];
  ai_suggested_title?: string;
  ai_key_topics?: string[];
  ai_last_generated?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const notesApi = {
  async searchNotes(query: string, filters: any, cursor?: string): Promise<Note[]> {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (filters.tags && filters.tags.length > 0) params.append("tags", filters.tags.join(','));
    if (filters.status && filters.status !== 'all') params.append("status", filters.status);
    if (filters.sort) params.append("sort", filters.sort);
    if (cursor) params.append("cursor", cursor);

    const response = await fetch(`${API_URL}/notes/search?${params.toString()}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to search notes");
    return response.json();
  },

  async generateSummary(noteId: string, content: string): Promise<{ summary: string; action_items: string[] }> {
    const response = await fetch(`${API_URL}/notes/${noteId}/generate-summary`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to generate summary");
    return response.json();
  },

  async createNote(data: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_URL}/notes/`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create note");
    return response.json();
  },

  async updateNote(noteId: string, data: Partial<Note>): Promise<Note> {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update note");
    return response.json();
  },

  async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete note");
  },

  async archiveNote(noteId: string): Promise<Note> {
    const response = await fetch(`${API_URL}/notes/${noteId}/archive`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to archive note");
    return response.json();
  },

  async generateShareLink(
    noteId: string
  ): Promise<{ shareUrl: string; shareId: string }> {
    const response = await fetch(`${API_URL}/notes/${noteId}/share`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to generate share link");
    return response.json();
  },

  async revokeShare(noteId: string): Promise<void> {
    const response = await fetch(`${API_URL}/notes/${noteId}/share`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to revoke share");
  },

  async syncUser(): Promise<any> {
    const response = await fetch(`${API_URL}/auth/sync`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to sync user profile");
    return response.json();
  },

  async getMe(): Promise<any> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json();
  }
};
