# HR Platform - Product Requirements Document

## Original Problem Statement
Build a full-stack HR platform with:
- Multi-language support (bilingual, English default)
- Multi-currency support (admin configurable)
- Multi-corporate support (Corporation -> Branch -> Department -> Division -> Employees)
- Comprehensive Employee Profiles with 6 categories of information
- Admin controls for password reset and portal access
- Role-based access control with Roles & Permissions
- Workflow system for approval processes

## What's Been Implemented

### Core Features (COMPLETED)
1. **Authentication System**
   - User registration and login with JWT
   - Role-based user types (super_admin, corp_admin, branch_manager, employee)

2. **Organizational Hierarchy**
   - Corporations CRUD
   - Branches CRUD (under corporations)
   - Departments CRUD (under branches)
   - Divisions CRUD (under departments)

3. **Employee Management**
   - Comprehensive 6-tab employee form:
     - Personal & Contact Information
     - Employment & Job Details (with Role dropdown)
     - Payroll & Benefits
     - Time, Attendance & Leave
     - Talent & Compliance
     - Digital Files & Documents
   - Employee list with Role column
   - Reporting manager assignment

4. **Admin Controls**
   - Password reset for employees
   - Portal access enable/disable toggle

5. **Role Assignment Feature**
   - `role_id` field added to Employee model
   - Role dropdown in Employment tab of employee form
   - Role column in employee list table
   - 4 default roles: Super Administrator, Corporate Administrator, Branch Manager, Employee

6. **Settings**
   - Multi-language configuration
   - Multi-currency configuration

### Leave Module (COMPLETED)
- Leave request creation with multiple leave types
- Leave balance management per employee
- Leave approval/rejection flow
- CSV export for leave requests and balances

### Attendance Module (COMPLETED)
- Clock in/out functionality
- Attendance records management
- CSV export for attendance records
- **Time Correction Requests** - Employees can request corrections, admins approve/reject

### Performance Reviews Module (COMPLETED)
- Multiple review types (annual, quarterly, probation, project, 360)
- Category ratings (communication, teamwork, technical_skills, etc.)
- Self-assessment by employees
- Manager assessment and completion flow
- Review statistics dashboard

### Workflow System (COMPLETED - Jan 15, 2026)
**Backend:**
- `Workflow` model for defining approval templates (name, module, steps, is_active)
- `WorkflowInstance` model for tracking active approval requests
- `trigger_workflow_for_module()` helper function - automatically creates workflow instances
- Leave requests trigger workflow when active workflow exists → status changes to `pending_approval`
- Time correction requests trigger workflow when active workflow exists → status changes to `pending_approval`
- Workflow action endpoint (approve/reject) updates both instance and original request status
- Special handling for time corrections - approving updates the attendance record
- Instance details endpoint returns enriched data with reference document and requester info
- Collection mapping for modules: `leave`, `time_correction`, `expense`, `training`, `document`

**Frontend (Workflows.js):**
- **Workflow Templates Tab:**
  - Create, edit, delete workflow templates
  - Visual step builder with approver types (manager, department_head, role, specific_user)
  - Activate/deactivate workflows
  - Expandable workflow cards showing approval flow
- **Active Requests Tab:**
  - Filter by module (Leave, Time Corrections, etc.)
  - Filter by status (Pending, In Progress, Approved, Rejected)
  - Clear filters button
  - Table with workflow name, module, requester, current step, status, actions
  - Eye icon to view details
  - Approve (green) and Reject (red) action buttons
- **Instance Details Dialog:**
  - Shows status and submission date
  - Request details section (Leave Type, Duration, Reason for leaves; Date, Original/Requested times for time corrections)
  - Requester information
  - Approval history with timestamps
  - Approve/Reject action buttons
- **Rejection Dialog:**
  - Textarea for rejection reason
  - Required field before submission
- **Responsive Design:**
  - Stats cards 2-column on mobile, 4-column on desktop
  - Table columns hide on smaller screens (Module, Current Step)
  - Compact tabs on mobile

### Responsive Design Implementation (COMPLETED)
- Mobile header with hamburger menu toggle
- Slide-out sidebar on mobile/tablet
- All pages responsive (Dashboard, Attendance, Leaves, Performance, Workflows)
- Breakpoints: Mobile (default), Tablet (sm: 640px+), Desktop (lg: 1024px+)

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, React Router
- **Backend:** FastAPI, Pydantic, JWT
- **Database:** MongoDB

## Key Files
- `backend/server.py` - All API endpoints and models
- `frontend/src/pages/Workflows.js` - Workflow management UI
- `frontend/src/pages/EmployeesNew.js` - Employee management UI
- `frontend/src/pages/Leaves.js` - Leave management
- `frontend/src/pages/Attendance.js` - Attendance with time corrections
- `frontend/src/pages/Performance.js` - Performance reviews
- `frontend/src/components/Layout.js` - Responsive layout

## Credentials
- Admin Email: `admin@hrplatform.com`
- Admin Password: `admin123`
- Employee Email: `sarah.johnson@lojyn.com`
- Employee Password: `sarah123`

## Upcoming Tasks (P1)
1. **Implement New Workflow-driven Modules** - Build frontend/backend for Expense Claims, Training Requests, Document Approvals, Onboarding/Offboarding

## Future/Backlog (P2+)
- Budget allocation per department/division
- Reporting and analytics dashboard
- Bulk employee import via CSV
- Employment history timeline view
- Refactor large components (`EmployeesNew.js`, `Leaves.js`, `Attendance.js`)
- Enhance Roles & Permissions with granular permission enforcement

## Test Reports
- `/app/test_reports/iteration_3.json` - Workflow system tests (94.7% backend, 100% frontend)

## Known Issues
- ResizeObserver error workaround in `index.js` and `index.html` - may need revisiting if similar UI errors appear
- Large frontend components need refactoring for maintainability
