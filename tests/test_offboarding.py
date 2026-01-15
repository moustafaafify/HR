"""
Offboarding Module Tests
Tests for offboarding templates CRUD, offboarding process management,
task completion, clearance updates, exit interviews, and feedback.
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"
SARAH_EMPLOYEE_ID = "b15e4e68-df7b-4802-9b44-9f33000b237c"

# Test data tracking
created_template_ids = []
created_offboarding_ids = []


class TestAuth:
    """Authentication tests"""
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Admin login successful - role: {data['user']['role']}")
    
    def test_employee_login(self, api_client):
        """Test employee login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"✓ Employee login successful - name: {data['user']['full_name']}")


class TestOffboardingTemplates:
    """Offboarding Templates CRUD tests"""
    
    def test_get_templates_list(self, authenticated_client):
        """Test getting list of offboarding templates"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboarding-templates")
        assert response.status_code == 200, f"Failed to get templates: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get templates list - found {len(data)} templates")
    
    def test_create_template_with_tasks(self, authenticated_client):
        """Test creating offboarding template with tasks"""
        template_data = {
            "name": "TEST_Standard Resignation Template",
            "description": "Standard offboarding process for resignations",
            "reason_type": "resignation",
            "duration_days": 14,
            "exit_message": "Thank you for your contributions. We wish you the best in your future endeavors.",
            "tasks": [
                {
                    "title": "Return laptop and equipment",
                    "description": "Return all company-issued equipment to IT",
                    "category": "asset_return",
                    "due_day": 1,
                    "is_required": True,
                    "assigned_to_type": "it",
                    "order": 1
                },
                {
                    "title": "Revoke system access",
                    "description": "Disable all system accounts and access",
                    "category": "access_revocation",
                    "due_day": 1,
                    "is_required": True,
                    "assigned_to_type": "it",
                    "order": 2
                },
                {
                    "title": "Knowledge transfer session",
                    "description": "Complete knowledge transfer to team members",
                    "category": "knowledge_transfer",
                    "due_day": 7,
                    "is_required": True,
                    "assigned_to_type": "employee",
                    "order": 3
                },
                {
                    "title": "Exit interview",
                    "description": "Conduct exit interview with HR",
                    "category": "exit_interview",
                    "due_day": 12,
                    "is_required": True,
                    "assigned_to_type": "hr",
                    "order": 4
                },
                {
                    "title": "Final documentation",
                    "description": "Complete all pending documentation",
                    "category": "documentation",
                    "due_day": 14,
                    "is_required": False,
                    "assigned_to_type": "employee",
                    "order": 5
                }
            ]
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/offboarding-templates", json=template_data)
        assert response.status_code == 200, f"Failed to create template: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["name"] == template_data["name"]
        assert data["reason_type"] == "resignation"
        assert data["duration_days"] == 14
        assert len(data["tasks"]) == 5
        
        # Verify task categories
        categories = [t["category"] for t in data["tasks"]]
        assert "asset_return" in categories
        assert "access_revocation" in categories
        assert "knowledge_transfer" in categories
        assert "exit_interview" in categories
        assert "documentation" in categories
        
        created_template_ids.append(data["id"])
        print(f"✓ Created template with {len(data['tasks'])} tasks - ID: {data['id']}")
        return data
    
    def test_get_template_by_id(self, authenticated_client):
        """Test getting template by ID"""
        if not created_template_ids:
            pytest.skip("No template created yet")
        
        template_id = created_template_ids[0]
        response = authenticated_client.get(f"{BASE_URL}/api/offboarding-templates/{template_id}")
        assert response.status_code == 200, f"Failed to get template: {response.text}"
        data = response.json()
        
        assert data["id"] == template_id
        assert "tasks" in data
        print(f"✓ Get template by ID - name: {data['name']}")
    
    def test_update_template(self, authenticated_client):
        """Test updating offboarding template"""
        if not created_template_ids:
            pytest.skip("No template created yet")
        
        template_id = created_template_ids[0]
        update_data = {
            "name": "TEST_Updated Resignation Template",
            "duration_days": 21,
            "exit_message": "Updated exit message for departing employees."
        }
        
        response = authenticated_client.put(f"{BASE_URL}/api/offboarding-templates/{template_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update template: {response.text}"
        data = response.json()
        
        assert data["name"] == update_data["name"]
        assert data["duration_days"] == 21
        assert data["exit_message"] == update_data["exit_message"]
        print(f"✓ Updated template - new duration: {data['duration_days']} days")
    
    def test_template_not_found(self, authenticated_client):
        """Test 404 for non-existent template"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboarding-templates/non-existent-id")
        assert response.status_code == 404
        print("✓ Template not found returns 404")


