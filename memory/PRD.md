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

## Data Seeding Fix (Jan 15, 2026)
**Issue:** Employee records had mismatched `user_id` values that didn't match the `id` in the `users` collection, and name fields were often empty.

**Root Cause:** No proper data seeding script existed. The database was empty or had inconsistent data.

**Solution:** Created `/app/backend/seed_data.py` that:
- Creates users with unique `id` fields
- Creates employees with `user_id` = corresponding `user.id`
- Populates all name fields (first_name, last_name, full_name) consistently
- Seeds organizational hierarchy (1 corporation, 1 branch, 5 departments, 4 divisions)
- Creates leave balances for all employees
- Creates default roles

**Test Data Created:**
- 10 users (1 admin + 9 employees)
- 9 employees with complete profiles
- Credentials: admin@hrplatform.com / admin123, sarah.johnson@lojyn.com / sarah123

**Verification:** 27/27 backend tests passed, all frontend pages loading correctly

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

### Onboarding Module (COMPLETED - Jan 15, 2026)
**Onboarding Templates:**
- Create reusable templates with customizable tasks
- Task categories: Documentation, IT Setup, Training, Compliance, Team Introduction, Administrative, Other
- Set task due days, required flag, and resource URLs
- Welcome message for new employees
- Department-specific templates

**Onboarding Instances:**
- Assign onboarding to employees using templates
- Tasks copied from template with completion tracking
- Assign manager, buddy, and HR contact
- Track progress with percentage completion
- Auto-complete when all tasks done

**Admin Features:**
- Stats dashboard (In Progress, Completed, Overdue Tasks, Avg Completion)
- Active/Completed/Templates tabs
- View individual onboarding progress
- Update task status from admin view
- Delete onboardings and templates

**Employee Features:**
- "My Onboarding" view with welcome banner
- Progress bar and quick stats (Completed, Remaining, Overdue, Days Left)
- Tasks grouped by category with completion checkboxes
- Task completion dialog with optional notes
- Overdue task warnings
- Onboarding team contacts display
- Feedback submission after completion (star rating + comments)

### Offboarding Module (COMPLETED - Jan 15, 2026)
**Offboarding Templates:**
- Create reusable templates with customizable tasks
- Task categories: Asset Return, Access Revocation, Knowledge Transfer, Documentation, Exit Interview, Clearance, Administrative, Other
- Set task due days, required flag, and assigned department (Employee, Manager, HR, IT)
- Exit message for departing employees
- Separation reason-specific templates (Resignation, Termination, Retirement, Contract End, Layoff)

**Offboarding Instances:**
- Start offboarding for employees with template selection
- Track separation reason and last working date
- Tasks copied from template with completion tracking
- Assign manager and HR contact
- Track progress with percentage completion
- Auto-complete when all tasks done

**Admin Features:**
- Stats dashboard (In Progress, Completed, Overdue Tasks, Avg Completion)
- Active/Completed/Templates tabs
- View individual offboarding progress
- Clearance tracking (HR, IT, Finance, Manager, Admin)
- Exit interview scheduling and notes
- Update task and clearance status

**Employee Features:**
- "My Offboarding" view with exit message
- Progress bar and quick stats (Completed, Remaining, Clearances, Days Left)
- Clearance status display (5 departments)
- Tasks grouped by category with completion checkboxes
- Offboarding contacts display
- Feedback submission after completion

### Expense Claims Module (COMPLETED - Jan 15, 2026)
**Expense Claims:**
- Create expense claims with title, amount, category, date, merchant
- Categories: Travel, Meals, Transportation, Accommodation, Equipment, Office, Communication, Training, Other
- Payment methods: Personal, Corporate Card, Reimbursement
- Receipt URL attachment support
- Workflow integration for approval chain

**Admin Features:**
- Stats dashboard (Total Claims, Pending Review, Approved Amount, Total Amount)
- All/Pending/Approved tabs with filtering
- Approve/Reject expense claims with notes
- Mark expenses as Paid for reimbursement tracking
- Export expenses to CSV
- Category filter dropdown

**Employee Features:**
- "My Expenses" view with quick stats
- Submit expense claims form
- View expense status and rejection reasons
- Edit/Delete pending expenses

