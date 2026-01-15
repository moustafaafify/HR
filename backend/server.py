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