class TestOffboardings:
    """Offboarding process tests"""
    
    def test_get_offboardings_list(self, authenticated_client):
        """Test getting list of offboardings"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings")
        assert response.status_code == 200, f"Failed to get offboardings: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get offboardings list - found {len(data)} offboardings")
    
    def test_get_offboarding_stats(self, authenticated_client):
        """Test getting offboarding statistics"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/stats")
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        data = response.json()
        
        # Verify stats structure
        assert "total" in data
        assert "in_progress" in data
        assert "completed" in data
        assert "on_hold" in data
        assert "not_started" in data
        assert "overdue_tasks" in data
        assert "avg_completion_rate" in data
        
        print(f"✓ Get stats - total: {data['total']}, in_progress: {data['in_progress']}, completed: {data['completed']}")
    
    def test_create_offboarding_from_template(self, authenticated_client):
        """Test creating offboarding from template - verify tasks are copied"""
        if not created_template_ids:
            pytest.skip("No template created yet")
        
        # Get employees to find one for offboarding
        emp_response = authenticated_client.get(f"{BASE_URL}/api/employees")
        assert emp_response.status_code == 200
        employees = emp_response.json()
        
        if not employees:
            pytest.skip("No employees found")
        
        # Use first employee that's not Sarah (to keep Sarah for employee view testing)
        test_employee = None
        for emp in employees:
            if emp["id"] != SARAH_EMPLOYEE_ID:
                test_employee = emp
                break
        
        if not test_employee:
            test_employee = employees[0]
        
        last_working_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        
        offboarding_data = {
            "template_id": created_template_ids[0],
            "employee_id": test_employee["id"],
            "last_working_date": last_working_date,
            "reason": "resignation",
            "reason_details": "Personal reasons",
            "notes": "TEST offboarding"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/offboardings", json=offboarding_data)
        assert response.status_code == 200, f"Failed to create offboarding: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["employee_id"] == test_employee["id"]
        assert data["reason"] == "resignation"
        assert data["status"] == "in_progress"
        
        # Verify tasks were copied from template
        assert "tasks" in data
        assert len(data["tasks"]) == 5, f"Expected 5 tasks, got {len(data['tasks'])}"
        
        # Verify task completion tracking fields were added
        for task in data["tasks"]:
            assert "completed" in task
            assert task["completed"] == False
            assert "completed_at" in task
            assert task["completed_at"] is None
        
        created_offboarding_ids.append(data["id"])
        print(f"✓ Created offboarding with {len(data['tasks'])} tasks copied from template - ID: {data['id']}")
        return data
    
    def test_create_offboarding_without_template(self, authenticated_client):
        """Test creating offboarding without template"""
        emp_response = authenticated_client.get(f"{BASE_URL}/api/employees")
        employees = emp_response.json()
        
        if len(employees) < 2:
            pytest.skip("Not enough employees")
        
        # Find another employee
        test_employee = None
        for emp in employees:
            if emp["id"] not in [SARAH_EMPLOYEE_ID] and emp["id"] not in [o.get("employee_id") for o in created_offboarding_ids]:
                test_employee = emp
                break
        
        if not test_employee:
            test_employee = employees[-1]
        
        last_working_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        offboarding_data = {
            "employee_id": test_employee["id"],
            "last_working_date": last_working_date,
            "reason": "termination",
            "reason_details": "Performance issues",
            "notes": "TEST offboarding without template"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/offboardings", json=offboarding_data)
        assert response.status_code == 200, f"Failed to create offboarding: {response.text}"
        data = response.json()
        
        assert data["reason"] == "termination"
        assert data["tasks"] == [] or len(data.get("tasks", [])) == 0
        
        created_offboarding_ids.append(data["id"])
        print(f"✓ Created offboarding without template - ID: {data['id']}")
    
    def test_get_offboarding_by_id(self, authenticated_client):
        """Test getting offboarding by ID"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/{offboarding_id}")
        assert response.status_code == 200, f"Failed to get offboarding: {response.text}"
        data = response.json()
        
        assert data["id"] == offboarding_id
        print(f"✓ Get offboarding by ID - status: {data['status']}")
    
    def test_filter_offboardings_by_status(self, authenticated_client):
        """Test filtering offboardings by status"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings?status=in_progress")
        assert response.status_code == 200, f"Failed to filter offboardings: {response.text}"
        data = response.json()
        
        for ob in data:
            assert ob["status"] == "in_progress"
        
        print(f"✓ Filter by status - found {len(data)} in_progress offboardings")
    
    def test_offboarding_not_found(self, authenticated_client):
        """Test 404 for non-existent offboarding"""
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/non-existent-id")
        assert response.status_code == 404
        print("✓ Offboarding not found returns 404")


class TestTaskCompletion:
    """Task completion tests"""
    
    def test_complete_task(self, authenticated_client):
        """Test completing a task"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        # Get offboarding to check tasks
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/{offboarding_id}")
        offboarding = response.json()
        
        if not offboarding.get("tasks"):
            pytest.skip("No tasks in offboarding")
        
        # Complete first task
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/tasks/0",
            json={"completed": True, "completion_notes": "Equipment returned successfully"}
        )
        assert response.status_code == 200, f"Failed to complete task: {response.text}"
        data = response.json()
        
        assert data["tasks"][0]["completed"] == True
        assert data["tasks"][0]["completed_at"] is not None
        assert data["tasks"][0]["completion_notes"] == "Equipment returned successfully"
        
        print(f"✓ Task completed - task: {data['tasks'][0]['title']}")
    
    def test_uncomplete_task(self, authenticated_client):
        """Test marking task as incomplete"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        # Mark task as incomplete
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/tasks/0",
            json={"completed": False}
        )
        assert response.status_code == 200, f"Failed to uncomplete task: {response.text}"
        data = response.json()
        
        assert data["tasks"][0]["completed"] == False
        assert data["tasks"][0]["completed_at"] is None
        
        print("✓ Task marked as incomplete")
    
    def test_invalid_task_index(self, authenticated_client):
        """Test 404 for invalid task index"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/tasks/999",
            json={"completed": True}
        )
        assert response.status_code == 404
        print("✓ Invalid task index returns 404")
    
    def test_auto_complete_offboarding(self, authenticated_client):
        """Test auto-complete offboarding when all tasks done"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        # Get offboarding
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/{offboarding_id}")
        offboarding = response.json()
        
        if not offboarding.get("tasks"):
            pytest.skip("No tasks in offboarding")
        
        # Complete all tasks
        for i in range(len(offboarding["tasks"])):
            response = authenticated_client.put(
                f"{BASE_URL}/api/offboardings/{offboarding_id}/tasks/{i}",
                json={"completed": True}
            )
            assert response.status_code == 200
        
        # Check if offboarding is auto-completed
        response = authenticated_client.get(f"{BASE_URL}/api/offboardings/{offboarding_id}")
        data = response.json()
        
        assert data["status"] == "completed", f"Expected completed status, got {data['status']}"
        assert data["completed_at"] is not None
        
        print("✓ Offboarding auto-completed when all tasks done")