### Training Requests Module (COMPLETED - Jan 15, 2026)
**Training Requests:**
- Create training requests with title, type, category, provider, cost, dates
- Training types: Course, Certification, Workshop, Conference, Online, Seminar, Bootcamp
- Categories: Professional, Technical, Leadership, Compliance, Soft Skills, Other
- Location options: Online, On-site, Off-site, Hybrid
- Learning objectives and expected outcomes
- Workflow integration for approval chain

**Admin Features:**
- Stats dashboard (Total Requests, Pending Review, In Progress, Total Budget)
- All/Pending/Active tabs with filtering
- Approve/Reject training requests
- Start training (mark as in progress)
- Complete training with certificate URL and feedback
- Export requests to CSV
- Type filter dropdown

**Employee Features:**
- "My Training" view with quick stats
- Submit training request form
- Start approved training
- Complete training with certificate and rating
- View request status and rejection reasons

### Training Course Management (COMPLETED - Jan 15, 2026)
**Training Courses:**
- Create courses with video URL, document URL, external links
- Content types: Video, Document, External Link, Mixed
- Difficulty levels: Beginner, Intermediate, Advanced
- Learning objectives, prerequisites, tags
- Mandatory training flag
- Publish/unpublish courses
- Thumbnail support
- Duration tracking
- View and completion statistics
- Average rating tracking

**Admin - Types & Categories Management:**
- Create, edit, delete training types (Course, Certification, Workshop, Webinar, Tutorial)
- Create, edit, delete training categories (Professional Development, Technical Skills, Leadership, Compliance, Soft Skills, Onboarding)
- Custom colors for types and categories
- Add default types/categories with one click

**Admin - Course Assignment:**
- Assign courses to individual or multiple employees
- Set due dates for assignments
- Track assignment status (Assigned, In Progress, Completed, Overdue)
- View progress percentage
- Remove assignments

**Admin - Employee Training Requests (NEW - Jan 15, 2026):**
- View all employee training requests in "Requests" tab
- Badge counter showing pending requests needing review
- Approve or reject training requests
- Rejection reason input for rejected requests
- View request details: employee name, type, category, provider, cost, dates

**Employee - Learning Portal:**
- View assigned training courses in "Assigned Courses" tab
- Quick stats (Assigned, In Progress, Completed, Requests Pending, Approved)
- Start assigned training
- Access video, document, and external links
- Track progress
- Complete training with rating and feedback
- Overdue task highlighting

**Employee - Training Requests (NEW - Jan 15, 2026):**
- "My Requests" tab to view and manage training requests
- Submit new training request form with all details
- View request status and rejection reasons
- Edit/Delete pending requests

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
- **/api/onboarding-templates/** - Onboarding templates CRUD
- **/api/onboardings/** - Onboarding instances CRUD
- **/api/onboardings/my** - Employee's own onboarding
- **/api/onboardings/stats** - Onboarding statistics
- **/api/onboardings/{id}/tasks/{index}** - Update task completion
- **/api/onboardings/{id}/feedback** - Submit feedback
- **/api/offboarding-templates/** - Offboarding templates CRUD
- **/api/offboardings/** - Offboarding instances CRUD
- **/api/offboardings/my** - Employee's own offboarding
- **/api/offboardings/stats** - Offboarding statistics
- **/api/offboardings/{id}/tasks/{index}** - Update task completion
- **/api/offboardings/{id}/clearance** - Update clearance status
- **/api/offboardings/{id}/exit-interview** - Update exit interview
- **/api/offboardings/{id}/feedback** - Submit feedback

## Credentials
- Admin: `admin@hrplatform.com` / `admin123`
- Employee: `sarah.johnson@lojyn.com` / `sarah123`

