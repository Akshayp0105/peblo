# Peblo Notes Architecture

## Overview
Peblo Notes is a production-grade Collaborative AI Notes Workspace built with a modern stack.

### Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: FastAPI (Python 3.12+), Pydantic v2
- **Auth & DB**: Firebase Auth + Firestore
- **AI Integration**: Google Gemini 2.5 Pro API
- **Package Managers**: pnpm (Frontend), uv (Backend Python)

## Directory Structure
```text
/peblo-notes
  /frontend          ← Next.js app
    /src/app         ← App Router pages
    /src/components  ← shadcn + custom components
    /src/lib         ← firebase config, api client, utils
    /src/hooks       ← custom React hooks
    /src/types       ← TypeScript interfaces
    .env.local.example
  /backend           ← FastAPI app
    /app
      /routers       ← auth, notes, share, insights
      /services      ← firebase_service, gemini_service
      /models        ← Pydantic models
      /middleware    ← auth middleware
    main.py
    .env.example
  /docs              ← Architecture notes
  README.md
```

## Firestore Collections Design

The database uses NoSQL document structures on Firebase Firestore.

### `users/{userId}`
- `name`: string
- `email`: string
- `createdAt`: timestamp (ISO string or Firestore Timestamp)
- `aiUsageCount`: number

### `notes/{noteId}`
- `userId`: string (Reference to users collection)
- `title`: string
- `content`: string (Markdown or Rich Text HTML)
- `tags`: array of strings
- `status`: string ('draft' | 'published' | 'archived')
- `isPublic`: boolean
- `shareId`: string (optional, linked to shares collection)
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `aiSummary`: string (optional)
- `actionItems`: array of objects `{ id, task, completed }` (optional)
- `suggestedTitle`: string (optional)

### `shares/{shareId}`
- `noteId`: string (Reference to notes collection)
- `createdAt`: timestamp
- `expiresAt`: timestamp (optional)