class TestClearance:
    """Clearance status tests"""
    
    def test_update_clearance(self, authenticated_client):
        """Test updating clearance status"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        clearance_data = {
            "clearance_hr": True,
            "clearance_it": True,
            "clearance_finance": False,
            "clearance_manager": True,
            "clearance_admin": False
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/clearance",
            json=clearance_data
        )
        assert response.status_code == 200, f"Failed to update clearance: {response.text}"
        data = response.json()
        
        assert data["clearance_hr"] == True
        assert data["clearance_it"] == True
        assert data["clearance_finance"] == False
        assert data["clearance_manager"] == True
        assert data["clearance_admin"] == False
        
        print("✓ Clearance updated - HR: ✓, IT: ✓, Finance: ✗, Manager: ✓, Admin: ✗")
    
    def test_update_all_clearances(self, authenticated_client):
        """Test updating all clearances to true"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        clearance_data = {
            "clearance_hr": True,
            "clearance_it": True,
            "clearance_finance": True,
            "clearance_manager": True,
            "clearance_admin": True
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/clearance",
            json=clearance_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert all([
            data["clearance_hr"],
            data["clearance_it"],
            data["clearance_finance"],
            data["clearance_manager"],
            data["clearance_admin"]
        ])
        
        print("✓ All clearances updated to true")


