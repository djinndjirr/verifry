from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import aiofiles
import httpx
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    restaurant_name: str
    status: UserStatus = UserStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: str
    restaurant_name: str

class UserUpdate(BaseModel):
    status: UserStatus
    approved_by: Optional[str] = None

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplianceUpload(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    filename: str
    file_path: str
    file_type: str  # 'image' or 'video'
    description: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplianceUploadCreate(BaseModel):
    description: Optional[str] = None

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    score: int
    total_questions: int
    passed: bool
    answers: List[dict]
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizAttemptCreate(BaseModel):
    answers: List[dict]

# Quiz questions data
QUIZ_QUESTIONS = [
    {
        "id": 1,
        "question": "What is the primary risk of meat cross-contamination in restaurant kitchens?",
        "options": [
            "Food poisoning and foodborne illness",
            "Loss of flavor in vegetarian dishes",
            "Increased cooking time",
            "Higher food costs"
        ],
        "correct_answer": 0
    },
    {
        "id": 2,
        "question": "Which surfaces should be cleaned and sanitized between preparing raw meat and other foods?",
        "options": [
            "Only cutting boards",
            "Only knives and utensils",
            "All surfaces, cutting boards, utensils, and equipment",
            "Only the stove and oven"
        ],
        "correct_answer": 2
    },
    {
        "id": 3,
        "question": "What is the correct order for washing hands after handling raw meat?",
        "options": [
            "Rinse with water, apply soap, scrub for 10 seconds, rinse",
            "Apply soap, scrub for 20 seconds, rinse with warm water",
            "Rinse with cold water, dry with towel",
            "Use hand sanitizer only"
        ],
        "correct_answer": 1
    },
    {
        "id": 4,
        "question": "How should raw meat be stored to prevent cross-contamination?",
        "options": [
            "On the top shelf of the refrigerator",
            "Next to ready-to-eat foods",
            "On the bottom shelf in sealed containers",
            "At room temperature for quick access"
        ],
        "correct_answer": 2
    },
    {
        "id": 5,
        "question": "What should you do if you accidentally use the same cutting board for raw meat and vegetables without cleaning?",
        "options": [
            "Continue cooking, the heat will kill any bacteria",
            "Discard the vegetables and clean the cutting board thoroughly",
            "Only rinse the vegetables with water",
            "Mix them together since they'll be cooked"
        ],
        "correct_answer": 1
    },
    {
        "id": 6,
        "question": "Which temperature is considered safe for storing raw meat in the refrigerator?",
        "options": [
            "45°F (7°C) or below",
            "40°F (4°C) or below",
            "50°F (10°C) or below",
            "Room temperature is fine for short periods"
        ],
        "correct_answer": 1
    },
    {
        "id": 7,
        "question": "What is the best practice when using separate cutting boards?",
        "options": [
            "Use any cutting board for any food",
            "Use the same cutting board but rinse between uses",
            "Use separate color-coded cutting boards for different food types",
            "Only use one cutting board per day"
        ],
        "correct_answer": 2
    },
    {
        "id": 8,
        "question": "How long should you wash your hands after handling raw meat?",
        "options": [
            "5 seconds",
            "10 seconds",
            "At least 20 seconds",
            "1 minute"
        ],
        "correct_answer": 2
    }
]

# Authentication helper functions
async def get_current_user(request: Request):
    authorization = request.headers.get("authorization")
    session_token = request.cookies.get("session_token")
    
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif session_token:
        token = session_token
    
    if not token:
        return None
    
    # Find session in database
    session = await db.sessions.find_one({"session_token": token})
    if not session or datetime.now(timezone.utc) > session["expires_at"]:
        return None
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]})
    return User(**user) if user else None


# Authentication routes
@api_router.get("/auth/login")
async def login_redirect():
    preview_url = "https://meatsafe-check.preview.emergentagent.com"
    auth_url = f"https://auth.emergentagent.com/?redirect={preview_url}/profile"
    return {"auth_url": auth_url}

@api_router.post("/auth/profile")
async def create_profile(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": auth_data["email"]})
            if not existing_user:
                # Create new user with pending status
                user = User(
                    name=auth_data["name"],
                    email=auth_data["email"],
                    restaurant_name="Pending Setup"  # User will update this later
                )
                await db.users.insert_one(user.dict())
            else:
                user = User(**existing_user)
            
            # Create session
            session_token = str(uuid.uuid4())
            session = Session(
                user_id=user.id,
                session_token=session_token,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)
            )
            await db.sessions.insert_one(session.dict())
            
            return {
                "user": user.dict(),
                "session_token": session_token
            }
            
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Authentication service unavailable")

