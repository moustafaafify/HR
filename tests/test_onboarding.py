"""
Onboarding Module Tests
Tests for:
- Onboarding Templates CRUD
- Onboardings CRUD
- Task completion and auto-complete
- Stats endpoint
- My onboarding endpoint
- Feedback submission
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


class TestOnboardingModule:
    """Onboarding Module Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        self.employee_token = None
        self.created_template_id = None
        self.created_onboarding_id = None
    
    def get_admin_token(self):
        """Get admin authentication token"""
        if self.admin_token:
            return self.admin_token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("token")
        return self.admin_token
    
    def get_employee_token(self):
        """Get employee authentication token"""
        if self.employee_token:
            return self.employee_token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        self.employee_token = response.json().get("token")
        return self.employee_token
    
    def admin_headers(self):
        """Get headers with admin token"""
        return {"Authorization": f"Bearer {self.get_admin_token()}"}
    
    def employee_headers(self):
        """Get headers with employee token"""
        return {"Authorization": f"Bearer {self.get_employee_token()}"}
    
    # ============= AUTHENTICATION TESTS =============
    
    def test_01_admin_login(self):
        """Test admin login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['user']['full_name']}")
    
    def test_02_employee_login(self):
        """Test employee login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Employee login successful: {data['user']['full_name']}")
    
    # ============= ONBOARDING TEMPLATES TESTS =============
    
    def test_03_get_templates_empty_or_existing(self):
        """Test getting onboarding templates list"""
        response = self.session.get(
            f"{BASE_URL}/api/onboarding-templates",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get templates: {len(data)} templates found")
    
    def test_04_create_template_with_tasks(self):
        """Test creating onboarding template with tasks"""
        template_data = {
            "name": "TEST_Engineering Onboarding",
            "description": "Onboarding template for engineering team",
            "duration_days": 30,
            "position_type": "engineering",
            "welcome_message": "Welcome to the engineering team!",
            "tasks": [
                {
                    "title": "Complete HR paperwork",
                    "description": "Fill out all required HR forms",
                    "category": "documentation",
                    "due_day": 1,
                    "is_required": True,
                    "order": 1
                },
                {
                    "title": "Setup development environment",
                    "description": "Install IDE, tools, and configure access",
                    "category": "it_setup",
                    "due_day": 2,
                    "is_required": True,
                    "order": 2
                },
                {
                    "title": "Complete security training",
                    "description": "Watch security awareness videos",
                    "category": "compliance",
                    "due_day": 5,
                    "is_required": True,
                    "order": 3,
                    "resource_url": "https://training.example.com/security"
                },
                {
                    "title": "Meet the team",
                    "description": "Schedule 1:1s with team members",
                    "category": "introduction",
                    "due_day": 7,
                    "is_required": False,
                    "order": 4
                },
                {
                    "title": "Review codebase",
                    "description": "Familiarize with main repositories",
                    "category": "training",
                    "due_day": 14,
                    "is_required": True,
                    "order": 5
                }
            ]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/onboarding-templates",
            headers=self.admin_headers(),
            json=template_data
        )
        assert response.status_code == 200, f"Create template failed: {response.text}"
        data = response.json()
        
        # Verify response data
        assert "id" in data
        assert data["name"] == template_data["name"]
        assert data["duration_days"] == 30
        assert len(data["tasks"]) == 5
        assert data["tasks"][0]["title"] == "Complete HR paperwork"
        assert data["tasks"][0]["category"] == "documentation"
        assert data["tasks"][0]["is_required"] == True
        
        self.__class__.created_template_id = data["id"]
        print(f"✓ Created template: {data['name']} with {len(data['tasks'])} tasks")
    
    def test_05_get_template_by_id(self):
        """Test getting template by ID"""
        template_id = getattr(self.__class__, 'created_template_id', None)
        if not template_id:
            pytest.skip("No template created")
        
        response = self.session.get(
            f"{BASE_URL}/api/onboarding-templates/{template_id}",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == "TEST_Engineering Onboarding"
        print(f"✓ Get template by ID: {data['name']}")
    
    def test_06_update_template(self):
        """Test updating onboarding template"""
        template_id = getattr(self.__class__, 'created_template_id', None)
        if not template_id:
            pytest.skip("No template created")
        
        update_data = {
            "name": "TEST_Engineering Onboarding Updated",
            "duration_days": 45,
            "welcome_message": "Welcome to the updated engineering team!"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/onboarding-templates/{template_id}",
            headers=self.admin_headers(),
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Engineering Onboarding Updated"
        assert data["duration_days"] == 45
        print(f"✓ Updated template: {data['name']}")
    
    # ============= ONBOARDINGS TESTS =============
    
    def test_07_get_onboarding_stats(self):
        """Test getting onboarding statistics"""
        response = self.session.get(
            f"{BASE_URL}/api/onboardings/stats",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total" in data
        assert "in_progress" in data
        assert "completed" in data
        assert "on_hold" in data
        assert "not_started" in data
        assert "total_tasks" in data
        assert "completed_tasks" in data
        assert "overdue_tasks" in data
        assert "avg_completion_rate" in data
        
        print(f"✓ Onboarding stats: {data['in_progress']} in progress, {data['completed']} completed")
    
    def test_08_get_onboardings_list(self):
        """Test getting onboardings list"""
        response = self.session.get(
            f"{BASE_URL}/api/onboardings",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get onboardings: {len(data)} onboardings found")
    
    def test_09_create_onboarding_from_template(self):
        """Test creating onboarding from template - verify tasks are copied"""
        template_id = getattr(self.__class__, 'created_template_id', None)
        if not template_id:
            pytest.skip("No template created")
        
        # Get employees to find one for testing
        emp_response = self.session.get(
            f"{BASE_URL}/api/employees",
            headers=self.admin_headers()
        )
        assert emp_response.status_code == 200
        employees = emp_response.json()
        
        # Use Sarah Johnson's ID or first available employee
        test_employee_id = SARAH_EMPLOYEE_ID
        if not any(e["id"] == test_employee_id for e in employees):
            if employees:
                test_employee_id = employees[0]["id"]
            else:
                pytest.skip("No employees available")
        
        start_date = datetime.now().strftime("%Y-%m-%d")
        onboarding_data = {
            "employee_id": test_employee_id,
            "template_id": template_id,
            "position": "Software Engineer",
            "start_date": start_date,
            "status": "in_progress"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/onboardings",
            headers=self.admin_headers(),
            json=onboarding_data
        )
        assert response.status_code == 200, f"Create onboarding failed: {response.text}"
        data = response.json()
        
        # Verify response data
        assert "id" in data
        assert data["employee_id"] == test_employee_id
        assert data["template_id"] == template_id
        assert data["status"] == "in_progress"
        
        # Verify tasks were copied from template
        assert "tasks" in data
        assert len(data["tasks"]) == 5, f"Expected 5 tasks, got {len(data['tasks'])}"
        
        # Verify task fields
        first_task = data["tasks"][0]
        assert first_task["title"] == "Complete HR paperwork"
        assert first_task["completed"] == False
        assert first_task["completed_at"] is None
        
        # Verify target_end_date was calculated
        assert "target_end_date" in data
        
        self.__class__.created_onboarding_id = data["id"]
        self.__class__.test_employee_id = test_employee_id
        print(f"✓ Created onboarding with {len(data['tasks'])} tasks copied from template")
    
    def test_10_get_onboarding_by_id(self):
        """Test getting onboarding by ID"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        response = self.session.get(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == onboarding_id
        print(f"✓ Get onboarding by ID: {data['position']}")
    
    def test_11_filter_onboardings_by_status(self):
        """Test filtering onboardings by status"""
        response = self.session.get(
            f"{BASE_URL}/api/onboardings?status=in_progress",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned should be in_progress
        for ob in data:
            assert ob["status"] == "in_progress"
        print(f"✓ Filter by status: {len(data)} in_progress onboardings")
    
    def test_12_filter_onboardings_by_employee(self):
        """Test filtering onboardings by employee_id"""
        employee_id = getattr(self.__class__, 'test_employee_id', None)
        if not employee_id:
            pytest.skip("No test employee")
        
        response = self.session.get(
            f"{BASE_URL}/api/onboardings?employee_id={employee_id}",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for ob in data:
            assert ob["employee_id"] == employee_id
        print(f"✓ Filter by employee: {len(data)} onboardings")
    
    # ============= TASK COMPLETION TESTS =============
    
    def test_13_complete_task(self):
        """Test completing a task"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        task_data = {
            "completed": True,
            "completion_notes": "All paperwork submitted"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/onboardings/{onboarding_id}/tasks/0",
            headers=self.admin_headers(),
            json=task_data
        )
        assert response.status_code == 200, f"Complete task failed: {response.text}"
        data = response.json()
        
        # Verify task was completed
        assert data["tasks"][0]["completed"] == True
        assert data["tasks"][0]["completed_at"] is not None
        assert data["tasks"][0]["completed_by"] is not None
        assert data["tasks"][0]["completion_notes"] == "All paperwork submitted"
        
        print(f"✓ Task 0 completed: {data['tasks'][0]['title']}")
    
    def test_14_uncomplete_task(self):
        """Test uncompleting a task"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        task_data = {
            "completed": False
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/onboardings/{onboarding_id}/tasks/0",
            headers=self.admin_headers(),
            json=task_data
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify task was uncompleted
        assert data["tasks"][0]["completed"] == False
        assert data["tasks"][0]["completed_at"] is None
        
        print(f"✓ Task 0 uncompleted")
    
    def test_15_complete_all_tasks_auto_complete(self):
        """Test auto-complete onboarding when all tasks done"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        # Get current onboarding to know task count
        get_response = self.session.get(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers()
        )
        onboarding = get_response.json()
        task_count = len(onboarding["tasks"])
        
        # Complete all tasks
        for i in range(task_count):
            response = self.session.put(
                f"{BASE_URL}/api/onboardings/{onboarding_id}/tasks/{i}",
                headers=self.admin_headers(),
                json={"completed": True, "completion_notes": f"Task {i+1} done"}
            )
            assert response.status_code == 200
        
        # Get final state
        final_response = self.session.get(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers()
        )
        final_data = final_response.json()
        
        # Verify auto-complete
        assert final_data["status"] == "completed", f"Expected completed, got {final_data['status']}"
        assert final_data["completed_at"] is not None
        assert final_data["actual_end_date"] is not None
        
        print(f"✓ All {task_count} tasks completed - onboarding auto-completed")
    
    # ============= FEEDBACK TESTS =============
    
    def test_16_submit_feedback(self):
        """Test submitting feedback for completed onboarding"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        feedback_data = {
            "feedback": "Great onboarding experience! The team was very helpful.",
            "rating": 5
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/onboardings/{onboarding_id}/feedback",
            headers=self.admin_headers(),
            json=feedback_data
        )
        assert response.status_code == 200, f"Submit feedback failed: {response.text}"
        data = response.json()
        
        assert data["feedback"] == feedback_data["feedback"]
        assert data["feedback_rating"] == 5
        
        print(f"✓ Feedback submitted with rating: {data['feedback_rating']}/5")
    
    # ============= MY ONBOARDING TESTS =============
    
    def test_17_get_my_onboarding_employee(self):
        """Test getting my onboarding as employee"""
        response = self.session.get(
            f"{BASE_URL}/api/onboardings/my",
            headers=self.employee_headers()
        )
        assert response.status_code == 200
        # May return null if no active onboarding
        data = response.json()
        if data:
            assert "employee_id" in data
            assert "tasks" in data
            print(f"✓ Employee has active onboarding: {data.get('position', 'N/A')}")
        else:
            print(f"✓ Employee has no active onboarding (expected if completed)")
    
    # ============= UPDATE ONBOARDING TESTS =============
    
    def test_18_update_onboarding_status(self):
        """Test updating onboarding status"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        # Try to put on hold
        response = self.session.put(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers(),
            json={"status": "on_hold", "notes": "Temporarily paused"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "on_hold"
        print(f"✓ Onboarding status updated to: {data['status']}")
    
    # ============= CLEANUP TESTS =============
    
    def test_19_delete_onboarding(self):
        """Test deleting onboarding"""
        onboarding_id = getattr(self.__class__, 'created_onboarding_id', None)
        if not onboarding_id:
            pytest.skip("No onboarding created")
        
        response = self.session.delete(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        
        # Verify deleted
        get_response = self.session.get(
            f"{BASE_URL}/api/onboardings/{onboarding_id}",
            headers=self.admin_headers()
        )
        assert get_response.status_code == 404
        
        print(f"✓ Onboarding deleted")
    
    def test_20_delete_template(self):
        """Test deleting onboarding template"""
        template_id = getattr(self.__class__, 'created_template_id', None)
        if not template_id:
            pytest.skip("No template created")
        
        response = self.session.delete(
            f"{BASE_URL}/api/onboarding-templates/{template_id}",
            headers=self.admin_headers()
        )
        assert response.status_code == 200
        
        # Verify deleted
        get_response = self.session.get(
            f"{BASE_URL}/api/onboarding-templates/{template_id}",
            headers=self.admin_headers()
        )
        assert get_response.status_code == 404
        
        print(f"✓ Template deleted")
    
    # ============= ERROR HANDLING TESTS =============
    
    def test_21_get_nonexistent_template(self):
        """Test getting non-existent template returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/onboarding-templates/nonexistent-id",
            headers=self.admin_headers()
        )
        assert response.status_code == 404
        print(f"✓ Non-existent template returns 404")
    
    def test_22_get_nonexistent_onboarding(self):
        """Test getting non-existent onboarding returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/onboardings/nonexistent-id",
            headers=self.admin_headers()
        )
        assert response.status_code == 404
        print(f"✓ Non-existent onboarding returns 404")
    
    def test_23_update_task_invalid_index(self):
        """Test updating task with invalid index returns 404"""
        # First create a new onboarding for this test
        template_data = {
            "name": "TEST_Quick Template",
            "duration_days": 7,
            "tasks": [{"title": "Single task", "category": "documentation", "due_day": 1, "is_required": True}]
        }
        
        template_response = self.session.post(
            f"{BASE_URL}/api/onboarding-templates",
            headers=self.admin_headers(),
            json=template_data
        )
        template = template_response.json()
        
        # Get an employee
        emp_response = self.session.get(f"{BASE_URL}/api/employees", headers=self.admin_headers())
        employees = emp_response.json()
        if not employees:
            pytest.skip("No employees")
        
        onboarding_data = {
            "employee_id": employees[0]["id"],
            "template_id": template["id"],
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "in_progress"
        }
        
        ob_response = self.session.post(
            f"{BASE_URL}/api/onboardings",
            headers=self.admin_headers(),
            json=onboarding_data
        )
        onboarding = ob_response.json()
        
        # Try invalid task index
        response = self.session.put(
            f"{BASE_URL}/api/onboardings/{onboarding['id']}/tasks/999",
            headers=self.admin_headers(),
            json={"completed": True}
        )
        assert response.status_code == 404
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/onboardings/{onboarding['id']}", headers=self.admin_headers())
        self.session.delete(f"{BASE_URL}/api/onboarding-templates/{template['id']}", headers=self.admin_headers())
        
        print(f"✓ Invalid task index returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
