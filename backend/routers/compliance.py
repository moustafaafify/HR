"""Compliance & Legal Router for HR Platform."""
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


router = APIRouter(prefix="/compliance", tags=["Compliance & Legal"])


# ============= MODELS =============

class CompliancePolicy(BaseModel):
    """Company policies for compliance tracking"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str = "general"
    content: Optional[str] = None
    version: str = "1.0"
    status: str = "draft"
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    requires_acknowledgement: bool = True
    acknowledgement_frequency: str = "once"
    applicable_departments: List[str] = Field(default_factory=list)
    applicable_roles: List[str] = Field(default_factory=list)
    document_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    published_at: Optional[str] = None


class PolicyAcknowledgement(BaseModel):
    """Employee acknowledgement of a policy"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    policy_id: str
    policy_title: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    acknowledged_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ip_address: Optional[str] = None
    valid_until: Optional[str] = None
    version_acknowledged: str = "1.0"


class ComplianceTraining(BaseModel):
    """Compliance training courses"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str = "general"
    content_type: str = "video"
    content_url: Optional[str] = None
    duration_minutes: int = 30
    is_mandatory: bool = True
    passing_score: int = 80
    max_attempts: int = 3
    certification_validity_months: int = 12
    applicable_departments: List[str] = Field(default_factory=list)
    applicable_roles: List[str] = Field(default_factory=list)
    status: str = "active"
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TrainingCompletion(BaseModel):
    """Employee training completion record"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    training_id: str
    training_title: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    status: str = "assigned"
    progress_percentage: int = 0
    attempts: int = 0
    score: Optional[int] = None
    assigned_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    expires_at: Optional[str] = None
    certificate_url: Optional[str] = None


class LegalDocument(BaseModel):
    """Legal documents"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    document_type: str = "contract"
    description: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    department_id: Optional[str] = None
    document_url: Optional[str] = None
    file_name: Optional[str] = None
    status: str = "draft"
    requires_employee_signature: bool = True
    requires_company_signature: bool = True
    employee_signed_at: Optional[str] = None
    company_signed_at: Optional[str] = None
    company_signatory: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ComplianceIncident(BaseModel):
    """Compliance incidents"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    incident_type: str = "policy_violation"
    severity: str = "medium"
    reported_by: Optional[str] = None
    reported_by_name: Optional[str] = None
    employee_involved: Optional[str] = None
    employee_involved_name: Optional[str] = None
    department_id: Optional[str] = None
    status: str = "reported"
    investigator: Optional[str] = None
    investigation_notes: Optional[str] = None
    resolution: Optional[str] = None
    action_taken: Optional[str] = None
    resolved_at: Optional[str] = None
    incident_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    reported_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_confidential: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ComplianceCertification(BaseModel):
    """Employee certifications"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: Optional[str] = None
    certification_name: str
    certification_type: str = "internal"
    issuing_authority: Optional[str] = None
    status: str = "active"
    issued_date: str
    expiry_date: Optional[str] = None
    certificate_url: Optional[str] = None
    certificate_number: Optional[str] = None
    requires_renewal: bool = True
    renewal_reminder_days: int = 30
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============= ROUTES =============

# --- Dashboard ---
@router.get("/dashboard")
async def get_compliance_dashboard(current_user: User = Depends(get_current_user)):
    """Get compliance dashboard data for admins"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view compliance dashboard")
    
    policies_count = await db.compliance_policies.count_documents({"status": "published"})
    trainings_count = await db.compliance_trainings.count_documents({"status": "active"})
    open_incidents = await db.compliance_incidents.count_documents({"status": {"$in": ["reported", "under_investigation"]}})
    pending_docs = await db.legal_documents.count_documents({"status": "pending_signature"})
    
    expiring_certs = await db.compliance_certifications.count_documents({
        "status": "active",
        "expiry_date": {"$lte": (datetime.now(timezone.utc).replace(day=1) + __import__('datetime').timedelta(days=60)).strftime("%Y-%m-%d")}
    })
    
    recent_incidents = await db.compliance_incidents.find(
        {}, {"_id": 0}
    ).sort("reported_at", -1).to_list(5)
    
    pending_acks = await db.compliance_policies.aggregate([
        {"$match": {"status": "published", "requires_acknowledgement": True}},
        {"$lookup": {
            "from": "policy_acknowledgements",
            "localField": "id",
            "foreignField": "policy_id",
            "as": "acknowledgements"
        }},
        {"$project": {
            "id": 1, "title": 1,
            "ack_count": {"$size": "$acknowledgements"}
        }}
    ]).to_list(10)
    
    return {
        "summary": {
            "policies": policies_count,
            "trainings": trainings_count,
            "open_incidents": open_incidents,
            "pending_documents": pending_docs,
            "expiring_certifications": expiring_certs
        },
        "recent_incidents": recent_incidents,
        "pending_acknowledgements": pending_acks
    }