@api_router.post("/auth/logout")
async def logout(current_user: User = None):
    # In a real implementation, you'd invalidate the session
    return {"message": "Logged out successfully"}

# User management routes
@api_router.get("/users/me")
async def get_current_user_info(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

@api_router.put("/users/me")
async def update_current_user(user_update: dict, request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Update user in database
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": user_update}
    )
    
    # Return updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return User(**updated_user)

# Admin routes
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.email != "admin@meatsafe.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(None)
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}")
async def update_user_status(user_id: str, user_update: UserUpdate, request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.email != "admin@meatsafe.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = user_update.dict()
    if user_update.status == UserStatus.APPROVED:
        update_data["approved_at"] = datetime.now(timezone.utc)
        update_data["approved_by"] = current_user.id
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

# File upload routes
@api_router.post("/compliance/upload")
async def upload_compliance_file(
    request: Request,
    file: UploadFile = File(...),
    description: str = Form("")
):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi', '.wmv'}
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Determine file type
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    file_type = 'image' if file_extension in image_extensions else 'video'
    
    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Save to database
    upload = ComplianceUpload(
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        file_type=file_type,
        description=description
    )
    
    await db.compliance_uploads.insert_one(upload.dict())
    
    return upload

@api_router.get("/compliance/uploads", response_model=List[ComplianceUpload])
async def get_compliance_uploads(request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    uploads = await db.compliance_uploads.find({"user_id": current_user.id}).to_list(None)
    return [ComplianceUpload(**upload) for upload in uploads]

@api_router.get("/compliance/file/{file_id}")
async def get_compliance_file(file_id: str, request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    upload = await db.compliance_uploads.find_one({"id": file_id})
    if not upload:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file or is admin
    if upload["user_id"] != current_user.id and current_user.email != "admin@meatsafe.com":
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = Path(upload["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(file_path)

# Quiz routes
@api_router.get("/quiz/questions")
async def get_quiz_questions(request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    # Return questions without correct answers
    questions = []
    for q in QUIZ_QUESTIONS:
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })
    return questions

@api_router.post("/quiz/submit")
async def submit_quiz(quiz_attempt: QuizAttemptCreate, request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    # Calculate score
    score = 0
    total_questions = len(QUIZ_QUESTIONS)
    
    for answer in quiz_attempt.answers:
        question_id = answer.get("question_id")
        selected_answer = answer.get("selected_answer")
        
        # Find the correct question
        question = next((q for q in QUIZ_QUESTIONS if q["id"] == question_id), None)
        if question and question["correct_answer"] == selected_answer:
            score += 1
    
    # Determine if passed (70% or higher)
    passed = (score / total_questions) >= 0.7
    
    # Save attempt
    attempt = QuizAttempt(
        user_id=current_user.id,
        score=score,
        total_questions=total_questions,
        passed=passed,
        answers=quiz_attempt.answers
    )
    
    await db.quiz_attempts.insert_one(attempt.dict())
    
    return attempt

@api_router.get("/quiz/attempts", response_model=List[QuizAttempt])
async def get_quiz_attempts(request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    attempts = await db.quiz_attempts.find({"user_id": current_user.id}).to_list(None)
    return [QuizAttempt(**attempt) for attempt in attempts]

# Admin analytics routes
@api_router.get("/admin/analytics")
async def get_analytics(request: Request):
    current_user = await get_current_user(request)
    if not current_user or current_user.email != "admin@meatsafe.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get user statistics
    total_users = await db.users.count_documents({})
    pending_users = await db.users.count_documents({"status": "pending"})
    approved_users = await db.users.count_documents({"status": "approved"})
    
    # Get upload statistics
    total_uploads = await db.compliance_uploads.count_documents({})
    image_uploads = await db.compliance_uploads.count_documents({"file_type": "image"})
    video_uploads = await db.compliance_uploads.count_documents({"file_type": "video"})
    
    # Get quiz statistics
    total_attempts = await db.quiz_attempts.count_documents({})
    passed_attempts = await db.quiz_attempts.count_documents({"passed": True})
    
    return {
        "users": {
            "total": total_users,
            "pending": pending_users,
            "approved": approved_users
        },
        "uploads": {
            "total": total_uploads,
            "images": image_uploads,
            "videos": video_uploads
        },
        "quiz": {
            "total_attempts": total_attempts,
            "passed_attempts": passed_attempts,
            "pass_rate": (passed_attempts / total_attempts * 100) if total_attempts > 0 else 0
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()