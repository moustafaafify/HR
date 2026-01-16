"""Workforce Planning Router for HR Platform."""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
import uuid

import sys
sys.path.insert(0, '/app/backend')
from database import db
from auth import get_current_user
from models.core import User, UserRole


router = APIRouter(prefix="/workforce", tags=["Workforce Planning"])


# ============= MODELS =============

class HeadcountPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    fiscal_year: str
    quarter: Optional[str] = None
    current_headcount: int = 0
    planned_hires: int = 0
    planned_departures: int = 0
    planned_transfers_in: int = 0
    planned_transfers_out: int = 0
    budget_allocated: float = 0
    budget_used: float = 0
    avg_salary_budget: float = 0
    target_headcount: int = 0
    role_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "draft"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ResourceAllocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    team_name: Optional[str] = None
    role_in_project: Optional[str] = None
    allocation_percentage: int = 100
    start_date: str
    end_date: Optional[str] = None
    billable: bool = True
    hourly_rate: float = 0
    status: str = "active"
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WorkforceScenario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    scenario_type: str = "growth"
    base_headcount: int = 0
    base_cost: float = 0
    changes: List[Dict[str, Any]] = Field(default_factory=list)
    projected_headcount: int = 0
    projected_cost: float = 0
    cost_savings: float = 0
    implementation_months: int = 6
    productivity_impact: str = "neutral"
    morale_impact: str = "neutral"
    risk_assessment: Optional[str] = None
    status: str = "draft"
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EmployeeAvailability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: str
    available_hours: float = 8
    allocated_hours: float = 0
    status: str = "available"
    reason: Optional[str] = None
    preferred_projects: List[str] = Field(default_factory=list)
    interested_roles: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============= ROUTES =============

@router.get("/dashboard")
async def get_workforce_dashboard(current_user: User = Depends(get_current_user)):
    """Get workforce planning dashboard"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view workforce dashboard")
    
    total_employees = await db.employees.count_documents({"status": "active"})
    headcount_plans = await db.headcount_plans.count_documents({})
    active_allocations = await db.resource_allocations.count_documents({"status": "active"})
    scenarios = await db.workforce_scenarios.count_documents({})
    
    recent_plans = await db.headcount_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    active_scenarios = await db.workforce_scenarios.find(
        {"status": {"$in": ["draft", "under_review"]}}, {"_id": 0}
    ).to_list(5)
    
    dept_stats = await db.employees.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$department_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "summary": {
            "total_employees": total_employees,
            "headcount_plans": headcount_plans,
            "active_allocations": active_allocations,
            "scenarios": scenarios
        },
        "recent_plans": recent_plans,
        "active_scenarios": active_scenarios,
        "department_distribution": [{d["_id"]: d["count"]} for d in dept_stats if d["_id"]]
    }


@router.get("/employee-dashboard")
async def get_employee_workforce_dashboard(current_user: User = Depends(get_current_user)):
    """Get employee's workforce view"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        return {"allocations": [], "availability": [], "preferences": {}}
    
    allocations = await db.resource_allocations.find(
        {"employee_id": emp["id"], "status": "active"}, {"_id": 0}
    ).to_list(50)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    availability = await db.employee_availability.find(
        {"employee_id": emp["id"], "date": {"$gte": today}}, {"_id": 0}
    ).sort("date", 1).to_list(30)
    
    prefs = await db.employee_availability.find_one(
        {"employee_id": emp["id"]}, {"_id": 0, "preferred_projects": 1, "interested_roles": 1}
    )
    
    return {
        "employee": emp,
        "allocations": allocations,
        "availability": availability,
        "preferences": prefs or {}
    }


# --- Headcount Plans ---
@router.post("/headcount-plans")
async def create_headcount_plan(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a headcount plan"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create headcount plans")
    
    if data.get("department_id"):
        dept = await db.departments.find_one({"id": data["department_id"]}, {"_id": 0})
        if dept:
            data["department_name"] = dept.get("name")
    
    plan = HeadcountPlan(**data, created_by=current_user.id)
    await db.headcount_plans.insert_one(plan.model_dump())
    return plan.model_dump()


