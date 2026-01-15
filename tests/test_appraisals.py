"""
Test suite for HR Platform Appraisals Module
Tests: Appraisal Cycles CRUD, Appraisal Assignment, Self-Assessment, Manager Review, Acknowledgment
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


class TestAppraisalsModule:
    """Test suite for Appraisals Approvals Module"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        self.employee_token = None
        self.created_cycle_id = None
        self.created_appraisal_id = None
        self.employee_id = None
    
    # ============= AUTHENTICATION TESTS =============
    
    def test_01_admin_login(self):
        """Test admin login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] in ["super_admin", "corp_admin"], f"User is not admin: {data['user']['role']}"
        self.__class__.admin_token = data["token"]
        print(f"✓ Admin login successful - Role: {data['user']['role']}")
    
    def test_02_employee_login(self):
        """Test employee login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        self.__class__.employee_token = data["token"]
        print(f"✓ Employee login successful - Email: {EMPLOYEE_EMAIL}")
    
    # ============= APPRAISAL CYCLES TESTS =============
    
    def test_03_get_appraisal_cycles_empty(self):
        """Test getting appraisal cycles list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles", headers=headers)
        assert response.status_code == 200, f"Failed to get cycles: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get appraisal cycles - Found {len(data)} cycles")
    
    def test_04_create_appraisal_cycle(self):
        """Test creating a new appraisal cycle"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        
        # Calculate dates
        today = datetime.now()
        start_date = today.strftime("%Y-%m-%d")
        end_date = (today + timedelta(days=30)).strftime("%Y-%m-%d")
        review_start = (today - timedelta(days=90)).strftime("%Y-%m-%d")
        review_end = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        
        cycle_data = {
            "name": "TEST_Q4 2025 Performance Review",
            "description": "Quarterly performance review for Q4 2025",
            "cycle_type": "quarterly",
            "start_date": start_date,
            "end_date": end_date,
            "review_period_start": review_start,
            "review_period_end": review_end,
            "rating_scale": 5,
            "self_assessment_required": True,
            "manager_review_required": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/appraisal-cycles", headers=headers, json=cycle_data)
        assert response.status_code == 200, f"Failed to create cycle: {response.text}"
        data = response.json()
        assert "id" in data, "No ID in response"
        assert data["name"] == cycle_data["name"], "Name mismatch"
        assert data["cycle_type"] == "quarterly", "Cycle type mismatch"
        assert "questions" in data, "No questions in response"
        assert len(data["questions"]) > 0, "No default questions generated"
        self.__class__.created_cycle_id = data["id"]
        print(f"✓ Created appraisal cycle: {data['name']} with {len(data['questions'])} questions")
    
    def test_05_get_appraisal_cycle_by_id(self):
        """Test getting a specific appraisal cycle"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get cycle: {response.text}"
        data = response.json()
        assert data["id"] == self.__class__.created_cycle_id, "ID mismatch"
        assert data["status"] == "draft", f"Initial status should be draft, got: {data['status']}"
        print(f"✓ Get cycle by ID - Status: {data['status']}")
    
    def test_06_update_appraisal_cycle(self):
        """Test updating an appraisal cycle"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        update_data = {
            "description": "Updated description for Q4 2025 review"
        }
        response = self.session.put(f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}", headers=headers, json=update_data)
        assert response.status_code == 200, f"Failed to update cycle: {response.text}"
        data = response.json()
        assert data["description"] == update_data["description"], "Description not updated"
        print(f"✓ Updated appraisal cycle description")
    
    # ============= GET EMPLOYEES FOR ASSIGNMENT =============
    
    def test_07_get_employees_for_assignment(self):
        """Test getting employees list for appraisal assignment"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/employees", headers=headers)
        assert response.status_code == 200, f"Failed to get employees: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Find an employee to assign appraisal to
        if len(data) > 0:
            # Try to find Sarah Johnson or use first employee
            for emp in data:
                if emp.get("work_email") == EMPLOYEE_EMAIL or emp.get("personal_email") == EMPLOYEE_EMAIL:
                    self.__class__.employee_id = emp["id"]
                    break
            if not self.__class__.employee_id and len(data) > 0:
                self.__class__.employee_id = data[0]["id"]
        
        print(f"✓ Get employees - Found {len(data)} employees, selected ID: {self.__class__.employee_id}")
    
    # ============= ASSIGN APPRAISALS =============
    
    def test_08_assign_appraisals_to_employees(self):
        """Test assigning appraisals to employees"""
        if not self.__class__.employee_id:
            pytest.skip("No employee ID available for assignment")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        assign_data = {
            "employee_ids": [self.__class__.employee_id],
            "reviewer_id": None  # No specific reviewer
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}/assign",
            headers=headers,
            json=assign_data
        )
        assert response.status_code == 200, f"Failed to assign appraisals: {response.text}"
        data = response.json()
        assert "created_count" in data, "No created_count in response"
        assert data["created_count"] >= 1, f"Expected at least 1 appraisal created, got: {data['created_count']}"
        print(f"✓ Assigned {data['created_count']} appraisal(s) to employees")
    
    def test_09_verify_cycle_status_active(self):
        """Verify cycle status changed to active after assignment"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get cycle: {response.text}"
        data = response.json()
        assert data["status"] == "active", f"Cycle status should be active after assignment, got: {data['status']}"
        print(f"✓ Cycle status is now: {data['status']}")
    
    # ============= GET APPRAISALS =============
    
    def test_10_get_all_appraisals_admin(self):
        """Test admin getting all appraisals"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisals: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Find our created appraisal
        for appraisal in data:
            if appraisal.get("cycle_id") == self.__class__.created_cycle_id:
                self.__class__.created_appraisal_id = appraisal["id"]
                assert appraisal["status"] == "pending", f"Initial status should be pending, got: {appraisal['status']}"
                assert "cycle_name" in appraisal, "Missing cycle_name enrichment"
                assert "questions" in appraisal, "Missing questions enrichment"
                break
        
        print(f"✓ Get all appraisals - Found {len(data)} appraisals, created appraisal ID: {self.__class__.created_appraisal_id}")
    
    def test_11_get_my_appraisals_employee(self):
        """Test employee getting their appraisals"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my appraisals: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get my appraisals (employee) - Found {len(data)} appraisals")
    
    def test_12_get_appraisal_by_id(self):
        """Test getting a specific appraisal"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID available")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisal: {response.text}"
        data = response.json()
        assert data["id"] == self.__class__.created_appraisal_id, "ID mismatch"
        assert "employee_name" in data, "Missing employee_name"
        assert "cycle_name" in data, "Missing cycle_name"
        print(f"✓ Get appraisal by ID - Employee: {data.get('employee_name')}, Status: {data['status']}")
    
    # ============= APPRAISAL STATS =============
    
    def test_13_get_appraisal_stats(self):
        """Test getting appraisal statistics"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/stats/summary", headers=headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        data = response.json()
        assert "total" in data, "Missing total in stats"
        assert "pending" in data, "Missing pending in stats"
        assert "self_assessment" in data, "Missing self_assessment in stats"
        assert "manager_review" in data, "Missing manager_review in stats"
        assert "completed" in data, "Missing completed in stats"
        assert "average_rating" in data, "Missing average_rating in stats"
        print(f"✓ Get appraisal stats - Total: {data['total']}, Pending: {data['pending']}, Completed: {data['completed']}")
    
    # ============= SELF-ASSESSMENT =============
    
    def test_14_submit_self_assessment(self):
        """Test employee submitting self-assessment"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID available")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}  # Using admin for test
        
        # First get the appraisal to see questions
        response = self.session.get(f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}", headers=headers)
        appraisal = response.json()
        questions = appraisal.get("questions", [])
        
        # Build answers for questions
        answers = []
        for q in questions:
            if q.get("type") == "rating":
                answers.append({"question_id": q["id"], "rating": 4, "answer": ""})
            else:
                answers.append({"question_id": q["id"], "answer": "Test answer for self-assessment", "rating": None})
        
        self_assessment_data = {
            "answers": answers,
            "overall_rating": 4,
            "achievements": "Completed all assigned projects on time",
            "challenges": "Adapting to new technologies",
            "goals": "Improve leadership skills and learn new frameworks"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}/self-assessment",
            headers=headers,
            json=self_assessment_data
        )
        assert response.status_code == 200, f"Failed to submit self-assessment: {response.text}"
        data = response.json()
        assert data["status"] == "manager_review", f"Status should be manager_review after self-assessment, got: {data['status']}"
        assert data["self_overall_rating"] == 4, "Self rating not saved"
        assert data["self_achievements"] == self_assessment_data["achievements"], "Achievements not saved"
        assert data["self_submitted_at"] is not None, "self_submitted_at not set"
        print(f"✓ Self-assessment submitted - Status changed to: {data['status']}")
    
    # ============= MANAGER REVIEW =============
    
    def test_15_submit_manager_review(self):
        """Test admin submitting manager review"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID available")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        
        # First get the appraisal to see questions
        response = self.session.get(f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}", headers=headers)
        appraisal = response.json()
        questions = appraisal.get("questions", [])
        
        # Build answers for questions
        answers = []
        for q in questions:
            if q.get("type") == "rating":
                answers.append({"question_id": q["id"], "rating": 4, "answer": ""})
            else:
                answers.append({"question_id": q["id"], "answer": "Manager's assessment", "rating": None})
        
        manager_review_data = {
            "answers": answers,
            "overall_rating": 4,
            "feedback": "Excellent performance throughout the quarter",
            "strengths": "Strong technical skills and teamwork",
            "improvements": "Could improve on documentation",
            "recommendations": "Consider for senior role",
            "final_comments": "Great job overall"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}/manager-review",
            headers=headers,
            json=manager_review_data
        )
        assert response.status_code == 200, f"Failed to submit manager review: {response.text}"
        data = response.json()
        assert data["status"] == "completed", f"Status should be completed after manager review, got: {data['status']}"
        assert data["manager_overall_rating"] == 4, "Manager rating not saved"
        assert data["final_rating"] is not None, "Final rating not calculated"
        assert data["manager_submitted_at"] is not None, "manager_submitted_at not set"
        print(f"✓ Manager review submitted - Status: {data['status']}, Final Rating: {data['final_rating']}")
    
    # ============= ACKNOWLEDGE APPRAISAL =============
    
    def test_16_acknowledge_appraisal(self):
        """Test employee acknowledging completed appraisal"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID available")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}  # Using admin for test
        
        response = self.session.post(
            f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}/acknowledge",
            headers=headers
        )
        assert response.status_code == 200, f"Failed to acknowledge appraisal: {response.text}"
        data = response.json()
        assert data["acknowledged_by_employee"] == True, "acknowledged_by_employee not set"
        assert data["acknowledged_at"] is not None, "acknowledged_at not set"
        print(f"✓ Appraisal acknowledged at: {data['acknowledged_at']}")
    
    # ============= VERIFY FINAL STATE =============
    
    def test_17_verify_completed_appraisal(self):
        """Verify the completed appraisal has all data"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID available")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisal: {response.text}"
        data = response.json()
        
        # Verify all fields are populated
        assert data["status"] == "completed", "Status should be completed"
        assert data["self_overall_rating"] is not None, "Missing self rating"
        assert data["manager_overall_rating"] is not None, "Missing manager rating"
        assert data["final_rating"] is not None, "Missing final rating"
        assert data["self_achievements"] is not None, "Missing achievements"
        assert data["manager_feedback"] is not None, "Missing manager feedback"
        assert data["acknowledged_by_employee"] == True, "Not acknowledged"
        
        print(f"✓ Verified completed appraisal - Self: {data['self_overall_rating']}, Manager: {data['manager_overall_rating']}, Final: {data['final_rating']}")
    
    def test_18_verify_stats_after_completion(self):
        """Verify stats updated after appraisal completion"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/stats/summary", headers=headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        data = response.json()
        assert data["completed"] >= 1, "Completed count should be at least 1"
        print(f"✓ Stats after completion - Completed: {data['completed']}, Avg Rating: {data.get('average_rating', 'N/A')}")
    
    # ============= ERROR HANDLING TESTS =============
    
    def test_19_get_nonexistent_cycle(self):
        """Test getting a non-existent cycle returns 404"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles/nonexistent-id", headers=headers)
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print(f"✓ Non-existent cycle returns 404")
    
    def test_20_get_nonexistent_appraisal(self):
        """Test getting a non-existent appraisal returns 404"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/nonexistent-id", headers=headers)
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print(f"✓ Non-existent appraisal returns 404")
    
    # ============= CLEANUP =============
    
    def test_21_delete_appraisal(self):
        """Test deleting an appraisal"""
        if not self.__class__.created_appraisal_id:
            pytest.skip("No appraisal ID to delete")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.delete(f"{BASE_URL}/api/appraisals/{self.__class__.created_appraisal_id}", headers=headers)
        assert response.status_code == 200, f"Failed to delete appraisal: {response.text}"
        print(f"✓ Deleted appraisal: {self.__class__.created_appraisal_id}")
    
    def test_22_delete_appraisal_cycle(self):
        """Test deleting an appraisal cycle"""
        if not self.__class__.created_cycle_id:
            pytest.skip("No cycle ID to delete")
        
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.delete(f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}", headers=headers)
        assert response.status_code == 200, f"Failed to delete cycle: {response.text}"
        print(f"✓ Deleted appraisal cycle: {self.__class__.created_cycle_id}")
    
    def test_23_verify_cleanup(self):
        """Verify cleanup was successful"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        
        # Verify cycle is deleted
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles/{self.__class__.created_cycle_id}", headers=headers)
        assert response.status_code == 404, "Cycle should be deleted"
        
        print(f"✓ Cleanup verified - All test data removed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
