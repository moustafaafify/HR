#!/usr/bin/env python3
"""
Data Seeding Script for HR Platform

This script creates properly linked test data for the HR platform.
It ensures:
1. Users have unique `id` fields
2. Employees have `user_id` that matches the corresponding user's `id`
3. All required name fields (first_name, last_name, full_name) are populated
4. Organizational hierarchy is properly established
"""

import os
import sys
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone
import bcrypt

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from pymongo import MongoClient

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = MongoClient(mongo_url)
db = client[db_name]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_id() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def clear_collections():
    """Clear existing data (optional - use with caution)"""
    collections = ['users', 'employees', 'corporations', 'branches', 'departments', 'divisions', 
                   'leaves', 'leave_balances', 'attendance', 'settings', 'roles']
    for coll in collections:
        db[coll].delete_many({})
    print("✓ Cleared existing collections")

def seed_settings():
    """Create global settings"""
    settings = {
        "id": "global_settings",
        "language_1": "en",
        "language_2": None,
        "currency": "USD",
        "exchange_rates": {"USD": 1.0, "EUR": 0.85, "GBP": 0.73},
        "updated_at": now_iso()
    }
    db.settings.replace_one({"id": "global_settings"}, settings, upsert=True)
    print("✓ Created global settings")
    return settings

def seed_roles():
    """Create default roles"""
    roles = [
        {
            "id": generate_id(),
            "name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access",
            "permissions": ["*"],
            "is_system_role": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "name": "corp_admin",
            "display_name": "Corporation Administrator",
            "description": "Manage corporation and employees",
            "permissions": ["employees.view", "employees.create", "employees.edit", "employees.reset_password",
                          "leaves.view", "leaves.approve", "attendance.view"],
            "is_system_role": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "name": "branch_manager",
            "display_name": "Branch Manager",
            "description": "Manage branch employees and operations",
            "permissions": ["employees.view", "leaves.view", "leaves.approve", "attendance.view"],
            "is_system_role": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "name": "employee",
            "display_name": "Employee",
            "description": "Standard employee access",
            "permissions": ["leaves.view", "leaves.create", "attendance.view"],
            "is_system_role": True,
            "created_at": now_iso()
        }
    ]
    
    for role in roles:
        db.roles.replace_one({"name": role["name"]}, role, upsert=True)
    
    print(f"✓ Created {len(roles)} roles")
    return roles

def seed_organization():
    """Create organizational hierarchy"""
    
    # Corporation
    corp_id = generate_id()
    corporation = {
        "id": corp_id,
        "name": "Lojyn Technologies",
        "address": "123 Tech Park, Silicon Valley, CA 94025",
        "logo": None,
        "created_by": "system",
        "created_at": now_iso()
    }
    db.corporations.replace_one({"id": corp_id}, corporation, upsert=True)
    
    # Branch
    branch_id = generate_id()
    branch = {
        "id": branch_id,
        "name": "Main Office",
        "corporation_id": corp_id,
        "parent_branch_id": None,
        "address": "123 Tech Park, Silicon Valley, CA 94025",
        "manager_id": None,
        "created_at": now_iso()
    }
    db.branches.replace_one({"id": branch_id}, branch, upsert=True)
    
    # Departments
    departments = []
    dept_data = [
        ("Engineering", "eng"),
        ("Human Resources", "hr"),
        ("Finance", "fin"),
        ("Marketing", "mkt"),
        ("Sales", "sales")
    ]
    
    for name, code in dept_data:
        dept_id = generate_id()
        dept = {
            "id": dept_id,
            "name": name,
            "branch_id": branch_id,
            "manager_id": None,
            "created_at": now_iso()
        }
        db.departments.replace_one({"id": dept_id}, dept, upsert=True)
        departments.append((dept_id, name, code))
    
    # Divisions (for Engineering)
    eng_dept_id = departments[0][0]
    divisions = []
    div_data = ["Frontend", "Backend", "DevOps", "QA"]
    
    for name in div_data:
        div_id = generate_id()
        division = {
            "id": div_id,
            "name": name,
            "department_id": eng_dept_id,
            "manager_id": None,
            "created_at": now_iso()
        }
        db.divisions.replace_one({"id": div_id}, division, upsert=True)
        divisions.append((div_id, name))
    
    print(f"✓ Created 1 corporation, 1 branch, {len(departments)} departments, {len(divisions)} divisions")
    
    return {
        "corporation_id": corp_id,
        "branch_id": branch_id,
        "departments": departments,
        "divisions": divisions
    }

