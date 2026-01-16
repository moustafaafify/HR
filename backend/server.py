from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads" / "documents"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

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

# ============= MONGODB HELPER FUNCTIONS =============

def clean_mongo_response(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Remove MongoDB _id field from a document to prevent serialization errors.
    
    MongoDB adds an _id field (ObjectId type) when inserting documents.
    ObjectId is not JSON serializable. This helper ensures clean responses.
    
    Usage:
        - After insert_one: return clean_mongo_response(doc)
        - Or use projection in find: find({}, {"_id": 0})
    """
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != "_id"}
    return result

def clean_mongo_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove MongoDB _id field from a list of documents."""
    return [clean_mongo_response(doc) for doc in docs if doc is not None]

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

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
    category: str  # "travel", "meals", "office", "equipment", "training", "communication", "transportation", "accommodation", "entertainment", "other"
    subcategory: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None
    expense_date: str
    merchant_name: Optional[str] = None
    payment_method: str = "personal"  # personal, corporate_card, reimbursement
    project_id: Optional[str] = None
    department_id: Optional[str] = None
    status: str = "pending"  # pending, submitted, under_review, approved, rejected, paid, cancelled
    workflow_instance_id: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    reimbursement_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    training_type: str = "course"  # course, certification, workshop, conference, online, seminar, bootcamp
    category: str = "professional"  # professional, technical, leadership, compliance, soft_skills, other
    provider: Optional[str] = None
    provider_url: Optional[str] = None
    cost: float = 0
    currency: str = "USD"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_hours: Optional[int] = None
    location: Optional[str] = None  # online, onsite, offsite, hybrid
    objectives: Optional[str] = None
    expected_outcomes: Optional[str] = None
    department_id: Optional[str] = None
    manager_id: Optional[str] = None
    status: str = "pending"  # pending, submitted, under_review, approved, rejected, in_progress, completed, cancelled
    workflow_instance_id: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    completion_date: Optional[str] = None
    completion_certificate_url: Optional[str] = None
    feedback: Optional[str] = None
    feedback_rating: Optional[int] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Training Course Management Models
class TrainingType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingCourse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    type_id: Optional[str] = None
    category_id: Optional[str] = None
    content_type: str = "video"  # video, document, link, mixed
    video_url: Optional[str] = None
    document_url: Optional[str] = None
    external_link: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    difficulty_level: str = "beginner"  # beginner, intermediate, advanced
    objectives: Optional[List[str]] = Field(default_factory=list)
    prerequisites: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)
    is_mandatory: bool = False
    is_published: bool = False
    department_ids: Optional[List[str]] = Field(default_factory=list)  # Restrict to specific departments
    created_by: Optional[str] = None
    view_count: int = 0
    completion_count: int = 0
    avg_rating: float = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    employee_id: str
    assigned_by: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "assigned"  # assigned, in_progress, completed, overdue
    progress: int = 0  # 0-100
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    time_spent_minutes: int = 0
    last_accessed_at: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    certificate_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DocumentApproval(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    title: str
    description: Optional[str] = None
    document_type: str  # "policy", "contract", "report", "proposal", "invoice", "certificate", "other"
    category: str = "general"  # "hr", "finance", "legal", "operations", "technical", "general"
    document_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    version: int = 1
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    due_date: Optional[str] = None
    department_id: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str = "submitted"  # "draft", "submitted", "under_review", "approved", "rejected", "revision_requested"
    reviewer_id: Optional[str] = None
    reviewed_at: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    revision_notes: Optional[str] = None
    comments: Optional[List[Dict[str, Any]]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None
    # New fields for admin-assigned documents
    is_assigned: bool = False  # True if admin assigned this to employee for acknowledgment
    assigned_by: Optional[str] = None
    assigned_at: Optional[str] = None
    acknowledgment_required: bool = False
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None
    template_id: Optional[str] = None  # Reference to template if created from one

class DocumentTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    document_type_id: Optional[str] = None  # Reference to DocumentType
    category_id: Optional[str] = None  # Reference to DocumentCategory
    default_priority: str = "normal"
    document_url: Optional[str] = None  # Template file URL
    instructions: Optional[str] = None  # Instructions for filling out
    required_fields: Optional[List[str]] = None  # Fields that must be filled
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class DocumentType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None  # emoji or icon name
    color: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DocumentCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
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

# ============= APPRAISAL MODELS =============

class AppraisalCycle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Q1 2025 Review", "Annual Review 2025"
    description: Optional[str] = None
    cycle_type: str = "annual"  # annual, quarterly, mid_year, probation
    start_date: str
    end_date: str
    review_period_start: str  # Period being reviewed
    review_period_end: str
    status: str = "draft"  # draft, active, closed
    questions: List[Dict[str, Any]] = Field(default_factory=list)  # [{id, question, type, required, options}]
    rating_scale: int = 5  # 1-5 or 1-10
    self_assessment_required: bool = True
    manager_review_required: bool = True
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Appraisal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    
    status: str = "pending"  # pending, self_assessment, manager_review, completed, rejected
    
    # Self Assessment
    self_assessment_answers: List[Dict[str, Any]] = Field(default_factory=list)  # [{question_id, answer, rating}]
    self_overall_rating: Optional[float] = None
    self_achievements: Optional[str] = None
    self_challenges: Optional[str] = None
    self_goals: Optional[str] = None
    self_submitted_at: Optional[str] = None
    
    # Manager Review
    manager_answers: List[Dict[str, Any]] = Field(default_factory=list)  # [{question_id, answer, rating}]
    manager_overall_rating: Optional[float] = None
    manager_feedback: Optional[str] = None
    manager_strengths: Optional[str] = None
    manager_improvements: Optional[str] = None
    manager_recommendations: Optional[str] = None
    manager_submitted_at: Optional[str] = None
    
    # Final
    final_rating: Optional[float] = None
    final_comments: Optional[str] = None
    acknowledged_by_employee: bool = False
    acknowledged_at: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= PAYROLL MODELS =============

class SalaryStructure(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    
    # Basic Salary
    basic_salary: float = 0
    currency: str = "USD"
    pay_frequency: str = "monthly"  # monthly, bi_weekly, weekly
    
    # Allowances
    housing_allowance: float = 0
    transport_allowance: float = 0
    meal_allowance: float = 0
    phone_allowance: float = 0
    other_allowances: float = 0
    allowance_details: Optional[str] = None
    
    # Deductions
    tax_rate: float = 0  # Percentage
    social_security: float = 0
    health_insurance: float = 0
    pension_contribution: float = 0
    other_deductions: float = 0
    deduction_details: Optional[str] = None
    
    # Bank Details
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_routing_number: Optional[str] = None
    payment_method: str = "bank_transfer"  # bank_transfer, check, cash
    
    effective_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    status: str = "active"  # active, inactive
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Payslip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    
    # Pay Period
    pay_period: str  # e.g., "2025-01", "2025-W02"
    pay_period_start: str
    pay_period_end: str
    payment_date: str
    
    # Earnings
    basic_salary: float = 0
    housing_allowance: float = 0
    transport_allowance: float = 0
    meal_allowance: float = 0
    phone_allowance: float = 0
    other_allowances: float = 0
    overtime_hours: float = 0
    overtime_rate: float = 0
    overtime_pay: float = 0
    bonus: float = 0
    commission: float = 0
    gross_salary: float = 0
    
    # Deductions
    tax_amount: float = 0
    social_security: float = 0
    health_insurance: float = 0
    pension_contribution: float = 0
    loan_deduction: float = 0
    other_deductions: float = 0
    total_deductions: float = 0
    
    # Net Pay
    net_salary: float = 0
    currency: str = "USD"
    
    # Status
    status: str = "draft"  # draft, approved, paid, cancelled
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PayrollRun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "January 2025 Payroll"
    pay_period: str
    pay_period_start: str
    pay_period_end: str
    payment_date: str
    
    total_employees: int = 0
    total_gross: float = 0
    total_deductions: float = 0
    total_net: float = 0
    currency: str = "USD"
    
    status: str = "draft"  # draft, processing, approved, paid, cancelled
    
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    processed_at: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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

@api_router.post("/auth/change-password")
async def change_password(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Change user's password"""
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new password required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Get user from database
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update password
    await db.users.update_one({"id": current_user.id}, {"$set": {"password_hash": new_password_hash}})
    
    return {"message": "Password changed successfully"}

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

@api_router.get("/employees/me")
async def get_my_employee_profile(current_user: User = Depends(get_current_user)):
    """Get current user's employee profile"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        # Return basic user info if no employee record
        return {
            "id": current_user.id,
            "user_id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "work_email": current_user.email
        }
    return employee

@api_router.put("/employees/me")
async def update_my_employee_profile(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update current user's employee profile"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Fields that employees can update themselves
    allowed_fields = [
        'first_name', 'last_name', 'phone', 'personal_email', 'date_of_birth',
        'gender', 'marital_status', 'nationality', 'bio',
        'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
        'emergency_contact_name', 'emergency_contact_relationship', 
        'emergency_contact_phone', 'emergency_contact_email',
        'linkedin_url', 'twitter_url', 'github_url', 'profile_picture'
    ]
    
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if 'first_name' in update_data and 'last_name' in update_data:
        update_data['full_name'] = f"{update_data['first_name']} {update_data['last_name']}"
    
    if update_data:
        await db.employees.update_one({"user_id": current_user.id}, {"$set": update_data})
    
    return await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})

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
    # Set employee_id from current user if not provided
    if "employee_id" not in data:
        employee = await db.employees.find_one({
            "$or": [
                {"email": current_user.email},
                {"work_email": current_user.email},
                {"personal_email": current_user.email}
            ]
        }, {"_id": 0})
        if employee:
            data["employee_id"] = employee["id"]
    
    expense = ExpenseClaim(**data)
    await db.expenses.insert_one(expense.model_dump())
    
    # Check for expense workflow and create instance if exists
    workflow = await db.workflows.find_one({"module": "expense", "is_active": True}, {"_id": 0})
    if workflow and data.get("status") == "submitted":
        workflow_data = {
            "workflow_id": workflow["id"],
            "workflow_name": workflow["name"],
            "module": "expense",
            "reference_id": expense.id,
            "initiated_by": current_user.id,
            "status": "pending",
            "current_step": 0,
            "step_history": []
        }
        instance = WorkflowInstance(**workflow_data)
        await db.workflow_instances.insert_one(instance.model_dump())
        # Update expense with workflow instance id
        await db.expenses.update_one(
            {"id": expense.id}, 
            {"$set": {"workflow_instance_id": instance.id, "status": "under_review"}}
        )
    
    return await db.expenses.find_one({"id": expense.id}, {"_id": 0})

@api_router.get("/expenses")
async def get_expenses(
    employee_id: Optional[str] = None, 
    status: Optional[str] = None, 
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if date_from:
        query["expense_date"] = {"$gte": date_from}
    if date_to:
        if "expense_date" in query:
            query["expense_date"]["$lte"] = date_to
        else:
            query["expense_date"] = {"$lte": date_to}
    expenses = await db.expenses.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return expenses

@api_router.get("/expenses/my")
async def get_my_expenses(current_user: User = Depends(get_current_user)):
    """Get current user's expenses"""
    employee = await db.employees.find_one({
        "$or": [
            {"email": current_user.email},
            {"work_email": current_user.email},
            {"personal_email": current_user.email}
        ]
    }, {"_id": 0})
    if not employee:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    expenses = await db.expenses.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return expenses

@api_router.get("/expenses/stats")
async def get_expense_stats(current_user: User = Depends(get_current_user)):
    """Get expense statistics"""
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    total_amount = sum(e.get("amount", 0) for e in expenses)
    pending_amount = sum(e.get("amount", 0) for e in expenses if e.get("status") in ["pending", "submitted", "under_review"])
    approved_amount = sum(e.get("amount", 0) for e in expenses if e.get("status") == "approved")
    paid_amount = sum(e.get("amount", 0) for e in expenses if e.get("status") == "paid")
    
    # By category
    by_category = {}
    for e in expenses:
        cat = e.get("category", "other")
        if cat not in by_category:
            by_category[cat] = {"count": 0, "amount": 0}
        by_category[cat]["count"] += 1
        by_category[cat]["amount"] += e.get("amount", 0)
    
    # By status
    by_status = {}
    for e in expenses:
        status = e.get("status", "pending")
        if status not in by_status:
            by_status[status] = {"count": 0, "amount": 0}
        by_status[status]["count"] += 1
        by_status[status]["amount"] += e.get("amount", 0)
    
    return {
        "total_claims": len(expenses),
        "total_amount": round(total_amount, 2),
        "pending_count": len([e for e in expenses if e.get("status") in ["pending", "submitted", "under_review"]]),
        "pending_amount": round(pending_amount, 2),
        "approved_count": len([e for e in expenses if e.get("status") == "approved"]),
        "approved_amount": round(approved_amount, 2),
        "paid_count": len([e for e in expenses if e.get("status") == "paid"]),
        "paid_amount": round(paid_amount, 2),
        "rejected_count": len([e for e in expenses if e.get("status") == "rejected"]),
        "by_category": by_category,
        "by_status": by_status
    }

@api_router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@api_router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    elif data.get("status") == "paid":
        data["reimbursement_date"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.expenses.update_one({"id": expense_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return expense

@api_router.put("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Approve an expense claim"""
    update_data = {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.get("notes"):
        update_data["notes"] = data["notes"]
    
    result = await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await db.expenses.find_one({"id": expense_id}, {"_id": 0})

@api_router.put("/expenses/{expense_id}/reject")
async def reject_expense(expense_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject an expense claim"""
    update_data = {
        "status": "rejected",
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await db.expenses.find_one({"id": expense_id}, {"_id": 0})

@api_router.put("/expenses/{expense_id}/mark-paid")
async def mark_expense_paid(expense_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Mark an expense as paid/reimbursed"""
    update_data = {
        "status": "paid",
        "reimbursement_date": data.get("date", datetime.now(timezone.utc).isoformat()),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.get("notes"):
        update_data["notes"] = data["notes"]
    
    result = await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await db.expenses.find_one({"id": expense_id}, {"_id": 0})

@api_router.get("/expenses/export")
async def export_expenses(
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export expenses to CSV"""
    query = {}
    if status:
        query["status"] = status
    if date_from:
        query["expense_date"] = {"$gte": date_from}
    if date_to:
        if "expense_date" in query:
            query["expense_date"]["$lte"] = date_to
        else:
            query["expense_date"] = {"$lte": date_to}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("expense_date", -1).to_list(1000)
    employees = {e["id"]: e for e in await db.employees.find({}, {"_id": 0}).to_list(1000)}
    
    csv_lines = ["ID,Employee,Title,Category,Amount,Currency,Expense Date,Status,Submitted Date"]
    for exp in expenses:
        emp = employees.get(exp.get("employee_id"), {})
        emp_name = emp.get("full_name", "Unknown")
        csv_lines.append(
            f'{exp.get("id","")},{emp_name},{exp.get("title","")},{exp.get("category","")},{exp.get("amount",0)},{exp.get("currency","USD")},{exp.get("expense_date","")},{exp.get("status","")},{exp.get("created_at","")[:10]}'
        )
    
    return {"csv": "\n".join(csv_lines), "count": len(expenses)}

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

# ============= TRAINING ROUTES =============

@api_router.post("/training-requests")
async def create_training_request(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # Set employee_id from current user if not provided
    if "employee_id" not in data:
        employee = await db.employees.find_one({
            "$or": [
                {"email": current_user.email},
                {"work_email": current_user.email},
                {"personal_email": current_user.email}
            ]
        }, {"_id": 0})
        if employee:
            data["employee_id"] = employee["id"]
    
    training = TrainingRequest(**data)
    await db.training_requests.insert_one(training.model_dump())
    
    # Check for training workflow and create instance if exists
    workflow = await db.workflows.find_one({"module": "training", "is_active": True}, {"_id": 0})
    if workflow and data.get("status") == "submitted":
        workflow_data = {
            "workflow_id": workflow["id"],
            "workflow_name": workflow["name"],
            "module": "training",
            "reference_id": training.id,
            "initiated_by": current_user.id,
            "status": "pending",
            "current_step": 0,
            "step_history": []
        }
        instance = WorkflowInstance(**workflow_data)
        await db.workflow_instances.insert_one(instance.model_dump())
        await db.training_requests.update_one(
            {"id": training.id}, 
            {"$set": {"workflow_instance_id": instance.id, "status": "under_review"}}
        )
    
    return await db.training_requests.find_one({"id": training.id}, {"_id": 0})

@api_router.get("/training-requests")
async def get_training_requests(
    employee_id: Optional[str] = None, 
    status: Optional[str] = None, 
    training_type: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if training_type:
        query["training_type"] = training_type
    if category:
        query["category"] = category
    requests = await db.training_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests

@api_router.get("/training-requests/my")
async def get_my_training_requests(current_user: User = Depends(get_current_user)):
    """Get current user's training requests"""
    employee = await db.employees.find_one({
        "$or": [
            {"email": current_user.email},
            {"work_email": current_user.email},
            {"personal_email": current_user.email}
        ]
    }, {"_id": 0})
    if not employee:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    requests = await db.training_requests.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests

@api_router.get("/training-requests/stats")
async def get_training_stats(current_user: User = Depends(get_current_user)):
    """Get training request statistics"""
    requests = await db.training_requests.find({}, {"_id": 0}).to_list(1000)
    
    total_cost = sum(r.get("cost", 0) for r in requests)
    approved_cost = sum(r.get("cost", 0) for r in requests if r.get("status") == "approved")
    pending_cost = sum(r.get("cost", 0) for r in requests if r.get("status") in ["pending", "submitted", "under_review"])
    
    # By type
    by_type = {}
    for r in requests:
        t = r.get("training_type", "other")
        if t not in by_type:
            by_type[t] = {"count": 0, "cost": 0}
        by_type[t]["count"] += 1
        by_type[t]["cost"] += r.get("cost", 0)
    
    # By status
    by_status = {}
    for r in requests:
        s = r.get("status", "pending")
        if s not in by_status:
            by_status[s] = {"count": 0, "cost": 0}
        by_status[s]["count"] += 1
        by_status[s]["cost"] += r.get("cost", 0)
    
    # By category
    by_category = {}
    for r in requests:
        c = r.get("category", "other")
        if c not in by_category:
            by_category[c] = {"count": 0, "cost": 0}
        by_category[c]["count"] += 1
        by_category[c]["cost"] += r.get("cost", 0)
    
    return {
        "total_requests": len(requests),
        "total_cost": round(total_cost, 2),
        "pending_count": len([r for r in requests if r.get("status") in ["pending", "submitted", "under_review"]]),
        "pending_cost": round(pending_cost, 2),
        "approved_count": len([r for r in requests if r.get("status") == "approved"]),
        "approved_cost": round(approved_cost, 2),
        "in_progress_count": len([r for r in requests if r.get("status") == "in_progress"]),
        "completed_count": len([r for r in requests if r.get("status") == "completed"]),
        "rejected_count": len([r for r in requests if r.get("status") == "rejected"]),
        "by_type": by_type,
        "by_status": by_status,
        "by_category": by_category
    }

@api_router.get("/training-requests/{request_id}")
async def get_training_request(request_id: str, current_user: User = Depends(get_current_user)):
    request = await db.training_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Training request not found")
    return request

@api_router.put("/training-requests/{request_id}")
async def update_training_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    elif data.get("status") == "completed":
        data["completion_date"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.training_requests.update_one({"id": request_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return await db.training_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/training-requests/{request_id}/approve")
async def approve_training_request(request_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Approve a training request"""
    update_data = {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.get("notes"):
        update_data["notes"] = data["notes"]
    
    result = await db.training_requests.update_one({"id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return await db.training_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/training-requests/{request_id}/reject")
async def reject_training_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject a training request"""
    update_data = {
        "status": "rejected",
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.training_requests.update_one({"id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return await db.training_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/training-requests/{request_id}/start")
async def start_training(request_id: str, current_user: User = Depends(get_current_user)):
    """Mark training as in progress"""
    update_data = {
        "status": "in_progress",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.training_requests.update_one({"id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return await db.training_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/training-requests/{request_id}/complete")
async def complete_training(request_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Mark training as completed"""
    update_data = {
        "status": "completed",
        "completion_date": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.get("certificate_url"):
        update_data["completion_certificate_url"] = data["certificate_url"]
    if data.get("feedback"):
        update_data["feedback"] = data["feedback"]
    if data.get("rating"):
        update_data["feedback_rating"] = data["rating"]
    
    result = await db.training_requests.update_one({"id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return await db.training_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.get("/training-requests/export")
async def export_training_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export training requests to CSV"""
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.training_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    employees = {e["id"]: e for e in await db.employees.find({}, {"_id": 0}).to_list(1000)}
    
    csv_lines = ["ID,Employee,Title,Type,Category,Provider,Cost,Currency,Start Date,End Date,Status"]
    for req in requests:
        emp = employees.get(req.get("employee_id"), {})
        emp_name = emp.get("full_name", "Unknown")
        csv_lines.append(
            f'{req.get("id","")},{emp_name},{req.get("title","")},{req.get("training_type","")},{req.get("category","")},{req.get("provider","")},{req.get("cost",0)},{req.get("currency","USD")},{req.get("start_date","")},{req.get("end_date","")},{req.get("status","")}'
        )
    
    return {"csv": "\n".join(csv_lines), "count": len(requests)}

@api_router.delete("/training-requests/{request_id}")
async def delete_training_request(request_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_requests.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Training request not found")
    return {"message": "Training request deleted"}

# ============= TRAINING TYPES & CATEGORIES =============

@api_router.get("/training-types")
async def get_training_types(current_user: User = Depends(get_current_user)):
    types = await db.training_types.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return types

@api_router.post("/training-types")
async def create_training_type(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    training_type = TrainingType(**data)
    await db.training_types.insert_one(training_type.model_dump())
    return training_type.model_dump()

@api_router.put("/training-types/{type_id}")
async def update_training_type(type_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    result = await db.training_types.update_one({"id": type_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training type not found")
    return await db.training_types.find_one({"id": type_id}, {"_id": 0})

@api_router.delete("/training-types/{type_id}")
async def delete_training_type(type_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_types.delete_one({"id": type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Training type not found")
    return {"message": "Training type deleted"}

@api_router.get("/training-categories")
async def get_training_categories(current_user: User = Depends(get_current_user)):
    categories = await db.training_categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.post("/training-categories")
async def create_training_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    category = TrainingCategory(**data)
    await db.training_categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/training-categories/{category_id}")
async def update_training_category(category_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    result = await db.training_categories.update_one({"id": category_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Training category not found")
    return await db.training_categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/training-categories/{category_id}")
async def delete_training_category(category_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Training category not found")
    return {"message": "Training category deleted"}

# ============= TRAINING COURSES =============

@api_router.get("/training-courses")
async def get_training_courses(
    type_id: Optional[str] = None,
    category_id: Optional[str] = None,
    is_published: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if type_id:
        query["type_id"] = type_id
    if category_id:
        query["category_id"] = category_id
    if is_published is not None:
        query["is_published"] = is_published
    courses = await db.training_courses.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return courses

@api_router.get("/training-courses/stats")
async def get_training_courses_stats(current_user: User = Depends(get_current_user)):
    courses = await db.training_courses.find({}, {"_id": 0}).to_list(1000)
    assignments = await db.training_assignments.find({}, {"_id": 0}).to_list(1000)
    
    return {
        "total_courses": len(courses),
        "published_courses": len([c for c in courses if c.get("is_published")]),
        "draft_courses": len([c for c in courses if not c.get("is_published")]),
        "total_assignments": len(assignments),
        "completed_assignments": len([a for a in assignments if a.get("status") == "completed"]),
        "in_progress_assignments": len([a for a in assignments if a.get("status") == "in_progress"]),
        "total_views": sum(c.get("view_count", 0) for c in courses),
        "total_completions": sum(c.get("completion_count", 0) for c in courses)
    }

@api_router.get("/training-courses/{course_id}")
async def get_training_course(course_id: str, current_user: User = Depends(get_current_user)):
    course = await db.training_courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    # Increment view count
    await db.training_courses.update_one({"id": course_id}, {"$inc": {"view_count": 1}})
    return course

@api_router.post("/training-courses")
async def create_training_course(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["created_by"] = current_user.id
    course = TrainingCourse(**data)
    await db.training_courses.insert_one(course.model_dump())
    return course.model_dump()

@api_router.put("/training-courses/{course_id}")
async def update_training_course(course_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.training_courses.update_one({"id": course_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return await db.training_courses.find_one({"id": course_id}, {"_id": 0})

@api_router.put("/training-courses/{course_id}/publish")
async def publish_training_course(course_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_courses.update_one(
        {"id": course_id}, 
        {"$set": {"is_published": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return await db.training_courses.find_one({"id": course_id}, {"_id": 0})

@api_router.put("/training-courses/{course_id}/unpublish")
async def unpublish_training_course(course_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_courses.update_one(
        {"id": course_id}, 
        {"$set": {"is_published": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return await db.training_courses.find_one({"id": course_id}, {"_id": 0})

@api_router.delete("/training-courses/{course_id}")
async def delete_training_course(course_id: str, current_user: User = Depends(get_current_user)):
    # Delete associated assignments
    await db.training_assignments.delete_many({"course_id": course_id})
    result = await db.training_courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted"}

# ============= TRAINING ASSIGNMENTS =============

@api_router.get("/training-assignments")
async def get_training_assignments(
    course_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if course_id:
        query["course_id"] = course_id
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    assignments = await db.training_assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return assignments

@api_router.get("/training-assignments/my")
async def get_my_training_assignments(current_user: User = Depends(get_current_user)):
    """Get current user's assigned training courses"""
    employee = await db.employees.find_one({
        "$or": [
            {"email": current_user.email},
            {"work_email": current_user.email},
            {"personal_email": current_user.email}
        ]
    }, {"_id": 0})
    if not employee:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    
    assignments = await db.training_assignments.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with course details
    courses = {c["id"]: c for c in await db.training_courses.find({}, {"_id": 0}).to_list(1000)}
    for assignment in assignments:
        course = courses.get(assignment.get("course_id"), {})
        assignment["course"] = course
    
    return assignments

@api_router.post("/training-assignments")
async def create_training_assignment(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["assigned_by"] = current_user.id
    assignment = TrainingAssignment(**data)
    await db.training_assignments.insert_one(assignment.model_dump())
    return assignment.model_dump()

@api_router.post("/training-assignments/bulk")
async def bulk_assign_training(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Assign a course to multiple employees"""
    course_id = data.get("course_id")
    employee_ids = data.get("employee_ids", [])
    due_date = data.get("due_date")
    
    created = []
    for emp_id in employee_ids:
        # Check if already assigned
        existing = await db.training_assignments.find_one({"course_id": course_id, "employee_id": emp_id})
        if not existing:
            assignment = TrainingAssignment(
                course_id=course_id,
                employee_id=emp_id,
                assigned_by=current_user.id,
                due_date=due_date
            )
            await db.training_assignments.insert_one(assignment.model_dump())
            created.append(assignment.model_dump())
    
    return {"created": len(created), "assignments": created}

@api_router.put("/training-assignments/{assignment_id}")
async def update_training_assignment(assignment_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.training_assignments.update_one({"id": assignment_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})

@api_router.put("/training-assignments/{assignment_id}/start")
async def start_training_assignment(assignment_id: str, current_user: User = Depends(get_current_user)):
    """Mark training as started"""
    update_data = {
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_accessed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.training_assignments.update_one({"id": assignment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})

@api_router.put("/training-assignments/{assignment_id}/progress")
async def update_training_progress(assignment_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update progress on a training assignment"""
    update_data = {
        "progress": data.get("progress", 0),
        "time_spent_minutes": data.get("time_spent_minutes", 0),
        "last_accessed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if update_data["progress"] >= 100:
        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        # Increment course completion count
        assignment = await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})
        if assignment:
            await db.training_courses.update_one(
                {"id": assignment["course_id"]}, 
                {"$inc": {"completion_count": 1}}
            )
    
    result = await db.training_assignments.update_one({"id": assignment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})

@api_router.put("/training-assignments/{assignment_id}/complete")
async def complete_training_assignment(assignment_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Mark training as completed"""
    update_data = {
        "status": "completed",
        "progress": 100,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.get("feedback"):
        update_data["feedback"] = data["feedback"]
    if data.get("rating"):
        update_data["rating"] = data["rating"]
    
    # Get assignment to update course stats
    assignment = await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})
    if assignment and assignment.get("status") != "completed":
        await db.training_courses.update_one(
            {"id": assignment["course_id"]}, 
            {"$inc": {"completion_count": 1}}
        )
        # Update course average rating if rating provided
        if data.get("rating"):
            course = await db.training_courses.find_one({"id": assignment["course_id"]}, {"_id": 0})
            if course:
                completions = course.get("completion_count", 0) + 1
                current_avg = course.get("avg_rating", 0)
                new_avg = ((current_avg * (completions - 1)) + data["rating"]) / completions
                await db.training_courses.update_one(
                    {"id": assignment["course_id"]}, 
                    {"$set": {"avg_rating": round(new_avg, 1)}}
                )
    
    result = await db.training_assignments.update_one({"id": assignment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return await db.training_assignments.find_one({"id": assignment_id}, {"_id": 0})

@api_router.delete("/training-assignments/{assignment_id}")
async def delete_training_assignment(assignment_id: str, current_user: User = Depends(get_current_user)):
    result = await db.training_assignments.delete_one({"id": assignment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Assignment deleted"}

# ============= DOCUMENT APPROVAL ROUTES =============

@api_router.post("/documents/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document file and return the URL"""
    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.png', '.jpg', '.jpeg', '.gif', '.csv'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}_{file.filename.replace(' ', '_')}"
    file_path = UPLOADS_DIR / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Return the URL
    file_url = f"/uploads/documents/{safe_filename}"
    
    return {
        "file_url": file_url,
        "file_name": file.filename,
        "file_size": len(content),
        "content_type": file.content_type
    }

@api_router.post("/document-approvals")
async def create_document_approval(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new document approval request"""
    # Get employee ID from current user - try multiple methods
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        # Fallback: try to find employee by work_email or personal_email
        employee = await db.employees.find_one({"work_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"personal_email": current_user.email})
    
    # Use employee ID if found, otherwise use current user ID
    if employee:
        data["employee_id"] = employee["id"]
    else:
        data["employee_id"] = current_user.id
    
    data["status"] = data.get("status", "submitted")
    doc = DocumentApproval(**data)
    await db.document_approvals.insert_one(doc.model_dump())
    return doc.model_dump()

@api_router.get("/document-approvals")
async def get_document_approvals(
    employee_id: Optional[str] = None, 
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all document approvals (admin) with optional filters"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if document_type:
        query["document_type"] = document_type
    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority
    docs = await db.document_approvals.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.get("/document-approvals/my")
async def get_my_document_approvals(current_user: User = Depends(get_current_user)):
    """Get current user's document approval requests"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        # Fallback: try to find employee by email
        employee = await db.employees.find_one({"email": current_user.email})
    
    # Search by employee ID if found, otherwise by user ID
    if employee:
        docs = await db.document_approvals.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    else:
        docs = await db.document_approvals.find({"employee_id": current_user.id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.get("/document-approvals/stats")
async def get_document_approval_stats(current_user: User = Depends(get_current_user)):
    """Get document approval statistics"""
    docs = await db.document_approvals.find({}, {"_id": 0}).to_list(1000)
    
    total = len(docs)
    pending = len([d for d in docs if d.get("status") in ["submitted", "under_review"]])
    approved = len([d for d in docs if d.get("status") == "approved"])
    rejected = len([d for d in docs if d.get("status") == "rejected"])
    revision_requested = len([d for d in docs if d.get("status") == "revision_requested"])
    
    # Count by type
    by_type = {}
    for doc in docs:
        doc_type = doc.get("document_type", "other")
        by_type[doc_type] = by_type.get(doc_type, 0) + 1
    
    # Count by category
    by_category = {}
    for doc in docs:
        cat = doc.get("category", "general")
        by_category[cat] = by_category.get(cat, 0) + 1
    
    # Urgent/high priority pending
    urgent_pending = len([d for d in docs if d.get("status") in ["submitted", "under_review"] and d.get("priority") in ["high", "urgent"]])
    
    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "revision_requested": revision_requested,
        "urgent_pending": urgent_pending,
        "by_type": by_type,
        "by_category": by_category
    }

@api_router.get("/document-approvals/assigned")
async def get_assigned_documents(current_user: User = Depends(get_current_user)):
    """Get documents assigned to current employee for acknowledgment"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        # Try to find by personal_email or work_email
        employee = await db.employees.find_one({"personal_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if employee:
        docs = await db.document_approvals.find(
            {"employee_id": employee["id"], "is_assigned": True}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
    else:
        docs = await db.document_approvals.find(
            {"employee_id": current_user.id, "is_assigned": True}, 
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
    return docs

@api_router.get("/document-approvals/{doc_id}")
async def get_document_approval(doc_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific document approval"""
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@api_router.put("/document-approvals/{doc_id}")
async def update_document_approval(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a document approval"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    await db.document_approvals.update_one({"id": doc_id}, {"$set": data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

@api_router.put("/document-approvals/{doc_id}/review")
async def start_review_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Mark document as under review"""
    update_data = {
        "status": "under_review",
        "reviewer_id": current_user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

@api_router.put("/document-approvals/{doc_id}/approve")
async def approve_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Approve a document"""
    update_data = {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

@api_router.put("/document-approvals/{doc_id}/reject")
async def reject_document(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject a document"""
    update_data = {
        "status": "rejected",
        "rejection_reason": data.get("rejection_reason", ""),
        "approved_by": current_user.id,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

@api_router.put("/document-approvals/{doc_id}/request-revision")
async def request_revision_document(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Request revision on a document"""
    update_data = {
        "status": "revision_requested",
        "revision_notes": data.get("revision_notes", ""),
        "reviewer_id": current_user.id,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return doc

@api_router.put("/document-approvals/{doc_id}/resubmit")
async def resubmit_document(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Resubmit a document after revision"""
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = {
        "status": "submitted",
        "version": doc.get("version", 1) + 1,
        "revision_notes": None,
        "rejection_reason": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    # Allow updating document URL and description on resubmit
    if data.get("document_url"):
        update_data["document_url"] = data["document_url"]
    if data.get("description"):
        update_data["description"] = data["description"]
    
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    updated_doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return updated_doc

@api_router.post("/document-approvals/{doc_id}/comment")
async def add_document_comment(doc_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a comment to a document"""
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "text": data.get("text", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    comments = doc.get("comments") or []
    comments.append(comment)
    
    await db.document_approvals.update_one({"id": doc_id}, {"$set": {"comments": comments, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated_doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return updated_doc

@api_router.delete("/document-approvals/{doc_id}")
async def delete_document_approval(doc_id: str, current_user: User = Depends(get_current_user)):
    """Delete a document approval request"""
    doc = await db.document_approvals.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only allow deletion of own documents or by admin
    employee = await db.employees.find_one({"user_id": current_user.id})
    if current_user.role not in ["super_admin", "corp_admin"]:
        if not employee or doc.get("employee_id") != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        # Employees can only delete draft or rejected documents
        if doc.get("status") not in ["draft", "rejected", "revision_requested"]:
            raise HTTPException(status_code=400, detail="Cannot delete document in current status")
    
    await db.document_approvals.delete_one({"id": doc_id})
    return {"message": "Document deleted successfully"}

@api_router.post("/document-approvals/assign")
async def assign_document_to_employees(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Admin assigns a document to employees for acknowledgment"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign documents")
    
    employee_ids = data.get("employee_ids", [])
    if not employee_ids:
        raise HTTPException(status_code=400, detail="No employees selected")
    
    created_docs = []
    for emp_id in employee_ids:
        doc_data = {
            "employee_id": emp_id,
            "title": data.get("title"),
            "description": data.get("description"),
            "document_type": data.get("document_type", "policy"),
            "category": data.get("category", "general"),
            "document_url": data.get("document_url"),
            "priority": data.get("priority", "normal"),
            "due_date": data.get("due_date"),
            "tags": data.get("tags"),
            "status": "pending_acknowledgment",
            "is_assigned": True,
            "assigned_by": current_user.id,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "acknowledgment_required": True,
            "acknowledged": False
        }
        doc = DocumentApproval(**doc_data)
        await db.document_approvals.insert_one(doc.model_dump())
        created_docs.append(doc.model_dump())
    
    return {"message": f"Document assigned to {len(employee_ids)} employee(s)", "documents": created_docs}

@api_router.put("/document-approvals/{doc_id}/acknowledge")
async def acknowledge_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Employee acknowledges an assigned document"""
    doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not doc.get("is_assigned"):
        raise HTTPException(status_code=400, detail="This document does not require acknowledgment")
    
    update_data = {
        "acknowledged": True,
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        "status": "acknowledged",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.document_approvals.update_one({"id": doc_id}, {"$set": update_data})
    updated_doc = await db.document_approvals.find_one({"id": doc_id}, {"_id": 0})
    return updated_doc

# ============= DOCUMENT TYPES ROUTES =============

@api_router.get("/document-types")
async def get_document_types(current_user: User = Depends(get_current_user)):
    """Get all document types"""
    types = await db.document_types.find({}, {"_id": 0}).to_list(1000)
    return types

@api_router.post("/document-types")
async def create_document_type(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new document type"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create document types")
    doc_type = DocumentType(**data)
    await db.document_types.insert_one(doc_type.model_dump())
    return doc_type.model_dump()

@api_router.put("/document-types/{type_id}")
async def update_document_type(type_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a document type"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update document types")
    await db.document_types.update_one({"id": type_id}, {"$set": data})
    doc_type = await db.document_types.find_one({"id": type_id}, {"_id": 0})
    return doc_type

@api_router.delete("/document-types/{type_id}")
async def delete_document_type(type_id: str, current_user: User = Depends(get_current_user)):
    """Delete a document type"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete document types")
    await db.document_types.delete_one({"id": type_id})
    return {"message": "Document type deleted"}

# ============= DOCUMENT CATEGORIES ROUTES =============

@api_router.get("/document-categories")
async def get_document_categories(current_user: User = Depends(get_current_user)):
    """Get all document categories"""
    categories = await db.document_categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/document-categories")
async def create_document_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new document category"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create document categories")
    category = DocumentCategory(**data)
    await db.document_categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/document-categories/{category_id}")
async def update_document_category(category_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a document category"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update document categories")
    await db.document_categories.update_one({"id": category_id}, {"$set": data})
    category = await db.document_categories.find_one({"id": category_id}, {"_id": 0})
    return category

@api_router.delete("/document-categories/{category_id}")
async def delete_document_category(category_id: str, current_user: User = Depends(get_current_user)):
    """Delete a document category"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete document categories")
    await db.document_categories.delete_one({"id": category_id})
    return {"message": "Document category deleted"}

# ============= DOCUMENT TEMPLATES ROUTES =============

@api_router.get("/document-templates")
async def get_document_templates(current_user: User = Depends(get_current_user)):
    """Get all document templates"""
    templates = await db.document_templates.find({}, {"_id": 0}).to_list(1000)
    return templates

@api_router.get("/document-templates/active")
async def get_active_document_templates(current_user: User = Depends(get_current_user)):
    """Get active document templates for employees"""
    templates = await db.document_templates.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return templates

@api_router.post("/document-templates")
async def create_document_template(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new document template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create document templates")
    data["created_by"] = current_user.id
    template = DocumentTemplate(**data)
    await db.document_templates.insert_one(template.model_dump())
    return template.model_dump()

@api_router.get("/document-templates/{template_id}")
async def get_document_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific document template"""
    template = await db.document_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.put("/document-templates/{template_id}")
async def update_document_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a document template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update document templates")
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.document_templates.update_one({"id": template_id}, {"$set": data})
    template = await db.document_templates.find_one({"id": template_id}, {"_id": 0})
    return template

@api_router.delete("/document-templates/{template_id}")
async def delete_document_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Delete a document template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete document templates")
    await db.document_templates.delete_one({"id": template_id})
    return {"message": "Document template deleted"}

@api_router.post("/document-templates/{template_id}/use")
async def use_document_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a document from a template"""
    template = await db.document_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get employee ID
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"personal_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    employee_id = employee["id"] if employee else current_user.id
    
    # Create document from template
    doc_data = {
        "employee_id": employee_id,
        "title": data.get("title", template.get("name")),
        "description": data.get("description", template.get("description")),
        "document_type": template.get("document_type_id", "other"),
        "category": template.get("category_id", "general"),
        "document_url": data.get("document_url", template.get("document_url")),
        "priority": template.get("default_priority", "normal"),
        "template_id": template_id,
        "status": "submitted"
    }
    
    doc = DocumentApproval(**doc_data)
    await db.document_approvals.insert_one(doc.model_dump())
    return doc.model_dump()

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

# ============= OFFBOARDING ENDPOINTS =============

@api_router.get("/offboarding-templates")
async def get_offboarding_templates(department_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if department_id:
        query["department_id"] = department_id
    templates = await db.offboarding_templates.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return templates

@api_router.get("/offboarding-templates/{template_id}")
async def get_offboarding_template(template_id: str, current_user: User = Depends(get_current_user)):
    template = await db.offboarding_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.post("/offboarding-templates")
async def create_offboarding_template(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    template = OffboardingTemplate(**data)
    await db.offboarding_templates.insert_one(template.model_dump())
    return template.model_dump()

@api_router.put("/offboarding-templates/{template_id}")
async def update_offboarding_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.offboarding_templates.update_one({"id": template_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return await db.offboarding_templates.find_one({"id": template_id}, {"_id": 0})

@api_router.delete("/offboarding-templates/{template_id}")
async def delete_offboarding_template(template_id: str, current_user: User = Depends(get_current_user)):
    result = await db.offboarding_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@api_router.get("/offboardings")
async def get_offboardings(status: Optional[str] = None, employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    offboardings = await db.offboardings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return offboardings

@api_router.get("/offboardings/my")
async def get_my_offboarding(current_user: User = Depends(get_current_user)):
    """Get the current user's offboarding (for employees)"""
    employee = await db.employees.find_one({
        "$or": [
            {"email": current_user.email},
            {"work_email": current_user.email},
            {"personal_email": current_user.email}
        ]
    }, {"_id": 0})
    if not employee:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return None
    offboarding = await db.offboardings.find_one(
        {"employee_id": employee["id"], "status": {"$in": ["in_progress", "not_started", "on_hold"]}},
        {"_id": 0}
    )
    return offboarding

@api_router.get("/offboardings/stats")
async def get_offboarding_stats(current_user: User = Depends(get_current_user)):
    """Get offboarding statistics"""
    offboardings = await db.offboardings.find({}, {"_id": 0}).to_list(1000)
    
    total_tasks = 0
    completed_tasks = 0
    overdue_tasks = 0
    
    for ob in offboardings:
        tasks = ob.get("tasks", [])
        total_tasks += len(tasks)
        completed_tasks += len([t for t in tasks if t.get("completed")])
        
        # Check overdue
        if ob.get("last_working_date"):
            last_date = datetime.fromisoformat(ob["last_working_date"].replace('Z', '+00:00'))
            for task in tasks:
                if not task.get("completed"):
                    due_day = task.get("due_day", 1)
                    task_due = last_date - timedelta(days=ob.get("duration_days", 14) - due_day)
                    if task_due < datetime.now(timezone.utc):
                        overdue_tasks += 1
    
    return {
        "total": len(offboardings),
        "in_progress": len([o for o in offboardings if o.get("status") == "in_progress"]),
        "completed": len([o for o in offboardings if o.get("status") == "completed"]),
        "on_hold": len([o for o in offboardings if o.get("status") == "on_hold"]),
        "not_started": len([o for o in offboardings if o.get("status") == "not_started"]),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "avg_completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
    }

@api_router.get("/offboardings/{offboarding_id}")
async def get_offboarding(offboarding_id: str, current_user: User = Depends(get_current_user)):
    offboarding = await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})
    if not offboarding:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return offboarding

@api_router.post("/offboardings")
async def create_offboarding(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # If template_id provided, copy tasks from template
    template_id = data.get("template_id")
    if template_id:
        template = await db.offboarding_templates.find_one({"id": template_id}, {"_id": 0})
        if template:
            data["template_name"] = template.get("name")
            data["duration_days"] = template.get("duration_days", 14)
            data["exit_message"] = template.get("exit_message")
            # Copy tasks with completion tracking
            template_tasks = template.get("tasks", [])
            data["tasks"] = [
                {**task, "completed": False, "completed_at": None, "completed_by": None, "completion_notes": None}
                for task in template_tasks
            ]
    
    offboarding = Offboarding(**data)
    await db.offboardings.insert_one(offboarding.model_dump())
    return offboarding.model_dump()

@api_router.put("/offboardings/{offboarding_id}")
async def update_offboarding(offboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle status change to completed
    if data.get("status") == "completed" and "completed_at" not in data:
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.offboardings.update_one({"id": offboarding_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})

@api_router.put("/offboardings/{offboarding_id}/tasks/{task_index}")
async def update_offboarding_task(offboarding_id: str, task_index: int, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    offboarding = await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})
    if not offboarding:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    
    tasks = offboarding.get("tasks", [])
    if task_index < 0 or task_index >= len(tasks):
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    tasks[task_index]["completed"] = data.get("completed", tasks[task_index].get("completed", False))
    if tasks[task_index]["completed"]:
        tasks[task_index]["completed_at"] = datetime.now(timezone.utc).isoformat()
        tasks[task_index]["completed_by"] = current_user.id
        if data.get("completion_notes"):
            tasks[task_index]["completion_notes"] = data["completion_notes"]
    else:
        tasks[task_index]["completed_at"] = None
        tasks[task_index]["completed_by"] = None
    
    update_data = {"tasks": tasks, "updated_at": datetime.now(timezone.utc).isoformat()}
    
    # Check if all tasks completed to auto-complete offboarding
    all_completed = all(t.get("completed", False) for t in tasks)
    if all_completed and offboarding.get("status") == "in_progress":
        update_data["status"] = "completed"
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.offboardings.update_one({"id": offboarding_id}, {"$set": update_data})
    return await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})

@api_router.put("/offboardings/{offboarding_id}/clearance")
async def update_offboarding_clearance(offboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update clearance status for offboarding"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    for field in ["clearance_hr", "clearance_it", "clearance_finance", "clearance_manager", "clearance_admin"]:
        if field in data:
            update_data[field] = data[field]
    
    result = await db.offboardings.update_one({"id": offboarding_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})

@api_router.put("/offboardings/{offboarding_id}/exit-interview")
async def update_exit_interview(offboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update exit interview details"""
    update_data = {
        "exit_interview_conducted": data.get("conducted", False),
        "exit_interview_date": data.get("date"),
        "exit_interview_notes": data.get("notes"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.offboardings.update_one({"id": offboarding_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})

@api_router.post("/offboardings/{offboarding_id}/feedback")
async def submit_offboarding_feedback(offboarding_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Submit feedback for offboarding (exit survey)"""
    result = await db.offboardings.update_one(
        {"id": offboarding_id},
        {"$set": {
            "feedback": data.get("feedback"),
            "feedback_rating": data.get("rating"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return await db.offboardings.find_one({"id": offboarding_id}, {"_id": 0})

@api_router.delete("/offboardings/{offboarding_id}")
async def delete_offboarding(offboarding_id: str, current_user: User = Depends(get_current_user)):
    result = await db.offboardings.delete_one({"id": offboarding_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offboarding not found")
    return {"message": "Offboarding deleted"}

# ============= APPRAISAL CYCLES =============

@api_router.get("/appraisal-cycles")
async def get_appraisal_cycles(current_user: User = Depends(get_current_user)):
    """Get all appraisal cycles"""
    cycles = await db.appraisal_cycles.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return cycles

@api_router.get("/appraisal-cycles/{cycle_id}")
async def get_appraisal_cycle(cycle_id: str, current_user: User = Depends(get_current_user)):
    """Get a single appraisal cycle"""
    cycle = await db.appraisal_cycles.find_one({"id": cycle_id}, {"_id": 0})
    if not cycle:
        raise HTTPException(status_code=404, detail="Appraisal cycle not found")
    return cycle

@api_router.post("/appraisal-cycles")
async def create_appraisal_cycle(cycle: AppraisalCycle, current_user: User = Depends(get_current_user)):
    """Create a new appraisal cycle"""
    cycle_dict = cycle.model_dump()
    cycle_dict["created_by"] = current_user.id
    
    # Default questions if none provided
    if not cycle_dict["questions"]:
        cycle_dict["questions"] = [
            {"id": str(uuid.uuid4()), "question": "How well did you achieve your goals for this period?", "type": "rating", "required": True},
            {"id": str(uuid.uuid4()), "question": "Rate your communication skills", "type": "rating", "required": True},
            {"id": str(uuid.uuid4()), "question": "Rate your teamwork and collaboration", "type": "rating", "required": True},
            {"id": str(uuid.uuid4()), "question": "Rate your problem-solving abilities", "type": "rating", "required": True},
            {"id": str(uuid.uuid4()), "question": "Rate your technical/job-specific skills", "type": "rating", "required": True},
            {"id": str(uuid.uuid4()), "question": "Describe your key achievements this period", "type": "text", "required": True},
            {"id": str(uuid.uuid4()), "question": "What challenges did you face and how did you overcome them?", "type": "text", "required": False},
            {"id": str(uuid.uuid4()), "question": "What are your goals for the next period?", "type": "text", "required": True},
        ]
    
    await db.appraisal_cycles.insert_one(cycle_dict)
    return {k: v for k, v in cycle_dict.items() if k != "_id"}

@api_router.put("/appraisal-cycles/{cycle_id}")
async def update_appraisal_cycle(cycle_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an appraisal cycle"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.appraisal_cycles.update_one({"id": cycle_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appraisal cycle not found")
    return await db.appraisal_cycles.find_one({"id": cycle_id}, {"_id": 0})

@api_router.delete("/appraisal-cycles/{cycle_id}")
async def delete_appraisal_cycle(cycle_id: str, current_user: User = Depends(get_current_user)):
    """Delete an appraisal cycle and its appraisals"""
    result = await db.appraisal_cycles.delete_one({"id": cycle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appraisal cycle not found")
    # Also delete all appraisals for this cycle
    await db.appraisals.delete_many({"cycle_id": cycle_id})
    return {"message": "Appraisal cycle deleted"}

@api_router.post("/appraisal-cycles/{cycle_id}/assign")
async def assign_appraisals(cycle_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Assign appraisals to employees for a cycle"""
    employee_ids = data.get("employee_ids", [])
    reviewer_id = data.get("reviewer_id")
    
    cycle = await db.appraisal_cycles.find_one({"id": cycle_id}, {"_id": 0})
    if not cycle:
        raise HTTPException(status_code=404, detail="Appraisal cycle not found")
    
    created_count = 0
    for emp_id in employee_ids:
        # Check if appraisal already exists
        existing = await db.appraisals.find_one({"cycle_id": cycle_id, "employee_id": emp_id})
        if existing:
            continue
        
        # Get employee details
        employee = await db.employees.find_one({"id": emp_id}, {"_id": 0})
        if not employee:
            continue
        
        # Get reviewer details if provided
        reviewer_name = None
        if reviewer_id:
            reviewer = await db.employees.find_one({"id": reviewer_id}, {"_id": 0})
            if reviewer:
                rev_first = reviewer.get('first_name', '')
                rev_last = reviewer.get('last_name', '')
                reviewer_name = f"{rev_first} {rev_last}".strip() or reviewer.get("work_email") or reviewer.get("personal_email") or "Reviewer"
        
        # Build employee name with fallback to email
        emp_first = employee.get('first_name', '')
        emp_last = employee.get('last_name', '')
        emp_name = f"{emp_first} {emp_last}".strip()
        if not emp_name:
            emp_email = employee.get("work_email") or employee.get("personal_email") or ""
            emp_name = emp_email.split("@")[0].replace(".", " ").replace("_", " ").title() if emp_email else "Unknown Employee"
        
        appraisal = Appraisal(
            cycle_id=cycle_id,
            employee_id=emp_id,
            employee_name=emp_name,
            employee_email=employee.get("work_email") or employee.get("personal_email"),
            department=employee.get("department"),
            reviewer_id=reviewer_id,
            reviewer_name=reviewer_name,
            status="pending"
        )
        await db.appraisals.insert_one(appraisal.model_dump())
        created_count += 1
    
    # Update cycle status to active if it was draft
    if cycle.get("status") == "draft":
        await db.appraisal_cycles.update_one({"id": cycle_id}, {"$set": {"status": "active"}})
    
    return {"message": f"Assigned {created_count} appraisals", "created_count": created_count}

# ============= APPRAISALS =============

@api_router.get("/appraisals")
async def get_appraisals(cycle_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get all appraisals (admin) or assigned appraisals (employee)"""
    query = {}
    if cycle_id:
        query["cycle_id"] = cycle_id
    
    # Non-admin users only see their own appraisals
    if current_user.role not in ["super_admin", "corp_admin"]:
        # Find employee by user_id or email
        employee = await db.employees.find_one(
            {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}, {"personal_email": current_user.email}]},
            {"_id": 0}
        )
        if employee:
            query["employee_id"] = employee.get("id")
        else:
            return []
    
    appraisals = await db.appraisals.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with cycle info
    for appraisal in appraisals:
        cycle = await db.appraisal_cycles.find_one({"id": appraisal.get("cycle_id")}, {"_id": 0})
        if cycle:
            appraisal["cycle_name"] = cycle.get("name")
            appraisal["cycle_type"] = cycle.get("cycle_type")
            appraisal["questions"] = cycle.get("questions", [])
            appraisal["rating_scale"] = cycle.get("rating_scale", 5)
    
    return appraisals

@api_router.get("/appraisals/my")
async def get_my_appraisals(current_user: User = Depends(get_current_user)):
    """Get appraisals for the current user"""
    # Find employee by user_id or email
    employee = await db.employees.find_one(
        {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}, {"personal_email": current_user.email}]},
        {"_id": 0}
    )
    
    if not employee:
        return []
    
    appraisals = await db.appraisals.find({"employee_id": employee.get("id")}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with cycle info
    for appraisal in appraisals:
        cycle = await db.appraisal_cycles.find_one({"id": appraisal.get("cycle_id")}, {"_id": 0})
        if cycle:
            appraisal["cycle_name"] = cycle.get("name")
            appraisal["cycle_type"] = cycle.get("cycle_type")
            appraisal["questions"] = cycle.get("questions", [])
            appraisal["rating_scale"] = cycle.get("rating_scale", 5)
    
    return appraisals

@api_router.get("/appraisals/{appraisal_id}")
async def get_appraisal(appraisal_id: str, current_user: User = Depends(get_current_user)):
    """Get a single appraisal with full details"""
    appraisal = await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})
    if not appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    # Get cycle info
    cycle = await db.appraisal_cycles.find_one({"id": appraisal.get("cycle_id")}, {"_id": 0})
    if cycle:
        appraisal["cycle_name"] = cycle.get("name")
        appraisal["cycle_type"] = cycle.get("cycle_type")
        appraisal["questions"] = cycle.get("questions", [])
        appraisal["rating_scale"] = cycle.get("rating_scale", 5)
    
    return appraisal

@api_router.post("/appraisals/{appraisal_id}/self-assessment")
async def submit_self_assessment(appraisal_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Submit self-assessment for an appraisal"""
    appraisal = await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})
    if not appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    update_data = {
        "self_assessment_answers": data.get("answers", []),
        "self_overall_rating": data.get("overall_rating"),
        "self_achievements": data.get("achievements"),
        "self_challenges": data.get("challenges"),
        "self_goals": data.get("goals"),
        "self_submitted_at": datetime.now(timezone.utc).isoformat(),
        "status": "manager_review",  # Move to manager review after self-assessment
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appraisals.update_one({"id": appraisal_id}, {"$set": update_data})
    return await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})

@api_router.post("/appraisals/{appraisal_id}/manager-review")
async def submit_manager_review(appraisal_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Submit manager review for an appraisal"""
    appraisal = await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})
    if not appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    # Calculate final rating (average of self and manager, or just manager if no self)
    manager_rating = data.get("overall_rating")
    self_rating = appraisal.get("self_overall_rating")
    final_rating = manager_rating
    if self_rating and manager_rating:
        final_rating = round((float(self_rating) + float(manager_rating)) / 2, 1)
    
    update_data = {
        "manager_answers": data.get("answers", []),
        "manager_overall_rating": manager_rating,
        "manager_feedback": data.get("feedback"),
        "manager_strengths": data.get("strengths"),
        "manager_improvements": data.get("improvements"),
        "manager_recommendations": data.get("recommendations"),
        "manager_submitted_at": datetime.now(timezone.utc).isoformat(),
        "reviewer_id": current_user.id,
        "final_rating": final_rating,
        "final_comments": data.get("final_comments"),
        "status": "completed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Get reviewer name
    employee = await db.employees.find_one(
        {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}]},
        {"_id": 0}
    )
    if employee:
        update_data["reviewer_name"] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
    
    await db.appraisals.update_one({"id": appraisal_id}, {"$set": update_data})
    return await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})

@api_router.post("/appraisals/{appraisal_id}/acknowledge")
async def acknowledge_appraisal(appraisal_id: str, current_user: User = Depends(get_current_user)):
    """Employee acknowledges their completed appraisal"""
    appraisal = await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})
    if not appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    update_data = {
        "acknowledged_by_employee": True,
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.appraisals.update_one({"id": appraisal_id}, {"$set": update_data})
    return await db.appraisals.find_one({"id": appraisal_id}, {"_id": 0})

@api_router.delete("/appraisals/{appraisal_id}")
async def delete_appraisal(appraisal_id: str, current_user: User = Depends(get_current_user)):
    """Delete an appraisal"""
    result = await db.appraisals.delete_one({"id": appraisal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    return {"message": "Appraisal deleted"}

@api_router.get("/appraisals/stats/summary")
async def get_appraisal_stats(current_user: User = Depends(get_current_user)):
    """Get appraisal statistics"""
    total = await db.appraisals.count_documents({})
    pending = await db.appraisals.count_documents({"status": "pending"})
    self_assessment = await db.appraisals.count_documents({"status": "self_assessment"})
    manager_review = await db.appraisals.count_documents({"status": "manager_review"})
    completed = await db.appraisals.count_documents({"status": "completed"})
    
    # Calculate average rating for completed appraisals
    completed_appraisals = await db.appraisals.find({"status": "completed", "final_rating": {"$ne": None}}, {"final_rating": 1}).to_list(1000)
    avg_rating = 0
    if completed_appraisals:
        ratings = [a.get("final_rating", 0) for a in completed_appraisals if a.get("final_rating")]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    
    return {
        "total": total,
        "pending": pending,
        "self_assessment": self_assessment,
        "manager_review": manager_review,
        "completed": completed,
        "average_rating": avg_rating
    }

# ============= ORGANIZATION CHART =============

@api_router.get("/org-chart")
async def get_org_chart(current_user: User = Depends(get_current_user)):
    """Get organization chart data with hierarchy"""
    
    # Fetch all required data
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    divisions = await db.divisions.find({}, {"_id": 0}).to_list(100)
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    corporations = await db.corporations.find({}, {"_id": 0}).to_list(100)
    
    # Create lookup maps
    dept_map = {d.get("id"): d for d in departments}
    div_map = {d.get("id"): d for d in divisions}
    branch_map = {b.get("id"): b for b in branches}
    corp_map = {c.get("id"): c for c in corporations}
    emp_map = {e.get("id"): e for e in employees}
    
    # Build employee nodes with hierarchy info
    def get_employee_name(emp):
        if not emp:
            return "Unknown"
        first = emp.get("first_name") or emp.get("full_name", "").split()[0] if emp.get("full_name") else ""
        last = emp.get("last_name") or ""
        name = f"{first} {last}".strip()
        if not name:
            email = emp.get("work_email") or emp.get("personal_email") or ""
            name = email.split("@")[0].replace(".", " ").replace("_", " ").title() if email else "Unknown"
        return name
    
    def build_employee_node(emp):
        dept = dept_map.get(emp.get("department_id"), {})
        div = div_map.get(emp.get("division_id"), {})
        branch = branch_map.get(emp.get("branch_id"), {})
        manager = emp_map.get(emp.get("reporting_manager_id"))
        
        return {
            "id": emp.get("id"),
            "name": get_employee_name(emp),
            "email": emp.get("work_email") or emp.get("personal_email"),
            "job_title": emp.get("job_title") or "Employee",
            "department": dept.get("name", ""),
            "department_id": emp.get("department_id"),
            "division": div.get("name", ""),
            "division_id": emp.get("division_id"),
            "branch": branch.get("name", ""),
            "branch_id": emp.get("branch_id"),
            "corporation_id": emp.get("corporation_id"),
            "manager_id": emp.get("reporting_manager_id"),
            "manager_name": get_employee_name(manager) if manager else None,
            "profile_picture": emp.get("profile_picture"),
            "status": emp.get("status", "active"),
            "hire_date": emp.get("hire_date"),
        }
    
    # Build nodes list
    nodes = [build_employee_node(emp) for emp in employees if emp.get("status") != "inactive"]
    
    # Calculate direct reports for each employee
    reports_count = {}
    for emp in employees:
        manager_id = emp.get("reporting_manager_id")
        if manager_id:
            reports_count[manager_id] = reports_count.get(manager_id, 0) + 1
    
    for node in nodes:
        node["direct_reports_count"] = reports_count.get(node["id"], 0)
    
    # Build hierarchy tree
    def build_tree(parent_id=None):
        children = []
        for node in nodes:
            if node.get("manager_id") == parent_id:
                child = {**node, "children": build_tree(node["id"])}
                children.append(child)
        return children
    
    # Get root nodes (employees without managers)
    root_nodes = [n for n in nodes if not n.get("manager_id")]
    tree = []
    for root in root_nodes:
        tree.append({**root, "children": build_tree(root["id"])})
    
    return {
        "nodes": nodes,
        "tree": tree,
        "departments": [{"id": d.get("id"), "name": d.get("name")} for d in departments],
        "divisions": [{"id": d.get("id"), "name": d.get("name")} for d in divisions],
        "branches": [{"id": b.get("id"), "name": b.get("name")} for b in branches],
        "corporations": [{"id": c.get("id"), "name": c.get("name")} for c in corporations],
        "stats": {
            "total_employees": len(nodes),
            "departments_count": len(departments),
            "branches_count": len(branches),
        }
    }

@api_router.get("/org-chart/employee/{employee_id}")
async def get_employee_org_position(employee_id: str, current_user: User = Depends(get_current_user)):
    """Get specific employee's position in org chart with manager and direct reports"""
    
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    emp_map = {e.get("id"): e for e in employees}
    
    def get_employee_name(emp):
        if not emp:
            return "Unknown"
        first = emp.get("first_name") or emp.get("full_name", "").split()[0] if emp.get("full_name") else ""
        last = emp.get("last_name") or ""
        name = f"{first} {last}".strip()
        if not name:
            email = emp.get("work_email") or emp.get("personal_email") or ""
            name = email.split("@")[0].replace(".", " ").replace("_", " ").title() if email else "Unknown"
        return name
    
    def build_node(emp):
        if not emp:
            return None
        return {
            "id": emp.get("id"),
            "name": get_employee_name(emp),
            "email": emp.get("work_email") or emp.get("personal_email"),
            "job_title": emp.get("job_title") or "Employee",
            "department_id": emp.get("department_id"),
            "profile_picture": emp.get("profile_picture"),
        }
    
    # Get manager chain (up to 5 levels)
    manager_chain = []
    current_manager_id = employee.get("reporting_manager_id")
    for _ in range(5):
        if not current_manager_id:
            break
        manager = emp_map.get(current_manager_id)
        if manager:
            manager_chain.append(build_node(manager))
            current_manager_id = manager.get("reporting_manager_id")
        else:
            break
    
    # Get direct reports
    direct_reports = [
        build_node(emp) for emp in employees 
        if emp.get("reporting_manager_id") == employee_id
    ]
    
    # Get peers (same manager)
    peers = []
    if employee.get("reporting_manager_id"):
        peers = [
            build_node(emp) for emp in employees 
            if emp.get("reporting_manager_id") == employee.get("reporting_manager_id") 
            and emp.get("id") != employee_id
        ]
    
    return {
        "employee": build_node(employee),
        "manager_chain": manager_chain,
        "direct_reports": direct_reports,
        "peers": peers,
    }

@api_router.get("/org-chart/department/{department_id}")
async def get_department_org_chart(department_id: str, current_user: User = Depends(get_current_user)):
    """Get org chart for a specific department"""
    
    department = await db.departments.find_one({"id": department_id}, {"_id": 0})
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    employees = await db.employees.find({"department_id": department_id}, {"_id": 0}).to_list(500)
    emp_map = {e.get("id"): e for e in employees}
    
    def get_employee_name(emp):
        if not emp:
            return "Unknown"
        first = emp.get("first_name") or emp.get("full_name", "").split()[0] if emp.get("full_name") else ""
        last = emp.get("last_name") or ""
        name = f"{first} {last}".strip()
        if not name:
            email = emp.get("work_email") or emp.get("personal_email") or ""
            name = email.split("@")[0].replace(".", " ").replace("_", " ").title() if email else "Unknown"
        return name
    
    nodes = []
    for emp in employees:
        nodes.append({
            "id": emp.get("id"),
            "name": get_employee_name(emp),
            "email": emp.get("work_email") or emp.get("personal_email"),
            "job_title": emp.get("job_title") or "Employee",
            "manager_id": emp.get("reporting_manager_id"),
            "profile_picture": emp.get("profile_picture"),
        })
    
    return {
        "department": department,
        "nodes": nodes,
        "count": len(nodes)
    }

# ============= PAYROLL - SALARY STRUCTURES =============

@api_router.get("/payroll/salary-structures")
async def get_salary_structures(current_user: User = Depends(get_current_user)):
    """Get all salary structures (admin) or own salary structure (employee)"""
    if current_user.role in ["super_admin", "corp_admin"]:
        structures = await db.salary_structures.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    else:
        # Find employee by user_id or email
        employee = await db.employees.find_one(
            {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}, {"personal_email": current_user.email}]},
            {"_id": 0}
        )
        if not employee:
            return []
        structures = await db.salary_structures.find({"employee_id": employee.get("id")}, {"_id": 0}).to_list(10)
    return structures

@api_router.get("/payroll/salary-structures/{employee_id}")
async def get_employee_salary_structure(employee_id: str, current_user: User = Depends(get_current_user)):
    """Get salary structure for a specific employee"""
    structure = await db.salary_structures.find_one({"employee_id": employee_id, "status": "active"}, {"_id": 0})
    return structure

@api_router.post("/payroll/salary-structures")
async def create_salary_structure(structure: SalaryStructure, current_user: User = Depends(get_current_user)):
    """Create or update salary structure for an employee"""
    structure_dict = structure.model_dump()
    
    # Get employee details
    employee = await db.employees.find_one({"id": structure.employee_id}, {"_id": 0})
    if employee:
        first = employee.get("first_name") or ""
        last = employee.get("last_name") or ""
        name = f"{first} {last}".strip()
        if not name:
            email = employee.get("work_email") or employee.get("personal_email") or ""
            name = email.split("@")[0].replace(".", " ").replace("_", " ").title() if email else "Unknown"
        structure_dict["employee_name"] = name
        structure_dict["employee_email"] = employee.get("work_email") or employee.get("personal_email")
        structure_dict["department"] = employee.get("department")
    
    # Deactivate previous structure
    await db.salary_structures.update_many(
        {"employee_id": structure.employee_id, "status": "active"},
        {"$set": {"status": "inactive", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await db.salary_structures.insert_one(structure_dict)
    return {k: v for k, v in structure_dict.items() if k != "_id"}

@api_router.put("/payroll/salary-structures/{structure_id}")
async def update_salary_structure(structure_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a salary structure"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.salary_structures.update_one({"id": structure_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return await db.salary_structures.find_one({"id": structure_id}, {"_id": 0})

@api_router.delete("/payroll/salary-structures/{structure_id}")
async def delete_salary_structure(structure_id: str, current_user: User = Depends(get_current_user)):
    """Delete a salary structure"""
    result = await db.salary_structures.delete_one({"id": structure_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return {"message": "Salary structure deleted"}

# ============= PAYROLL - PAYSLIPS =============

@api_router.get("/payroll/payslips")
async def get_payslips(pay_period: Optional[str] = None, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get all payslips (admin) or own payslips (employee)"""
    query = {}
    if pay_period:
        query["pay_period"] = pay_period
    if status:
        query["status"] = status
    
    if current_user.role not in ["super_admin", "corp_admin"]:
        employee = await db.employees.find_one(
            {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}, {"personal_email": current_user.email}]},
            {"_id": 0}
        )
        if not employee:
            return []
        query["employee_id"] = employee.get("id")
    
    payslips = await db.payslips.find(query, {"_id": 0}).sort("payment_date", -1).to_list(500)
    return payslips

@api_router.get("/payroll/payslips/my")
async def get_my_payslips(current_user: User = Depends(get_current_user)):
    """Get payslips for the current user"""
    employee = await db.employees.find_one(
        {"$or": [{"user_id": current_user.id}, {"work_email": current_user.email}, {"personal_email": current_user.email}]},
        {"_id": 0}
    )
    if not employee:
        return []
    
    payslips = await db.payslips.find(
        {"employee_id": employee.get("id"), "status": {"$in": ["approved", "paid"]}},
        {"_id": 0}
    ).sort("payment_date", -1).to_list(100)
    return payslips

@api_router.get("/payroll/payslips/{payslip_id}")
async def get_payslip(payslip_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific payslip"""
    payslip = await db.payslips.find_one({"id": payslip_id}, {"_id": 0})
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return payslip

@api_router.post("/payroll/payslips")
async def create_payslip(payslip: Payslip, current_user: User = Depends(get_current_user)):
    """Create a payslip"""
    payslip_dict = payslip.model_dump()
    
    # Calculate gross and net salary
    gross = (payslip.basic_salary + payslip.housing_allowance + payslip.transport_allowance +
             payslip.meal_allowance + payslip.phone_allowance + payslip.other_allowances +
             payslip.overtime_pay + payslip.bonus + payslip.commission)
    
    deductions = (payslip.tax_amount + payslip.social_security + payslip.health_insurance +
                  payslip.pension_contribution + payslip.loan_deduction + payslip.other_deductions)
    
    payslip_dict["gross_salary"] = gross
    payslip_dict["total_deductions"] = deductions
    payslip_dict["net_salary"] = gross - deductions
    
    await db.payslips.insert_one(payslip_dict)
    return {k: v for k, v in payslip_dict.items() if k != "_id"}

@api_router.put("/payroll/payslips/{payslip_id}")
async def update_payslip(payslip_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a payslip"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate if salary components changed
    if any(k in data for k in ["basic_salary", "housing_allowance", "transport_allowance", "bonus"]):
        payslip = await db.payslips.find_one({"id": payslip_id}, {"_id": 0})
        if payslip:
            for k, v in data.items():
                payslip[k] = v
            
            gross = (payslip.get("basic_salary", 0) + payslip.get("housing_allowance", 0) + 
                     payslip.get("transport_allowance", 0) + payslip.get("meal_allowance", 0) + 
                     payslip.get("phone_allowance", 0) + payslip.get("other_allowances", 0) +
                     payslip.get("overtime_pay", 0) + payslip.get("bonus", 0) + payslip.get("commission", 0))
            
            deductions = (payslip.get("tax_amount", 0) + payslip.get("social_security", 0) + 
                          payslip.get("health_insurance", 0) + payslip.get("pension_contribution", 0) + 
                          payslip.get("loan_deduction", 0) + payslip.get("other_deductions", 0))
            
            data["gross_salary"] = gross
            data["total_deductions"] = deductions
            data["net_salary"] = gross - deductions
    
    result = await db.payslips.update_one({"id": payslip_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return await db.payslips.find_one({"id": payslip_id}, {"_id": 0})

@api_router.post("/payroll/payslips/{payslip_id}/approve")
async def approve_payslip(payslip_id: str, current_user: User = Depends(get_current_user)):
    """Approve a payslip"""
    result = await db.payslips.update_one(
        {"id": payslip_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user.id,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return await db.payslips.find_one({"id": payslip_id}, {"_id": 0})

@api_router.post("/payroll/payslips/{payslip_id}/mark-paid")
async def mark_payslip_paid(payslip_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Mark a payslip as paid"""
    result = await db.payslips.update_one(
        {"id": payslip_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_reference": data.get("payment_reference"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return await db.payslips.find_one({"id": payslip_id}, {"_id": 0})

@api_router.delete("/payroll/payslips/{payslip_id}")
async def delete_payslip(payslip_id: str, current_user: User = Depends(get_current_user)):
    """Delete a payslip"""
    result = await db.payslips.delete_one({"id": payslip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return {"message": "Payslip deleted"}

# ============= PAYROLL - PAYROLL RUNS =============

@api_router.get("/payroll/runs")
async def get_payroll_runs(current_user: User = Depends(get_current_user)):
    """Get all payroll runs"""
    runs = await db.payroll_runs.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return runs

@api_router.get("/payroll/runs/{run_id}")
async def get_payroll_run(run_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific payroll run with its payslips"""
    run = await db.payroll_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    payslips = await db.payslips.find({"pay_period": run.get("pay_period")}, {"_id": 0}).to_list(500)
    run["payslips"] = payslips
    return run

@api_router.post("/payroll/runs")
async def create_payroll_run(run: PayrollRun, current_user: User = Depends(get_current_user)):
    """Create a new payroll run"""
    run_dict = run.model_dump()
    run_dict["created_by"] = current_user.id
    await db.payroll_runs.insert_one(run_dict)
    return {k: v for k, v in run_dict.items() if k != "_id"}

@api_router.post("/payroll/runs/{run_id}/generate")
async def generate_payroll(run_id: str, current_user: User = Depends(get_current_user)):
    """Generate payslips for all employees with active salary structures"""
    run = await db.payroll_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    # Get all active salary structures
    structures = await db.salary_structures.find({"status": "active"}, {"_id": 0}).to_list(500)
    
    created_count = 0
    total_gross = 0
    total_deductions = 0
    total_net = 0
    
    for structure in structures:
        # Check if payslip already exists for this period
        existing = await db.payslips.find_one({
            "employee_id": structure.get("employee_id"),
            "pay_period": run.get("pay_period")
        })
        if existing:
            continue
        
        # Calculate tax amount
        gross = (structure.get("basic_salary", 0) + structure.get("housing_allowance", 0) +
                 structure.get("transport_allowance", 0) + structure.get("meal_allowance", 0) +
                 structure.get("phone_allowance", 0) + structure.get("other_allowances", 0))
        
        tax_amount = gross * (structure.get("tax_rate", 0) / 100)
        
        deductions = (tax_amount + structure.get("social_security", 0) +
                      structure.get("health_insurance", 0) + structure.get("pension_contribution", 0) +
                      structure.get("other_deductions", 0))
        
        net = gross - deductions
        
        payslip = Payslip(
            employee_id=structure.get("employee_id"),
            employee_name=structure.get("employee_name"),
            employee_email=structure.get("employee_email"),
            department=structure.get("department"),
            pay_period=run.get("pay_period"),
            pay_period_start=run.get("pay_period_start"),
            pay_period_end=run.get("pay_period_end"),
            payment_date=run.get("payment_date"),
            basic_salary=structure.get("basic_salary", 0),
            housing_allowance=structure.get("housing_allowance", 0),
            transport_allowance=structure.get("transport_allowance", 0),
            meal_allowance=structure.get("meal_allowance", 0),
            phone_allowance=structure.get("phone_allowance", 0),
            other_allowances=structure.get("other_allowances", 0),
            gross_salary=gross,
            tax_amount=tax_amount,
            social_security=structure.get("social_security", 0),
            health_insurance=structure.get("health_insurance", 0),
            pension_contribution=structure.get("pension_contribution", 0),
            other_deductions=structure.get("other_deductions", 0),
            total_deductions=deductions,
            net_salary=net,
            currency=structure.get("currency", "USD"),
            payment_method=structure.get("payment_method"),
            status="draft"
        )
        
        await db.payslips.insert_one(payslip.model_dump())
        created_count += 1
        total_gross += gross
        total_deductions += deductions
        total_net += net
    
    # Update payroll run totals
    await db.payroll_runs.update_one(
        {"id": run_id},
        {"$set": {
            "total_employees": created_count,
            "total_gross": total_gross,
            "total_deductions": total_deductions,
            "total_net": total_net,
            "status": "processing",
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": f"Generated {created_count} payslips",
        "total_employees": created_count,
        "total_gross": total_gross,
        "total_net": total_net
    }

@api_router.post("/payroll/runs/{run_id}/approve-all")
async def approve_all_payslips(run_id: str, current_user: User = Depends(get_current_user)):
    """Approve all payslips in a payroll run"""
    run = await db.payroll_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    result = await db.payslips.update_many(
        {"pay_period": run.get("pay_period"), "status": "draft"},
        {"$set": {
            "status": "approved",
            "approved_by": current_user.id,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.payroll_runs.update_one(
        {"id": run_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user.id,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Approved {result.modified_count} payslips"}

@api_router.post("/payroll/runs/{run_id}/mark-paid")
async def mark_all_payslips_paid(run_id: str, current_user: User = Depends(get_current_user)):
    """Mark all approved payslips in a run as paid"""
    run = await db.payroll_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    result = await db.payslips.update_many(
        {"pay_period": run.get("pay_period"), "status": "approved"},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.payroll_runs.update_one(
        {"id": run_id},
        {"$set": {
            "status": "paid",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Marked {result.modified_count} payslips as paid"}

@api_router.delete("/payroll/runs/{run_id}")
async def delete_payroll_run(run_id: str, current_user: User = Depends(get_current_user)):
    """Delete a payroll run and its payslips"""
    run = await db.payroll_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    # Delete associated payslips
    await db.payslips.delete_many({"pay_period": run.get("pay_period")})
    
    result = await db.payroll_runs.delete_one({"id": run_id})
    return {"message": "Payroll run deleted"}

# ============= PAYROLL - STATISTICS =============

@api_router.get("/payroll/stats")
async def get_payroll_stats(current_user: User = Depends(get_current_user)):
    """Get payroll statistics"""
    total_structures = await db.salary_structures.count_documents({"status": "active"})
    total_payslips = await db.payslips.count_documents({})
    paid_payslips = await db.payslips.count_documents({"status": "paid"})
    pending_payslips = await db.payslips.count_documents({"status": {"$in": ["draft", "approved"]}})
    
    # Calculate total paid this month
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    month_payslips = await db.payslips.find(
        {"pay_period": current_month, "status": "paid"},
        {"net_salary": 1}
    ).to_list(500)
    total_paid_month = sum(p.get("net_salary", 0) for p in month_payslips)
    
    # Calculate total paid YTD
    current_year = datetime.now(timezone.utc).strftime("%Y")
    year_payslips = await db.payslips.find(
        {"pay_period": {"$regex": f"^{current_year}"}, "status": "paid"},
        {"net_salary": 1}
    ).to_list(5000)
    total_paid_ytd = sum(p.get("net_salary", 0) for p in year_payslips)
    
    return {
        "total_salary_structures": total_structures,
        "total_payslips": total_payslips,
        "paid_payslips": paid_payslips,
        "pending_payslips": pending_payslips,
        "total_paid_this_month": total_paid_month,
        "total_paid_ytd": total_paid_ytd
    }

# ============= ASSET MANAGEMENT MODELS =============

class AssetCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None  # lucide icon name
    color: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    asset_tag: str  # Unique identifier like "LAPTOP-001"
    category_id: str
    category_name: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[float] = None
    currency: str = "USD"
    warranty_expiry: Optional[str] = None
    location: Optional[str] = None
    condition: str = "good"  # excellent, good, fair, poor
    status: str = "available"  # available, assigned, under_maintenance, retired, lost
    notes: Optional[str] = None
    # Current assignment info (denormalized for quick access)
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AssetAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    expected_return_date: Optional[str] = None
    actual_return_date: Optional[str] = None
    return_condition: Optional[str] = None
    return_notes: Optional[str] = None
    status: str = "active"  # active, returned, lost
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AssetRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    request_type: str = "new"  # new, replacement, return, repair
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    asset_id: Optional[str] = None  # For return/repair requests
    asset_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "normal"  # low, normal, high, urgent
    status: str = "pending"  # pending, approved, rejected, fulfilled, cancelled
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    fulfilled_asset_id: Optional[str] = None
    fulfilled_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= ASSET MANAGEMENT ROUTES =============

# Asset Categories
@api_router.get("/asset-categories")
async def get_asset_categories(current_user: User = Depends(get_current_user)):
    categories = await db.asset_categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/asset-categories")
async def create_asset_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create asset categories")
    category = AssetCategory(**data)
    await db.asset_categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/asset-categories/{category_id}")
async def update_asset_category(category_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update asset categories")
    await db.asset_categories.update_one({"id": category_id}, {"$set": data})
    category = await db.asset_categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.delete("/asset-categories/{category_id}")
async def delete_asset_category(category_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete asset categories")
    # Check if category has assets
    asset_count = await db.assets.count_documents({"category_id": category_id})
    if asset_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category with {asset_count} assets")
    result = await db.asset_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# Assets
@api_router.get("/assets")
async def get_assets(
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if status:
        query["status"] = status
    assets = await db.assets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return assets

@api_router.get("/assets/stats")
async def get_asset_stats(current_user: User = Depends(get_current_user)):
    total = await db.assets.count_documents({})
    available = await db.assets.count_documents({"status": "available"})
    assigned = await db.assets.count_documents({"status": "assigned"})
    maintenance = await db.assets.count_documents({"status": "under_maintenance"})
    retired = await db.assets.count_documents({"status": "retired"})
    pending_requests = await db.asset_requests.count_documents({"status": "pending"})
    
    # Get total value
    assets = await db.assets.find({}, {"_id": 0, "purchase_price": 1}).to_list(1000)
    total_value = sum(a.get("purchase_price", 0) or 0 for a in assets)
    
    return {
        "total_assets": total,
        "available": available,
        "assigned": assigned,
        "under_maintenance": maintenance,
        "retired": retired,
        "pending_requests": pending_requests,
        "total_value": total_value
    }

@api_router.get("/assets/my")
async def get_my_assets(current_user: User = Depends(get_current_user)):
    """Get assets assigned to current user"""
    # Find employee record
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"personal_email": current_user.email})
    
    if not employee:
        return []
    
    assets = await db.assets.find({
        "assigned_to_id": employee["id"]
    }, {"_id": 0}).to_list(100)
    
    return assets

@api_router.get("/assets/{asset_id}")
async def get_asset(asset_id: str, current_user: User = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@api_router.post("/assets")
async def create_asset(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create assets")
    
    # Get category name
    if data.get("category_id"):
        category = await db.asset_categories.find_one({"id": data["category_id"]}, {"_id": 0})
        if category:
            data["category_name"] = category.get("name")
    
    asset = Asset(**data)
    await db.assets.insert_one(asset.model_dump())
    return asset.model_dump()

@api_router.put("/assets/{asset_id}")
async def update_asset(asset_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update assets")
    
    # Get category name if category changed
    if data.get("category_id"):
        category = await db.asset_categories.find_one({"id": data["category_id"]}, {"_id": 0})
        if category:
            data["category_name"] = category.get("name")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.assets.update_one({"id": asset_id}, {"$set": data})
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete assets")
    
    # Check if asset is assigned
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if asset and asset.get("status") == "assigned":
        raise HTTPException(status_code=400, detail="Cannot delete assigned asset. Return it first.")
    
    result = await db.assets.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}

# Asset Assignment
@api_router.post("/assets/{asset_id}/assign")
async def assign_asset(asset_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can assign assets")
    
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.get("status") == "assigned":
        raise HTTPException(status_code=400, detail="Asset is already assigned")
    
    if asset.get("status") in ["retired", "lost"]:
        raise HTTPException(status_code=400, detail=f"Cannot assign {asset.get('status')} asset")
    
    employee_id = data.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID required")
    
    # Get employee details
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee_name = employee.get("full_name", "Unknown")
    
    # Create assignment record
    assignment = AssetAssignment(
        asset_id=asset_id,
        asset_name=asset.get("name"),
        asset_tag=asset.get("asset_tag"),
        employee_id=employee_id,
        employee_name=employee_name,
        assigned_by=current_user.id,
        assigned_date=data.get("assigned_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        expected_return_date=data.get("expected_return_date"),
        notes=data.get("notes")
    )
    await db.asset_assignments.insert_one(assignment.model_dump())
    
    # Update asset status
    await db.assets.update_one({"id": asset_id}, {"$set": {
        "status": "assigned",
        "assigned_to_id": employee_id,
        "assigned_to_name": employee_name,
        "assigned_date": assignment.assigned_date,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"message": "Asset assigned successfully", "assignment": assignment.model_dump()}

@api_router.post("/assets/{asset_id}/return")
async def return_asset(asset_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.get("status") != "assigned":
        raise HTTPException(status_code=400, detail="Asset is not assigned")
    
    # Find active assignment
    assignment = await db.asset_assignments.find_one({
        "asset_id": asset_id,
        "status": "active"
    }, {"_id": 0})
    
    if assignment:
        # Update assignment record
        await db.asset_assignments.update_one({"id": assignment["id"]}, {"$set": {
            "status": "returned",
            "actual_return_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "return_condition": data.get("condition", "good"),
            "return_notes": data.get("notes"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }})
    
    # Update asset
    new_status = data.get("new_status", "available")
    await db.assets.update_one({"id": asset_id}, {"$set": {
        "status": new_status,
        "condition": data.get("condition", asset.get("condition")),
        "assigned_to_id": None,
        "assigned_to_name": None,
        "assigned_date": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"message": "Asset returned successfully"}

@api_router.get("/asset-assignments")
async def get_asset_assignments(
    asset_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if asset_id:
        query["asset_id"] = asset_id
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    assignments = await db.asset_assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return assignments

# Asset Requests
@api_router.get("/asset-requests")
async def get_asset_requests(
    status: Optional[str] = None,
    request_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if request_type:
        query["request_type"] = request_type
    
    # Non-admins can only see their own requests
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        if employee:
            query["employee_id"] = employee["id"]
        else:
            return []
    
    requests = await db.asset_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests

@api_router.get("/asset-requests/my")
async def get_my_asset_requests(current_user: User = Depends(get_current_user)):
    """Get current user's asset requests"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"personal_email": current_user.email})
    
    if not employee:
        return []
    
    requests = await db.asset_requests.find(
        {"employee_id": employee["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.post("/asset-requests")
async def create_asset_request(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    # Get employee info
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    if not employee:
        employee = await db.employees.find_one({"personal_email": current_user.email})
    
    if not employee:
        raise HTTPException(status_code=400, detail="Employee record not found")
    
    data["employee_id"] = employee["id"]
    data["employee_name"] = employee.get("full_name", "Unknown")
    
    # Get category name if provided
    if data.get("category_id"):
        category = await db.asset_categories.find_one({"id": data["category_id"]}, {"_id": 0})
        if category:
            data["category_name"] = category.get("name")
    
    # Get asset name if provided
    if data.get("asset_id"):
        asset = await db.assets.find_one({"id": data["asset_id"]}, {"_id": 0})
        if asset:
            data["asset_name"] = asset.get("name")
    
    request = AssetRequest(**data)
    await db.asset_requests.insert_one(request.model_dump())
    return request.model_dump()

@api_router.put("/asset-requests/{request_id}")
async def update_asset_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.asset_requests.update_one({"id": request_id}, {"$set": data})
    request = await db.asset_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@api_router.post("/asset-requests/{request_id}/approve")
async def approve_asset_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can approve requests")
    
    request = await db.asset_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.asset_requests.update_one({"id": request_id}, {"$set": {
        "status": "approved",
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "notes": data.get("notes"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.asset_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/asset-requests/{request_id}/reject")
async def reject_asset_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can reject requests")
    
    await db.asset_requests.update_one({"id": request_id}, {"$set": {
        "status": "rejected",
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.asset_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/asset-requests/{request_id}/fulfill")
async def fulfill_asset_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can fulfill requests")
    
    request = await db.asset_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Request must be approved first")
    
    asset_id = data.get("asset_id")
    if not asset_id:
        raise HTTPException(status_code=400, detail="Asset ID required to fulfill request")
    
    # Assign the asset to the employee
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.get("status") != "available":
        raise HTTPException(status_code=400, detail="Asset is not available")
    
    # Assign the asset
    await assign_asset(asset_id, {"employee_id": request["employee_id"]}, current_user)
    
    # Update request status
    await db.asset_requests.update_one({"id": request_id}, {"$set": {
        "status": "fulfilled",
        "fulfilled_asset_id": asset_id,
        "fulfilled_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.asset_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.delete("/asset-requests/{request_id}")
async def delete_asset_request(request_id: str, current_user: User = Depends(get_current_user)):
    request = await db.asset_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Only allow deletion of pending requests or by admin
    if request.get("status") != "pending" and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Can only delete pending requests")
    
    await db.asset_requests.delete_one({"id": request_id})
    return {"message": "Request deleted"}

# ============= ANNOUNCEMENTS, MEMOS & SURVEYS MODELS =============

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    type: str = "company"  # company, branch, department
    target_ids: List[str] = []  # branch/department IDs if type is not company
    priority: str = "normal"  # low, normal, high, urgent
    status: str = "draft"  # draft, published, archived
    published_at: Optional[str] = None
    expires_at: Optional[str] = None
    pinned: bool = False
    attachments: List[str] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    read_by: List[str] = []  # employee IDs who have read
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Memo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    from_id: Optional[str] = None
    from_name: Optional[str] = None
    to_type: str = "employees"  # employees, department, branch, all
    to_ids: List[str] = []  # employee/department/branch IDs
    to_names: List[str] = []
    priority: str = "normal"  # low, normal, high, urgent
    requires_acknowledgment: bool = False
    acknowledged_by: List[Dict[str, Any]] = []  # [{employee_id, employee_name, acknowledged_at}]
    status: str = "sent"  # draft, sent, archived
    attachments: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SurveyQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "text"  # text, single_choice, multiple_choice, rating, scale
    question: str
    options: List[str] = []  # For choice questions
    required: bool = True
    min_value: Optional[int] = None  # For scale/rating
    max_value: Optional[int] = None

class Survey(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    questions: List[Dict[str, Any]] = []
    target_type: str = "all"  # all, department, branch, specific
    target_ids: List[str] = []
    status: str = "draft"  # draft, active, closed, archived
    anonymous: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    response_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SurveyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    survey_id: str
    employee_id: Optional[str] = None  # Null if anonymous
    employee_name: Optional[str] = None
    answers: Dict[str, Any] = {}  # {question_id: answer}
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= ANNOUNCEMENTS ROUTES =============

@api_router.get("/announcements")
async def get_announcements(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    # Non-admins only see published announcements
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["status"] = "published"
        # Filter by target audience
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        
        if employee:
            branch_id = employee.get("branch_id")
            dept_id = employee.get("department_id")
            query["$or"] = [
                {"type": "company"},
                {"type": "branch", "target_ids": branch_id},
                {"type": "department", "target_ids": dept_id}
            ]
    
    announcements = await db.announcements.find(query, {"_id": 0}).sort([("pinned", -1), ("created_at", -1)]).to_list(100)
    return announcements

@api_router.get("/announcements/unread-count")
async def get_unread_announcements_count(current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        return {"count": 0}
    
    employee_id = employee["id"]
    branch_id = employee.get("branch_id")
    dept_id = employee.get("department_id")
    
    query = {
        "status": "published",
        "read_by": {"$nin": [employee_id]},
        "$or": [
            {"type": "company"},
            {"type": "branch", "target_ids": branch_id},
            {"type": "department", "target_ids": dept_id}
        ]
    }
    
    count = await db.announcements.count_documents(query)
    return {"count": count}

@api_router.get("/announcements/{announcement_id}")
async def get_announcement(announcement_id: str, current_user: User = Depends(get_current_user)):
    announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@api_router.post("/announcements")
async def create_announcement(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create announcements")
    
    data["created_by"] = current_user.id
    data["created_by_name"] = current_user.full_name
    
    if data.get("status") == "published" and not data.get("published_at"):
        data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    announcement = Announcement(**data)
    await db.announcements.insert_one(announcement.model_dump())
    return announcement.model_dump()

@api_router.put("/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update announcements")
    
    # Set published_at when status changes to published
    existing = await db.announcements.find_one({"id": announcement_id})
    if existing and existing.get("status") != "published" and data.get("status") == "published":
        data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.announcements.update_one({"id": announcement_id}, {"$set": data})
    announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@api_router.post("/announcements/{announcement_id}/read")
async def mark_announcement_read(announcement_id: str, current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        raise HTTPException(status_code=400, detail="Employee record not found")
    
    await db.announcements.update_one(
        {"id": announcement_id},
        {"$addToSet": {"read_by": employee["id"]}}
    )
    return {"message": "Marked as read"}

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete announcements")
    
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}

# ============= MEMOS ROUTES =============

@api_router.get("/memos")
async def get_memos(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    query = {}
    if status:
        query["status"] = status
    
    # Non-admins only see memos sent to them
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        if employee:
            branch_id = employee.get("branch_id")
            dept_id = employee.get("department_id")
            query["$or"] = [
                {"to_type": "all"},
                {"to_type": "employees", "to_ids": employee["id"]},
                {"to_type": "department", "to_ids": dept_id},
                {"to_type": "branch", "to_ids": branch_id}
            ]
        else:
            return []
    
    memos = await db.memos.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return memos

@api_router.get("/memos/my")
async def get_my_memos(current_user: User = Depends(get_current_user)):
    """Get memos for current employee"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        return []
    
    branch_id = employee.get("branch_id")
    dept_id = employee.get("department_id")
    
    query = {
        "status": {"$ne": "draft"},
        "$or": [
            {"to_type": "all"},
            {"to_type": "employees", "to_ids": employee["id"]},
            {"to_type": "department", "to_ids": dept_id},
            {"to_type": "branch", "to_ids": branch_id}
        ]
    }
    
    memos = await db.memos.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return memos

@api_router.get("/memos/{memo_id}")
async def get_memo(memo_id: str, current_user: User = Depends(get_current_user)):
    memo = await db.memos.find_one({"id": memo_id}, {"_id": 0})
    if not memo:
        raise HTTPException(status_code=404, detail="Memo not found")
    return memo

@api_router.post("/memos")
async def create_memo(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create memos")
    
    data["from_id"] = current_user.id
    data["from_name"] = current_user.full_name
    
    # Get recipient names
    to_names = []
    if data.get("to_type") == "employees" and data.get("to_ids"):
        for emp_id in data["to_ids"]:
            emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
            if emp:
                to_names.append(emp.get("full_name", "Unknown"))
    elif data.get("to_type") == "department" and data.get("to_ids"):
        for dept_id in data["to_ids"]:
            dept = await db.departments.find_one({"id": dept_id}, {"_id": 0})
            if dept:
                to_names.append(dept.get("name", "Unknown"))
    elif data.get("to_type") == "branch" and data.get("to_ids"):
        for branch_id in data["to_ids"]:
            branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
            if branch:
                to_names.append(branch.get("name", "Unknown"))
    elif data.get("to_type") == "all":
        to_names.append("All Employees")
    
    data["to_names"] = to_names
    
    memo = Memo(**data)
    await db.memos.insert_one(memo.model_dump())
    return memo.model_dump()

@api_router.put("/memos/{memo_id}")
async def update_memo(memo_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update memos")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.memos.update_one({"id": memo_id}, {"$set": data})
    memo = await db.memos.find_one({"id": memo_id}, {"_id": 0})
    if not memo:
        raise HTTPException(status_code=404, detail="Memo not found")
    return memo

@api_router.post("/memos/{memo_id}/acknowledge")
async def acknowledge_memo(memo_id: str, current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        raise HTTPException(status_code=400, detail="Employee record not found")
    
    acknowledgment = {
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name", "Unknown"),
        "acknowledged_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if already acknowledged
    memo = await db.memos.find_one({"id": memo_id})
    if memo:
        existing_acks = memo.get("acknowledged_by", [])
        if not any(a["employee_id"] == employee["id"] for a in existing_acks):
            await db.memos.update_one(
                {"id": memo_id},
                {"$push": {"acknowledged_by": acknowledgment}}
            )
    
    return {"message": "Memo acknowledged"}

@api_router.delete("/memos/{memo_id}")
async def delete_memo(memo_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete memos")
    
    result = await db.memos.delete_one({"id": memo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memo not found")
    return {"message": "Memo deleted"}

# ============= SURVEYS ROUTES =============

@api_router.get("/surveys")
async def get_surveys(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    # Non-admins only see active surveys targeted at them
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["status"] = "active"
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        
        if employee:
            branch_id = employee.get("branch_id")
            dept_id = employee.get("department_id")
            query["$or"] = [
                {"target_type": "all"},
                {"target_type": "specific", "target_ids": employee["id"]},
                {"target_type": "department", "target_ids": dept_id},
                {"target_type": "branch", "target_ids": branch_id}
            ]
    
    surveys = await db.surveys.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return surveys

@api_router.get("/surveys/my")
async def get_my_surveys(current_user: User = Depends(get_current_user)):
    """Get active surveys for current employee"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        return []
    
    branch_id = employee.get("branch_id")
    dept_id = employee.get("department_id")
    
    query = {
        "status": "active",
        "$or": [
            {"target_type": "all"},
            {"target_type": "specific", "target_ids": employee["id"]},
            {"target_type": "department", "target_ids": dept_id},
            {"target_type": "branch", "target_ids": branch_id}
        ]
    }
    
    surveys = await db.surveys.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Check if already responded
    for survey in surveys:
        if survey.get("anonymous"):
            # For anonymous, we can't check by employee_id, so skip
            survey["has_responded"] = False
        else:
            response = await db.survey_responses.find_one({
                "survey_id": survey["id"],
                "employee_id": employee["id"]
            })
            survey["has_responded"] = response is not None
    
    return surveys

@api_router.get("/surveys/{survey_id}")
async def get_survey(survey_id: str, current_user: User = Depends(get_current_user)):
    survey = await db.surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey

@api_router.get("/surveys/{survey_id}/results")
async def get_survey_results(survey_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view survey results")
    
    survey = await db.surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    responses = await db.survey_responses.find({"survey_id": survey_id}, {"_id": 0}).to_list(1000)
    
    # Aggregate results
    results = {
        "survey": survey,
        "total_responses": len(responses),
        "questions": []
    }
    
    for question in survey.get("questions", []):
        q_id = question.get("id")
        q_type = question.get("type")
        q_results = {
            "question": question,
            "responses": []
        }
        
        if q_type in ["single_choice", "multiple_choice"]:
            # Count options
            option_counts = {}
            for opt in question.get("options", []):
                option_counts[opt] = 0
            
            for resp in responses:
                answer = resp.get("answers", {}).get(q_id)
                if isinstance(answer, list):
                    for a in answer:
                        if a in option_counts:
                            option_counts[a] += 1
                elif answer in option_counts:
                    option_counts[answer] += 1
            
            q_results["summary"] = option_counts
        elif q_type in ["rating", "scale"]:
            # Calculate average
            values = []
            for resp in responses:
                answer = resp.get("answers", {}).get(q_id)
                if answer is not None:
                    try:
                        values.append(float(answer))
                    except:
                        pass
            
            if values:
                q_results["summary"] = {
                    "average": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values)
                }
        else:
            # Text responses
            q_results["responses"] = [
                resp.get("answers", {}).get(q_id)
                for resp in responses
                if resp.get("answers", {}).get(q_id)
            ]
        
        results["questions"].append(q_results)
    
    return results

@api_router.post("/surveys")
async def create_survey(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create surveys")
    
    data["created_by"] = current_user.id
    data["created_by_name"] = current_user.full_name
    
    # Ensure questions have IDs
    questions = data.get("questions", [])
    for q in questions:
        if "id" not in q:
            q["id"] = str(uuid.uuid4())
    
    survey = Survey(**data)
    await db.surveys.insert_one(survey.model_dump())
    return survey.model_dump()

@api_router.put("/surveys/{survey_id}")
async def update_survey(survey_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update surveys")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.surveys.update_one({"id": survey_id}, {"$set": data})
    survey = await db.surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey

@api_router.post("/surveys/{survey_id}/respond")
async def submit_survey_response(survey_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    survey = await db.surveys.find_one({"id": survey_id}, {"_id": 0})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if survey.get("status") != "active":
        raise HTTPException(status_code=400, detail="Survey is not active")
    
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    response_data = {
        "survey_id": survey_id,
        "answers": data.get("answers", {})
    }
    
    # Only include employee info if not anonymous
    if not survey.get("anonymous"):
        if employee:
            response_data["employee_id"] = employee["id"]
            response_data["employee_name"] = employee.get("full_name")
            
            # Check for duplicate response
            existing = await db.survey_responses.find_one({
                "survey_id": survey_id,
                "employee_id": employee["id"]
            })
            if existing:
                raise HTTPException(status_code=400, detail="You have already responded to this survey")
    
    response = SurveyResponse(**response_data)
    await db.survey_responses.insert_one(response.model_dump())
    
    # Update response count
    await db.surveys.update_one(
        {"id": survey_id},
        {"$inc": {"response_count": 1}}
    )
    
    return {"message": "Response submitted successfully"}

@api_router.delete("/surveys/{survey_id}")
async def delete_survey(survey_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete surveys")
    
    result = await db.surveys.delete_one({"id": survey_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Delete associated responses
    await db.survey_responses.delete_many({"survey_id": survey_id})
    
    return {"message": "Survey and responses deleted"}

# ============= COMMUNICATION STATS =============

@api_router.get("/communications/stats")
async def get_communications_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view stats")
    
    announcements_total = await db.announcements.count_documents({})
    announcements_published = await db.announcements.count_documents({"status": "published"})
    memos_total = await db.memos.count_documents({})
    memos_pending_ack = await db.memos.count_documents({
        "requires_acknowledgment": True,
        "acknowledged_by": {"$size": 0}
    })
    surveys_total = await db.surveys.count_documents({})
    surveys_active = await db.surveys.count_documents({"status": "active"})
    
    return {
        "announcements_total": announcements_total,
        "announcements_published": announcements_published,
        "memos_total": memos_total,
        "memos_pending_ack": memos_pending_ack,
        "surveys_total": surveys_total,
        "surveys_active": surveys_active
    }

# ============= COMPLAINTS MANAGEMENT MODELS =============

class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str = Field(default_factory=lambda: f"CMP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    title: str
    description: str
    category: str = "general"  # harassment, discrimination, safety, policy_violation, workplace_conduct, compensation, management, general
    priority: str = "medium"  # low, medium, high, critical
    status: str = "submitted"  # submitted, under_review, investigating, resolved, closed, dismissed
    anonymous: bool = False
    employee_id: Optional[str] = None  # Null if anonymous
    employee_name: Optional[str] = None
    employee_department: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolution: Optional[str] = None
    resolution_date: Optional[str] = None
    resolution_type: Optional[str] = None  # resolved_in_favor, partially_resolved, not_substantiated, dismissed
    attachments: List[str] = []
    is_confidential: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ComplaintComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    complaint_id: str
    author_id: Optional[str] = None
    author_name: str = "Anonymous"
    content: str
    is_internal: bool = False  # Internal notes only visible to admins
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ComplaintStatusHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    complaint_id: str
    from_status: Optional[str] = None
    to_status: str
    changed_by_id: Optional[str] = None
    changed_by_name: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= COMPLAINTS ROUTES =============

COMPLAINT_CATEGORIES = [
    {"value": "harassment", "label": "Harassment"},
    {"value": "discrimination", "label": "Discrimination"},
    {"value": "safety", "label": "Workplace Safety"},
    {"value": "policy_violation", "label": "Policy Violation"},
    {"value": "workplace_conduct", "label": "Workplace Conduct"},
    {"value": "compensation", "label": "Compensation & Benefits"},
    {"value": "management", "label": "Management Issues"},
    {"value": "general", "label": "General Complaint"},
]

@api_router.get("/complaints/categories")
async def get_complaint_categories(current_user: User = Depends(get_current_user)):
    return COMPLAINT_CATEGORIES

@api_router.get("/complaints")
async def get_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Non-admins can only see their own non-anonymous complaints
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        
        if employee:
            query["$and"] = [
                {"employee_id": employee["id"]},
                {"anonymous": False}
            ]
        else:
            return []
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to_id"] = assigned_to
    
    complaints = await db.complaints.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return complaints

@api_router.get("/complaints/my")
async def get_my_complaints(current_user: User = Depends(get_current_user)):
    """Get complaints submitted by current user (excludes anonymous)"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        return []
    
    complaints = await db.complaints.find({
        "employee_id": employee["id"],
        "anonymous": False
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return complaints

@api_router.get("/complaints/stats")
async def get_complaints_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view stats")
    
    total = await db.complaints.count_documents({})
    submitted = await db.complaints.count_documents({"status": "submitted"})
    under_review = await db.complaints.count_documents({"status": "under_review"})
    investigating = await db.complaints.count_documents({"status": "investigating"})
    resolved = await db.complaints.count_documents({"status": "resolved"})
    closed = await db.complaints.count_documents({"status": "closed"})
    
    # Priority breakdown
    critical = await db.complaints.count_documents({"priority": "critical", "status": {"$nin": ["resolved", "closed", "dismissed"]}})
    high = await db.complaints.count_documents({"priority": "high", "status": {"$nin": ["resolved", "closed", "dismissed"]}})
    
    # Anonymous count
    anonymous = await db.complaints.count_documents({"anonymous": True})
    
    # Category breakdown
    category_stats = []
    for cat in COMPLAINT_CATEGORIES:
        count = await db.complaints.count_documents({"category": cat["value"]})
        if count > 0:
            category_stats.append({"category": cat["label"], "count": count})
    
    return {
        "total": total,
        "submitted": submitted,
        "under_review": under_review,
        "investigating": investigating,
        "resolved": resolved,
        "closed": closed,
        "critical_priority": critical,
        "high_priority": high,
        "anonymous": anonymous,
        "by_category": category_stats
    }

@api_router.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str, current_user: User = Depends(get_current_user)):
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check access
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee or complaint.get("employee_id") != employee["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return complaint

@api_router.get("/complaints/{complaint_id}/comments")
async def get_complaint_comments(complaint_id: str, current_user: User = Depends(get_current_user)):
    query = {"complaint_id": complaint_id}
    
    # Non-admins don't see internal comments
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["is_internal"] = False
    
    comments = await db.complaint_comments.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    return comments

@api_router.get("/complaints/{complaint_id}/history")
async def get_complaint_history(complaint_id: str, current_user: User = Depends(get_current_user)):
    history = await db.complaint_status_history.find(
        {"complaint_id": complaint_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return history

@api_router.post("/complaints")
async def create_complaint(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    employee = None
    if not data.get("anonymous"):
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        
        if employee:
            data["employee_id"] = employee["id"]
            data["employee_name"] = employee.get("full_name", "Unknown")
            data["employee_department"] = None
            
            # Get department name
            if employee.get("department_id"):
                dept = await db.departments.find_one({"id": employee["department_id"]})
                if dept:
                    data["employee_department"] = dept.get("name")
    
    complaint = Complaint(**data)
    await db.complaints.insert_one(complaint.model_dump())
    
    # Create initial status history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=None,
        to_status="submitted",
        changed_by_id=current_user.id if not data.get("anonymous") else None,
        changed_by_name=current_user.full_name if not data.get("anonymous") else "Anonymous"
    )
    await db.complaint_status_history.insert_one(history.model_dump())
    
    return complaint.model_dump()

@api_router.put("/complaints/{complaint_id}")
async def update_complaint(complaint_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Track status changes
    old_status = complaint.get("status")
    new_status = data.get("status")
    
    if new_status and new_status != old_status:
        history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            from_status=old_status,
            to_status=new_status,
            changed_by_id=current_user.id,
            changed_by_name=current_user.full_name,
            notes=data.get("status_notes")
        )
        await db.complaint_status_history.insert_one(history.model_dump())
        
        # Set resolution date if resolved
        if new_status in ["resolved", "closed"]:
            data["resolution_date"] = datetime.now(timezone.utc).isoformat()
    
    # Get assignee name if assigned
    if data.get("assigned_to_id"):
        admin = await db.users.find_one({"id": data["assigned_to_id"]})
        if admin:
            data["assigned_to_name"] = admin.get("full_name", "Unknown")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Remove status_notes from data before updating
    data.pop("status_notes", None)
    
    await db.complaints.update_one({"id": complaint_id}, {"$set": data})
    return await db.complaints.find_one({"id": complaint_id}, {"_id": 0})

@api_router.post("/complaints/{complaint_id}/comments")
async def add_complaint_comment(complaint_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Determine if anonymous
    author_name = current_user.full_name
    author_id = current_user.id
    
    # Check if this is the complaint owner posting anonymously
    if complaint.get("anonymous") and complaint.get("employee_id"):
        employee = await db.employees.find_one({"user_id": current_user.id})
        if employee and employee["id"] == complaint["employee_id"]:
            author_name = "Complainant (Anonymous)"
            author_id = None
    
    comment = ComplaintComment(
        complaint_id=complaint_id,
        author_id=author_id,
        author_name=author_name,
        content=data.get("content", ""),
        is_internal=data.get("is_internal", False) and current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    )
    
    await db.complaint_comments.insert_one(comment.model_dump())
    
    # Update complaint's updated_at
    await db.complaints.update_one(
        {"id": complaint_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return comment.model_dump()

@api_router.post("/complaints/{complaint_id}/assign")
async def assign_complaint(complaint_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can assign complaints")
    
    assignee_id = data.get("assigned_to_id")
    if not assignee_id:
        raise HTTPException(status_code=400, detail="Assignee ID required")
    
    admin = await db.users.find_one({"id": assignee_id})
    if not admin:
        raise HTTPException(status_code=404, detail="Assignee not found")
    
    await db.complaints.update_one({"id": complaint_id}, {"$set": {
        "assigned_to_id": assignee_id,
        "assigned_to_name": admin.get("full_name", "Unknown"),
        "status": "under_review",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    # Add status history
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    if complaint:
        history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            from_status=complaint.get("status"),
            to_status="under_review",
            changed_by_id=current_user.id,
            changed_by_name=current_user.full_name,
            notes=f"Assigned to {admin.get('full_name', 'Unknown')}"
        )
        await db.complaint_status_history.insert_one(history.model_dump())
    
    return await db.complaints.find_one({"id": complaint_id}, {"_id": 0})

@api_router.post("/complaints/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can resolve complaints")
    
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    old_status = complaint.get("status")
    
    await db.complaints.update_one({"id": complaint_id}, {"$set": {
        "status": "resolved",
        "resolution": data.get("resolution", ""),
        "resolution_type": data.get("resolution_type", "resolved_in_favor"),
        "resolution_date": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    # Add status history
    history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        from_status=old_status,
        to_status="resolved",
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        notes=data.get("notes", "Complaint resolved")
    )
    await db.complaint_status_history.insert_one(history.model_dump())
    
    return await db.complaints.find_one({"id": complaint_id}, {"_id": 0})

@api_router.delete("/complaints/{complaint_id}")
async def delete_complaint(complaint_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete complaints")
    
    result = await db.complaints.delete_one({"id": complaint_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Delete associated comments and history
    await db.complaint_comments.delete_many({"complaint_id": complaint_id})
    await db.complaint_status_history.delete_many({"complaint_id": complaint_id})
    
    return {"message": "Complaint deleted"}

# ============= DISCIPLINARY ACTIONS MODELS =============

class DisciplinaryAction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str = Field(default_factory=lambda: f"DA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    employee_id: str
    employee_name: Optional[str] = None
    employee_department: Optional[str] = None
    action_type: str  # verbal_warning, written_warning, final_warning, suspension, probation, demotion, termination
    severity: str = "minor"  # minor, moderate, major, severe
    reason: str
    description: str
    incident_date: Optional[str] = None
    action_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    issued_by_id: Optional[str] = None
    issued_by_name: Optional[str] = None
    related_complaint_id: Optional[str] = None
    witnesses: List[str] = []
    evidence: List[str] = []
    follow_up_date: Optional[str] = None
    review_period_end: Optional[str] = None
    suspension_start: Optional[str] = None
    suspension_end: Optional[str] = None
    probation_end: Optional[str] = None
    status: str = "pending_acknowledgment"  # pending_acknowledgment, acknowledged, appealed, under_review, closed
    acknowledged_at: Optional[str] = None
    employee_response: Optional[str] = None
    is_confidential: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DisciplinaryAppeal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    disciplinary_action_id: str
    employee_id: str
    employee_name: Optional[str] = None
    reason: str
    supporting_details: Optional[str] = None
    status: str = "pending"  # pending, under_review, approved, rejected, modified
    reviewed_by_id: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[str] = None
    decision: Optional[str] = None
    decision_notes: Optional[str] = None
    modified_action: Optional[str] = None  # New action type if modified
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DisciplinaryNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    disciplinary_action_id: str
    author_id: str
    author_name: str
    content: str
    is_internal: bool = True  # Only visible to admins
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= DISCIPLINARY ACTIONS ROUTES =============

DISCIPLINARY_ACTION_TYPES = [
    {"value": "verbal_warning", "label": "Verbal Warning", "severity": "minor"},
    {"value": "written_warning", "label": "Written Warning", "severity": "moderate"},
    {"value": "final_warning", "label": "Final Warning", "severity": "major"},
    {"value": "suspension", "label": "Suspension", "severity": "major"},
    {"value": "probation", "label": "Probation", "severity": "major"},
    {"value": "demotion", "label": "Demotion", "severity": "severe"},
    {"value": "termination", "label": "Termination", "severity": "severe"},
]

@api_router.get("/disciplinary/action-types")
async def get_disciplinary_action_types(current_user: User = Depends(get_current_user)):
    return DISCIPLINARY_ACTION_TYPES

@api_router.get("/disciplinary/actions")
async def get_disciplinary_actions(
    status: Optional[str] = None,
    action_type: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Non-admins can only see their own records
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee:
            employee = await db.employees.find_one({"work_email": current_user.email})
        if employee:
            query["employee_id"] = employee["id"]
        else:
            return []
    else:
        if employee_id:
            query["employee_id"] = employee_id
    
    if status:
        query["status"] = status
    if action_type:
        query["action_type"] = action_type
    
    actions = await db.disciplinary_actions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return actions

@api_router.get("/disciplinary/actions/my")
async def get_my_disciplinary_actions(current_user: User = Depends(get_current_user)):
    """Get disciplinary actions for current employee"""
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee:
        return []
    
    actions = await db.disciplinary_actions.find(
        {"employee_id": employee["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return actions

@api_router.get("/disciplinary/stats")
async def get_disciplinary_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view stats")
    
    total = await db.disciplinary_actions.count_documents({})
    pending_ack = await db.disciplinary_actions.count_documents({"status": "pending_acknowledgment"})
    appealed = await db.disciplinary_actions.count_documents({"status": "appealed"})
    active = await db.disciplinary_actions.count_documents({"status": {"$nin": ["closed"]}})
    
    # By type
    verbal_warnings = await db.disciplinary_actions.count_documents({"action_type": "verbal_warning"})
    written_warnings = await db.disciplinary_actions.count_documents({"action_type": "written_warning"})
    final_warnings = await db.disciplinary_actions.count_documents({"action_type": "final_warning"})
    suspensions = await db.disciplinary_actions.count_documents({"action_type": "suspension"})
    terminations = await db.disciplinary_actions.count_documents({"action_type": "termination"})
    
    # Pending appeals
    pending_appeals = await db.disciplinary_appeals.count_documents({"status": "pending"})
    
    return {
        "total": total,
        "pending_acknowledgment": pending_ack,
        "appealed": appealed,
        "active": active,
        "pending_appeals": pending_appeals,
        "verbal_warnings": verbal_warnings,
        "written_warnings": written_warnings,
        "final_warnings": final_warnings,
        "suspensions": suspensions,
        "terminations": terminations
    }

@api_router.get("/disciplinary/actions/{action_id}")
async def get_disciplinary_action(action_id: str, current_user: User = Depends(get_current_user)):
    action = await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})
    if not action:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    # Check access
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        employee = await db.employees.find_one({"user_id": current_user.id})
        if not employee or action.get("employee_id") != employee["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return action

@api_router.get("/disciplinary/actions/{action_id}/notes")
async def get_disciplinary_notes(action_id: str, current_user: User = Depends(get_current_user)):
    query = {"disciplinary_action_id": action_id}
    
    # Non-admins don't see internal notes
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["is_internal"] = False
    
    notes = await db.disciplinary_notes.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    return notes

@api_router.get("/disciplinary/actions/{action_id}/appeal")
async def get_disciplinary_appeal(action_id: str, current_user: User = Depends(get_current_user)):
    appeal = await db.disciplinary_appeals.find_one(
        {"disciplinary_action_id": action_id},
        {"_id": 0}
    )
    return appeal

@api_router.get("/disciplinary/employee/{employee_id}/history")
async def get_employee_disciplinary_history(employee_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view employee history")
    
    actions = await db.disciplinary_actions.find(
        {"employee_id": employee_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return actions

@api_router.post("/disciplinary/actions")
async def create_disciplinary_action(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create disciplinary actions")
    
    employee_id = data.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID required")
    
    # Get employee details
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    data["employee_name"] = employee.get("full_name", "Unknown")
    
    # Get department name
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]})
        if dept:
            data["employee_department"] = dept.get("name")
    
    data["issued_by_id"] = current_user.id
    data["issued_by_name"] = current_user.full_name
    
    action = DisciplinaryAction(**data)
    await db.disciplinary_actions.insert_one(action.model_dump())
    
    return action.model_dump()

@api_router.put("/disciplinary/actions/{action_id}")
async def update_disciplinary_action(action_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update disciplinary actions")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.disciplinary_actions.update_one({"id": action_id}, {"$set": data})
    
    action = await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})
    if not action:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    return action

@api_router.post("/disciplinary/actions/{action_id}/acknowledge")
async def acknowledge_disciplinary_action(action_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Employee acknowledges receipt of disciplinary action"""
    action = await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})
    if not action:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    # Verify employee is acknowledging their own action
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee or employee["id"] != action.get("employee_id"):
        raise HTTPException(status_code=403, detail="You can only acknowledge your own disciplinary actions")
    
    await db.disciplinary_actions.update_one({"id": action_id}, {"$set": {
        "status": "acknowledged",
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        "employee_response": data.get("response", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})

@api_router.post("/disciplinary/actions/{action_id}/notes")
async def add_disciplinary_note(action_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    action = await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})
    if not action:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    # Only admins can add internal notes
    is_internal = data.get("is_internal", False) and current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    note = DisciplinaryNote(
        disciplinary_action_id=action_id,
        author_id=current_user.id,
        author_name=current_user.full_name,
        content=data.get("content", ""),
        is_internal=is_internal
    )
    
    await db.disciplinary_notes.insert_one(note.model_dump())
    
    # Update action's updated_at
    await db.disciplinary_actions.update_one(
        {"id": action_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return note.model_dump()

@api_router.post("/disciplinary/actions/{action_id}/appeal")
async def submit_disciplinary_appeal(action_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Employee submits an appeal"""
    action = await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})
    if not action:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    # Verify employee is appealing their own action
    employee = await db.employees.find_one({"user_id": current_user.id})
    if not employee:
        employee = await db.employees.find_one({"work_email": current_user.email})
    
    if not employee or employee["id"] != action.get("employee_id"):
        raise HTTPException(status_code=403, detail="You can only appeal your own disciplinary actions")
    
    # Check if appeal already exists
    existing_appeal = await db.disciplinary_appeals.find_one({"disciplinary_action_id": action_id})
    if existing_appeal:
        raise HTTPException(status_code=400, detail="An appeal has already been submitted for this action")
    
    appeal = DisciplinaryAppeal(
        disciplinary_action_id=action_id,
        employee_id=employee["id"],
        employee_name=employee.get("full_name", "Unknown"),
        reason=data.get("reason", ""),
        supporting_details=data.get("supporting_details", "")
    )
    
    await db.disciplinary_appeals.insert_one(appeal.model_dump())
    
    # Update action status
    await db.disciplinary_actions.update_one({"id": action_id}, {"$set": {
        "status": "appealed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return appeal.model_dump()

@api_router.get("/disciplinary/appeals")
async def get_all_appeals(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view all appeals")
    
    query = {}
    if status:
        query["status"] = status
    
    appeals = await db.disciplinary_appeals.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return appeals

@api_router.put("/disciplinary/appeals/{appeal_id}")
async def review_disciplinary_appeal(appeal_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can review appeals")
    
    appeal = await db.disciplinary_appeals.find_one({"id": appeal_id}, {"_id": 0})
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    new_status = data.get("status")
    
    update_data = {
        "status": new_status,
        "reviewed_by_id": current_user.id,
        "reviewed_by_name": current_user.full_name,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "decision": data.get("decision", ""),
        "decision_notes": data.get("decision_notes", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if new_status == "modified":
        update_data["modified_action"] = data.get("modified_action")
    
    await db.disciplinary_appeals.update_one({"id": appeal_id}, {"$set": update_data})
    
    # Update disciplinary action status
    action_status = "closed" if new_status in ["approved", "rejected"] else "under_review"
    if new_status == "modified":
        # Update the action type if modified
        await db.disciplinary_actions.update_one(
            {"id": appeal["disciplinary_action_id"]},
            {"$set": {
                "action_type": data.get("modified_action", appeal.get("action_type")),
                "status": "acknowledged",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.disciplinary_actions.update_one(
            {"id": appeal["disciplinary_action_id"]},
            {"$set": {
                "status": action_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return await db.disciplinary_appeals.find_one({"id": appeal_id}, {"_id": 0})

@api_router.post("/disciplinary/actions/{action_id}/close")
async def close_disciplinary_action(action_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can close disciplinary actions")
    
    await db.disciplinary_actions.update_one({"id": action_id}, {"$set": {
        "status": "closed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    # Add closing note if provided
    if data.get("closing_notes"):
        note = DisciplinaryNote(
            disciplinary_action_id=action_id,
            author_id=current_user.id,
            author_name=current_user.full_name,
            content=f"Action closed: {data.get('closing_notes')}",
            is_internal=True
        )
        await db.disciplinary_notes.insert_one(note.model_dump())
    
    return await db.disciplinary_actions.find_one({"id": action_id}, {"_id": 0})

@api_router.delete("/disciplinary/actions/{action_id}")
async def delete_disciplinary_action(action_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete disciplinary actions")
    
    result = await db.disciplinary_actions.delete_one({"id": action_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Disciplinary action not found")
    
    # Delete associated notes and appeals
    await db.disciplinary_notes.delete_many({"disciplinary_action_id": action_id})
    await db.disciplinary_appeals.delete_many({"disciplinary_action_id": action_id})
    
    return {"message": "Disciplinary action deleted"}

# ============= TRAVEL MODELS =============

class TravelRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str = Field(default_factory=lambda: f"TR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    
    # Trip Details
    trip_type: str = "domestic"  # domestic, international
    purpose: str  # business_meeting, conference, training, client_visit, site_visit, other
    purpose_details: Optional[str] = None
    destination_city: str
    destination_country: str = ""
    departure_date: str
    return_date: str
    
    # Transportation
    transportation_type: str = "flight"  # flight, train, bus, car, rental, other
    transportation_details: Optional[str] = None
    flight_class: Optional[str] = None  # economy, business, first
    
    # Accommodation
    accommodation_required: bool = True
    accommodation_type: Optional[str] = None  # hotel, airbnb, company_guest_house, other
    accommodation_details: Optional[str] = None
    hotel_name: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    
    # Budget
    estimated_transportation_cost: float = 0
    estimated_accommodation_cost: float = 0
    estimated_meals_cost: float = 0
    estimated_other_cost: float = 0
    total_estimated_cost: float = 0
    currency: str = "USD"
    
    # Actual Costs (filled after trip)
    actual_transportation_cost: Optional[float] = None
    actual_accommodation_cost: Optional[float] = None
    actual_meals_cost: Optional[float] = None
    actual_other_cost: Optional[float] = None
    total_actual_cost: Optional[float] = None
    
    # Itinerary
    itinerary: Optional[str] = None
    meetings_scheduled: Optional[str] = None
    
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    # Status & Approval
    status: str = "pending"  # pending, approved, rejected, in_progress, completed, cancelled
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Workflow
    workflow_instance_id: Optional[str] = None
    
    # Documents
    supporting_documents: Optional[List[str]] = Field(default_factory=list)
    
    # Completion
    trip_report: Optional[str] = None
    trip_completed_at: Optional[str] = None
    
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= TRAVEL API ENDPOINTS =============

@api_router.get("/travel/stats")
async def get_travel_stats(current_user: User = Depends(get_current_user)):
    """Get travel statistics for admin dashboard"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view travel stats")
    
    total = await db.travel_requests.count_documents({})
    pending = await db.travel_requests.count_documents({"status": "pending"})
    approved = await db.travel_requests.count_documents({"status": "approved"})
    in_progress = await db.travel_requests.count_documents({"status": "in_progress"})
    completed = await db.travel_requests.count_documents({"status": "completed"})
    rejected = await db.travel_requests.count_documents({"status": "rejected"})
    
    # Calculate total budget
    pipeline = [
        {"$match": {"status": {"$in": ["approved", "in_progress", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_estimated_cost"}}}
    ]
    budget_result = await db.travel_requests.aggregate(pipeline).to_list(1)
    total_budget = budget_result[0]["total"] if budget_result else 0
    
    # Actual spent
    pipeline_actual = [
        {"$match": {"status": "completed", "total_actual_cost": {"$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_actual_cost"}}}
    ]
    actual_result = await db.travel_requests.aggregate(pipeline_actual).to_list(1)
    total_actual = actual_result[0]["total"] if actual_result else 0
    
    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "in_progress": in_progress,
        "completed": completed,
        "rejected": rejected,
        "total_budget": total_budget,
        "total_actual": total_actual
    }

@api_router.get("/travel/my")
async def get_my_travel_requests(current_user: User = Depends(get_current_user)):
    """Get current employee's travel requests"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    
    requests = await db.travel_requests.find(
        {"employee_id": employee["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.get("/travel")
async def get_travel_requests(
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all travel requests (admin) or filtered"""
    query = {}
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        # Non-admins can only see their own requests
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if employee:
            query["employee_id"] = employee["id"]
        else:
            return []
    else:
        if employee_id:
            query["employee_id"] = employee_id
    
    if status:
        query["status"] = status
    
    requests = await db.travel_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests

@api_router.get("/travel/{request_id}")
async def get_travel_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific travel request"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return request

@api_router.post("/travel")
async def create_travel_request(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new travel request"""
    # Get employee info
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Get department name
    dept_name = None
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            dept_name = dept.get("name")
    
    # Calculate total estimated cost
    total_cost = (
        float(data.get("estimated_transportation_cost", 0) or 0) +
        float(data.get("estimated_accommodation_cost", 0) or 0) +
        float(data.get("estimated_meals_cost", 0) or 0) +
        float(data.get("estimated_other_cost", 0) or 0)
    )
    
    travel_data = {
        **data,
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "employee_email": employee.get("work_email") or employee.get("personal_email"),
        "department": dept_name,
        "total_estimated_cost": total_cost,
        "status": "pending"
    }
    
    travel_request = TravelRequest(**travel_data)
    await db.travel_requests.insert_one(travel_request.model_dump())
    
    return travel_request.model_dump()

@api_router.put("/travel/{request_id}")
async def update_travel_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a travel request"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        # Employees can only update pending requests
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only edit pending requests")
    
    # Recalculate total if cost fields changed
    if any(k in data for k in ["estimated_transportation_cost", "estimated_accommodation_cost", "estimated_meals_cost", "estimated_other_cost"]):
        data["total_estimated_cost"] = (
            float(data.get("estimated_transportation_cost", request.get("estimated_transportation_cost", 0)) or 0) +
            float(data.get("estimated_accommodation_cost", request.get("estimated_accommodation_cost", 0)) or 0) +
            float(data.get("estimated_meals_cost", request.get("estimated_meals_cost", 0)) or 0) +
            float(data.get("estimated_other_cost", request.get("estimated_other_cost", 0)) or 0)
        )
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.travel_requests.update_one({"id": request_id}, {"$set": data})
    
    updated = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    return updated

@api_router.post("/travel/{request_id}/approve")
async def approve_travel_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Approve a travel request"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can approve travel requests")
    
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
    
    await db.travel_requests.update_one({"id": request_id}, {"$set": {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.travel_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/travel/{request_id}/reject")
async def reject_travel_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject a travel request"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can reject travel requests")
    
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
    
    await db.travel_requests.update_one({"id": request_id}, {"$set": {
        "status": "rejected",
        "rejection_reason": data.get("reason", ""),
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.travel_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/travel/{request_id}/start")
async def start_travel(request_id: str, current_user: User = Depends(get_current_user)):
    """Mark travel as started (in progress)"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if request["status"] != "approved":
        raise HTTPException(status_code=400, detail="Only approved requests can be started")
    
    await db.travel_requests.update_one({"id": request_id}, {"$set": {
        "status": "in_progress",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.travel_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/travel/{request_id}/complete")
async def complete_travel(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Mark travel as completed with actual expenses and report"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if request["status"] not in ["approved", "in_progress"]:
        raise HTTPException(status_code=400, detail="Only approved or in-progress requests can be completed")
    
    # Calculate actual total
    total_actual = (
        float(data.get("actual_transportation_cost", 0) or 0) +
        float(data.get("actual_accommodation_cost", 0) or 0) +
        float(data.get("actual_meals_cost", 0) or 0) +
        float(data.get("actual_other_cost", 0) or 0)
    )
    
    update_data = {
        "status": "completed",
        "actual_transportation_cost": data.get("actual_transportation_cost"),
        "actual_accommodation_cost": data.get("actual_accommodation_cost"),
        "actual_meals_cost": data.get("actual_meals_cost"),
        "actual_other_cost": data.get("actual_other_cost"),
        "total_actual_cost": total_actual,
        "trip_report": data.get("trip_report"),
        "trip_completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.travel_requests.update_one({"id": request_id}, {"$set": update_data})
    
    return await db.travel_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/travel/{request_id}/cancel")
async def cancel_travel_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a travel request"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if request["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or already cancelled requests")
    
    await db.travel_requests.update_one({"id": request_id}, {"$set": {
        "status": "cancelled",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.travel_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.delete("/travel/{request_id}")
async def delete_travel_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Delete a travel request (admin only or own pending request)"""
    request = await db.travel_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Travel request not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only delete pending requests")
    
    await db.travel_requests.delete_one({"id": request_id})
    return {"message": "Travel request deleted"}

@api_router.get("/travel/export")
async def export_travel_requests(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export travel requests as JSON for CSV conversion"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can export travel data")
    
    query = {}
    if status:
        query["status"] = status
    if start_date:
        query["departure_date"] = {"$gte": start_date}
    if end_date:
        if "departure_date" in query:
            query["departure_date"]["$lte"] = end_date
        else:
            query["departure_date"] = {"$lte": end_date}
    
    requests = await db.travel_requests.find(query, {"_id": 0}).sort("departure_date", -1).to_list(10000)
    return {"records": requests, "total": len(requests)}

# ============= RECOGNITION & AWARDS MODELS =============

class RecognitionCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon: str = "star"  # icon name for display
    points: int = 10  # points awarded for this type
    color: str = "#6366f1"  # color for badges
    is_nomination_required: bool = False  # requires admin approval
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Recognition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Recipient info
    recipient_id: str
    recipient_name: Optional[str] = None
    recipient_department: Optional[str] = None
    
    # Giver info
    giver_id: str
    giver_name: Optional[str] = None
    giver_department: Optional[str] = None
    
    # Recognition details
    category_id: str
    category_name: Optional[str] = None
    title: str
    message: str
    points: int = 0
    
    # Visibility
    is_public: bool = True
    
    # Status for nominations
    status: str = "approved"  # approved, pending (for nominations)
    
    # Reactions/engagement
    likes: List[str] = Field(default_factory=list)  # user_ids who liked
    comments: List[Dict[str, Any]] = Field(default_factory=list)
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Nomination(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Nominee
    nominee_id: str
    nominee_name: Optional[str] = None
    nominee_department: Optional[str] = None
    
    # Nominator
    nominator_id: str
    nominator_name: Optional[str] = None
    
    # Award category
    category_id: str
    category_name: Optional[str] = None
    
    # Nomination details
    reason: str
    achievements: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, approved, rejected
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_notes: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= RECOGNITION API ENDPOINTS =============

@api_router.get("/recognition/categories")
async def get_recognition_categories(current_user: User = Depends(get_current_user)):
    """Get all recognition categories"""
    categories = await db.recognition_categories.find({}, {"_id": 0}).to_list(100)
    
    # Seed default categories if none exist
    if not categories:
        default_categories = [
            {"id": str(uuid.uuid4()), "name": "Star Performer", "description": "Outstanding performance", "icon": "star", "points": 50, "color": "#f59e0b", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Team Player", "description": "Excellent teamwork and collaboration", "icon": "users", "points": 30, "color": "#3b82f6", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Innovation", "description": "Creative thinking and innovation", "icon": "lightbulb", "points": 40, "color": "#8b5cf6", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Customer Champion", "description": "Exceptional customer service", "icon": "heart", "points": 35, "color": "#ec4899", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Rising Star", "description": "New employee showing great potential", "icon": "rocket", "points": 25, "color": "#10b981", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Employee of the Month", "description": "Top performer of the month", "icon": "award", "points": 100, "color": "#f97316", "is_nomination_required": True, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Leadership", "description": "Demonstrating leadership qualities", "icon": "crown", "points": 45, "color": "#6366f1", "is_nomination_required": False, "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Thank You", "description": "Simple appreciation", "icon": "thumbs-up", "points": 10, "color": "#14b8a6", "is_nomination_required": False, "is_active": True},
        ]
        for cat in default_categories:
            cat["created_at"] = datetime.now(timezone.utc).isoformat()
            cat["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.recognition_categories.insert_many(default_categories)
        # Re-fetch to exclude _id
        categories = await db.recognition_categories.find({}, {"_id": 0}).to_list(100)
    
    return categories

@api_router.post("/recognition/categories")
async def create_recognition_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new recognition category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage categories")
    
    category = RecognitionCategory(**data)
    await db.recognition_categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/recognition/categories/{category_id}")
async def update_recognition_category(category_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a recognition category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage categories")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.recognition_categories.update_one({"id": category_id}, {"$set": data})
    return await db.recognition_categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/recognition/categories/{category_id}")
async def delete_recognition_category(category_id: str, current_user: User = Depends(get_current_user)):
    """Delete a recognition category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage categories")
    
    await db.recognition_categories.delete_one({"id": category_id})
    return {"message": "Category deleted"}

@api_router.get("/recognition/stats")
async def get_recognition_stats(current_user: User = Depends(get_current_user)):
    """Get recognition statistics"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    total = await db.recognitions.count_documents({"status": "approved"})
    this_month = await db.recognitions.count_documents({
        "status": "approved",
        "created_at": {"$gte": datetime.now(timezone.utc).replace(day=1).isoformat()}
    })
    
    # Total points given
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]
    points_result = await db.recognitions.aggregate(pipeline).to_list(1)
    total_points = points_result[0]["total"] if points_result else 0
    
    # Pending nominations (admin only)
    pending_nominations = 0
    if is_admin:
        pending_nominations = await db.nominations.count_documents({"status": "pending"})
    
    # Top categories
    cat_pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": "$category_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_categories = await db.recognitions.aggregate(cat_pipeline).to_list(5)
    
    return {
        "total_recognitions": total,
        "this_month": this_month,
        "total_points": total_points,
        "pending_nominations": pending_nominations,
        "top_categories": top_categories
    }

@api_router.get("/recognition/wall")
async def get_recognition_wall(
    limit: int = 50,
    skip: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get public recognition wall/feed"""
    recognitions = await db.recognitions.find(
        {"is_public": True, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return recognitions

@api_router.get("/recognition/my")
async def get_my_recognitions(current_user: User = Depends(get_current_user)):
    """Get current user's recognitions (received and given)"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return {"received": [], "given": [], "total_points": 0}
    
    received = await db.recognitions.find(
        {"recipient_id": employee["id"], "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    given = await db.recognitions.find(
        {"giver_id": employee["id"], "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    total_points = sum(r.get("points", 0) for r in received)
    
    return {
        "received": received,
        "given": given,
        "total_points": total_points
    }

@api_router.get("/recognition/leaderboard")
async def get_recognition_leaderboard(
    period: str = "all",  # all, month, quarter, year
    current_user: User = Depends(get_current_user)
):
    """Get recognition leaderboard"""
    match_query = {"status": "approved"}
    
    if period == "month":
        match_query["created_at"] = {"$gte": datetime.now(timezone.utc).replace(day=1).isoformat()}
    elif period == "quarter":
        now = datetime.now(timezone.utc)
        quarter_start = now.replace(month=((now.month - 1) // 3) * 3 + 1, day=1)
        match_query["created_at"] = {"$gte": quarter_start.isoformat()}
    elif period == "year":
        match_query["created_at"] = {"$gte": datetime.now(timezone.utc).replace(month=1, day=1).isoformat()}
    
    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$recipient_id",
            "name": {"$first": "$recipient_name"},
            "department": {"$first": "$recipient_department"},
            "total_points": {"$sum": "$points"},
            "recognition_count": {"$sum": 1}
        }},
        {"$sort": {"total_points": -1}},
        {"$limit": 20}
    ]
    
    leaderboard = await db.recognitions.aggregate(pipeline).to_list(20)
    
    # Add rank
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
        entry["employee_id"] = entry.pop("_id")
    
    return leaderboard

@api_router.get("/recognition")
async def get_recognitions(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all recognitions (admin) or filtered"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    if status:
        query["status"] = status
    elif not is_admin:
        query["status"] = "approved"
    
    if category_id:
        query["category_id"] = category_id
    
    recognitions = await db.recognitions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return recognitions

@api_router.post("/recognition")
async def create_recognition(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Give recognition to someone"""
    # Get giver info
    giver = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not giver:
        # Admin without employee profile
        giver_id = current_user.id
        giver_name = current_user.full_name
        giver_dept = None
    else:
        giver_id = giver["id"]
        giver_name = giver.get("full_name")
        if giver.get("department_id"):
            dept = await db.departments.find_one({"id": giver["department_id"]}, {"_id": 0})
            giver_dept = dept.get("name") if dept else None
        else:
            giver_dept = None
    
    # Get recipient info
    recipient = await db.employees.find_one({"id": data.get("recipient_id")}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    recipient_dept = None
    if recipient.get("department_id"):
        dept = await db.departments.find_one({"id": recipient["department_id"]}, {"_id": 0})
        recipient_dept = dept.get("name") if dept else None
    
    # Get category
    category = await db.recognition_categories.find_one({"id": data.get("category_id")}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Determine status
    status = "approved"
    if category.get("is_nomination_required"):
        status = "pending"
    
    recognition_data = {
        "recipient_id": recipient["id"],
        "recipient_name": recipient.get("full_name"),
        "recipient_department": recipient_dept,
        "giver_id": giver_id,
        "giver_name": giver_name,
        "giver_department": giver_dept,
        "category_id": category["id"],
        "category_name": category["name"],
        "title": data.get("title", category["name"]),
        "message": data.get("message", ""),
        "points": category.get("points", 0),
        "is_public": data.get("is_public", True),
        "status": status
    }
    
    recognition = Recognition(**recognition_data)
    await db.recognitions.insert_one(recognition.model_dump())
    
    return recognition.model_dump()

@api_router.post("/recognition/{recognition_id}/like")
async def like_recognition(recognition_id: str, current_user: User = Depends(get_current_user)):
    """Like/unlike a recognition"""
    recognition = await db.recognitions.find_one({"id": recognition_id}, {"_id": 0})
    if not recognition:
        raise HTTPException(status_code=404, detail="Recognition not found")
    
    likes = recognition.get("likes", [])
    if current_user.id in likes:
        likes.remove(current_user.id)
    else:
        likes.append(current_user.id)
    
    await db.recognitions.update_one({"id": recognition_id}, {"$set": {"likes": likes}})
    return {"likes": len(likes), "liked": current_user.id in likes}

@api_router.post("/recognition/{recognition_id}/comment")
async def comment_on_recognition(recognition_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a comment to a recognition"""
    recognition = await db.recognitions.find_one({"id": recognition_id}, {"_id": 0})
    if not recognition:
        raise HTTPException(status_code=404, detail="Recognition not found")
    
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "text": data.get("text", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.recognitions.update_one(
        {"id": recognition_id},
        {"$push": {"comments": comment}}
    )
    
    return comment

@api_router.delete("/recognition/{recognition_id}")
async def delete_recognition(recognition_id: str, current_user: User = Depends(get_current_user)):
    """Delete a recognition (admin only or own)"""
    recognition = await db.recognitions.find_one({"id": recognition_id}, {"_id": 0})
    if not recognition:
        raise HTTPException(status_code=404, detail="Recognition not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin and recognition["giver_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.recognitions.delete_one({"id": recognition_id})
    return {"message": "Recognition deleted"}

# ============= NOMINATIONS API ENDPOINTS =============

@api_router.get("/recognition/nominations")
async def get_nominations(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get nominations (admin sees all, employee sees own)"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if employee:
            query["nominator_id"] = employee["id"]
        else:
            return []
    
    if status:
        query["status"] = status
    
    nominations = await db.nominations.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return nominations

@api_router.post("/recognition/nominations")
async def create_nomination(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a nomination"""
    # Get nominator info
    nominator = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not nominator:
        nominator_id = current_user.id
        nominator_name = current_user.full_name
    else:
        nominator_id = nominator["id"]
        nominator_name = nominator.get("full_name")
    
    # Get nominee info
    nominee = await db.employees.find_one({"id": data.get("nominee_id")}, {"_id": 0})
    if not nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    nominee_dept = None
    if nominee.get("department_id"):
        dept = await db.departments.find_one({"id": nominee["department_id"]}, {"_id": 0})
        nominee_dept = dept.get("name") if dept else None
    
    # Get category
    category = await db.recognition_categories.find_one({"id": data.get("category_id")}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    nomination_data = {
        "nominee_id": nominee["id"],
        "nominee_name": nominee.get("full_name"),
        "nominee_department": nominee_dept,
        "nominator_id": nominator_id,
        "nominator_name": nominator_name,
        "category_id": category["id"],
        "category_name": category["name"],
        "reason": data.get("reason", ""),
        "achievements": data.get("achievements"),
        "status": "pending"
    }
    
    nomination = Nomination(**nomination_data)
    await db.nominations.insert_one(nomination.model_dump())
    
    return nomination.model_dump()

@api_router.post("/recognition/nominations/{nomination_id}/approve")
async def approve_nomination(nomination_id: str, current_user: User = Depends(get_current_user)):
    """Approve a nomination (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can approve nominations")
    
    nomination = await db.nominations.find_one({"id": nomination_id}, {"_id": 0})
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found")
    
    if nomination["status"] != "pending":
        raise HTTPException(status_code=400, detail="Nomination already processed")
    
    # Update nomination status
    await db.nominations.update_one({"id": nomination_id}, {"$set": {
        "status": "approved",
        "reviewed_by": current_user.full_name,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }})
    
    # Get category for points
    category = await db.recognition_categories.find_one({"id": nomination["category_id"]}, {"_id": 0})
    
    # Create recognition from approved nomination
    recognition_data = {
        "recipient_id": nomination["nominee_id"],
        "recipient_name": nomination["nominee_name"],
        "recipient_department": nomination["nominee_department"],
        "giver_id": nomination["nominator_id"],
        "giver_name": nomination["nominator_name"],
        "giver_department": None,
        "category_id": nomination["category_id"],
        "category_name": nomination["category_name"],
        "title": f"{nomination['category_name']} Award",
        "message": nomination["reason"],
        "points": category.get("points", 0) if category else 0,
        "is_public": True,
        "status": "approved"
    }
    
    recognition = Recognition(**recognition_data)
    await db.recognitions.insert_one(recognition.model_dump())
    
    return {"message": "Nomination approved and recognition created"}

@api_router.post("/recognition/nominations/{nomination_id}/reject")
async def reject_nomination(nomination_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject a nomination (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can reject nominations")
    
    nomination = await db.nominations.find_one({"id": nomination_id}, {"_id": 0})
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found")
    
    await db.nominations.update_one({"id": nomination_id}, {"$set": {
        "status": "rejected",
        "reviewed_by": current_user.full_name,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_notes": data.get("notes", "")
    }})
    
    return {"message": "Nomination rejected"}

@api_router.get("/recognition/employee/{employee_id}/points")
async def get_employee_points(employee_id: str, current_user: User = Depends(get_current_user)):
    """Get total points for an employee"""
    pipeline = [
        {"$match": {"recipient_id": employee_id, "status": "approved"}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}, "count": {"$sum": 1}}}
    ]
    result = await db.recognitions.aggregate(pipeline).to_list(1)
    
    if result:
        return {"total_points": result[0]["total"], "recognition_count": result[0]["count"]}
    return {"total_points": 0, "recognition_count": 0}

# ============= TEAM CALENDAR MODELS =============

class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Event details
    title: str
    description: Optional[str] = None
    event_type: str = "meeting"  # meeting, holiday, birthday, anniversary, company_event, team_event, training, deadline, other
    
    # Timing
    start_date: str
    end_date: str
    start_time: Optional[str] = None  # HH:MM format
    end_time: Optional[str] = None
    all_day: bool = False
    timezone: str = "UTC"
    
    # Recurrence
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # daily, weekly, monthly, yearly
    recurrence_end_date: Optional[str] = None
    
    # Location
    location: Optional[str] = None
    is_virtual: bool = False
    meeting_link: Optional[str] = None
    
    # Organizer
    organizer_id: str
    organizer_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    
    # Attendees
    attendees: List[Dict[str, Any]] = Field(default_factory=list)  # [{id, name, status: pending/accepted/declined}]
    
    # Visibility
    is_public: bool = True  # visible to all employees
    is_company_wide: bool = False  # company-wide event
    
    # Colors
    color: str = "#6366f1"
    
    # Linked entities
    linked_leave_id: Optional[str] = None
    linked_training_id: Optional[str] = None
    
    # Status
    status: str = "scheduled"  # scheduled, cancelled, completed
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= TEAM CALENDAR API ENDPOINTS =============

@api_router.get("/calendar/events")
async def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None,
    department_id: Optional[str] = None,
    include_leaves: bool = True,
    include_birthdays: bool = True,
    include_anniversaries: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Get calendar events with filters"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    # Build query for custom events
    query = {"status": {"$ne": "cancelled"}}
    
    if start_date and end_date:
        query["$or"] = [
            {"start_date": {"$gte": start_date, "$lte": end_date}},
            {"end_date": {"$gte": start_date, "$lte": end_date}},
            {"$and": [{"start_date": {"$lte": start_date}}, {"end_date": {"$gte": end_date}}]}
        ]
    
    if event_type:
        query["event_type"] = event_type
    
    if department_id:
        query["department_id"] = department_id
    
    # Get custom events
    events = await db.calendar_events.find(query, {"_id": 0}).to_list(500)
    
    # Get approved leaves as events
    if include_leaves and start_date and end_date:
        leave_query = {
            "status": "approved",
            "$or": [
                {"start_date": {"$gte": start_date, "$lte": end_date}},
                {"end_date": {"$gte": start_date, "$lte": end_date}},
            ]
        }
        leaves = await db.leaves.find(leave_query, {"_id": 0}).to_list(200)
        
        for leave in leaves:
            employee = await db.employees.find_one({"id": leave.get("employee_id")}, {"_id": 0})
            emp_name = employee.get("full_name", "Employee") if employee else "Employee"
            
            events.append({
                "id": f"leave-{leave.get('id', '')}",
                "title": f"{emp_name} - {leave.get('leave_type', 'Leave')}",
                "description": leave.get("reason", ""),
                "event_type": "leave",
                "start_date": leave.get("start_date"),
                "end_date": leave.get("end_date"),
                "all_day": True,
                "color": "#f59e0b",
                "organizer_name": emp_name,
                "is_public": True,
                "linked_leave_id": leave.get("id")
            })
    
    # Get birthdays
    if include_birthdays and start_date and end_date:
        # Extract month-day range for birthday matching
        employees = await db.employees.find({"date_of_birth": {"$exists": True, "$ne": None}}, {"_id": 0}).to_list(500)
        
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else datetime.now(timezone.utc)
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else start + timedelta(days=30)
        
        for emp in employees:
            dob = emp.get("date_of_birth")
            if dob:
                try:
                    birth_date = datetime.fromisoformat(dob.replace('Z', '+00:00'))
                    # Check each year in range
                    for year in range(start.year, end.year + 1):
                        birthday_this_year = birth_date.replace(year=year)
                        if start <= birthday_this_year <= end:
                            events.append({
                                "id": f"birthday-{emp.get('id')}-{year}",
                                "title": f"🎂 {emp.get('full_name', 'Employee')}'s Birthday",
                                "event_type": "birthday",
                                "start_date": birthday_this_year.strftime("%Y-%m-%d"),
                                "end_date": birthday_this_year.strftime("%Y-%m-%d"),
                                "all_day": True,
                                "color": "#ec4899",
                                "is_public": True
                            })
                except:
                    pass
    
    # Get work anniversaries
    if include_anniversaries and start_date and end_date:
        employees = await db.employees.find({"date_of_joining": {"$exists": True, "$ne": None}}, {"_id": 0}).to_list(500)
        
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else datetime.now(timezone.utc)
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else start + timedelta(days=30)
        
        for emp in employees:
            join_date = emp.get("date_of_joining")
            if join_date:
                try:
                    joined = datetime.fromisoformat(join_date.replace('Z', '+00:00'))
                    for year in range(start.year, end.year + 1):
                        if year > joined.year:  # Only show anniversaries after first year
                            anniversary = joined.replace(year=year)
                            years = year - joined.year
                            if start <= anniversary <= end:
                                events.append({
                                    "id": f"anniversary-{emp.get('id')}-{year}",
                                    "title": f"🎉 {emp.get('full_name', 'Employee')}'s {years} Year Anniversary",
                                    "event_type": "anniversary",
                                    "start_date": anniversary.strftime("%Y-%m-%d"),
                                    "end_date": anniversary.strftime("%Y-%m-%d"),
                                    "all_day": True,
                                    "color": "#8b5cf6",
                                    "is_public": True
                                })
                except:
                    pass
    
    # Get holidays
    holidays = await db.holidays.find({}, {"_id": 0}).to_list(100)
    for holiday in holidays:
        if start_date and end_date:
            h_date = holiday.get("date", "")
            if h_date >= start_date and h_date <= end_date:
                events.append({
                    "id": f"holiday-{holiday.get('id', '')}",
                    "title": f"🏖️ {holiday.get('name', 'Holiday')}",
                    "event_type": "holiday",
                    "start_date": h_date,
                    "end_date": h_date,
                    "all_day": True,
                    "color": "#10b981",
                    "is_public": True,
                    "is_company_wide": True
                })
    
    # Sort by start date
    events.sort(key=lambda x: x.get("start_date", ""))
    
    return events

@api_router.post("/calendar/events")
async def create_calendar_event(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new calendar event"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    # Get organizer info
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    organizer_id = employee["id"] if employee else current_user.id
    organizer_name = employee.get("full_name") if employee else current_user.full_name
    
    dept_id = None
    dept_name = None
    if employee and employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            dept_id = dept["id"]
            dept_name = dept.get("name")
    
    # Only admins can create company-wide events
    if data.get("is_company_wide") and not is_admin:
        data["is_company_wide"] = False
    
    event_data = {
        **data,
        "organizer_id": organizer_id,
        "organizer_name": organizer_name,
        "department_id": dept_id,
        "department_name": dept_name,
    }
    
    event = CalendarEvent(**event_data)
    await db.calendar_events.insert_one(event.model_dump())
    
    return event.model_dump()

@api_router.get("/calendar/events/{event_id}")
async def get_calendar_event(event_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific calendar event"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@api_router.put("/calendar/events/{event_id}")
async def update_calendar_event(event_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a calendar event"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    organizer_id = employee["id"] if employee else current_user.id
    
    # Check permission
    if not is_admin and event["organizer_id"] != organizer_id:
        raise HTTPException(status_code=403, detail="Only the organizer can edit this event")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.calendar_events.update_one({"id": event_id}, {"$set": data})
    
    return await db.calendar_events.find_one({"id": event_id}, {"_id": 0})

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: User = Depends(get_current_user)):
    """Delete a calendar event"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    organizer_id = employee["id"] if employee else current_user.id
    
    if not is_admin and event["organizer_id"] != organizer_id:
        raise HTTPException(status_code=403, detail="Only the organizer can delete this event")
    
    await db.calendar_events.delete_one({"id": event_id})
    return {"message": "Event deleted"}

@api_router.post("/calendar/events/{event_id}/respond")
async def respond_to_event(event_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Respond to an event invitation (accept/decline)"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    attendee_id = employee["id"] if employee else current_user.id
    
    response_status = data.get("status", "accepted")  # accepted, declined, tentative
    
    # Update attendee status
    attendees = event.get("attendees", [])
    updated = False
    for att in attendees:
        if att.get("id") == attendee_id:
            att["status"] = response_status
            updated = True
            break
    
    if not updated:
        # Add as new attendee
        attendees.append({
            "id": attendee_id,
            "name": employee.get("full_name") if employee else current_user.full_name,
            "status": response_status
        })
    
    await db.calendar_events.update_one({"id": event_id}, {"$set": {"attendees": attendees}})
    
    return {"message": f"Response recorded: {response_status}"}

@api_router.get("/calendar/team-availability")
async def get_team_availability(
    date: str,
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get team availability for a specific date"""
    # Get employees
    emp_query = {}
    if department_id:
        emp_query["department_id"] = department_id
    
    employees = await db.employees.find(emp_query, {"_id": 0}).to_list(200)
    
    # Get leaves for this date
    leaves = await db.leaves.find({
        "status": "approved",
        "start_date": {"$lte": date},
        "end_date": {"$gte": date}
    }, {"_id": 0}).to_list(200)
    
    leave_employee_ids = {l.get("employee_id") for l in leaves}
    
    availability = []
    for emp in employees:
        is_on_leave = emp["id"] in leave_employee_ids
        leave_info = None
        if is_on_leave:
            for l in leaves:
                if l.get("employee_id") == emp["id"]:
                    leave_info = l.get("leave_type")
                    break
        
        availability.append({
            "employee_id": emp["id"],
            "employee_name": emp.get("full_name"),
            "department": emp.get("department_name"),
            "is_available": not is_on_leave,
            "leave_type": leave_info
        })
    
    return availability

@api_router.get("/calendar/upcoming")
async def get_upcoming_events(
    days: int = 7,
    current_user: User = Depends(get_current_user)
):
    """Get upcoming events for the next N days"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    end_date = (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")
    
    events = await get_calendar_events(
        start_date=today,
        end_date=end_date,
        include_leaves=True,
        include_birthdays=True,
        include_anniversaries=True,
        current_user=current_user
    )
    
    return events[:20]  # Limit to 20 events

# ============= SUCCESSION PLANNING MODELS =============

class KeyPosition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Position details
    title: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    division_id: Optional[str] = None
    division_name: Optional[str] = None
    
    # Current holder
    current_holder_id: Optional[str] = None
    current_holder_name: Optional[str] = None
    current_holder_tenure: Optional[int] = None  # years in role
    
    # Risk assessment
    criticality: str = "high"  # critical, high, medium, low
    vacancy_risk: str = "medium"  # high, medium, low
    flight_risk: str = "medium"  # high, medium, low
    
    # Succession pipeline
    succession_strength: str = "developing"  # strong, adequate, developing, weak
    target_successors: int = 2  # target number of successors
    
    # Status
    is_active: bool = True
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SuccessionCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Links
    position_id: str
    position_title: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    employee_department: Optional[str] = None
    employee_current_role: Optional[str] = None
    
    # Assessment
    readiness: str = "1-2_years"  # ready_now, 1-2_years, 3-5_years, development_needed
    potential: str = "high"  # exceptional, high, medium, limited
    performance: str = "exceeds"  # exceptional, exceeds, meets, below
    
    # 9-Box position (calculated from potential + performance)
    nine_box_position: Optional[str] = None
    
    # Development
    development_areas: List[str] = Field(default_factory=list)
    development_plan: Optional[str] = None
    mentor_id: Optional[str] = None
    mentor_name: Optional[str] = None
    
    # Progress
    progress_notes: List[Dict[str, Any]] = Field(default_factory=list)
    last_review_date: Optional[str] = None
    
    # Status
    status: str = "active"  # active, on_hold, promoted, withdrawn
    ranking: int = 1  # 1 = primary successor, 2 = secondary, etc.
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TalentPoolEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Employee
    employee_id: str
    employee_name: Optional[str] = None
    employee_department: Optional[str] = None
    employee_current_role: Optional[str] = None
    
    # Classification
    category: str = "high_potential"  # high_potential, emerging_leader, key_contributor, specialist
    
    # Assessment scores (1-5)
    leadership_potential: int = 3
    technical_expertise: int = 3
    business_acumen: int = 3
    adaptability: int = 3
    collaboration: int = 3
    
    # Career interests
    career_aspirations: Optional[str] = None
    mobility: str = "flexible"  # flexible, limited, not_mobile
    
    # Notes
    strengths: Optional[str] = None
    development_needs: Optional[str] = None
    notes: Optional[str] = None
    
    # Status
    status: str = "active"  # active, inactive, promoted, departed
    added_by: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= SUCCESSION PLANNING API ENDPOINTS =============

@api_router.get("/succession/stats")
async def get_succession_stats(current_user: User = Depends(get_current_user)):
    """Get succession planning statistics"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    total_positions = await db.key_positions.count_documents({"is_active": True})
    critical_positions = await db.key_positions.count_documents({"is_active": True, "criticality": "critical"})
    high_risk = await db.key_positions.count_documents({"is_active": True, "vacancy_risk": "high"})
    
    total_candidates = await db.succession_candidates.count_documents({"status": "active"})
    ready_now = await db.succession_candidates.count_documents({"status": "active", "readiness": "ready_now"})
    
    talent_pool_count = await db.talent_pool.count_documents({"status": "active"})
    high_potentials = await db.talent_pool.count_documents({"status": "active", "category": "high_potential"})
    
    # Succession strength breakdown
    strength_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$succession_strength", "count": {"$sum": 1}}}
    ]
    strength_data = await db.key_positions.aggregate(strength_pipeline).to_list(10)
    strength_breakdown = {item["_id"]: item["count"] for item in strength_data}
    
    return {
        "total_positions": total_positions,
        "critical_positions": critical_positions,
        "high_risk_positions": high_risk,
        "total_candidates": total_candidates,
        "ready_now_candidates": ready_now,
        "talent_pool_count": talent_pool_count,
        "high_potentials": high_potentials,
        "strength_breakdown": strength_breakdown
    }

@api_router.get("/succession/positions")
async def get_key_positions(
    criticality: Optional[str] = None,
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all key positions"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    query = {"is_active": True}
    if criticality:
        query["criticality"] = criticality
    if department_id:
        query["department_id"] = department_id
    
    positions = await db.key_positions.find(query, {"_id": 0}).sort("criticality", 1).to_list(200)
    
    # Add candidate count for each position
    for pos in positions:
        candidates = await db.succession_candidates.count_documents({
            "position_id": pos["id"],
            "status": "active"
        })
        pos["candidate_count"] = candidates
    
    return positions

@api_router.post("/succession/positions")
async def create_key_position(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new key position"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    # Get department name
    if data.get("department_id"):
        dept = await db.departments.find_one({"id": data["department_id"]}, {"_id": 0})
        if dept:
            data["department_name"] = dept.get("name")
    
    # Get current holder info
    if data.get("current_holder_id"):
        holder = await db.employees.find_one({"id": data["current_holder_id"]}, {"_id": 0})
        if holder:
            data["current_holder_name"] = holder.get("full_name")
            if holder.get("date_of_joining"):
                try:
                    joined = datetime.fromisoformat(holder["date_of_joining"].replace('Z', '+00:00'))
                    tenure = (datetime.now(timezone.utc) - joined).days // 365
                    data["current_holder_tenure"] = tenure
                except:
                    pass
    
    position = KeyPosition(**data)
    await db.key_positions.insert_one(position.model_dump())
    
    return position.model_dump()

@api_router.get("/succession/positions/{position_id}")
async def get_key_position(position_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific key position with candidates"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    position = await db.key_positions.find_one({"id": position_id}, {"_id": 0})
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Get candidates
    candidates = await db.succession_candidates.find(
        {"position_id": position_id, "status": "active"},
        {"_id": 0}
    ).sort("ranking", 1).to_list(20)
    
    position["candidates"] = candidates
    
    return position

@api_router.put("/succession/positions/{position_id}")
async def update_key_position(position_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a key position"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    position = await db.key_positions.find_one({"id": position_id}, {"_id": 0})
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Update holder info if changed
    if data.get("current_holder_id") and data["current_holder_id"] != position.get("current_holder_id"):
        holder = await db.employees.find_one({"id": data["current_holder_id"]}, {"_id": 0})
        if holder:
            data["current_holder_name"] = holder.get("full_name")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.key_positions.update_one({"id": position_id}, {"$set": data})
    
    return await db.key_positions.find_one({"id": position_id}, {"_id": 0})

@api_router.delete("/succession/positions/{position_id}")
async def delete_key_position(position_id: str, current_user: User = Depends(get_current_user)):
    """Delete a key position"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    await db.key_positions.delete_one({"id": position_id})
    # Also delete associated candidates
    await db.succession_candidates.delete_many({"position_id": position_id})
    
    return {"message": "Position and candidates deleted"}

@api_router.get("/succession/candidates")
async def get_succession_candidates(
    position_id: Optional[str] = None,
    readiness: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all succession candidates"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    query = {"status": "active"}
    if position_id:
        query["position_id"] = position_id
    if readiness:
        query["readiness"] = readiness
    
    candidates = await db.succession_candidates.find(query, {"_id": 0}).sort("ranking", 1).to_list(500)
    return candidates

@api_router.post("/succession/candidates")
async def create_succession_candidate(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a succession candidate"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    # Get position info
    position = await db.key_positions.find_one({"id": data.get("position_id")}, {"_id": 0})
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    data["position_title"] = position.get("title")
    
    # Get employee info
    employee = await db.employees.find_one({"id": data.get("employee_id")}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    data["employee_name"] = employee.get("full_name")
    data["employee_current_role"] = employee.get("job_title")
    
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            data["employee_department"] = dept.get("name")
    
    # Calculate 9-box position
    potential_map = {"exceptional": 3, "high": 3, "medium": 2, "limited": 1}
    performance_map = {"exceptional": 3, "exceeds": 3, "meets": 2, "below": 1}
    pot = potential_map.get(data.get("potential", "medium"), 2)
    perf = performance_map.get(data.get("performance", "meets"), 2)
    
    nine_box_grid = {
        (3, 3): "star", (3, 2): "high_potential", (3, 1): "potential_gem",
        (2, 3): "high_performer", (2, 2): "core_player", (2, 1): "inconsistent",
        (1, 3): "solid_performer", (1, 2): "average", (1, 1): "underperformer"
    }
    data["nine_box_position"] = nine_box_grid.get((pot, perf), "core_player")
    
    # Get mentor info
    if data.get("mentor_id"):
        mentor = await db.employees.find_one({"id": data["mentor_id"]}, {"_id": 0})
        if mentor:
            data["mentor_name"] = mentor.get("full_name")
    
    # Determine ranking
    existing = await db.succession_candidates.count_documents({
        "position_id": data["position_id"],
        "status": "active"
    })
    data["ranking"] = existing + 1
    
    candidate = SuccessionCandidate(**data)
    await db.succession_candidates.insert_one(candidate.model_dump())
    
    # Update position succession strength
    await update_position_strength(data["position_id"])
    
    return candidate.model_dump()

async def update_position_strength(position_id: str):
    """Update the succession strength of a position based on candidates"""
    candidates = await db.succession_candidates.find(
        {"position_id": position_id, "status": "active"},
        {"_id": 0}
    ).to_list(20)
    
    ready_now = sum(1 for c in candidates if c.get("readiness") == "ready_now")
    total = len(candidates)
    
    if ready_now >= 2:
        strength = "strong"
    elif ready_now >= 1 or total >= 2:
        strength = "adequate"
    elif total >= 1:
        strength = "developing"
    else:
        strength = "weak"
    
    await db.key_positions.update_one(
        {"id": position_id},
        {"$set": {"succession_strength": strength, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

@api_router.put("/succession/candidates/{candidate_id}")
async def update_succession_candidate(candidate_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a succession candidate"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    candidate = await db.succession_candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Recalculate 9-box if potential or performance changed
    if "potential" in data or "performance" in data:
        potential_map = {"exceptional": 3, "high": 3, "medium": 2, "limited": 1}
        performance_map = {"exceptional": 3, "exceeds": 3, "meets": 2, "below": 1}
        pot = potential_map.get(data.get("potential", candidate.get("potential", "medium")), 2)
        perf = performance_map.get(data.get("performance", candidate.get("performance", "meets")), 2)
        
        nine_box_grid = {
            (3, 3): "star", (3, 2): "high_potential", (3, 1): "potential_gem",
            (2, 3): "high_performer", (2, 2): "core_player", (2, 1): "inconsistent",
            (1, 3): "solid_performer", (1, 2): "average", (1, 1): "underperformer"
        }
        data["nine_box_position"] = nine_box_grid.get((pot, perf), "core_player")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.succession_candidates.update_one({"id": candidate_id}, {"$set": data})
    
    # Update position strength
    await update_position_strength(candidate["position_id"])
    
    return await db.succession_candidates.find_one({"id": candidate_id}, {"_id": 0})

@api_router.post("/succession/candidates/{candidate_id}/note")
async def add_candidate_note(candidate_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a progress note to a candidate"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    note = {
        "id": str(uuid.uuid4()),
        "text": data.get("text", ""),
        "added_by": current_user.full_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.succession_candidates.update_one(
        {"id": candidate_id},
        {
            "$push": {"progress_notes": note},
            "$set": {"last_review_date": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return note

@api_router.delete("/succession/candidates/{candidate_id}")
async def delete_succession_candidate(candidate_id: str, current_user: User = Depends(get_current_user)):
    """Delete a succession candidate"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    candidate = await db.succession_candidates.find_one({"id": candidate_id}, {"_id": 0})
    if candidate:
        position_id = candidate.get("position_id")
        await db.succession_candidates.delete_one({"id": candidate_id})
        if position_id:
            await update_position_strength(position_id)
    
    return {"message": "Candidate removed"}

# Talent Pool endpoints
@api_router.get("/succession/talent-pool")
async def get_talent_pool(
    category: Optional[str] = None,
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get talent pool entries"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    query = {"status": "active"}
    if category:
        query["category"] = category
    
    entries = await db.talent_pool.find(query, {"_id": 0}).to_list(500)
    
    # Filter by department if needed
    if department_id:
        # Get employee IDs in department
        dept_employees = await db.employees.find({"department_id": department_id}, {"id": 1, "_id": 0}).to_list(500)
        dept_emp_ids = {e["id"] for e in dept_employees}
        entries = [e for e in entries if e.get("employee_id") in dept_emp_ids]
    
    return entries

@api_router.post("/succession/talent-pool")
async def add_to_talent_pool(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add an employee to talent pool"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    # Check if already in pool
    existing = await db.talent_pool.find_one({
        "employee_id": data.get("employee_id"),
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Employee already in talent pool")
    
    # Get employee info
    employee = await db.employees.find_one({"id": data.get("employee_id")}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    data["employee_name"] = employee.get("full_name")
    data["employee_current_role"] = employee.get("job_title")
    
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            data["employee_department"] = dept.get("name")
    
    data["added_by"] = current_user.full_name
    
    entry = TalentPoolEntry(**data)
    await db.talent_pool.insert_one(entry.model_dump())
    
    return entry.model_dump()

@api_router.put("/succession/talent-pool/{entry_id}")
async def update_talent_pool_entry(entry_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a talent pool entry"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.talent_pool.update_one({"id": entry_id}, {"$set": data})
    
    return await db.talent_pool.find_one({"id": entry_id}, {"_id": 0})

@api_router.delete("/succession/talent-pool/{entry_id}")
async def remove_from_talent_pool(entry_id: str, current_user: User = Depends(get_current_user)):
    """Remove from talent pool"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage succession planning")
    
    await db.talent_pool.delete_one({"id": entry_id})
    return {"message": "Removed from talent pool"}

@api_router.get("/succession/9-box")
async def get_nine_box_data(current_user: User = Depends(get_current_user)):
    """Get 9-box grid data"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view succession planning")
    
    candidates = await db.succession_candidates.find({"status": "active"}, {"_id": 0}).to_list(500)
    
    # Group by 9-box position
    grid_data = {}
    for c in candidates:
        pos = c.get("nine_box_position", "core_player")
        if pos not in grid_data:
            grid_data[pos] = []
        grid_data[pos].append({
            "id": c["id"],
            "employee_id": c["employee_id"],
            "employee_name": c["employee_name"],
            "position_title": c.get("position_title"),
            "readiness": c.get("readiness")
        })
    
    return grid_data

@api_router.get("/succession/my-status")
async def get_my_succession_status(current_user: User = Depends(get_current_user)):
    """Get current user's succession status (if in talent pool or as candidate)"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return {"in_talent_pool": False, "succession_positions": []}
    
    # Check talent pool
    talent_entry = await db.talent_pool.find_one({
        "employee_id": employee["id"],
        "status": "active"
    }, {"_id": 0})
    
    # Check succession candidacies
    candidacies = await db.succession_candidates.find({
        "employee_id": employee["id"],
        "status": "active"
    }, {"_id": 0}).to_list(10)
    
    return {
        "in_talent_pool": talent_entry is not None,
        "talent_pool_category": talent_entry.get("category") if talent_entry else None,
        "succession_positions": [
            {
                "position_title": c.get("position_title"),
                "readiness": c.get("readiness"),
                "ranking": c.get("ranking")
            }
            for c in candidacies
        ]
    }

# ============= SKILLS MODULE MODELS =============

class SkillCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: str = "#6366f1"
    icon: str = "code"
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EmployeeSkill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Employee
    employee_id: str
    employee_name: Optional[str] = None
    
    # Skill
    skill_id: str
    skill_name: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    
    # Proficiency
    proficiency_level: int = 3  # 1-5 scale
    years_experience: Optional[float] = None
    
    # Verification
    is_verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    
    # Endorsements
    endorsement_count: int = 0
    
    # Notes
    notes: Optional[str] = None
    certifications: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SkillEndorsement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    employee_skill_id: str
    employee_id: str  # skill owner
    employee_name: Optional[str] = None
    skill_name: Optional[str] = None
    
    endorser_id: str
    endorser_name: Optional[str] = None
    
    comment: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= SKILLS API ENDPOINTS =============

@api_router.get("/skills/categories")
async def get_skill_categories(current_user: User = Depends(get_current_user)):
    """Get all skill categories"""
    categories = await db.skill_categories.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    # Seed default categories if none exist
    if not categories:
        default_categories = [
            {"id": str(uuid.uuid4()), "name": "Technical Skills", "description": "Programming, tools, and technical expertise", "color": "#3b82f6", "icon": "code", "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Soft Skills", "description": "Communication, teamwork, and interpersonal skills", "color": "#10b981", "icon": "users", "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Leadership", "description": "Management and leadership capabilities", "color": "#8b5cf6", "icon": "crown", "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Industry Knowledge", "description": "Domain expertise and industry knowledge", "color": "#f59e0b", "icon": "briefcase", "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Languages", "description": "Spoken and written languages", "color": "#ec4899", "icon": "globe", "is_active": True},
            {"id": str(uuid.uuid4()), "name": "Certifications", "description": "Professional certifications and qualifications", "color": "#14b8a6", "icon": "award", "is_active": True},
        ]
        for cat in default_categories:
            cat["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.skill_categories.insert_many(default_categories)
        categories = await db.skill_categories.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    return categories

@api_router.post("/skills/categories")
async def create_skill_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new skill category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skill categories")
    
    category = SkillCategory(**data)
    await db.skill_categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/skills/categories/{category_id}")
async def update_skill_category(category_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a skill category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skill categories")
    
    await db.skill_categories.update_one({"id": category_id}, {"$set": data})
    return await db.skill_categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/skills/categories/{category_id}")
async def delete_skill_category(category_id: str, current_user: User = Depends(get_current_user)):
    """Delete a skill category (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skill categories")
    
    await db.skill_categories.update_one({"id": category_id}, {"$set": {"is_active": False}})
    return {"message": "Category deactivated"}

@api_router.get("/skills/library")
async def get_skills_library(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get skills library"""
    query = {"is_active": True}
    if category_id:
        query["category_id"] = category_id
    
    skills = await db.skills.find(query, {"_id": 0}).to_list(500)
    
    # Seed default skills if none exist
    if not skills and not category_id:
        categories = await db.skill_categories.find({"is_active": True}, {"_id": 0}).to_list(10)
        cat_map = {c["name"]: c["id"] for c in categories}
        
        default_skills = [
            # Technical
            {"name": "Python", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "JavaScript", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "React", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "SQL", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "AWS", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "Data Analysis", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            {"name": "Machine Learning", "category_id": cat_map.get("Technical Skills", ""), "category_name": "Technical Skills"},
            # Soft Skills
            {"name": "Communication", "category_id": cat_map.get("Soft Skills", ""), "category_name": "Soft Skills"},
            {"name": "Problem Solving", "category_id": cat_map.get("Soft Skills", ""), "category_name": "Soft Skills"},
            {"name": "Teamwork", "category_id": cat_map.get("Soft Skills", ""), "category_name": "Soft Skills"},
            {"name": "Time Management", "category_id": cat_map.get("Soft Skills", ""), "category_name": "Soft Skills"},
            {"name": "Critical Thinking", "category_id": cat_map.get("Soft Skills", ""), "category_name": "Soft Skills"},
            # Leadership
            {"name": "Team Management", "category_id": cat_map.get("Leadership", ""), "category_name": "Leadership"},
            {"name": "Strategic Planning", "category_id": cat_map.get("Leadership", ""), "category_name": "Leadership"},
            {"name": "Decision Making", "category_id": cat_map.get("Leadership", ""), "category_name": "Leadership"},
            {"name": "Mentoring", "category_id": cat_map.get("Leadership", ""), "category_name": "Leadership"},
            # Languages
            {"name": "English", "category_id": cat_map.get("Languages", ""), "category_name": "Languages"},
            {"name": "Spanish", "category_id": cat_map.get("Languages", ""), "category_name": "Languages"},
            {"name": "Mandarin", "category_id": cat_map.get("Languages", ""), "category_name": "Languages"},
            {"name": "French", "category_id": cat_map.get("Languages", ""), "category_name": "Languages"},
        ]
        
        for skill in default_skills:
            skill["id"] = str(uuid.uuid4())
            skill["is_active"] = True
            skill["created_at"] = datetime.now(timezone.utc).isoformat()
        
        if default_skills:
            await db.skills.insert_many(default_skills)
            skills = await db.skills.find(query, {"_id": 0}).to_list(500)
    
    if search:
        search_lower = search.lower()
        skills = [s for s in skills if search_lower in s.get("name", "").lower()]
    
    return skills

@api_router.post("/skills/library")
async def create_skill(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new skill in the library (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skills library")
    
    # Get category name
    if data.get("category_id"):
        category = await db.skill_categories.find_one({"id": data["category_id"]}, {"_id": 0})
        if category:
            data["category_name"] = category.get("name")
    
    skill = Skill(**data)
    await db.skills.insert_one(skill.model_dump())
    return skill.model_dump()

@api_router.put("/skills/library/{skill_id}")
async def update_skill(skill_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a skill in the library (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skills library")
    
    await db.skills.update_one({"id": skill_id}, {"$set": data})
    return await db.skills.find_one({"id": skill_id}, {"_id": 0})

@api_router.delete("/skills/library/{skill_id}")
async def delete_skill(skill_id: str, current_user: User = Depends(get_current_user)):
    """Delete a skill from the library (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage skills library")
    
    await db.skills.update_one({"id": skill_id}, {"$set": {"is_active": False}})
    return {"message": "Skill deactivated"}

@api_router.get("/skills/stats")
async def get_skills_stats(current_user: User = Depends(get_current_user)):
    """Get skills statistics"""
    total_skills = await db.skills.count_documents({"is_active": True})
    total_categories = await db.skill_categories.count_documents({"is_active": True})
    total_employee_skills = await db.employee_skills.count_documents({})
    total_endorsements = await db.skill_endorsements.count_documents({})
    
    # Top skills by employee count
    pipeline = [
        {"$group": {"_id": "$skill_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_skills = await db.employee_skills.aggregate(pipeline).to_list(10)
    
    # Skills by category
    cat_pipeline = [
        {"$group": {"_id": "$category_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    skills_by_category = await db.employee_skills.aggregate(cat_pipeline).to_list(20)
    
    return {
        "total_skills": total_skills,
        "total_categories": total_categories,
        "total_employee_skills": total_employee_skills,
        "total_endorsements": total_endorsements,
        "top_skills": top_skills,
        "skills_by_category": skills_by_category
    }

@api_router.get("/skills/my")
async def get_my_skills(current_user: User = Depends(get_current_user)):
    """Get current user's skills"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    
    skills = await db.employee_skills.find(
        {"employee_id": employee["id"]},
        {"_id": 0}
    ).sort("proficiency_level", -1).to_list(100)
    
    # Get endorsements for each skill
    for skill in skills:
        endorsements = await db.skill_endorsements.find(
            {"employee_skill_id": skill["id"]},
            {"_id": 0}
        ).to_list(50)
        skill["endorsements"] = endorsements
    
    return skills

@api_router.post("/skills/my")
async def add_my_skill(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a skill to current user's profile"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Get skill info
    skill = await db.skills.find_one({"id": data.get("skill_id")}, {"_id": 0})
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Check if already has this skill
    existing = await db.employee_skills.find_one({
        "employee_id": employee["id"],
        "skill_id": skill["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have this skill")
    
    employee_skill_data = {
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "skill_id": skill["id"],
        "skill_name": skill.get("name"),
        "category_id": skill.get("category_id"),
        "category_name": skill.get("category_name"),
        "proficiency_level": data.get("proficiency_level", 3),
        "years_experience": data.get("years_experience"),
        "notes": data.get("notes"),
        "certifications": data.get("certifications")
    }
    
    emp_skill = EmployeeSkill(**employee_skill_data)
    await db.employee_skills.insert_one(emp_skill.model_dump())
    
    return emp_skill.model_dump()

@api_router.put("/skills/my/{skill_id}")
async def update_my_skill(skill_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update own skill"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    emp_skill = await db.employee_skills.find_one({"id": skill_id}, {"_id": 0})
    if not emp_skill or emp_skill["employee_id"] != employee["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.employee_skills.update_one({"id": skill_id}, {"$set": data})
    
    return await db.employee_skills.find_one({"id": skill_id}, {"_id": 0})

@api_router.delete("/skills/my/{skill_id}")
async def delete_my_skill(skill_id: str, current_user: User = Depends(get_current_user)):
    """Remove a skill from own profile"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    emp_skill = await db.employee_skills.find_one({"id": skill_id}, {"_id": 0})
    if not emp_skill or emp_skill["employee_id"] != employee["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.employee_skills.delete_one({"id": skill_id})
    await db.skill_endorsements.delete_many({"employee_skill_id": skill_id})
    
    return {"message": "Skill removed"}

@api_router.get("/skills/employee/{employee_id}")
async def get_employee_skills(employee_id: str, current_user: User = Depends(get_current_user)):
    """Get skills for a specific employee"""
    skills = await db.employee_skills.find(
        {"employee_id": employee_id},
        {"_id": 0}
    ).sort("proficiency_level", -1).to_list(100)
    
    # Get endorsements
    for skill in skills:
        endorsements = await db.skill_endorsements.find(
            {"employee_skill_id": skill["id"]},
            {"_id": 0}
        ).to_list(50)
        skill["endorsements"] = endorsements
        skill["endorsement_count"] = len(endorsements)
    
    return skills

@api_router.post("/skills/endorse/{employee_skill_id}")
async def endorse_skill(employee_skill_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Endorse someone's skill"""
    emp_skill = await db.employee_skills.find_one({"id": employee_skill_id}, {"_id": 0})
    if not emp_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Get endorser info
    endorser = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    endorser_id = endorser["id"] if endorser else current_user.id
    endorser_name = endorser.get("full_name") if endorser else current_user.full_name
    
    # Can't endorse own skill
    if emp_skill["employee_id"] == endorser_id:
        raise HTTPException(status_code=400, detail="Cannot endorse your own skill")
    
    # Check if already endorsed
    existing = await db.skill_endorsements.find_one({
        "employee_skill_id": employee_skill_id,
        "endorser_id": endorser_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already endorsed this skill")
    
    endorsement = SkillEndorsement(
        employee_skill_id=employee_skill_id,
        employee_id=emp_skill["employee_id"],
        employee_name=emp_skill.get("employee_name"),
        skill_name=emp_skill.get("skill_name"),
        endorser_id=endorser_id,
        endorser_name=endorser_name,
        comment=data.get("comment")
    )
    
    await db.skill_endorsements.insert_one(endorsement.model_dump())
    
    # Update endorsement count
    count = await db.skill_endorsements.count_documents({"employee_skill_id": employee_skill_id})
    await db.employee_skills.update_one(
        {"id": employee_skill_id},
        {"$set": {"endorsement_count": count}}
    )
    
    return endorsement.model_dump()

@api_router.delete("/skills/endorse/{endorsement_id}")
async def remove_endorsement(endorsement_id: str, current_user: User = Depends(get_current_user)):
    """Remove own endorsement"""
    endorser = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    endorser_id = endorser["id"] if endorser else current_user.id
    
    endorsement = await db.skill_endorsements.find_one({"id": endorsement_id}, {"_id": 0})
    if not endorsement or endorsement["endorser_id"] != endorser_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    employee_skill_id = endorsement["employee_skill_id"]
    await db.skill_endorsements.delete_one({"id": endorsement_id})
    
    # Update count
    count = await db.skill_endorsements.count_documents({"employee_skill_id": employee_skill_id})
    await db.employee_skills.update_one(
        {"id": employee_skill_id},
        {"$set": {"endorsement_count": count}}
    )
    
    return {"message": "Endorsement removed"}

@api_router.get("/skills/search")
async def search_employees_by_skills(
    skill_ids: str = "",  # Comma-separated skill IDs
    skill_names: str = "",  # Comma-separated skill names
    min_proficiency: int = 1,
    current_user: User = Depends(get_current_user)
):
    """Search employees by skills"""
    query = {"proficiency_level": {"$gte": min_proficiency}}
    
    if skill_ids:
        ids = [s.strip() for s in skill_ids.split(",") if s.strip()]
        if ids:
            query["skill_id"] = {"$in": ids}
    
    if skill_names:
        names = [s.strip() for s in skill_names.split(",") if s.strip()]
        if names:
            query["skill_name"] = {"$in": names}
    
    employee_skills = await db.employee_skills.find(query, {"_id": 0}).to_list(500)
    
    # Group by employee
    employees_map = {}
    for es in employee_skills:
        emp_id = es["employee_id"]
        if emp_id not in employees_map:
            employees_map[emp_id] = {
                "employee_id": emp_id,
                "employee_name": es.get("employee_name"),
                "skills": []
            }
        employees_map[emp_id]["skills"].append({
            "skill_name": es.get("skill_name"),
            "proficiency_level": es.get("proficiency_level"),
            "endorsement_count": es.get("endorsement_count", 0)
        })
    
    return list(employees_map.values())

@api_router.get("/skills/all-employees")
async def get_all_employee_skills(
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get skills for all employees (admin view)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view all employee skills")
    
    # Get employees
    emp_query = {}
    if department_id:
        emp_query["department_id"] = department_id
    
    employees = await db.employees.find(emp_query, {"_id": 0, "id": 1, "full_name": 1, "job_title": 1, "department_id": 1}).to_list(500)
    
    # Get skills for each
    result = []
    for emp in employees:
        skills = await db.employee_skills.find(
            {"employee_id": emp["id"]},
            {"_id": 0}
        ).to_list(50)
        
        if skills:
            dept_name = None
            if emp.get("department_id"):
                dept = await db.departments.find_one({"id": emp["department_id"]}, {"_id": 0})
                dept_name = dept.get("name") if dept else None
            
            result.append({
                "employee_id": emp["id"],
                "employee_name": emp.get("full_name"),
                "job_title": emp.get("job_title"),
                "department": dept_name,
                "skills": skills,
                "skill_count": len(skills),
                "avg_proficiency": sum(s.get("proficiency_level", 0) for s in skills) / len(skills) if skills else 0
            })
    
    return result

@api_router.post("/skills/verify/{employee_skill_id}")
async def verify_skill(employee_skill_id: str, current_user: User = Depends(get_current_user)):
    """Verify an employee's skill (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can verify skills")
    
    await db.employee_skills.update_one(
        {"id": employee_skill_id},
        {"$set": {
            "is_verified": True,
            "verified_by": current_user.full_name,
            "verified_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return await db.employee_skills.find_one({"id": employee_skill_id}, {"_id": 0})

# ============= OVERTIME MODELS =============

class OvertimeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_number: str = Field(default_factory=lambda: f"OT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[str] = None
    
    # Overtime Details
    date: str  # Date of overtime work
    start_time: str  # e.g., "18:00"
    end_time: str  # e.g., "22:00"
    hours: float  # Total overtime hours
    overtime_type: str = "regular"  # regular, weekend, holiday, emergency
    
    # Reason & Description
    reason: str
    tasks_performed: Optional[str] = None
    project_name: Optional[str] = None
    
    # Compensation
    rate_multiplier: float = 1.5  # 1.5x, 2x, etc.
    base_hourly_rate: Optional[float] = None
    compensation_type: str = "paid"  # paid, comp_time, both
    comp_time_hours: Optional[float] = None
    
    # Pre-approved (for planned overtime)
    is_pre_approved: bool = False
    pre_approved_by: Optional[str] = None
    pre_approved_at: Optional[str] = None
    
    # Status & Approval
    status: str = "pending"  # pending, approved, rejected, cancelled, completed
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Manager
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    notes: Optional[str] = None
    attachments: Optional[List[str]] = Field(default_factory=list)
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OvertimePolicy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Rate multipliers
    regular_rate: float = 1.5  # Regular overtime (e.g., after 8 hours)
    weekend_rate: float = 1.5  # Weekend overtime
    holiday_rate: float = 2.0  # Holiday overtime
    emergency_rate: float = 2.0  # Emergency call-in
    
    # Limits
    max_daily_hours: float = 4  # Max OT per day
    max_weekly_hours: float = 20  # Max OT per week
    max_monthly_hours: float = 60  # Max OT per month
    
    # Rules
    requires_pre_approval: bool = False
    pre_approval_hours_threshold: float = 2  # Require pre-approval if > X hours
    auto_approve_under_hours: Optional[float] = None  # Auto-approve if under X hours
    
    # Eligibility
    eligible_departments: Optional[List[str]] = Field(default_factory=list)  # Empty = all
    eligible_positions: Optional[List[str]] = Field(default_factory=list)  # Empty = all
    
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= OVERTIME API ENDPOINTS =============

@api_router.get("/overtime/stats")
async def get_overtime_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get overtime statistics"""
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    # Build date range
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    # Query filter
    query = {"date": {"$gte": start_date, "$lt": end_date}}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return {"total_requests": 0, "total_hours": 0, "approved_hours": 0, "pending_hours": 0}
        query["employee_id"] = employee["id"]
    
    requests = await db.overtime_requests.find(query, {"_id": 0}).to_list(1000)
    
    total_hours = sum(r.get("hours", 0) for r in requests)
    approved_hours = sum(r.get("hours", 0) for r in requests if r.get("status") == "approved")
    pending_hours = sum(r.get("hours", 0) for r in requests if r.get("status") == "pending")
    rejected_count = sum(1 for r in requests if r.get("status") == "rejected")
    
    # By type breakdown
    by_type = {}
    for r in requests:
        ot_type = r.get("overtime_type", "regular")
        if ot_type not in by_type:
            by_type[ot_type] = {"count": 0, "hours": 0}
        by_type[ot_type]["count"] += 1
        by_type[ot_type]["hours"] += r.get("hours", 0)
    
    # By status breakdown
    by_status = {}
    for r in requests:
        status = r.get("status", "pending")
        if status not in by_status:
            by_status[status] = {"count": 0, "hours": 0}
        by_status[status]["count"] += 1
        by_status[status]["hours"] += r.get("hours", 0)
    
    stats = {
        "year": year,
        "month": month,
        "total_requests": len(requests),
        "total_hours": round(total_hours, 2),
        "approved_hours": round(approved_hours, 2),
        "pending_hours": round(pending_hours, 2),
        "rejected_count": rejected_count,
        "by_type": by_type,
        "by_status": by_status
    }
    
    # Admin: add department breakdown
    if is_admin:
        by_department = {}
        for r in requests:
            dept = r.get("department") or "Unknown"
            if dept not in by_department:
                by_department[dept] = {"count": 0, "hours": 0}
            by_department[dept]["count"] += 1
            by_department[dept]["hours"] += r.get("hours", 0)
        stats["by_department"] = by_department
        
        # Top overtime employees
        by_employee = {}
        for r in requests:
            emp_name = r.get("employee_name") or "Unknown"
            if emp_name not in by_employee:
                by_employee[emp_name] = {"count": 0, "hours": 0}
            by_employee[emp_name]["count"] += 1
            by_employee[emp_name]["hours"] += r.get("hours", 0)
        
        top_employees = sorted(by_employee.items(), key=lambda x: x[1]["hours"], reverse=True)[:10]
        stats["top_employees"] = [{"name": k, **v} for k, v in top_employees]
    
    return stats

@api_router.get("/overtime")
async def get_overtime_requests(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    overtime_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get overtime requests"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["employee_id"] = employee["id"]
    else:
        if employee_id:
            query["employee_id"] = employee_id
    
    if status:
        query["status"] = status
    if overtime_type:
        query["overtime_type"] = overtime_type
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    requests = await db.overtime_requests.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    return requests

# ============= OVERTIME POLICY ENDPOINTS (must be before {request_id} routes) =============

@api_router.get("/overtime/policies")
async def get_overtime_policies(current_user: User = Depends(get_current_user)):
    """Get overtime policies"""
    policies = await db.overtime_policies.find({}, {"_id": 0}).to_list(100)
    
    # Create default policy if none exists
    if not policies:
        default_policy = OvertimePolicy(
            name="Standard Overtime Policy",
            description="Default overtime policy for all employees",
            regular_rate=1.5,
            weekend_rate=1.5,
            holiday_rate=2.0,
            emergency_rate=2.0,
            max_daily_hours=4,
            max_weekly_hours=20,
            max_monthly_hours=60,
            is_active=True
        )
        await db.overtime_policies.insert_one(default_policy.model_dump())
        policies = [default_policy.model_dump()]
    
    return policies

@api_router.post("/overtime/policies")
async def create_overtime_policy(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create an overtime policy (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage overtime policies")
    
    policy = OvertimePolicy(**data)
    await db.overtime_policies.insert_one(policy.model_dump())
    return policy.model_dump()

@api_router.put("/overtime/policies/{policy_id}")
async def update_overtime_policy(policy_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an overtime policy (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage overtime policies")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.overtime_policies.update_one({"id": policy_id}, {"$set": data})
    
    return await db.overtime_policies.find_one({"id": policy_id}, {"_id": 0})

@api_router.delete("/overtime/policies/{policy_id}")
async def delete_overtime_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    """Delete an overtime policy (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can manage overtime policies")
    
    await db.overtime_policies.delete_one({"id": policy_id})
    return {"message": "Policy deleted"}

# ============= OVERTIME REQUEST DETAIL ENDPOINTS =============

@api_router.get("/overtime/{request_id}")
async def get_overtime_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific overtime request"""
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return request

@api_router.post("/overtime")
async def create_overtime_request(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new overtime request"""
    # Get employee info
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Get department name
    dept_name = None
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            dept_name = dept.get("name")
    
    # Get manager info
    manager_name = None
    if employee.get("reporting_manager_id"):
        manager = await db.employees.find_one({"id": employee["reporting_manager_id"]}, {"_id": 0})
        if manager:
            manager_name = manager.get("full_name")
    
    # Calculate hours from start_time and end_time if not provided
    hours = data.get("hours")
    if not hours and data.get("start_time") and data.get("end_time"):
        try:
            start = datetime.strptime(data["start_time"], "%H:%M")
            end = datetime.strptime(data["end_time"], "%H:%M")
            if end < start:
                # Overtime crosses midnight
                hours = (24 - start.hour - start.minute/60) + (end.hour + end.minute/60)
            else:
                hours = (end - start).seconds / 3600
        except:
            hours = 0
    
    # Get rate multiplier based on overtime type
    rate_multiplier = 1.5
    ot_type = data.get("overtime_type", "regular")
    if ot_type == "weekend":
        rate_multiplier = 1.5
    elif ot_type == "holiday":
        rate_multiplier = 2.0
    elif ot_type == "emergency":
        rate_multiplier = 2.0
    
    overtime_data = {
        **data,
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "employee_email": employee.get("work_email") or employee.get("personal_email"),
        "department": dept_name,
        "department_id": employee.get("department_id"),
        "manager_id": employee.get("reporting_manager_id"),
        "manager_name": manager_name,
        "hours": round(hours, 2) if hours else 0,
        "rate_multiplier": data.get("rate_multiplier", rate_multiplier),
        "status": "pending"
    }
    
    overtime_request = OvertimeRequest(**overtime_data)
    await db.overtime_requests.insert_one(overtime_request.model_dump())
    
    return overtime_request.model_dump()

@api_router.put("/overtime/{request_id}")
async def update_overtime_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an overtime request"""
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        # Employees can only update pending requests
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only edit pending requests")
    
    # Recalculate hours if time changed
    if "start_time" in data or "end_time" in data:
        start_time = data.get("start_time", request.get("start_time"))
        end_time = data.get("end_time", request.get("end_time"))
        if start_time and end_time:
            try:
                start = datetime.strptime(start_time, "%H:%M")
                end = datetime.strptime(end_time, "%H:%M")
                if end < start:
                    hours = (24 - start.hour - start.minute/60) + (end.hour + end.minute/60)
                else:
                    hours = (end - start).seconds / 3600
                data["hours"] = round(hours, 2)
            except:
                pass
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.overtime_requests.update_one({"id": request_id}, {"$set": data})
    
    return await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.delete("/overtime/{request_id}")
async def delete_overtime_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Delete/cancel an overtime request"""
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != request["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        # Employees can only delete pending requests
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only cancel pending requests")
    
    await db.overtime_requests.delete_one({"id": request_id})
    return {"message": "Overtime request deleted"}

@api_router.put("/overtime/{request_id}/approve")
async def approve_overtime_request(request_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Approve an overtime request (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can approve overtime")
    
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    update_data = {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Allow adjusting hours or rate during approval
    if "hours" in data:
        update_data["hours"] = data["hours"]
    if "rate_multiplier" in data:
        update_data["rate_multiplier"] = data["rate_multiplier"]
    if "notes" in data:
        update_data["notes"] = data["notes"]
    
    await db.overtime_requests.update_one({"id": request_id}, {"$set": update_data})
    return await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/overtime/{request_id}/reject")
async def reject_overtime_request(request_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject an overtime request (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can reject overtime")
    
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    await db.overtime_requests.update_one({"id": request_id}, {"$set": {
        "status": "rejected",
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.put("/overtime/{request_id}/complete")
async def complete_overtime_request(request_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Mark overtime as completed (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can mark overtime as completed")
    
    request = await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    
    if request["status"] != "approved":
        raise HTTPException(status_code=400, detail="Only approved requests can be marked as completed")
    
    update_data = {
        "status": "completed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Allow recording actual hours worked
    if "actual_hours" in data:
        update_data["hours"] = data["actual_hours"]
    if "tasks_performed" in data:
        update_data["tasks_performed"] = data["tasks_performed"]
    
    await db.overtime_requests.update_one({"id": request_id}, {"$set": update_data})
    return await db.overtime_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.get("/overtime/export")
async def export_overtime(
    year: Optional[int] = None,
    month: Optional[int] = None,
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export overtime data (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can export overtime data")
    
    query = {}
    
    if year and month:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        query["date"] = {"$gte": start_date, "$lt": end_date}
    elif year:
        query["date"] = {"$gte": f"{year}-01-01", "$lt": f"{year + 1}-01-01"}
    
    if status:
        query["status"] = status
    if department_id:
        query["department_id"] = department_id
    
    records = await db.overtime_requests.find(query, {"_id": 0}).sort("date", -1).to_list(10000)
    
    # Calculate totals
    total_hours = sum(r.get("hours", 0) for r in records)
    approved_hours = sum(r.get("hours", 0) for r in records if r.get("status") == "approved")
    
    return {
        "records": records,
        "total": len(records),
        "total_hours": round(total_hours, 2),
        "approved_hours": round(approved_hours, 2)
    }

# ============= TIMESHEET MODELS =============

class TimeEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timesheet_id: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    
    # Date & Time
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None  # HH:MM
    break_minutes: int = 0
    hours: float = 0  # Total hours worked
    
    # Work details
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    task_description: Optional[str] = None
    work_type: str = "regular"  # regular, overtime, remote, on_site, training
    
    # Location/Notes
    location: Optional[str] = None
    notes: Optional[str] = None
    
    # Status
    is_billable: bool = True
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Timesheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[str] = None
    
    # Period
    period_type: str = "weekly"  # weekly, biweekly, monthly
    period_start: str  # YYYY-MM-DD
    period_end: str  # YYYY-MM-DD
    week_number: Optional[int] = None
    year: int
    month: int
    
    # Hours Summary
    total_hours: float = 0
    regular_hours: float = 0
    overtime_hours: float = 0
    billable_hours: float = 0
    
    # Status & Approval
    status: str = "draft"  # draft, submitted, approved, rejected, revision_requested
    submitted_at: Optional[str] = None
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Manager
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TimesheetSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Work schedule
    standard_hours_per_day: float = 8
    standard_hours_per_week: float = 40
    overtime_threshold_daily: float = 8
    overtime_threshold_weekly: float = 40
    
    # Period settings
    default_period_type: str = "weekly"  # weekly, biweekly, monthly
    week_start_day: str = "monday"  # monday, sunday
    
    # Submission rules
    submission_deadline_day: int = 1  # Day of week (0=Mon) or day of month
    auto_submit_enabled: bool = False
    require_daily_entries: bool = False
    require_project_assignment: bool = False
    
    # Break settings
    auto_deduct_break: bool = True
    default_break_minutes: int = 60
    
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= TIMESHEET API ENDPOINTS =============

def get_week_dates(date_str: str = None):
    """Get the start and end dates of the week for a given date"""
    if date_str:
        date = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        date = datetime.now()
    
    # Find Monday of the week
    start = date - timedelta(days=date.weekday())
    end = start + timedelta(days=6)
    
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

@api_router.get("/timesheets/stats")
async def get_timesheet_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get timesheet statistics"""
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {"year": year, "month": month}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return {"total_timesheets": 0, "total_hours": 0}
        query["employee_id"] = employee["id"]
    
    timesheets = await db.timesheets.find(query, {"_id": 0}).to_list(1000)
    
    total_hours = sum(t.get("total_hours", 0) for t in timesheets)
    regular_hours = sum(t.get("regular_hours", 0) for t in timesheets)
    overtime_hours = sum(t.get("overtime_hours", 0) for t in timesheets)
    billable_hours = sum(t.get("billable_hours", 0) for t in timesheets)
    
    by_status = {}
    for t in timesheets:
        status = t.get("status", "draft")
        if status not in by_status:
            by_status[status] = {"count": 0, "hours": 0}
        by_status[status]["count"] += 1
        by_status[status]["hours"] += t.get("total_hours", 0)
    
    stats = {
        "year": year,
        "month": month,
        "total_timesheets": len(timesheets),
        "total_hours": round(total_hours, 2),
        "regular_hours": round(regular_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "billable_hours": round(billable_hours, 2),
        "by_status": by_status
    }
    
    if is_admin:
        # Pending approvals
        pending = await db.timesheets.count_documents({"status": "submitted"})
        stats["pending_approvals"] = pending
        
        # By department
        by_department = {}
        for t in timesheets:
            dept = t.get("department") or "Unknown"
            if dept not in by_department:
                by_department[dept] = {"count": 0, "hours": 0}
            by_department[dept]["count"] += 1
            by_department[dept]["hours"] += t.get("total_hours", 0)
        stats["by_department"] = by_department
    
    return stats

@api_router.get("/timesheets/settings")
async def get_timesheet_settings(current_user: User = Depends(get_current_user)):
    """Get timesheet settings"""
    settings = await db.timesheet_settings.find_one({}, {"_id": 0})
    
    if not settings:
        default_settings = TimesheetSettings()
        await db.timesheet_settings.insert_one(default_settings.model_dump())
        settings = default_settings.model_dump()
    
    return settings

@api_router.put("/timesheets/settings")
async def update_timesheet_settings(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update timesheet settings (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update settings")
    
    settings = await db.timesheet_settings.find_one({}, {"_id": 0})
    if not settings:
        new_settings = TimesheetSettings(**data)
        await db.timesheet_settings.insert_one(new_settings.model_dump())
        return new_settings.model_dump()
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.timesheet_settings.update_one({}, {"$set": data})
    return await db.timesheet_settings.find_one({}, {"_id": 0})

@api_router.get("/timesheets")
async def get_timesheets(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get timesheets"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["employee_id"] = employee["id"]
    else:
        if employee_id:
            query["employee_id"] = employee_id
    
    if status:
        query["status"] = status
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    
    timesheets = await db.timesheets.find(query, {"_id": 0}).sort("period_start", -1).to_list(500)
    return timesheets

@api_router.get("/timesheets/current")
async def get_current_timesheet(current_user: User = Depends(get_current_user)):
    """Get or create current week's timesheet for the user"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Get current week dates
    today = datetime.now()
    week_start, week_end = get_week_dates(today.strftime("%Y-%m-%d"))
    
    # Check if timesheet exists
    timesheet = await db.timesheets.find_one({
        "employee_id": employee["id"],
        "period_start": week_start
    }, {"_id": 0})
    
    if not timesheet:
        # Get department name
        dept_name = None
        if employee.get("department_id"):
            dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
            if dept:
                dept_name = dept.get("name")
        
        # Get manager info
        manager_name = None
        if employee.get("reporting_manager_id"):
            manager = await db.employees.find_one({"id": employee["reporting_manager_id"]}, {"_id": 0})
            if manager:
                manager_name = manager.get("full_name")
        
        # Create new timesheet
        new_timesheet = Timesheet(
            employee_id=employee["id"],
            employee_name=employee.get("full_name"),
            department=dept_name,
            department_id=employee.get("department_id"),
            period_start=week_start,
            period_end=week_end,
            week_number=today.isocalendar()[1],
            year=today.year,
            month=today.month,
            manager_id=employee.get("reporting_manager_id"),
            manager_name=manager_name
        )
        await db.timesheets.insert_one(new_timesheet.model_dump())
        timesheet = new_timesheet.model_dump()
    
    # Get time entries for this timesheet
    entries = await db.time_entries.find({
        "timesheet_id": timesheet["id"]
    }, {"_id": 0}).sort("date", 1).to_list(100)
    
    timesheet["entries"] = entries
    return timesheet

@api_router.get("/timesheets/{timesheet_id}")
async def get_timesheet(timesheet_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific timesheet with entries"""
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != timesheet["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get entries
    entries = await db.time_entries.find({
        "timesheet_id": timesheet_id
    }, {"_id": 0}).sort("date", 1).to_list(100)
    
    timesheet["entries"] = entries
    return timesheet

@api_router.post("/timesheets")
async def create_timesheet(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new timesheet"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Get department name
    dept_name = None
    if employee.get("department_id"):
        dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
        if dept:
            dept_name = dept.get("name")
    
    # Check for existing timesheet in the same period
    existing = await db.timesheets.find_one({
        "employee_id": employee["id"],
        "period_start": data.get("period_start")
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Timesheet already exists for this period")
    
    # Calculate week number
    period_start = datetime.strptime(data["period_start"], "%Y-%m-%d")
    
    timesheet_data = {
        **data,
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "department": dept_name,
        "department_id": employee.get("department_id"),
        "week_number": period_start.isocalendar()[1],
        "year": period_start.year,
        "month": period_start.month,
        "status": "draft"
    }
    
    timesheet = Timesheet(**timesheet_data)
    await db.timesheets.insert_one(timesheet.model_dump())
    
    return timesheet.model_dump()

@api_router.put("/timesheets/{timesheet_id}")
async def update_timesheet(timesheet_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a timesheet"""
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != timesheet["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if timesheet["status"] not in ["draft", "revision_requested"]:
            raise HTTPException(status_code=400, detail="Cannot edit submitted timesheet")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": data})
    
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

@api_router.delete("/timesheets/{timesheet_id}")
async def delete_timesheet(timesheet_id: str, current_user: User = Depends(get_current_user)):
    """Delete a timesheet"""
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != timesheet["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if timesheet["status"] != "draft":
            raise HTTPException(status_code=400, detail="Cannot delete submitted timesheet")
    
    # Delete associated entries
    await db.time_entries.delete_many({"timesheet_id": timesheet_id})
    await db.timesheets.delete_one({"id": timesheet_id})
    
    return {"message": "Timesheet deleted"}

@api_router.put("/timesheets/{timesheet_id}/submit")
async def submit_timesheet(timesheet_id: str, current_user: User = Depends(get_current_user)):
    """Submit a timesheet for approval"""
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee or employee["id"] != timesheet["employee_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if timesheet["status"] not in ["draft", "revision_requested"]:
        raise HTTPException(status_code=400, detail="Timesheet already submitted")
    
    # Calculate totals from entries
    entries = await db.time_entries.find({"timesheet_id": timesheet_id}, {"_id": 0}).to_list(100)
    
    total_hours = sum(e.get("hours", 0) for e in entries)
    regular_hours = sum(e.get("hours", 0) for e in entries if e.get("work_type") != "overtime")
    overtime_hours = sum(e.get("hours", 0) for e in entries if e.get("work_type") == "overtime")
    billable_hours = sum(e.get("hours", 0) for e in entries if e.get("is_billable", True))
    
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": {
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "total_hours": round(total_hours, 2),
        "regular_hours": round(regular_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "billable_hours": round(billable_hours, 2),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

@api_router.put("/timesheets/{timesheet_id}/approve")
async def approve_timesheet(timesheet_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Approve a timesheet (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can approve timesheets")
    
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if timesheet["status"] != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted timesheets can be approved")
    
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": {
        "status": "approved",
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "notes": data.get("notes", timesheet.get("notes")),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

@api_router.put("/timesheets/{timesheet_id}/reject")
async def reject_timesheet(timesheet_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Reject a timesheet (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can reject timesheets")
    
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if timesheet["status"] != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted timesheets can be rejected")
    
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": {
        "status": "rejected",
        "approved_by": current_user.id,
        "approved_by_name": current_user.full_name,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

@api_router.put("/timesheets/{timesheet_id}/request-revision")
async def request_timesheet_revision(timesheet_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Request revision on a timesheet (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can request revisions")
    
    timesheet = await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": {
        "status": "revision_requested",
        "rejection_reason": data.get("reason", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

# ============= TIME ENTRY ENDPOINTS =============

@api_router.get("/time-entries")
async def get_time_entries(
    timesheet_id: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get time entries"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["employee_id"] = employee["id"]
    
    if timesheet_id:
        query["timesheet_id"] = timesheet_id
    if date:
        query["date"] = date
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query and isinstance(query["date"], dict):
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    entries = await db.time_entries.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    return entries

@api_router.post("/time-entries")
async def create_time_entry(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new time entry"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=400, detail="Employee profile not found")
    
    # Calculate hours if start/end time provided
    hours = data.get("hours", 0)
    if not hours and data.get("start_time") and data.get("end_time"):
        try:
            start = datetime.strptime(data["start_time"], "%H:%M")
            end = datetime.strptime(data["end_time"], "%H:%M")
            if end < start:
                hours = (24 - start.hour - start.minute/60) + (end.hour + end.minute/60)
            else:
                hours = (end - start).seconds / 3600
            # Subtract break
            break_mins = data.get("break_minutes", 0)
            hours = max(0, hours - break_mins / 60)
        except:
            hours = 0
    
    # Get project info if provided
    project_name = data.get("project_name")
    if data.get("project_id") and not project_name:
        project = await db.projects.find_one({"id": data["project_id"]}, {"_id": 0})
        if project:
            project_name = project.get("name")
    
    # Find or create timesheet for this date
    entry_date = data.get("date", datetime.now().strftime("%Y-%m-%d"))
    week_start, week_end = get_week_dates(entry_date)
    
    timesheet = await db.timesheets.find_one({
        "employee_id": employee["id"],
        "period_start": week_start
    }, {"_id": 0})
    
    if not timesheet:
        # Create timesheet
        dept_name = None
        if employee.get("department_id"):
            dept = await db.departments.find_one({"id": employee["department_id"]}, {"_id": 0})
            if dept:
                dept_name = dept.get("name")
        
        period_date = datetime.strptime(week_start, "%Y-%m-%d")
        new_timesheet = Timesheet(
            employee_id=employee["id"],
            employee_name=employee.get("full_name"),
            department=dept_name,
            department_id=employee.get("department_id"),
            period_start=week_start,
            period_end=week_end,
            week_number=period_date.isocalendar()[1],
            year=period_date.year,
            month=period_date.month
        )
        await db.timesheets.insert_one(new_timesheet.model_dump())
        timesheet = new_timesheet.model_dump()
    
    # Check if timesheet is editable
    if timesheet.get("status") not in [None, "draft", "revision_requested"]:
        raise HTTPException(status_code=400, detail="Cannot add entries to submitted timesheet")
    
    entry_data = {
        **data,
        "timesheet_id": timesheet["id"],
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "project_name": project_name,
        "hours": round(hours, 2)
    }
    
    entry = TimeEntry(**entry_data)
    await db.time_entries.insert_one(entry.model_dump())
    
    # Update timesheet totals
    await update_timesheet_totals(timesheet["id"])
    
    # Update project hours if linked to a project
    if data.get("project_id"):
        await update_project_hours(data["project_id"])
    
    return entry.model_dump()

async def update_project_hours(project_id: str):
    """Update project total hours from time entries"""
    entries = await db.time_entries.find({"project_id": project_id}, {"_id": 0}).to_list(10000)
    total_hours = sum(e.get("hours", 0) for e in entries)
    await db.projects.update_one({"id": project_id}, {"$set": {
        "total_hours": round(total_hours, 2),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})

@api_router.put("/time-entries/{entry_id}")
async def update_time_entry(entry_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a time entry"""
    entry = await db.time_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != entry["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if timesheet is editable
    if entry.get("timesheet_id"):
        timesheet = await db.timesheets.find_one({"id": entry["timesheet_id"]}, {"_id": 0})
        if timesheet and timesheet.get("status") not in [None, "draft", "revision_requested"]:
            raise HTTPException(status_code=400, detail="Cannot edit entries on submitted timesheet")
    
    # Recalculate hours if time changed
    if "start_time" in data or "end_time" in data:
        start_time = data.get("start_time", entry.get("start_time"))
        end_time = data.get("end_time", entry.get("end_time"))
        break_mins = data.get("break_minutes", entry.get("break_minutes", 0))
        
        if start_time and end_time:
            try:
                start = datetime.strptime(start_time, "%H:%M")
                end = datetime.strptime(end_time, "%H:%M")
                if end < start:
                    hours = (24 - start.hour - start.minute/60) + (end.hour + end.minute/60)
                else:
                    hours = (end - start).seconds / 3600
                hours = max(0, hours - break_mins / 60)
                data["hours"] = round(hours, 2)
            except:
                pass
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.time_entries.update_one({"id": entry_id}, {"$set": data})
    
    # Update timesheet totals
    if entry.get("timesheet_id"):
        await update_timesheet_totals(entry["timesheet_id"])
    
    return await db.time_entries.find_one({"id": entry_id}, {"_id": 0})

@api_router.delete("/time-entries/{entry_id}")
async def delete_time_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    """Delete a time entry"""
    entry = await db.time_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or employee["id"] != entry["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if timesheet is editable
    if entry.get("timesheet_id"):
        timesheet = await db.timesheets.find_one({"id": entry["timesheet_id"]}, {"_id": 0})
        if timesheet and timesheet.get("status") not in [None, "draft", "revision_requested"]:
            raise HTTPException(status_code=400, detail="Cannot delete entries on submitted timesheet")
    
    timesheet_id = entry.get("timesheet_id")
    await db.time_entries.delete_one({"id": entry_id})
    
    # Update timesheet totals
    if timesheet_id:
        await update_timesheet_totals(timesheet_id)
    
    return {"message": "Time entry deleted"}

async def update_timesheet_totals(timesheet_id: str):
    """Update timesheet hour totals from entries"""
    entries = await db.time_entries.find({"timesheet_id": timesheet_id}, {"_id": 0}).to_list(100)
    
    total_hours = sum(e.get("hours", 0) for e in entries)
    regular_hours = sum(e.get("hours", 0) for e in entries if e.get("work_type") != "overtime")
    overtime_hours = sum(e.get("hours", 0) for e in entries if e.get("work_type") == "overtime")
    billable_hours = sum(e.get("hours", 0) for e in entries if e.get("is_billable", True))
    
    await db.timesheets.update_one({"id": timesheet_id}, {"$set": {
        "total_hours": round(total_hours, 2),
        "regular_hours": round(regular_hours, 2),
        "overtime_hours": round(overtime_hours, 2),
        "billable_hours": round(billable_hours, 2),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})

@api_router.get("/timesheets/export")
async def export_timesheets(
    year: Optional[int] = None,
    month: Optional[int] = None,
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export timesheet data (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can export data")
    
    query = {}
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    if status:
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    
    timesheets = await db.timesheets.find(query, {"_id": 0}).sort("period_start", -1).to_list(10000)
    
    total_hours = sum(t.get("total_hours", 0) for t in timesheets)
    
    return {
        "timesheets": timesheets,
        "total": len(timesheets),
        "total_hours": round(total_hours, 2)
    }

# ============= PROJECT MODELS =============

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str = Field(default_factory=lambda: f"PRJ-{str(uuid.uuid4())[:6].upper()}")
    name: str
    description: Optional[str] = None
    
    # Client/Category
    client_name: Optional[str] = None
    category: Optional[str] = None  # internal, client, r&d, support
    
    # Ownership
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    
    # Status & Priority
    status: str = "planning"
    priority: str = "medium"
    
    # Dates
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    
    # Budget
    budget: float = 0
    budget_spent: float = 0
    currency: str = "USD"
    billable: bool = True
    hourly_rate: Optional[float] = None
    
    # Progress
    progress: float = 0  # 0-100
    health: str = "on_track"  # on_track, at_risk, off_track
    
    # Counts (denormalized for performance)
    member_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0
    total_hours: float = 0
    
    # Tags & Metadata
    tags: List[str] = Field(default_factory=list)
    color: str = "#6366f1"  # For UI display
    
    is_archived: bool = False
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    
    role: str = "member"  # owner, manager, lead, member, viewer
    allocation_percentage: int = 100  # 0-100, percentage of time allocated
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    hours_logged: float = 0
    
    added_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    
    title: str
    description: Optional[str] = None
    
    # Assignment
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    
    # Status & Priority
    status: str = "todo"  # todo, in_progress, in_review, completed, blocked
    priority: str = "medium"
    
    # Dates
    due_date: Optional[str] = None
    completed_at: Optional[str] = None
    
    # Estimates
    estimated_hours: Optional[float] = None
    actual_hours: float = 0
    
    # Parent task (for subtasks)
    parent_task_id: Optional[str] = None
    
    # Order
    order: int = 0
    
    tags: List[str] = Field(default_factory=list)
    
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    task_id: Optional[str] = None
    
    author_id: str
    author_name: Optional[str] = None
    content: str
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============= PROJECT API ENDPOINTS =============

@api_router.get("/projects/stats")
async def get_project_stats(current_user: User = Depends(get_current_user)):
    """Get project statistics"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    if is_admin:
        projects = await db.projects.find({"is_archived": False}, {"_id": 0}).to_list(1000)
    else:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return {"total_projects": 0}
        
        # Get projects where user is a member
        memberships = await db.project_members.find({"employee_id": employee["id"]}, {"_id": 0}).to_list(100)
        project_ids = [m["project_id"] for m in memberships]
        projects = await db.projects.find({"id": {"$in": project_ids}, "is_archived": False}, {"_id": 0}).to_list(100)
    
    by_status = {}
    by_priority = {}
    total_budget = 0
    total_spent = 0
    total_hours = 0
    
    for p in projects:
        status = p.get("status", "planning")
        priority = p.get("priority", "medium")
        
        if status not in by_status:
            by_status[status] = 0
        by_status[status] += 1
        
        if priority not in by_priority:
            by_priority[priority] = 0
        by_priority[priority] += 1
        
        total_budget += p.get("budget", 0)
        total_spent += p.get("budget_spent", 0)
        total_hours += p.get("total_hours", 0)
    
    return {
        "total_projects": len(projects),
        "active_projects": by_status.get("active", 0),
        "completed_projects": by_status.get("completed", 0),
        "by_status": by_status,
        "by_priority": by_priority,
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "total_hours": round(total_hours, 2)
    }

@api_router.get("/projects")
async def get_projects(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[str] = None,
    include_archived: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get projects"""
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    
    query = {}
    
    if not include_archived:
        query["is_archived"] = False
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if department_id:
        query["department_id"] = department_id
    
    if is_admin:
        projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    else:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        
        # Get projects where user is a member
        memberships = await db.project_members.find({"employee_id": employee["id"]}, {"_id": 0}).to_list(100)
        project_ids = [m["project_id"] for m in memberships]
        query["id"] = {"$in": project_ids}
        projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return projects

@api_router.get("/projects/all")
async def get_all_projects_simple(current_user: User = Depends(get_current_user)):
    """Get all active projects (for dropdowns)"""
    projects = await db.projects.find(
        {"is_archived": False, "status": {"$in": ["planning", "active"]}},
        {"_id": 0, "id": 1, "name": 1, "code": 1, "client_name": 1}
    ).to_list(500)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific project with details"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if employee:
            membership = await db.project_members.find_one({
                "project_id": project_id,
                "employee_id": employee["id"]
            }, {"_id": 0})
            if not membership:
                raise HTTPException(status_code=403, detail="Access denied")
    
    # Get members
    members = await db.project_members.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    
    # Get tasks
    tasks = await db.project_tasks.find({"project_id": project_id}, {"_id": 0}).sort("order", 1).to_list(500)
    
    # Get recent comments
    comments = await db.project_comments.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    project["members"] = members
    project["tasks"] = tasks
    project["comments"] = comments
    
    return project

@api_router.post("/projects")
async def create_project(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new project"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can create projects")
    
    # Get department name if provided
    dept_name = None
    if data.get("department_id"):
        dept = await db.departments.find_one({"id": data["department_id"]}, {"_id": 0})
        if dept:
            dept_name = dept.get("name")
    
    # Get manager name if provided
    manager_name = None
    if data.get("manager_id"):
        manager = await db.employees.find_one({"id": data["manager_id"]}, {"_id": 0})
        if manager:
            manager_name = manager.get("full_name")
    
    project_data = {
        **data,
        "department_name": dept_name,
        "manager_name": manager_name,
        "owner_id": current_user.id,
        "owner_name": current_user.full_name,
        "created_by": current_user.id
    }
    
    project = Project(**project_data)
    await db.projects.insert_one(project.model_dump())
    
    # Add creator as owner member
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if employee:
        owner_member = ProjectMember(
            project_id=project.id,
            employee_id=employee["id"],
            employee_name=employee.get("full_name"),
            employee_email=employee.get("work_email") or employee.get("personal_email"),
            role="owner",
            added_by=current_user.id
        )
        await db.project_members.insert_one(owner_member.model_dump())
        
        # Update project member count
        await db.projects.update_one({"id": project.id}, {"$set": {"member_count": 1}})
    
    return project.model_dump()

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if employee:
            membership = await db.project_members.find_one({
                "project_id": project_id,
                "employee_id": employee["id"],
                "role": {"$in": ["owner", "manager"]}
            }, {"_id": 0})
            if not membership:
                raise HTTPException(status_code=403, detail="Only project owners/managers can edit")
    
    # Update department name if changed
    if "department_id" in data and data["department_id"] != project.get("department_id"):
        dept = await db.departments.find_one({"id": data["department_id"]}, {"_id": 0})
        if dept:
            data["department_name"] = dept.get("name")
    
    # Update manager name if changed
    if "manager_id" in data and data["manager_id"] != project.get("manager_id"):
        manager = await db.employees.find_one({"id": data["manager_id"]}, {"_id": 0})
        if manager:
            data["manager_name"] = manager.get("full_name")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": project_id}, {"$set": data})
    
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Archive a project"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete projects")
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Archive instead of delete
    await db.projects.update_one({"id": project_id}, {"$set": {
        "is_archived": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"message": "Project archived"}

# ============= PROJECT MEMBERS =============

@api_router.get("/projects/{project_id}/members")
async def get_project_members(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project members"""
    members = await db.project_members.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    return members

@api_router.post("/projects/{project_id}/members")
async def add_project_member(project_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a member to project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    employee = await db.employees.find_one({"id": data["employee_id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if already a member
    existing = await db.project_members.find_one({
        "project_id": project_id,
        "employee_id": data["employee_id"]
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Employee already a member")
    
    member = ProjectMember(
        project_id=project_id,
        employee_id=data["employee_id"],
        employee_name=employee.get("full_name"),
        employee_email=employee.get("work_email") or employee.get("personal_email"),
        role=data.get("role", "member"),
        allocation_percentage=data.get("allocation_percentage", 100),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        added_by=current_user.id
    )
    
    await db.project_members.insert_one(member.model_dump())
    
    # Update member count
    count = await db.project_members.count_documents({"project_id": project_id})
    await db.projects.update_one({"id": project_id}, {"$set": {"member_count": count}})
    
    return member.model_dump()

@api_router.put("/projects/{project_id}/members/{member_id}")
async def update_project_member(project_id: str, member_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a project member"""
    await db.project_members.update_one({"id": member_id, "project_id": project_id}, {"$set": data})
    return await db.project_members.find_one({"id": member_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}/members/{member_id}")
async def remove_project_member(project_id: str, member_id: str, current_user: User = Depends(get_current_user)):
    """Remove a member from project"""
    await db.project_members.delete_one({"id": member_id, "project_id": project_id})
    
    # Update member count
    count = await db.project_members.count_documents({"project_id": project_id})
    await db.projects.update_one({"id": project_id}, {"$set": {"member_count": count}})
    
    return {"message": "Member removed"}

# ============= PROJECT TASKS =============

@api_router.get("/projects/{project_id}/tasks")
async def get_project_tasks(project_id: str, status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get project tasks"""
    query = {"project_id": project_id}
    if status:
        query["status"] = status
    
    tasks = await db.project_tasks.find(query, {"_id": 0}).sort("order", 1).to_list(500)
    return tasks

@api_router.post("/projects/{project_id}/tasks")
async def create_project_task(project_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a project task"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get assignee name
    assignee_name = None
    if data.get("assignee_id"):
        assignee = await db.employees.find_one({"id": data["assignee_id"]}, {"_id": 0})
        if assignee:
            assignee_name = assignee.get("full_name")
    
    # Get order
    task_count = await db.project_tasks.count_documents({"project_id": project_id})
    
    task_data = {
        **data,
        "project_id": project_id,
        "assignee_name": assignee_name,
        "order": task_count,
        "created_by": current_user.id
    }
    
    task = ProjectTask(**task_data)
    await db.project_tasks.insert_one(task.model_dump())
    
    # Update task count
    await update_project_task_counts(project_id)
    
    return task.model_dump()

@api_router.put("/projects/{project_id}/tasks/{task_id}")
async def update_project_task(project_id: str, task_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a project task"""
    task = await db.project_tasks.find_one({"id": task_id, "project_id": project_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update assignee name if changed
    if "assignee_id" in data and data["assignee_id"] != task.get("assignee_id"):
        assignee = await db.employees.find_one({"id": data["assignee_id"]}, {"_id": 0})
        if assignee:
            data["assignee_name"] = assignee.get("full_name")
    
    # Set completed_at if status changed to completed
    if data.get("status") == "completed" and task.get("status") != "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.project_tasks.update_one({"id": task_id}, {"$set": data})
    
    # Update task counts
    await update_project_task_counts(project_id)
    
    return await db.project_tasks.find_one({"id": task_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}/tasks/{task_id}")
async def delete_project_task(project_id: str, task_id: str, current_user: User = Depends(get_current_user)):
    """Delete a project task"""
    await db.project_tasks.delete_one({"id": task_id, "project_id": project_id})
    await update_project_task_counts(project_id)
    return {"message": "Task deleted"}

async def update_project_task_counts(project_id: str):
    """Update project task counts"""
    total = await db.project_tasks.count_documents({"project_id": project_id})
    completed = await db.project_tasks.count_documents({"project_id": project_id, "status": "completed"})
    progress = round((completed / total * 100) if total > 0 else 0)
    
    await db.projects.update_one({"id": project_id}, {"$set": {
        "task_count": total,
        "completed_task_count": completed,
        "progress": progress,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})

# ============= PROJECT COMMENTS =============

@api_router.post("/projects/{project_id}/comments")
async def add_project_comment(project_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a comment to project or task"""
    comment = ProjectComment(
        project_id=project_id,
        task_id=data.get("task_id"),
        author_id=current_user.id,
        author_name=current_user.full_name,
        content=data["content"]
    )
    
    await db.project_comments.insert_one(comment.model_dump())
    return comment.model_dump()

# ============= PROJECT TIME TRACKING =============

@api_router.get("/projects/{project_id}/time-entries")
async def get_project_time_entries(
    project_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get time entries for a project"""
    query = {"project_id": project_id}
    
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    entries = await db.time_entries.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Summary
    total_hours = sum(e.get("hours", 0) for e in entries)
    billable_hours = sum(e.get("hours", 0) for e in entries if e.get("is_billable", True))
    
    return {
        "entries": entries,
        "total_hours": round(total_hours, 2),
        "billable_hours": round(billable_hours, 2)
    }

@api_router.get("/projects/{project_id}/expenses")
async def get_project_expenses(project_id: str, current_user: User = Depends(get_current_user)):
    """Get expenses linked to a project"""
    expenses = await db.expense_claims.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    total = sum(e.get("amount", 0) for e in expenses)
    return {
        "expenses": expenses,
        "total": round(total, 2)
    }

# ============= PROJECT ANALYTICS =============

@api_router.get("/projects/{project_id}/analytics")
async def get_project_analytics(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project analytics"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Time entries
    time_entries = await db.time_entries.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    total_hours = sum(e.get("hours", 0) for e in time_entries)
    
    # Hours by member
    hours_by_member = {}
    for entry in time_entries:
        emp_name = entry.get("employee_name", "Unknown")
        if emp_name not in hours_by_member:
            hours_by_member[emp_name] = 0
        hours_by_member[emp_name] += entry.get("hours", 0)
    
    # Hours by week
    hours_by_week = {}
    for entry in time_entries:
        date = datetime.fromisoformat(entry["date"].replace("Z", "+00:00") if "Z" in entry.get("date", "") else entry.get("date", "2000-01-01"))
        week_key = f"{date.year}-W{date.isocalendar()[1]:02d}"
        if week_key not in hours_by_week:
            hours_by_week[week_key] = 0
        hours_by_week[week_key] += entry.get("hours", 0)
    
    # Tasks
    tasks = await db.project_tasks.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    tasks_by_status = {}
    for task in tasks:
        status = task.get("status", "todo")
        if status not in tasks_by_status:
            tasks_by_status[status] = 0
        tasks_by_status[status] += 1
    
    # Budget
    expenses = await db.expense_claims.find({"project_id": project_id, "status": "approved"}, {"_id": 0}).to_list(500)
    expense_total = sum(e.get("amount", 0) for e in expenses)
    
    # Calculate labor cost if hourly rate set
    labor_cost = 0
    if project.get("hourly_rate"):
        labor_cost = total_hours * project["hourly_rate"]
    
    total_spent = expense_total + labor_cost
    
    return {
        "total_hours": round(total_hours, 2),
        "hours_by_member": [{"name": k, "hours": round(v, 2)} for k, v in sorted(hours_by_member.items(), key=lambda x: x[1], reverse=True)],
        "hours_by_week": [{"week": k, "hours": round(v, 2)} for k, v in sorted(hours_by_week.items())[-12:]],
        "tasks_by_status": tasks_by_status,
        "task_completion_rate": round((project.get("completed_task_count", 0) / project.get("task_count", 1) * 100) if project.get("task_count") else 0),
        "budget": project.get("budget", 0),
        "expense_total": round(expense_total, 2),
        "labor_cost": round(labor_cost, 2),
        "total_spent": round(total_spent, 2),
        "budget_remaining": round(project.get("budget", 0) - total_spent, 2),
        "budget_utilization": round((total_spent / project.get("budget", 1) * 100) if project.get("budget") else 0)
    }

# ============= BENEFITS MODELS =============

class BenefitPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Plan type
    category: str  # health, dental, vision, life, disability, retirement, wellness, other
    plan_type: str  # individual, family, employee_only, employee_spouse, employee_children
    
    # Provider info
    provider_name: Optional[str] = None
    provider_contact: Optional[str] = None
    provider_website: Optional[str] = None
    
    # Costs
    employee_cost_monthly: float = 0
    employer_cost_monthly: float = 0
    deductible: float = 0
    out_of_pocket_max: float = 0
    
    # Coverage
    coverage_amount: Optional[float] = None
    coverage_details: Optional[str] = None
    
    # Eligibility
    eligibility_rules: Optional[str] = None  # e.g., "full-time employees after 30 days"
    waiting_period_days: int = 0
    eligible_employee_types: List[str] = Field(default_factory=lambda: ["full_time"])
    
    # Enrollment
    enrollment_start: Optional[str] = None
    enrollment_end: Optional[str] = None
    is_open_enrollment: bool = False
    
    # Status
    is_active: bool = True
    
    # Metadata
    corporation_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BenefitEnrollment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    plan_id: str
    plan_name: Optional[str] = None
    plan_category: Optional[str] = None
    
    # Coverage
    coverage_type: str  # individual, family, employee_spouse, employee_children
    coverage_start_date: str
    coverage_end_date: Optional[str] = None
    
    # Dependents covered
    dependents: List[Dict[str, Any]] = Field(default_factory=list)  # [{name, relationship, dob}]
    
    # Beneficiaries (for life insurance)
    beneficiaries: List[Dict[str, Any]] = Field(default_factory=list)  # [{name, relationship, percentage}]
    
    # Cost
    employee_contribution: float = 0
    employer_contribution: float = 0
    
    # Status
    status: str = "active"  # pending, active, terminated, on_hold
    termination_date: Optional[str] = None
    termination_reason: Optional[str] = None
    
    # Metadata
    enrolled_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BenefitClaim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enrollment_id: str
    employee_id: str
    employee_name: Optional[str] = None
    plan_id: str
    plan_name: Optional[str] = None
    
    # Claim details
    claim_type: str  # medical, dental, vision, prescription, wellness
    claim_date: str
    service_date: str
    provider_name: Optional[str] = None
    description: Optional[str] = None
    
    # Amounts
    claim_amount: float
    covered_amount: float = 0
    employee_responsibility: float = 0
    
    # Status
    status: str = "submitted"  # submitted, under_review, approved, denied, paid
    denial_reason: Optional[str] = None
    
    # Processing
    processed_date: Optional[str] = None
    payment_date: Optional[str] = None
    
    # Documents
    receipt_url: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============= BENEFITS API ENDPOINTS =============

@api_router.get("/benefits/stats")
async def get_benefits_stats(current_user: User = Depends(get_current_user)):
    """Get benefits statistics"""
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    plans = await db.benefit_plans.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    if is_admin:
        enrollments = await db.benefit_enrollments.find({"status": "active"}, {"_id": 0}).to_list(5000)
        claims = await db.benefit_claims.find({}, {"_id": 0}).to_list(5000)
    else:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return {"total_plans": len(plans), "my_enrollments": 0}
        enrollments = await db.benefit_enrollments.find({"employee_id": employee["id"], "status": "active"}, {"_id": 0}).to_list(100)
        claims = await db.benefit_claims.find({"employee_id": employee["id"]}, {"_id": 0}).to_list(500)
    
    # Stats by category
    by_category = {}
    for plan in plans:
        cat = plan.get("category", "other")
        if cat not in by_category:
            by_category[cat] = 0
        by_category[cat] += 1
    
    # Enrollment stats
    total_employee_cost = sum(e.get("employee_contribution", 0) for e in enrollments)
    total_employer_cost = sum(e.get("employer_contribution", 0) for e in enrollments)
    
    # Claims stats
    total_claims = len(claims)
    pending_claims = len([c for c in claims if c.get("status") in ["submitted", "under_review"]])
    total_claim_amount = sum(c.get("claim_amount", 0) for c in claims)
    
    return {
        "total_plans": len(plans),
        "active_enrollments": len(enrollments),
        "plans_by_category": by_category,
        "total_employee_cost_monthly": round(total_employee_cost, 2),
        "total_employer_cost_monthly": round(total_employer_cost, 2),
        "total_claims": total_claims,
        "pending_claims": pending_claims,
        "total_claim_amount": round(total_claim_amount, 2)
    }


@api_router.get("/benefits/plans")
async def get_benefit_plans(
    category: Optional[str] = None,
    is_active: Optional[bool] = True,
    current_user: User = Depends(get_current_user)
):
    """Get all benefit plans"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    if category:
        query["category"] = category
    
    plans = await db.benefit_plans.find(query, {"_id": 0}).sort("category", 1).to_list(100)
    return plans


@api_router.get("/benefits/plans/{plan_id}")
async def get_benefit_plan(plan_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific benefit plan"""
    plan = await db.benefit_plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get enrollment count
    enrollment_count = await db.benefit_enrollments.count_documents({"plan_id": plan_id, "status": "active"})
    plan["enrollment_count"] = enrollment_count
    
    return plan


@api_router.post("/benefits/plans")
async def create_benefit_plan(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new benefit plan"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create benefit plans")
    
    plan = BenefitPlan(**data)
    await db.benefit_plans.insert_one(plan.model_dump())
    return plan.model_dump()


@api_router.put("/benefits/plans/{plan_id}")
async def update_benefit_plan(plan_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a benefit plan"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update benefit plans")
    
    plan = await db.benefit_plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.benefit_plans.update_one({"id": plan_id}, {"$set": data})
    return await db.benefit_plans.find_one({"id": plan_id}, {"_id": 0})


@api_router.delete("/benefits/plans/{plan_id}")
async def delete_benefit_plan(plan_id: str, current_user: User = Depends(get_current_user)):
    """Deactivate a benefit plan"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete benefit plans")
    
    # Check for active enrollments
    active_enrollments = await db.benefit_enrollments.count_documents({"plan_id": plan_id, "status": "active"})
    if active_enrollments > 0:
        # Soft delete - just deactivate
        await db.benefit_plans.update_one({"id": plan_id}, {"$set": {"is_active": False}})
        return {"message": "Plan deactivated (has active enrollments)"}
    
    await db.benefit_plans.delete_one({"id": plan_id})
    return {"message": "Plan deleted"}


# Enrollments

@api_router.get("/benefits/enrollments")
async def get_benefit_enrollments(
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get benefit enrollments"""
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    query = {}
    
    if not is_admin:
        # Employees can only see their own enrollments
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["employee_id"] = employee["id"]
    elif employee_id:
        query["employee_id"] = employee_id
    
    if status:
        query["status"] = status
    if plan_id:
        query["plan_id"] = plan_id
    
    enrollments = await db.benefit_enrollments.find(query, {"_id": 0}).sort("enrolled_at", -1).to_list(1000)
    return enrollments


@api_router.get("/benefits/enrollments/my")
async def get_my_enrollments(current_user: User = Depends(get_current_user)):
    """Get current user's enrollments"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        return []
    
    enrollments = await db.benefit_enrollments.find(
        {"employee_id": employee["id"]}, 
        {"_id": 0}
    ).sort("enrolled_at", -1).to_list(100)
    
    # Enrich with plan details
    for enrollment in enrollments:
        plan = await db.benefit_plans.find_one({"id": enrollment["plan_id"]}, {"_id": 0})
        if plan:
            enrollment["plan"] = plan
    
    return enrollments


@api_router.post("/benefits/enrollments")
async def create_enrollment(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Enroll in a benefit plan"""
    plan = await db.benefit_plans.find_one({"id": data.get("plan_id")}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if not plan.get("is_active"):
        raise HTTPException(status_code=400, detail="Plan is not active")
    
    # Determine employee
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    if is_admin and data.get("employee_id"):
        employee = await db.employees.find_one({"id": data["employee_id"]}, {"_id": 0})
    else:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if already enrolled in same plan
    existing = await db.benefit_enrollments.find_one({
        "employee_id": employee["id"],
        "plan_id": plan["id"],
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this plan")
    
    enrollment_data = {
        **data,
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "plan_name": plan.get("name"),
        "plan_category": plan.get("category"),
        "employee_contribution": plan.get("employee_cost_monthly", 0),
        "employer_contribution": plan.get("employer_cost_monthly", 0),
        "status": "active" if is_admin else "pending"
    }
    
    enrollment = BenefitEnrollment(**enrollment_data)
    await db.benefit_enrollments.insert_one(enrollment.model_dump())
    return enrollment.model_dump()


@api_router.put("/benefits/enrollments/{enrollment_id}")
async def update_enrollment(enrollment_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an enrollment"""
    enrollment = await db.benefit_enrollments.find_one({"id": enrollment_id}, {"_id": 0})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or enrollment["employee_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.benefit_enrollments.update_one({"id": enrollment_id}, {"$set": data})
    return await db.benefit_enrollments.find_one({"id": enrollment_id}, {"_id": 0})


@api_router.post("/benefits/enrollments/{enrollment_id}/approve")
async def approve_enrollment(enrollment_id: str, current_user: User = Depends(get_current_user)):
    """Approve a pending enrollment"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can approve enrollments")
    
    await db.benefit_enrollments.update_one(
        {"id": enrollment_id},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Enrollment approved"}


@api_router.post("/benefits/enrollments/{enrollment_id}/terminate")
async def terminate_enrollment(enrollment_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Terminate an enrollment"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can terminate enrollments")
    
    await db.benefit_enrollments.update_one(
        {"id": enrollment_id},
        {"$set": {
            "status": "terminated",
            "termination_date": data.get("termination_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
            "termination_reason": data.get("reason"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Enrollment terminated"}


# Claims

@api_router.get("/benefits/claims")
async def get_benefit_claims(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get benefit claims"""
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    query = {}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["employee_id"] = employee["id"]
    
    if status:
        query["status"] = status
    
    claims = await db.benefit_claims.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return claims


@api_router.post("/benefits/claims")
async def submit_claim(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Submit a benefit claim"""
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify enrollment
    enrollment = await db.benefit_enrollments.find_one({"id": data.get("enrollment_id"), "status": "active"}, {"_id": 0})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Active enrollment not found")
    
    if enrollment["employee_id"] != employee["id"]:
        raise HTTPException(status_code=403, detail="Not your enrollment")
    
    plan = await db.benefit_plans.find_one({"id": enrollment["plan_id"]}, {"_id": 0})
    
    claim_data = {
        **data,
        "employee_id": employee["id"],
        "employee_name": employee.get("full_name"),
        "plan_id": enrollment["plan_id"],
        "plan_name": plan.get("name") if plan else None,
        "status": "submitted"
    }
    
    claim = BenefitClaim(**claim_data)
    await db.benefit_claims.insert_one(claim.model_dump())
    return claim.model_dump()


@api_router.put("/benefits/claims/{claim_id}")
async def update_claim(claim_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a claim (admin: process, employee: edit pending)"""
    claim = await db.benefit_claims.find_one({"id": claim_id}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or claim["employee_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        if claim["status"] != "submitted":
            raise HTTPException(status_code=400, detail="Can only edit submitted claims")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If admin is approving/denying
    if is_admin and "status" in data:
        if data["status"] == "approved":
            data["processed_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        elif data["status"] == "denied":
            data["processed_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        elif data["status"] == "paid":
            data["payment_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    await db.benefit_claims.update_one({"id": claim_id}, {"$set": data})
    return await db.benefit_claims.find_one({"id": claim_id}, {"_id": 0})


@api_router.delete("/benefits/claims/{claim_id}")
async def delete_claim(claim_id: str, current_user: User = Depends(get_current_user)):
    """Delete a submitted claim"""
    claim = await db.benefit_claims.find_one({"id": claim_id}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or claim["employee_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        if claim["status"] != "submitted":
            raise HTTPException(status_code=400, detail="Can only delete submitted claims")
    
    await db.benefit_claims.delete_one({"id": claim_id})
    return {"message": "Claim deleted"}


# Seed default benefit plans
@api_router.post("/benefits/seed-defaults")
async def seed_default_benefits(current_user: User = Depends(get_current_user)):
    """Seed default benefit plans"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can seed benefits")
    
    # Check if plans already exist
    existing = await db.benefit_plans.count_documents({})
    if existing > 0:
        return {"message": "Benefits already seeded", "count": existing}
    
    default_plans = [
        {
            "name": "Basic Health Insurance",
            "description": "Comprehensive health coverage including preventive care, hospitalization, and prescription drugs",
            "category": "health",
            "plan_type": "individual",
            "provider_name": "BlueCross BlueShield",
            "employee_cost_monthly": 150,
            "employer_cost_monthly": 450,
            "deductible": 1500,
            "out_of_pocket_max": 6000,
            "coverage_details": "80% coverage after deductible, preventive care 100% covered",
            "eligibility_rules": "Full-time employees after 30 days",
            "waiting_period_days": 30,
            "is_active": True
        },
        {
            "name": "Family Health Insurance",
            "description": "Health coverage for employee and dependents",
            "category": "health",
            "plan_type": "family",
            "provider_name": "BlueCross BlueShield",
            "employee_cost_monthly": 400,
            "employer_cost_monthly": 800,
            "deductible": 3000,
            "out_of_pocket_max": 12000,
            "coverage_details": "80% coverage after deductible for family",
            "eligibility_rules": "Full-time employees after 30 days",
            "waiting_period_days": 30,
            "is_active": True
        },
        {
            "name": "Dental Plan",
            "description": "Dental coverage including preventive, basic, and major services",
            "category": "dental",
            "plan_type": "individual",
            "provider_name": "Delta Dental",
            "employee_cost_monthly": 25,
            "employer_cost_monthly": 35,
            "deductible": 50,
            "out_of_pocket_max": 1500,
            "coverage_details": "Preventive 100%, Basic 80%, Major 50%",
            "eligibility_rules": "All employees after 30 days",
            "waiting_period_days": 30,
            "is_active": True
        },
        {
            "name": "Vision Plan",
            "description": "Vision coverage including eye exams, frames, and lenses",
            "category": "vision",
            "plan_type": "individual",
            "provider_name": "VSP",
            "employee_cost_monthly": 10,
            "employer_cost_monthly": 15,
            "deductible": 0,
            "coverage_details": "$150 frame allowance, $25 copay for exams",
            "eligibility_rules": "All employees",
            "waiting_period_days": 0,
            "is_active": True
        },
        {
            "name": "Life Insurance - Basic",
            "description": "Company-paid basic life insurance",
            "category": "life",
            "plan_type": "individual",
            "provider_name": "MetLife",
            "employee_cost_monthly": 0,
            "employer_cost_monthly": 25,
            "coverage_amount": 50000,
            "coverage_details": "1x annual salary up to $50,000",
            "eligibility_rules": "All full-time employees",
            "waiting_period_days": 0,
            "is_active": True
        },
        {
            "name": "Life Insurance - Supplemental",
            "description": "Additional voluntary life insurance",
            "category": "life",
            "plan_type": "individual",
            "provider_name": "MetLife",
            "employee_cost_monthly": 50,
            "employer_cost_monthly": 0,
            "coverage_amount": 100000,
            "coverage_details": "Up to 5x annual salary",
            "eligibility_rules": "All employees",
            "waiting_period_days": 0,
            "is_active": True
        },
        {
            "name": "401(k) Retirement Plan",
            "description": "Company 401(k) plan with employer match",
            "category": "retirement",
            "plan_type": "individual",
            "provider_name": "Fidelity",
            "employee_cost_monthly": 0,
            "employer_cost_monthly": 0,
            "coverage_details": "100% match up to 3%, 50% match on next 2%",
            "eligibility_rules": "All employees after 90 days",
            "waiting_period_days": 90,
            "is_active": True
        },
        {
            "name": "Wellness Program",
            "description": "Gym membership reimbursement and wellness incentives",
            "category": "wellness",
            "plan_type": "individual",
            "employee_cost_monthly": 0,
            "employer_cost_monthly": 50,
            "coverage_details": "$50/month gym reimbursement, wellness incentives up to $500/year",
            "eligibility_rules": "All employees",
            "waiting_period_days": 0,
            "is_active": True
        },
        {
            "name": "Short-Term Disability",
            "description": "Income protection for short-term disabilities",
            "category": "disability",
            "plan_type": "individual",
            "provider_name": "Unum",
            "employee_cost_monthly": 15,
            "employer_cost_monthly": 20,
            "coverage_details": "60% of salary up to $1,500/week for up to 26 weeks",
            "eligibility_rules": "Full-time employees after 90 days",
            "waiting_period_days": 90,
            "is_active": True
        },
        {
            "name": "Long-Term Disability",
            "description": "Income protection for long-term disabilities",
            "category": "disability",
            "plan_type": "individual",
            "provider_name": "Unum",
            "employee_cost_monthly": 25,
            "employer_cost_monthly": 30,
            "coverage_details": "60% of salary up to $10,000/month",
            "eligibility_rules": "Full-time employees after 90 days",
            "waiting_period_days": 90,
            "is_active": True
        }
    ]
    
    for plan_data in default_plans:
        plan = BenefitPlan(**plan_data)
        await db.benefit_plans.insert_one(plan.model_dump())
    
    return {"message": f"Seeded {len(default_plans)} default benefit plans"}


# ============= TICKET MANAGEMENT MODELS =============

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketCategory(str, Enum):
    IT = "it"
    HR = "hr"
    FACILITIES = "facilities"
    PAYROLL = "payroll"
    BENEFITS = "benefits"
    LEAVE = "leave"
    ONBOARDING = "onboarding"
    OTHER = "other"


class TicketComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    is_internal: bool = False  # Internal notes visible only to admins
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_number: Optional[str] = None  # Auto-generated: TKT-0001
    
    # Basic info
    subject: str
    description: str
    category: str = "other"
    priority: str = "medium"
    status: str = "open"
    
    # Requester info
    requester_id: str
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    requester_department: Optional[str] = None
    
    # Assignment
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    # Tags for categorization
    tags: List[str] = Field(default_factory=list)
    
    # Attachments
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Resolution
    resolution_notes: Optional[str] = None
    satisfaction_rating: Optional[int] = None  # 1-5
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    first_response_at: Optional[str] = None
    resolved_at: Optional[str] = None
    closed_at: Optional[str] = None
    
    # SLA
    due_date: Optional[str] = None


# ============= TICKET MANAGEMENT API ENDPOINTS =============

async def generate_ticket_number():
    """Generate next ticket number"""
    last_ticket = await db.tickets.find_one(
        {"ticket_number": {"$regex": "^TKT-"}},
        sort=[("ticket_number", -1)]
    )
    if last_ticket and last_ticket.get("ticket_number"):
        try:
            last_num = int(last_ticket["ticket_number"].split("-")[1])
            return f"TKT-{str(last_num + 1).zfill(5)}"
        except:
            pass
    return "TKT-00001"


@api_router.get("/tickets/stats")
async def get_ticket_stats(current_user: User = Depends(get_current_user)):
    """Get ticket statistics"""
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    if is_admin:
        query = {}
    else:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return {"total": 0, "open": 0, "in_progress": 0, "resolved": 0}
        query = {"requester_id": employee["id"]}
    
    all_tickets = await db.tickets.find(query, {"_id": 0}).to_list(5000)
    
    # Count by status
    status_counts = {"open": 0, "in_progress": 0, "pending": 0, "resolved": 0, "closed": 0}
    priority_counts = {"low": 0, "medium": 0, "high": 0, "urgent": 0}
    category_counts = {}
    
    for ticket in all_tickets:
        status = ticket.get("status", "open")
        if status in status_counts:
            status_counts[status] += 1
        
        priority = ticket.get("priority", "medium")
        if priority in priority_counts:
            priority_counts[priority] += 1
        
        category = ticket.get("category", "other")
        category_counts[category] = category_counts.get(category, 0) + 1
    
    # Calculate average resolution time (for resolved tickets)
    resolved_tickets = [t for t in all_tickets if t.get("resolved_at") and t.get("created_at")]
    avg_resolution_hours = 0
    if resolved_tickets:
        total_hours = 0
        for t in resolved_tickets:
            try:
                created = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                resolved = datetime.fromisoformat(t["resolved_at"].replace("Z", "+00:00"))
                total_hours += (resolved - created).total_seconds() / 3600
            except:
                pass
        avg_resolution_hours = round(total_hours / len(resolved_tickets), 1) if resolved_tickets else 0
    
    return {
        "total": len(all_tickets),
        "by_status": status_counts,
        "by_priority": priority_counts,
        "by_category": category_counts,
        "open_tickets": status_counts["open"] + status_counts["in_progress"] + status_counts["pending"],
        "avg_resolution_hours": avg_resolution_hours,
        "unassigned": len([t for t in all_tickets if not t.get("assigned_to") and t.get("status") not in ["resolved", "closed"]])
    }


@api_router.get("/tickets")
async def get_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[str] = None,
    requester_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get tickets - admins see all, employees see their own"""
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    query = {}
    
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee:
            return []
        query["requester_id"] = employee["id"]
    elif requester_id:
        query["requester_id"] = requester_id
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Search filter
    if search:
        search_lower = search.lower()
        tickets = [t for t in tickets if 
            search_lower in t.get("subject", "").lower() or
            search_lower in t.get("description", "").lower() or
            search_lower in t.get("ticket_number", "").lower() or
            search_lower in t.get("requester_name", "").lower()
        ]
    
    return tickets


# ============= TICKET TEMPLATES =============

class TicketTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    subject_template: str
    body_template: str
    category: str = "other"
    priority: str = "medium"
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/templates")
async def get_ticket_templates(current_user: User = Depends(get_current_user)):
    """Get all ticket templates"""
    templates = await db.ticket_templates.find({"is_active": True}, {"_id": 0}).to_list(100)
    return templates


@api_router.post("/tickets/templates")
async def create_ticket_template(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a ticket template (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create templates")
    
    template = TicketTemplate(**data)
    await db.ticket_templates.insert_one(template.model_dump())
    return template.model_dump()


@api_router.post("/tickets/templates/seed-defaults")
async def seed_default_templates(current_user: User = Depends(get_current_user)):
    """Seed default ticket templates"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can seed templates")
    
    existing = await db.ticket_templates.count_documents({})
    if existing > 0:
        return {"message": "Templates already exist", "count": existing}
    
    default_templates = [
        {"name": "Password Reset", "description": "Request a password reset", "subject_template": "Password Reset Request", "body_template": "I need to reset my password for [System Name].\n\nReason: [Forgot password / Account locked / Security concern]", "category": "it", "priority": "high"},
        {"name": "New Equipment Request", "description": "Request new equipment", "subject_template": "New Equipment Request - [Equipment Type]", "body_template": "Equipment Type: [Laptop/Monitor/Keyboard/Mouse/Other]\nJustification: [Reason]\nCurrent equipment status: [Working/Not working/None]", "category": "it", "priority": "medium"},
        {"name": "VPN Access Request", "description": "Request VPN access", "subject_template": "VPN Access Request", "body_template": "Purpose: [Work from home / Travel / Other]\nDuration: [Temporary / Permanent]\nStart Date: [Date]", "category": "it", "priority": "medium"},
        {"name": "Software Installation", "description": "Request software installation", "subject_template": "Software Installation Request - [Software Name]", "body_template": "Software Name: [Name]\nVersion: [If specific]\nPurpose: [Business justification]", "category": "it", "priority": "low"},
        {"name": "Leave Balance Inquiry", "description": "Question about leave balance", "subject_template": "Leave Balance Inquiry", "body_template": "Leave Type: [Annual/Sick/Personal]\nQuestion: [Describe your inquiry]", "category": "hr", "priority": "low"},
        {"name": "Payroll Discrepancy", "description": "Report paycheck issue", "subject_template": "Payroll Discrepancy - [Pay Period]", "body_template": "Pay Period: [Date range]\nExpected Amount: [Amount]\nReceived Amount: [Amount]\nDiscrepancy: [Difference]", "category": "payroll", "priority": "high"},
        {"name": "Benefits Enrollment", "description": "Benefits enrollment question", "subject_template": "Benefits Enrollment Question", "body_template": "Benefit Type: [Health/Dental/Vision/401k/Other]\nQuestion: [Your specific question]", "category": "benefits", "priority": "medium"},
        {"name": "Facility Maintenance", "description": "Report facility issue", "subject_template": "Facility Maintenance - [Issue Type]", "body_template": "Location: [Building/Floor/Room]\nIssue Type: [HVAC/Lighting/Plumbing/Other]\nDescription: [Detailed description]", "category": "facilities", "priority": "medium"}
    ]
    
    for template_data in default_templates:
        template = TicketTemplate(**template_data)
        await db.ticket_templates.insert_one(template.model_dump())
    
    return {"message": f"Seeded {len(default_templates)} default templates"}


@api_router.put("/tickets/templates/{template_id}")
async def update_ticket_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a ticket template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update templates")
    await db.ticket_templates.update_one({"id": template_id}, {"$set": data})
    return await db.ticket_templates.find_one({"id": template_id}, {"_id": 0})


@api_router.delete("/tickets/templates/{template_id}")
async def delete_ticket_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Delete a ticket template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete templates")
    await db.ticket_templates.delete_one({"id": template_id})
    return {"message": "Template deleted"}


# ============= AUTO-ASSIGNMENT RULES =============

class AssignmentRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    assignee_id: str
    assignee_name: Optional[str] = None
    priority_filter: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/assignment-rules")
async def get_assignment_rules(current_user: User = Depends(get_current_user)):
    """Get all assignment rules (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view assignment rules")
    rules = await db.assignment_rules.find({"is_active": True}, {"_id": 0}).to_list(100)
    return rules


@api_router.post("/tickets/assignment-rules")
async def create_assignment_rule(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create assignment rules")
    assignee = await db.employees.find_one({"id": data.get("assignee_id")}, {"_id": 0})
    if assignee:
        data["assignee_name"] = assignee.get("full_name")
    rule = AssignmentRule(**data)
    await db.assignment_rules.insert_one(rule.model_dump())
    return rule.model_dump()


@api_router.put("/tickets/assignment-rules/{rule_id}")
async def update_assignment_rule(rule_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update assignment rules")
    if "assignee_id" in data:
        assignee = await db.employees.find_one({"id": data["assignee_id"]}, {"_id": 0})
        if assignee:
            data["assignee_name"] = assignee.get("full_name")
    await db.assignment_rules.update_one({"id": rule_id}, {"$set": data})
    return await db.assignment_rules.find_one({"id": rule_id}, {"_id": 0})


@api_router.delete("/tickets/assignment-rules/{rule_id}")
async def delete_assignment_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    """Delete an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete assignment rules")
    await db.assignment_rules.delete_one({"id": rule_id})
    return {"message": "Rule deleted"}


# ============= CANNED RESPONSES =============

class CannedResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    shortcut: Optional[str] = None
    content: str
    category: Optional[str] = None
    is_active: bool = True
    usage_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/canned-responses")
async def get_canned_responses(category: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get canned responses (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view canned responses")
    query = {"is_active": True}
    if category:
        query["$or"] = [{"category": category}, {"category": None}]
    responses = await db.canned_responses.find(query, {"_id": 0}).sort("usage_count", -1).to_list(100)
    return responses


@api_router.post("/tickets/canned-responses")
async def create_canned_response(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create canned responses")
    response = CannedResponse(**data)
    await db.canned_responses.insert_one(response.model_dump())
    return response.model_dump()


@api_router.post("/tickets/canned-responses/seed-defaults")
async def seed_default_canned_responses(current_user: User = Depends(get_current_user)):
    """Seed default canned responses"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can seed canned responses")
    existing = await db.canned_responses.count_documents({})
    if existing > 0:
        return {"message": "Canned responses already exist", "count": existing}
    
    default_responses = [
        {"name": "Acknowledge Receipt", "shortcut": "/ack", "content": "Thank you for submitting this ticket. I've received your request and will begin working on it shortly."},
        {"name": "Request More Info", "shortcut": "/moreinfo", "content": "To better assist you, could you please provide more details about:\n1. \n2. \n3. "},
        {"name": "Password Reset Complete", "shortcut": "/pwreset", "content": "Your password has been reset successfully. Please check your email for instructions to set your new password.", "category": "it"},
        {"name": "VPN Instructions", "shortcut": "/vpn", "content": "Your VPN access has been granted. Download the client from [link], install, and use your network credentials to connect.", "category": "it"},
        {"name": "Equipment Order Placed", "shortcut": "/equipment", "content": "Your equipment request has been approved. Expected delivery: [date]. I'll notify you when it arrives.", "category": "it"},
        {"name": "Payroll Reviewed", "shortcut": "/payroll", "content": "I've reviewed your payroll inquiry. [Explanation]. Any correction will be in your next paycheck.", "category": "payroll"},
        {"name": "Leave Balance Confirmed", "shortcut": "/leave", "content": "Your current leave balances:\n- Annual: X days\n- Sick: X days\n- Personal: X days", "category": "hr"},
        {"name": "Issue Resolved", "shortcut": "/resolved", "content": "Great news! The issue has been resolved. Please test and confirm everything works. Feel free to reopen if needed."},
        {"name": "Escalation Notice", "shortcut": "/escalate", "content": "I'm escalating this to our specialized team for further investigation. You'll receive an update within [timeframe]."},
        {"name": "Facilities Work Scheduled", "shortcut": "/facilities", "content": "Your request has been scheduled.\n- Date: \n- Duration: \n- Contact: \n\nPlease ensure the area is accessible.", "category": "facilities"}
    ]
    
    for response_data in default_responses:
        response = CannedResponse(**response_data)
        await db.canned_responses.insert_one(response.model_dump())
    
    return {"message": f"Seeded {len(default_responses)} default canned responses"}


@api_router.put("/tickets/canned-responses/{response_id}")
async def update_canned_response(response_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update canned responses")
    await db.canned_responses.update_one({"id": response_id}, {"$set": data})
    return await db.canned_responses.find_one({"id": response_id}, {"_id": 0})


@api_router.delete("/tickets/canned-responses/{response_id}")
async def delete_canned_response(response_id: str, current_user: User = Depends(get_current_user)):
    """Delete a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete canned responses")
    await db.canned_responses.delete_one({"id": response_id})
    return {"message": "Response deleted"}


@api_router.post("/tickets/canned-responses/{response_id}/use")
async def use_canned_response(response_id: str, current_user: User = Depends(get_current_user)):
    """Increment usage count for a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can use canned responses")
    await db.canned_responses.update_one({"id": response_id}, {"$inc": {"usage_count": 1}})
    return await db.canned_responses.find_one({"id": response_id}, {"_id": 0})


# ============= TICKET ROUTES (with ID parameter - must be after specific routes) =============

@api_router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific ticket with comments"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check access
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or ticket["requester_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get comments
    comments = await db.ticket_comments.find(
        {"ticket_id": ticket_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Filter internal comments for non-admins
    if not is_admin:
        comments = [c for c in comments if not c.get("is_internal")]
    
    ticket["comments"] = comments
    
    return ticket


@api_router.post("/tickets")
async def create_ticket(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new ticket"""
    # Get employee info
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if employee:
        requester_id = employee["id"]
        requester_name = employee.get("full_name")
        requester_email = employee.get("work_email")
        dept = await db.departments.find_one({"id": employee.get("department_id")}, {"_id": 0})
        requester_department = dept.get("name") if dept else None
    else:
        requester_id = current_user.id
        requester_name = current_user.full_name
        requester_email = current_user.email
        requester_department = None
    
    # Generate ticket number
    ticket_number = await generate_ticket_number()
    
    # Set due date based on priority (SLA)
    due_date = None
    priority = data.get("priority", "medium")
    if priority == "urgent":
        due_date = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    elif priority == "high":
        due_date = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    elif priority == "medium":
        due_date = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    else:
        due_date = (datetime.now(timezone.utc) + timedelta(hours=72)).isoformat()
    
    # Check for auto-assignment rules
    category = data.get("category", "other")
    assigned_to = None
    assigned_to_name = None
    
    # Find matching rule
    rule = await db.assignment_rules.find_one({
        "category": category,
        "is_active": True,
        "$or": [
            {"priority_filter": None},
            {"priority_filter": priority}
        ]
    }, {"_id": 0})
    
    if rule:
        assigned_to = rule.get("assignee_id")
        assigned_to_name = rule.get("assignee_name")
    
    ticket_data = {
        **data,
        "ticket_number": ticket_number,
        "requester_id": requester_id,
        "requester_name": requester_name,
        "requester_email": requester_email,
        "requester_department": requester_department,
        "status": "in_progress" if assigned_to else "open",
        "assigned_to": assigned_to,
        "assigned_to_name": assigned_to_name,
        "due_date": due_date
    }
    
    ticket = Ticket(**ticket_data)
    await db.tickets.insert_one(ticket.model_dump())
    
    return ticket.model_dump()


@api_router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    # Check access - employees can only update their own tickets (limited fields)
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or ticket["requester_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Employees can only add description or close their ticket
        allowed_fields = ["description", "status"]
        if "status" in data and data["status"] not in ["closed"]:
            raise HTTPException(status_code=403, detail="Employees can only close tickets")
        data = {k: v for k, v in data.items() if k in allowed_fields}
    
    # Track status changes
    old_status = ticket.get("status")
    new_status = data.get("status")
    
    if new_status and new_status != old_status:
        if new_status == "resolved" and not ticket.get("resolved_at"):
            data["resolved_at"] = datetime.now(timezone.utc).isoformat()
        elif new_status == "closed" and not ticket.get("closed_at"):
            data["closed_at"] = datetime.now(timezone.utc).isoformat()
        elif new_status == "in_progress" and not ticket.get("first_response_at"):
            data["first_response_at"] = datetime.now(timezone.utc).isoformat()
    
    # If assigning, get assignee name
    if "assigned_to" in data and data["assigned_to"]:
        assignee = await db.employees.find_one({"id": data["assigned_to"]}, {"_id": 0})
        if assignee:
            data["assigned_to_name"] = assignee.get("full_name")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tickets.update_one({"id": ticket_id}, {"$set": data})
    return await db.tickets.find_one({"id": ticket_id}, {"_id": 0})


@api_router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    """Delete a ticket (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete tickets")
    
    await db.ticket_comments.delete_many({"ticket_id": ticket_id})
    await db.tickets.delete_one({"id": ticket_id})
    return {"message": "Ticket deleted"}


# Ticket Comments

@api_router.get("/tickets/{ticket_id}/comments")
async def get_ticket_comments(ticket_id: str, current_user: User = Depends(get_current_user)):
    """Get comments for a ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    # Check access
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or ticket["requester_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    comments = await db.ticket_comments.find(
        {"ticket_id": ticket_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Filter internal comments for non-admins
    if not is_admin:
        comments = [c for c in comments if not c.get("is_internal")]
    
    return comments


@api_router.post("/tickets/{ticket_id}/comments")
async def add_ticket_comment(ticket_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add a comment to a ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    is_admin = current_user.role in ["super_admin", "corp_admin"]
    
    # Check access
    if not is_admin:
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if not employee or ticket["requester_id"] != employee["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Employees cannot add internal notes
        data["is_internal"] = False
    
    # Get author info
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    author_name = employee.get("full_name") if employee else current_user.full_name
    
    comment_data = {
        **data,
        "ticket_id": ticket_id,
        "author_id": current_user.id,
        "author_name": author_name,
        "author_role": current_user.role
    }
    
    comment = TicketComment(**comment_data)
    await db.ticket_comments.insert_one(comment.model_dump())
    
    # Update ticket's updated_at and first_response_at
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if is_admin and not ticket.get("first_response_at"):
        update_data["first_response_at"] = datetime.now(timezone.utc).isoformat()
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_data})
    
    return comment.model_dump()


# Ticket Assignment

@api_router.post("/tickets/{ticket_id}/assign")
async def assign_ticket(ticket_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Assign a ticket to a user"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign tickets")
    
    assignee_id = data.get("assigned_to")
    assignee_name = None
    
    if assignee_id:
        assignee = await db.employees.find_one({"id": assignee_id}, {"_id": 0})
        if assignee:
            assignee_name = assignee.get("full_name")
    
    update_data = {
        "assigned_to": assignee_id,
        "assigned_to_name": assignee_name,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If first assignment and status is open, move to in_progress
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if ticket and ticket.get("status") == "open" and assignee_id:
        update_data["status"] = "in_progress"
        if not ticket.get("first_response_at"):
            update_data["first_response_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_data})
    return await db.tickets.find_one({"id": ticket_id}, {"_id": 0})


# Rating

@api_router.post("/tickets/{ticket_id}/rate")
async def rate_ticket(ticket_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Rate ticket resolution (requester only)"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not employee or ticket["requester_id"] != employee["id"]:
        raise HTTPException(status_code=403, detail="Only the requester can rate the ticket")
    
    if ticket.get("status") not in ["resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Can only rate resolved or closed tickets")
    
    rating = data.get("rating")
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"satisfaction_rating": rating, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Rating submitted"}


# ============= TICKET TEMPLATES =============

class TicketTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    subject_template: str
    body_template: str
    category: str = "other"
    priority: str = "medium"
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/templates")
async def get_ticket_templates(current_user: User = Depends(get_current_user)):
    """Get all ticket templates"""
    templates = await db.ticket_templates.find({"is_active": True}, {"_id": 0}).to_list(100)
    return templates


@api_router.post("/tickets/templates")
async def create_ticket_template(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a ticket template (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create templates")
    
    template = TicketTemplate(**data)
    await db.ticket_templates.insert_one(template.model_dump())
    return template.model_dump()


@api_router.put("/tickets/templates/{template_id}")
async def update_ticket_template(template_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a ticket template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update templates")
    
    await db.ticket_templates.update_one({"id": template_id}, {"$set": data})
    return await db.ticket_templates.find_one({"id": template_id}, {"_id": 0})


@api_router.delete("/tickets/templates/{template_id}")
async def delete_ticket_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Delete a ticket template"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete templates")
    
    await db.ticket_templates.delete_one({"id": template_id})
    return {"message": "Template deleted"}


@api_router.post("/tickets/templates/seed-defaults")
async def seed_default_templates(current_user: User = Depends(get_current_user)):
    """Seed default ticket templates"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can seed templates")
    
    existing = await db.ticket_templates.count_documents({})
    if existing > 0:
        return {"message": "Templates already exist", "count": existing}
    
    default_templates = [
        {
            "name": "Password Reset",
            "description": "Request a password reset for your account",
            "subject_template": "Password Reset Request",
            "body_template": "I need to reset my password for [System Name].\n\nReason: [Forgot password / Account locked / Security concern]\n\nPlease assist with resetting my credentials.",
            "category": "it",
            "priority": "high"
        },
        {
            "name": "New Equipment Request",
            "description": "Request new computer equipment or peripherals",
            "subject_template": "New Equipment Request - [Equipment Type]",
            "body_template": "I would like to request the following equipment:\n\n- Equipment Type: [Laptop/Monitor/Keyboard/Mouse/Other]\n- Justification: [Reason for request]\n- Preferred Specifications: [Any specific requirements]\n\nCurrent equipment status: [Working/Not working/None]",
            "category": "it",
            "priority": "medium"
        },
        {
            "name": "VPN Access Request",
            "description": "Request VPN access for remote work",
            "subject_template": "VPN Access Request",
            "body_template": "I need VPN access for remote work.\n\nPurpose: [Work from home / Travel / Other]\nDuration: [Temporary / Permanent]\nStart Date: [Date]\n\nI have completed the required security training: [Yes/No]",
            "category": "it",
            "priority": "medium"
        },
        {
            "name": "Software Installation",
            "description": "Request software installation or license",
            "subject_template": "Software Installation Request - [Software Name]",
            "body_template": "Please install the following software:\n\nSoftware Name: [Name]\nVersion: [If specific]\nPurpose: [Business justification]\nLicense: [Company owned / Need to purchase]\n\nThis software is required for: [Describe your need]",
            "category": "it",
            "priority": "low"
        },
        {
            "name": "Leave Balance Inquiry",
            "description": "Question about leave balance or accrual",
            "subject_template": "Leave Balance Inquiry",
            "body_template": "I have a question about my leave balance.\n\nLeave Type: [Annual/Sick/Personal]\nQuestion: [Describe your inquiry]\n\nMy current understanding is: [What you believe your balance is]",
            "category": "hr",
            "priority": "low"
        },
        {
            "name": "Payroll Discrepancy",
            "description": "Report an issue with your paycheck",
            "subject_template": "Payroll Discrepancy - [Pay Period]",
            "body_template": "I noticed a discrepancy in my paycheck.\n\nPay Period: [Date range]\nExpected Amount: [Amount]\nReceived Amount: [Amount]\nDiscrepancy: [Difference]\n\nPossible reason: [Overtime/Deduction/Bonus/Other]\n\nPlease review and advise.",
            "category": "payroll",
            "priority": "high"
        },
        {
            "name": "Benefits Enrollment",
            "description": "Questions about benefits enrollment",
            "subject_template": "Benefits Enrollment Question",
            "body_template": "I have a question about benefits enrollment.\n\nBenefit Type: [Health/Dental/Vision/401k/Other]\nQuestion: [Your specific question]\n\nIs this related to:\n- [ ] New enrollment\n- [ ] Change in coverage\n- [ ] Adding dependent\n- [ ] Other",
            "category": "benefits",
            "priority": "medium"
        },
        {
            "name": "Facility Maintenance",
            "description": "Report a facility issue or maintenance request",
            "subject_template": "Facility Maintenance - [Issue Type]",
            "body_template": "I would like to report a facility issue.\n\nLocation: [Building/Floor/Room]\nIssue Type: [HVAC/Lighting/Plumbing/Furniture/Other]\nDescription: [Detailed description]\nUrgency: [Safety hazard / Impacts work / Minor inconvenience]\n\nBest time for maintenance: [If applicable]",
            "category": "facilities",
            "priority": "medium"
        }
    ]
    
    for template_data in default_templates:
        template = TicketTemplate(**template_data)
        await db.ticket_templates.insert_one(template.model_dump())
    
    return {"message": f"Seeded {len(default_templates)} default templates"}


# ============= AUTO-ASSIGNMENT RULES =============

class AssignmentRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # The ticket category this rule applies to
    assignee_id: str  # The employee to assign to
    assignee_name: Optional[str] = None
    priority_filter: Optional[str] = None  # Only apply to specific priority
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/assignment-rules")
async def get_assignment_rules(current_user: User = Depends(get_current_user)):
    """Get all assignment rules (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view assignment rules")
    
    rules = await db.assignment_rules.find({"is_active": True}, {"_id": 0}).to_list(100)
    return rules


@api_router.post("/tickets/assignment-rules")
async def create_assignment_rule(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create assignment rules")
    
    # Get assignee name
    assignee = await db.employees.find_one({"id": data.get("assignee_id")}, {"_id": 0})
    if assignee:
        data["assignee_name"] = assignee.get("full_name")
    
    rule = AssignmentRule(**data)
    await db.assignment_rules.insert_one(rule.model_dump())
    return rule.model_dump()


@api_router.put("/tickets/assignment-rules/{rule_id}")
async def update_assignment_rule(rule_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update assignment rules")
    
    if "assignee_id" in data:
        assignee = await db.employees.find_one({"id": data["assignee_id"]}, {"_id": 0})
        if assignee:
            data["assignee_name"] = assignee.get("full_name")
    
    await db.assignment_rules.update_one({"id": rule_id}, {"$set": data})
    return await db.assignment_rules.find_one({"id": rule_id}, {"_id": 0})


@api_router.delete("/tickets/assignment-rules/{rule_id}")
async def delete_assignment_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    """Delete an assignment rule"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete assignment rules")
    
    await db.assignment_rules.delete_one({"id": rule_id})
    return {"message": "Rule deleted"}


# ============= CANNED RESPONSES =============

class CannedResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    shortcut: Optional[str] = None  # e.g., "/password" to quickly insert
    content: str
    category: Optional[str] = None  # Optional category filter
    is_active: bool = True
    usage_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/tickets/canned-responses")
async def get_canned_responses(category: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get canned responses (admin only)"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view canned responses")
    
    query = {"is_active": True}
    if category:
        query["$or"] = [{"category": category}, {"category": None}]
    
    responses = await db.canned_responses.find(query, {"_id": 0}).sort("usage_count", -1).to_list(100)
    return responses


@api_router.post("/tickets/canned-responses")
async def create_canned_response(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create canned responses")
    
    response = CannedResponse(**data)
    await db.canned_responses.insert_one(response.model_dump())
    return response.model_dump()


@api_router.put("/tickets/canned-responses/{response_id}")
async def update_canned_response(response_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update canned responses")
    
    await db.canned_responses.update_one({"id": response_id}, {"$set": data})
    return await db.canned_responses.find_one({"id": response_id}, {"_id": 0})


@api_router.delete("/tickets/canned-responses/{response_id}")
async def delete_canned_response(response_id: str, current_user: User = Depends(get_current_user)):
    """Delete a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete canned responses")
    
    await db.canned_responses.delete_one({"id": response_id})
    return {"message": "Response deleted"}


@api_router.post("/tickets/canned-responses/{response_id}/use")
async def use_canned_response(response_id: str, current_user: User = Depends(get_current_user)):
    """Increment usage count for a canned response"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can use canned responses")
    
    await db.canned_responses.update_one({"id": response_id}, {"$inc": {"usage_count": 1}})
    return await db.canned_responses.find_one({"id": response_id}, {"_id": 0})


@api_router.post("/tickets/canned-responses/seed-defaults")
async def seed_default_canned_responses(current_user: User = Depends(get_current_user)):
    """Seed default canned responses"""
    if current_user.role not in ["super_admin", "corp_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can seed canned responses")
    
    existing = await db.canned_responses.count_documents({})
    if existing > 0:
        return {"message": "Canned responses already exist", "count": existing}
    
    default_responses = [
        {
            "name": "Acknowledge Receipt",
            "shortcut": "/ack",
            "content": "Thank you for submitting this ticket. I've received your request and will begin working on it shortly. I'll update you as soon as I have more information.",
            "category": None
        },
        {
            "name": "Request More Info",
            "shortcut": "/moreinfo",
            "content": "Thank you for your ticket. To better assist you, could you please provide the following additional information:\n\n1. \n2. \n3. \n\nThis will help us resolve your issue more quickly.",
            "category": None
        },
        {
            "name": "Password Reset Complete",
            "shortcut": "/pwreset",
            "content": "Your password has been reset successfully. You should receive an email with instructions to set your new password.\n\nIf you don't receive the email within 10 minutes, please check your spam folder or let me know.\n\nFor security, please change your password upon first login.",
            "category": "it"
        },
        {
            "name": "VPN Instructions",
            "shortcut": "/vpn",
            "content": "Your VPN access has been granted. Here's how to connect:\n\n1. Download the VPN client from [link]\n2. Install and open the application\n3. Enter your network credentials\n4. Select the appropriate server\n5. Click Connect\n\nIf you encounter any issues, please refer to our VPN troubleshooting guide or let me know.",
            "category": "it"
        },
        {
            "name": "Equipment Order Placed",
            "shortcut": "/equipment",
            "content": "Your equipment request has been approved and the order has been placed. Here are the details:\n\n- Item: \n- Expected delivery: \n- Delivery location: \n\nI'll notify you when the equipment arrives. Please let me know if you have any questions.",
            "category": "it"
        },
        {
            "name": "Payroll Reviewed",
            "shortcut": "/payroll",
            "content": "I've reviewed your payroll inquiry. Here's what I found:\n\n[Explanation of the discrepancy or confirmation]\n\nIf a correction is needed, it will be reflected in your next paycheck. Please let me know if you have any further questions.",
            "category": "payroll"
        },
        {
            "name": "Leave Balance Confirmed",
            "shortcut": "/leave",
            "content": "I've checked your leave balance. Here are your current balances:\n\n- Annual Leave: X days\n- Sick Leave: X days\n- Personal Leave: X days\n\nPlease note that balances are updated at the beginning of each month. Let me know if you need any clarification.",
            "category": "hr"
        },
        {
            "name": "Issue Resolved",
            "shortcut": "/resolved",
            "content": "Great news! The issue has been resolved. Here's a summary of what was done:\n\n[Summary of resolution]\n\nPlease test and confirm that everything is working as expected. If you encounter any further issues, feel free to reopen this ticket or create a new one.\n\nThank you for your patience!",
            "category": None
        },
        {
            "name": "Escalation Notice",
            "shortcut": "/escalate",
            "content": "I'm escalating this ticket to our specialized team for further investigation. They have more expertise in this area and will be able to assist you better.\n\nYou can expect an update within [timeframe]. Thank you for your patience.",
            "category": None
        },
        {
            "name": "Facilities Work Scheduled",
            "shortcut": "/facilities",
            "content": "Your facilities request has been reviewed and work has been scheduled.\n\n- Scheduled Date: \n- Estimated Duration: \n- Contact Person: \n\nPlease ensure the area is accessible during this time. Let me know if you need to reschedule.",
            "category": "facilities"
        }
    ]
    
    for response_data in default_responses:
        response = CannedResponse(**response_data)
        await db.canned_responses.insert_one(response.model_dump())
    
    return {"message": f"Seeded {len(default_responses)} default canned responses"}


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
