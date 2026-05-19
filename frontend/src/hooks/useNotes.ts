import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNotesStore } from '../store/useNotesStore';
import { notesApi, Note } from '../lib/notesApi';
import { useAuthState } from 'react-firebase-hooks/auth';

export function useNotes(isArchived: boolean = false) {
  const [user, loading] = useAuthState(auth);
  const { notes, setNotes, addNote, updateNote, removeNote } = useNotesStore();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setNotes([]);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('user_id', '==', user.uid),
      where('is_archived', '==', isArchived)
    );

    // orderBy might require an index, we will just sort client-side in the snapshot listener if it fails or doesn't have an index, but firestore handles single field orderBy nicely unless filtered on multiple fields
    // Actually, where(user_id) + where(is_archived) + orderBy(updated_at) needs a composite index. 
    // To avoid index issues in dev, we will sort locally.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes: Note[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      // Sort client side
      fetchedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setNotes(fetchedNotes);
    }, (err) => {
      console.error("Firestore listen error", err);
      setError(err);
    });

    return () => unsubscribe();
  }, [user, loading, isArchived, setNotes]);

  const create = async (data: Partial<Note>) => {
    // Optimistic UI handled partly by backend API and then firestore update, 
    // but to do it locally immediately:
    const tempId = `temp_${Date.now()}`;
    const tempNote: Note = {
      id: tempId,
      user_id: user?.uid || '',
      title: data.title || 'Untitled Note',
      content: data.content || '',
      excerpt: '',
      tags: data.tags || [],
      category: data.category || null,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addNote(tempNote);
    try {
      const created = await notesApi.createNote(data);
      // Wait for onSnapshot to replace temp note. Actually we might need to remove tempNote
      removeNote(tempId);
      return created;
    } catch (err) {
      removeNote(tempId);
      throw err;
    }
  };

  const update = async (id: string, data: Partial<Note>) => {
    updateNote(id, data); // Optimistic UI
    return notesApi.updateNote(id, data);
  };

  const archive = async (id: string) => {
    removeNote(id); // Optimistic UI (will be moved to archived list)
    return notesApi.archiveNote(id);
  };

  const del = async (id: string) => {
    removeNote(id); // Optimistic UI
    return notesApi.deleteNote(id);
  };

  return { notes, createNote: create, updateNote: update, archiveNote: archive, deleteNote: del, error };
}

export function useNote(id: string) {
  const [user, loading] = useAuthState(auth);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { updateNote: optimisticUpdate } = useNotesStore();

  useEffect(() => {
    if (loading || !user || !id) return;

    const docRef = doc(db, 'notes', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.user_id === user.uid || data.is_public === true) {
          setNote({ id: docSnap.id, ...data } as Note);
        } else {
          setNote(null);
        }
      } else {
        setNote(null);
      }
    }, (err) => {
      setError(err);
    });

    return () => unsubscribe();
  }, [id, user, loading]);

  const update = async (data: Partial<Note>) => {
    if (note) setNote({ ...note, ...data, updated_at: new Date().toISOString() });
    optimisticUpdate(id, data);
    return notesApi.updateNote(id, data);
  };

  return { note, updateNote: update, error };
}
