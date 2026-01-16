"""
Test suite for Roles & Permissions module
Tests all CRUD operations for roles, permissions, and user-role assignments
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"


class TestRolesPermissionsModule:
    """Test suite for Roles & Permissions APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_token = login_response.json()["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Login as employee
        emp_login = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert emp_login.status_code == 200, f"Employee login failed: {emp_login.text}"
        self.employee_token = emp_login.json()["token"]
        self.employee_headers = {"Authorization": f"Bearer {self.employee_token}"}
        
        yield
        
        # Cleanup: Delete any test roles created
        self._cleanup_test_roles()
    
    def _cleanup_test_roles(self):
        """Clean up test-created roles"""
        try:
            roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
            if roles_response.status_code == 200:
                roles = roles_response.json()
                for role in roles:
                    if role.get("name", "").startswith("TEST_"):
                        self.session.delete(f"{BASE_URL}/api/roles/{role['id']}", headers=self.admin_headers)
        except Exception:
            pass

    # ============= PERMISSIONS TESTS =============
    
    def test_get_all_permissions(self):
        """GET /api/permissions - Should return all 72 permissions"""
        response = self.session.get(f"{BASE_URL}/api/permissions", headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to get permissions: {response.text}"
        permissions = response.json()
        
        # Verify we have 72 permissions
        assert len(permissions) == 72, f"Expected 72 permissions, got {len(permissions)}"
        
        # Verify permission structure
        for perm in permissions:
            assert "id" in perm, "Permission missing 'id' field"
            assert "name" in perm, "Permission missing 'name' field"
            assert "category" in perm, "Permission missing 'category' field"
            assert "description" in perm, "Permission missing 'description' field"
        
        print(f"✓ GET /api/permissions - Returned {len(permissions)} permissions")
    
    def test_get_permissions_categories(self):
        """GET /api/permissions/categories - Should return permissions grouped by category"""
        response = self.session.get(f"{BASE_URL}/api/permissions/categories", headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to get permission categories: {response.text}"
        categories = response.json()
        
        # Verify we have categories
        assert isinstance(categories, dict), "Categories should be a dictionary"
        assert len(categories) > 0, "Should have at least one category"
        
        # Expected categories
        expected_categories = [
            "Employees", "Leave Management", "Attendance", "Performance",
            "Recruitment", "Training", "Expenses", "Documents", "Support",
            "Benefits", "Organization", "Payroll", "Reports", "Communications", "Administration"
        ]
        
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        
        # Verify each category has permissions
        total_perms = 0
        for cat_name, perms in categories.items():
            assert isinstance(perms, list), f"Category {cat_name} should have a list of permissions"
            assert len(perms) > 0, f"Category {cat_name} should have at least one permission"
            total_perms += len(perms)
        
        assert total_perms == 72, f"Total permissions across categories should be 72, got {total_perms}"
        
        print(f"✓ GET /api/permissions/categories - Returned {len(categories)} categories with {total_perms} total permissions")

    # ============= ROLES TESTS =============
    
    def test_get_all_roles(self):
        """GET /api/roles - Should return all roles"""
        response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to get roles: {response.text}"
        roles = response.json()
        
        # Verify role structure
        for role in roles:
            assert "id" in role, "Role missing 'id' field"
            assert "name" in role, "Role missing 'name' field"
            assert "display_name" in role, "Role missing 'display_name' field"
            assert "permissions" in role, "Role missing 'permissions' field"
        
        print(f"✓ GET /api/roles - Returned {len(roles)} roles")
        return roles
    
    def test_get_roles_stats(self):
        """GET /api/roles/stats - Should return role statistics"""
        response = self.session.get(f"{BASE_URL}/api/roles/stats", headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to get role stats: {response.text}"
        stats = response.json()
        
        # Verify stats structure
        assert "total_roles" in stats, "Stats missing 'total_roles'"
        assert "system_roles" in stats, "Stats missing 'system_roles'"
        assert "custom_roles" in stats, "Stats missing 'custom_roles'"
        assert "roles" in stats, "Stats missing 'roles' array"
        
        # Verify counts
        assert stats["total_roles"] >= 0, "total_roles should be >= 0"
        assert stats["system_roles"] >= 0, "system_roles should be >= 0"
        assert stats["custom_roles"] >= 0, "custom_roles should be >= 0"
        assert stats["total_roles"] == stats["system_roles"] + stats["custom_roles"], \
            "total_roles should equal system_roles + custom_roles"
        
        # Verify roles array structure
        for role_stat in stats["roles"]:
            assert "role_id" in role_stat, "Role stat missing 'role_id'"
            assert "role_name" in role_stat, "Role stat missing 'role_name'"
            assert "display_name" in role_stat, "Role stat missing 'display_name'"
            assert "user_count" in role_stat, "Role stat missing 'user_count'"
            assert "permission_count" in role_stat, "Role stat missing 'permission_count'"
        
        print(f"✓ GET /api/roles/stats - Total: {stats['total_roles']}, System: {stats['system_roles']}, Custom: {stats['custom_roles']}")
        return stats
    
    def test_create_role(self):
        """POST /api/roles - Should create a new custom role"""
        role_data = {
            "name": f"TEST_custom_role_{uuid.uuid4().hex[:8]}",
            "display_name": "Test Custom Role",
            "description": "A test custom role for testing purposes",
            "permissions": ["employees.view", "leaves.view_own", "attendance.view_own"],
            "level": 4,
            "color": "#10b981"
        }
        
        response = self.session.post(f"{BASE_URL}/api/roles", json=role_data, headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to create role: {response.text}"
        created_role = response.json()
        
        # Verify created role
        assert created_role["name"] == role_data["name"], "Role name mismatch"
        assert created_role["display_name"] == role_data["display_name"], "Display name mismatch"
        assert created_role["description"] == role_data["description"], "Description mismatch"
        assert set(created_role["permissions"]) == set(role_data["permissions"]), "Permissions mismatch"
        assert created_role["level"] == role_data["level"], "Level mismatch"
        assert created_role["is_system_role"] == False, "Custom role should not be system role"
        
        # Verify role persisted - GET to confirm
        get_response = self.session.get(f"{BASE_URL}/api/roles/{created_role['id']}", headers=self.admin_headers)
        assert get_response.status_code == 200, f"Failed to get created role: {get_response.text}"
        fetched_role = get_response.json()
        assert fetched_role["name"] == role_data["name"], "Fetched role name mismatch"
        
        print(f"✓ POST /api/roles - Created role: {created_role['display_name']}")
        return created_role
    
    def test_update_role(self):
        """PUT /api/roles/{role_id} - Should update a custom role"""
        # First create a role to update
        role_data = {
            "name": f"TEST_update_role_{uuid.uuid4().hex[:8]}",
            "display_name": "Role To Update",
            "description": "Original description",
            "permissions": ["employees.view"],
            "level": 5,
            "color": "#64748b"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/roles", json=role_data, headers=self.admin_headers)
        assert create_response.status_code == 200, f"Failed to create role for update test: {create_response.text}"
        created_role = create_response.json()
        
        # Update the role
        update_data = {
            "display_name": "Updated Role Name",
            "description": "Updated description",
            "permissions": ["employees.view", "leaves.view_own", "attendance.view_own"],
            "level": 4,
            "color": "#2563eb"
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/roles/{created_role['id']}", 
            json=update_data, 
            headers=self.admin_headers
        )
        
        assert update_response.status_code == 200, f"Failed to update role: {update_response.text}"
        updated_role = update_response.json()
        
        # Verify updates
        assert updated_role["display_name"] == update_data["display_name"], "Display name not updated"
        assert updated_role["description"] == update_data["description"], "Description not updated"
        assert set(updated_role["permissions"]) == set(update_data["permissions"]), "Permissions not updated"
        
        # Verify persistence - GET to confirm
        get_response = self.session.get(f"{BASE_URL}/api/roles/{created_role['id']}", headers=self.admin_headers)
        assert get_response.status_code == 200
        fetched_role = get_response.json()
        assert fetched_role["display_name"] == update_data["display_name"], "Update not persisted"
        
        print(f"✓ PUT /api/roles/{created_role['id']} - Updated role successfully")
    
    def test_delete_role(self):
        """DELETE /api/roles/{role_id} - Should delete a custom role"""
        # First create a role to delete
        role_data = {
            "name": f"TEST_delete_role_{uuid.uuid4().hex[:8]}",
            "display_name": "Role To Delete",
            "description": "This role will be deleted",
            "permissions": ["employees.view"],
            "level": 5
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/roles", json=role_data, headers=self.admin_headers)
        assert create_response.status_code == 200, f"Failed to create role for delete test: {create_response.text}"
        created_role = create_response.json()
        
        # Delete the role
        delete_response = self.session.delete(
            f"{BASE_URL}/api/roles/{created_role['id']}", 
            headers=self.admin_headers
        )
        
        assert delete_response.status_code == 200, f"Failed to delete role: {delete_response.text}"
        
        # Verify deletion - GET should return 404
        get_response = self.session.get(f"{BASE_URL}/api/roles/{created_role['id']}", headers=self.admin_headers)
        assert get_response.status_code == 404, "Deleted role should not be found"
        
        print(f"✓ DELETE /api/roles/{created_role['id']} - Deleted role successfully")
    
    def test_cannot_delete_system_role(self):
        """DELETE /api/roles/{role_id} - Should not delete system roles"""
        # Get roles to find a system role
        roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        system_role = next((r for r in roles if r.get("is_system_role")), None)
        if system_role:
            delete_response = self.session.delete(
                f"{BASE_URL}/api/roles/{system_role['id']}", 
                headers=self.admin_headers
            )
            assert delete_response.status_code == 400, "Should not be able to delete system role"
            print(f"✓ Cannot delete system role: {system_role['display_name']}")
        else:
            print("⚠ No system roles found to test deletion protection")

    # ============= USER-ROLE ASSIGNMENT TESTS =============
    
    def test_get_users_with_role(self):
        """GET /api/roles/{role_id}/users - Should return users assigned to a role"""
        # Get roles first
        roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        if len(roles) > 0:
            role = roles[0]
            response = self.session.get(
                f"{BASE_URL}/api/roles/{role['id']}/users", 
                headers=self.admin_headers
            )
            
            assert response.status_code == 200, f"Failed to get role users: {response.text}"
            data = response.json()
            
            # Verify response structure
            assert "role" in data, "Response missing 'role'"
            assert "users" in data, "Response missing 'users'"
            assert "count" in data, "Response missing 'count'"
            assert isinstance(data["users"], list), "Users should be a list"
            assert data["count"] == len(data["users"]), "Count should match users length"
            
            print(f"✓ GET /api/roles/{role['id']}/users - Found {data['count']} users with role '{role['display_name']}'")
        else:
            print("⚠ No roles found to test user assignment")
    
    def test_assign_role_to_user(self):
        """POST /api/roles/{role_id}/assign - Should assign a role to a user"""
        # Get users
        users_response = self.session.get(f"{BASE_URL}/api/users", headers=self.admin_headers)
        assert users_response.status_code == 200, f"Failed to get users: {users_response.text}"
        users = users_response.json()
        
        # Get roles
        roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        if len(users) > 0 and len(roles) > 0:
            # Find a non-admin user to test with
            test_user = next((u for u in users if u.get("role") != "super_admin"), None)
            if test_user:
                # Find a role to assign
                target_role = next((r for r in roles if r.get("name") == "employee"), roles[0])
                
                response = self.session.post(
                    f"{BASE_URL}/api/roles/{target_role['id']}/assign",
                    json={"user_id": test_user["id"]},
                    headers=self.admin_headers
                )
                
                assert response.status_code == 200, f"Failed to assign role: {response.text}"
                data = response.json()
                assert "message" in data, "Response missing 'message'"
                assert data["user_id"] == test_user["id"], "User ID mismatch in response"
                
                print(f"✓ POST /api/roles/{target_role['id']}/assign - Assigned role to user")
            else:
                print("⚠ No non-admin user found to test role assignment")
        else:
            print("⚠ No users or roles found to test assignment")
    
    def test_remove_role_from_user(self):
        """POST /api/roles/{role_id}/remove - Should remove role from user (set to employee)"""
        # Get users
        users_response = self.session.get(f"{BASE_URL}/api/users", headers=self.admin_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        # Get roles
        roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        if len(users) > 0 and len(roles) > 0:
            # Find a non-admin user
            test_user = next((u for u in users if u.get("role") != "super_admin"), None)
            if test_user:
                # Find the user's current role
                current_role = next((r for r in roles if r.get("name") == test_user.get("role")), None)
                if current_role:
                    response = self.session.post(
                        f"{BASE_URL}/api/roles/{current_role['id']}/remove",
                        json={"user_id": test_user["id"]},
                        headers=self.admin_headers
                    )
                    
                    assert response.status_code == 200, f"Failed to remove role: {response.text}"
                    data = response.json()
                    assert "message" in data, "Response missing 'message'"
                    
                    print(f"✓ POST /api/roles/{current_role['id']}/remove - Removed role from user")
                else:
                    print("⚠ Could not find user's current role")
            else:
                print("⚠ No non-admin user found to test role removal")
        else:
            print("⚠ No users or roles found to test removal")
    
    def test_duplicate_role(self):
        """POST /api/roles/duplicate/{role_id} - Should duplicate an existing role"""
        # Get roles
        roles_response = self.session.get(f"{BASE_URL}/api/roles", headers=self.admin_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        if len(roles) > 0:
            source_role = roles[0]
            new_name = f"TEST_duplicate_{uuid.uuid4().hex[:8]}"
            
            response = self.session.post(
                f"{BASE_URL}/api/roles/duplicate/{source_role['id']}",
                json={
                    "name": new_name,
                    "display_name": f"Duplicate of {source_role['display_name']}",
                    "description": "Duplicated role for testing"
                },
                headers=self.admin_headers
            )
            
            assert response.status_code == 200, f"Failed to duplicate role: {response.text}"
            duplicated_role = response.json()
            
            # Verify duplicated role
            assert duplicated_role["name"] == new_name, "Duplicated role name mismatch"
            assert duplicated_role["is_system_role"] == False, "Duplicated role should not be system role"
            assert set(duplicated_role["permissions"]) == set(source_role.get("permissions", [])), \
                "Duplicated role should have same permissions as source"
            
            # Verify persistence
            get_response = self.session.get(f"{BASE_URL}/api/roles/{duplicated_role['id']}", headers=self.admin_headers)
            assert get_response.status_code == 200, "Duplicated role should be retrievable"
            
            print(f"✓ POST /api/roles/duplicate/{source_role['id']} - Duplicated role successfully")
        else:
            print("⚠ No roles found to test duplication")

    # ============= USERS ENDPOINT TEST =============
    
    def test_get_all_users(self):
        """GET /api/users - Should return all users (admin only)"""
        response = self.session.get(f"{BASE_URL}/api/users", headers=self.admin_headers)
        
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json()
        
        assert isinstance(users, list), "Users should be a list"
        
        # Verify user structure
        for user in users:
            assert "id" in user, "User missing 'id'"
            assert "email" in user, "User missing 'email'"
            assert "full_name" in user, "User missing 'full_name'"
            assert "role" in user, "User missing 'role'"
            assert "password_hash" not in user, "Password hash should not be exposed"
        
        print(f"✓ GET /api/users - Returned {len(users)} users")
        return users

    # ============= AUTHORIZATION TESTS =============
    
    def test_employee_cannot_access_role_stats(self):
        """Employee should not be able to access role stats"""
        response = self.session.get(f"{BASE_URL}/api/roles/stats", headers=self.employee_headers)
        assert response.status_code == 403, "Employee should not access role stats"
        print("✓ Employee cannot access /api/roles/stats (403)")
    
    def test_employee_cannot_create_role(self):
        """Employee should not be able to create roles"""
        role_data = {
            "name": "unauthorized_role",
            "display_name": "Unauthorized Role",
            "permissions": []
        }
        response = self.session.post(f"{BASE_URL}/api/roles", json=role_data, headers=self.employee_headers)
        assert response.status_code == 403, "Employee should not create roles"
        print("✓ Employee cannot create roles (403)")
    
    def test_employee_can_view_permissions(self):
        """Employee should be able to view permissions"""
        response = self.session.get(f"{BASE_URL}/api/permissions", headers=self.employee_headers)
        assert response.status_code == 200, "Employee should be able to view permissions"
        print("✓ Employee can view permissions")

    # ============= INITIALIZE DEFAULTS TEST =============
    
    def test_initialize_default_roles(self):
        """POST /api/roles/initialize-defaults - Should initialize default roles if none exist"""
        response = self.session.post(
            f"{BASE_URL}/api/roles/initialize-defaults", 
            json={},
            headers=self.admin_headers
        )
        
        assert response.status_code == 200, f"Failed to initialize defaults: {response.text}"
        data = response.json()
        assert "message" in data, "Response missing 'message'"
        
        print(f"✓ POST /api/roles/initialize-defaults - {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
