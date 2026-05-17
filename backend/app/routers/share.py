import os
import string
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.firestore_service import db
from app.middleware.auth import get_current_user

router = APIRouter(tags=["Share"])

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")


def generate_nanoid(size: int = 12) -> str:
    """URL-safe nanoid using alphanumeric characters."""
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for _ in range(size))


# ─── Response models ────────────────────────────────────────────────────────

class ShareResponse(BaseModel):
    shareUrl: str
    shareId: str


class SharedNoteResponse(BaseModel):
    title: str
    content: str
    tags: list
    updatedAt: str
    viewCount: int


# ─── POST /notes/{note_id}/share ─────────────────────────────────────────────

@router.post("/notes/{note_id}/share", response_model=ShareResponse)
async def share_note(
    note_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Generate a public share link for a note.
    If the note is already shared, returns the existing share link.
    """
    try:
        note_ref = db.collection("notes").document(note_id)
        note_doc = note_ref.get()

        if not note_doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")

        note_data = note_doc.to_dict()
        if note_data.get("user_id") != user["uid"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Re-use existing share if already public
        if note_data.get("is_public") and note_data.get("share_id"):
            share_id = note_data["share_id"]
        else:
            share_id = generate_nanoid(12)
            now = datetime.now(timezone.utc).isoformat()

            # Create shares/{shareId} document
            db.collection("shares").document(share_id).set(
                {
                    "noteId": note_id,
                    "createdAt": now,
                    "viewCount": 0,
                }
            )

            # Update note fields
            note_ref.update({"is_public": True, "share_id": share_id})

        share_url = f"{APP_BASE_URL}/shared/{share_id}"
        return {"shareUrl": share_url, "shareId": share_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── DELETE /notes/{note_id}/share ───────────────────────────────────────────

@router.delete("/notes/{note_id}/share")
async def revoke_share(
    note_id: str,
    user: dict = Depends(get_current_user),
):
    """Revoke public access by removing the share document and marking note private."""
    try:
        note_ref = db.collection("notes").document(note_id)
        note_doc = note_ref.get()

        if not note_doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")

        note_data = note_doc.to_dict()
        if note_data.get("user_id") != user["uid"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        share_id = note_data.get("share_id")
        if share_id:
            db.collection("shares").document(share_id).delete()

        note_ref.update({"is_public": False, "share_id": None})
        return {"message": "Share revoked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /shared/{share_id}  (PUBLIC — no auth) ──────────────────────────────

@router.get("/shared/{share_id}", response_model=SharedNoteResponse)
async def get_shared_note(share_id: str):
    """
    Public endpoint.  No auth required.
    Fetches the share document, then the referenced note.
    Returns 404 if shareId is unknown or the note is no longer public.
    Increments viewCount atomically.
    """
    try:
        from firebase_admin import firestore as fs_admin  # lazy import

        share_ref = db.collection("shares").document(share_id)
        share_doc = share_ref.get()

        if not share_doc.exists:
            raise HTTPException(status_code=404, detail="Share not found")

        share_data = share_doc.to_dict()
        note_id = share_data.get("noteId")

        if not note_id:
            raise HTTPException(status_code=404, detail="Share reference is broken")

        note_ref = db.collection("notes").document(note_id)
        note_doc = note_ref.get()

        if not note_doc.exists:
            raise HTTPException(status_code=404, detail="Note not found")

        note_data = note_doc.to_dict()

        if not note_data.get("is_public"):
            raise HTTPException(
                status_code=404, detail="Note is no longer public"
            )

        # Atomic increment — Firestore server-side
        share_ref.update({"viewCount": fs_admin.Increment(1)})

        # Read fresh viewCount after increment
        updated_share = share_ref.get().to_dict()

        return {
            "title": note_data.get("title", "Untitled Note"),
            "content": note_data.get("content", ""),
            "tags": note_data.get("tags", []),
            "updatedAt": note_data.get("updated_at", ""),
            "viewCount": updated_share.get("viewCount", 1),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
