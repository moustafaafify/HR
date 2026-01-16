"""Core models for HR Platform."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


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
    half_day_type: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LeaveBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    year: int
    annual_leave: float = 20.0
    annual_used: float = 0.0
    sick_leave: float = 10.0
    sick_used: float = 0.0
    personal_leave: float = 5.0
    personal_used: float = 0.0
    unpaid_used: float = 0.0
    maternity_leave: float = 90.0
    maternity_used: float = 0.0
    paternity_leave: float = 14.0
    paternity_used: float = 0.0
    bereavement_leave: float = 5.0
    bereavement_used: float = 0.0
    other_used: float = 0.0
    carry_over: float = 0.0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global_settings"
    company_name: str = "HR Platform"
    company_logo: Optional[str] = None
    primary_color: str = "#6366f1"
    accent_color: str = "#8b5cf6"
    dark_mode: bool = False
    default_language: str = "en"
    default_currency: str = "USD"
    date_format: str = "MM/DD/YYYY"
    time_format: str = "12h"
    timezone: str = "UTC"
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    smtp_use_tls: bool = True
    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_sender_id: Optional[str] = None
    push_enabled: bool = False
    push_triggers: Dict[str, bool] = Field(default_factory=lambda: {
        "leave_request": True,
        "leave_approved": True,
        "leave_rejected": True,
        "expense_submitted": True,
        "expense_approved": True,
        "expense_rejected": True,
        "training_assigned": True,
        "training_reminder": True,
        "announcement_posted": True,
        "survey_assigned": True,
        "performance_review": True,
        "document_shared": True
    })
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
