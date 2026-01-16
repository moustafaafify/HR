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
- `frontend/src/hooks/usePushNotifications.js` - Push notification hook

### Modified Files
- `backend/server.py` - Analytics endpoints, push notification endpoints, workforce planning endpoints
- `backend/.env` - VAPID keys
- `frontend/src/App.js` - Analytics route, Workforce Planning route
- `frontend/src/components/Layout.js` - Analytics nav item, Workforce Planning nav item
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
