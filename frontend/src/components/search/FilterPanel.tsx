"use client";

import React, { useMemo } from "react";
import { SearchFilters, SortMode } from "@/hooks/useSearch";
import { Check, ChevronDown, X, Filter } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";

interface FilterPanelProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
}

export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const { notes } = useNotesStore();

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const setStatus = (status: SearchFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const setSort = (sort: SortMode) => {
    setFilters(prev => ({ ...prev, sort }));
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-6 p-4 bg-zinc-900/30 border-r border-white/5 h-full overflow-y-auto">
      <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
        <Filter className="w-4 h-4 text-zinc-400" />
        Filters
      </div>

      {/* Status Filter */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</h3>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
          {(['all', 'active', 'archived'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatus(status)}
              className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-all ${
                filters.status === status 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Filter */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sort By</h3>
        <select 
          value={filters.sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="w-full bg-zinc-900 border border-white/10 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="ai_uses">Most AI Uses</option>
        </select>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => {
              const isActive = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                    isActive 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterChips({ filters, setFilters }: FilterPanelProps) {
  const activeFiltersCount = filters.tags.length + (filters.status !== 'all' ? 1 : 0);

  if (activeFiltersCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
      <span className="text-xs text-zinc-500">Active filters:</span>
      
      {filters.status !== 'all' && (
        <span className="inline-flex items-center gap-1 bg-zinc-800 border border-white/10 text-zinc-300 text-xs px-2 py-1 rounded-md">
          Status: {filters.status}
          <button 
            onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-2 py-1 rounded-md">
          Tag: {tag}
          <button 
            onClick={() => setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
            className="hover:text-indigo-100"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button 
        onClick={() => setFilters(prev => ({ ...prev, tags: [], status: 'all', sort: 'recent' }))}
        className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 ml-2"
      >
        Clear all
      </button>
    </div>
  );
}
