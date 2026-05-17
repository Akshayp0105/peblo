"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { Search, FileText, Plus, LayoutDashboard, Archive, Tag, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotesStore } from "@/store/useNotesStore";
import { useSearch } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { notes } = useNotesStore();
  const { query, setQuery, useFilteredNotes, filters } = useSearch();

  // Debounced query for the actual filter
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredNotes = useFilteredNotes(notes, filters, debouncedQuery);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Extract unique tags from notes
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);

  const filteredTags = useMemo(() => {
    if (!debouncedQuery) return tags.slice(0, 5);
    return tags.filter(tag => tag.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 5);
  }, [tags, debouncedQuery]);

  const onSelectAction = useCallback((action: string) => {
    setOpen(false);
    if (action === "new") router.push("/notes/new");
    if (action === "dashboard") router.push("/dashboard");
    if (action === "archives") router.push("/archives"); // assuming /archives exists or handle differently
  }, [router]);

  const onSelectNote = useCallback((id: string) => {
    setOpen(false);
    router.push(`/notes/${id}`);
  }, [router]);

  // Highlight matching text helper
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-500/40 text-inherit rounded-sm px-0.5">{part}</mark> : part
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Command 
        className="w-full max-w-xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <div className="flex items-center border-b border-white/10 px-4 py-3">
          <Search className="w-5 h-5 text-zinc-400 mr-3" />
          <Command.Input 
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search notes, tags, commands..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-500 text-base"
          />
          <div className="text-xs text-zinc-500 bg-white/10 px-2 py-1 rounded">ESC</div>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
          <Command.Empty className="py-12 flex flex-col items-center justify-center text-zinc-400">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <p>No notes match '{query}'</p>
          </Command.Empty>

          <Command.Group heading="Quick Actions" className="px-2 py-1 text-xs text-zinc-400 font-medium">
            <Command.Item onSelect={() => onSelectAction("new")} className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors text-sm text-zinc-200">
              <Plus className="w-4 h-4 mr-3 text-zinc-400" /> Create New Note
            </Command.Item>
            <Command.Item onSelect={() => onSelectAction("dashboard")} className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors text-sm text-zinc-200">
              <LayoutDashboard className="w-4 h-4 mr-3 text-zinc-400" /> Go to Dashboard
            </Command.Item>
            <Command.Item onSelect={() => onSelectAction("archives")} className="flex items-center px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors text-sm text-zinc-200">
              <Archive className="w-4 h-4 mr-3 text-zinc-400" /> View Archives
            </Command.Item>
          </Command.Group>

          {filteredTags.length > 0 && (
            <Command.Group heading="Tags" className="px-2 py-2 mt-2 text-xs text-zinc-400 font-medium border-t border-white/5">
              {filteredTags.map(tag => (
                <Command.Item key={tag} value={`tag:${tag}`} onSelect={() => setQuery(tag)} className="flex items-center px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors text-sm text-zinc-200">
                  <Tag className="w-4 h-4 mr-3 text-indigo-400" /> 
                  {highlightText(tag, debouncedQuery)}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {filteredNotes.length > 0 && (
            <Command.Group heading="Notes" className="px-2 py-2 mt-2 text-xs text-zinc-400 font-medium border-t border-white/5">
              {filteredNotes.slice(0, 8).map(note => (
                <Command.Item 
                  key={note.id} 
                  value={note.id + " " + note.title}
                  onSelect={() => onSelectNote(note.id)} 
                  className="flex flex-col px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 transition-colors group relative"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-sm font-medium text-zinc-200">
                      <FileText className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{highlightText(note.title, debouncedQuery)}</span>
                    </div>
                    <div className="flex items-center text-[10px] text-zinc-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  {note.excerpt && (
                    <div className="pl-7 mt-1 text-xs text-zinc-500 line-clamp-1">
                      {highlightText(note.excerpt, debouncedQuery)}
                    </div>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="pl-7 mt-2 flex gap-1">
                      {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Hover Actions */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-zinc-800/90 backdrop-blur px-2 py-1 rounded shadow-sm">
                     <span className="text-xs text-zinc-300">Enter to open</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

        </Command.List>
      </Command>

      {/* Overlay click handler */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
    </div>
  );
}
