"""
HR Platform - Iteration 9 Backend Tests
Testing: Projects, Timesheets, Overtime, Skills, Disciplinary, Travel, Recognition, Team Calendar, Succession Planning
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nexushr.preview.emergentagent.com')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123"
        })
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self, employee_token):
        return {"Authorization": f"Bearer {employee_token}", "Content-Type": "application/json"}
    
    def test_admin_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print("✓ Admin login successful")
    
    def test_employee_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✓ Employee login successful")


class TestProjectsModule:
    """Projects Module CRUD tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_projects_list(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/projects", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Projects list: {len(data)} projects found")
    
    def test_get_projects_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/projects/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        print(f"✓ Projects stats: {data.get('total_projects', 0)} total projects")
    
    def test_create_project(self, admin_headers, employee_id):
        project_data = {
            "name": "TEST_Project_Iteration9",
            "description": "Test project for iteration 9 testing",
            "status": "planning",
            "priority": "high",
            "category": "internal",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "budget": 50000,
            "manager_id": employee_id
        }
        response = requests.post(f"{BASE_URL}/api/projects", headers=admin_headers, json=project_data)
        assert response.status_code in [200, 201], f"Create project failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Project_Iteration9"
        print(f"✓ Project created: {data['id']}")
        return data["id"]
    
    def test_get_project_by_id(self, admin_headers):
        # First get list to find a project
        list_response = requests.get(f"{BASE_URL}/api/projects", headers=admin_headers)
        if list_response.status_code == 200 and list_response.json():
            project_id = list_response.json()[0]["id"]
            response = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=admin_headers)
            assert response.status_code == 200
            print(f"✓ Get project by ID successful")
    
    def test_add_project_member(self, admin_headers, employee_id):
        # Get a project first
        list_response = requests.get(f"{BASE_URL}/api/projects", headers=admin_headers)
        if list_response.status_code == 200 and list_response.json():
            project_id = list_response.json()[0]["id"]
            member_data = {
                "employee_id": employee_id,
                "role": "member",
                "allocation_percentage": 50
            }
            response = requests.post(f"{BASE_URL}/api/projects/{project_id}/members", headers=admin_headers, json=member_data)
            # May return 200 or 400 if member already exists
            assert response.status_code in [200, 201, 400]
            print(f"✓ Add project member: status {response.status_code}")
    
    def test_add_project_task(self, admin_headers, employee_id):
        # Get a project first
        list_response = requests.get(f"{BASE_URL}/api/projects", headers=admin_headers)
        if list_response.status_code == 200 and list_response.json():
            project_id = list_response.json()[0]["id"]
            task_data = {
                "title": "TEST_Task_Iteration9",
                "description": "Test task for iteration 9",
                "status": "todo",
                "priority": "medium",
                "assignee_id": employee_id,
                "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                "estimated_hours": 8
            }
            response = requests.post(f"{BASE_URL}/api/projects/{project_id}/tasks", headers=admin_headers, json=task_data)
            assert response.status_code in [200, 201], f"Add task failed: {response.text}"
            print(f"✓ Project task added successfully")


