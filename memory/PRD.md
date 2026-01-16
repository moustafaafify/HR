# HR Platform - Product Requirements Document

## Original Problem Statement
Create a comprehensive, full-stack HR platform that is multi-language, multi-currency, and supports a multi-corporate structure with 35+ HR modules.

## Tech Stack
- **Frontend**: React with Shadcn/UI, Recharts for visualizations
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: Tailwind CSS with CSS Variables

---

## What's Been Implemented

### Session: January 16, 2026

#### 1. Translation Management Removal ✅
- Removed from Settings.js (reduced ~1000 lines)

#### 2. Theme Color Customization ✅
- Primary/Accent color pickers
- Dark mode toggle (global + per-user)
- CSS variables system

#### 3. PWA Push Notifications ✅
- VAPID key generation
- Subscribe/unsubscribe endpoints
- 12 admin-configurable triggers
- Service worker integration

#### 4. HR Analytics Dashboard ✅
A comprehensive analytics module with 5 tabs:

**Overview Tab:**
- Total Headcount, New Hires, Terminations, Turnover Rate
- Open Positions, Pending Candidates, Average Salary
- Headcount Trend chart (12 months)
- Department Distribution pie chart
- Salary by Department bar chart

**Turnover Tab:**
- Monthly Terminations bar chart
- Turnover by Tenure pie chart
- Turnover by Department breakdown

**Hiring Tab:**
- Hiring Funnel (Applied → Screening → Interview → Offer → Hired)
- Monthly Hires trend
- Hires by Source
- Average Time to Hire

**Salary Tab:**
- Total Payroll, Average, Median, Min, Max
- Salary Distribution histogram
- Salary by Department
- Top Salaries by Position

**Forecast Tab:**
- Current vs Projected Headcount
- 6-month forecast based on historical trends
- Projected hires/terminations per month
- Year-end headcount projection

#### 5. Workforce Planning Module ✅ **NEW**
A comprehensive workforce planning module for Admin and Employee views:

**Admin Features:**
- **Dashboard Overview**: Total employees, active plans, critical skill gaps, avg utilization, allocations
- **Headcount Plans Tab**: Create/edit/delete headcount plans by department, fiscal year, quarter
  - Track current headcount, planned hires, departures, target headcount
  - Budget allocation tracking
- **Skills Gap Tab**: Run skills gap analysis, view critical gaps with priority levels
  - Recommended actions (hire, training, monitor)
- **Allocations Tab**: Assign employees to projects with allocation percentages
  - Track role, start/end dates, billable status
- **Scenarios Tab**: Create what-if scenarios (growth, reduction, restructure, merger)
  - Track productivity/morale impact, implementation timeline

**Employee Features:**
- **My Workforce Profile**: View personal utilization percentage
- **My Allocations**: See active project allocations with role and percentage
- **My Skills**: View skills list
- **My Preferences**: Set interested roles, open to relocation/travel
- **Set Availability**: Update daily availability and status

**Dark Mode Support:**
- All dialogs properly styled for light and dark modes
- Form labels, inputs, and buttons with proper contrast

#### 6. Compliance & Legal Module ✅ **NEW**
A comprehensive compliance and legal management module:

**Admin Features:**
- **Dashboard Overview**: Key metrics (policies, trainings, incidents, documents, certifications)
- **Policies Tab**: Create/edit/delete company policies
  - Version control, categories (general, HR, safety, data privacy, security, financial, ethics)
  - Acknowledgement tracking (once, annual, quarterly)
- **Trainings Tab**: Create compliance training courses
  - Assign to employees, track completion progress
  - Set passing scores and certification validity
- **Documents Tab**: Manage legal documents (contracts, NDAs, agreements)
  - Track employee and company signatures
  - Set effective/expiry dates
- **Incidents Tab**: View and manage compliance incidents
  - Severity levels (low, medium, high, critical)
  - Status tracking (reported, under investigation, resolved, closed)
- **Certifications Tab**: Track employee certifications
  - Expiry tracking and renewal reminders

**Employee Features:**
- **My Compliance Dashboard**: View pending policies, trainings, signatures
- **Policy Acknowledgement**: View and acknowledge company policies
- **My Trainings**: Track assigned trainings with progress
- **Document Signing**: Sign pending legal documents
- **My Certifications**: View active certifications
- **Report Incident**: Submit compliance incidents (confidential option)

**Dark Mode Support:**
- All dialogs and forms properly styled for light and dark modes

#### 7. Visitor Management Module ✅ **NEW**
A comprehensive visitor management system for tracking guests:

