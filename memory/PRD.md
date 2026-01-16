# HR Platform - Product Requirements Document

## Original Problem Statement
Create a comprehensive, full-stack HR platform that is multi-language, multi-currency, and supports a multi-corporate structure. The platform includes a wide range of HR modules (35+).

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
   - File reduced from 2325 lines to ~1400 lines

2. **Theme Color Customization (DONE)**
   - Primary Color picker in Settings (admin only)
   - Accent Color picker in Settings (admin only)
   - Dark Mode toggle in Settings (admin - global default)
   - Live preview of theme in Settings page

3. **User Dark Mode Toggle (DONE)** ✨ NEW
   - **Desktop**: Sun/Moon icon in top header bar (right side, next to notifications)
   - **Mobile**: Sun/Moon icon in mobile header
   - Stored in **localStorage** - personal preference per device
   - Respects system preference (prefers-color-scheme) by default
   - Works for ALL users (employees, admins, etc.)

4. **CSS Variables System (DONE)**
   - `--primary` / `--primary-light` / `--primary-dark` / `--primary-rgb`
   - `--accent` / `--accent-light` / `--accent-dark` / `--accent-rgb`
   - `--background` / `--foreground`
   - `--card` / `--card-foreground`
   - `--muted` / `--muted-foreground`
   - `--border` / `--sidebar-bg` / `--sidebar-border`

---

## How Dark Mode Works

### For Employees (Regular Users)
1. Look for the **Moon icon** (☽) in the top-right header
2. Click to toggle between light and dark modes
3. Preference is saved locally and persists across sessions

### For Admins
1. Can set **global default** in Settings > Theme Customization
2. Individual users can override with their local toggle

---

## Prioritized Backlog

### P0 - Critical
- [ ] Comprehensive E2E Testing - Full regression test across all modules
- [ ] Full Dark Mode Support - Apply CSS variables to all dashboard cards

### P1 - High Priority
- [ ] PWA Push Notifications
- [ ] Scheduled Report Delivery
- [ ] Audit Trail for Security Events

### P2 - Medium Priority
- [ ] Refactor Large Components
- [ ] PWA Offline Mode
- [ ] Export Translations

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123

---

## Files Modified This Session
- `frontend/src/pages/Settings.js` - Theme Customization section
- `frontend/src/contexts/BrandingContext.js` - Theme color management
- `frontend/src/components/Layout.js` - Added dark mode toggle to header
- `frontend/src/pages/Login.js` - CSS variables support
- `backend/server.py` - Theme fields in Settings model
