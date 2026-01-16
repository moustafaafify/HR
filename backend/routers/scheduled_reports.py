"""Scheduled Reports Router for HR Platform."""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import json
import io

import sys
sys.path.insert(0, '/app/backend')
from database import db
from auth import get_current_user
from models.core import User, UserRole


router = APIRouter(prefix="/scheduled-reports", tags=["Scheduled Reports"])


# ============= MODELS =============

class ScheduledReport(BaseModel):
    """Scheduled report configuration"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Report details
    name: str
    description: Optional[str] = None
    report_type: str  # analytics, leave, attendance, compliance, workforce, visitors, employees
    
    # Schedule
    frequency: str = "weekly"  # daily, weekly, monthly
    day_of_week: Optional[int] = None  # 0-6 for weekly (Monday=0)
    day_of_month: Optional[int] = None  # 1-31 for monthly
    time_of_day: str = "09:00"  # HH:MM format
    timezone: str = "UTC"
    
    # Recipients
    recipients: List[str] = Field(default_factory=list)  # email addresses
    cc_recipients: List[str] = Field(default_factory=list)
    
    # Format
    format: str = "pdf"  # pdf, csv, both
    include_charts: bool = True
    
    # Filters
    filters: Dict[str, Any] = Field(default_factory=dict)
    date_range: str = "last_period"  # last_period, last_7_days, last_30_days, last_quarter, custom
    
    # Status
    status: str = "active"  # active, paused, deleted
    last_run: Optional[str] = None
    last_run_status: Optional[str] = None
    next_run: Optional[str] = None
    run_count: int = 0
    
    # Metadata
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReportRun(BaseModel):
    """Record of a report execution"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    scheduled_report_id: str
    report_name: str
    report_type: str
    
    status: str = "pending"  # pending, generating, sending, completed, failed
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    
    recipients: List[str] = Field(default_factory=list)
    format: str = "pdf"
    
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    
    error_message: Optional[str] = None
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============= HELPER FUNCTIONS =============

