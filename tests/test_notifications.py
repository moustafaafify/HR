"""
Test suite for Notifications feature in HR Platform
Tests all notification APIs for both admin and employee roles
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hrplatform.com"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_EMAIL = "sarah.johnson@lojyn.com"
EMPLOYEE_PASSWORD = "sarah123"


class TestNotificationsBackend:
    """Test notification API endpoints"""
    
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
        """Admin auth headers"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    @pytest.fixture(scope="class")
    def employee_headers(self, employee_token):
        """Employee auth headers"""
        return {"Authorization": f"Bearer {employee_token}"}
    
    # ============= GET /api/notifications =============
    
    def test_get_notifications_admin(self, admin_headers):
        """Test fetching notifications for admin user"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin has {len(data)} notifications")
    
    def test_get_notifications_employee(self, employee_headers):
        """Test fetching notifications for employee user"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=employee_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Employee has {len(data)} notifications")
    
    def test_get_notifications_with_limit(self, admin_headers):
        """Test fetching notifications with limit parameter"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
    
    def test_get_notifications_filter_unread(self, admin_headers):
        """Test fetching only unread notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"is_read": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned notifications should be unread
        for notif in data:
            assert notif.get("is_read") == False
    
    def test_get_notifications_filter_by_type(self, admin_headers):
        """Test fetching notifications filtered by type"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"type": "announcement"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned notifications should be of type announcement
        for notif in data:
            assert notif.get("type") == "announcement"
    
    # ============= GET /api/notifications/unread-count =============
    
    def test_get_unread_count_admin(self, admin_headers):
        """Test getting unread notification count for admin"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0
        print(f"Admin unread count: {data['count']}")
    
    def test_get_unread_count_employee(self, employee_headers):
        """Test getting unread notification count for employee"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=employee_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0
        print(f"Employee unread count: {data['count']}")
    
    # ============= GET /api/notifications/stats =============
    
    def test_get_notification_stats_admin(self, admin_headers):
        """Test getting notification statistics for admin"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/stats",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "unread" in data
        assert "read" in data
        assert "by_type" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["unread"], int)
        assert isinstance(data["read"], int)
        assert isinstance(data["by_type"], dict)
        print(f"Admin stats: total={data['total']}, unread={data['unread']}, read={data['read']}")
    
    def test_get_notification_stats_employee(self, employee_headers):
        """Test getting notification statistics for employee"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/stats",
            headers=employee_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "unread" in data
        assert "read" in data
        assert "by_type" in data
        print(f"Employee stats: total={data['total']}, unread={data['unread']}, read={data['read']}")
    
    # ============= POST /api/notifications/announcement (Admin only) =============
    
    def test_send_announcement_admin_to_all(self, admin_headers):
        """Test admin sending announcement to all users"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=admin_headers,
            json={
                "title": "TEST_Announcement to All",
                "message": "This is a test announcement sent to all users",
                "priority": "normal",
                "target": "all"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "count" in data
        assert data["count"] > 0
        print(f"Announcement sent to {data['count']} users")
    
    def test_send_announcement_admin_to_employees(self, admin_headers):
        """Test admin sending announcement to employees only"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=admin_headers,
            json={
                "title": "TEST_Announcement to Employees",
                "message": "This is a test announcement for employees only",
                "priority": "high",
                "target": "employees"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"Announcement sent to {data['count']} employees")
    
    def test_send_announcement_admin_to_admins(self, admin_headers):
        """Test admin sending announcement to admins only"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=admin_headers,
            json={
                "title": "TEST_Announcement to Admins",
                "message": "This is a test announcement for admins only",
                "priority": "urgent",
                "target": "admins"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"Announcement sent to {data['count']} admins")
    
    def test_send_announcement_employee_forbidden(self, employee_headers):
        """Test that employee cannot send announcements"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=employee_headers,
            json={
                "title": "TEST_Unauthorized Announcement",
                "message": "This should fail",
                "target": "all"
            }
        )
        assert response.status_code == 403
        print("Employee correctly forbidden from sending announcements")
    
    # ============= PUT /api/notifications/{id}/read =============
    
    def test_mark_notification_as_read(self, admin_headers):
        """Test marking a notification as read"""
        # First get notifications
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"is_read": False, "limit": 1}
        )
        assert response.status_code == 200
        notifications = response.json()
        
        if len(notifications) > 0:
            notif_id = notifications[0]["id"]
            
            # Mark as read
            response = requests.put(
                f"{BASE_URL}/api/notifications/{notif_id}/read",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"Marked notification {notif_id} as read")
        else:
            print("No unread notifications to test mark as read")
    
    # ============= PUT /api/notifications/mark-all-read =============
    
    def test_mark_all_as_read(self, employee_headers):
        """Test marking all notifications as read"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/mark-all-read",
            headers=employee_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Mark all read result: {data['message']}")
        
        # Verify unread count is now 0
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=employee_headers
        )
        assert response.status_code == 200
        assert response.json()["count"] == 0
    
    # ============= PUT /api/notifications/{id}/archive =============
    
    def test_archive_notification(self, admin_headers):
        """Test archiving a notification"""
        # First get notifications
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"limit": 1}
        )
        assert response.status_code == 200
        notifications = response.json()
        
        if len(notifications) > 0:
            notif_id = notifications[0]["id"]
            
            # Archive
            response = requests.put(
                f"{BASE_URL}/api/notifications/{notif_id}/archive",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"Archived notification {notif_id}")
            
            # Verify it's no longer in the list
            response = requests.get(
                f"{BASE_URL}/api/notifications",
                headers=admin_headers
            )
            notif_ids = [n["id"] for n in response.json()]
            assert notif_id not in notif_ids
        else:
            print("No notifications to test archive")
    
    # ============= DELETE /api/notifications/{id} =============
    
    def test_delete_notification(self, admin_headers):
        """Test deleting a notification"""
        # First create a notification to delete
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=admin_headers,
            json={
                "title": "TEST_To Be Deleted",
                "message": "This notification will be deleted",
                "target": "admins"
            }
        )
        assert response.status_code == 200
        
        # Get the notification
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"limit": 1}
        )
        notifications = response.json()
        
        if len(notifications) > 0:
            notif_id = notifications[0]["id"]
            
            # Delete
            response = requests.delete(
                f"{BASE_URL}/api/notifications/{notif_id}",
                headers=admin_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"Deleted notification {notif_id}")
    
    def test_delete_notification_not_found(self, admin_headers):
        """Test deleting a non-existent notification"""
        response = requests.delete(
            f"{BASE_URL}/api/notifications/non-existent-id",
            headers=admin_headers
        )
        assert response.status_code == 404
    
    # ============= Cleanup =============
    
    def test_cleanup_test_notifications(self, admin_headers):
        """Clean up test notifications"""
        # Get all notifications with TEST_ prefix
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=admin_headers,
            params={"limit": 100}
        )
        notifications = response.json()
        
        deleted_count = 0
        for notif in notifications:
            if notif.get("title", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/notifications/{notif['id']}",
                    headers=admin_headers
                )
                deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test notifications")


