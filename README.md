# Peblo Notes

A Collaborative AI Notes Workspace powered by Next.js, FastAPI, Firebase, and Gemini 2.5 Pro.

## Project Structure

This is a monorepo containing two main parts:
- `/frontend`: Next.js 15 application (App Router)
- `/backend`: FastAPI Python application

## Prerequisites

- Node.js 18+ and `pnpm`
- Python 3.12+ and `uv`
- Firebase account and project configured
- Google Gemini API Key

## Setup Instructions

### 1. Frontend Setup

```bash
cd frontend
pnpm install
cp .env.local.example .env.local
# Fill in your Firebase and Gemini credentials in .env.local
pnpm dev
```

The frontend will run at `http://localhost:3000`.

### 2. Backend Setup

```bash
cd backend
uv venv
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

uv pip install -r requirements.txt
cp .env.example .env
# Provide your Firebase admin SDK JSON and Gemini API key
# Place your firebase-adminsdk.json in the backend directory

uvicorn main:app --reload
```

The backend will run at `http://localhost:8000`.
API documentation is available at `http://localhost:8000/docs`.

## Architecture Details

See `/docs/architecture.md` for Firestore schemas and component responsibilities.