class TestExitInterview:
    """Exit interview tests"""
    
    def test_update_exit_interview(self, authenticated_client):
        """Test updating exit interview details"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        interview_date = (datetime.now() + timedelta(days=10)).isoformat()
        
        interview_data = {
            "conducted": True,
            "date": interview_date,
            "notes": "Employee expressed satisfaction with team but cited better opportunity elsewhere."
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/exit-interview",
            json=interview_data
        )
        assert response.status_code == 200, f"Failed to update exit interview: {response.text}"
        data = response.json()
        
        assert data["exit_interview_conducted"] == True
        assert data["exit_interview_date"] == interview_date
        assert "satisfaction" in data["exit_interview_notes"]
        
        print("✓ Exit interview updated - conducted: True")


class TestFeedback:
    """Feedback submission tests"""
    
    def test_submit_feedback(self, authenticated_client):
        """Test submitting offboarding feedback"""
        if not created_offboarding_ids:
            pytest.skip("No offboarding created yet")
        
        offboarding_id = created_offboarding_ids[0]
        
        feedback_data = {
            "feedback": "The offboarding process was smooth and well-organized. HR was very helpful throughout.",
            "rating": 4
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/offboardings/{offboarding_id}/feedback",
            json=feedback_data
        )
        assert response.status_code == 200, f"Failed to submit feedback: {response.text}"
        data = response.json()
        
        assert data["feedback"] == feedback_data["feedback"]
        assert data["feedback_rating"] == 4
        
        print("✓ Feedback submitted - rating: 4/5")


class TestMyOffboarding:
    """Employee's own offboarding view tests"""
    
    def test_get_my_offboarding_as_employee(self, api_client):
        """Test getting employee's own offboarding"""
        # Login as employee
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Employee login failed")
        
        token = login_response.json()["token"]
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        
        response = api_client.get(f"{BASE_URL}/api/offboardings/my")
        assert response.status_code == 200, f"Failed to get my offboarding: {response.text}"
        
        # Response can be null if no active offboarding
        data = response.json()
        if data:
            assert "employee_id" in data
            assert "status" in data
            print(f"✓ Get my offboarding - status: {data['status']}")
        else:
            print("✓ Get my offboarding - no active offboarding (expected)")


class TestUpdateOffboarding:
    """Offboarding update tests"""
    
    def test_update_offboarding_status(self, authenticated_client):
        """Test updating offboarding status"""
        if len(created_offboarding_ids) < 2:
            pytest.skip("Need at least 2 offboardings")
        
        # Use second offboarding (without template)
        offboarding_id = created_offboarding_ids[1]
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/offboardings/{offboarding_id}",
            json={"status": "on_hold"}
        )
        assert response.status_code == 200, f"Failed to update status: {response.text}"
        data = response.json()
        
        assert data["status"] == "on_hold"
        print("✓ Offboarding status updated to on_hold")


class TestCleanup:
    """Cleanup tests - delete test data"""
    
    def test_delete_offboardings(self, authenticated_client):
        """Delete test offboardings"""
        for offboarding_id in created_offboarding_ids:
            response = authenticated_client.delete(f"{BASE_URL}/api/offboardings/{offboarding_id}")
            assert response.status_code == 200, f"Failed to delete offboarding: {response.text}"
        
        print(f"✓ Deleted {len(created_offboarding_ids)} test offboardings")
    
    def test_delete_templates(self, authenticated_client):
        """Delete test templates"""
        for template_id in created_template_ids:
            response = authenticated_client.delete(f"{BASE_URL}/api/offboarding-templates/{template_id}")
            assert response.status_code == 200, f"Failed to delete template: {response.text}"
        
        print(f"✓ Deleted {len(created_template_ids)} test templates")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