@router.get("/headcount-plans")
async def get_headcount_plans(
    fiscal_year: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get headcount plans"""
    query = {}
    if fiscal_year:
        query["fiscal_year"] = fiscal_year
    if department_id:
        query["department_id"] = department_id
    if status:
        query["status"] = status
    
    plans = await db.headcount_plans.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return plans


@router.get("/headcount-plans/{plan_id}")
async def get_headcount_plan(plan_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific headcount plan"""
    plan = await db.headcount_plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Headcount plan not found")
    return plan


@router.put("/headcount-plans/{plan_id}")
async def update_headcount_plan(plan_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a headcount plan"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update headcount plans")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.get("status") == "approved":
        data["approved_by"] = current_user.id
        data["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.headcount_plans.update_one({"id": plan_id}, {"$set": data})
    return await db.headcount_plans.find_one({"id": plan_id}, {"_id": 0})


@router.delete("/headcount-plans/{plan_id}")
async def delete_headcount_plan(plan_id: str, current_user: User = Depends(get_current_user)):
    """Delete a headcount plan"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete headcount plans")
    
    await db.headcount_plans.delete_one({"id": plan_id})
    return {"message": "Headcount plan deleted"}


# --- Resource Allocations ---
@router.post("/allocations")
async def create_allocation(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a resource allocation"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Only managers can create allocations")
    
    if data.get("employee_id"):
        emp = await db.employees.find_one({"id": data["employee_id"]}, {"_id": 0})
        if emp:
            data["employee_name"] = emp.get("full_name")
    
    if data.get("project_id"):
        project = await db.projects.find_one({"id": data["project_id"]}, {"_id": 0})
        if project:
            data["project_name"] = project.get("name")
    
    allocation = ResourceAllocation(**data, created_by=current_user.id)
    await db.resource_allocations.insert_one(allocation.model_dump())
    return allocation.model_dump()


@router.get("/allocations")
async def get_allocations(
    employee_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get resource allocations"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if emp:
            query["employee_id"] = emp["id"]
    
    allocations = await db.resource_allocations.find(query, {"_id": 0}).sort("start_date", -1).to_list(200)
    return allocations


@router.put("/allocations/{allocation_id}")
async def update_allocation(allocation_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a resource allocation"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.resource_allocations.update_one({"id": allocation_id}, {"$set": data})
    return await db.resource_allocations.find_one({"id": allocation_id}, {"_id": 0})


@router.delete("/allocations/{allocation_id}")
async def delete_allocation(allocation_id: str, current_user: User = Depends(get_current_user)):
    """Delete a resource allocation"""
    await db.resource_allocations.delete_one({"id": allocation_id})
    return {"message": "Allocation deleted"}


# --- Scenarios ---
@router.post("/scenarios")
async def create_scenario(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a workforce scenario"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create scenarios")
    
    scenario = WorkforceScenario(**data, created_by=current_user.id)
    await db.workforce_scenarios.insert_one(scenario.model_dump())
    return scenario.model_dump()


@router.get("/scenarios")
async def get_scenarios(
    status: Optional[str] = None,
    scenario_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get workforce scenarios"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view scenarios")
    
    query = {}
    if status:
        query["status"] = status
    if scenario_type:
        query["scenario_type"] = scenario_type
    
    scenarios = await db.workforce_scenarios.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return scenarios


@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific scenario"""
    scenario = await db.workforce_scenarios.find_one({"id": scenario_id}, {"_id": 0})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.put("/scenarios/{scenario_id}")
async def update_scenario(scenario_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a scenario"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update scenarios")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.workforce_scenarios.update_one({"id": scenario_id}, {"$set": data})
    return await db.workforce_scenarios.find_one({"id": scenario_id}, {"_id": 0})


@router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str, current_user: User = Depends(get_current_user)):
    """Delete a scenario"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete scenarios")
    
    await db.workforce_scenarios.delete_one({"id": scenario_id})
    return {"message": "Scenario deleted"}


# --- Employee Availability ---
@router.get("/my-availability")
async def get_my_availability(current_user: User = Depends(get_current_user)):
    """Get my availability"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        return []
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    availability = await db.employee_availability.find(
        {"employee_id": emp["id"], "date": {"$gte": today}}, {"_id": 0}
    ).sort("date", 1).to_list(90)
    return availability


@router.put("/my-availability")
async def update_my_availability(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update my availability"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    date = data.get("date")
    if not date:
        raise HTTPException(status_code=400, detail="Date is required")
    
    existing = await db.employee_availability.find_one(
        {"employee_id": emp["id"], "date": date}
    )
    
    if existing:
        await db.employee_availability.update_one(
            {"employee_id": emp["id"], "date": date},
            {"$set": data}
        )
    else:
        avail = EmployeeAvailability(employee_id=emp["id"], **data)
        await db.employee_availability.insert_one(avail.model_dump())
    
    return await db.employee_availability.find_one(
        {"employee_id": emp["id"], "date": date}, {"_id": 0}
    )


@router.put("/my-preferences")
async def update_my_preferences(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update my work preferences"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update = {}
    if "preferred_projects" in data:
        update["preferred_projects"] = data["preferred_projects"]
    if "interested_roles" in data:
        update["interested_roles"] = data["interested_roles"]
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.employee_availability.find_one(
        {"employee_id": emp["id"], "date": today}
    )
    
    if existing:
        await db.employee_availability.update_one(
            {"employee_id": emp["id"], "date": today},
            {"$set": update}
        )
    else:
        avail = EmployeeAvailability(employee_id=emp["id"], date=today, **update)
        await db.employee_availability.insert_one(avail.model_dump())
    
    return {"message": "Preferences updated", **update}
