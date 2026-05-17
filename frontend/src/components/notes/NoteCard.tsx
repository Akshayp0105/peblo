"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit2, Archive, Trash2, Share2 } from "lucide-react";
import { Note } from "@/lib/notesApi";
import { getTagBgColor, getTagColor } from "./TagInput";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  note: Note;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onArchive, onDelete }) => {
  const router = useRouter();
  const primaryTag = note.tags.length > 0 ? note.tags[0] : "";
  const borderColor = primaryTag ? getTagColor(primaryTag) : "hsl(var(--muted))";

  const handleCardClick = () => {
    router.push(`/notes/${note.id}`);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-card text-card-foreground rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col h-48"
    >
      {/* Left accent border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 opacity-70 group-hover:opacity-100" 
        style={{ backgroundColor: borderColor }} 
      />

      <div className="p-5 pl-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 flex-1 pr-2">
            {note.title || "Untitled Note"}
          </h3>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/notes/${note.id}`)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Share", note.id)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(note.id)}>
                  <Archive className="h-4 w-4 mr-2" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(note.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-muted-foreground text-sm flex-1 line-clamp-3">
          {note.excerpt || "No content"}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[80px]"
                style={{ backgroundColor: getTagBgColor(tag), color: getTagColor(tag) }}
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
            )}
          </div>
          
          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};
