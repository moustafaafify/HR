"""Visitor Management Router for HR Platform."""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
import uuid

import sys
sys.path.insert(0, '/app/backend')
from database import db
from auth import get_current_user
from models.core import User, UserRole


router = APIRouter(prefix="/visitors", tags=["Visitor Management"])


# ============= MODELS =============

class Visitor(BaseModel):
    """Visitor registration"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Visitor details
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    
    # Photo/ID
    photo_url: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    
    # Visit details
    visit_type: str = "meeting"
    purpose: Optional[str] = None
    
    # Host
    host_employee_id: Optional[str] = None
    host_name: Optional[str] = None
    host_department: Optional[str] = None
    host_email: Optional[str] = None
    
    # Location
    building: Optional[str] = None
    floor: Optional[str] = None
    meeting_room: Optional[str] = None
    
    # Schedule
    expected_date: str
    expected_time: Optional[str] = None
    expected_duration_minutes: int = 60
    
    # Status
    status: str = "pre_registered"
    
    # Check-in/out times
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    
    # Badge
    badge_number: Optional[str] = None
    badge_printed: bool = False
    badge_printed_at: Optional[str] = None
    
    # Additional info
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    
    # Equipment/items
    has_laptop: bool = False
    has_camera: bool = False
    other_items: Optional[str] = None
    
    # NDA/Agreement
    nda_signed: bool = False
    nda_signed_at: Optional[str] = None
    
    # Who registered
    registered_by: Optional[str] = None
    registered_by_name: Optional[str] = None
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VisitorBadge(BaseModel):
    """Visitor badge"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    visitor_id: str
    visitor_name: str
    company: Optional[str] = None
    host_name: Optional[str] = None
    
    badge_number: str
    visit_date: str
    badge_type: str = "standard"
    qr_code_data: Optional[str] = None
    
    printed: bool = False
    printed_at: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============= ROUTES =============

