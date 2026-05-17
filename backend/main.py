from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Initialize FastAPI app
app = FastAPI(
    title="Peblo Notes API",
    description="Backend API for Peblo Notes Collaborative AI Workspace",
    version="1.0.0"
)

# Configure CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Routers for Scaffold ---
# In a real app, these would be in separate files under app/routers/
from fastapi import APIRouter

auth_router = APIRouter(prefix="/auth", tags=["Auth"])
notes_router = APIRouter(prefix="/notes", tags=["Notes"])
share_router = APIRouter(prefix="/share", tags=["Share"])
insights_router = APIRouter(prefix="/insights", tags=["Insights"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@auth_router.post("/verify")
async def verify_token():
    return {"message": "Token verified"}

@notes_router.get("/")
async def get_notes():
    return {"notes": []}

@share_router.get("/{share_id}")
async def get_shared_note(share_id: str):
    return {"share_id": share_id, "note": {}}

@insights_router.get("/")
async def get_insights():
    return {"insights": {}}

# Register routers
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(share_router)
app.include_router(insights_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
