from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from firebase_admin import firestore

from app.middleware.auth import get_current_user
from app.services.firestore_service import db
from app.services import gemini_service
from app.models.ai import AIAnalysisResult

router = APIRouter(prefix="/notes", tags=["AI"])

class SummaryRequest(BaseModel):
    pass

class TagsRequest(BaseModel):
    existing_tags: List[str] = []

@router.post("/{note_id}/generate-summary", response_model=AIAnalysisResult)
async def generate_summary(
    note_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        # Verify user owns the note & get content
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")
        
        data = doc.to_dict()
        if data.get('user_id') != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        content = data.get('content', '')
        title = data.get('title', 'Untitled Note')
        if not content:
            raise HTTPException(status_code=400, detail="Note content is empty")

        # Call Gemini
        ai_response = await gemini_service.generate_note_analysis(content, title)
        
        # Save token usage
        gemini_service.save_token_usage(
            user_id=user['uid'],
            note_id=note_id,
            request_type="summary",
            tokens_used=ai_response["tokens"]
        )
        
        # Save result back to note document
        result = ai_response["result"]
        doc_ref.update({
            "ai_summary": result.get("summary"),
            "ai_action_items": result.get("action_items", []),
            "ai_suggested_title": result.get("suggested_title"),
            "ai_key_topics": result.get("key_topics", []),
            "ai_last_generated": datetime.now(timezone.utc).isoformat()
        })
        
        # Track aiUsageCount on user doc
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        if user_doc.exists:
            user_ref.update({
                "aiUsageCount": firestore.Increment(1),
                "lastAiUse": datetime.now(timezone.utc).isoformat()
            })
        else:
            user_ref.set({
                "aiUsageCount": 1,
                "lastAiUse": datetime.now(timezone.utc).isoformat()
            }, merge=True)
            
        return AIAnalysisResult(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{note_id}/suggest-tags", response_model=List[str])
async def suggest_tags(
    note_id: str,
    request: TagsRequest,
    user: dict = Depends(get_current_user)
):
    try:
        # Verify user owns the note
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")
            
        data = doc.to_dict()
        if data.get('user_id') != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        content = data.get('content', '')
        if not content:
            raise HTTPException(status_code=400, detail="Note content is empty")
            
        # Call Gemini
        ai_response = await gemini_service.suggest_tags(content, request.existing_tags)
        
        # Save token usage
        gemini_service.save_token_usage(
            user_id=user['uid'],
            note_id=note_id,
            request_type="tags",
            tokens_used=ai_response["tokens"]
        )
        
        # Track aiUsageCount on user doc
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        if user_doc.exists:
            user_ref.update({
                "aiUsageCount": firestore.Increment(1),
                "lastAiUse": datetime.now(timezone.utc).isoformat()
            })
        else:
            user_ref.set({
                "aiUsageCount": 1,
                "lastAiUse": datetime.now(timezone.utc).isoformat()
            }, merge=True)
            
        return ai_response["tags"]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