class TestTimesheetsModule:
    """Timesheets Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_timesheets_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/timesheets/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Timesheets stats retrieved")
    
    def test_get_timesheets_list(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/timesheets", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Timesheets list: {len(data)} timesheets found")
    
    def test_get_current_timesheet(self, employee_headers):
        response = requests.get(f"{BASE_URL}/api/timesheets/current", headers=employee_headers)
        # May return 200 with timesheet or 404 if none exists
        assert response.status_code in [200, 404]
        print(f"✓ Current timesheet check: status {response.status_code}")
    
    def test_create_timesheet(self, admin_headers, employee_id):
        # Calculate week start (Monday)
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        timesheet_data = {
            "employee_id": employee_id,
            "week_start": week_start.strftime("%Y-%m-%d"),
            "week_end": week_end.strftime("%Y-%m-%d"),
            "status": "draft",
            "entries": []
        }
        response = requests.post(f"{BASE_URL}/api/timesheets", headers=admin_headers, json=timesheet_data)
        # May return 200/201 or 400 if timesheet already exists for this week
        assert response.status_code in [200, 201, 400], f"Create timesheet: {response.text}"
        print(f"✓ Create timesheet: status {response.status_code}")
    
    def test_get_timesheet_settings(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/timesheets/settings", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Timesheet settings retrieved")


class TestOvertimeModule:
    """Overtime Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_overtime_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/overtime/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Overtime stats retrieved")
    
    def test_get_overtime_list(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/overtime", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Overtime list: {len(data)} requests found")
    
    def test_get_overtime_policies(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/overtime/policies", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Overtime policies: {len(data)} policies found")
    
    def test_create_overtime_request(self, admin_headers, employee_id):
        overtime_data = {
            "employee_id": employee_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "start_time": "18:00",
            "end_time": "21:00",
            "hours": 3,
            "reason": "TEST_Overtime_Iteration9 - Project deadline",
            "overtime_type": "regular"
        }
        response = requests.post(f"{BASE_URL}/api/overtime", headers=admin_headers, json=overtime_data)
        assert response.status_code in [200, 201], f"Create overtime failed: {response.text}"
        data = response.json()
        print(f"✓ Overtime request created: {data.get('id', 'N/A')}")


class TestSkillsModule:
    """Skills Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    def test_get_skills_categories(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/skills/categories", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Skills categories: {len(data)} categories found")
    
    def test_get_skills_library(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/skills/library", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Skills library: {len(data)} skills found")
    
    def test_get_skills_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/skills/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Skills stats retrieved")
    
    def test_get_my_skills(self, employee_headers):
        response = requests.get(f"{BASE_URL}/api/skills/my", headers=employee_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My skills: {len(data)} skills found")
    
    def test_add_skill_to_library(self, admin_headers):
        skill_data = {
            "name": "TEST_Skill_Iteration9",
            "description": "Test skill for iteration 9",
            "category": "technical"
        }
        response = requests.post(f"{BASE_URL}/api/skills/library", headers=admin_headers, json=skill_data)
        assert response.status_code in [200, 201], f"Add skill failed: {response.text}"
        print(f"✓ Skill added to library")


class TestDisciplinaryModule:
    """Disciplinary Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_disciplinary_action_types(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/disciplinary/action-types", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Disciplinary action types: {len(data)} types found")
    
    def test_get_disciplinary_actions(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/disciplinary/actions", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Disciplinary actions: {len(data)} actions found")
    
    def test_get_disciplinary_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/disciplinary/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Disciplinary stats retrieved")
    
    def test_create_disciplinary_action(self, admin_headers, employee_id):
        action_data = {
            "employee_id": employee_id,
            "action_type": "verbal_warning",
            "reason": "TEST_Disciplinary_Iteration9 - Test warning",
            "description": "This is a test disciplinary action for iteration 9 testing",
            "incident_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "pending_acknowledgment"
        }
        response = requests.post(f"{BASE_URL}/api/disciplinary/actions", headers=admin_headers, json=action_data)
        assert response.status_code in [200, 201], f"Create disciplinary action failed: {response.text}"
        data = response.json()
        print(f"✓ Disciplinary action created: {data.get('id', 'N/A')}")


