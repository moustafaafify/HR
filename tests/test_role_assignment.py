"""
Test suite for HR Platform Role Assignment Feature
Tests the role_id field in Employee model and /api/roles endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRoleAssignment:
    """Tests for role assignment feature in HR Platform"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get corporation and branch IDs for employee creation
        corps = self.session.get(f"{BASE_URL}/api/corporations").json()
        branches = self.session.get(f"{BASE_URL}/api/branches").json()
        
        self.corp_id = corps[0]["id"] if corps else None
        self.branch_id = branches[0]["id"] if branches else None
        
        yield
        
        # Cleanup: Delete test employees
        employees = self.session.get(f"{BASE_URL}/api/employees").json()
        for emp in employees:
            if emp.get("full_name", "").startswith("TEST_"):
                self.session.delete(f"{BASE_URL}/api/employees/{emp['id']}")
    
    # ============= ROLES API TESTS =============
    
    def test_get_roles_returns_list(self):
        """Test GET /api/roles returns list of roles"""
        response = self.session.get(f"{BASE_URL}/api/roles")
        
        assert response.status_code == 200
        roles = response.json()
        assert isinstance(roles, list)
        assert len(roles) >= 4, "Should have at least 4 default roles"
        print(f"Found {len(roles)} roles")
    
    def test_roles_have_required_fields(self):
        """Test that roles have all required fields"""
        response = self.session.get(f"{BASE_URL}/api/roles")
        roles = response.json()
        
        required_fields = ["id", "name", "display_name", "permissions", "is_system_role"]
        
        for role in roles:
            for field in required_fields:
                assert field in role, f"Role missing field: {field}"
        
        print("All roles have required fields")
    
    def test_default_roles_exist(self):
        """Test that default system roles exist"""
        response = self.session.get(f"{BASE_URL}/api/roles")
        roles = response.json()
        
        expected_roles = ["super_admin", "corp_admin", "branch_manager", "employee"]
        role_names = [r["name"] for r in roles]
        
        for expected in expected_roles:
            assert expected in role_names, f"Missing default role: {expected}"
        
        print(f"All default roles found: {expected_roles}")
    
    def test_roles_have_display_names(self):
        """Test that roles have human-readable display names"""
        response = self.session.get(f"{BASE_URL}/api/roles")
        roles = response.json()
        
        expected_display_names = {
            "super_admin": "Super Administrator",
            "corp_admin": "Corporate Administrator",
            "branch_manager": "Branch Manager",
            "employee": "Employee"
        }
        
        for role in roles:
            if role["name"] in expected_display_names:
                assert role["display_name"] == expected_display_names[role["name"]], \
                    f"Wrong display name for {role['name']}"
        
        print("All display names are correct")
    
    # ============= EMPLOYEE WITH ROLE TESTS =============
    
    def test_create_employee_with_role_id(self):
        """Test creating an employee with role_id field"""
        # Get a role ID
        roles = self.session.get(f"{BASE_URL}/api/roles").json()
        employee_role = next((r for r in roles if r["name"] == "employee"), None)
        assert employee_role, "Employee role not found"
        
        # Create employee with role_id
        employee_data = {
            "full_name": "TEST_RoleAssignment_Employee",
            "user_id": "test_user_role_001",
            "personal_email": "test.role@example.com",
            "corporation_id": self.corp_id,
            "branch_id": self.branch_id,
            "role_id": employee_role["id"],
            "job_title": "Test Position"
        }
        
        response = self.session.post(f"{BASE_URL}/api/employees", json=employee_data)
        
        assert response.status_code == 200, f"Failed to create employee: {response.text}"
        created_emp = response.json()
        
        assert created_emp["role_id"] == employee_role["id"], "role_id not saved correctly"
        print(f"Created employee with role_id: {created_emp['role_id']}")
        
        # Verify by fetching
        get_response = self.session.get(f"{BASE_URL}/api/employees/{created_emp['id']}")
        assert get_response.status_code == 200
        fetched_emp = get_response.json()
        assert fetched_emp["role_id"] == employee_role["id"], "role_id not persisted"
    
    def test_create_employee_without_role_id(self):
        """Test creating an employee without role_id (should be None)"""
        employee_data = {
            "full_name": "TEST_NoRole_Employee",
            "user_id": "test_user_norole_001",
            "personal_email": "test.norole@example.com",
            "corporation_id": self.corp_id,
            "branch_id": self.branch_id,
            "job_title": "Test Position"
        }
        
        response = self.session.post(f"{BASE_URL}/api/employees", json=employee_data)
        
        assert response.status_code == 200, f"Failed to create employee: {response.text}"
        created_emp = response.json()
        
        assert created_emp["role_id"] is None, "role_id should be None when not provided"
        print("Employee created without role_id (None)")
    
    def test_update_employee_role_id(self):
        """Test updating an employee's role_id"""
        # Get roles
        roles = self.session.get(f"{BASE_URL}/api/roles").json()
        employee_role = next((r for r in roles if r["name"] == "employee"), None)
        branch_manager_role = next((r for r in roles if r["name"] == "branch_manager"), None)
        
        # Create employee with employee role
        employee_data = {
            "full_name": "TEST_UpdateRole_Employee",
            "user_id": "test_user_update_001",
            "personal_email": "test.update@example.com",
            "corporation_id": self.corp_id,
            "branch_id": self.branch_id,
            "role_id": employee_role["id"]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/employees", json=employee_data)
        assert create_response.status_code == 200
        emp_id = create_response.json()["id"]
        
        # Update to branch manager role
        update_response = self.session.put(
            f"{BASE_URL}/api/employees/{emp_id}",
            json={"role_id": branch_manager_role["id"]}
        )
        
        assert update_response.status_code == 200
        updated_emp = update_response.json()
        assert updated_emp["role_id"] == branch_manager_role["id"], "role_id not updated"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/employees/{emp_id}")
        fetched_emp = get_response.json()
        assert fetched_emp["role_id"] == branch_manager_role["id"], "role_id update not persisted"
        
        print(f"Successfully updated role from {employee_role['name']} to {branch_manager_role['name']}")
    
    def test_remove_employee_role_id(self):
        """Test removing an employee's role_id (set to None)"""
        # Get a role
        roles = self.session.get(f"{BASE_URL}/api/roles").json()
        employee_role = next((r for r in roles if r["name"] == "employee"), None)
        
        # Create employee with role
        employee_data = {
            "full_name": "TEST_RemoveRole_Employee",
            "user_id": "test_user_remove_001",
            "personal_email": "test.remove@example.com",
            "corporation_id": self.corp_id,
            "branch_id": self.branch_id,
            "role_id": employee_role["id"]
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/employees", json=employee_data)
        emp_id = create_response.json()["id"]
        
        # Remove role by setting to None
        update_response = self.session.put(
            f"{BASE_URL}/api/employees/{emp_id}",
            json={"role_id": None}
        )
        
        assert update_response.status_code == 200
        updated_emp = update_response.json()
        assert updated_emp["role_id"] is None, "role_id should be None after removal"
        
        print("Successfully removed role_id from employee")
    
    def test_employee_list_includes_role_id(self):
        """Test that employee list includes role_id field"""
        response = self.session.get(f"{BASE_URL}/api/employees")
        
        assert response.status_code == 200
        employees = response.json()
        
        if employees:
            # Check that role_id field exists in response
            assert "role_id" in employees[0], "role_id field missing from employee list"
            print(f"Employee list includes role_id field. First employee role_id: {employees[0].get('role_id')}")
    
    def test_get_single_role_by_id(self):
        """Test GET /api/roles/{role_id} returns single role"""
        # Get all roles first
        roles = self.session.get(f"{BASE_URL}/api/roles").json()
        role_id = roles[0]["id"]
        
        # Get single role
        response = self.session.get(f"{BASE_URL}/api/roles/{role_id}")
        
        assert response.status_code == 200
        role = response.json()
        assert role["id"] == role_id
        print(f"Successfully fetched role: {role['display_name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
