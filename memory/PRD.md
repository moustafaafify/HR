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
- Theme customization (primary/accent colors, dark mode)
- PWA support with dynamic manifest

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
   - Removed ~1000 lines of translation-related code
   - File reduced from 2325 lines to ~1400 lines

2. **Theme Color Customization (DONE)**
   - Added Primary Color picker in Settings
   - Added Accent Color picker in Settings
   - Added Dark Mode toggle
   - Live preview of theme in Settings page
   - CSS variables applied to:
     - Login page (background, cards, buttons, text)
     - Sidebar (title, active states, user avatar gradient)
     - Navigation items
   - Backend stores theme settings (primary_color, accent_color, dark_mode)

3. **CSS Variables System (DONE)**
   - `--primary` / `--primary-light` / `--primary-dark` / `--primary-rgb`
   - `--accent` / `--accent-light` / `--accent-dark` / `--accent-rgb`
   - `--background` / `--foreground`
   - `--card` / `--card-foreground`
   - `--muted` / `--muted-foreground`
   - `--border` / `--sidebar-bg` / `--sidebar-border`

4. **Branding System (DONE - Previous Session)**
   - Dynamic app name, logo, and favicon via Settings
   - Login page uses branding from BrandingContext
   - Sidebar displays custom logo
   - PWA manifest dynamically generated

---

## Prioritized Backlog

### P0 - Critical
- [ ] Comprehensive E2E Testing - Full regression test across all modules
- [ ] Full Dark Mode Support - Apply CSS variables to all dashboard cards and components

### P1 - High Priority
- [ ] PWA Push Notifications - Backend service and frontend subscription
- [ ] Real Device PWA Testing - Guide for iOS/Android testing
- [ ] Scheduled Report Delivery - Automated report emails
- [ ] Audit Trail for Security Events - Log critical actions

### P2 - Medium Priority
- [ ] Refactor Large Components:
  - `Settings.js` - Currently ~1400 lines
  - `MobileApps.js` - Large component
  - `EmployeesNew.js` - Needs breaking down
  - `Reports.js` - Complex reporting component
- [ ] PWA Offline Mode - Service worker data caching
- [ ] Export Translations as CSV/JSON
- [ ] Department Budget Allocation

---

## Key API Endpoints

### Settings & Branding
- `GET /api/settings` - Fetch global settings
- `PUT /api/settings` - Update settings including theme colors

### Theme Fields in Settings
```json
{
  "primary_color": "#2D4F38",
  "accent_color": "#4A7C59",
  "dark_mode": false
}
```

---

## Database Schema

### Settings Collection - Theme Fields
```json
{
  "id": "global_settings",
  "primary_color": "#2D4F38",
  "accent_color": "#4A7C59",
  "dark_mode": false,
  "app_name": "Lojyn HR",
  "logo_url": "/api/uploads/branding/logo_xxx.png",
  "favicon_url": "/api/uploads/branding/logo_xxx.png"
}
```

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123

---

## Known Limitations
- Dark mode only fully styled for login page and sidebar
- Dashboard cards and other pages need CSS variable updates for full dark mode support

---

## Files Modified This Session
- `frontend/src/pages/Settings.js` - Added Theme Customization section
- `frontend/src/contexts/BrandingContext.js` - Added theme color management and CSS variable application
- `frontend/src/components/Layout.js` - Updated to use CSS variables for sidebar styling
- `frontend/src/pages/Login.js` - Updated to use CSS variables
- `backend/server.py` - Added primary_color, accent_color, dark_mode fields to Settings model