**Admin Features:**
- **Dashboard Overview**: 5 summary cards (Today's Visitors, Checked In, Checked Out, Expected, On Site)
- **Tabs**: Today, Upcoming, All Visitors, On Site, History
- **Pre-register Visitor**: Full form with name, contact, company, visit type, host, date/time, location
- **Walk-in Registration**: Quick registration for unscheduled visitors
- **Check-in Process**: 
  - ID verification (Driver's License, Passport, National ID, Employee ID)
  - ID number recording
  - Item tracking (Laptop, Camera, Other items)
  - NDA signing checkbox
- **Check-out**: Record visitor departure time
- **Badge Printing**: 
  - Generate unique badge numbers (VYYYYMMDD-XXX format)
  - Badge preview dialog with visitor info, company, host, QR code placeholder
  - Print badge functionality
- **Visitor Details Dialog**: Complete visitor information view with actions
- **History Tab**: Table view with date filters for visitor tracking

**Employee Features:**
- **My Visitors Dashboard**: 4 summary cards (Today's, Checked In, Awaiting, Upcoming)
- **Tabs**: Today, Upcoming, All Visitors (filtered to user's visitors only)
- **Pre-register Visitor**: Register visitors for themselves
- **View Own Visitors**: See only visitors they registered or are hosting
- **Visitor Details**: View full information of their visitors

---

## Key API Endpoints

### Analytics
- `GET /api/analytics/overview` - Key metrics and charts
- `GET /api/analytics/turnover` - Turnover analysis
- `GET /api/analytics/hiring` - Hiring funnel and trends
- `GET /api/analytics/salary` - Salary benchmarking
- `GET /api/analytics/forecast` - Headcount forecasting

### Workforce Planning
- `GET /api/workforce/dashboard` - Admin dashboard data
- `GET /api/workforce/my-overview` - Employee workforce overview
- `POST/GET/PUT/DELETE /api/workforce/headcount-plans` - Headcount plan CRUD
- `GET/POST /api/workforce/skills-gap` - Skills gap analysis
- `POST /api/workforce/skills-gap/analyze` - Run skills gap analysis
- `POST/GET/PUT/DELETE /api/workforce/allocations` - Resource allocation CRUD
- `GET /api/workforce/allocations/my` - Employee's own allocations
- `POST/GET/PUT/DELETE /api/workforce/capacity-plans` - Capacity planning CRUD
- `POST/GET/PUT/DELETE /api/workforce/scenarios` - Scenario modeling CRUD
- `GET/POST /api/workforce/availability/my` - Employee availability
- `PUT /api/workforce/availability/my/preferences` - Employee preferences

### Compliance & Legal
- `GET /api/compliance/dashboard` - Admin compliance dashboard
- `GET /api/compliance/my-overview` - Employee compliance overview
- `POST/GET/PUT/DELETE /api/compliance/policies` - Policy CRUD
- `POST /api/compliance/policies/{id}/acknowledge` - Acknowledge a policy
- `GET /api/compliance/my-acknowledgements` - Employee's acknowledgements
- `POST/GET/PUT/DELETE /api/compliance/trainings` - Training CRUD
- `POST /api/compliance/trainings/{id}/assign` - Assign training to employees
- `GET /api/compliance/my-trainings` - Employee's assigned trainings
- `PUT /api/compliance/my-trainings/{id}` - Update training progress
- `POST/GET/PUT/DELETE /api/compliance/documents` - Legal document CRUD
- `POST /api/compliance/documents/{id}/sign` - Sign a document
- `POST/GET/PUT /api/compliance/incidents` - Incident reporting
- `POST/GET/PUT/DELETE /api/compliance/certifications` - Certification CRUD

### Push Notifications
- `GET /api/push/vapid-public-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `GET /api/push/status`
- `POST /api/push/test`

---

## Files Created/Modified

### New Files
- `frontend/src/pages/Analytics.js` - HR Analytics Dashboard
- `frontend/src/pages/WorkforcePlanning.js` - Workforce Planning Module
- `frontend/src/pages/ComplianceLegal.js` - Compliance & Legal Module
- `frontend/src/hooks/usePushNotifications.js` - Push notification hook

### Modified Files
- `backend/server.py` - Analytics endpoints, push notification endpoints, workforce planning endpoints, compliance & legal endpoints
- `backend/.env` - VAPID keys
- `frontend/src/App.js` - Analytics route, Workforce Planning route, Compliance route
- `frontend/src/components/Layout.js` - Analytics nav item, Workforce Planning nav item, Compliance nav item, Shield icon import
- `frontend/src/pages/Settings.js` - Push notifications section
- `frontend/src/contexts/BrandingContext.js` - Theme management

---

## Prioritized Backlog

### P0 - Critical
- [ ] Full E2E Testing after all changes
- [ ] Integrate push notifications into leave/expense workflows

### P1 - High Priority
- [ ] Employee Sentiment Analysis (pulse surveys)
- [ ] AI Resume Screening
- [ ] Compliance Tracker

### P2 - Medium Priority
- [ ] Full Dark Mode for all pages
- [ ] PWA Offline Mode
- [ ] Recognition & Rewards module

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123
