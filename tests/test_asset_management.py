"""
Asset Management Module Tests
Tests for: Asset Categories, Assets CRUD, Asset Assignment/Return, Asset Requests
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hrhub-4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"


class TestAssetManagementSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self, employee_token):
        return {"Authorization": f"Bearer {employee_token}", "Content-Type": "application/json"}
    
    def test_admin_login(self, admin_token):
        """Test admin can login"""
        assert admin_token is not None
        print("✓ Admin login successful")
    
    def test_employee_login(self, employee_token):
        """Test employee can login"""
        assert employee_token is not None
        print("✓ Employee login successful")


class TestAssetStats:
    """Test asset statistics endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_asset_stats(self, admin_headers):
        """Test getting asset statistics"""
        response = requests.get(f"{BASE_URL}/api/assets/stats", headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_assets" in data
        assert "available" in data
        assert "assigned" in data
        assert "under_maintenance" in data
        assert "retired" in data
        assert "pending_requests" in data
        assert "total_value" in data
        
        # Verify existing data
        assert data["total_assets"] >= 1, "Should have at least 1 asset"
        assert data["assigned"] >= 1, "Should have at least 1 assigned asset"
        assert data["pending_requests"] >= 1, "Should have at least 1 pending request"
        print(f"✓ Asset stats: {data['total_assets']} total, {data['assigned']} assigned, {data['pending_requests']} pending requests")


class TestAssetCategories:
    """Test asset category CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_categories(self, admin_headers):
        """Test getting all asset categories"""
        response = requests.get(f"{BASE_URL}/api/asset-categories", headers=admin_headers)
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) >= 1, "Should have at least 1 category (Laptops)"
        
        # Verify Laptops category exists
        laptop_cat = next((c for c in categories if c["name"] == "Laptops"), None)
        assert laptop_cat is not None, "Laptops category should exist"
        print(f"✓ Found {len(categories)} categories including 'Laptops'")
    
    def test_create_category_admin(self, admin_headers):
        """Test admin can create a category"""
        unique_name = f"TEST_Monitors_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/asset-categories", headers=admin_headers, json={
            "name": unique_name,
            "description": "Test monitors category",
            "icon": "monitor",
            "color": "#8B5CF6"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == unique_name
        assert data["icon"] == "monitor"
        assert "id" in data
        print(f"✓ Created category: {unique_name}")
        
        # Cleanup - delete the test category
        requests.delete(f"{BASE_URL}/api/asset-categories/{data['id']}", headers=admin_headers)
    
    def test_create_category_employee_forbidden(self, employee_headers):
        """Test employee cannot create a category"""
        response = requests.post(f"{BASE_URL}/api/asset-categories", headers=employee_headers, json={
            "name": "TEST_Unauthorized",
            "description": "Should fail"
        })
        assert response.status_code == 403
        print("✓ Employee correctly forbidden from creating categories")
    
    def test_update_category(self, admin_headers):
        """Test updating a category"""
        # Create a test category first
        create_resp = requests.post(f"{BASE_URL}/api/asset-categories", headers=admin_headers, json={
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "description": "Original description"
        })
        assert create_resp.status_code == 200
        category_id = create_resp.json()["id"]
        
        # Update it
        update_resp = requests.put(f"{BASE_URL}/api/asset-categories/{category_id}", headers=admin_headers, json={
            "description": "Updated description"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["description"] == "Updated description"
        print("✓ Category updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/asset-categories/{category_id}", headers=admin_headers)
    
    def test_delete_category(self, admin_headers):
        """Test deleting a category without assets"""
        # Create a test category
        create_resp = requests.post(f"{BASE_URL}/api/asset-categories", headers=admin_headers, json={
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "description": "To be deleted"
        })
        assert create_resp.status_code == 200
        category_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/asset-categories/{category_id}", headers=admin_headers)
        assert delete_resp.status_code == 200
        print("✓ Category deleted successfully")


class TestAssetsCRUD:
    """Test asset CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def category_id(self, admin_headers):
        """Get or create a test category"""
        response = requests.get(f"{BASE_URL}/api/asset-categories", headers=admin_headers)
        categories = response.json()
        if categories:
            return categories[0]["id"]
        # Create one if none exist
        create_resp = requests.post(f"{BASE_URL}/api/asset-categories", headers=admin_headers, json={
            "name": "TEST_Category",
            "description": "Test category"
        })
        return create_resp.json()["id"]
    
    def test_get_all_assets(self, admin_headers):
        """Test getting all assets"""
        response = requests.get(f"{BASE_URL}/api/assets", headers=admin_headers)
        assert response.status_code == 200
        
        assets = response.json()
        assert isinstance(assets, list)
        assert len(assets) >= 1, "Should have at least 1 asset (MacBook Pro)"
        
        # Verify MacBook Pro exists
        macbook = next((a for a in assets if a["name"] == "MacBook Pro 16"), None)
        assert macbook is not None, "MacBook Pro 16 should exist"
        assert macbook["status"] == "assigned"
        assert macbook["assigned_to_name"] == "Sarah Johnson"
        print(f"✓ Found {len(assets)} assets including 'MacBook Pro 16' assigned to Sarah Johnson")
    
    def test_get_asset_by_id(self, admin_headers):
        """Test getting a specific asset"""
        # First get all assets
        list_resp = requests.get(f"{BASE_URL}/api/assets", headers=admin_headers)
        assets = list_resp.json()
        asset_id = assets[0]["id"]
        
        # Get specific asset
        response = requests.get(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
        assert response.status_code == 200
        
        asset = response.json()
        assert asset["id"] == asset_id
        print(f"✓ Retrieved asset: {asset['name']}")
    
    def test_create_asset(self, admin_headers, category_id):
        """Test creating a new asset"""
        unique_tag = f"TEST-{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Dell Monitor 27",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "serial_number": "DELL123456",
            "model": "U2722D",
            "manufacturer": "Dell",
            "purchase_date": "2024-06-01",
            "purchase_price": 599.99,
            "condition": "excellent",
            "status": "available",
            "location": "Main Office"
        })
        assert response.status_code == 200
        
        asset = response.json()
        assert asset["name"] == "TEST Dell Monitor 27"
        assert asset["asset_tag"] == unique_tag
        assert asset["status"] == "available"
        assert "id" in asset
        print(f"✓ Created asset: {asset['name']} ({asset['asset_tag']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset['id']}", headers=admin_headers)
    
    def test_update_asset(self, admin_headers, category_id):
        """Test updating an asset"""
        # Create test asset
        unique_tag = f"TEST-UPD-{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Update Asset",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "condition": "good",
            "status": "available"
        })
        assert create_resp.status_code == 200
        asset_id = create_resp.json()["id"]
        
        # Update it
        update_resp = requests.put(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers, json={
            "condition": "excellent",
            "location": "Floor 2"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["condition"] == "excellent"
        assert update_resp.json()["location"] == "Floor 2"
        print("✓ Asset updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
    
    def test_delete_available_asset(self, admin_headers, category_id):
        """Test deleting an available asset"""
        # Create test asset
        unique_tag = f"TEST-DEL-{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Delete Asset",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "status": "available"
        })
        assert create_resp.status_code == 200
        asset_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
        assert delete_resp.status_code == 200
        print("✓ Available asset deleted successfully")
    
    def test_filter_assets_by_status(self, admin_headers):
        """Test filtering assets by status"""
        response = requests.get(f"{BASE_URL}/api/assets?status=assigned", headers=admin_headers)
        assert response.status_code == 200
        
        assets = response.json()
        for asset in assets:
            assert asset["status"] == "assigned"
        print(f"✓ Filtered {len(assets)} assigned assets")


class TestAssetAssignment:
    """Test asset assignment and return operations"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        """Get an employee ID for testing"""
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        employees = response.json()
        # Find an employee other than Sarah (who already has an asset)
        for emp in employees:
            if emp.get("full_name") != "Sarah Johnson":
                return emp["id"]
        return employees[0]["id"] if employees else None
    
    @pytest.fixture(scope="class")
    def category_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/asset-categories", headers=admin_headers)
        categories = response.json()
        return categories[0]["id"] if categories else None
    
    def test_assign_asset(self, admin_headers, employee_id, category_id):
        """Test assigning an asset to an employee"""
        # Create a test asset
        unique_tag = f"TEST-ASSIGN-{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Assignment Asset",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "status": "available"
        })
        assert create_resp.status_code == 200
        asset_id = create_resp.json()["id"]
        
        # Assign it
        assign_resp = requests.post(f"{BASE_URL}/api/assets/{asset_id}/assign", headers=admin_headers, json={
            "employee_id": employee_id,
            "assigned_date": "2024-12-01",
            "notes": "Test assignment"
        })
        assert assign_resp.status_code == 200
        assert "assignment" in assign_resp.json()
        print("✓ Asset assigned successfully")
        
        # Verify asset status changed
        get_resp = requests.get(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
        assert get_resp.json()["status"] == "assigned"
        assert get_resp.json()["assigned_to_id"] == employee_id
        print("✓ Asset status updated to 'assigned'")
        
        # Return the asset for cleanup
        requests.post(f"{BASE_URL}/api/assets/{asset_id}/return", headers=admin_headers, json={
            "condition": "good",
            "new_status": "available"
        })
        # Delete the asset
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
    
    def test_return_asset(self, admin_headers, employee_id, category_id):
        """Test returning an assigned asset"""
        # Create and assign an asset
        unique_tag = f"TEST-RETURN-{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Return Asset",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "status": "available"
        })
        asset_id = create_resp.json()["id"]
        
        # Assign it
        requests.post(f"{BASE_URL}/api/assets/{asset_id}/assign", headers=admin_headers, json={
            "employee_id": employee_id
        })
        
        # Return it
        return_resp = requests.post(f"{BASE_URL}/api/assets/{asset_id}/return", headers=admin_headers, json={
            "condition": "good",
            "new_status": "available",
            "notes": "Returned in good condition"
        })
        assert return_resp.status_code == 200
        print("✓ Asset returned successfully")
        
        # Verify asset status
        get_resp = requests.get(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
        assert get_resp.json()["status"] == "available"
        assert get_resp.json()["assigned_to_id"] is None
        print("✓ Asset status updated to 'available'")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
    
    def test_cannot_assign_already_assigned(self, admin_headers, employee_id, category_id):
        """Test that already assigned assets cannot be reassigned"""
        # Create and assign an asset
        unique_tag = f"TEST-DOUBLE-{uuid.uuid4().hex[:6]}"
        create_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Double Assign",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "status": "available"
        })
        asset_id = create_resp.json()["id"]
        
        # First assignment
        requests.post(f"{BASE_URL}/api/assets/{asset_id}/assign", headers=admin_headers, json={
            "employee_id": employee_id
        })
        
        # Try to assign again
        second_assign = requests.post(f"{BASE_URL}/api/assets/{asset_id}/assign", headers=admin_headers, json={
            "employee_id": employee_id
        })
        assert second_assign.status_code == 400
        assert "already assigned" in second_assign.json()["detail"].lower()
        print("✓ Correctly prevented double assignment")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/assets/{asset_id}/return", headers=admin_headers, json={
            "condition": "good",
            "new_status": "available"
        })
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
    
    def test_get_asset_assignments_history(self, admin_headers):
        """Test getting assignment history"""
        response = requests.get(f"{BASE_URL}/api/asset-assignments", headers=admin_headers)
        assert response.status_code == 200
        
        assignments = response.json()
        assert isinstance(assignments, list)
        print(f"✓ Retrieved {len(assignments)} assignment records")


class TestAssetRequests:
    """Test asset request operations"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_all_requests_admin(self, admin_headers):
        """Test admin can see all requests"""
        response = requests.get(f"{BASE_URL}/api/asset-requests", headers=admin_headers)
        assert response.status_code == 200
        
        requests_list = response.json()
        assert isinstance(requests_list, list)
        assert len(requests_list) >= 1, "Should have at least 1 pending request"
        
        # Verify the existing pending request
        pending = next((r for r in requests_list if r["status"] == "pending"), None)
        assert pending is not None, "Should have a pending request"
        print(f"✓ Admin can see {len(requests_list)} requests")
    
    def test_get_my_requests_employee(self, employee_headers):
        """Test employee can see their own requests"""
        response = requests.get(f"{BASE_URL}/api/asset-requests/my", headers=employee_headers)
        assert response.status_code == 200
        
        requests_list = response.json()
        assert isinstance(requests_list, list)
        print(f"✓ Employee can see {len(requests_list)} of their requests")
    
    def test_create_request_employee(self, employee_headers):
        """Test employee can create an asset request"""
        response = requests.post(f"{BASE_URL}/api/asset-requests", headers=employee_headers, json={
            "request_type": "new",
            "title": f"TEST Request {uuid.uuid4().hex[:6]}",
            "description": "Test request for testing",
            "priority": "normal"
        })
        assert response.status_code == 200
        
        request_data = response.json()
        assert request_data["status"] == "pending"
        assert request_data["employee_name"] == "Sarah Johnson"
        print(f"✓ Employee created request: {request_data['title']}")
        
        # Return request ID for cleanup
        return request_data["id"]
    
    def test_approve_request(self, admin_headers, employee_headers):
        """Test admin can approve a request"""
        # Create a request first
        create_resp = requests.post(f"{BASE_URL}/api/asset-requests", headers=employee_headers, json={
            "request_type": "new",
            "title": f"TEST Approve {uuid.uuid4().hex[:6]}",
            "description": "To be approved",
            "priority": "high"
        })
        request_id = create_resp.json()["id"]
        
        # Approve it
        approve_resp = requests.post(f"{BASE_URL}/api/asset-requests/{request_id}/approve", headers=admin_headers, json={
            "notes": "Approved for testing"
        })
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "approved"
        print("✓ Request approved successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/asset-requests/{request_id}", headers=admin_headers)
    
    def test_reject_request(self, admin_headers, employee_headers):
        """Test admin can reject a request"""
        # Create a request first
        create_resp = requests.post(f"{BASE_URL}/api/asset-requests", headers=employee_headers, json={
            "request_type": "new",
            "title": f"TEST Reject {uuid.uuid4().hex[:6]}",
            "description": "To be rejected",
            "priority": "low"
        })
        request_id = create_resp.json()["id"]
        
        # Reject it
        reject_resp = requests.post(f"{BASE_URL}/api/asset-requests/{request_id}/reject", headers=admin_headers, json={
            "reason": "Budget constraints"
        })
        assert reject_resp.status_code == 200
        assert reject_resp.json()["status"] == "rejected"
        assert reject_resp.json()["rejection_reason"] == "Budget constraints"
        print("✓ Request rejected successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/asset-requests/{request_id}", headers=admin_headers)
    
    def test_fulfill_request(self, admin_headers, employee_headers):
        """Test admin can fulfill an approved request"""
        # Get category
        cat_resp = requests.get(f"{BASE_URL}/api/asset-categories", headers=admin_headers)
        category_id = cat_resp.json()[0]["id"]
        
        # Create an available asset
        unique_tag = f"TEST-FULFILL-{uuid.uuid4().hex[:6]}"
        asset_resp = requests.post(f"{BASE_URL}/api/assets", headers=admin_headers, json={
            "name": "TEST Fulfill Asset",
            "asset_tag": unique_tag,
            "category_id": category_id,
            "status": "available"
        })
        asset_id = asset_resp.json()["id"]
        
        # Create and approve a request
        create_resp = requests.post(f"{BASE_URL}/api/asset-requests", headers=employee_headers, json={
            "request_type": "new",
            "title": f"TEST Fulfill {uuid.uuid4().hex[:6]}",
            "description": "To be fulfilled"
        })
        request_id = create_resp.json()["id"]
        
        # Approve it
        requests.post(f"{BASE_URL}/api/asset-requests/{request_id}/approve", headers=admin_headers, json={})
        
        # Fulfill it
        fulfill_resp = requests.post(f"{BASE_URL}/api/asset-requests/{request_id}/fulfill", headers=admin_headers, json={
            "asset_id": asset_id
        })
        assert fulfill_resp.status_code == 200
        assert fulfill_resp.json()["status"] == "fulfilled"
        assert fulfill_resp.json()["fulfilled_asset_id"] == asset_id
        print("✓ Request fulfilled successfully")
        
        # Cleanup - return asset and delete
        requests.post(f"{BASE_URL}/api/assets/{asset_id}/return", headers=admin_headers, json={
            "condition": "good",
            "new_status": "available"
        })
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers=admin_headers)
        requests.delete(f"{BASE_URL}/api/asset-requests/{request_id}", headers=admin_headers)