class TestNotificationIntegration:
    """Integration tests for notification feature"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def employee_token(self):
        """Get employee authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYEE_EMAIL,
            "password": EMPLOYEE_PASSWORD
        })
        return response.json()["token"]
    
    def test_announcement_received_by_employee(self, admin_token, employee_token):
        """Test that announcement sent by admin is received by employee"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        employee_headers = {"Authorization": f"Bearer {employee_token}"}
        
        # Get employee's initial notification count
        response = requests.get(
            f"{BASE_URL}/api/notifications/stats",
            headers=employee_headers
        )
        initial_total = response.json()["total"]
        
        # Admin sends announcement to all
        unique_title = f"TEST_Integration_{int(time.time())}"
        response = requests.post(
            f"{BASE_URL}/api/notifications/announcement",
            headers=admin_headers,
            json={
                "title": unique_title,
                "message": "Integration test announcement",
                "target": "all"
            }
        )
        assert response.status_code == 200
        
        # Check employee received it
        response = requests.get(
            f"{BASE_URL}/api/notifications/stats",
            headers=employee_headers
        )
        new_total = response.json()["total"]
        assert new_total > initial_total
        
        # Verify the notification content
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=employee_headers,
            params={"type": "announcement", "limit": 5}
        )
        notifications = response.json()
        found = any(n["title"] == unique_title for n in notifications)
        assert found, f"Employee did not receive announcement: {unique_title}"
        print(f"Employee successfully received announcement: {unique_title}")
        
        # Cleanup
        for notif in notifications:
            if notif["title"] == unique_title:
                requests.delete(
                    f"{BASE_URL}/api/notifications/{notif['id']}",
                    headers=admin_headers
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