class TestTravelModule:
    """Travel Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_travel_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/travel/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Travel stats retrieved")
    
    def test_get_travel_list(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/travel", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Travel requests: {len(data)} requests found")
    
    def test_create_travel_request(self, admin_headers, employee_id):
        travel_data = {
            "employee_id": employee_id,
            "purpose": "TEST_Travel_Iteration9 - Client meeting",
            "destination": "New York, NY",
            "departure_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "return_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            "estimated_cost": 2500,
            "transportation_type": "flight",
            "accommodation_required": True,
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/travel", headers=admin_headers, json=travel_data)
        assert response.status_code in [200, 201], f"Create travel request failed: {response.text}"
        data = response.json()
        print(f"✓ Travel request created: {data.get('id', 'N/A')}")


class TestRecognitionModule:
    """Recognition Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employees(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200:
            return response.json()
        return []
    
    def test_get_recognition_categories(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/recognition/categories", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Recognition categories: {len(data)} categories found")
    
    def test_get_recognition_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/recognition/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Recognition stats retrieved")
    
    def test_get_recognition_wall(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/recognition/wall", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Recognition wall: {len(data)} recognitions found")
    
    def test_get_recognition_leaderboard(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/recognition/leaderboard", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Recognition leaderboard: {len(data)} entries")
    
    def test_give_recognition(self, admin_headers, employees):
        if len(employees) < 2:
            pytest.skip("Need at least 2 employees for recognition test")
        
        recognition_data = {
            "recipient_id": employees[1]["id"],
            "giver_id": employees[0]["id"],
            "category": "teamwork",
            "message": "TEST_Recognition_Iteration9 - Great teamwork on the project!",
            "points": 50,
            "is_public": True
        }
        response = requests.post(f"{BASE_URL}/api/recognition", headers=admin_headers, json=recognition_data)
        assert response.status_code in [200, 201], f"Give recognition failed: {response.text}"
        data = response.json()
        print(f"✓ Recognition given: {data.get('id', 'N/A')}")


class TestTeamCalendarModule:
    """Team Calendar Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_calendar_events(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/calendar/events", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar events: {len(data)} events found")
    
    def test_get_upcoming_events(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/calendar/upcoming", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Upcoming events: {len(data)} events")
    
    def test_create_calendar_event(self, admin_headers, employee_id):
        event_data = {
            "title": "TEST_Event_Iteration9",
            "description": "Test calendar event for iteration 9",
            "event_type": "meeting",
            "start_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "start_time": "10:00",
            "end_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "end_time": "11:00",
            "location": "Conference Room A",
            "organizer_id": employee_id,
            "attendees": [employee_id],
            "is_all_day": False
        }
        response = requests.post(f"{BASE_URL}/api/calendar/events", headers=admin_headers, json=event_data)
        assert response.status_code in [200, 201], f"Create event failed: {response.text}"
        data = response.json()
        print(f"✓ Calendar event created: {data.get('id', 'N/A')}")
    
    def test_get_team_availability(self, admin_headers):
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/calendar/team-availability?date={today}", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Team availability retrieved")


class TestSuccessionPlanningModule:
    """Succession Planning Module tests"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def employee_id(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0]["id"]
        return None
    
    def test_get_succession_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/succession/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Succession stats retrieved")
    
    def test_get_key_positions(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/succession/positions", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Key positions: {len(data)} positions found")
    
    def test_get_succession_candidates(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/succession/candidates", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Succession candidates: {len(data)} candidates found")
    
    def test_get_talent_pool(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/succession/talent-pool", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Talent pool: {len(data)} entries")
    
    def test_get_9box_grid(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/succession/9-box", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ 9-box grid retrieved")
    
    def test_create_key_position(self, admin_headers, employee_id):
        position_data = {
            "title": "TEST_Position_Iteration9",
            "department": "Engineering",
            "current_holder_id": employee_id,
            "criticality": "high",
            "risk_level": "medium",
            "description": "Test key position for iteration 9"
        }
        response = requests.post(f"{BASE_URL}/api/succession/positions", headers=admin_headers, json=position_data)
        assert response.status_code in [200, 201], f"Create position failed: {response.text}"
        data = response.json()
        print(f"✓ Key position created: {data.get('id', 'N/A')}")


class TestNavigationEndpoints:
    """Test all navigation-related endpoints work"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}", "Content-Type": "application/json"}
    
    def test_dashboard_stats(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Dashboard stats endpoint working")
    
    def test_employees_endpoint(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/employees", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Employees endpoint working")
    
    def test_departments_endpoint(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/departments", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Departments endpoint working")
    
    def test_leaves_endpoint(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/leaves", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Leaves endpoint working")
    
    def test_attendance_endpoint(self, admin_headers):
        response = requests.get(f"{BASE_URL}/api/attendance", headers=admin_headers)
        assert response.status_code == 200
        print(f"✓ Attendance endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