def calculate_next_run(frequency: str, day_of_week: int = None, day_of_month: int = None, time_of_day: str = "09:00") -> str:
    """Calculate the next run time for a scheduled report"""
    now = datetime.now(timezone.utc)
    hour, minute = map(int, time_of_day.split(':'))
    
    if frequency == "daily":
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
    
    elif frequency == "weekly":
        target_day = day_of_week if day_of_week is not None else 0  # Monday default
        days_ahead = target_day - now.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_run = now + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(weeks=1)
    
    elif frequency == "monthly":
        target_day = day_of_month if day_of_month is not None else 1
        next_run = now.replace(day=min(target_day, 28), hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            if now.month == 12:
                next_run = next_run.replace(year=now.year + 1, month=1)
            else:
                next_run = next_run.replace(month=now.month + 1)
    
    else:
        next_run = now + timedelta(days=1)
    
    return next_run.isoformat()


async def generate_report_data(report_type: str, filters: dict, date_range: str) -> dict:
    """Generate report data based on type"""
    now = datetime.now(timezone.utc)
    
    # Calculate date range
    if date_range == "last_7_days":
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
    elif date_range == "last_30_days":
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
    elif date_range == "last_quarter":
        start_date = (now - timedelta(days=90)).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
    else:  # last_period (default based on frequency)
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
    
    data = {
        "report_type": report_type,
        "generated_at": now.isoformat(),
        "date_range": {"start": start_date, "end": end_date},
        "data": {}
    }
    
    if report_type == "analytics":
        total_employees = await db.employees.count_documents({"status": "active"})
        new_hires = await db.employees.count_documents({
            "hire_date": {"$gte": start_date, "$lte": end_date}
        })
        leaves_taken = await db.leaves.count_documents({
            "status": "approved",
            "start_date": {"$gte": start_date}
        })
        dept_stats = await db.employees.aggregate([
            {"$match": {"status": "active"}},
            {"$group": {"_id": "$department_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(20)
        
        data["data"] = {
            "summary": {
                "total_employees": total_employees,
                "new_hires": new_hires,
                "leaves_taken": leaves_taken
            },
            "department_distribution": [{d["_id"] or "Unassigned": d["count"]} for d in dept_stats]
        }
    
    elif report_type == "leave":
        leaves = await db.leaves.find({
            "start_date": {"$gte": start_date}
        }, {"_id": 0}).to_list(500)
        
        by_type = {}
        by_status = {}
        for leave in leaves:
            lt = leave.get("leave_type", "other")
            ls = leave.get("status", "pending")
            by_type[lt] = by_type.get(lt, 0) + 1
            by_status[ls] = by_status.get(ls, 0) + 1
        
        data["data"] = {
            "total_requests": len(leaves),
            "by_type": by_type,
            "by_status": by_status,
            "details": leaves[:100]  # Limit for email
        }
    
    elif report_type == "attendance":
        # Attendance data
        data["data"] = {
            "summary": "Attendance report data",
            "note": "Full attendance tracking coming soon"
        }
    
    elif report_type == "compliance":
        policies = await db.compliance_policies.count_documents({"status": "published"})
        trainings = await db.compliance_trainings.count_documents({"status": "active"})
        incidents = await db.compliance_incidents.count_documents({
            "reported_at": {"$gte": start_date}
        })
        
        data["data"] = {
            "active_policies": policies,
            "active_trainings": trainings,
            "recent_incidents": incidents
        }
    
    elif report_type == "workforce":
        plans = await db.headcount_plans.find({}, {"_id": 0}).to_list(50)
        allocations = await db.resource_allocations.count_documents({"status": "active"})
        
        data["data"] = {
            "headcount_plans": len(plans),
            "active_allocations": allocations,
            "plans": plans[:10]
        }
    
    elif report_type == "visitors":
        visitors = await db.visitors.find({
            "expected_date": {"$gte": start_date, "$lte": end_date}
        }, {"_id": 0}).to_list(500)
        
        by_status = {}
        by_type = {}
        for v in visitors:
            vs = v.get("status", "unknown")
            vt = v.get("visit_type", "other")
            by_status[vs] = by_status.get(vs, 0) + 1
            by_type[vt] = by_type.get(vt, 0) + 1
        
        data["data"] = {
            "total_visitors": len(visitors),
            "by_status": by_status,
            "by_type": by_type
        }
    
    elif report_type == "employees":
        employees = await db.employees.find({"status": "active"}, {"_id": 0}).to_list(500)
        
        by_dept = {}
        by_status = {}
        for emp in employees:
            dept = emp.get("department_name", "Unassigned")
            status = emp.get("employment_status", "unknown")
            by_dept[dept] = by_dept.get(dept, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1
        
        data["data"] = {
            "total_employees": len(employees),
            "by_department": by_dept,
            "by_employment_status": by_status
        }
    
    return data


async def send_report_email(report: dict, report_data: dict, settings: dict) -> bool:
    """Send report via email"""
    smtp = settings.get("smtp", {})
    if not smtp.get("enabled") or not smtp.get("host"):
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Scheduled Report: {report['name']} - {datetime.now().strftime('%Y-%m-%d')}"
        msg['From'] = f"{smtp.get('from_name', 'HR Platform')} <{smtp.get('from_email', smtp.get('username'))}>"
        msg['To'] = ', '.join(report['recipients'])
        if report.get('cc_recipients'):
            msg['Cc'] = ', '.join(report['cc_recipients'])
        
        # Build HTML content
        data = report_data.get('data', {})
        date_range = report_data.get('date_range', {})
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 700px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #f8fafc; }}
                .section {{ background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                .section h3 {{ margin-top: 0; color: #1e293b; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }}
                .stat-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }}
                .stat-box {{ background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #6366f1; }}
                .stat-label {{ font-size: 12px; color: #64748b; text-transform: uppercase; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
                th {{ background: #f1f5f9; font-weight: 600; }}
                .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0;">{report['name']}</h1>
                    <p style="margin:10px 0 0 0; opacity: 0.9;">
                        {report_data['report_type'].replace('_', ' ').title()} Report | 
                        {date_range.get('start', '')} to {date_range.get('end', '')}
                    </p>
                </div>
                <div class="content">
        """
        
        # Add report-specific content
        if report_data['report_type'] == 'analytics':
            summary = data.get('summary', {})
            html_content += f"""
                    <div class="section">
                        <h3>📊 Summary</h3>
                        <div class="stat-grid">
                            <div class="stat-box">
                                <div class="stat-value">{summary.get('total_employees', 0)}</div>
                                <div class="stat-label">Total Employees</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{summary.get('new_hires', 0)}</div>
                                <div class="stat-label">New Hires</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{summary.get('leaves_taken', 0)}</div>
                                <div class="stat-label">Leaves Taken</div>
                            </div>
                        </div>
                    </div>
            """
        
        elif report_data['report_type'] == 'leave':
            html_content += f"""
                    <div class="section">
                        <h3>🏖️ Leave Summary</h3>
                        <div class="stat-grid">
                            <div class="stat-box">
                                <div class="stat-value">{data.get('total_requests', 0)}</div>
                                <div class="stat-label">Total Requests</div>
                            </div>
                        </div>
                        <h4>By Type</h4>
                        <table>
                            <tr><th>Leave Type</th><th>Count</th></tr>
                            {''.join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in data.get('by_type', {}).items())}
                        </table>
                    </div>
            """
        
        elif report_data['report_type'] == 'visitors':
            html_content += f"""
                    <div class="section">
                        <h3>👥 Visitor Summary</h3>
                        <div class="stat-grid">
                            <div class="stat-box">
                                <div class="stat-value">{data.get('total_visitors', 0)}</div>
                                <div class="stat-label">Total Visitors</div>
                            </div>
                        </div>
                        <h4>By Status</h4>
                        <table>
                            <tr><th>Status</th><th>Count</th></tr>
                            {''.join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in data.get('by_status', {}).items())}
                        </table>
                    </div>
            """
        
        else:
            # Generic data display
            html_content += f"""
                    <div class="section">
                        <h3>📋 Report Data</h3>
                        <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto;">
{json.dumps(data, indent=2, default=str)[:2000]}
                        </pre>
                    </div>
            """
        
        html_content += """
                </div>
                <div class="footer">
                    <p>This is an automated report from HR Platform.</p>
                    <p>Generated at """ + datetime.now().strftime('%Y-%m-%d %H:%M UTC') + """</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, 'html'))
        
        # Connect and send
        host = smtp.get('host')
        port = smtp.get('port', 587)
        encryption = smtp.get('encryption', 'tls')
        
        if encryption == 'ssl':
            server = smtplib.SMTP_SSL(host, port, timeout=30)
        else:
            server = smtplib.SMTP(host, port, timeout=30)
            if encryption == 'tls':
                server.starttls()
        
        server.login(smtp.get('username'), smtp.get('password'))
        
        all_recipients = report['recipients'] + report.get('cc_recipients', [])
        server.sendmail(smtp.get('from_email', smtp.get('username')), all_recipients, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send report email: {e}")
        return False


# ============= ROUTES =============

@router.get("/report-types")
async def get_report_types():
    """Get available report types"""
    return [
        {"id": "analytics", "name": "HR Analytics", "description": "Headcount, turnover, department stats", "icon": "bar-chart"},
        {"id": "leave", "name": "Leave Report", "description": "Leave requests, approvals, balances", "icon": "calendar"},
        {"id": "attendance", "name": "Attendance Report", "description": "Clock-in/out, working hours", "icon": "clock"},
        {"id": "compliance", "name": "Compliance Report", "description": "Policies, trainings, incidents", "icon": "shield"},
        {"id": "workforce", "name": "Workforce Planning", "description": "Headcount plans, allocations", "icon": "users"},
        {"id": "visitors", "name": "Visitor Report", "description": "Visitor logs, check-ins", "icon": "user-check"},
        {"id": "employees", "name": "Employee Directory", "description": "Employee list, departments", "icon": "user"}
    ]


@router.post("")
async def create_scheduled_report(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new scheduled report"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can create scheduled reports")
    
    # Calculate next run
    next_run = calculate_next_run(
        data.get("frequency", "weekly"),
        data.get("day_of_week"),
        data.get("day_of_month"),
        data.get("time_of_day", "09:00")
    )
    
    report = ScheduledReport(
        **data,
        next_run=next_run,
        created_by=current_user.id
    )
    
    await db.scheduled_reports.insert_one(report.model_dump())
    return report.model_dump()


@router.get("")
async def get_scheduled_reports(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all scheduled reports"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can view scheduled reports")
    
    query = {"status": {"$ne": "deleted"}}
    if status:
        query["status"] = status
    
    reports = await db.scheduled_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reports


@router.get("/{report_id}")
async def get_scheduled_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific scheduled report"""
    report = await db.scheduled_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    return report


@router.put("/{report_id}")
async def update_scheduled_report(report_id: str, data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update a scheduled report"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can update scheduled reports")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate next run if schedule changed
    if any(k in data for k in ["frequency", "day_of_week", "day_of_month", "time_of_day"]):
        report = await db.scheduled_reports.find_one({"id": report_id}, {"_id": 0})
        if report:
            data["next_run"] = calculate_next_run(
                data.get("frequency", report.get("frequency", "weekly")),
                data.get("day_of_week", report.get("day_of_week")),
                data.get("day_of_month", report.get("day_of_month")),
                data.get("time_of_day", report.get("time_of_day", "09:00"))
            )
    
    await db.scheduled_reports.update_one({"id": report_id}, {"$set": data})
    return await db.scheduled_reports.find_one({"id": report_id}, {"_id": 0})


@router.delete("/{report_id}")
async def delete_scheduled_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Delete a scheduled report"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can delete scheduled reports")
    
    await db.scheduled_reports.update_one(
        {"id": report_id}, 
        {"$set": {"status": "deleted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Scheduled report deleted"}


@router.post("/{report_id}/run")
async def run_report_now(
    report_id: str, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Run a scheduled report immediately"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can run reports")
    
    report = await db.scheduled_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    # Create run record
    run = ReportRun(
        scheduled_report_id=report_id,
        report_name=report["name"],
        report_type=report["report_type"],
        recipients=report["recipients"],
        format=report["format"],
        status="generating"
    )
    await db.report_runs.insert_one(run.model_dump())
    
    # Generate and send report
    try:
        # Generate report data
        report_data = await generate_report_data(
            report["report_type"],
            report.get("filters", {}),
            report.get("date_range", "last_period")
        )
        
        # Get settings for SMTP
        settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
        if not settings:
            settings = {}
        
        # Send email
        success = await send_report_email(report, report_data, settings)
        
        # Update run status
        await db.report_runs.update_one(
            {"id": run.id},
            {"$set": {
                "status": "completed" if success else "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error_message": None if success else "Failed to send email - check SMTP settings"
            }}
        )
        
        # Update report stats
        await db.scheduled_reports.update_one(
            {"id": report_id},
            {"$set": {
                "last_run": datetime.now(timezone.utc).isoformat(),
                "last_run_status": "success" if success else "failed",
                "run_count": report.get("run_count", 0) + 1,
                "next_run": calculate_next_run(
                    report.get("frequency", "weekly"),
                    report.get("day_of_week"),
                    report.get("day_of_month"),
                    report.get("time_of_day", "09:00")
                )
            }}
        )
        
        # Log email
        if success:
            await db.email_logs.insert_one({
                "id": str(uuid.uuid4()),
                "type": "scheduled_report",
                "recipient": ", ".join(report["recipients"]),
                "subject": f"Scheduled Report: {report['name']}",
                "status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "sent_by": current_user.id
            })
        
        return {
            "success": success,
            "run_id": run.id,
            "message": "Report generated and sent successfully" if success else "Report generated but email failed - check SMTP settings"
        }
    
    except Exception as e:
        await db.report_runs.update_one(
            {"id": run.id},
            {"$set": {
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error_message": str(e)
            }}
        )
        raise HTTPException(status_code=500, detail=f"Failed to run report: {str(e)}")


@router.post("/{report_id}/pause")
async def pause_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Pause a scheduled report"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can pause reports")
    
    await db.scheduled_reports.update_one(
        {"id": report_id},
        {"$set": {"status": "paused", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Report paused"}


@router.post("/{report_id}/resume")
async def resume_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Resume a paused report"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can resume reports")
    
    report = await db.scheduled_reports.find_one({"id": report_id}, {"_id": 0})
    if report:
        next_run = calculate_next_run(
            report.get("frequency", "weekly"),
            report.get("day_of_week"),
            report.get("day_of_month"),
            report.get("time_of_day", "09:00")
        )
        
        await db.scheduled_reports.update_one(
            {"id": report_id},
            {"$set": {
                "status": "active",
                "next_run": next_run,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {"message": "Report resumed"}


@router.get("/{report_id}/runs")
async def get_report_runs(
    report_id: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get run history for a scheduled report"""
    runs = await db.report_runs.find(
        {"scheduled_report_id": report_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(limit)
    return runs


@router.post("/preview")
async def preview_report(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Preview report data without sending"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can preview reports")
    
    report_data = await generate_report_data(
        data.get("report_type", "analytics"),
        data.get("filters", {}),
        data.get("date_range", "last_7_days")
    )
    
    return report_data
