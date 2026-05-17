import { useState } from 'react';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';
import { useNotesStore } from '../store/useNotesStore';

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

export interface AIAnalysisResult {
  summary: string;
  action_items: string[];
  suggested_title: string;
  key_topics: string[];
}

export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { updateNote } = useNotesStore();

  const generateSummary = async (noteId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/notes/${noteId}/generate-summary`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      
      const data: AIAnalysisResult = await response.json();
      
      // Update local store for optimistic UI if needed.
      // Firestore listener will also pick this up.
      updateNote(noteId, {
        ai_summary: data.summary,
        ai_action_items: data.action_items,
        ai_suggested_title: data.suggested_title,
        ai_key_topics: data.key_topics,
        ai_last_generated: new Date().toISOString(),
      });

      toast.success("AI Summary generated successfully!");
      return data;
    } catch (err) {
      console.error(err);
      toast.error("AI is taking a break. Try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestTags = async (noteId: string, existingTags: string[] = []) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/notes/${noteId}/suggest-tags`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ existing_tags: existingTags }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to suggest tags");
      }
      
      const tags: string[] = await response.json();
      return tags;
    } catch (err) {
      console.error(err);
      toast.error("Failed to suggest tags.");
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateSummary, suggestTags, isGenerating };
}