def seed_users_and_employees(org_data):
    """
    Create users and employees with PROPERLY LINKED IDs.
    
    CRITICAL: employee.user_id MUST equal user.id
    """
    
    users_data = [
        # Admin user (no employee record needed)
        {
            "email": "admin@hrplatform.com",
            "password": "admin123",
            "first_name": "System",
            "last_name": "Administrator",
            "role": "super_admin",
            "is_employee": False
        },
        # Employee users
        {
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123",
            "first_name": "Sarah",
            "last_name": "Johnson",
            "role": "employee",
            "is_employee": True,
            "job_title": "Senior Software Engineer",
            "department_idx": 0,  # Engineering
            "division_idx": 0     # Frontend
        },
        {
            "email": "michael.chen@lojyn.com",
            "password": "michael123",
            "first_name": "Michael",
            "last_name": "Chen",
            "role": "employee",
            "is_employee": True,
            "job_title": "Backend Developer",
            "department_idx": 0,  # Engineering
            "division_idx": 1     # Backend
        },
        {
            "email": "emily.davis@lojyn.com",
            "password": "emily123",
            "first_name": "Emily",
            "last_name": "Davis",
            "role": "branch_manager",
            "is_employee": True,
            "job_title": "Engineering Manager",
            "department_idx": 0,  # Engineering
            "division_idx": None
        },
        {
            "email": "james.wilson@lojyn.com",
            "password": "james123",
            "first_name": "James",
            "last_name": "Wilson",
            "role": "employee",
            "is_employee": True,
            "job_title": "HR Specialist",
            "department_idx": 1,  # HR
            "division_idx": None
        },
        {
            "email": "amanda.martinez@lojyn.com",
            "password": "amanda123",
            "first_name": "Amanda",
            "last_name": "Martinez",
            "role": "employee",
            "is_employee": True,
            "job_title": "Financial Analyst",
            "department_idx": 2,  # Finance
            "division_idx": None
        },
        {
            "email": "david.brown@lojyn.com",
            "password": "david123",
            "first_name": "David",
            "last_name": "Brown",
            "role": "employee",
            "is_employee": True,
            "job_title": "Marketing Manager",
            "department_idx": 3,  # Marketing
            "division_idx": None
        },
        {
            "email": "lisa.taylor@lojyn.com",
            "password": "lisa123",
            "first_name": "Lisa",
            "last_name": "Taylor",
            "role": "employee",
            "is_employee": True,
            "job_title": "Sales Representative",
            "department_idx": 4,  # Sales
            "division_idx": None
        },
        {
            "email": "robert.anderson@lojyn.com",
            "password": "robert123",
            "first_name": "Robert",
            "last_name": "Anderson",
            "role": "employee",
            "is_employee": True,
            "job_title": "DevOps Engineer",
            "department_idx": 0,  # Engineering
            "division_idx": 2     # DevOps
        },
        {
            "email": "jennifer.thomas@lojyn.com",
            "password": "jennifer123",
            "first_name": "Jennifer",
            "last_name": "Thomas",
            "role": "employee",
            "is_employee": True,
            "job_title": "QA Engineer",
            "department_idx": 0,  # Engineering
            "division_idx": 3     # QA
        }
    ]
    
    created_users = []
    created_employees = []
    
    for user_data in users_data:
        # Generate a SINGLE ID that will be used for both user.id and employee.user_id
        user_id = generate_id()
        
        full_name = f"{user_data['first_name']} {user_data['last_name']}"
        
        # Create user
        user = {
            "id": user_id,  # This is the CRITICAL field
            "email": user_data["email"],
            "full_name": full_name,
            "first_name": user_data["first_name"],  # Also store separately for easier access
            "last_name": user_data["last_name"],
            "role": user_data["role"],
            "password_hash": hash_password(user_data["password"]),
            "created_at": now_iso()
        }
        
        db.users.replace_one({"email": user_data["email"]}, user, upsert=True)
        created_users.append(user)
        
        # Create employee record if needed
        if user_data.get("is_employee"):
            dept_idx = user_data.get("department_idx", 0)
            div_idx = user_data.get("division_idx")
            
            department_id = org_data["departments"][dept_idx][0]
            department_name = org_data["departments"][dept_idx][1]
            division_id = org_data["divisions"][div_idx][0] if div_idx is not None else None
            
            employee_record_id = generate_id()  # Employee record's own ID
            
            employee = {
                "id": employee_record_id,
                "user_id": user_id,  # CRITICAL: Links to user.id
                
                # Name fields - ALL populated consistently
                "full_name": full_name,
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                
                # Employee ID (human-readable format)
                "employee_id": f"EMP-{employee_record_id[:8].upper()}",
                
                # Contact
                "work_email": user_data["email"],
                "personal_email": f"{user_data['first_name'].lower()}@gmail.com",
                "personal_phone": f"+1-555-{str(hash(user_data['email']))[-7:].replace('-', '0')[:3]}-{str(hash(user_data['email']))[-4:].replace('-', '0')}",
                "work_phone": f"+1-555-100-{str(abs(hash(user_data['email'])))[:4]}",
                "home_address": "123 Main Street, San Francisco, CA 94102",
                
                # Emergency Contact
                "emergency_contact_name": f"{user_data['first_name']}'s Emergency Contact",
                "emergency_contact_relationship": "Spouse",
                "emergency_contact_phone": f"+1-555-999-{str(abs(hash(user_data['email'])))[:4]}",
                
                # Personal
                "date_of_birth": "1990-05-15",
                "gender": "female" if user_data["first_name"] in ["Sarah", "Emily", "Amanda", "Lisa", "Jennifer"] else "male",
                "marital_status": "single",
                
                # Employment
                "job_title": user_data.get("job_title", "Employee"),
                "department_id": department_id,
                "division_id": division_id,
                "branch_id": org_data["branch_id"],
                "corporation_id": org_data["corporation_id"],
                "work_location": "Main Office",
                "hire_date": "2023-01-15",
                "employment_status": "full-time",
                
                # Payroll
                "salary": 75000.0,
                "currency": "USD",
                "bank_name": "Chase Bank",
                "bank_account_number": f"****{str(abs(hash(user_data['email'])))[:4]}",
                
                # Leave
                "holiday_allowance": 20.0,
                "sick_leave_allowance": 10.0,
                
                # Portal Access
                "portal_access_enabled": True,
                "password_reset_required": False,
                
                # Status
                "status": "active",
                "created_at": now_iso()
            }
            
            db.employees.replace_one({"user_id": user_id}, employee, upsert=True)
            created_employees.append(employee)
    
    print(f"✓ Created {len(created_users)} users and {len(created_employees)} employees")
    print("  Users: " + ", ".join([u["email"] for u in created_users]))
    
    return created_users, created_employees

