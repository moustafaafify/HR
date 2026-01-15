"""
Recruitment Module Backend Tests
Tests for Jobs, Applications, Interviews, and Recruitment Stats APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRecruitmentModule:
    """Comprehensive tests for the recruitment module"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - get auth tokens"""
        # Admin login
        admin_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert admin_response.status_code == 200, f"Admin login failed: {admin_response.text}"
        self.admin_token = admin_response.json()["token"]
        self.admin_headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        # Employee login
        emp_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah.johnson@lojyn.com",
            "password": "sarah123"
        })
        assert emp_response.status_code == 200, f"Employee login failed: {emp_response.text}"
        self.employee_token = emp_response.json()["token"]
        self.employee_headers = {
            "Authorization": f"Bearer {self.employee_token}",
            "Content-Type": "application/json"
        }
        
        # Get employee ID for referrals
        emp_data = requests.get(f"{BASE_URL}/api/employees", headers=self.admin_headers)
        if emp_data.status_code == 200:
            employees = emp_data.json()
            sarah = next((e for e in employees if "sarah" in e.get("full_name", "").lower()), None)
            self.employee_id = sarah["id"] if sarah else None
        else:
            self.employee_id = None
    
    # ============= JOBS CRUD TESTS =============
    
    def test_01_create_job_posting(self):
        """Test creating a new job posting with all fields"""
        job_data = {
            "title": "TEST_Senior Software Engineer",
            "department_id": None,
            "location": "New York, NY",
            "job_type": "full_time",
            "experience_level": "senior",
            "description": "We are looking for a senior software engineer to join our team.",
            "responsibilities": "- Lead technical projects\n- Mentor junior developers\n- Code review",
            "requirements": "- 5+ years experience\n- Python/JavaScript proficiency\n- Strong communication",
            "benefits": "- Health insurance\n- 401k matching\n- Remote work options",
            "salary_min": 120000,
            "salary_max": 180000,
            "salary_currency": "USD",
            "show_salary": True,
            "positions_count": 2,
            "is_internal": False,
            "expiry_date": "2025-12-31",
            "status": "open"
        }
        
        response = requests.post(f"{BASE_URL}/api/jobs", json=job_data, headers=self.admin_headers)
        assert response.status_code == 200, f"Create job failed: {response.text}"
        
        job = response.json()
        assert job["title"] == job_data["title"]
        assert job["location"] == job_data["location"]
        assert job["job_type"] == job_data["job_type"]
        assert job["experience_level"] == job_data["experience_level"]
        assert job["salary_min"] == job_data["salary_min"]
        assert job["salary_max"] == job_data["salary_max"]
        assert job["positions_count"] == job_data["positions_count"]
        assert job["is_internal"] == job_data["is_internal"]
        assert "id" in job
        
        # Store job ID for later tests
        self.__class__.test_job_id = job["id"]
        print(f"✓ Created job: {job['id']}")
    
    def test_02_get_all_jobs(self):
        """Test getting all jobs"""
        response = requests.get(f"{BASE_URL}/api/jobs", headers=self.admin_headers)
        assert response.status_code == 200, f"Get jobs failed: {response.text}"
        
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"✓ Retrieved {len(jobs)} jobs")
    
    def test_03_get_job_by_id(self):
        """Test getting a specific job by ID"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        response = requests.get(f"{BASE_URL}/api/jobs/{self.__class__.test_job_id}", headers=self.admin_headers)
        assert response.status_code == 200, f"Get job failed: {response.text}"
        
        job = response.json()
        assert job["id"] == self.__class__.test_job_id
        assert job["title"] == "TEST_Senior Software Engineer"
        print(f"✓ Retrieved job: {job['title']}")
    
    def test_04_update_job_posting(self):
        """Test updating a job posting"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        update_data = {
            "title": "TEST_Lead Software Engineer",
            "salary_max": 200000,
            "status": "open"
        }
        
        response = requests.put(f"{BASE_URL}/api/jobs/{self.__class__.test_job_id}", json=update_data, headers=self.admin_headers)
        assert response.status_code == 200, f"Update job failed: {response.text}"
        
        job = response.json()
        assert job["title"] == "TEST_Lead Software Engineer"
        assert job["salary_max"] == 200000
        print(f"✓ Updated job: {job['title']}")
    
    def test_05_get_open_jobs(self):
        """Test getting open jobs (job board endpoint)"""
        response = requests.get(f"{BASE_URL}/api/jobs/open", headers=self.employee_headers)
        assert response.status_code == 200, f"Get open jobs failed: {response.text}"
        
        jobs = response.json()
        assert isinstance(jobs, list)
        # All returned jobs should be open
        for job in jobs:
            assert job.get("status") == "open", f"Non-open job returned: {job.get('status')}"
        print(f"✓ Retrieved {len(jobs)} open jobs")
    
    def test_06_filter_jobs_by_status(self):
        """Test filtering jobs by status"""
        response = requests.get(f"{BASE_URL}/api/jobs?status=open", headers=self.admin_headers)
        assert response.status_code == 200, f"Filter jobs failed: {response.text}"
        
        jobs = response.json()
        for job in jobs:
            assert job.get("status") == "open"
        print(f"✓ Filtered {len(jobs)} open jobs")
    
    def test_07_get_job_stats(self):
        """Test getting job-specific statistics"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        response = requests.get(f"{BASE_URL}/api/jobs/{self.__class__.test_job_id}/stats", headers=self.admin_headers)
        assert response.status_code == 200, f"Get job stats failed: {response.text}"
        
        stats = response.json()
        assert "total" in stats
        assert "new" in stats
        assert "screening" in stats
        assert "interview" in stats
        assert "offer" in stats
        assert "hired" in stats
        assert "rejected" in stats
        print(f"✓ Job stats: {stats}")
    
    # ============= APPLICATIONS CRUD TESTS =============
    
    def test_08_create_application(self):
        """Test creating a new application"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        app_data = {
            "job_id": self.__class__.test_job_id,
            "candidate_name": "TEST_John Doe",
            "email": "test.john.doe@example.com",
            "phone": "+1-555-123-4567",
            "linkedin_url": "https://linkedin.com/in/johndoe",
            "portfolio_url": "https://johndoe.dev",
            "current_company": "Tech Corp",
            "current_title": "Software Engineer",
            "experience_years": 5,
            "expected_salary": 150000,
            "notice_period": "2 weeks",
            "source": "direct",
            "cover_letter": "I am excited to apply for this position..."
        }
        
        response = requests.post(f"{BASE_URL}/api/applications", json=app_data, headers=self.admin_headers)
        assert response.status_code == 200, f"Create application failed: {response.text}"
        
        app = response.json()
        assert app["candidate_name"] == app_data["candidate_name"]
        assert app["email"] == app_data["email"]
        assert app["experience_years"] == app_data["experience_years"]
        assert app["status"] == "new"
        assert "id" in app
        
        self.__class__.test_application_id = app["id"]
        print(f"✓ Created application: {app['id']}")
    
    def test_09_get_all_applications(self):
        """Test getting all applications"""
        response = requests.get(f"{BASE_URL}/api/applications", headers=self.admin_headers)
        assert response.status_code == 200, f"Get applications failed: {response.text}"
        
        apps = response.json()
        assert isinstance(apps, list)
        print(f"✓ Retrieved {len(apps)} applications")
    
    def test_10_get_application_by_id(self):
        """Test getting a specific application"""
        if not hasattr(self.__class__, 'test_application_id'):
            pytest.skip("No test application created")
        
        response = requests.get(f"{BASE_URL}/api/applications/{self.__class__.test_application_id}", headers=self.admin_headers)
        assert response.status_code == 200, f"Get application failed: {response.text}"
        
        app = response.json()
        assert app["id"] == self.__class__.test_application_id
        print(f"✓ Retrieved application: {app['candidate_name']}")
    
    def test_11_filter_applications_by_job(self):
        """Test filtering applications by job ID"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        response = requests.get(f"{BASE_URL}/api/applications?job_id={self.__class__.test_job_id}", headers=self.admin_headers)
        assert response.status_code == 200, f"Filter applications failed: {response.text}"
        
        apps = response.json()
        for app in apps:
            assert app.get("job_id") == self.__class__.test_job_id
        print(f"✓ Filtered {len(apps)} applications for job")
    
    def test_12_update_application_status(self):
        """Test updating application status (new -> screening -> interview)"""
        if not hasattr(self.__class__, 'test_application_id'):
            pytest.skip("No test application created")
        
        # Update to screening
        response = requests.put(
            f"{BASE_URL}/api/applications/{self.__class__.test_application_id}",
            json={"status": "screening"},
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Update to screening failed: {response.text}"
        assert response.json()["status"] == "screening"
        
        # Update to interview
        response = requests.put(
            f"{BASE_URL}/api/applications/{self.__class__.test_application_id}",
            json={"status": "interview"},
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Update to interview failed: {response.text}"
        assert response.json()["status"] == "interview"
        print("✓ Updated application status: new -> screening -> interview")
    
    def test_13_rate_application(self):
        """Test rating an application (1-5 stars)"""
        if not hasattr(self.__class__, 'test_application_id'):
            pytest.skip("No test application created")
        
        response = requests.put(
            f"{BASE_URL}/api/applications/{self.__class__.test_application_id}",
            json={"rating": 4},
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Rate application failed: {response.text}"
        
        app = response.json()
        assert app["rating"] == 4
        print(f"✓ Rated application: {app['rating']} stars")
    
    def test_14_export_applications(self):
        """Test exporting applications to CSV format"""
        response = requests.get(f"{BASE_URL}/api/applications/export", headers=self.admin_headers)
        assert response.status_code == 200, f"Export applications failed: {response.text}"
        
        data = response.json()
        assert "records" in data
        assert "total" in data
        assert isinstance(data["records"], list)
        print(f"✓ Exported {data['total']} applications")
    
    # ============= REFERRAL TESTS =============
    
    def test_15_create_referral_application(self):
        """Test creating a referral application"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        referral_data = {
            "job_id": self.__class__.test_job_id,
            "candidate_name": "TEST_Jane Smith (Referral)",
            "email": "test.jane.smith@example.com",
            "phone": "+1-555-987-6543",
            "source": "referral",
            "referral_employee_id": self.employee_id,
            "experience_years": 3,
            "current_company": "Another Corp",
            "current_title": "Junior Developer"
        }
        
        response = requests.post(f"{BASE_URL}/api/applications", json=referral_data, headers=self.employee_headers)
        assert response.status_code == 200, f"Create referral failed: {response.text}"
        
        app = response.json()
        assert app["source"] == "referral"
        assert app["referral_employee_id"] == self.employee_id
        
        self.__class__.test_referral_id = app["id"]
        print(f"✓ Created referral application: {app['id']}")
    
    def test_16_get_my_referrals(self):
        """Test getting referrals made by current employee"""
        response = requests.get(f"{BASE_URL}/api/applications/my-referrals", headers=self.employee_headers)
        assert response.status_code == 200, f"Get my referrals failed: {response.text}"
        
        referrals = response.json()
        assert isinstance(referrals, list)
        print(f"✓ Retrieved {len(referrals)} referrals")
    
    def test_17_filter_applications_by_referral(self):
        """Test filtering applications by referral employee ID"""
        if not self.employee_id:
            pytest.skip("No employee ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/applications?referral_employee_id={self.employee_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Filter referrals failed: {response.text}"
        
        apps = response.json()
        for app in apps:
            assert app.get("referral_employee_id") == self.employee_id
        print(f"✓ Filtered {len(apps)} referral applications")
    
    # ============= INTERVIEW TESTS =============
    
    def test_18_schedule_interview(self):
        """Test scheduling an interview for an application"""
        if not hasattr(self.__class__, 'test_application_id') or not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test application or job created")
        
        interview_data = {
            "application_id": self.__class__.test_application_id,
            "job_id": self.__class__.test_job_id,
            "interview_type": "video",
            "scheduled_date": "2025-02-15",
            "scheduled_time": "10:00",
            "duration_minutes": 60,
            "meeting_link": "https://zoom.us/j/123456789",
            "interviewers": [],
            "notes": "Technical interview round 1"
        }
        
        response = requests.post(f"{BASE_URL}/api/interviews", json=interview_data, headers=self.admin_headers)
        assert response.status_code == 200, f"Schedule interview failed: {response.text}"
        
        interview = response.json()
        assert interview["interview_type"] == "video"
        assert interview["scheduled_date"] == "2025-02-15"
        assert interview["status"] == "scheduled"
        assert "id" in interview
        
        self.__class__.test_interview_id = interview["id"]
        print(f"✓ Scheduled interview: {interview['id']}")
    
    def test_19_get_all_interviews(self):
        """Test getting all interviews"""
        response = requests.get(f"{BASE_URL}/api/interviews", headers=self.admin_headers)
        assert response.status_code == 200, f"Get interviews failed: {response.text}"
        
        interviews = response.json()
        assert isinstance(interviews, list)
        print(f"✓ Retrieved {len(interviews)} interviews")
    
    def test_20_filter_interviews_by_application(self):
        """Test filtering interviews by application ID"""
        if not hasattr(self.__class__, 'test_application_id'):
            pytest.skip("No test application created")
        
        response = requests.get(
            f"{BASE_URL}/api/interviews?application_id={self.__class__.test_application_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Filter interviews failed: {response.text}"
        
        interviews = response.json()
        for interview in interviews:
            assert interview.get("application_id") == self.__class__.test_application_id
        print(f"✓ Filtered {len(interviews)} interviews for application")
    
    def test_21_update_interview(self):
        """Test updating interview details and completing it"""
        if not hasattr(self.__class__, 'test_interview_id'):
            pytest.skip("No test interview created")
        
        update_data = {
            "status": "completed",
            "feedback": "Strong technical skills, good communication",
            "rating": 4,
            "recommendation": "hire"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/interviews/{self.__class__.test_interview_id}",
            json=update_data,
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Update interview failed: {response.text}"
        
        interview = response.json()
        assert interview["status"] == "completed"
        assert interview["rating"] == 4
        assert interview["recommendation"] == "hire"
        print(f"✓ Updated interview: status={interview['status']}, recommendation={interview['recommendation']}")
    
    # ============= RECRUITMENT STATS TESTS =============
    
    def test_22_get_recruitment_stats(self):
        """Test getting overall recruitment statistics"""
        response = requests.get(f"{BASE_URL}/api/recruitment/stats", headers=self.admin_headers)
        assert response.status_code == 200, f"Get recruitment stats failed: {response.text}"
        
        stats = response.json()
        assert "jobs" in stats
        assert "applications" in stats
        assert "interviews" in stats
        
        # Verify jobs stats structure
        assert "total" in stats["jobs"]
        assert "open" in stats["jobs"]
        assert "closed" in stats["jobs"]
        
        # Verify applications stats structure
        assert "total" in stats["applications"]
        assert "new" in stats["applications"]
        assert "hired" in stats["applications"]
        assert "referrals" in stats["applications"]
        
        # Verify interviews stats structure
        assert "total" in stats["interviews"]
        assert "scheduled" in stats["interviews"]
        assert "completed" in stats["interviews"]
        
        print(f"✓ Recruitment stats: Jobs={stats['jobs']['total']}, Applications={stats['applications']['total']}, Interviews={stats['interviews']['total']}")
    
    # ============= CLEANUP TESTS =============
    
    def test_23_delete_interview(self):
        """Test deleting an interview"""
        if not hasattr(self.__class__, 'test_interview_id'):
            pytest.skip("No test interview created")
        
        response = requests.delete(
            f"{BASE_URL}/api/interviews/{self.__class__.test_interview_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Delete interview failed: {response.text}"
        print("✓ Deleted test interview")
    
    def test_24_delete_referral_application(self):
        """Test deleting a referral application"""
        if not hasattr(self.__class__, 'test_referral_id'):
            pytest.skip("No test referral created")
        
        response = requests.delete(
            f"{BASE_URL}/api/applications/{self.__class__.test_referral_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Delete referral failed: {response.text}"
        print("✓ Deleted test referral application")
    
    def test_25_delete_application(self):
        """Test deleting an application"""
        if not hasattr(self.__class__, 'test_application_id'):
            pytest.skip("No test application created")
        
        response = requests.delete(
            f"{BASE_URL}/api/applications/{self.__class__.test_application_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Delete application failed: {response.text}"
        print("✓ Deleted test application")
    
    def test_26_delete_job(self):
        """Test deleting a job posting"""
        if not hasattr(self.__class__, 'test_job_id'):
            pytest.skip("No test job created")
        
        response = requests.delete(
            f"{BASE_URL}/api/jobs/{self.__class__.test_job_id}",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Delete job failed: {response.text}"
        
        # Verify job is deleted
        get_response = requests.get(
            f"{BASE_URL}/api/jobs/{self.__class__.test_job_id}",
            headers=self.admin_headers
        )
        assert get_response.status_code == 404, "Job should be deleted"
        print("✓ Deleted test job and verified deletion")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
