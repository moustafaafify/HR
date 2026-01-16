# HR Platform - Product Requirements Document

## Original Problem Statement
Create a comprehensive, full-stack HR platform that is multi-language, multi-currency, and supports a multi-corporate structure. The platform includes a wide range of HR modules (35+).

## User Personas
- **Super Admin**: Full access to all settings, branding, and configuration
- **Corp Admin**: Corporate-level administration
- **Branch Manager**: Branch-level management
- **Employee**: Self-service access to personal info, leaves, expenses

## Core Requirements
- Multi-language support (50+ languages)
- Multi-currency support (25+ currencies with exchange rates)
- Multi-corporate structure (corporations, branches, departments, divisions)
- Custom branding (app name, logo, favicon)
- PWA support with dynamic manifest

## Tech Stack
- **Frontend**: React with Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: Tailwind CSS

## Current Branding
- App Name: Lojyn HR
- Custom logo and favicon uploaded and working
- Dynamic PWA manifest served from `/api/manifest.json`

---

## What's Been Implemented

### Session: January 16, 2026

#### Completed Features
1. **Translation Management Removal (DONE)**
   - Removed the Translation Management section from Settings.js
   - Removed ~1000 lines of translation-related code
   - File reduced from 2325 lines to 1278 lines
   - Removed unused imports (Languages, FileText, useMemo)
   - Cleaned up translation-related state and functions

2. **Branding System (DONE - Previous Session)**
   - Dynamic app name, logo, and favicon via Settings
   - Login page uses branding from BrandingContext
   - Sidebar displays custom logo
   - PWA manifest dynamically generated

3. **Dynamic Currency Display (DONE - Previous Session)**
   - Replaced hardcoded $ symbols with formatCurrency utility
   - CurrencyContext provides global currency formatting

4. **Profile Picture Upload (DONE - Previous Session)**
   - Backend endpoint: `/api/employees/me/photo`
   - Frontend UI with camera icon overlay
   - upsert=True ensures employee record is created if not exists

---

## Prioritized Backlog

### P0 - Critical
- [ ] Comprehensive E2E Testing - Full regression test across all modules

### P1 - High Priority
- [ ] PWA Push Notifications - Backend service and frontend subscription
- [ ] Real Device PWA Testing - Guide for iOS/Android testing
- [ ] Scheduled Report Delivery - Automated report emails
- [ ] Audit Trail for Security Events - Log critical actions

### P2 - Medium Priority
- [ ] Refactor Large Components:
  - `Settings.js` - Currently 1278 lines (improved from 2325)
  - `MobileApps.js` - Large component
  - `EmployeesNew.js` - Needs breaking down
  - `Reports.js` - Complex reporting component
- [ ] PWA Offline Mode - Service worker data caching
- [ ] Theme Color Customization - Add to Branding section
- [ ] Export Translations as CSV/JSON
- [ ] Department Budget Allocation

---

## Key API Endpoints

### Settings & Branding
- `GET /api/settings` - Fetch global settings
- `PUT /api/settings` - Update settings (admin only)
- `POST /api/uploads/branding/{type}` - Upload logo/favicon
- `GET /api/manifest.json` - Dynamic PWA manifest

### Employee Profile
- `GET /api/employees/me` - Get current employee data
- `POST /api/employees/me/photo` - Upload profile picture
- `GET /api/uploads/employee_photos/{filename}` - Serve photos

---

## Database Schema

### Settings Collection
```json
{
  "id": "global_settings",
  "app_name": "Lojyn HR",
  "logo_url": "/api/uploads/branding/logo_xxx.png",
  "favicon_url": "/api/uploads/branding/logo_xxx.png",
  "language_1": "en",
  "language_2": "ar",
  "currency": "EGP",
  "enabled_currencies": ["EGP", "USD", ...],
  "exchange_rates": {...},
  "smtp": {...},
  "sms": {...}
}
```

### Employees Collection
```json
{
  "id": "...",
  "user_id": "...",
  "full_name": "...",
  "email": "...",
  "profile_picture": "/api/uploads/employee_photos/xxx.jpg",
  ...
}
```

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123

---

## Mocked Features
- SMTP/Email sending (test endpoint exists but doesn't send)
- SMS notifications
- PWA Push Notifications (not yet implemented)

---

## Known Issues
- Settings.js still large (1278 lines) - needs further refactoring
- No versioned database migration strategy
