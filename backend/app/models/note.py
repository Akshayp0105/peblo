from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class NoteBase(BaseModel):
    title: str = Field(default="Untitled Note")
    content: str = Field(default="")
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    is_archived: bool = False

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    is_archived: Optional[bool] = None

class NoteResponse(NoteBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str
    excerpt: str = ""
