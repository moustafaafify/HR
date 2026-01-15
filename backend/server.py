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
    personal_email: str
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
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PerformanceReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    reviewer_id: str
    period: str
    rating: Optional[float] = None
    feedback: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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
    return [Employee(**e) for e in employees]

@api_router.get("/employees/{emp_id}", response_model=Employee)
async def get_employee(emp_id: str, current_user: User = Depends(get_current_user)):
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return Employee(**emp)

@api_router.put("/employees/{emp_id}", response_model=Employee)
async def update_employee(emp_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.employees.update_one({"id": emp_id}, {"$set": data})
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
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

# ============= LEAVE ROUTES =============

@api_router.post("/leaves", response_model=Leave)
async def create_leave(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    leave = Leave(**data)
    await db.leaves.insert_one(leave.model_dump())
    return leave

@api_router.get("/leaves", response_model=List[Leave])
async def get_leaves(employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"employee_id": employee_id} if employee_id else {}
    leaves = await db.leaves.find(query, {"_id": 0}).to_list(1000)
    return [Leave(**l) for l in leaves]

@api_router.put("/leaves/{leave_id}", response_model=Leave)
async def update_leave(leave_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    await db.leaves.update_one({"id": leave_id}, {"$set": data})
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    return Leave(**leave)

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

# ============= PERFORMANCE REVIEW ROUTES =============

@api_router.post("/reviews", response_model=PerformanceReview)
async def create_review(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    review = PerformanceReview(**data)
    await db.reviews.insert_one(review.model_dump())
    return review

@api_router.get("/reviews", response_model=List[PerformanceReview])
async def get_reviews(employee_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"employee_id": employee_id} if employee_id else {}
    reviews = await db.reviews.find(query, {"_id": 0}).to_list(1000)
    return [PerformanceReview(**r) for r in reviews]

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

# Include router
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
