import { useState, useMemo, useCallback } from 'react';
import { Note } from '../lib/notesApi';
import { notesApi } from '../lib/notesApi';

export type SortMode = 'recent' | 'oldest' | 'alphabetical' | 'ai_uses';

export interface SearchFilters {
  tags: string[];
  status: 'all' | 'active' | 'archived';
  sort: SortMode;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    status: 'active',
    sort: 'recent',
  });

  const searchNotes = useCallback(async (searchQuery: string, currentFilters: SearchFilters) => {
    return await notesApi.searchNotes(searchQuery, currentFilters);
  }, []);

  const useFilteredNotes = (notes: Note[], currentFilters: SearchFilters, searchQuery: string) => {
    return useMemo(() => {
      let filtered = [...notes];

      // 1. Filter by Status
      if (currentFilters.status === 'active') {
        filtered = filtered.filter(n => !n.is_archived);
      } else if (currentFilters.status === 'archived') {
        filtered = filtered.filter(n => n.is_archived);
      }

      // 2. Filter by Tags (Must include ALL selected tags)
      if (currentFilters.tags.length > 0) {
        filtered = filtered.filter(n => 
          currentFilters.tags.every(tag => n.tags?.includes(tag))
        );
      }

      // 3. Filter by Search Query (Title, Content, Tags)
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(n => 
          n.title?.toLowerCase().includes(lowerQuery) ||
          n.content?.toLowerCase().includes(lowerQuery) ||
          n.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }

      // 4. Sort
      filtered.sort((a, b) => {
        if (currentFilters.sort === 'recent') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        if (currentFilters.sort === 'oldest') {
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }
        if (currentFilters.sort === 'alphabetical') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (currentFilters.sort === 'ai_uses') {
          // Fallback to recent if ai_uses doesn't exist (assuming not in Note model for now)
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return 0;
      });

      return filtered;
    }, [notes, currentFilters, searchQuery]);
  };

  return {
    query,
    setQuery,
    filters,
    setFilters,
    searchNotes,
    useFilteredNotes,
  };
}
