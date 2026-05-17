# Peblo Notes Local Running Guide

This guide describes how the Peblo Notes project has been configured and is running on your `localhost`, along with steps to fully functionalize it using your Firebase and Gemini credentials.

---

## 🚀 Current Running Status (Localhost)

Both servers have been initialized and are currently running in the background:

- **Frontend (Next.js)**: [http://localhost:3000](http://localhost:3000)
- **Backend (FastAPI)**: [http://localhost:8000](http://localhost:8000)
- **Backend Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

> [!TIP]
> **Developer Experience Polish**: The FastAPI server has been updated with a lazy-loading **Firestore Proxy pattern**. This allows the server to boot up successfully on port 8000 without crashing even if you haven't configured your Firebase credentials yet! When a database endpoint is eventually reached, it will output a clear warning.

---

## 🛠️ Step-by-Step Setup to Make it Fully Functional

To make all operations (user signup, database save, search, and Gemini summaries) fully operational, follow these steps:

### Step 1: Firebase Project Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `peblo-notes` (or your preferred name).
3. **Authentication Setup**:
   - Navigate to **Authentication** > **Get Started**.
   - Enable **Email/Password** provider.
   - (Optional) Enable **Google** sign-in.
4. **Firestore Database Setup**:
   - Navigate to **Firestore Database** > **Create Database**.
   - Set locations and start in **Test Mode** (or Production Mode).
5. **Get Frontend Client Config**:
   - Go to **Project Settings** (gear icon) > **General**.
   - Under *Your apps*, click the **Web** icon `</>` to register a web app.
   - Copy the `firebaseConfig` keys from the snippet.

---

### Step 2: Configure Environment Variables

#### A. Frontend (`/frontend/.env.local`)
Open [frontend/.env.local](file:///c:/Users/LOQ/OneDrive/Desktop/peblo/peblo-notes/frontend/.env.local) and replace the placeholder credentials with your Firebase Client credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_GEMINI_API_KEY="your-optional-gemini-key"
```

#### B. Backend (`/backend/.env`)
Open [backend/.env](file:///c:/Users/LOQ/OneDrive/Desktop/peblo/peblo-notes/backend/.env) and set your Gemini API key and Firebase Admin SDK path:

```env
FIREBASE_CREDENTIALS_PATH="./firebase-adminsdk.json"
GEMINI_API_KEY="your-actual-gemini-api-key"
FRONTEND_URL="http://localhost:3000"
```

---

### Step 3: Firebase Admin Service Account Key

To connect the FastAPI backend securely to Firestore:
1. In the **Firebase Console**, go to **Project Settings** (gear icon) > **Service accounts**.
2. Click **Generate new private key** (JSON format).
3. Download the file, rename it to `firebase-adminsdk.json`, and place it in the `/backend` directory.

---

## 💻 Running Commands Manually (For Future Restarts)

If you ever need to stop and restart the servers yourself, you can use these commands:

### 1. Backend Server Restart
Open a terminal in the `/backend` directory:
```powershell
# Create/Activate Virtual Environment
uv venv
& .venv\Scripts\Activate.ps1

# Install Dependencies
uv pip install -r requirements.txt

# Start Server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Server Restart
Open a terminal in the `/frontend` directory:
```bash
# Install Dependencies (ignoring conflicts with React 19 RC)
npm install --legacy-peer-deps

# Start Next.js Development Server
npm run dev
```
