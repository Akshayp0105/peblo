from pydantic import BaseModel
from typing import List

class AIAnalysisResult(BaseModel):
    summary: str
    action_items: List[str]
    suggested_title: str
    key_topics: List[str]

class AIUsageRecord(BaseModel):
    userId: str
    noteId: str
    type: str
    tokensUsed: int
    timestamp: str
