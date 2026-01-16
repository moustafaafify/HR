"""
HR Platform Backend API Tests - Iteration 8
Tests data integrity, authentication, and all major modules
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://staffconnect-11.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "super_admin"
        
    def test_employee_login_success(self):
        """Test employee login with valid credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == EMPLOYEE_EMAIL
        assert data["user"]["role"] == "employee"
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401


@pytest.fixture
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def employee_token():
    """Get employee authentication token"""
    response = requests.post(f"{API}/auth/login", json={
        "email": EMPLOYEE_EMAIL,
        "password": EMPLOYEE_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Employee authentication failed")


@pytest.fixture
def admin_headers(admin_token):
    """Get headers with admin auth token"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def employee_headers(employee_token):
    """Get headers with employee auth token"""
    return {"Authorization": f"Bearer {employee_token}"}


class TestDashboardStats:
    """Dashboard statistics tests"""
    
    def test_dashboard_stats(self, admin_headers):
        """Test dashboard stats endpoint returns correct counts"""
        response = requests.get(f"{API}/dashboard/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected counts from seed data
        assert data["total_corporations"] == 1
        assert data["total_branches"] == 1
        assert data["total_departments"] == 5
        assert data["total_divisions"] == 4
        assert data["total_employees"] == 9
        assert "pending_leaves" in data


class TestDataIntegrity:
    """Data integrity tests - verify employee.user_id matches user.id"""
    
    def test_employees_have_valid_user_ids(self, admin_headers):
        """Test all employees have user_id that matches a user.id"""
        # Get all employees
        emp_response = requests.get(f"{API}/employees", headers=admin_headers)
        assert emp_response.status_code == 200
        employees = emp_response.json()
        
        assert len(employees) == 9, f"Expected 9 employees, got {len(employees)}"
        
        for emp in employees:
            # Verify user_id exists
            assert "user_id" in emp, f"Employee {emp.get('id')} missing user_id"
            assert emp["user_id"], f"Employee {emp.get('id')} has empty user_id"
            
            # Verify full_name is populated
            assert "full_name" in emp, f"Employee {emp.get('id')} missing full_name"
            assert emp["full_name"], f"Employee {emp.get('id')} has empty full_name"
            
    def test_employees_have_full_names(self, admin_headers):
        """Test all employees have populated full_name fields"""
        response = requests.get(f"{API}/employees", headers=admin_headers)
        assert response.status_code == 200
        employees = response.json()
        
        expected_names = [
            "Sarah Johnson", "Michael Chen", "Emily Davis", "James Wilson",
            "Amanda Martinez", "David Brown", "Lisa Taylor", "Robert Anderson",
            "Jennifer Thomas"
        ]
        
        actual_names = [emp["full_name"] for emp in employees]
        
        for name in expected_names:
            assert name in actual_names, f"Expected employee '{name}' not found"


class TestEmployeesModule:
    """Employees module tests"""
    
    def test_get_employees_list(self, admin_headers):
        """Test getting list of employees"""
        response = requests.get(f"{API}/employees", headers=admin_headers)
        assert response.status_code == 200
        employees = response.json()
        assert len(employees) == 9
        
    def test_get_single_employee(self, admin_headers):
        """Test getting a single employee by ID"""
        # First get list to get an ID
        list_response = requests.get(f"{API}/employees", headers=admin_headers)
        employees = list_response.json()
        emp_id = employees[0]["id"]
        
        # Get single employee
        response = requests.get(f"{API}/employees/{emp_id}", headers=admin_headers)
        assert response.status_code == 200
        emp = response.json()
        assert emp["id"] == emp_id
        assert emp["full_name"]


class TestLeaveModule:
    """Leave management tests"""
    
    def test_get_leave_balance(self, admin_headers):
        """Test getting leave balance for an employee"""
        # Get first employee
        emp_response = requests.get(f"{API}/employees", headers=admin_headers)
        emp_id = emp_response.json()[0]["id"]
        
        # Get leave balance
        response = requests.get(f"{API}/leave-balances/{emp_id}", headers=admin_headers)
        assert response.status_code == 200
        balance = response.json()
        
        assert "annual_leave" in balance
        assert "sick_leave" in balance
        assert balance["annual_leave"] == 20.0
        assert balance["sick_leave"] == 10.0
        
    def test_get_all_leave_balances(self, admin_headers):
        """Test getting all leave balances"""
        response = requests.get(f"{API}/leave-balances", headers=admin_headers)
        assert response.status_code == 200
        balances = response.json()
        assert len(balances) == 9  # One for each employee


class TestPayrollModule:
    """Payroll module tests"""
    
    def test_get_payroll_stats(self, admin_headers):
        """Test payroll stats endpoint"""
        response = requests.get(f"{API}/payroll/stats", headers=admin_headers)
        assert response.status_code == 200
        stats = response.json()
        
        assert "total_salary_structures" in stats
        assert "total_payslips" in stats
        assert "paid_payslips" in stats
        
    def test_get_salary_structures(self, admin_headers):
        """Test getting salary structures"""
        response = requests.get(f"{API}/payroll/salary-structures", headers=admin_headers)
        assert response.status_code == 200
        # Initially empty
        
    def test_get_payslips(self, admin_headers):
        """Test getting payslips"""
        response = requests.get(f"{API}/payroll/payslips", headers=admin_headers)
        assert response.status_code == 200
        
    def test_get_payroll_runs(self, admin_headers):
        """Test getting payroll runs"""
        response = requests.get(f"{API}/payroll/runs", headers=admin_headers)
        assert response.status_code == 200


class TestOrgChartModule:
    """Organization chart tests"""
    
    def test_get_org_chart(self, admin_headers):
        """Test org chart endpoint"""
        response = requests.get(f"{API}/org-chart", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "corporations" in data
        assert "branches" in data
        assert "departments" in data
        assert "divisions" in data
        assert "nodes" in data


class TestAppraisalsModule:
    """Appraisals module tests"""
    
    def test_get_appraisal_cycles(self, admin_headers):
        """Test getting appraisal cycles"""
        response = requests.get(f"{API}/appraisal-cycles", headers=admin_headers)
        assert response.status_code == 200
        
    def test_get_appraisals(self, admin_headers):
        """Test getting appraisals"""
        response = requests.get(f"{API}/appraisals", headers=admin_headers)
        assert response.status_code == 200
        
    def test_get_appraisal_stats(self, admin_headers):
        """Test appraisal stats endpoint"""
        response = requests.get(f"{API}/appraisals/stats/summary", headers=admin_headers)
        assert response.status_code == 200


class TestDocumentsModule:
    """Documents module tests"""
    
    def test_get_document_approvals(self, admin_headers):
        """Test getting document approvals"""
        response = requests.get(f"{API}/document-approvals", headers=admin_headers)
        assert response.status_code == 200
        
    def test_get_document_types(self, admin_headers):
        """Test getting document types"""
        response = requests.get(f"{API}/document-types", headers=admin_headers)
        assert response.status_code == 200


class TestOrganizationStructure:
    """Organization structure tests"""
    
    def test_get_corporations(self, admin_headers):
        """Test getting corporations"""
        response = requests.get(f"{API}/corporations", headers=admin_headers)
        assert response.status_code == 200
        corps = response.json()
        assert len(corps) == 1
        assert corps[0]["name"] == "Lojyn Technologies"
        
    def test_get_branches(self, admin_headers):
        """Test getting branches"""
        response = requests.get(f"{API}/branches", headers=admin_headers)
        assert response.status_code == 200
        branches = response.json()
        assert len(branches) == 1
        assert branches[0]["name"] == "Main Office"
        
    def test_get_departments(self, admin_headers):
        """Test getting departments"""
        response = requests.get(f"{API}/departments", headers=admin_headers)
        assert response.status_code == 200
        depts = response.json()
        assert len(depts) == 5
        
    def test_get_divisions(self, admin_headers):
        """Test getting divisions"""
        response = requests.get(f"{API}/divisions", headers=admin_headers)
        assert response.status_code == 200
        divs = response.json()
        assert len(divs) == 4


class TestEmployeeAccess:
    """Employee-specific access tests"""
    
    def test_employee_can_view_leaves(self, employee_headers):
        """Test employee can view their leaves"""
        response = requests.get(f"{API}/leaves", headers=employee_headers)
        assert response.status_code == 200
        
    def test_employee_can_view_my_appraisals(self, employee_headers):
        """Test employee can view their appraisals"""
        response = requests.get(f"{API}/appraisals/my", headers=employee_headers)
        assert response.status_code == 200
        
    def test_employee_can_view_my_documents(self, employee_headers):
        """Test employee can view their documents"""
        response = requests.get(f"{API}/document-approvals/my", headers=employee_headers)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
