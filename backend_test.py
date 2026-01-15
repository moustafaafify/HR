import requests
import sys
import json
from datetime import datetime

class HRPlatformAPITester:
    def __init__(self, base_url="https://hrhub-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test user registration
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User",
            "role": "super_admin"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            register_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            
            # Test login with same credentials
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            login_response = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                login_data
            )
            
            # Test get current user
            self.run_test(
                "Get Current User",
                "GET",
                "auth/me",
                200
            )
        else:
            print("❌ Registration failed, skipping login tests")

    def test_settings_api(self):
        """Test settings endpoints"""
        print("\n⚙️ Testing Settings...")
        
        # Get settings
        settings = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        
        if settings:
            # Update settings
            update_data = {
                "language_1": "en",
                "language_2": "es",
                "currency": "EUR",
                "exchange_rates": {
                    "USD": 1.0,
                    "EUR": 0.85,
                    "GBP": 0.75
                }
            }
            
            self.run_test(
                "Update Settings",
                "PUT",
                "settings",
                200,
                update_data
            )

    def test_corporations_api(self):
        """Test corporation CRUD operations"""
        print("\n🏢 Testing Corporations...")
        
        # Create corporation
        corp_data = {
            "name": "Test Corporation",
            "address": "123 Test Street"
        }
        
        corp_response = self.run_test(
            "Create Corporation",
            "POST",
            "corporations",
            200,
            corp_data
        )
        
        if corp_response and 'id' in corp_response:
            corp_id = corp_response['id']
            
            # Get all corporations
            self.run_test(
                "Get All Corporations",
                "GET",
                "corporations",
                200
            )
            
            # Get specific corporation
            self.run_test(
                "Get Corporation by ID",
                "GET",
                f"corporations/{corp_id}",
                200
            )
            
            # Update corporation
            update_data = {
                "name": "Updated Corporation",
                "address": "456 Updated Street"
            }
            
            self.run_test(
                "Update Corporation",
                "PUT",
                f"corporations/{corp_id}",
                200,
                update_data
            )
            
            # Delete corporation
            self.run_test(
                "Delete Corporation",
                "DELETE",
                f"corporations/{corp_id}",
                200
            )
            
            return corp_id
        
        return None

    def test_branches_api(self):
        """Test branch CRUD operations"""
        print("\n🌿 Testing Branches...")
        
        # First create a corporation for the branch
        corp_data = {"name": "Branch Test Corp", "address": "Corp Address"}
        corp_response = self.run_test(
            "Create Corporation for Branch",
            "POST",
            "corporations",
            200,
            corp_data
        )
        
        if corp_response and 'id' in corp_response:
            corp_id = corp_response['id']
            
            # Create branch
            branch_data = {
                "name": "Test Branch",
                "corporation_id": corp_id,
                "address": "Branch Address"
            }
            
            branch_response = self.run_test(
                "Create Branch",
                "POST",
                "branches",
                200,
                branch_data
            )
            
            if branch_response and 'id' in branch_response:
                branch_id = branch_response['id']
                
                # Get all branches
                self.run_test(
                    "Get All Branches",
                    "GET",
                    "branches",
                    200
                )
                
                # Get branches by corporation
                self.run_test(
                    "Get Branches by Corporation",
                    "GET",
                    f"branches?corporation_id={corp_id}",
                    200
                )
                
                # Get specific branch
                self.run_test(
                    "Get Branch by ID",
                    "GET",
                    f"branches/{branch_id}",
                    200
                )
                
                # Update branch
                update_data = {
                    "name": "Updated Branch",
                    "address": "Updated Branch Address"
                }
                
                self.run_test(
                    "Update Branch",
                    "PUT",
                    f"branches/{branch_id}",
                    200,
                    update_data
                )
                
                return corp_id, branch_id
        
        return None, None

    def test_employees_api(self):
        """Test employee CRUD operations"""
        print("\n👥 Testing Employees...")
        
        # Create corporation and branch first
        corp_id, branch_id = self.test_branches_api()
        
        if corp_id and branch_id:
            # Create employee
            emp_data = {
                "user_id": f"emp_user_{datetime.now().strftime('%H%M%S')}",
                "full_name": "Test Employee",
                "email": f"emp_{datetime.now().strftime('%H%M%S')}@example.com",
                "phone": "123-456-7890",
                "position": "Software Engineer",
                "branch_id": branch_id,
                "corporation_id": corp_id,
                "salary": 75000.0,
                "currency": "USD",
                "hire_date": "2024-01-01"
            }
            
            emp_response = self.run_test(
                "Create Employee",
                "POST",
                "employees",
                200,
                emp_data
            )
            
            if emp_response and 'id' in emp_response:
                emp_id = emp_response['id']
                
                # Get all employees
                self.run_test(
                    "Get All Employees",
                    "GET",
                    "employees",
                    200
                )
                
                # Get employees by branch
                self.run_test(
                    "Get Employees by Branch",
                    "GET",
                    f"employees?branch_id={branch_id}",
                    200
                )
                
                # Get specific employee
                self.run_test(
                    "Get Employee by ID",
                    "GET",
                    f"employees/{emp_id}",
                    200
                )
                
                # Update employee
                update_data = {
                    "full_name": "Updated Employee",
                    "salary": 80000.0
                }
                
                self.run_test(
                    "Update Employee",
                    "PUT",
                    f"employees/{emp_id}",
                    200,
                    update_data
                )
                
                return emp_id
        
        return None

    def test_leaves_api(self):
        """Test leave management"""
        print("\n📅 Testing Leaves...")
        
        emp_id = self.test_employees_api()
        
        if emp_id:
            # Create leave request
            leave_data = {
                "employee_id": emp_id,
                "leave_type": "vacation",
                "start_date": "2024-12-01",
                "end_date": "2024-12-05",
                "reason": "Family vacation"
            }
            
            leave_response = self.run_test(
                "Create Leave Request",
                "POST",
                "leaves",
                200,
                leave_data
            )
            
            if leave_response and 'id' in leave_response:
                leave_id = leave_response['id']
                
                # Get all leaves
                self.run_test(
                    "Get All Leaves",
                    "GET",
                    "leaves",
                    200
                )
                
                # Get leaves by employee
                self.run_test(
                    "Get Leaves by Employee",
                    "GET",
                    f"leaves?employee_id={emp_id}",
                    200
                )
                
                # Update leave status
                self.run_test(
                    "Approve Leave",
                    "PUT",
                    f"leaves/{leave_id}",
                    200,
                    {"status": "approved"}
                )

    def test_attendance_api(self):
        """Test attendance tracking"""
        print("\n⏰ Testing Attendance...")
        
        emp_id = self.test_employees_api()
        
        if emp_id:
            # Create attendance record
            attendance_data = {
                "employee_id": emp_id,
                "date": "2024-12-01",
                "clock_in": "09:00:00",
                "clock_out": "17:00:00"
            }
            
            attendance_response = self.run_test(
                "Create Attendance Record",
                "POST",
                "attendance",
                200,
                attendance_data
            )
            
            if attendance_response:
                # Get all attendance records
                self.run_test(
                    "Get All Attendance",
                    "GET",
                    "attendance",
                    200
                )
                
                # Get attendance by employee
                self.run_test(
                    "Get Attendance by Employee",
                    "GET",
                    f"attendance?employee_id={emp_id}",
                    200
                )

    def test_performance_api(self):
        """Test performance reviews"""
        print("\n📊 Testing Performance Reviews...")
        
        emp_id = self.test_employees_api()
        
        if emp_id and self.user_id:
            # Create performance review
            review_data = {
                "employee_id": emp_id,
                "reviewer_id": self.user_id,
                "period": "Q4 2024",
                "rating": 4.5,
                "feedback": "Excellent performance this quarter"
            }
            
            review_response = self.run_test(
                "Create Performance Review",
                "POST",
                "reviews",
                200,
                review_data
            )
            
            if review_response:
                # Get all reviews
                self.run_test(
                    "Get All Reviews",
                    "GET",
                    "reviews",
                    200
                )
                
                # Get reviews by employee
                self.run_test(
                    "Get Reviews by Employee",
                    "GET",
                    f"reviews?employee_id={emp_id}",
                    200
                )

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📈 Testing Dashboard Stats...")
        
        self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting HR Platform API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        self.test_auth_flow()
        
        if not self.token:
            print("❌ Authentication failed, cannot continue with other tests")
            return False
        
        # Test all other endpoints
        self.test_settings_api()
        self.test_corporations_api()
        self.test_branches_api()
        self.test_employees_api()
        self.test_leaves_api()
        self.test_attendance_api()
        self.test_performance_api()
        self.test_dashboard_stats()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = HRPlatformAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())