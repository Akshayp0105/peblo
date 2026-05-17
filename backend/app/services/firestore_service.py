from firebase_admin import firestore
from datetime import datetime, timezone
import re
from typing import List, Dict, Any

db = firestore.client()

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
