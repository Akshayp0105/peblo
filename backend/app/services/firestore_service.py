from firebase_admin import firestore
from datetime import datetime, timezone
import re
import os
from typing import List, Dict, Any

# Lazy-loaded Firestore proxy to avoid startup crashes if Firebase is not yet configured
class FirestoreProxy:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                self._client = firestore.client()
            except Exception as e:
                print("\n" + "="*80)
                print("WARNING: Firebase Credentials are not configured or are invalid!")
                print("To run fully functional, please place your 'firebase-adminsdk.json' in the")
                print("backend/ directory and fill in your .env / .env.local configurations.")
                print(f"Error details: {e}")
                print("="*80 + "\n")
                raise e
        return self._client

    def __getattr__(self, name):
        return getattr(self.client, name)

db = FirestoreProxy()

def strip_html_tags(text: str) -> str:
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

def get_excerpt(content: str, max_length: int = 50) -> str:
    text = strip_html_tags(content)
    if len(text) > max_length:
        return text[:max_length] + "..."
    return text

def get_notes(user_id: str, is_archived: bool = False) -> List[Dict[str, Any]]:
    notes_ref = db.collection('notes')
    query = notes_ref.where('user_id', '==', user_id).where('is_archived', '==', is_archived)
    
    docs = query.stream()
    notes = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        notes.append(data)
        
    notes.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
    return notes

def search_notes(user_id: str, q: str = None, tags: str = None, status: str = None, sort: str = 'recent', cursor: str = None, limit: int = 20) -> List[Dict[str, Any]]:
    notes_ref = db.collection('notes')
    query = notes_ref.where('user_id', '==', user_id)

    # Status mapping (active = not archived, archived = archived, all = no filter)
    if status == 'active':
        query = query.where('is_archived', '==', False)
    elif status == 'archived':
        query = query.where('is_archived', '==', True)

    # Tags filtering
    # Firestore supports ONE array_contains per query
    tag_list = [t.strip() for t in tags.split(',')] if tags else []
    if tag_list:
        # Use array_contains for the first tag
        query = query.where('tags', 'array_contains', tag_list[0])

    # Sorting
    if sort == 'recent':
        query = query.order_by('updated_at', direction=firestore.Query.DESCENDING)
    elif sort == 'oldest':
        query = query.order_by('updated_at', direction=firestore.Query.ASCENDING)
    elif sort == 'alphabetical':
        query = query.order_by('title', direction=firestore.Query.ASCENDING)
    
    # Cursor logic for pagination
    if cursor:
        try:
            # Assuming cursor is a document ID, fetch the document to start after
            cursor_doc = notes_ref.document(cursor).get()
            if cursor_doc.exists:
                query = query.start_after(cursor_doc)
        except Exception:
            pass

    # Execute the query
    docs = query.stream()
    
    notes = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        notes.append(data)

    # In-memory filtering for additional tags and search query
    # Since Firestore only supports one array_contains and no text search out-of-the-box
    if len(tag_list) > 1:
        # Filter notes that have ALL the requested tags
        notes = [n for n in notes if all(t in n.get('tags', []) for t in tag_list[1:])]
        
    if q:
        query_lower = q.lower()
        notes = [n for n in notes if 
                 query_lower in n.get('title', '').lower() or 
                 query_lower in n.get('content', '').lower() or
                 any(query_lower in str(t).lower() for t in n.get('tags', []))]
                 
    # Since we did in-memory filtering, we should limit after filtering
    return notes[:limit]


def create_note(user_id: str, data: dict) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    doc_ref = db.collection('notes').document()
    
    note_data = {
        "user_id": user_id,
        "title": data.get("title", "Untitled Note"),
        "content": data.get("content", ""),
        "excerpt": get_excerpt(data.get("content", "")),
        "tags": data.get("tags", []),
        "category": data.get("category"),
        "is_archived": False,
        "created_at": now,
        "updated_at": now,
    }
    
    doc_ref.set(note_data)
    note_data["id"] = doc_ref.id
    return note_data

def update_note(note_id: str, data: dict, user_id: str) -> Dict[str, Any]:
    doc_ref = db.collection('notes').document(note_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise ValueError("Note not found")
        
    doc_data = doc.to_dict()
    if doc_data.get('user_id') != user_id:
        raise PermissionError("Not authorized to update this note")
        
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "content" in update_data:
        update_data["excerpt"] = get_excerpt(update_data["content"])
        
    doc_ref.update(update_data)
    
    updated_doc = doc_ref.get().to_dict()
    updated_doc["id"] = note_id
    return updated_doc

def archive_note(note_id: str, user_id: str) -> Dict[str, Any]:
    return update_note(note_id, {"is_archived": True}, user_id)

def delete_note(note_id: str, user_id: str):
    doc_ref = db.collection('notes').document(note_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise ValueError("Note not found")
        
    if doc.to_dict().get('user_id') != user_id:
        raise PermissionError("Not authorized to delete this note")
        
    doc_ref.delete()
    return {"message": "Note deleted successfully"}
