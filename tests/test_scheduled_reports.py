"""
Scheduled Reports API Tests
Tests for the scheduled report delivery feature in HR Platform
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://collab-hub-hr.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def employee_token():
    """Get employee authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMPLOYEE_EMAIL, "password": EMPLOYEE_PASSWORD}
    )
    assert response.status_code == 200, f"Employee login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture
def admin_headers(admin_token):
    """Admin authorization headers"""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def employee_headers(employee_token):
    """Employee authorization headers"""
    return {"Authorization": f"Bearer {employee_token}", "Content-Type": "application/json"}


class TestReportTypes:
    """Tests for GET /api/scheduled-reports/report-types"""
    
    def test_get_report_types_returns_all_types(self, admin_headers):
        """Verify all 7 report types are returned"""
        response = requests.get(f"{BASE_URL}/api/scheduled-reports/report-types", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 7
        
        # Verify expected report types
        type_ids = [t["id"] for t in data]
        expected_types = ["analytics", "leave", "attendance", "compliance", "workforce", "visitors", "employees"]
        for expected in expected_types:
            assert expected in type_ids, f"Missing report type: {expected}"
    
    def test_report_types_have_required_fields(self, admin_headers):
        """Verify each report type has id, name, description, icon"""
        response = requests.get(f"{BASE_URL}/api/scheduled-reports/report-types", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        for report_type in data:
            assert "id" in report_type
            assert "name" in report_type
            assert "description" in report_type
            assert "icon" in report_type


class TestScheduledReportsCRUD:
    """Tests for scheduled reports CRUD operations"""
    
    @pytest.fixture
    def test_report_data(self):
        """Test report data for creation"""
        return {
            "name": "TEST_Pytest Weekly Analytics",
            "description": "Test report created by pytest",
            "report_type": "analytics",
            "frequency": "weekly",
            "day_of_week": 0,
            "time_of_day": "09:00",
            "recipients": ["test@example.com"],
            "format": "pdf",
            "date_range": "last_7_days"
        }
    
    def test_create_scheduled_report(self, admin_headers, test_report_data):
        """Test creating a new scheduled report"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=admin_headers,
            json=test_report_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == test_report_data["name"]
        assert data["report_type"] == test_report_data["report_type"]
        assert data["frequency"] == test_report_data["frequency"]
        assert data["status"] == "active"
        assert data["next_run"] is not None
        assert data["run_count"] == 0
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduled-reports/{data['id']}", headers=admin_headers)
    
    def test_get_scheduled_reports_list(self, admin_headers):
        """Test getting list of scheduled reports"""
        response = requests.get(f"{BASE_URL}/api/scheduled-reports", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_single_scheduled_report(self, admin_headers, test_report_data):
        """Test getting a single scheduled report by ID"""
        # Create a report first
        create_response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=admin_headers,
            json=test_report_data
        )
        report_id = create_response.json()["id"]
        
        # Get the report
        response = requests.get(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == report_id
        assert data["name"] == test_report_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
    
    def test_update_scheduled_report(self, admin_headers, test_report_data):
        """Test updating a scheduled report"""
        # Create a report first
        create_response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=admin_headers,
            json=test_report_data
        )
        report_id = create_response.json()["id"]
        
        # Update the report
        update_data = {"name": "TEST_Updated Report Name", "description": "Updated description"}
        response = requests.put(
            f"{BASE_URL}/api/scheduled-reports/{report_id}",
            headers=admin_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Updated Report Name"
        assert data["description"] == "Updated description"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
        assert get_response.json()["name"] == "TEST_Updated Report Name"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
    
    def test_delete_scheduled_report(self, admin_headers, test_report_data):
        """Test deleting a scheduled report"""
        # Create a report first
        create_response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=admin_headers,
            json=test_report_data
        )
        report_id = create_response.json()["id"]
        
        # Delete the report
        response = requests.delete(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Scheduled report deleted"
        
        # Verify it's marked as deleted (soft delete)
        # The report should not appear in the list
        list_response = requests.get(f"{BASE_URL}/api/scheduled-reports", headers=admin_headers)
        report_ids = [r["id"] for r in list_response.json()]
        assert report_id not in report_ids or any(r["status"] == "deleted" for r in list_response.json() if r["id"] == report_id)


class TestScheduledReportActions:
    """Tests for scheduled report actions (pause, resume, run)"""
    
    @pytest.fixture
    def created_report(self, admin_headers):
        """Create a report for testing actions"""
        report_data = {
            "name": "TEST_Action Test Report",
            "report_type": "analytics",
            "frequency": "weekly",
            "recipients": ["test@example.com"]
        }
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=admin_headers,
            json=report_data
        )
        report = response.json()
        yield report
        # Cleanup
        requests.delete(f"{BASE_URL}/api/scheduled-reports/{report['id']}", headers=admin_headers)
    
    def test_pause_report(self, admin_headers, created_report):
        """Test pausing a scheduled report"""
        report_id = created_report["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/{report_id}/pause",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Report paused"
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
        assert get_response.json()["status"] == "paused"
    
    def test_resume_report(self, admin_headers, created_report):
        """Test resuming a paused report"""
        report_id = created_report["id"]
        
        # First pause it
        requests.post(f"{BASE_URL}/api/scheduled-reports/{report_id}/pause", headers=admin_headers)
        
        # Then resume
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/{report_id}/resume",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Report resumed"
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/scheduled-reports/{report_id}", headers=admin_headers)
        assert get_response.json()["status"] == "active"
    
    def test_run_report_now(self, admin_headers, created_report):
        """Test running a report immediately"""
        report_id = created_report["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/{report_id}/run",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "run_id" in data
        assert "message" in data
        # Note: success may be True or False depending on SMTP config
    
    def test_get_report_runs_history(self, admin_headers, created_report):
        """Test getting report run history"""
        report_id = created_report["id"]
        
        # Run the report first
        requests.post(f"{BASE_URL}/api/scheduled-reports/{report_id}/run", headers=admin_headers)
        
        # Get runs
        response = requests.get(
            f"{BASE_URL}/api/scheduled-reports/{report_id}/runs",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify run structure
        run = data[0]
        assert "id" in run
        assert "scheduled_report_id" in run
        assert "status" in run
        assert "started_at" in run


class TestReportPreview:
    """Tests for report preview functionality"""
    
    def test_preview_analytics_report(self, admin_headers):
        """Test previewing analytics report data"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/preview",
            headers=admin_headers,
            json={"report_type": "analytics", "date_range": "last_7_days"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "analytics"
        assert "generated_at" in data
        assert "date_range" in data
        assert "data" in data
    
    def test_preview_leave_report(self, admin_headers):
        """Test previewing leave report data"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/preview",
            headers=admin_headers,
            json={"report_type": "leave", "date_range": "last_30_days"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "leave"
        assert "data" in data
    
    def test_preview_employees_report(self, admin_headers):
        """Test previewing employees report data"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/preview",
            headers=admin_headers,
            json={"report_type": "employees", "date_range": "last_7_days"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "employees"
        assert "data" in data


class TestAccessControl:
    """Tests for role-based access control"""
    
    def test_employee_cannot_view_scheduled_reports(self, employee_headers):
        """Verify employees cannot access scheduled reports"""
        response = requests.get(f"{BASE_URL}/api/scheduled-reports", headers=employee_headers)
        
        assert response.status_code == 403
        assert "Only admins" in response.json()["detail"]
    
    def test_employee_cannot_create_scheduled_report(self, employee_headers):
        """Verify employees cannot create scheduled reports"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports",
            headers=employee_headers,
            json={"name": "Test", "report_type": "analytics", "recipients": ["test@example.com"]}
        )
        
        assert response.status_code == 403
    
    def test_employee_cannot_preview_reports(self, employee_headers):
        """Verify employees cannot preview reports"""
        response = requests.post(
            f"{BASE_URL}/api/scheduled-reports/preview",
            headers=employee_headers,
            json={"report_type": "analytics"}
        )
        
        assert response.status_code == 403


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_reports(self, admin_headers):
        """Clean up any TEST_ prefixed reports"""
        response = requests.get(f"{BASE_URL}/api/scheduled-reports", headers=admin_headers)
        reports = response.json()
        
        for report in reports:
            if report["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/scheduled-reports/{report['id']}", headers=admin_headers)
        
        # Verify cleanup
        response = requests.get(f"{BASE_URL}/api/scheduled-reports", headers=admin_headers)
        remaining = [r for r in response.json() if r["name"].startswith("TEST_")]
        assert len(remaining) == 0, f"Failed to cleanup {len(remaining)} test reports"
