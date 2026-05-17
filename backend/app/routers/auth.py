from fastapi import APIRouter, Depends
from firebase_admin import firestore
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Initialize Firestore client
# Assuming firebase_admin is initialized in middleware/auth.py or main.py
db = firestore.client()

@router.post("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the current user's profile from Firestore based on the Firebase auth token.
    """
    uid = user.get("uid")
    if not uid:
        return {"error": "Invalid token payload"}
        
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    
    if doc.exists:
        return doc.to_dict()
        
    return {
        "uid": uid,
        "email": user.get("email"),
        "name": user.get("name")
    }

@router.post("/sync")
async def sync_user(user: dict = Depends(get_current_user)):
    """
    Creates or updates the user document in Firestore after signup/login.
    """
    uid = user.get("uid")
    if not uid:
        return {"error": "Invalid token payload"}
        
    email = user.get("email")
    name = user.get("name", "")
    picture = user.get("picture", "")
    
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    
    user_data = {
        "uid": uid,
        "email": email,
        "name": name,
    }
    
    if picture:
        user_data["picture"] = picture
        
    if not doc.exists:
        db.collection("users").document(uid).set(user_data)
    else:
        # Update existing user data with latest from auth provider
        db.collection("users").document(uid).set(user_data, merge=True)
        
    return {"status": "success", "user": user_data}
