import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin if not already initialized
if not firebase_admin._apps:
    try:
        cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "./firebase-adminsdk.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized successfully with credentials from: {cred_path}")
        else:
            firebase_admin.initialize_app()
            print("Firebase initialized with Application Default Credentials.")
    except Exception as e:
        print(f"Warning: Firebase Admin failed to initialize: {e}")

security = HTTPBearer()

def verify_firebase_token(token: str) -> dict:
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Dependency to get the current authenticated user.
    Reads the Authorization Bearer header, verifies it with Firebase Admin, and returns the decoded token.
    """
    token = credentials.credentials
    decoded_token = verify_firebase_token(token)
    return decoded_token
