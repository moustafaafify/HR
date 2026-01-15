"""
Comprehensive Test Suite for HR Platform
Tests: Auth, Dashboard, Employees, Leaves, Attendance, Recruitment, Onboarding, 
       Offboarding, Expenses, Training, Documents, Appraisals, Org Chart, Settings
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


class TestHRPlatformComprehensive:
    """Comprehensive test suite for all HR Platform modules"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_token = None
        self.employee_token = None
    
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
    
    def test_03_get_current_user(self):
        """Test getting current user info"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed to get current user: {response.text}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL, "Email mismatch"
        print(f"✓ Get current user - {data['full_name']}")
    
    # ============= DASHBOARD TESTS =============
    
    def test_04_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get dashboard stats: {response.text}"
        data = response.json()
        assert "total_employees" in data, "Missing total_employees"
        assert "pending_leaves" in data, "Missing pending_leaves"
        print(f"✓ Dashboard stats - Employees: {data.get('total_employees', 0)}, Pending Leaves: {data.get('pending_leaves', 0)}")
    
    # ============= EMPLOYEES TESTS =============
    
    def test_05_get_employees_list(self):
        """Test getting employees list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/employees", headers=headers)
        assert response.status_code == 200, f"Failed to get employees: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get employees - Found {len(data)} employees")
    
    # ============= LEAVES TESTS =============
    
    def test_06_get_leaves_list(self):
        """Test getting leave requests list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/leaves", headers=headers)
        assert response.status_code == 200, f"Failed to get leaves: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get leaves - Found {len(data)} leave requests")
    
    # ============= ATTENDANCE TESTS =============
    
    def test_07_get_attendance_records(self):
        """Test getting attendance records"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/attendance", headers=headers)
        assert response.status_code == 200, f"Failed to get attendance: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get attendance - Found {len(data)} records")
    
    # ============= RECRUITMENT TESTS =============
    
    def test_08_get_jobs_list(self):
        """Test getting job postings list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/jobs", headers=headers)
        assert response.status_code == 200, f"Failed to get jobs: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get jobs - Found {len(data)} job postings")
    
    def test_09_get_applications_list(self):
        """Test getting applications list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/applications", headers=headers)
        assert response.status_code == 200, f"Failed to get applications: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get applications - Found {len(data)} applications")
    
    # ============= ONBOARDING TESTS =============
    
    def test_10_get_onboarding_templates(self):
        """Test getting onboarding templates"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/onboarding-templates", headers=headers)
        assert response.status_code == 200, f"Failed to get onboarding templates: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get onboarding templates - Found {len(data)} templates")
    
    def test_11_get_onboardings_list(self):
        """Test getting onboardings list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/onboardings", headers=headers)
        assert response.status_code == 200, f"Failed to get onboardings: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get onboardings - Found {len(data)} onboardings")
    
    def test_12_get_onboarding_stats(self):
        """Test getting onboarding statistics"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/onboardings/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get onboarding stats: {response.text}"
        data = response.json()
        assert "in_progress" in data, "Missing in_progress"
        print(f"✓ Get onboarding stats - In Progress: {data.get('in_progress', 0)}")
    
    # ============= OFFBOARDING TESTS =============
    
    def test_13_get_offboarding_templates(self):
        """Test getting offboarding templates"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/offboarding-templates", headers=headers)
        assert response.status_code == 200, f"Failed to get offboarding templates: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get offboarding templates - Found {len(data)} templates")
    
    def test_14_get_offboardings_list(self):
        """Test getting offboardings list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/offboardings", headers=headers)
        assert response.status_code == 200, f"Failed to get offboardings: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get offboardings - Found {len(data)} offboardings")
    
    def test_15_get_offboarding_stats(self):
        """Test getting offboarding statistics"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/offboardings/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get offboarding stats: {response.text}"
        data = response.json()
        assert "in_progress" in data, "Missing in_progress"
        print(f"✓ Get offboarding stats - In Progress: {data.get('in_progress', 0)}")
    
    # ============= EXPENSES TESTS =============
    
    def test_16_get_expenses_list(self):
        """Test getting expense claims list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/expenses", headers=headers)
        assert response.status_code == 200, f"Failed to get expenses: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get expenses - Found {len(data)} expense claims")
    
    # ============= TRAINING TESTS =============
    
    def test_17_get_training_courses(self):
        """Test getting training courses list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/training-courses", headers=headers)
        assert response.status_code == 200, f"Failed to get training courses: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get training courses - Found {len(data)} courses")
    
    def test_18_get_training_requests(self):
        """Test getting training requests list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/training-requests", headers=headers)
        assert response.status_code == 200, f"Failed to get training requests: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get training requests - Found {len(data)} requests")
    
    # ============= DOCUMENTS TESTS =============
    
    def test_19_get_document_approvals(self):
        """Test getting document approvals list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/document-approvals", headers=headers)
        assert response.status_code == 200, f"Failed to get document approvals: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get document approvals - Found {len(data)} documents")
    
    def test_20_get_document_types(self):
        """Test getting document types"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/document-types", headers=headers)
        assert response.status_code == 200, f"Failed to get document types: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get document types - Found {len(data)} types")
    
    # ============= APPRAISALS TESTS =============
    
    def test_21_get_appraisal_cycles(self):
        """Test getting appraisal cycles list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisal-cycles", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisal cycles: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get appraisal cycles - Found {len(data)} cycles")
    
    def test_22_get_appraisals_list(self):
        """Test getting appraisals list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisals: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get appraisals - Found {len(data)} appraisals")
    
    def test_23_get_appraisal_stats(self):
        """Test getting appraisal statistics"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/stats/summary", headers=headers)
        assert response.status_code == 200, f"Failed to get appraisal stats: {response.text}"
        data = response.json()
        assert "total" in data, "Missing total"
        assert "pending" in data, "Missing pending"
        assert "completed" in data, "Missing completed"
        print(f"✓ Get appraisal stats - Total: {data.get('total', 0)}, Completed: {data.get('completed', 0)}")
    
    # ============= ORG CHART TESTS =============
    
    def test_24_get_org_chart(self):
        """Test getting organization chart"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/org-chart", headers=headers)
        assert response.status_code == 200, f"Failed to get org chart: {response.text}"
        data = response.json()
        assert "nodes" in data, "Missing nodes"
        assert "tree" in data, "Missing tree"
        assert "stats" in data, "Missing stats"
        print(f"✓ Get org chart - Nodes: {len(data.get('nodes', []))}, Stats: {data.get('stats', {})}")
    
    # ============= SETTINGS TESTS =============
    
    def test_25_get_settings(self):
        """Test getting global settings"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        data = response.json()
        assert "language_1" in data, "Missing language_1"
        assert "currency" in data, "Missing currency"
        print(f"✓ Get settings - Language: {data.get('language_1')}, Currency: {data.get('currency')}")
    
    # ============= EMPLOYEE VIEW TESTS =============
    
    def test_26_employee_get_my_appraisals(self):
        """Test employee getting their appraisals"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/appraisals/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my appraisals: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Employee - Get my appraisals - Found {len(data)} appraisals")
    
    def test_27_employee_get_my_documents(self):
        """Test employee getting their documents"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/document-approvals/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my documents: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Employee - Get my documents - Found {len(data)} documents")
    
    def test_28_employee_get_my_training(self):
        """Test employee getting their training requests"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/training-requests/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my training: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Employee - Get my training - Found {len(data)} requests")
    
    def test_29_employee_get_my_expenses(self):
        """Test employee getting their expenses"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/expenses/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my expenses: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Employee - Get my expenses - Found {len(data)} expenses")
    
    def test_30_employee_get_my_onboarding(self):
        """Test employee getting their onboarding"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/onboardings/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my onboarding: {response.text}"
        data = response.json()
        # Can be null if no onboarding assigned
        print(f"✓ Employee - Get my onboarding - {'Found' if data else 'No onboarding assigned'}")
    
    def test_31_employee_get_my_offboarding(self):
        """Test employee getting their offboarding"""
        headers = {"Authorization": f"Bearer {self.__class__.employee_token}"}
        response = self.session.get(f"{BASE_URL}/api/offboardings/my", headers=headers)
        assert response.status_code == 200, f"Failed to get my offboarding: {response.text}"
        data = response.json()
        # Can be null if no offboarding assigned
        print(f"✓ Employee - Get my offboarding - {'Found' if data else 'No offboarding assigned'}")
    
    # ============= ADDITIONAL ADMIN ENDPOINTS =============
    
    def test_32_get_corporations(self):
        """Test getting corporations list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/corporations", headers=headers)
        assert response.status_code == 200, f"Failed to get corporations: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get corporations - Found {len(data)} corporations")
    
    def test_33_get_branches(self):
        """Test getting branches list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/branches", headers=headers)
        assert response.status_code == 200, f"Failed to get branches: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get branches - Found {len(data)} branches")
    
    def test_34_get_departments(self):
        """Test getting departments list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/departments", headers=headers)
        assert response.status_code == 200, f"Failed to get departments: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get departments - Found {len(data)} departments")
    
    def test_35_get_divisions(self):
        """Test getting divisions list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/divisions", headers=headers)
        assert response.status_code == 200, f"Failed to get divisions: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get divisions - Found {len(data)} divisions")
    
    def test_36_get_roles(self):
        """Test getting roles list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/roles", headers=headers)
        assert response.status_code == 200, f"Failed to get roles: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get roles - Found {len(data)} roles")
    
    def test_37_get_workflows(self):
        """Test getting workflows list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/workflows", headers=headers)
        assert response.status_code == 200, f"Failed to get workflows: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get workflows - Found {len(data)} workflows")
    
    def test_38_get_schedules(self):
        """Test getting schedules list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/schedules", headers=headers)
        assert response.status_code == 200, f"Failed to get schedules: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get schedules - Found {len(data)} schedules")
    
    def test_39_get_performance_reviews(self):
        """Test getting performance reviews list"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/reviews", headers=headers)
        assert response.status_code == 200, f"Failed to get reviews: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get performance reviews - Found {len(data)} reviews")
    
    def test_40_get_leave_balances(self):
        """Test getting leave balances"""
        headers = {"Authorization": f"Bearer {self.__class__.admin_token}"}
        response = self.session.get(f"{BASE_URL}/api/leave-balances", headers=headers)
        assert response.status_code == 200, f"Failed to get leave balances: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get leave balances - Found {len(data)} balances")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