def seed_leave_balances(employees):
    """Create leave balances for all employees"""
    current_year = datetime.now().year
    
    for emp in employees:
        balance = {
            "id": generate_id(),
            "employee_id": emp["id"],
            "year": current_year,
            "annual_leave": 20.0,
            "annual_used": 2.0,
            "sick_leave": 10.0,
            "sick_used": 1.0,
            "personal_leave": 5.0,
            "personal_used": 0.0,
            "unpaid_used": 0.0,
            "maternity_leave": 90.0,
            "maternity_used": 0.0,
            "paternity_leave": 14.0,
            "paternity_used": 0.0,
            "bereavement_leave": 5.0,
            "bereavement_used": 0.0,
            "other_used": 0.0,
            "carry_over": 3.0,
            "updated_at": now_iso()
        }
        db.leave_balances.replace_one(
            {"employee_id": emp["id"], "year": current_year}, 
            balance, 
            upsert=True
        )
    
    print(f"✓ Created leave balances for {len(employees)} employees")

def verify_data_integrity():
    """Verify that user_id links are correct"""
    print("\n=== Data Integrity Check ===")
    
    employees = list(db.employees.find({}, {"_id": 0}))
    users = {u["id"]: u for u in db.users.find({}, {"_id": 0})}
    
    issues = []
    
    for emp in employees:
        user_id = emp.get("user_id")
        
        if not user_id:
            issues.append(f"Employee {emp.get('id')} has no user_id")
            continue
        
        if user_id not in users:
            issues.append(f"Employee {emp.get('id')}'s user_id '{user_id}' not found in users collection")
            continue
        
        user = users[user_id]
        
        # Check name consistency
        emp_name = emp.get("full_name", "")
        user_name = user.get("full_name", "")
        
        if not emp_name:
            issues.append(f"Employee {emp.get('id')} has empty full_name")
        
        if emp_name != user_name:
            issues.append(f"Employee {emp.get('id')} name mismatch: emp='{emp_name}' vs user='{user_name}'")
    
    if issues:
        print("❌ Issues found:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✓ All employees have valid user_id links")
        print("✓ All name fields are populated and consistent")
    
    # Summary
    print(f"\nSummary:")
    print(f"  Total users: {len(users)}")
    print(f"  Total employees: {len(employees)}")
    
    return len(issues) == 0

def main():
    print(f"=== HR Platform Data Seeding ===")
    print(f"Database: {db_name}")
    print(f"MongoDB URL: {mongo_url}\n")
    
    # Clear existing data (comment out to preserve existing data)
    clear_collections()
    
    # Seed data in order
    seed_settings()
    seed_roles()
    org_data = seed_organization()
    users, employees = seed_users_and_employees(org_data)
    seed_leave_balances(employees)
    
    # Verify data integrity
    is_valid = verify_data_integrity()
    
    if is_valid:
        print("\n✅ Data seeding completed successfully!")
        print("\nTest credentials:")
        print("  Admin: admin@hrplatform.com / admin123")
        print("  Employee: sarah.johnson@lojyn.com / sarah123")
    else:
        print("\n⚠️  Data seeding completed with warnings")
        sys.exit(1)

if __name__ == "__main__":
    main()
