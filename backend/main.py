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

# --- Real Routers ---
from app.routers.auth import router as auth_router
from app.routers.notes import router as notes_router
from app.routers.ai import router as ai_router

from app.routers.share import router as share_router
from app.routers.insights import router as insights_router

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Register routers
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(ai_router)
app.include_router(share_router)
app.include_router(insights_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
