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
- Recruitment module for job postings and candidate management

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
   - Comprehensive 6-tab employee form
   - Role assignment feature
   - Reporting manager assignment

4. **Admin Controls**
   - Password reset for employees
   - Portal access enable/disable toggle

5. **Settings**
   - Multi-language configuration
   - Multi-currency configuration
   - Roles & Permissions (accessible via Settings page)

### Leave Module (COMPLETED)
- Leave request creation with multiple leave types
- Leave balance management per employee
- Leave approval/rejection flow
- CSV export for leave requests and balances
- Workflow integration for approvals

### Attendance Module (COMPLETED)
- Clock in/out functionality
- Attendance records management
- CSV export for attendance records
- Time Correction Requests with workflow integration

### Performance Reviews Module (COMPLETED)
- Multiple review types (annual, quarterly, probation, project, 360)
- Category ratings
- Self-assessment by employees
- Manager assessment and completion flow

### Workflow System (COMPLETED - Jan 15, 2026)
- Workflow templates for approval processes
- Automatic workflow triggering on leave/time correction requests
- Multi-step approval flows
- Workflow instance management with approve/reject actions
- Modules supported: leave, time_correction, expense, training, document

### Recruitment Module (COMPLETED - Jan 15, 2026)
**Job Postings:**
- Full CRUD operations with enhanced fields:
  - Title, Department, Location, Job Type
  - Experience Level (entry, mid, senior, lead, executive)
  - Responsibilities, Requirements, Benefits
  - Salary Range with currency and visibility toggle
  - Hiring Manager assignment
  - Positions count
  - Internal job flag
  - Expiry date
  - Status (draft, open, on_hold, closed)

**Applications:**
- Candidate tracking with rich profile:
  - Contact info, LinkedIn, Portfolio URLs
  - Current company and title
  - Experience years, Expected salary, Notice period
  - Source tracking (direct, referral, linkedin, indeed, other)
  - Star rating (1-5)
  - Interview scheduling integration

**Interviews:**
- Schedule interviews with type (phone, video, onsite, panel, technical)
- Date, time, duration, location/meeting link
- Multiple interviewers support
- Feedback, rating, and recommendation tracking

**Employee Features:**
- Job Openings board (card layout)
- Refer candidates for open positions
- View My Referrals status

**Admin Features:**
- Recruitment stats dashboard (Open Positions, Candidates, In Interview, Hired)
- Candidate Pipeline overview
- Applications table with filtering by job and status
- Update application status through pipeline
- Rate candidates with star rating
- Schedule interviews from application view
- Export applications to CSV
- Referrals tracking

### Responsive Design (COMPLETED)
- Mobile header with hamburger menu
- Slide-out sidebar on mobile/tablet
- All pages responsive across breakpoints

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, React Router
- **Backend:** FastAPI, Pydantic, JWT
- **Database:** MongoDB

## Key API Endpoints
- **/api/jobs/** - Jobs CRUD
- **/api/jobs/open** - Open jobs for job board
- **/api/jobs/{id}/stats** - Job statistics
- **/api/applications/** - Applications CRUD
- **/api/applications/export** - Export to CSV
- **/api/applications/my-referrals** - Employee referrals
- **/api/interviews/** - Interviews CRUD
- **/api/recruitment/stats** - Overall recruitment stats
- **/api/workflows/** - Workflow templates
- **/api/workflow-instances/** - Active approval requests

## Credentials
- Admin: `admin@hrplatform.com` / `admin123`
- Employee: `sarah.johnson@lojyn.com` / `sarah123`

## Upcoming Tasks (P1)
1. **Implement New Workflow-driven Modules** - Expense Claims, Training Requests, Document Approvals, Onboarding/Offboarding

## Future/Backlog (P2+)
- Budget allocation per department/division
- Reporting and analytics dashboard
- Bulk employee import via CSV
- Employment history timeline view
- Email notifications for workflows and recruitment
- Refactor large components

## Test Reports
- `/app/test_reports/iteration_3.json` - Workflow system tests
- `/app/test_reports/iteration_4.json` - Recruitment module tests (100% backend, 95% frontend)
- `/app/tests/test_recruitment.py` - Recruitment pytest file (26 tests)

## Key Files
- `backend/server.py` - All API endpoints
- `frontend/src/pages/Recruitment.js` - Recruitment UI
- `frontend/src/pages/Workflows.js` - Workflow management
- `frontend/src/components/Layout.js` - Responsive layout