@router.post("")
async def create_visitor(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Pre-register a visitor"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    data["registered_by"] = current_user.id
    data["registered_by_name"] = emp.get("full_name") if emp else current_user.email
    
    if not data.get("host_employee_id") and emp:
        data["host_employee_id"] = emp["id"]
        data["host_name"] = emp.get("full_name")
        data["host_email"] = emp.get("email")
        data["host_department"] = emp.get("department_name")
    elif data.get("host_employee_id"):
        host = await db.employees.find_one({"id": data["host_employee_id"]}, {"_id": 0})
        if host:
            data["host_name"] = host.get("full_name")
            data["host_email"] = host.get("email")
            data["host_department"] = host.get("department_name")
    
    visitor = Visitor(**data)
    await db.visitors.insert_one(visitor.model_dump())
    return visitor.model_dump()


@router.get("")
async def get_visitors(
    date: Optional[str] = None,
    status: Optional[str] = None,
    visit_type: Optional[str] = None,
    host_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get visitors"""
    query = {}
    
    if date:
        query["expected_date"] = date
    if status:
        query["status"] = status
    if visit_type:
        query["visit_type"] = visit_type
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if emp:
            query["$or"] = [
                {"host_employee_id": emp["id"]},
                {"registered_by": current_user.id}
            ]
        else:
            query["registered_by"] = current_user.id
    elif host_id:
        query["host_employee_id"] = host_id
    
    visitors = await db.visitors.find(query, {"_id": 0}).sort("expected_date", -1).to_list(500)
    return visitors


@router.get("/today")
async def get_todays_visitors(current_user: User = Depends(get_current_user)):
    """Get today's visitors"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    query = {"expected_date": today}
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN, UserRole.BRANCH_MANAGER]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if emp:
            query["$or"] = [
                {"host_employee_id": emp["id"]},
                {"registered_by": current_user.id}
            ]
    
    visitors = await db.visitors.find(query, {"_id": 0}).sort("expected_time", 1).to_list(200)
    return visitors


@router.get("/my")
async def get_my_visitors(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get visitors registered by or hosted by current user"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    query = {"$or": [{"registered_by": current_user.id}]}
    if emp:
        query["$or"].append({"host_employee_id": emp["id"]})
    
    if status:
        query["status"] = status
    
    visitors = await db.visitors.find(query, {"_id": 0}).sort("expected_date", -1).to_list(200)
    return visitors


@router.get("/dashboard")
async def get_visitors_dashboard(current_user: User = Depends(get_current_user)):
    """Get visitor management dashboard data"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    todays_visitors = await db.visitors.count_documents({"expected_date": today})
    checked_in = await db.visitors.count_documents({"expected_date": today, "status": "checked_in"})
    checked_out = await db.visitors.count_documents({"expected_date": today, "status": "checked_out"})
    pre_registered = await db.visitors.count_documents({"expected_date": today, "status": "pre_registered"})
    
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
    week_visitors = await db.visitors.count_documents({"expected_date": {"$gte": week_start}})
    
    visit_types = await db.visitors.aggregate([
        {"$match": {"expected_date": today}},
        {"$group": {"_id": "$visit_type", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    todays_list = await db.visitors.find(
        {"expected_date": today},
        {"_id": 0}
    ).sort("expected_time", 1).to_list(50)
    
    next_week = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
    upcoming = await db.visitors.find(
        {"expected_date": {"$gt": today, "$lte": next_week}, "status": "pre_registered"},
        {"_id": 0}
    ).sort("expected_date", 1).to_list(20)
    
    recent_checkins = await db.visitors.find(
        {"status": "checked_in"},
        {"_id": 0}
    ).sort("check_in_time", -1).to_list(10)
    
    return {
        "summary": {
            "todays_visitors": todays_visitors,
            "checked_in": checked_in,
            "checked_out": checked_out,
            "pre_registered": pre_registered,
            "week_visitors": week_visitors,
            "currently_on_site": checked_in
        },
        "visit_types": {vt["_id"]: vt["count"] for vt in visit_types},
        "todays_visitors": todays_list,
        "upcoming_visitors": upcoming,
        "recent_checkins": recent_checkins
    }


@router.get("/my-dashboard")
async def get_my_visitors_dashboard(current_user: User = Depends(get_current_user)):
    """Get employee's visitor dashboard"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    query_base = {"$or": [{"registered_by": current_user.id}]}
    if emp:
        query_base["$or"].append({"host_employee_id": emp["id"]})
    
    todays_query = {**query_base, "expected_date": today}
    todays_visitors = await db.visitors.find(todays_query, {"_id": 0}).sort("expected_time", 1).to_list(50)
    
    next_week = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
    upcoming_query = {**query_base, "expected_date": {"$gt": today, "$lte": next_week}, "status": "pre_registered"}
    upcoming = await db.visitors.find(upcoming_query, {"_id": 0}).sort("expected_date", 1).to_list(20)
    
    total_today = len(todays_visitors)
    checked_in = len([v for v in todays_visitors if v.get("status") == "checked_in"])
    awaiting = len([v for v in todays_visitors if v.get("status") == "pre_registered"])
    
    return {
        "summary": {
            "total_today": total_today,
            "checked_in": checked_in,
            "awaiting": awaiting,
            "upcoming_count": len(upcoming)
        },
        "todays_visitors": todays_visitors,
        "upcoming_visitors": upcoming
    }


@router.get("/history")
async def get_visitor_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    visit_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get visitor history"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view visitor history")
    
    query = {}
    if start_date:
        query["expected_date"] = {"$gte": start_date}
    if end_date:
        if "expected_date" in query:
            query["expected_date"]["$lte"] = end_date
        else:
            query["expected_date"] = {"$lte": end_date}
    if visit_type:
        query["visit_type"] = visit_type
    
    visitors = await db.visitors.find(query, {"_id": 0}).sort("expected_date", -1).to_list(500)
    return visitors


@router.post("/walk-in")
async def register_walkin_visitor(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Quick registration for walk-in visitors"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    data["expected_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data["expected_time"] = datetime.now(timezone.utc).strftime("%H:%M")
    data["registered_by"] = current_user.id
    data["registered_by_name"] = emp.get("full_name") if emp else current_user.email
    data["status"] = "checked_in"
    data["check_in_time"] = datetime.now(timezone.utc).isoformat()
    
    if not data.get("host_employee_id") and emp:
        data["host_employee_id"] = emp["id"]
        data["host_name"] = emp.get("full_name")
        data["host_email"] = emp.get("email")
        data["host_department"] = emp.get("department_name")
    
    count = await db.visitors.count_documents({"expected_date": data["expected_date"]})
    data["badge_number"] = f"V{datetime.now().strftime('%Y%m%d')}-{count + 1:03d}"
    
    visitor = Visitor(**data)
    await db.visitors.insert_one(visitor.model_dump())
    return visitor.model_dump()


@router.get("/{visitor_id}")
async def get_visitor(visitor_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific visitor"""
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return visitor


@router.put("/{visitor_id}")
async def update_visitor(visitor_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a visitor"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if data.get("host_employee_id"):
        host = await db.employees.find_one({"id": data["host_employee_id"]}, {"_id": 0})
        if host:
            data["host_name"] = host.get("full_name")
            data["host_email"] = host.get("email")
            data["host_department"] = host.get("department_name")
    
    await db.visitors.update_one({"id": visitor_id}, {"$set": data})
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    return visitor


@router.delete("/{visitor_id}")
async def delete_visitor(visitor_id: str, current_user: User = Depends(get_current_user)):
    """Delete/cancel a visitor registration"""
    result = await db.visitors.delete_one({"id": visitor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return {"message": "Visitor deleted"}


@router.post("/{visitor_id}/check-in")
async def check_in_visitor(visitor_id: str, data: Dict[str, Any] = {}, current_user: User = Depends(get_current_user)):
    """Check in a visitor"""
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    if visitor.get("status") == "checked_in":
        raise HTTPException(status_code=400, detail="Visitor already checked in")
    
    badge_number = visitor.get("badge_number")
    if not badge_number:
        count = await db.visitors.count_documents({"expected_date": visitor["expected_date"]})
        badge_number = f"V{datetime.now().strftime('%Y%m%d')}-{count + 1:03d}"
    
    update_data = {
        "status": "checked_in",
        "check_in_time": datetime.now(timezone.utc).isoformat(),
        "badge_number": badge_number,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.get("id_type"):
        update_data["id_type"] = data["id_type"]
    if data.get("id_number"):
        update_data["id_number"] = data["id_number"]
    if data.get("has_laptop"):
        update_data["has_laptop"] = data["has_laptop"]
    if data.get("has_camera"):
        update_data["has_camera"] = data["has_camera"]
    if data.get("other_items"):
        update_data["other_items"] = data["other_items"]
    if data.get("nda_signed"):
        update_data["nda_signed"] = True
        update_data["nda_signed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.visitors.update_one({"id": visitor_id}, {"$set": update_data})
    
    updated_visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    return updated_visitor


@router.post("/{visitor_id}/check-out")
async def check_out_visitor(visitor_id: str, current_user: User = Depends(get_current_user)):
    """Check out a visitor"""
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    if visitor.get("status") != "checked_in":
        raise HTTPException(status_code=400, detail="Visitor not checked in")
    
    update_data = {
        "status": "checked_out",
        "check_out_time": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.visitors.update_one({"id": visitor_id}, {"$set": update_data})
    
    updated_visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    return updated_visitor


@router.post("/{visitor_id}/print-badge")
async def print_visitor_badge(visitor_id: str, current_user: User = Depends(get_current_user)):
    """Generate/print a visitor badge"""
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    badge_number = visitor.get("badge_number")
    if not badge_number:
        count = await db.visitors.count_documents({"expected_date": visitor["expected_date"]})
        badge_number = f"V{datetime.now().strftime('%Y%m%d')}-{count + 1:03d}"
    
    badge = VisitorBadge(
        visitor_id=visitor_id,
        visitor_name=f"{visitor['first_name']} {visitor['last_name']}",
        company=visitor.get("company"),
        host_name=visitor.get("host_name"),
        badge_number=badge_number,
        visit_date=visitor["expected_date"],
        badge_type="standard",
        qr_code_data=visitor_id,
        printed=True,
        printed_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.visitor_badges.insert_one(badge.model_dump())
    
    await db.visitors.update_one({"id": visitor_id}, {"$set": {
        "badge_number": badge_number,
        "badge_printed": True,
        "badge_printed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return badge.model_dump()


@router.get("/{visitor_id}/badge")
async def get_visitor_badge(visitor_id: str, current_user: User = Depends(get_current_user)):
    """Get badge data for a visitor"""
    visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    badge = await db.visitor_badges.find_one({"visitor_id": visitor_id}, {"_id": 0})
    
    return {
        "visitor": visitor,
        "badge": badge,
        "badge_data": {
            "visitor_name": f"{visitor['first_name']} {visitor['last_name']}",
            "company": visitor.get("company", ""),
            "host_name": visitor.get("host_name", ""),
            "badge_number": visitor.get("badge_number", ""),
            "visit_date": visitor["expected_date"],
            "visit_type": visitor.get("visit_type", ""),
            "qr_code": visitor_id
        }
    }
