"use client";

import { useState } from "react";
import { notesApi } from "@/lib/notesApi";

interface ShareResult {
  shareUrl: string;
  shareId: string;
}

interface UseShareReturn {
  generateShareLink: (noteId: string) => Promise<ShareResult>;
  revokeShare: (noteId: string) => Promise<void>;
  isSharing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateShareLink = async (noteId: string): Promise<ShareResult> => {
    setIsSharing(true);
    setError(null);
    try {
      const response = await notesApi.generateShareLink(noteId);
      // Backend returns { shareUrl, shareId }
      // Derive shareId from URL if backend returns only shareUrl
      const shareId =
        (response as any).shareId ??
        response.shareUrl.split("/").pop() ??
        "";
      return { shareUrl: response.shareUrl, shareId };
    } catch (err: any) {
      const msg = err?.message ?? "Failed to generate share link";
      setError(msg);
      throw err;
    } finally {
      setIsSharing(false);
    }
  };

  const revokeShare = async (noteId: string): Promise<void> => {
    setIsSharing(true);
    setError(null);
    try {
      await notesApi.revokeShare(noteId);
    } catch (err: any) {
      const msg = err?.message ?? "Failed to revoke share link";
      setError(msg);
      throw err;
    } finally {
      setIsSharing(false);
    }
  };

  const clearError = () => setError(null);

  return {
    generateShareLink,
    revokeShare,
    isSharing,
    error,
    clearError,
  };
}
