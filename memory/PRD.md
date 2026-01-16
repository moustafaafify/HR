# HR Platform - Product Requirements Document

## Original Problem Statement
Create a comprehensive, full-stack HR platform that is multi-language, multi-currency, and supports a multi-corporate structure.

## Tech Stack
- **Frontend**: React with Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: Tailwind CSS with CSS Variables for theming

---

## What's Been Implemented

### Session: January 16, 2026

#### Completed Features

1. **Translation Management Removal (DONE)**
   - Removed the Translation Management section from Settings.js

2. **Theme Color Customization (DONE)**
   - Primary/Accent Color pickers in Settings
   - Dark Mode toggle
   - Live preview

3. **User Dark Mode Toggle (DONE)**
   - Sun/Moon icon in top header for all users
   - Stored in localStorage

4. **PWA Push Notifications (DONE)** ✨ NEW
   - **Backend:**
     - VAPID key generation and storage
     - Push subscription endpoints: `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/status`
     - Test notification endpoint: `/api/push/test`
     - Helper functions: `send_push_notification()`, `broadcast_push_notification()`
     - Automatic expired subscription cleanup
   - **Frontend:**
     - `usePushNotifications` hook for subscription management
     - Push Notifications section in Settings with:
       - Subscribe/Unsubscribe button
       - Test notification button
       - 12 configurable notification triggers (admin-controlled)
     - Service worker handles push events and notification clicks
   - **Configurable Triggers:**
     - Leave requests (new, approved, rejected)
     - Tickets (assigned, updated)
     - Expenses (approved, rejected)
     - Announcements
     - Payroll processed
     - Training reminders
     - Birthday reminders
     - Performance reviews due

---

## Push Notification Triggers (Admin Configurable)

| Trigger Key | Description |
|-------------|-------------|
| `leave_request_new` | New leave requests submitted |
| `leave_request_approved` | Leave requests approved |
| `leave_request_rejected` | Leave requests rejected |
| `ticket_assigned` | Tickets assigned to user |
| `ticket_updated` | Ticket updates |
| `expense_approved` | Expenses approved |
| `expense_rejected` | Expenses rejected |
| `announcement_new` | Company announcements |
| `payroll_processed` | Payroll processing complete |
| `training_reminder` | Training session reminders |
| `birthday_reminder` | Team birthday notifications |
| `performance_review_due` | Performance review deadlines |

---

## Key API Endpoints (New)

### Push Notifications
- `GET /api/push/vapid-public-key` - Get VAPID public key
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications
- `GET /api/push/status` - Check subscription status
- `POST /api/push/test` - Send test notification

---

## Database Schema (New)

### push_subscriptions Collection
```json
{
  "id": "uuid",
  "user_id": "string",
  "endpoint": "string",
  "p256dh": "string",
  "auth": "string",
  "is_active": true,
  "created_at": "ISO datetime"
}
```

---

## Environment Variables (New)
```
VAPID_PUBLIC_KEY="BJylUq5TSUWVeOevAI0VP2u1fHrQaaNdT2Xcn2EyCc4evNpMb9BdbLgUUESYN-DeC_sTqgL3C-VVSbc7F4q2heQ"
VAPID_PRIVATE_KEY="MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0waw..."
VAPID_SUBJECT="mailto:admin@hrplatform.com"
```

---

## Prioritized Backlog

### P0 - Critical
- [ ] Comprehensive E2E Testing
- [ ] Integrate push notifications into actual leave/expense/ticket workflows

### P1 - High Priority
- [ ] Real Device PWA Testing
- [ ] Scheduled Report Delivery
- [ ] Audit Trail for Security Events

### P2 - Medium Priority
- [ ] Refactor Large Components
- [ ] PWA Offline Mode
- [ ] Full Dark Mode Support for all pages

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123

---

## Files Modified This Session
- `backend/server.py` - Added push notification endpoints and helper functions
- `backend/.env` - Added VAPID keys
- `frontend/src/pages/Settings.js` - Added Push Notifications section
- `frontend/src/hooks/usePushNotifications.js` - NEW hook for push management
- `frontend/src/components/Layout.js` - Dark mode toggle in header
- `frontend/public/service-worker.js` - Already had push handlers
