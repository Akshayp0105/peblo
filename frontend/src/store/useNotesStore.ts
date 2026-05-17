import { create } from 'zustand';
import { Note } from '../lib/notesApi';

interface NotesState {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  removeNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, data) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n)
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  }))
}));