@router.get("/my-overview")
async def get_my_compliance_overview(current_user: User = Depends(get_current_user)):
    """Get employee's compliance overview"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        return {"pending_policies": [], "pending_trainings": [], "pending_signatures": [], "my_certifications": []}
    
    my_acks = await db.policy_acknowledgements.find(
        {"employee_id": emp["id"]}, {"policy_id": 1, "_id": 0}
    ).to_list(500)
    acked_policy_ids = [a["policy_id"] for a in my_acks]
    
    pending_policies = await db.compliance_policies.find(
        {"status": "published", "requires_acknowledgement": True, "id": {"$nin": acked_policy_ids}},
        {"_id": 0}
    ).to_list(50)
    
    pending_trainings = await db.training_completions.find(
        {"employee_id": emp["id"], "status": {"$in": ["assigned", "in_progress"]}},
        {"_id": 0}
    ).to_list(50)
    
    pending_signatures = await db.legal_documents.find(
        {"employee_id": emp["id"], "status": "pending_signature", "requires_employee_signature": True, "employee_signed_at": None},
        {"_id": 0}
    ).to_list(50)
    
    my_certifications = await db.compliance_certifications.find(
        {"employee_id": emp["id"]},
        {"_id": 0}
    ).to_list(50)
    
    return {
        "pending_policies": pending_policies,
        "pending_trainings": pending_trainings,
        "pending_signatures": pending_signatures,
        "my_certifications": my_certifications
    }


# --- Policies ---
@router.post("/policies")
async def create_policy(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new compliance policy"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create policies")
    
    policy = CompliancePolicy(**data, created_by=current_user.id)
    await db.compliance_policies.insert_one(policy.model_dump())
    return policy.model_dump()


@router.get("/policies")
async def get_policies(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get compliance policies"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["status"] = "published"
    
    policies = await db.compliance_policies.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return policies


@router.get("/policies/{policy_id}")
async def get_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific policy"""
    policy = await db.compliance_policies.find_one({"id": policy_id}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.put("/policies/{policy_id}")
async def update_policy(policy_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a policy"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update policies")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.get("status") == "published" and not data.get("published_at"):
        data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.compliance_policies.update_one({"id": policy_id}, {"$set": data})
    return await db.compliance_policies.find_one({"id": policy_id}, {"_id": 0})


@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    """Delete a policy"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete policies")
    
    await db.compliance_policies.delete_one({"id": policy_id})
    return {"message": "Policy deleted"}


@router.post("/policies/{policy_id}/acknowledge")
async def acknowledge_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    """Acknowledge a policy"""
    policy = await db.compliance_policies.find_one({"id": policy_id}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    existing = await db.policy_acknowledgements.find_one({
        "policy_id": policy_id, "employee_id": emp["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Policy already acknowledged")
    
    ack = PolicyAcknowledgement(
        policy_id=policy_id,
        policy_title=policy.get("title"),
        employee_id=emp["id"],
        employee_name=emp.get("full_name"),
        version_acknowledged=policy.get("version", "1.0")
    )
    await db.policy_acknowledgements.insert_one(ack.model_dump())
    return ack.model_dump()


@router.get("/my-acknowledgements")
async def get_my_acknowledgements(current_user: User = Depends(get_current_user)):
    """Get my policy acknowledgements"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        return []
    
    acks = await db.policy_acknowledgements.find(
        {"employee_id": emp["id"]}, {"_id": 0}
    ).sort("acknowledged_at", -1).to_list(200)
    return acks


# --- Trainings ---
@router.post("/trainings")
async def create_training(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a compliance training"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create trainings")
    
    training = ComplianceTraining(**data, created_by=current_user.id)
    await db.compliance_trainings.insert_one(training.model_dump())
    return training.model_dump()


@router.get("/trainings")
async def get_trainings(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get compliance trainings"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    trainings = await db.compliance_trainings.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return trainings


@router.get("/trainings/{training_id}")
async def get_training(training_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific training"""
    training = await db.compliance_trainings.find_one({"id": training_id}, {"_id": 0})
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    return training


@router.put("/trainings/{training_id}")
async def update_training(training_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a training"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update trainings")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.compliance_trainings.update_one({"id": training_id}, {"$set": data})
    return await db.compliance_trainings.find_one({"id": training_id}, {"_id": 0})


@router.delete("/trainings/{training_id}")
async def delete_training(training_id: str, current_user: User = Depends(get_current_user)):
    """Delete a training"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete trainings")
    
    await db.compliance_trainings.delete_one({"id": training_id})
    return {"message": "Training deleted"}


@router.post("/trainings/{training_id}/assign")
async def assign_training(training_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Assign training to employees"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can assign trainings")
    
    training = await db.compliance_trainings.find_one({"id": training_id}, {"_id": 0})
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    employee_ids = data.get("employee_ids", [])
    completions = []
    
    for emp_id in employee_ids:
        emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
        if emp:
            existing = await db.training_completions.find_one({
                "training_id": training_id, "employee_id": emp_id
            })
            if not existing:
                completion = TrainingCompletion(
                    training_id=training_id,
                    training_title=training.get("title"),
                    employee_id=emp_id,
                    employee_name=emp.get("full_name")
                )
                await db.training_completions.insert_one(completion.model_dump())
                completions.append(completion.model_dump())
    
    return {"assigned": len(completions), "completions": completions}


@router.get("/my-trainings")
async def get_my_trainings(current_user: User = Depends(get_current_user)):
    """Get my assigned trainings"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        return []
    
    completions = await db.training_completions.find(
        {"employee_id": emp["id"]}, {"_id": 0}
    ).sort("assigned_at", -1).to_list(200)
    return completions


@router.put("/my-trainings/{completion_id}")
async def update_my_training(completion_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update my training progress"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    completion = await db.training_completions.find_one({
        "id": completion_id, "employee_id": emp["id"]
    }, {"_id": 0})
    if not completion:
        raise HTTPException(status_code=404, detail="Training assignment not found")
    
    update = {}
    if "progress_percentage" in data:
        update["progress_percentage"] = data["progress_percentage"]
        if data["progress_percentage"] > 0 and not completion.get("started_at"):
            update["started_at"] = datetime.now(timezone.utc).isoformat()
            update["status"] = "in_progress"
    
    if "score" in data:
        update["score"] = data["score"]
        update["attempts"] = completion.get("attempts", 0) + 1
        
        training = await db.compliance_trainings.find_one({"id": completion["training_id"]}, {"_id": 0})
        if training and data["score"] >= training.get("passing_score", 80):
            update["status"] = "completed"
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    if "status" in data:
        update["status"] = data["status"]
        if data["status"] == "completed":
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.training_completions.update_one({"id": completion_id}, {"$set": update})
    return await db.training_completions.find_one({"id": completion_id}, {"_id": 0})


# --- Documents ---
@router.post("/documents")
async def create_document(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a legal document"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create documents")
    
    if data.get("employee_id"):
        emp = await db.employees.find_one({"id": data["employee_id"]}, {"_id": 0})
        if emp:
            data["employee_name"] = emp.get("full_name")
    
    doc = LegalDocument(**data, created_by=current_user.id)
    await db.legal_documents.insert_one(doc.model_dump())
    return doc.model_dump()


@router.get("/documents")
async def get_documents(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get legal documents"""
    query = {}
    if status:
        query["status"] = status
    if document_type:
        query["document_type"] = document_type
    if employee_id:
        query["employee_id"] = employee_id
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if emp:
            query["employee_id"] = emp["id"]
    
    documents = await db.legal_documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return documents


@router.get("/documents/{document_id}")
async def get_document(document_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific document"""
    doc = await db.legal_documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/documents/{document_id}")
async def update_document(document_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a document"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update documents")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.legal_documents.update_one({"id": document_id}, {"$set": data})
    return await db.legal_documents.find_one({"id": document_id}, {"_id": 0})


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    """Delete a document"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete documents")
    
    await db.legal_documents.delete_one({"id": document_id})
    return {"message": "Document deleted"}


@router.post("/documents/{document_id}/sign")
async def sign_document(document_id: str, current_user: User = Depends(get_current_user)):
    """Sign a document"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    doc = await db.legal_documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.get("employee_id") != emp["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to sign this document")
    
    update = {
        "employee_signed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if not doc.get("requires_company_signature") or doc.get("company_signed_at"):
        update["status"] = "signed"
    
    await db.legal_documents.update_one({"id": document_id}, {"$set": update})
    return await db.legal_documents.find_one({"id": document_id}, {"_id": 0})


# --- Incidents ---
@router.post("/incidents")
async def report_incident(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Report a compliance incident"""
    emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
    
    data["reported_by"] = current_user.id
    data["reported_by_name"] = emp.get("full_name") if emp else current_user.email
    
    if data.get("employee_involved"):
        involved = await db.employees.find_one({"id": data["employee_involved"]}, {"_id": 0})
        if involved:
            data["employee_involved_name"] = involved.get("full_name")
    
    incident = ComplianceIncident(**data)
    await db.compliance_incidents.insert_one(incident.model_dump())
    return incident.model_dump()


@router.get("/incidents")
async def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get compliance incidents"""
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        query["$or"] = [
            {"reported_by": current_user.id},
            {"is_confidential": False}
        ]
    
    incidents = await db.compliance_incidents.find(query, {"_id": 0}).sort("reported_at", -1).to_list(200)
    return incidents


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific incident"""
    incident = await db.compliance_incidents.find_one({"id": incident_id}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.put("/incidents/{incident_id}")
async def update_incident(incident_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update an incident"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update incidents")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if data.get("status") in ["resolved", "closed"]:
        data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.compliance_incidents.update_one({"id": incident_id}, {"$set": data})
    return await db.compliance_incidents.find_one({"id": incident_id}, {"_id": 0})


# --- Certifications ---
@router.post("/certifications")
async def create_certification(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a certification"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create certifications")
    
    if data.get("employee_id"):
        emp = await db.employees.find_one({"id": data["employee_id"]}, {"_id": 0})
        if emp:
            data["employee_name"] = emp.get("full_name")
    
    cert = ComplianceCertification(**data)
    await db.compliance_certifications.insert_one(cert.model_dump())
    return cert.model_dump()


@router.get("/certifications")
async def get_certifications(
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get certifications"""
    query = {}
    if status:
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        emp = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        if emp:
            query["employee_id"] = emp["id"]
    
    certs = await db.compliance_certifications.find(query, {"_id": 0}).sort("expiry_date", 1).to_list(200)
    return certs


@router.put("/certifications/{cert_id}")
async def update_certification(cert_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a certification"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update certifications")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.compliance_certifications.update_one({"id": cert_id}, {"$set": data})
    return await db.compliance_certifications.find_one({"id": cert_id}, {"_id": 0})


@router.delete("/certifications/{cert_id}")
async def delete_certification(cert_id: str, current_user: User = Depends(get_current_user)):
    """Delete a certification"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete certifications")
    
    await db.compliance_certifications.delete_one({"id": cert_id})
    return {"message": "Certification deleted"}
