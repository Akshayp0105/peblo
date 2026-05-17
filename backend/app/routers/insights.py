from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import time
import re

from app.middleware.auth import get_current_user
from app.services.firestore_service import db

router = APIRouter(prefix="/insights", tags=["Insights"])

# ─── Simple In-Process Cache ────────────────────────────────────────────────
# { uid: {"data": {...}, "expires_at": float} }
_cache: Dict[str, Dict] = {}
CACHE_TTL = 300  # 5 minutes


def _cache_get(uid: str) -> Optional[Dict]:
    entry = _cache.get(uid)
    if entry and entry["expires_at"] > time.monotonic():
        return entry["data"]
    return None


def _cache_set(uid: str, data: Dict) -> None:
    _cache[uid] = {"data": data, "expires_at": time.monotonic() + CACHE_TTL}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _strip_html(text: str) -> str:
    return re.sub(re.compile(r"<.*?>"), "", text or "")


def _word_count(content: str) -> int:
    text = _strip_html(content)
    return len(text.split()) if text.strip() else 0


def _parse_dt(value) -> Optional[datetime]:
    """Safely parse ISO string or Firestore Timestamp to UTC-aware datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if hasattr(value, "to_datetime"):  # Firestore DatetimeWithNanoseconds
        dt = value.to_datetime()
        return dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


# ─── Main Endpoint ────────────────────────────────────────────────────────────

@router.get("/")
async def get_insights(user: dict = Depends(get_current_user)):
    uid = user["uid"]

    # Return cached result if fresh
    cached = _cache_get(uid)
    if cached:
        return cached

    try:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        week_ago_iso = week_ago.isoformat()

        # ── Fetch ALL user notes in a single query ──────────────────────────
        notes_docs = list(
            db.collection("notes").where("user_id", "==", uid).stream()
        )
        all_notes: List[Dict[str, Any]] = []
        for doc in notes_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            all_notes.append(data)

        # ── Aggregate: totals ───────────────────────────────────────────────
        total_notes = sum(1 for n in all_notes if not n.get("is_archived"))
        total_archived = sum(1 for n in all_notes if n.get("is_archived"))

        # ── Notes created this week ─────────────────────────────────────────
        notes_this_week = sum(
            1 for n in all_notes
            if not n.get("is_archived")
            and (_parse_dt(n.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc)) >= week_ago
        )

        # ── Most used tags (top 8) ──────────────────────────────────────────
        tag_counts: Dict[str, int] = {}
        for n in all_notes:
            for tag in n.get("tags") or []:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        most_used_tags = [
            {"tag": t, "count": c}
            for t, c in sorted(tag_counts.items(), key=lambda x: -x[1])[:8]
        ]

        # ── Longest note ────────────────────────────────────────────────────
        longest_note = None
        max_wc = 0
        for n in all_notes:
            if n.get("is_archived"):
                continue
            wc = _word_count(n.get("content", ""))
            if wc > max_wc:
                max_wc = wc
                longest_note = {
                    "noteId": n["id"],
                    "title": n.get("title", "Untitled Note"),
                    "wordCount": wc,
                }

        # ── Recently edited (last 5 active, sorted by updated_at) ──────────
        active = [n for n in all_notes if not n.get("is_archived")]
        active.sort(
            key=lambda x: _parse_dt(x.get("updated_at")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        recently_edited = [
            {
                "noteId": n["id"],
                "title": n.get("title", "Untitled Note"),
                "updatedAt": n.get("updated_at"),
            }
            for n in active[:5]
        ]

        # ── Weekly activity (last 7 days) ───────────────────────────────────
        # Build a map: date-string -> {created, edited}
        activity_map: Dict[str, Dict[str, int]] = {}
        for i in range(7):
            day = (now - timedelta(days=6 - i)).date()
            activity_map[str(day)] = {"notesCreated": 0, "notesEdited": 0}

        for n in all_notes:
            created_dt = _parse_dt(n.get("created_at"))
            updated_dt = _parse_dt(n.get("updated_at"))

            if created_dt and created_dt >= week_ago:
                day_str = str(created_dt.date())
                if day_str in activity_map:
                    activity_map[day_str]["notesCreated"] += 1

            if updated_dt and updated_dt >= week_ago:
                # Only count as "edited" if it was NOT just created the same second
                if created_dt is None or abs((updated_dt - created_dt).total_seconds()) > 5:
                    day_str = str(updated_dt.date())
                    if day_str in activity_map:
                        activity_map[day_str]["notesEdited"] += 1

        weekly_activity = [
            {"date": date, **counts}
            for date, counts in sorted(activity_map.items())
        ]

        # ── Writing streak ──────────────────────────────────────────────────
        # Count consecutive days (going backwards from today) on which user
        # either created or edited at least one note.
        active_days: set = set()
        for n in all_notes:
            for field in ("created_at", "updated_at"):
                dt = _parse_dt(n.get(field))
                if dt:
                    active_days.add(dt.date())

        streak = 0
        check_day = now.date()
        while check_day in active_days:
            streak += 1
            check_day -= timedelta(days=1)

        # ── AI usage ───────────────────────────────────────────────────────
        # Read from `ai_usage` sub-collection or user doc depending on existing schema
        # The ai.py router increments `aiUsageCount` on the user doc.
        # We also query token_usage collection for recent records.
        ai_usage_total = 0
        ai_usage_this_week = 0
        ai_usage_history: List[Dict] = []

        try:
            user_doc = db.collection("users").document(uid).get()
            if user_doc.exists:
                user_data = user_doc.to_dict() or {}
                ai_usage_total = user_data.get("aiUsageCount", 0)
        except Exception:
            pass

        try:
            token_docs = list(
                db.collection("token_usage")
                .where("user_id", "==", uid)
                .order_by("timestamp", direction="DESCENDING")
                .limit(50)
                .stream()
            )
            for tdoc in token_docs:
                td = tdoc.to_dict()
                ts = _parse_dt(td.get("timestamp"))
                if ts and ts >= week_ago:
                    ai_usage_this_week += 1
                    if len(ai_usage_history) < 10:
                        # Try to find note title
                        note_id = td.get("note_id", "")
                        note_title = "Unknown Note"
                        if note_id:
                            note_lookup = next(
                                (n for n in all_notes if n["id"] == note_id), None
                            )
                            if note_lookup:
                                note_title = note_lookup.get("title", "Untitled Note")
                        ai_usage_history.append({
                            "noteId": note_id,
                            "noteTitle": note_title,
                            "requestType": td.get("request_type", "summary"),
                            "timestamp": td.get("timestamp"),
                        })
        except Exception:
            # token_usage collection might not have index – graceful degradation
            pass

        # Build final response
        result = {
            "totalNotes": total_notes,
            "totalArchived": total_archived,
            "notesThisWeek": notes_this_week,
            "mostUsedTags": most_used_tags,
            "aiUsageThisWeek": ai_usage_this_week,
            "aiUsageTotal": ai_usage_total,
            "weeklyActivity": weekly_activity,
            "recentlyEdited": recently_edited,
            "longestNote": longest_note,
            "writingStreak": streak,
            "aiUsageHistory": ai_usage_history,
        }

        _cache_set(uid, result)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
