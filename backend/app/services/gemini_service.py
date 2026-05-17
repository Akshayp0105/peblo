import os
import json
import asyncio
import re
from datetime import datetime, timezone
import google.generativeai as genai
from app.services.firestore_service import db

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyCcOmT6csle9Tg_DtSjU17_hA2rwnxEY3s"))

def strip_markdown(text: str) -> str:
    text = re.sub(r'```(?:json)?', '', text)
    return text.strip()

async def generate_note_analysis(content: str, title: str) -> dict:
    prompt = f"""
Analyze this note and respond ONLY with a JSON object. No markdown, no explanation.

Note Title: {title}
Note Content: {content}

JSON format:
{{
  "summary": "2-3 sentence summary of the main points",
  "action_items": ["specific task 1", "specific task 2"],
  "suggested_title": "better title or same if current is good",  
  "key_topics": ["topic1", "topic2", "topic3"]
}}

Rules:
- action_items must start with a verb (Review, Send, Create, etc.)
- summary must be in third person
- suggested_title max 60 characters
- key_topics max 5 items
"""
    system_instruction = "You are a productivity assistant that helps users organize their notes. Always respond in valid JSON only. Be concise and actionable."
    
    model = genai.GenerativeModel(
        model_name='gemini-2.5-pro',
        system_instruction=system_instruction
    )
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = await model.generate_content_async(prompt)
            clean_json = strip_markdown(response.text)
            result = json.loads(clean_json)
            
            tokens_used = 0
            if hasattr(response, 'usage_metadata') and hasattr(response.usage_metadata, 'total_token_count'):
                tokens_used = response.usage_metadata.total_token_count
                
            return {
                "result": result,
                "tokens": tokens_used
            }
        except Exception as e:
            if attempt == max_attempts - 1:
                raise e
            await asyncio.sleep(2 ** attempt)

async def suggest_tags(content: str, existing_tags: list[str]) -> dict:
    prompt = f"""
Note Content: {content}
Existing Tags: {json.dumps(existing_tags)}

Suggest 3-5 relevant tags based on the content. Do not include tags that are already in the Existing Tags list.
Return ONLY a JSON array of strings. No markdown, no explanation.
Example: ["tag1", "tag2", "tag3"]
"""
    system_instruction = "You are a productivity assistant that helps users organize their notes. Always respond in valid JSON only. Be concise and actionable."
    
    model = genai.GenerativeModel(
        model_name='gemini-2.5-pro',
        system_instruction=system_instruction
    )
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = await model.generate_content_async(prompt)
            clean_json = strip_markdown(response.text)
            tags = json.loads(clean_json)
            
            tokens_used = 0
            if hasattr(response, 'usage_metadata') and hasattr(response.usage_metadata, 'total_token_count'):
                tokens_used = response.usage_metadata.total_token_count
                
            return {
                "tags": tags,
                "tokens": tokens_used
            }
        except Exception as e:
            if attempt == max_attempts - 1:
                raise e
            await asyncio.sleep(2 ** attempt)

def save_token_usage(user_id: str, note_id: str, request_type: str, tokens_used: int):
    record = {
        "userId": user_id,
        "noteId": note_id,
        "type": request_type,
        "tokensUsed": tokens_used,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db.collection('ai_usage').add(record)
