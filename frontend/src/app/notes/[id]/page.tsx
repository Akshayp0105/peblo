"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNote } from "@/hooks/useNotes";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { notesApi, Note } from "@/lib/notesApi";
import { TagInput } from "@/components/notes/TagInput";
import {
  ChevronLeft,
  Share2,
  Archive as ArchiveIcon,
  PanelRightClose,
  PanelRightOpen,
  Wand2,
  Bold,
  Italic,
  List,
  Code,
  CheckSquare
} from "lucide-react";

export default function NoteEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const { note, updateNote, error } = useNote(id);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "">("");
  
  // AI State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start typing your notes here..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: note?.content || "",
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none dark:prose-invert min-h-[500px]",
      },
    },
  });

  // Sync initial note state
  useEffect(() => {
    if (note) {
      if (title === "") setTitle(note.title);
      if (tags.length === 0 && note.tags) setTags(note.tags);
      if (category === null && note.category) setCategory(note.category);
      if (editor && editor.getHTML() !== note.content && !editor.isFocused) {
        editor.commands.setContent(note.content);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, editor]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "Saving...") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  const triggerSave = useCallback((dataToSave: Partial<Note>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("Saving...");
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote(dataToSave);
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err) {
        console.error("Save failed", err);
        setSaveStatus("");
      }
    }, 1500);
  }, [updateNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    
    triggerSave({ title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    triggerSave({ content: newContent });
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    triggerSave({ tags: newTags });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    triggerSave({ category: newCat });
  };

  const handleArchive = async () => {
    try {
      await notesApi.archiveNote(id);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = async () => {
    if (!editor) return;
    setIsGeneratingAI(true);
    try {
      const res = await notesApi.generateSummary(id, editor.getText());
      setSummary(res.summary);
      setActionItems(res.action_items);
      
      // Optionally save them to the note, but prompt just says "Action items list (from AI)" in Right Panel
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading note: {error.message}</div>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                {saveStatus && (
                  <span className="flex items-center gap-1.5">
                    {saveStatus === "Saving..." && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                    {saveStatus}
                  </span>
                )}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors lg:hidden"
          >
            {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </button>
        </header>

        {/* Editor Content */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-8 sm:p-12">
          <textarea
            value={title}
            onChange={handleTitleChange}
            placeholder="Note Title"
            className="w-full text-4xl sm:text-5xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-muted-foreground/50 text-foreground mb-8"
            rows={1}
          />
          
          {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-popover border border-border shadow-lg rounded-lg overflow-hidden p-1 gap-1">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-[1px] bg-border mx-1 my-1" />
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`p-1.5 rounded hover:bg-muted ${editor.isActive('taskList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <CheckSquare className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded hover:bg-muted ${editor.isActive('codeBlock') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                <Code className="h-4 w-4" />
              </button>
            </BubbleMenu>
          )}

          <EditorContent editor={editor} className="min-h-[50vh]" />
        </div>
      </main>

      {/* Right Panel */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-80 bg-card border-l border-border transform transition-transform duration-300 ease-in-out flex flex-col
        lg:static lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:hidden"}
      `}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Note Details</h3>
          <button className="lg:hidden p-1" onClick={() => setIsSidebarOpen(false)}>
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Tags
            </label>
            <TagInput tags={tags} onChange={handleTagsChange} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Category
            </label>
            <select
              value={category || ""}
              onChange={handleCategoryChange}
              className="w-full bg-transparent border border-input rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">No Category</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Ideas">Ideas</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>

          <hr className="border-border" />

          {/* AI Summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="h-3 w-3 text-primary" /> AI Insights
              </label>
            </div>
            
            {!summary && !isGeneratingAI ? (
              <button
                onClick={handleGenerateAI}
                disabled={!editor || editor.getText().length < 20}
                className="w-full py-2 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wand2 className="h-4 w-4" /> Generate Summary
              </button>
            ) : (
              <div className="space-y-4 text-sm">
                {isGeneratingAI ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <span className="animate-pulse">Generating insights...</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="font-medium text-foreground mb-1">Summary</p>
                      <p className="text-muted-foreground leading-relaxed">{summary}</p>
                    </div>
                    {actionItems.length > 0 && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium text-foreground mb-2">Action Items</p>
                        <ul className="space-y-1">
                          {actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2 bg-card">
          <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
            <Share2 className="h-4 w-4" /> Share Note
          </button>
          <button 
            onClick={handleArchive}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-md text-sm font-medium transition-colors"
          >
            <ArchiveIcon className="h-4 w-4" /> Archive
          </button>
        </div>
      </aside>
    </div>
  );
}