## Completed Tasks (Jan 15, 2026)
1. **Data Seeding Fix (P1)** - Resolved root cause of employee data inconsistency. Created proper seed script.
2. **Payroll Module (P0)** - Initial implementation complete. UI functional, needs more testing.
3. **Organization Chart Module** - Implemented with tree, grid, and list views.
4. **Appraisals Module** - Full implementation with analytics and self-assessment workflow.
5. **Asset Management Module** - Full CRUD for assets, categories, assignments, and requests.
6. **Communications Module** - Announcements, Memos (with acknowledgment), and Surveys (with results aggregation).
7. **Complaints Management Module** - Submit/track complaints (anonymous supported), assign, investigate, resolve workflow.
8. **Disciplinary Actions Module** - Full implementation with admin/employee views, action types, notes, and appeals workflow.
9. **Travel Module** - Full travel request management with:
   - Employee: Submit travel requests, track status, start/complete trips with expense reporting
   - Admin: Approve/reject requests, view stats, manage all requests
   - Features: Trip types (domestic/international), purpose categories, transportation, accommodation, budget tracking
10. **Recognition & Awards Module (NEW)** - Full peer recognition and awards system with:
   - Recognition Wall: Public feed of recognitions with likes and comments
   - Leaderboard: Rankings by points (all time, monthly, quarterly, yearly)
   - 8 pre-seeded categories (Star Performer, Team Player, Innovation, etc.)
   - Points system for gamification
   - Nominations for formal awards (e.g., Employee of the Month) requiring admin approval
   - Admin: Manage categories, review nominations, view all recognitions

## Upcoming Tasks (P1)
1. **Test & Finalize Payroll Module** - Create salary structure, run payroll, verify payslips
2. **Test & Finalize Document Module Refactor** - Test new assignment and file upload features
3. **Comprehensive Testing of Expense Claims Module** - End-to-end testing needed
4. **Comprehensive Testing of Training Module** - E2E testing with course management and requests
5. **Comprehensive Testing of New Modules** - Test Disciplinary Actions, Travel modules

## Future/Backlog (P2+)
- Comprehensive Reporting Dashboard
- Bulk employee import via CSV
- Budget allocation per department/division
- Employment history timeline view
- Email notifications for workflows and recruitment
- Refactor large components (EmployeesNew.js, Leaves.js, Documents.js, Appraisals.js, Training.js)

## Test Reports
- `/app/test_reports/iteration_3.json` - Workflow system tests
- `/app/test_reports/iteration_4.json` - Recruitment module tests (100% backend, 95% frontend)
- `/app/test_reports/iteration_5.json` - Onboarding module tests (100% backend, 100% frontend)
- `/app/test_reports/iteration_6.json` - Offboarding module tests (100% backend, 100% frontend)
- `/app/test_reports/iteration_7.json` - All modules smoke tests
- `/app/test_reports/iteration_8.json` - Data seeding fix verification (100% backend, 100% frontend)
- `/app/tests/test_recruitment.py` - Recruitment pytest file (26 tests)
- `/app/tests/test_onboarding.py` - Onboarding pytest file (23 tests)
- `/app/tests/test_offboarding.py` - Offboarding pytest file (26 tests)
- `/app/tests/test_hr_platform_iteration8.py` - Data integrity tests (27 tests)

## Key Files
- `backend/server.py` - All API endpoints
- `backend/seed_data.py` - Data seeding script (NEW - fixes employee/user linking)
- `frontend/src/pages/Payroll.js` - Payroll UI
- `frontend/src/pages/OrgChart.js` - Organization Chart UI
- `frontend/src/pages/Appraisals.js` - Appraisals UI
- `frontend/src/pages/Assets.js` - Asset Management UI
- `frontend/src/pages/Communications.js` - Announcements, Memos, Surveys UI
- `frontend/src/pages/Complaints.js` - Complaints Management UI
- `frontend/src/pages/Disciplinary.js` - Disciplinary Actions UI
- `frontend/src/pages/Travel.js` - Travel Management UI
- `frontend/src/pages/Recognition.js` - Recognition & Awards UI (NEW)
- `frontend/src/pages/Recruitment.js` - Recruitment UI
- `frontend/src/pages/Onboarding.js` - Onboarding UI
- `frontend/src/pages/Offboarding.js` - Offboarding UI
- `frontend/src/pages/Expenses.js` - Expense Claims UI
- `frontend/src/pages/Training.js` - Training Requests UI
- `frontend/src/pages/Documents.js` - Documents UI
- `frontend/src/pages/Workflows.js` - Workflow management
- `frontend/src/components/Layout.js` - Responsive layout
