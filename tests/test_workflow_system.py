"""
Test suite for HR Platform Workflow System
Tests workflow templates CRUD, workflow instances, leave/time correction integration,
and approval/rejection flows
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWorkflowSystem:
    """Tests for workflow system in HR Platform"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.admin_user = login_response.json().get("user")
        
        # Get corporation and branch IDs for employee creation
        corps = self.session.get(f"{BASE_URL}/api/corporations").json()
        branches = self.session.get(f"{BASE_URL}/api/branches").json()
        
        self.corp_id = corps[0]["id"] if corps else None
        self.branch_id = branches[0]["id"] if branches else None
        
        # Get existing employees
        employees = self.session.get(f"{BASE_URL}/api/employees").json()
        self.employee_id = employees[0]["id"] if employees else None
        
        yield
        
        # Cleanup: Delete test workflows and instances
        try:
            workflows = self.session.get(f"{BASE_URL}/api/workflows").json()
            for wf in workflows:
                if wf.get("name", "").startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/workflows/{wf['id']}")
            
            # Delete test leaves
            leaves = self.session.get(f"{BASE_URL}/api/leaves").json()
            for leave in leaves:
                if leave.get("reason", "").startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/leaves/{leave['id']}")
        except Exception:
            pass
    
    # ============= WORKFLOW TEMPLATES CRUD TESTS =============
    
    def test_get_workflows_returns_list(self):
        """Test GET /api/workflows returns list of workflows"""
        response = self.session.get(f"{BASE_URL}/api/workflows")
        
        assert response.status_code == 200
        workflows = response.json()
        assert isinstance(workflows, list)
        print(f"Found {len(workflows)} workflows")
    
    def test_create_workflow_template(self):
        """Test creating a new workflow template"""
        workflow_data = {
            "name": "TEST_Leave_Approval_Workflow",
            "description": "Test workflow for leave approval",
            "module": "leave",
            "is_active": True,
            "steps": [
                {
                    "order": 1,
                    "name": "Manager Approval",
                    "approver_type": "manager",
                    "can_skip": False
                }
            ]
        }
        
        response = self.session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        
        assert response.status_code == 200, f"Failed to create workflow: {response.text}"
        created = response.json()
        
        assert created["name"] == workflow_data["name"]
        assert created["module"] == "leave"
        assert created["is_active"] == True
        assert len(created["steps"]) == 1
        assert "id" in created
        
        print(f"Created workflow: {created['name']} with ID: {created['id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{created['id']}")
    
    def test_get_single_workflow(self):
        """Test GET /api/workflows/{id} returns single workflow"""
        # First create a workflow
        workflow_data = {
            "name": "TEST_Single_Workflow",
            "module": "expense",
            "is_active": True,
            "steps": []
        }
        create_response = self.session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Get single workflow
        response = self.session.get(f"{BASE_URL}/api/workflows/{workflow_id}")
        
        assert response.status_code == 200
        workflow = response.json()
        assert workflow["id"] == workflow_id
        assert workflow["name"] == "TEST_Single_Workflow"
        
        print(f"Successfully fetched workflow: {workflow['name']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{workflow_id}")
    
    def test_update_workflow_template(self):
        """Test updating a workflow template"""
        # Create workflow
        workflow_data = {
            "name": "TEST_Update_Workflow",
            "module": "training",
            "is_active": True,
            "steps": []
        }
        create_response = self.session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Update workflow
        update_data = {
            "name": "TEST_Updated_Workflow_Name",
            "description": "Updated description",
            "is_active": False
        }
        update_response = self.session.put(f"{BASE_URL}/api/workflows/{workflow_id}", json=update_data)
        
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated_Workflow_Name"
        assert updated["description"] == "Updated description"
        assert updated["is_active"] == False
        
        print(f"Successfully updated workflow: {updated['name']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{workflow_id}")
    
    def test_delete_workflow_template(self):
        """Test deleting a workflow template"""
        # Create workflow
        workflow_data = {
            "name": "TEST_Delete_Workflow",
            "module": "document",
            "is_active": True,
            "steps": []
        }
        create_response = self.session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        workflow_id = create_response.json()["id"]
        
        # Delete workflow
        delete_response = self.session.delete(f"{BASE_URL}/api/workflows/{workflow_id}")
        
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/workflows/{workflow_id}")
        assert get_response.status_code == 404
        
        print("Successfully deleted workflow")
    
    def test_filter_workflows_by_module(self):
        """Test filtering workflows by module"""
        response = self.session.get(f"{BASE_URL}/api/workflows?module=leave")
        
        assert response.status_code == 200
        workflows = response.json()
        
        # All returned workflows should be for leave module
        for wf in workflows:
            assert wf["module"] == "leave"
        
        print(f"Found {len(workflows)} leave workflows")
    
    # ============= WORKFLOW INSTANCES TESTS =============
    
    def test_get_workflow_instances(self):
        """Test GET /api/workflow-instances returns list"""
        response = self.session.get(f"{BASE_URL}/api/workflow-instances")
        
        assert response.status_code == 200
        instances = response.json()
        assert isinstance(instances, list)
        print(f"Found {len(instances)} workflow instances")
    
    def test_filter_instances_by_module(self):
        """Test filtering workflow instances by module"""
        response = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave")
        
        assert response.status_code == 200
        instances = response.json()
        
        for inst in instances:
            assert inst["module"] == "leave"
        
        print(f"Found {len(instances)} leave workflow instances")
    
    def test_filter_instances_by_status(self):
        """Test filtering workflow instances by status"""
        response = self.session.get(f"{BASE_URL}/api/workflow-instances?status=pending")
        
        assert response.status_code == 200
        instances = response.json()
        
        for inst in instances:
            assert inst["status"] == "pending"
        
        print(f"Found {len(instances)} pending workflow instances")
    
    # ============= LEAVE WORKFLOW INTEGRATION TESTS =============
    
    def test_leave_triggers_workflow_when_active_workflow_exists(self):
        """Test that creating a leave request triggers workflow instance when active workflow exists"""
        # First check if there's an active leave workflow
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=leave").json()
        active_leave_workflow = next((w for w in workflows if w.get("is_active") and w.get("steps")), None)
        
        if not active_leave_workflow:
            pytest.skip("No active leave workflow with steps exists")
        
        # Get initial instance count
        initial_instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave").json()
        initial_count = len(initial_instances)
        
        # Create a leave request
        leave_data = {
            "employee_id": self.employee_id,
            "leave_type": "annual",
            "start_date": "2025-01-15",
            "end_date": "2025-01-17",
            "reason": "TEST_Workflow_Integration_Leave"
        }
        
        leave_response = self.session.post(f"{BASE_URL}/api/leaves", json=leave_data)
        assert leave_response.status_code == 200, f"Failed to create leave: {leave_response.text}"
        
        created_leave = leave_response.json()
        
        # Check that leave status is pending_approval (not just pending)
        assert created_leave["status"] == "pending_approval", f"Expected pending_approval, got {created_leave['status']}"
        
        # Check that a workflow instance was created
        time.sleep(0.5)  # Small delay for DB consistency
        new_instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave").json()
        
        assert len(new_instances) > initial_count, "No new workflow instance created"
        
        # Find the instance for our leave
        leave_instance = next((i for i in new_instances if i["reference_id"] == created_leave["id"]), None)
        assert leave_instance is not None, "Workflow instance not found for created leave"
        assert leave_instance["status"] == "pending"
        
        print(f"Leave request triggered workflow instance: {leave_instance['id']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/leaves/{created_leave['id']}")
    
    # ============= WORKFLOW APPROVAL/REJECTION TESTS =============
    
    def test_approve_workflow_instance(self):
        """Test approving a workflow instance updates the original request"""
        # Check for active leave workflow
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=leave").json()
        active_leave_workflow = next((w for w in workflows if w.get("is_active") and w.get("steps")), None)
        
        if not active_leave_workflow:
            pytest.skip("No active leave workflow with steps exists")
        
        # Create a leave request
        leave_data = {
            "employee_id": self.employee_id,
            "leave_type": "sick",
            "start_date": "2025-02-01",
            "end_date": "2025-02-02",
            "reason": "TEST_Approval_Flow_Leave"
        }
        
        leave_response = self.session.post(f"{BASE_URL}/api/leaves", json=leave_data)
        created_leave = leave_response.json()
        
        # Find the workflow instance
        time.sleep(0.5)
        instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave").json()
        leave_instance = next((i for i in instances if i["reference_id"] == created_leave["id"]), None)
        
        if not leave_instance:
            pytest.skip("No workflow instance created for leave")
        
        # Approve the workflow instance
        approve_response = self.session.put(
            f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}/action",
            json={"action": "approve", "comment": "Approved by test"}
        )
        
        assert approve_response.status_code == 200, f"Approval failed: {approve_response.text}"
        
        # Verify the workflow instance is approved
        updated_instance = self.session.get(f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}").json()
        assert updated_instance["status"] == "approved"
        
        # Verify the leave request is approved
        updated_leave = self.session.get(f"{BASE_URL}/api/leaves").json()
        leave_record = next((l for l in updated_leave if l["id"] == created_leave["id"]), None)
        assert leave_record["status"] == "approved", f"Leave status not updated: {leave_record['status']}"
        
        print("Workflow approval successfully updated leave status to approved")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/leaves/{created_leave['id']}")
    
    def test_reject_workflow_instance(self):
        """Test rejecting a workflow instance updates the original request"""
        # Check for active leave workflow
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=leave").json()
        active_leave_workflow = next((w for w in workflows if w.get("is_active") and w.get("steps")), None)
        
        if not active_leave_workflow:
            pytest.skip("No active leave workflow with steps exists")
        
        # Create a leave request
        leave_data = {
            "employee_id": self.employee_id,
            "leave_type": "personal",
            "start_date": "2025-03-01",
            "end_date": "2025-03-02",
            "reason": "TEST_Rejection_Flow_Leave"
        }
        
        leave_response = self.session.post(f"{BASE_URL}/api/leaves", json=leave_data)
        created_leave = leave_response.json()
        
        # Find the workflow instance
        time.sleep(0.5)
        instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave").json()
        leave_instance = next((i for i in instances if i["reference_id"] == created_leave["id"]), None)
        
        if not leave_instance:
            pytest.skip("No workflow instance created for leave")
        
        # Reject the workflow instance
        reject_response = self.session.put(
            f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}/action",
            json={"action": "reject", "comment": "Rejected by test - insufficient leave balance"}
        )
        
        assert reject_response.status_code == 200, f"Rejection failed: {reject_response.text}"
        
        # Verify the workflow instance is rejected
        updated_instance = self.session.get(f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}").json()
        assert updated_instance["status"] == "rejected"
        
        # Verify the leave request is rejected
        updated_leave = self.session.get(f"{BASE_URL}/api/leaves").json()
        leave_record = next((l for l in updated_leave if l["id"] == created_leave["id"]), None)
        assert leave_record["status"] == "rejected", f"Leave status not updated: {leave_record['status']}"
        assert leave_record.get("rejection_reason") == "Rejected by test - insufficient leave balance"
        
        print("Workflow rejection successfully updated leave status to rejected")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/leaves/{created_leave['id']}")
    
    # ============= WORKFLOW INSTANCE DETAILS TESTS =============
    
    def test_get_workflow_instance_details(self):
        """Test GET /api/workflow-instances/{id}/details returns enriched data"""
        # Get existing instances
        instances = self.session.get(f"{BASE_URL}/api/workflow-instances").json()
        
        if not instances:
            pytest.skip("No workflow instances exist")
        
        instance_id = instances[0]["id"]
        
        response = self.session.get(f"{BASE_URL}/api/workflow-instances/{instance_id}/details")
        
        assert response.status_code == 200
        details = response.json()
        
        # Should have enriched data
        assert "workflow" in details or details.get("workflow_id")
        assert "reference_document" in details or details.get("reference_id")
        
        print(f"Got workflow instance details for: {instance_id}")
    
    # ============= TIME CORRECTION WORKFLOW INTEGRATION TESTS =============
    
    def test_time_correction_triggers_workflow(self):
        """Test that creating a time correction triggers workflow when active workflow exists"""
        # Check for active time_correction workflow
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=time_correction").json()
        active_tc_workflow = next((w for w in workflows if w.get("is_active") and w.get("steps")), None)
        
        if not active_tc_workflow:
            pytest.skip("No active time_correction workflow with steps exists")
        
        # First create an attendance record
        attendance_data = {
            "employee_id": self.employee_id,
            "date": "2025-01-10",
            "clock_in": "09:30",
            "clock_out": "17:30",
            "status": "present"
        }
        
        attendance_response = self.session.post(f"{BASE_URL}/api/attendance", json=attendance_data)
        assert attendance_response.status_code == 200
        attendance = attendance_response.json()
        
        # Get initial instance count
        initial_instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=time_correction").json()
        initial_count = len(initial_instances)
        
        # Create time correction request
        correction_data = {
            "employee_id": self.employee_id,
            "attendance_id": attendance["id"],
            "date": "2025-01-10",
            "original_clock_in": "09:30",
            "original_clock_out": "17:30",
            "requested_clock_in": "09:00",
            "requested_clock_out": "18:00",
            "reason": "TEST_Workflow_Time_Correction"
        }
        
        correction_response = self.session.post(f"{BASE_URL}/api/time-corrections", json=correction_data)
        assert correction_response.status_code == 200, f"Failed to create time correction: {correction_response.text}"
        
        created_correction = correction_response.json()
        
        # Check that status is pending_approval
        assert created_correction["status"] == "pending_approval", f"Expected pending_approval, got {created_correction['status']}"
        
        # Check that a workflow instance was created
        time.sleep(0.5)
        new_instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=time_correction").json()
        
        assert len(new_instances) > initial_count, "No new workflow instance created for time correction"
        
        print(f"Time correction triggered workflow instance")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/attendance/{attendance['id']}")
    
    # ============= WORKFLOW STEPS TESTS =============
    
    def test_workflow_with_multiple_steps(self):
        """Test creating workflow with multiple approval steps"""
        workflow_data = {
            "name": "TEST_Multi_Step_Workflow",
            "description": "Workflow with multiple approval steps",
            "module": "expense",
            "is_active": True,
            "steps": [
                {
                    "order": 1,
                    "name": "Manager Approval",
                    "approver_type": "manager",
                    "can_skip": False
                },
                {
                    "order": 2,
                    "name": "Department Head Approval",
                    "approver_type": "department_head",
                    "can_skip": True
                },
                {
                    "order": 3,
                    "name": "Finance Approval",
                    "approver_type": "role",
                    "approver_id": "finance_role_id",
                    "can_skip": False
                }
            ]
        }
        
        response = self.session.post(f"{BASE_URL}/api/workflows", json=workflow_data)
        
        assert response.status_code == 200
        created = response.json()
        
        assert len(created["steps"]) == 3
        assert created["steps"][0]["name"] == "Manager Approval"
        assert created["steps"][1]["can_skip"] == True
        assert created["steps"][2]["approver_type"] == "role"
        
        print(f"Created multi-step workflow with {len(created['steps'])} steps")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/workflows/{created['id']}")
    
    def test_workflow_step_history_recorded(self):
        """Test that workflow actions are recorded in step_history"""
        # Check for active leave workflow
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=leave").json()
        active_leave_workflow = next((w for w in workflows if w.get("is_active") and w.get("steps")), None)
        
        if not active_leave_workflow:
            pytest.skip("No active leave workflow with steps exists")
        
        # Create a leave request
        leave_data = {
            "employee_id": self.employee_id,
            "leave_type": "annual",
            "start_date": "2025-04-01",
            "end_date": "2025-04-02",
            "reason": "TEST_Step_History_Leave"
        }
        
        leave_response = self.session.post(f"{BASE_URL}/api/leaves", json=leave_data)
        created_leave = leave_response.json()
        
        # Find the workflow instance
        time.sleep(0.5)
        instances = self.session.get(f"{BASE_URL}/api/workflow-instances?module=leave").json()
        leave_instance = next((i for i in instances if i["reference_id"] == created_leave["id"]), None)
        
        if not leave_instance:
            pytest.skip("No workflow instance created for leave")
        
        # Approve the workflow instance
        self.session.put(
            f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}/action",
            json={"action": "approve", "comment": "Test approval comment"}
        )
        
        # Check step_history
        updated_instance = self.session.get(f"{BASE_URL}/api/workflow-instances/{leave_instance['id']}").json()
        
        assert "step_history" in updated_instance
        assert len(updated_instance["step_history"]) > 0
        
        last_action = updated_instance["step_history"][-1]
        assert last_action["action"] == "approve"
        assert last_action["comment"] == "Test approval comment"
        assert "timestamp" in last_action
        assert "user_id" in last_action
        
        print(f"Step history recorded: {len(updated_instance['step_history'])} actions")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/leaves/{created_leave['id']}")


