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

#### 4. HR Analytics Dashboard ✅ **NEW**
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

---

## Key API Endpoints

### Analytics
- `GET /api/analytics/overview` - Key metrics and charts
- `GET /api/analytics/turnover` - Turnover analysis
- `GET /api/analytics/hiring` - Hiring funnel and trends
- `GET /api/analytics/salary` - Salary benchmarking
- `GET /api/analytics/forecast` - Headcount forecasting

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
- `frontend/src/hooks/usePushNotifications.js` - Push notification hook

### Modified Files
- `backend/server.py` - Analytics endpoints, push notification endpoints
- `backend/.env` - VAPID keys
- `frontend/src/App.js` - Analytics route
- `frontend/src/components/Layout.js` - Analytics nav item, Activity import
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
