from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============= MODELS =============

class UserRole:
    SUPER_ADMIN = "super_admin"
    CORP_ADMIN = "corp_admin"
    BRANCH_MANAGER = "branch_manager"
    EMPLOYEE = "employee"

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = UserRole.SUPER_ADMIN

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Corporation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: Optional[str] = None
    logo: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    corporation_id: str
    parent_branch_id: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    branch_id: str
    manager_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Division(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    department_id: str
    manager_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Personal & Contact Information
    full_name: str
    employee_id: Optional[str] = None
    profile_picture: Optional[str] = None
    home_address: Optional[str] = None
    personal_phone: Optional[str] = None
    work_phone: Optional[str] = None
    personal_email: Optional[str] = None
    work_email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    ssn: Optional[str] = None
    
    # Employment & Job Details
    job_title: Optional[str] = None
    department_id: Optional[str] = None
    division_id: Optional[str] = None
    branch_id: str
    corporation_id: str
    work_location: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    hire_date: Optional[str] = None
    employment_status: str = "full-time"
    probation_end_date: Optional[str] = None
    employment_history: Optional[str] = None
    role_id: Optional[str] = None
    schedule_id: Optional[str] = None
    
    # Payroll & Benefits
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_routing_number: Optional[str] = None
    tax_code: Optional[str] = None
    salary: Optional[float] = None
    currency: str = "USD"
    benefits_enrolled: Optional[str] = None
    
    # Time, Attendance & Leave
    holiday_allowance: Optional[float] = None
    sick_leave_allowance: Optional[float] = None
    working_hours: Optional[str] = None
    shift_pattern: Optional[str] = None
    
    # Talent & Compliance
    certifications: Optional[str] = None
    professional_memberships: Optional[str] = None
    skills: Optional[str] = None
    performance_notes: Optional[str] = None
    visa_status: Optional[str] = None
    passport_number: Optional[str] = None
    right_to_work_verified: bool = False
    dbs_check_status: Optional[str] = None
    
    # Digital Files & Documents
    documents: Optional[str] = None
    company_assets: Optional[str] = None
    
    # Portal Access & Security
    portal_access_enabled: bool = True
    password_reset_required: bool = False
    
    # Status
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Leave(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None
    status: str = "pending"
    half_day: bool = False
    half_day_type: Optional[str] = None  # "morning" or "afternoon"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LeaveBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    year: int
    # Annual Leave
    annual_leave: float = 20.0
    annual_used: float = 0.0
    # Sick Leave
    sick_leave: float = 10.0
    sick_used: float = 0.0
    # Personal Leave
    personal_leave: float = 5.0
    personal_used: float = 0.0
    # Unpaid Leave (no limit, just track used)
    unpaid_used: float = 0.0
    # Maternity Leave
    maternity_leave: float = 90.0
    maternity_used: float = 0.0
    # Paternity Leave
    paternity_leave: float = 14.0
    paternity_used: float = 0.0
    # Bereavement Leave
    bereavement_leave: float = 5.0
    bereavement_used: float = 0.0
    # Other Leave
    other_used: float = 0.0
    # Carry over from previous year
    carry_over: float = 0.0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= WORKFLOW MODELS =============

class WorkflowStep(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order: int
    name: str
    approver_type: str  # "role", "specific_user", "manager", "department_head"
    approver_id: Optional[str] = None  # role_id or user_id if specific
    can_skip: bool = False
    auto_approve_after_days: Optional[int] = None

class Workflow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    module: str  # "leave", "expense", "training", "document", "onboarding", "offboarding", "performance"
    is_active: bool = True
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    conditions: Optional[Dict[str, Any]] = None  # e.g., {"leave_days_gt": 3} for multi-level approval
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkflowInstance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    module: str
    reference_id: str  # ID of the leave/expense/etc request
    requester_id: str
    current_step: int = 0
    status: str = "pending"  # "pending", "in_progress", "approved", "rejected", "cancelled"
    step_history: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseClaim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    category: str  # "travel", "meals", "office", "equipment", "training", "other"
    receipt_url: Optional[str] = None
    expense_date: str
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    training_type: str  # "course", "certification", "workshop", "conference", "online"
    provider: Optional[str] = None
    cost: Optional[float] = None
    currency: str = "USD"
    start_date: str
    end_date: str
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DocumentApproval(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    document_type: str  # "policy", "contract", "report", "proposal", "other"
    document_url: Optional[str] = None
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OnboardingTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    task_name: str
    description: Optional[str] = None
    category: str  # "documentation", "equipment", "training", "access", "introduction"
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "pending"  # "pending", "in_progress", "completed"
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    schedule_id: Optional[str] = None
    status: str = "present"  # present, absent, late, half_day
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TimeCorrectionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    attendance_id: str
    date: str
    # Original values
    original_clock_in: Optional[str] = None
    original_clock_out: Optional[str] = None
    # Requested values
    requested_clock_in: Optional[str] = None
    requested_clock_out: Optional[str] = None
    reason: str
    status: str = "pending"  # pending, approved, rejected
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Schedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    start_time: str  # e.g., "09:00"
    end_time: str    # e.g., "17:00"
    days: List[str] = Field(default_factory=lambda: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    break_start: Optional[str] = None  # e.g., "12:00"
    break_end: Optional[str] = None    # e.g., "13:00"
    is_default: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    department_id: Optional[str] = None
    branch_id: Optional[str] = None
    location: Optional[str] = None
    job_type: str = "full_time"  # full_time, part_time, contract, internship, remote
    experience_level: str = "mid"  # entry, mid, senior, lead, executive
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    show_salary: bool = True
    hiring_manager_id: Optional[str] = None
    positions_count: int = 1
    is_internal: bool = False  # Internal job posting for employees
    expiry_date: Optional[str] = None
    status: str = "draft"  # draft, open, on_hold, closed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    candidate_name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: Optional[int] = None
    expected_salary: Optional[float] = None
    notice_period: Optional[str] = None
    source: str = "direct"  # direct, referral, linkedin, indeed, other
    referral_employee_id: Optional[str] = None
    status: str = "new"  # new, screening, interview, offer, hired, rejected, withdrawn
    rating: Optional[int] = None  # 1-5 star rating
    notes: Optional[str] = None
    # Interview tracking
    interview_date: Optional[str] = None
    interview_type: Optional[str] = None  # phone, video, onsite, panel
    interview_feedback: Optional[str] = None
    interviewed_by: Optional[str] = None
    # Offer details
    offered_salary: Optional[float] = None
    offer_date: Optional[str] = None
    offer_accepted_date: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    application_id: str
    job_id: str
    interview_type: str = "video"  # phone, video, onsite, panel, technical
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    interviewers: List[str] = Field(default_factory=list)  # List of employee IDs
    status: str = "scheduled"  # scheduled, completed, cancelled, no_show
    feedback: Optional[str] = None
    rating: Optional[int] = None
    recommendation: Optional[str] = None  # hire, no_hire, next_round, hold
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OnboardingTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: Optional[str] = None
    category: str = "documentation"  # documentation, it_setup, training, compliance, introduction, administrative, other
    due_day: int = 1
    is_required: bool = True
    assigned_to_type: str = "employee"  # employee, manager, hr
    assigned_to_id: Optional[str] = None  # Specific person if assigned_to_type is specific
    order: int = 1
    completed: bool = False
    completed_at: Optional[str] = None
    completed_by: Optional[str] = None
    completion_notes: Optional[str] = None
    resource_url: Optional[str] = None  # Link to documentation/resource
    resource_type: Optional[str] = None  # document, video, link, form

class OnboardingTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    position_type: Optional[str] = None  # engineering, sales, hr, etc.
    duration_days: int = 30
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    welcome_message: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Onboarding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    department_id: Optional[str] = None
    position: Optional[str] = None
    start_date: str
    target_end_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    duration_days: int = 30
    status: str = "in_progress"  # not_started, in_progress, completed, on_hold, cancelled
    manager_id: Optional[str] = None
    hr_contact_id: Optional[str] = None
    buddy_id: Optional[str] = None  # Onboarding buddy
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    welcome_message: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    feedback: Optional[str] = None  # Employee feedback on onboarding
    feedback_rating: Optional[int] = None  # 1-5 rating
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Offboarding Models
class OffboardingTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: Optional[str] = None
    category: str = "administrative"  # asset_return, access_revocation, knowledge_transfer, documentation, exit_interview, clearance, administrative, other
    due_day: int = 1
    is_required: bool = True
    assigned_to_type: str = "hr"  # employee, manager, hr, it
    assigned_to_id: Optional[str] = None
    order: int = 1
    completed: bool = False
    completed_at: Optional[str] = None
    completed_by: Optional[str] = None
    completion_notes: Optional[str] = None
    resource_url: Optional[str] = None

class OffboardingTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    reason_type: Optional[str] = None  # resignation, termination, retirement, contract_end, layoff
    duration_days: int = 14
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    exit_message: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Offboarding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    department_id: Optional[str] = None
    position: Optional[str] = None
    last_working_date: str
    separation_date: Optional[str] = None
    duration_days: int = 14
    reason: str = "resignation"  # resignation, termination, retirement, contract_end, layoff
    reason_details: Optional[str] = None
    status: str = "in_progress"  # not_started, in_progress, completed, on_hold, cancelled
    manager_id: Optional[str] = None
    hr_contact_id: Optional[str] = None
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    exit_message: Optional[str] = None
    # Exit Interview
    exit_interview_date: Optional[str] = None
    exit_interview_conducted: bool = False
    exit_interview_notes: Optional[str] = None
    # Clearance
    clearance_hr: bool = False
    clearance_it: bool = False
    clearance_finance: bool = False
    clearance_manager: bool = False
    clearance_admin: bool = False
    # Final Settlement
    final_settlement_status: str = "pending"  # pending, processing, completed
    final_settlement_notes: Optional[str] = None
    # Feedback
    feedback: Optional[str] = None
    feedback_rating: Optional[int] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PerformanceReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    reviewer_id: str
    period: str
    review_type: str = "annual"  # annual, quarterly, probation, project, 360
    status: str = "draft"  # draft, pending_self_assessment, pending_review, completed
    
    # Overall Rating
    overall_rating: Optional[float] = None
    
    # Category Ratings (1-5)
    communication_rating: Optional[float] = None
    teamwork_rating: Optional[float] = None
    technical_skills_rating: Optional[float] = None
    problem_solving_rating: Optional[float] = None
    leadership_rating: Optional[float] = None
    punctuality_rating: Optional[float] = None
    
    # Goals and Objectives
    goals: Optional[List[Dict[str, Any]]] = Field(default_factory=list)  # [{title, description, status, progress}]
    
    # Self Assessment (filled by employee)
    self_assessment: Optional[str] = None
    self_rating: Optional[float] = None
    achievements: Optional[str] = None
    challenges: Optional[str] = None
    
    # Manager Assessment
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    feedback: Optional[str] = None
    recommendations: Optional[str] = None
    
    # Dates
    review_date: Optional[str] = None
    next_review_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global_settings"
    language_1: str = "en"
    language_2: Optional[str] = None
    currency: str = "USD"
    exchange_rates: Dict[str, float] = Field(default_factory=lambda: {"USD": 1.0})
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Role(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    is_system_role: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Permission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    description: str

# ============= AUTHENTICATION =============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(data.password)
    
    await db.users.insert_one(user_doc)
    
    token = jwt.encode(
        {"user_id": user.id, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    user_dict = user.model_dump()
    return AuthResponse(token=token, user=user_dict)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash' and k != '_id'})
    
    token = jwt.encode(
        {"user_id": user.id, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AuthResponse(token=token, user=user.model_dump())

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= SETTINGS ROUTES =============

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can update settings")
    
    data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one(
        {"id": "global_settings"},
        {"$set": data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    return Settings(**settings)

# ============= CORPORATION ROUTES =============

@api_router.post("/corporations", response_model=Corporation)
async def create_corporation(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    corp = Corporation(**data, created_by=current_user.id)
    await db.corporations.insert_one(corp.model_dump())
    return corp

@api_router.get("/corporations", response_model=List[Corporation])
async def get_corporations(current_user: User = Depends(get_current_user)):
    corps = await db.corporations.find({}, {"_id": 0}).to_list(1000)
    return [Corporation(**c) for c in corps]

@api_router.get("/corporations/{corp_id}", response_model=Corporation)
async def get_corporation(corp_id: str, current_user: User = Depends(get_current_user)):
    corp = await db.corporations.find_one({"id": corp_id}, {"_id": 0})
    if not corp:
        raise HTTPException(status_code=404, detail="Corporation not found")
    return Corporation(**corp)

@api_router.put("/corporations/{corp_id}", response_model=Corporation)
async def update_corporation(corp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.corporations.update_one({"id": corp_id}, {"$set": data})
    corp = await db.corporations.find_one({"id": corp_id}, {"_id": 0})
    if not corp:
        raise HTTPException(status_code=404, detail="Corporation not found")
    return Corporation(**corp)

@api_router.delete("/corporations/{corp_id}")
async def delete_corporation(corp_id: str, current_user: User = Depends(get_current_user)):
    result = await db.corporations.delete_one({"id": corp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Corporation not found")
    return {"message": "Corporation deleted"}

# ============= BRANCH ROUTES =============

@api_router.post("/branches", response_model=Branch)
async def create_branch(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    branch = Branch(**data)
    await db.branches.insert_one(branch.model_dump())
    return branch

@api_router.get("/branches", response_model=List[Branch])
async def get_branches(corporation_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"corporation_id": corporation_id} if corporation_id else {}
    branches = await db.branches.find(query, {"_id": 0}).to_list(1000)
    return [Branch(**b) for b in branches]

@api_router.get("/branches/{branch_id}", response_model=Branch)
async def get_branch(branch_id: str, current_user: User = Depends(get_current_user)):
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return Branch(**branch)

@api_router.put("/branches/{branch_id}", response_model=Branch)
async def update_branch(branch_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.branches.update_one({"id": branch_id}, {"$set": data})
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return Branch(**branch)

@api_router.delete("/branches/{branch_id}")
async def delete_branch(branch_id: str, current_user: User = Depends(get_current_user)):
    result = await db.branches.delete_one({"id": branch_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"message": "Branch deleted"}

# ============= DEPARTMENT ROUTES =============

@api_router.post("/departments", response_model=Department)
async def create_department(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    dept = Department(**data)
    await db.departments.insert_one(dept.model_dump())
    return dept

@api_router.get("/departments", response_model=List[Department])
async def get_departments(branch_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"branch_id": branch_id} if branch_id else {}
    depts = await db.departments.find(query, {"_id": 0}).to_list(1000)
    return [Department(**d) for d in depts]

@api_router.put("/departments/{dept_id}", response_model=Department)
async def update_department(dept_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.departments.update_one({"id": dept_id}, {"$set": data})
    dept = await db.departments.find_one({"id": dept_id}, {"_id": 0})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return Department(**dept)

@api_router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: User = Depends(get_current_user)):
    result = await db.departments.delete_one({"id": dept_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted"}

# ============= DIVISION ROUTES =============

@api_router.post("/divisions", response_model=Division)
async def create_division(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    division = Division(**data)
    await db.divisions.insert_one(division.model_dump())
    return division

@api_router.get("/divisions", response_model=List[Division])
async def get_divisions(department_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"department_id": department_id} if department_id else {}
    divisions = await db.divisions.find(query, {"_id": 0}).to_list(1000)
    return [Division(**d) for d in divisions]

@api_router.get("/divisions/{div_id}", response_model=Division)
async def get_division(div_id: str, current_user: User = Depends(get_current_user)):
    division = await db.divisions.find_one({"id": div_id}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return Division(**division)

@api_router.put("/divisions/{div_id}", response_model=Division)
async def update_division(div_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.divisions.update_one({"id": div_id}, {"$set": data})
    division = await db.divisions.find_one({"id": div_id}, {"_id": 0})
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return Division(**division)

@api_router.delete("/divisions/{div_id}")
async def delete_division(div_id: str, current_user: User = Depends(get_current_user)):
    result = await db.divisions.delete_one({"id": div_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Division not found")
    return {"message": "Division deleted"}

# ============= EMPLOYEE ROUTES =============

@api_router.post("/employees", response_model=Employee)
async def create_employee(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    emp = Employee(**data)
    await db.employees.insert_one(emp.model_dump())
    return emp

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(branch_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"branch_id": branch_id} if branch_id else {}
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    result = []
    for e in employees:
        # Clean up empty strings for numeric fields
        for field in ['holiday_allowance', 'sick_leave_allowance', 'salary']:
            if field in e and e[field] == '':
                e[field] = None
        try:
            result.append(Employee(**e))
        except Exception:
            pass  # Skip invalid records
    return result

@api_router.get("/employees/{emp_id}", response_model=Employee)
async def get_employee(emp_id: str, current_user: User = Depends(get_current_user)):
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return Employee(**emp)

@api_router.put("/employees/{emp_id}", response_model=Employee)
async def update_employee(emp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # Clean up empty strings for numeric fields
    for field in ['holiday_allowance', 'sick_leave_allowance', 'salary']:
        if field in data and data[field] == '':
            data[field] = None
    await db.employees.update_one({"id": emp_id}, {"$set": data})
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    # Clean up empty strings in retrieved document
    for field in ['holiday_allowance', 'sick_leave_allowance', 'salary']:
        if field in emp and emp[field] == '':
            emp[field] = None
    return Employee(**emp)

@api_router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: str, current_user: User = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": emp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}

@api_router.post("/employees/{emp_id}/reset-password")
async def reset_employee_password(emp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can reset passwords")
    
    new_password = data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    emp = await db.employees.find_one({"id": emp_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update user password
    password_hash = hash_password(new_password)
    await db.users.update_one(
        {"id": emp["user_id"]},
        {"$set": {"password_hash": password_hash}}
    )
    
    # Mark password reset as required on next login
    await db.employees.update_one(
        {"id": emp_id},
        {"$set": {"password_reset_required": True}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.put("/employees/{emp_id}/portal-access")
async def toggle_portal_access(emp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage portal access")
    
    portal_access_enabled = data.get("portal_access_enabled", True)
    
    await db.employees.update_one(
        {"id": emp_id},
        {"$set": {"portal_access_enabled": portal_access_enabled}}
    )
    
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return Employee(**emp)

# ============= WORKFLOW HELPER FUNCTIONS =============

async def trigger_workflow_for_module(module: str, reference_id: str, requester_id: str) -> Optional[Dict[str, Any]]:
    """
    Find an active workflow for the given module and create a workflow instance.
    Returns the created workflow instance or None if no active workflow exists.
    """
    # Find an active workflow for this module
    workflow = await db.workflows.find_one({"module": module, "is_active": True}, {"_id": 0})
    
    if not workflow or not workflow.get("steps"):
        return None
    
    # Create a workflow instance
    instance = WorkflowInstance(
        workflow_id=workflow["id"],
        module=module,
        reference_id=reference_id,
        requester_id=requester_id,
        current_step=0,
        status="pending" if len(workflow.get("steps", [])) > 0 else "approved"
    )
    
    await db.workflow_instances.insert_one(instance.model_dump())
    return instance.model_dump()

# ============= LEAVE ROUTES =============

@api_router.post("/leaves", response_model=Leave)
async def create_leave(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    leave = Leave(**data)
    leave_dict = leave.model_dump()
    
    # Check if there's an active workflow for leave module
    workflow_instance = await trigger_workflow_for_module(
        module="leave",
        reference_id=leave.id,
        requester_id=leave.employee_id
    )
    
    # If workflow exists, set status to pending_approval
    if workflow_instance:
        leave_dict["status"] = "pending_approval"
    
    await db.leaves.insert_one(leave_dict)
    # Remove _id added by MongoDB before creating response model
    leave_dict.pop("_id", None)
    return Leave(**leave_dict)

@api_router.get("/leaves", response_model=List[Leave])
async def get_leaves(employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"employee_id": employee_id} if employee_id else {}
    leaves = await db.leaves.find(query, {"_id": 0}).to_list(1000)
    return [Leave(**l) for l in leaves]

@api_router.put("/leaves/{leave_id}", response_model=Leave)
async def update_leave(leave_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # If approving, add approved_by and approved_at
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    await db.leaves.update_one({"id": leave_id}, {"$set": data})
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    return Leave(**leave)

@api_router.delete("/leaves/{leave_id}")
async def delete_leave(leave_id: str, current_user: User = Depends(get_current_user)):
    result = await db.leaves.delete_one({"id": leave_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leave not found")
    return {"message": "Leave request deleted"}

@api_router.get("/leaves/export")
async def export_leaves(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    leave_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export leave requests as JSON (frontend will convert to CSV)"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if leave_type:
        query["leave_type"] = leave_type
    if start_date and end_date:
        query["start_date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["start_date"] = {"$gte": start_date}
    elif end_date:
        query["start_date"] = {"$lte": end_date}
    
    records = await db.leaves.find(query, {"_id": 0}).sort("start_date", -1).to_list(10000)
    
    # Get employee names for the export
    employee_ids = list(set(r.get("employee_id") for r in records))
    employees = await db.employees.find({"id": {"$in": employee_ids}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)
    emp_map = {e["id"]: e["full_name"] for e in employees}
    
    # Enrich records with employee names
    for record in records:
        record["employee_name"] = emp_map.get(record.get("employee_id"), "Unknown")
    
    return {"records": records, "total": len(records)}

# ============= LEAVE BALANCE ROUTES =============

@api_router.get("/leave-balances/export")
async def export_leave_balances(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Export leave balances as JSON (frontend will convert to CSV)"""
    if year is None:
        year = datetime.now().year
    
    balances = await db.leave_balances.find({"year": year}, {"_id": 0}).to_list(10000)
    
    # Get employee names for the export
    employee_ids = list(set(b.get("employee_id") for b in balances))
    employees = await db.employees.find({"id": {"$in": employee_ids}}, {"_id": 0, "id": 1, "full_name": 1, "department_id": 1}).to_list(1000)
    emp_map = {e["id"]: {"name": e["full_name"], "department_id": e.get("department_id")} for e in employees}
    
    # Get department names
    dept_ids = list(set(e.get("department_id") for e in employees if e.get("department_id")))
    departments = await db.departments.find({"id": {"$in": dept_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    dept_map = {d["id"]: d["name"] for d in departments}
    
    # Enrich records
    for balance in balances:
        emp_info = emp_map.get(balance.get("employee_id"), {"name": "Unknown", "department_id": None})
        balance["employee_name"] = emp_info["name"]
        balance["department_name"] = dept_map.get(emp_info.get("department_id"), "-")
    
    return {"records": balances, "total": len(balances), "year": year}

@api_router.get("/leave-balances/{employee_id}")
async def get_leave_balance(employee_id: str, year: Optional[int] = None, current_user: User = Depends(get_current_user)):
    if year is None:
        year = datetime.now().year
    balance = await db.leave_balances.find_one({"employee_id": employee_id, "year": year}, {"_id": 0})
    if not balance:
        # Create default balance
        new_balance = LeaveBalance(employee_id=employee_id, year=year)
        await db.leave_balances.insert_one(new_balance.model_dump())
        return new_balance.model_dump()
    return balance

@api_router.put("/leave-balances/{employee_id}")
async def update_leave_balance(employee_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    year = data.get("year", datetime.now().year)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.leave_balances.update_one(
        {"employee_id": employee_id, "year": year},
        {"$set": data},
        upsert=True
    )
    balance = await db.leave_balances.find_one({"employee_id": employee_id, "year": year}, {"_id": 0})
    return balance

@api_router.get("/leave-balances")
async def get_all_leave_balances(year: Optional[int] = None, current_user: User = Depends(get_current_user)):
    if year is None:
        year = datetime.now().year
    balances = await db.leave_balances.find({"year": year}, {"_id": 0}).to_list(1000)
    return balances

@api_router.post("/leave-balances")
async def create_leave_balance(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new leave balance for an employee"""
    if "year" not in data:
        data["year"] = datetime.now().year
    leave_balance = LeaveBalance(**data)
    await db.leave_balances.insert_one(leave_balance.model_dump())
    return leave_balance.model_dump()

# ============= WORKFLOW ROUTES =============

@api_router.post("/workflows", response_model=Workflow)
async def create_workflow(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    workflow = Workflow(**data)
    await db.workflows.insert_one(workflow.model_dump())
    return workflow

@api_router.get("/workflows")
async def get_workflows(module: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"module": module} if module else {}
    workflows = await db.workflows.find(query, {"_id": 0}).to_list(100)
    return workflows

@api_router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    workflow = await db.workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@api_router.put("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.workflows.update_one({"id": workflow_id}, {"$set": data})
    workflow = await db.workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    result = await db.workflows.delete_one({"id": workflow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow deleted"}

# Workflow Instances
@api_router.post("/workflow-instances")
async def create_workflow_instance(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    instance = WorkflowInstance(**data)
    await db.workflow_instances.insert_one(instance.model_dump())
    return instance.model_dump()

@api_router.get("/workflow-instances")
async def get_workflow_instances(module: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if module:
        query["module"] = module
    if status:
        query["status"] = status
    instances = await db.workflow_instances.find(query, {"_id": 0}).to_list(1000)
    return instances

@api_router.get("/workflow-instances/{instance_id}")
async def get_workflow_instance(instance_id: str, current_user: User = Depends(get_current_user)):
    instance = await db.workflow_instances.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    return instance

@api_router.get("/workflow-instances/{instance_id}/details")
async def get_workflow_instance_details(instance_id: str, current_user: User = Depends(get_current_user)):
    """Get workflow instance with enriched details including the referenced document"""
    instance = await db.workflow_instances.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    # Get the workflow template
    workflow = await db.workflows.find_one({"id": instance["workflow_id"]}, {"_id": 0})
    instance["workflow"] = workflow
    
    # Get the referenced document based on module
    collection_map = {
        "leave": "leaves",
        "expense": "expenses",
        "training": "training_requests",
        "document": "document_approvals",
        "time_correction": "time_corrections"
    }
    
    if instance["module"] in collection_map:
        ref_doc = await db[collection_map[instance["module"]]].find_one(
            {"id": instance["reference_id"]}, {"_id": 0}
        )
        instance["reference_document"] = ref_doc
    
    # Get requester info
    requester = await db.employees.find_one({"id": instance["requester_id"]}, {"_id": 0, "id": 1, "full_name": 1})
    instance["requester"] = requester
    
    return instance

@api_router.put("/workflow-instances/{instance_id}/action")
async def workflow_action(instance_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    action = data.get("action")  # "approve", "reject", "skip"
    comment = data.get("comment", "")
    
    instance = await db.workflow_instances.find_one({"id": instance_id}, {"_id": 0})
    if not instance:
        raise HTTPException(status_code=404, detail="Workflow instance not found")
    
    workflow = await db.workflows.find_one({"id": instance["workflow_id"]}, {"_id": 0})
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    step_history = instance.get("step_history", [])
    current_step = instance.get("current_step", 0)
    
    # Record the action
    step_history.append({
        "step": current_step,
        "action": action,
        "user_id": current_user.id,
        "comment": comment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    if action == "reject":
        # Rejected - update instance and the referenced item
        await db.workflow_instances.update_one(
            {"id": instance_id},
            {"$set": {
                "status": "rejected",
                "step_history": step_history,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        # Update the referenced item (leave, expense, etc.)
        collection_map = {
            "leave": "leaves",
            "expense": "expenses",
            "training": "training_requests",
            "document": "document_approvals",
            "time_correction": "time_corrections"
        }
        if instance["module"] in collection_map:
            await db[collection_map[instance["module"]]].update_one(
                {"id": instance["reference_id"]},
                {"$set": {"status": "rejected", "rejection_reason": comment}}
            )
    elif action in ["approve", "skip"]:
        next_step = current_step + 1
        steps = workflow.get("steps", [])
        
        if next_step >= len(steps):
            # All steps completed - approved
            await db.workflow_instances.update_one(
                {"id": instance_id},
                {"$set": {
                    "status": "approved",
                    "current_step": next_step,
                    "step_history": step_history,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            # Update the referenced item
            collection_map = {
                "leave": "leaves",
                "expense": "expenses",
                "training": "training_requests",
                "document": "document_approvals",
                "time_correction": "time_corrections"
            }
            if instance["module"] in collection_map:
                await db[collection_map[instance["module"]]].update_one(
                    {"id": instance["reference_id"]},
                    {"$set": {
                        "status": "approved",
                        "approved_by": current_user.id,
                        "approved_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Special handling for time corrections - update attendance record
                if instance["module"] == "time_correction":
                    correction = await db.time_corrections.find_one({"id": instance["reference_id"]}, {"_id": 0})
                    if correction:
                        update_data = {}
                        if correction.get("requested_clock_in"):
                            update_data["clock_in"] = correction["requested_clock_in"]
                        if correction.get("requested_clock_out"):
                            update_data["clock_out"] = correction["requested_clock_out"]
                        if update_data and correction.get("attendance_id"):
                            await db.attendance.update_one(
                                {"id": correction["attendance_id"]},
                                {"$set": update_data}
                            )
        else:
            # Move to next step
            await db.workflow_instances.update_one(
                {"id": instance_id},
                {"$set": {
                    "status": "in_progress",
                    "current_step": next_step,
                    "step_history": step_history,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    return await db.workflow_instances.find_one({"id": instance_id}, {"_id": 0})

# ============= EXPENSE ROUTES =============

@api_router.post("/expenses")
async def create_expense(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    expense = ExpenseClaim(**data)
    await db.expenses.insert_one(expense.model_dump())
    return expense.model_dump()

@api_router.get("/expenses")
async def get_expenses(employee_id: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(1000)
    return expenses

@api_router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    await db.expenses.update_one({"id": expense_id}, {"$set": data})
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

# ============= TRAINING ROUTES =============

@api_router.post("/training-requests")
async def create_training_request(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    training = TrainingRequest(**data)
    await db.training_requests.insert_one(training.model_dump())
    return training.model_dump()

@api_router.get("/training-requests")
async def get_training_requests(employee_id: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    requests = await db.training_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.put("/training-requests/{request_id}")
async def update_training_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    await db.training_requests.update_one({"id": request_id}, {"$set": data})
    request = await db.training_requests.find_one({"id": request_id}, {"_id": 0})
    return request

@api_router.delete("/training-requests/{request_id}")
async def delete_training_request(request_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_requests.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return {"message": "Training request deleted"}

# ============= DOCUMENT APPROVAL ROUTES =============

@api_router.post("/document-approvals")
async def create_document_approval(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    doc = DocumentApproval(**data)
    await db.document_approvals.insert_one(doc.model_dump())
    return doc.model_dump()

@api_router.get("/document-approvals")
async def get_document_approvals(employee_id: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    docs = await db.document_approvals.find(query, {"_id": 0}).to_list(1000)
    return docs

@api_router.put("/document-approvals/{doc_id}")
async def update_document_approval(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    await db.document_approvals.update_one({"id": doc_id}, {"$set": data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

# ============= ONBOARDING ROUTES =============

@api_router.post("/onboarding-tasks")
async def create_onboarding_task(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    task = OnboardingTask(**data)
    await db.onboarding_tasks.insert_one(task.model_dump())
    return task.model_dump()

@api_router.get("/onboarding-tasks")
async def get_onboarding_tasks(employee_id: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    tasks = await db.onboarding_tasks.find(query, {"_id": 0}).to_list(1000)
    return tasks

@api_router.put("/onboarding-tasks/{task_id}")
async def update_onboarding_task(task_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    await db.onboarding_tasks.update_one({"id": task_id}, {"$set": data})
    task = await db.onboarding_tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.delete("/onboarding-tasks/{task_id}")
async def delete_onboarding_task(task_id: str, current_user: User = Depends(get_current_user)):
    result = await db.onboarding_tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ============= ATTENDANCE ROUTES =============

@api_router.post("/attendance", response_model=Attendance)
async def create_attendance(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    attendance = Attendance(**data)
    await db.attendance.insert_one(attendance.model_dump())
    return attendance

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"employee_id": employee_id} if employee_id else {}
    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return [Attendance(**r) for r in records]

@api_router.put("/attendance/{attendance_id}", response_model=Attendance)
async def update_attendance(attendance_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.attendance.update_one({"id": attendance_id}, {"$set": data})
    record = await db.attendance.find_one({"id": attendance_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return Attendance(**record)

@api_router.delete("/attendance/{attendance_id}")
async def delete_attendance(attendance_id: str, current_user: User = Depends(get_current_user)):
    result = await db.attendance.delete_one({"id": attendance_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return {"message": "Attendance record deleted"}

@api_router.get("/attendance/export")
async def export_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export attendance records as JSON (frontend will convert to CSV)"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}
    
    records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(10000)
    
    # Get employee names for the export
    employee_ids = list(set(r.get("employee_id") for r in records))
    employees = await db.employees.find({"id": {"$in": employee_ids}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)
    emp_map = {e["id"]: e["full_name"] for e in employees}
    
    # Enrich records with employee names
    for record in records:
        record["employee_name"] = emp_map.get(record.get("employee_id"), "Unknown")
    
    return {"records": records, "total": len(records)}

# ============= TIME CORRECTION ROUTES =============

@api_router.post("/time-corrections")
async def create_time_correction(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    correction = TimeCorrectionRequest(**data)
    correction_dict = correction.model_dump()
    
    # Check if there's an active workflow for time_correction module
    workflow_instance = await trigger_workflow_for_module(
        module="time_correction",
        reference_id=correction.id,
        requester_id=correction.employee_id
    )
    
    # If workflow exists, set status to pending_approval
    if workflow_instance:
        correction_dict["status"] = "pending_approval"
    
    await db.time_corrections.insert_one(correction_dict)
    # Remove _id added by MongoDB to avoid serialization error
    correction_dict.pop("_id", None)
    return correction_dict

@api_router.get("/time-corrections")
async def get_time_corrections(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    corrections = await db.time_corrections.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return corrections

@api_router.get("/time-corrections/{correction_id}")
async def get_time_correction(correction_id: str, current_user: User = Depends(get_current_user)):
    correction = await db.time_corrections.find_one({"id": correction_id}, {"_id": 0})
    if not correction:
        raise HTTPException(status_code=404, detail="Time correction not found")
    return correction

@api_router.put("/time-corrections/{correction_id}/approve")
async def approve_time_correction(correction_id: str, current_user: User = Depends(get_current_user)):
    """Approve time correction and update the attendance record"""
    correction = await db.time_corrections.find_one({"id": correction_id}, {"_id": 0})
    if not correction:
        raise HTTPException(status_code=404, detail="Time correction not found")
    
    # Update the attendance record with the corrected times
    update_data = {}
    if correction.get("requested_clock_in"):
        update_data["clock_in"] = correction["requested_clock_in"]
    if correction.get("requested_clock_out"):
        update_data["clock_out"] = correction["requested_clock_out"]
    
    if update_data:
        await db.attendance.update_one(
            {"id": correction["attendance_id"]},
            {"$set": update_data}
        )
    
    # Update the correction status
    await db.time_corrections.update_one(
        {"id": correction_id},
        {"$set": {
            "status": "approved",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Time correction approved and attendance updated"}

@api_router.put("/time-corrections/{correction_id}/reject")
async def reject_time_correction(correction_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject time correction request"""
    await db.time_corrections.update_one(
        {"id": correction_id},
        {"$set": {
            "status": "rejected",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": data.get("rejection_reason", "")
        }}
    )
    return {"message": "Time correction rejected"}

# ============= SCHEDULE ROUTES =============

@api_router.post("/schedules", response_model=Schedule)
async def create_schedule(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    schedule = Schedule(**data)
    await db.schedules.insert_one(schedule.model_dump())
    return schedule

@api_router.get("/schedules", response_model=List[Schedule])
async def get_schedules(current_user: User = Depends(get_current_user)):
    schedules = await db.schedules.find({}, {"_id": 0}).to_list(100)
    return [Schedule(**s) for s in schedules]

@api_router.get("/schedules/{schedule_id}", response_model=Schedule)
async def get_schedule(schedule_id: str, current_user: User = Depends(get_current_user)):
    schedule = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return Schedule(**schedule)

@api_router.put("/schedules/{schedule_id}", response_model=Schedule)
async def update_schedule(schedule_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.schedules.update_one({"id": schedule_id}, {"$set": data})
    schedule = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return Schedule(**schedule)

@api_router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, current_user: User = Depends(get_current_user)):
    result = await db.schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}

@api_router.post("/employees/{emp_id}/assign-schedule")
async def assign_schedule_to_employee(emp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    schedule_id = data.get("schedule_id")
    await db.employees.update_one({"id": emp_id}, {"$set": {"schedule_id": schedule_id}})
    return {"message": "Schedule assigned successfully"}

# ============= PERFORMANCE REVIEW ROUTES =============

@api_router.post("/reviews")
async def create_review(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    review = PerformanceReview(**data)
    await db.reviews.insert_one(review.model_dump())
    return review.model_dump()

@api_router.get("/reviews")
async def get_reviews(
    employee_id: Optional[str] = None, 
    reviewer_id: Optional[str] = None,
    status: Optional[str] = None,
    review_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if reviewer_id:
        query["reviewer_id"] = reviewer_id
    if status:
        query["status"] = status
    if review_type:
        query["review_type"] = review_type
    reviews = await db.reviews.find(query, {"_id": 0}).to_list(1000)
    return reviews

@api_router.get("/reviews/{review_id}")
async def get_review(review_id: str, current_user: User = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@api_router.put("/reviews/{review_id}")
async def update_review(review_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.reviews.update_one({"id": review_id}, {"$set": data})
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return review

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, current_user: User = Depends(get_current_user)):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}

@api_router.post("/reviews/{review_id}/submit-self-assessment")
async def submit_self_assessment(review_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Employee submits their self-assessment"""
    update_data = {
        "self_assessment": data.get("self_assessment"),
        "self_rating": data.get("self_rating"),
        "achievements": data.get("achievements"),
        "challenges": data.get("challenges"),
        "status": "pending_review",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return review

@api_router.post("/reviews/{review_id}/complete")
async def complete_review(review_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Manager completes the review"""
    # Calculate overall rating from category ratings
    ratings = [
        data.get("communication_rating"),
        data.get("teamwork_rating"),
        data.get("technical_skills_rating"),
        data.get("problem_solving_rating"),
        data.get("leadership_rating"),
        data.get("punctuality_rating")
    ]
    valid_ratings = [r for r in ratings if r is not None]
    overall_rating = sum(valid_ratings) / len(valid_ratings) if valid_ratings else None
    
    update_data = {
        **data,
        "overall_rating": overall_rating,
        "status": "completed",
        "review_date": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return review

@api_router.get("/reviews/stats/summary")
async def get_review_stats(current_user: User = Depends(get_current_user)):
    """Get performance review statistics"""
    total = await db.reviews.count_documents({})
    completed = await db.reviews.count_documents({"status": "completed"})
    pending = await db.reviews.count_documents({"status": {"$in": ["draft", "pending_self_assessment", "pending_review"]}})
    
    # Get average rating
    pipeline = [
        {"$match": {"overall_rating": {"$ne": None}}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$overall_rating"}}}
    ]
    avg_result = await db.reviews.aggregate(pipeline).to_list(1)
    avg_rating = avg_result[0]["avg_rating"] if avg_result else 0
    
    return {
        "total_reviews": total,
        "completed_reviews": completed,
        "pending_reviews": pending,
        "average_rating": round(avg_rating, 2) if avg_rating else 0
    }

# ============= DASHBOARD STATS =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_corps = await db.corporations.count_documents({})
    total_branches = await db.branches.count_documents({})
    total_departments = await db.departments.count_documents({})
    total_divisions = await db.divisions.count_documents({})
    total_employees = await db.employees.count_documents({})
    pending_leaves = await db.leaves.count_documents({"status": "pending"})
    
    return {
        "total_corporations": total_corps,
        "total_branches": total_branches,
        "total_departments": total_departments,
        "total_divisions": total_divisions,
        "total_employees": total_employees,
        "pending_leaves": pending_leaves
    }

# ============= ROLES & PERMISSIONS =============

AVAILABLE_PERMISSIONS = [
    # Employee Management
    {"id": "employees.view", "name": "View Employees", "category": "Employees", "description": "View employee list and details"},
    {"id": "employees.create", "name": "Create Employees", "category": "Employees", "description": "Add new employees"},
    {"id": "employees.edit", "name": "Edit Employees", "category": "Employees", "description": "Modify employee information"},
    {"id": "employees.delete", "name": "Delete Employees", "category": "Employees", "description": "Remove employees"},
    {"id": "employees.reset_password", "name": "Reset Passwords", "category": "Employees", "description": "Reset employee passwords"},
    {"id": "employees.manage_access", "name": "Manage Portal Access", "category": "Employees", "description": "Enable/disable employee portal access"},
    
    # Leave Management
    {"id": "leaves.view", "name": "View Leaves", "category": "Leave Management", "description": "View leave requests"},
    {"id": "leaves.create", "name": "Create Leaves", "category": "Leave Management", "description": "Submit leave requests"},
    {"id": "leaves.approve", "name": "Approve/Reject Leaves", "category": "Leave Management", "description": "Approve or reject leave requests"},
    
    # Attendance
    {"id": "attendance.view", "name": "View Attendance", "category": "Attendance", "description": "View attendance records"},
    {"id": "attendance.manage", "name": "Manage Attendance", "category": "Attendance", "description": "Add/edit attendance records"},
    
    # Performance Reviews
    {"id": "reviews.view", "name": "View Reviews", "category": "Performance", "description": "View performance reviews"},
    {"id": "reviews.create", "name": "Create Reviews", "category": "Performance", "description": "Create performance reviews"},
    {"id": "reviews.edit", "name": "Edit Reviews", "category": "Performance", "description": "Modify performance reviews"},
    
    # Organization Structure
    {"id": "organization.view", "name": "View Organization", "category": "Organization", "description": "View corporations, branches, departments, divisions"},
    {"id": "organization.manage", "name": "Manage Organization", "category": "Organization", "description": "Create/edit/delete organizational units"},
    
    # Payroll
    {"id": "payroll.view", "name": "View Payroll", "category": "Payroll", "description": "View salary and payroll information"},
    {"id": "payroll.manage", "name": "Manage Payroll", "category": "Payroll", "description": "Edit salary and payroll data"},
    
    # Settings & Admin
    {"id": "settings.view", "name": "View Settings", "category": "Administration", "description": "View system settings"},
    {"id": "settings.manage", "name": "Manage Settings", "category": "Administration", "description": "Modify system settings"},
    {"id": "roles.manage", "name": "Manage Roles", "category": "Administration", "description": "Create and manage user roles"},
]

@api_router.get("/permissions", response_model=List[Permission])
async def get_permissions(current_user: User = Depends(get_current_user)):
    return [Permission(**p) for p in AVAILABLE_PERMISSIONS]

@api_router.post("/roles", response_model=Role)
async def create_role(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can create roles")
    
    role = Role(**data)
    await db.roles.insert_one(role.model_dump())
    return role

@api_router.get("/roles", response_model=List[Role])
async def get_roles(current_user: User = Depends(get_current_user)):
    roles = await db.roles.find({}, {"_id": 0}).to_list(1000)
    return [Role(**r) for r in roles]

@api_router.get("/roles/{role_id}", response_model=Role)
async def get_role(role_id: str, current_user: User = Depends(get_current_user)):
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return Role(**role)

@api_router.put("/roles/{role_id}", response_model=Role)
async def update_role(role_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can update roles")
    
    role = await db.roles.find_one({"id": role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.get("is_system_role"):
        raise HTTPException(status_code=400, detail="Cannot modify system roles")
    
    await db.roles.update_one({"id": role_id}, {"$set": data})
    updated_role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    return Role(**updated_role)

@api_router.delete("/roles/{role_id}")
async def delete_role(role_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can delete roles")
    
    role = await db.roles.find_one({"id": role_id})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.get("is_system_role"):
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    # Check if any users have this role
    users_with_role = await db.users.count_documents({"role": role["name"]})
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role. {users_with_role} users are assigned to this role")
    
    await db.roles.delete_one({"id": role_id})
    return {"message": "Role deleted successfully"}

@api_router.post("/roles/initialize-defaults")
async def initialize_default_roles(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only super admin can initialize roles")
    
    existing_roles = await db.roles.count_documents({})
    if existing_roles > 0:
        raise HTTPException(status_code=400, detail="Roles already initialized")
    
    default_roles = [
        {
            "name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access with all permissions",
            "permissions": [p["id"] for p in AVAILABLE_PERMISSIONS],
            "is_system_role": True
        },
        {
            "name": "corp_admin",
            "display_name": "Corporate Administrator",
            "description": "Manage corporation and employees",
            "permissions": [
                "employees.view", "employees.create", "employees.edit", "employees.reset_password",
                "leaves.view", "leaves.approve", "attendance.view", "attendance.manage",
                "reviews.view", "reviews.create", "organization.view", "payroll.view"
            ],
            "is_system_role": True
        },
        {
            "name": "branch_manager",
            "display_name": "Branch Manager",
            "description": "Manage branch employees and operations",
            "permissions": [
                "employees.view", "leaves.view", "leaves.approve", 
                "attendance.view", "attendance.manage", "reviews.view", "reviews.create"
            ],
            "is_system_role": True
        },
        {
            "name": "employee",
            "display_name": "Employee",
            "description": "Basic employee access",
            "permissions": [
                "leaves.view", "leaves.create", "attendance.view"
            ],
            "is_system_role": True
        },
    ]
    
    for role_data in default_roles:
        role = Role(**role_data)
        await db.roles.insert_one(role.model_dump())
    
    return {"message": f"Initialized {len(default_roles)} default roles"}

# ============= RECRUITMENT ROUTES =============

@api_router.get("/jobs")
async def get_jobs(status: Optional[str] = None, is_internal: Optional[bool] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if is_internal is not None:
        query["is_internal"] = is_internal
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return jobs

@api_router.get("/jobs/open")
async def get_open_jobs(current_user: User = Depends(get_current_user)):
    """Get all open jobs for employees to view (job board)"""
    query = {"status": "open"}
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str, current_user: User = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api_router.get("/jobs/{job_id}/stats")
async def get_job_stats(job_id: str, current_user: User = Depends(get_current_user)):
    """Get statistics for a specific job"""
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(1000)
    stats = {
        "total": len(applications),
        "new": len([a for a in applications if a.get("status") == "new"]),
        "screening": len([a for a in applications if a.get("status") == "screening"]),
        "interview": len([a for a in applications if a.get("status") == "interview"]),
        "offer": len([a for a in applications if a.get("status") == "offer"]),
        "hired": len([a for a in applications if a.get("status") == "hired"]),
        "rejected": len([a for a in applications if a.get("status") == "rejected"]),
    }
    return stats

@api_router.post("/jobs")
async def create_job(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    job = Job(**data)
    await db.jobs.insert_one(job.model_dump())
    return job.model_dump()

@api_router.put("/jobs/{job_id}")
async def update_job(job_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.jobs.update_one({"id": job_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return await db.jobs.find_one({"id": job_id}, {"_id": 0})

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: User = Depends(get_current_user)):
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    # Also delete related applications and interviews
    await db.applications.delete_many({"job_id": job_id})
    await db.interviews.delete_many({"job_id": job_id})
    return {"message": "Job deleted"}

@api_router.get("/applications")
async def get_applications(job_id: Optional[str] = None, status: Optional[str] = None, referral_employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if job_id:
        query["job_id"] = job_id
    if status:
        query["status"] = status
    if referral_employee_id:
        query["referral_employee_id"] = referral_employee_id
    applications = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return applications

@api_router.get("/applications/my-referrals")
async def get_my_referrals(current_user: User = Depends(get_current_user)):
    """Get applications referred by the current user"""
    # Find employee record for current user
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    applications = await db.applications.find({"referral_employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return applications

@api_router.get("/applications/export")
async def export_applications(job_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Export applications as JSON (frontend will convert to CSV)"""
    query = {}
    if job_id:
        query["job_id"] = job_id
    applications = await db.applications.find(query, {"_id": 0}).to_list(1000)
    
    # Get job titles for the export
    job_ids = list(set([a.get("job_id") for a in applications if a.get("job_id")]))
    jobs = await db.jobs.find({"id": {"$in": job_ids}}, {"_id": 0, "id": 1, "title": 1}).to_list(1000)
    job_map = {j["id"]: j["title"] for j in jobs}
    
    export_data = []
    for app in applications:
        export_data.append({
            "Candidate Name": app.get("candidate_name", ""),
            "Email": app.get("email", ""),
            "Phone": app.get("phone", ""),
            "Position": job_map.get(app.get("job_id"), ""),
            "Status": app.get("status", ""),
            "Source": app.get("source", ""),
            "Experience (Years)": app.get("experience_years", ""),
            "Expected Salary": app.get("expected_salary", ""),
            "Rating": app.get("rating", ""),
            "Applied Date": app.get("created_at", "")[:10] if app.get("created_at") else "",
        })
    return export_data

@api_router.get("/applications/{application_id}")
async def get_application(application_id: str, current_user: User = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@api_router.post("/applications")
async def create_application(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    application = Application(**data)
    await db.applications.insert_one(application.model_dump())
    return application.model_dump()

@api_router.put("/applications/{application_id}")
async def update_application(application_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.applications.update_one({"id": application_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return await db.applications.find_one({"id": application_id}, {"_id": 0})

@api_router.delete("/applications/{application_id}")
async def delete_application(application_id: str, current_user: User = Depends(get_current_user)):
    result = await db.applications.delete_one({"id": application_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    # Also delete related interviews
    await db.interviews.delete_many({"application_id": application_id})
    return {"message": "Application deleted"}

# Interview routes
@api_router.get("/interviews")
async def get_interviews(application_id: Optional[str] = None, job_id: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if application_id:
        query["application_id"] = application_id
    if job_id:
        query["job_id"] = job_id
    if status:
        query["status"] = status
    interviews = await db.interviews.find(query, {"_id": 0}).sort("scheduled_date", -1).to_list(1000)
    return interviews

@api_router.post("/interviews")
async def create_interview(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    interview = Interview(**data)
    await db.interviews.insert_one(interview.model_dump())
    # Update application status to interview
    await db.applications.update_one(
        {"id": data.get("application_id")},
        {"$set": {"status": "interview", "interview_date": data.get("scheduled_date"), "interview_type": data.get("interview_type")}}
    )
    return interview.model_dump()

@api_router.put("/interviews/{interview_id}")
async def update_interview(interview_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    result = await db.interviews.update_one({"id": interview_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")
    # If interview is completed, update application with feedback
    if data.get("status") == "completed":
        interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
        if interview:
            await db.applications.update_one(
                {"id": interview["application_id"]},
                {"$set": {"interview_feedback": data.get("feedback"), "interviewed_by": ",".join(interview.get("interviewers", []))}}
            )
    return await db.interviews.find_one({"id": interview_id}, {"_id": 0})

@api_router.delete("/interviews/{interview_id}")
async def delete_interview(interview_id: str, current_user: User = Depends(get_current_user)):
    result = await db.interviews.delete_one({"id": interview_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview deleted"}

# Recruitment stats
@api_router.get("/recruitment/stats")
async def get_recruitment_stats(current_user: User = Depends(get_current_user)):
    """Get overall recruitment statistics"""
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(1000)
    applications = await db.applications.find({}, {"_id": 0}).to_list(1000)
    interviews = await db.interviews.find({}, {"_id": 0}).to_list(1000)
    
    return {
        "jobs": {
            "total": len(jobs),
            "open": len([j for j in jobs if j.get("status") == "open"]),
            "closed": len([j for j in jobs if j.get("status") == "closed"]),
            "on_hold": len([j for j in jobs if j.get("status") == "on_hold"]),
            "draft": len([j for j in jobs if j.get("status") == "draft"]),
        },
        "applications": {
            "total": len(applications),
            "new": len([a for a in applications if a.get("status") == "new"]),
            "screening": len([a for a in applications if a.get("status") == "screening"]),
            "interview": len([a for a in applications if a.get("status") == "interview"]),
            "offer": len([a for a in applications if a.get("status") == "offer"]),
            "hired": len([a for a in applications if a.get("status") == "hired"]),
            "rejected": len([a for a in applications if a.get("status") == "rejected"]),
            "referrals": len([a for a in applications if a.get("source") == "referral"]),
        },
        "interviews": {
            "total": len(interviews),
            "scheduled": len([i for i in interviews if i.get("status") == "scheduled"]),
            "completed": len([i for i in interviews if i.get("status") == "completed"]),
        }
    }

# ============= ONBOARDING ROUTES =============

@api_router.get("/onboarding-templates")
async def get_onboarding_templates(department_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if department_id:
        query["department_id"] = department_id
    templates = await db.onboarding_templates.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return templates

@api_router.get("/onboarding-templates/{template_id}")
async def get_onboarding_template(template_id: str, current_user: User = Depends(get_current_user)):
    template = await db.onboarding_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.post("/onboarding-templates")
async def create_onboarding_template(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    template = OnboardingTemplate(**data)
    await db.onboarding_templates.insert_one(template.model_dump())
    return template.model_dump()

@api_router.put("/onboarding-templates/{template_id}")
async def update_onboarding_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.onboarding_templates.update_one({"id": template_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return await db.onboarding_templates.find_one({"id": template_id}, {"_id": 0})

@api_router.delete("/onboarding-templates/{template_id}")
async def delete_onboarding_template(template_id: str, current_user: User = Depends(get_current_user)):
    result = await db.onboarding_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@api_router.get("/onboardings")
async def get_onboardings(status: Optional[str] = None, employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    onboardings = await db.onboardings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return onboardings

@api_router.get("/onboardings/my")
async def get_my_onboarding(current_user: User = Depends(get_current_user)):
    """Get the current user's onboarding (for employees)"""
    # Find employee by user email - check multiple email fields
    employee = await db.employees.find_one({
        "$or": [
            {"email": current_user.email},
            {"work_email": current_user.email},
            {"personal_email": current_user.email}
        ]
    }, {"_id": 0})
    if not employee:
        # Also try to find by user_id
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return None
    # Get active onboarding for this employee
    onboarding = await db.onboardings.find_one(
        {"employee_id": employee["id"], "status": {"$in": ["in_progress", "not_started"]}},
        {"_id": 0}
    )
    return onboarding

@api_router.get("/onboardings/stats")
async def get_onboarding_stats(current_user: User = Depends(get_current_user)):
    """Get onboarding statistics"""
    onboardings = await db.onboardings.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total_tasks = 0
    completed_tasks = 0
    overdue_tasks = 0
    today = datetime.now(timezone.utc).date()
    
    for ob in onboardings:
        if ob.get("status") == "in_progress":
            start_date = datetime.fromisoformat(ob.get("start_date", "").replace("Z", "+00:00")).date() if ob.get("start_date") else today
            for task in ob.get("tasks", []):
                total_tasks += 1
                if task.get("completed"):
                    completed_tasks += 1
                else:
                    due_date = start_date + timedelta(days=task.get("due_day", 1))
                    if due_date < today:
                        overdue_tasks += 1
    
    return {
        "total": len(onboardings),
        "in_progress": len([o for o in onboardings if o.get("status") == "in_progress"]),
        "completed": len([o for o in onboardings if o.get("status") == "completed"]),
        "on_hold": len([o for o in onboardings if o.get("status") == "on_hold"]),
        "not_started": len([o for o in onboardings if o.get("status") == "not_started"]),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "avg_completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    }

@api_router.get("/onboardings/{onboarding_id}")
async def get_onboarding(onboarding_id: str, current_user: User = Depends(get_current_user)):
    onboarding = await db.onboardings.find_one({"id": onboarding_id}, {"_id": 0})
    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    return onboarding

@api_router.post("/onboardings")
async def create_onboarding(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # Get template to copy tasks
    template_id = data.get("template_id")
    if template_id:
        template = await db.onboarding_templates.find_one({"id": template_id}, {"_id": 0})
        if template:
            data["tasks"] = [dict(t) for t in template.get("tasks", [])]  # Deep copy tasks
            data["duration_days"] = template.get("duration_days", 30)
            data["department_id"] = data.get("department_id") or template.get("department_id")
            data["template_name"] = template.get("name")
            data["welcome_message"] = template.get("welcome_message")
    
    # Calculate target end date
    if data.get("start_date") and data.get("duration_days"):
        start = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
        end = start + timedelta(days=data["duration_days"])
        data["target_end_date"] = end.date().isoformat()
    
    # Mark tasks as not completed and add tracking fields
    for task in data.get("tasks", []):
        task["completed"] = False
        task["completed_at"] = None
        task["completed_by"] = None
        task["completion_notes"] = None
    
    onboarding = Onboarding(**data)
    await db.onboardings.insert_one(onboarding.model_dump())
    return onboarding.model_dump()

@api_router.put("/onboardings/{onboarding_id}")
async def update_onboarding(onboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    # Check if completing
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
        data["actual_end_date"] = datetime.now(timezone.utc).date().isoformat()
    result = await db.onboardings.update_one({"id": onboarding_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    return await db.onboardings.find_one({"id": onboarding_id}, {"_id": 0})

@api_router.put("/onboardings/{onboarding_id}/tasks/{task_index}")
async def update_onboarding_task(onboarding_id: str, task_index: int, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    onboarding = await db.onboardings.find_one({"id": onboarding_id}, {"_id": 0})
    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    
    tasks = onboarding.get("tasks", [])
    if task_index < 0 or task_index >= len(tasks):
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    tasks[task_index]["completed"] = data.get("completed", tasks[task_index].get("completed", False))
    if tasks[task_index]["completed"]:
        tasks[task_index]["completed_at"] = datetime.now(timezone.utc).isoformat()
        tasks[task_index]["completed_by"] = current_user.id
        tasks[task_index]["completion_notes"] = data.get("completion_notes")
    else:
        tasks[task_index]["completed_at"] = None
        tasks[task_index]["completed_by"] = None
        tasks[task_index]["completion_notes"] = None
    
    # Check if all required tasks completed to auto-complete onboarding
    required_tasks = [t for t in tasks if t.get("is_required", True)]
    all_required_completed = all(t.get("completed", False) for t in required_tasks) if required_tasks else False
    all_completed = all(t.get("completed", False) for t in tasks)
    
    update_data = {"tasks": tasks, "updated_at": datetime.now(timezone.utc).isoformat()}
    if all_completed:
        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["actual_end_date"] = datetime.now(timezone.utc).date().isoformat()
    
    await db.onboardings.update_one({"id": onboarding_id}, {"$set": update_data})
    return await db.onboardings.find_one({"id": onboarding_id}, {"_id": 0})

@api_router.post("/onboardings/{onboarding_id}/feedback")
async def submit_onboarding_feedback(onboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Submit feedback for completed onboarding"""
    result = await db.onboardings.update_one(
        {"id": onboarding_id},
        {"$set": {
            "feedback": data.get("feedback"),
            "feedback_rating": data.get("rating"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    return await db.onboardings.find_one({"id": onboarding_id}, {"_id": 0})

@api_router.delete("/onboardings/{onboarding_id}")
async def delete_onboarding(onboarding_id: str, current_user: User = Depends(get_current_user)):
    result = await db.onboardings.delete_one({"id": onboarding_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    return {"message": "Onboarding deleted"}

# ============= INCLUDE ROUTER =============
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
