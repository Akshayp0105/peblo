from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.models.note import NoteCreate, NoteUpdate, NoteResponse
from app.services import firestore_service
from app.middleware.auth import get_current_user
import google.generativeai as genai
import os

router = APIRouter(prefix="/notes", tags=["Notes"])

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

class SummaryRequest(BaseModel):
    content: str

class SummaryResponse(BaseModel):
    summary: str
    action_items: List[str]

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    is_archived: bool = False,
    user: dict = Depends(get_current_user)
):
    try:
        notes = firestore_service.get_notes(user['uid'], is_archived)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=NoteResponse)
async def create_note(
    note: NoteCreate,
    user: dict = Depends(get_current_user)
):
    try:
        new_note = firestore_service.create_note(user['uid'], note.model_dump())
        return new_note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        # Re-using the logic from update to get note. But we can just use firestore directly or add a get_note in service
        doc_ref = firestore_service.db.collection('notes').document(note_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")
        data = doc.to_dict()
        if data.get('user_id') != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized")
        data['id'] = doc.id
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note: NoteUpdate,
    user: dict = Depends(get_current_user)
):
    try:
        updated = firestore_service.update_note(note_id, note.model_dump(exclude_unset=True), user['uid'])
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        return firestore_service.delete_note(note_id, user['uid'])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{note_id}/archive", response_model=NoteResponse)
async def archive_note(
    note_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        return firestore_service.archive_note(note_id, user['uid'])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{note_id}/generate-summary", response_model=SummaryResponse)
async def generate_summary(
    note_id: str,
    request: SummaryRequest,
    user: dict = Depends(get_current_user)
):
    try:
        # Note authorization is assumed or verified here
        model = genai.GenerativeModel('gemini-2.5-pro')
        prompt = f"""
        Analyze the following note content and provide a summary and action items.
        Format your response exactly as follows:
        Summary: <a 1-2 sentence summary>
        Action Items:
        - <item 1>
        - <item 2>
        
        Note content:
        {request.content}
        """
        response = model.generate_content(prompt)
        text = response.text
        
        summary = ""
        action_items = []
        
        lines = text.strip().split('\n')
        parsing_actions = False
        for line in lines:
            if line.lower().startswith('summary:'):
                summary = line[8:].strip()
            elif line.lower().startswith('action items:'):
                parsing_actions = True
            elif parsing_actions and line.strip().startswith('-'):
                action_items.append(line.strip()[1:].strip())
            elif not parsing_actions and not summary:
                # If first line is summary without "Summary:" prefix
                if line.strip():
                    summary = line.strip()
                    
        return SummaryResponse(summary=summary, action_items=action_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
