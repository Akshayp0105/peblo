"use client";

import React, { useState, useMemo } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NoteCard } from "@/components/notes/NoteCard";
import { Plus, Search, LayoutGrid, List as ListIcon, Menu, FileText, Archive as ArchiveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTagColor, getTagBgColor } from "@/components/notes/TagInput";

export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "archived">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { notes, createNote, archiveNote, deleteNote } = useNotes(filterMode === "archived");
  const router = useRouter();

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({});
      router.push(`/notes/${newNote.id}`);
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Peblo Notes
          </h2>
          <button className="md:hidden p-2" onClick={() => setSidebarOpen(false)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1 mb-8">
            <button
              onClick={() => { setFilterMode("all"); setSelectedTag(null); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${filterMode === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <FileText className="h-4 w-4" />
              All Notes
            </button>
            <button
              onClick={() => { setFilterMode("archived"); setSelectedTag(null); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${filterMode === "archived" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ArchiveIcon className="h-4 w-4" />
              Archived
            </button>
          </nav>

          {allTags.length > 0 && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tags
              </h3>
              <div className="space-y-1">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors ${selectedTag === tag ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getTagColor(tag) }}
                    />
                    <span className="truncate">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center px-4 md:px-8 gap-4 shrink-0">
          <button className="md:hidden p-2 -ml-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-transparent rounded-full text-sm focus:outline-none focus:border-border focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {filterMode === "archived" ? "Archived Notes" : selectedTag ? `#${selectedTag}` : "All Notes"}
                </h1>
                <p className="text-muted-foreground">
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </p>
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-48 h-48 mb-6 text-muted-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                <h3 className="text-xl font-semibold mb-2">It's a little quiet here...</h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery ? "No notes match your search. Try different keywords." : "Start your first note and capture your thoughts."}
                </p>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "flex flex-col gap-4"
              }>
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onArchive={archiveNote}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={handleCreateNote}
          className="absolute bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </button>
      </main>
    </div>
  );
}