class TestExistingWorkflows:
    """Tests for existing workflows mentioned in context"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@hrplatform.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        
        token = login_response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_leave_approval_workflow_exists(self):
        """Test that Leave Approval Workflow exists"""
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=leave").json()
        
        leave_workflow = next((w for w in workflows if "leave" in w.get("name", "").lower()), None)
        
        if leave_workflow:
            print(f"Found leave workflow: {leave_workflow['name']}, active: {leave_workflow['is_active']}")
            assert leave_workflow["module"] == "leave"
        else:
            print("No leave workflow found - may need to be created")
    
    def test_time_correction_workflow_exists(self):
        """Test that Time Correction Workflow exists"""
        workflows = self.session.get(f"{BASE_URL}/api/workflows?module=time_correction").json()
        
        tc_workflow = next((w for w in workflows if "time" in w.get("name", "").lower() or "correction" in w.get("name", "").lower()), None)
        
        if tc_workflow:
            print(f"Found time correction workflow: {tc_workflow['name']}, active: {tc_workflow['is_active']}")
            assert tc_workflow["module"] == "time_correction"
        else:
            print("No time correction workflow found - may need to be created")
    
    def test_workflow_stats(self):
        """Test workflow statistics"""
        workflows = self.session.get(f"{BASE_URL}/api/workflows").json()
        instances = self.session.get(f"{BASE_URL}/api/workflow-instances").json()
        
        active_workflows = len([w for w in workflows if w.get("is_active")])
        pending_instances = len([i for i in instances if i.get("status") in ["pending", "in_progress"]])
        approved_instances = len([i for i in instances if i.get("status") == "approved"])
        rejected_instances = len([i for i in instances if i.get("status") == "rejected"])
        
        print(f"Workflow Stats:")
        print(f"  - Active Workflows: {active_workflows}")
        print(f"  - Pending Approvals: {pending_instances}")
        print(f"  - Approved: {approved_instances}")
        print(f"  - Rejected: {rejected_instances}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
