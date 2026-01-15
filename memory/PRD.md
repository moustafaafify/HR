# HR Platform - Product Requirements Document

## Original Problem Statement
Build a full-stack HR platform with:
- Multi-language support (bilingual, English default)
- Multi-currency support (admin configurable)
- Multi-corporate support (Corporation -> Branch -> Department -> Division -> Employees)
- Comprehensive Employee Profiles with 6 categories of information
- Admin controls for password reset and portal access
- Role-based access control with Roles & Permissions

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

5. **Role Assignment Feature** (COMPLETED - Jan 15, 2026)
   - `role_id` field added to Employee model
   - Role dropdown in Employment tab of employee form
   - Role column in employee list table
   - 4 default roles: Super Administrator, Corporate Administrator, Branch Manager, Employee

6. **Settings**
   - Multi-language configuration
   - Multi-currency configuration

### Data Model Fixes (COMPLETED - Jan 15, 2026)
- Made `personal_email` field optional in Employee model to fix data consistency issues

### Leave Balance Fix (COMPLETED - Jan 15, 2026)
- **Bug:** Admin could not save leave balance changes in employee edit form
- **Root Cause:** 
  1. Form fields for new leave types (annual_leave, sick_leave, personal_leave, bereavement_leave, maternity_leave, paternity_leave) were in JSX but not connected to form state
  2. `openDialog` function was not fetching leave balance data when editing employee
  3. `handleSubmit` was not updating the leave_balances collection
- **Fix Applied:**
  1. Updated `formData` initial state with all new leave fields
  2. Updated `resetForm` function with new leave fields  
  3. Modified `openDialog` to fetch leave balance from API when editing
  4. Modified `handleSubmit` to update leave_balances collection after saving employee
  5. Added POST endpoint `/api/leave-balances` for creating new leave balances

### ResizeObserver Error Fix (COMPLETED - Jan 15, 2026)
- **Bug:** Error screen "ResizeObserver loop completed" appeared when selecting employees in dropdowns
- **Fix:** Added ResizeObserver patch in `public/index.html` and `src/index.js` to suppress benign Radix UI errors

### Performance Reviews Enhancement (COMPLETED - Jan 15, 2026)
- **Expanded PerformanceReview Model** with:
  - Multiple review types (annual, quarterly, probation, project, 360)
  - Status workflow (draft → pending_self_assessment → pending_review → completed)
  - Category ratings (communication, teamwork, technical_skills, problem_solving, leadership, punctuality)
  - Self-assessment fields (self_assessment, self_rating, achievements, challenges)
  - Manager assessment fields (strengths, areas_for_improvement, feedback, recommendations)
  - Goals tracking
- **New Backend Endpoints:**
  - `PUT /api/reviews/{id}` - Update review
  - `DELETE /api/reviews/{id}` - Delete review  
  - `POST /api/reviews/{id}/submit-self-assessment` - Employee self-assessment
  - `POST /api/reviews/{id}/complete` - Manager completes review
  - `GET /api/reviews/stats/summary` - Dashboard statistics
- **Enhanced Frontend:**
  - Admin view: Stats dashboard, filters, create/edit/delete reviews, complete review dialog
  - Employee view: See own reviews, submit self-assessment, view completed reviews
  - Visual rating display with star icons
  - Alert banner for pending self-assessments

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, React Router
- **Backend:** FastAPI, Pydantic, JWT
- **Database:** MongoDB

## Key Files
- `backend/server.py` - All API endpoints and models
- `frontend/src/pages/EmployeesNew.js` - Employee management UI
- `frontend/src/components/Layout.js` - Sidebar navigation
- `frontend/src/pages/RolesPermissions.js` - Roles management

## Credentials
- Email: `admin@hrplatform.com`
- Password: `admin123`

## Upcoming Tasks (P1)
1. **Enhance Roles & Permissions** - Build full CRUD for roles with granular permission enforcement

## Future/Backlog (P2+)
- Budget allocation per department/division
- Reporting and analytics features
- Bulk employee import via CSV
- Employment history timeline view
- Refactor `EmployeesNew.js` into smaller components

## Test Reports
- `/app/test_reports/iteration_2.json` - Role assignment feature tests (90% backend, 100% frontend)