class TestEmployeeAssetView:
    """Test employee-specific asset views"""
    
    @pytest.fixture(scope="class")
    def employee_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_my_assets(self, employee_headers):
        """Test employee can see their assigned assets"""
        response = requests.get(f"{BASE_URL}/api/assets/my", headers=employee_headers)
        assert response.status_code == 200
        
        assets = response.json()
        assert isinstance(assets, list)
        # Sarah should have the MacBook Pro assigned
        assert len(assets) >= 1, "Sarah should have at least 1 assigned asset"
        
        macbook = next((a for a in assets if a["name"] == "MacBook Pro 16"), None)
        assert macbook is not None, "Sarah should have MacBook Pro 16 assigned"
        print(f"✓ Employee can see {len(assets)} assigned assets including MacBook Pro 16")


class TestSearchAndFilter:
    """Test search and filter functionality"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_filter_by_category(self, admin_headers):
        """Test filtering assets by category"""
        # Get categories first
        cat_resp = requests.get(f"{BASE_URL}/api/asset-categories", headers=admin_headers)
        categories = cat_resp.json()
        if categories:
            category_id = categories[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/assets?category_id={category_id}", headers=admin_headers)
            assert response.status_code == 200
            
            assets = response.json()
            for asset in assets:
                assert asset["category_id"] == category_id
            print(f"✓ Filtered {len(assets)} assets by category")
    
    def test_filter_by_status(self, admin_headers):
        """Test filtering assets by status"""
        response = requests.get(f"{BASE_URL}/api/assets?status=assigned", headers=admin_headers)
        assert response.status_code == 200
        
        assets = response.json()
        for asset in assets:
            assert asset["status"] == "assigned"
        print(f"✓ Filtered {len(assets)} assets by status 'assigned'")
    
    def test_filter_requests_by_status(self, admin_headers):
        """Test filtering requests by status"""
        response = requests.get(f"{BASE_URL}/api/asset-requests?status=pending", headers=admin_headers)
        assert response.status_code == 200
        
        requests_list = response.json()
        for req in requests_list:
            assert req["status"] == "pending"
        print(f"✓ Filtered {len(requests_list)} requests by status 'pending'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
