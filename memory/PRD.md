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

### Session: January 16, 2026 (Latest)

#### 1. Scheduled Report Delivery Feature ✅
Automated report delivery system:
- 7 report types (Analytics, Leave, Attendance, Compliance, Workforce, Visitors, Employees)
- Scheduling: Daily, Weekly, Monthly
- Access: **Sidebar → Core → Scheduled Reports**

#### 2. Wiki / Documentation System ✅
Professional internal documentation:
- 20+ module documentation with workflows
- Searchable, categorized navigation
- Access: **Sidebar → Support → Wiki / Docs**

#### 3. Collaborations Hub ✅ **NEW**
Central "operating system for work" - a Slack-like collaboration platform:

**Features:**
- **Channels**: Public and private channels for team discussions
- **Direct Messages**: 1-on-1 conversations
- **Real-time Chat**: Message sending with auto-refresh
- **Reactions**: Emoji reactions on messages (👍❤️😂🎉 etc.)
- **Threads**: Reply to messages in threads
- **File Sharing**: Upload and share files in channels
- **Pinned Messages**: Pin important messages
- **Saved Items**: Bookmark messages/files
- **Search**: Global search across messages, files, channels
- **Tasks**: Kanban-style task board (To Do, In Progress, Done)
- **User Presence**: Online status indicators

**Backend Endpoints:**
- `GET/POST /api/collaborations/channels` - Channel CRUD
- `GET/POST /api/collaborations/channels/{id}/messages` - Messages
- `POST /api/collaborations/messages/{id}/reactions` - Reactions
- `POST /api/collaborations/messages/{id}/pin` - Pin messages
- `GET/POST /api/collaborations/dm` - Direct messages
- `GET/POST /api/collaborations/tasks` - Task management
- `GET/POST /api/collaborations/saved` - Saved items
- `GET /api/collaborations/search` - Global search
- `GET /api/collaborations/dashboard` - Stats dashboard

**Access:** Sidebar → Core → Collaborations

---

### Previous Sessions

#### Session: January 15, 2026
- Visitor Management Module
- Compliance & Legal Module  
- Workforce Planning Module
- Backend Refactoring (partial)
- Enhanced SMTP Settings

---

## Code Architecture

```
/app/
├── backend/
│   ├── routers/
│   │   ├── visitors.py
│   │   ├── compliance.py
│   │   ├── workforce.py
│   │   ├── scheduled_reports.py
│   │   └── collaborations.py      # NEW - 900+ lines
│   ├── models/
│   └── server.py
└── frontend/
    └── src/
        └── pages/
            ├── ScheduledReports.js
            ├── Wiki.js
            └── Collaborations.js   # NEW - 1100+ lines
```

---

## Prioritized Backlog

### P0 - Critical
- [x] Scheduled Report Delivery
- [x] Wiki Documentation
- [x] Collaborations Hub
- [ ] Full E2E Testing

### P1 - High Priority
- [ ] Complete backend refactoring
- [ ] Complete frontend refactoring
- [ ] CSV and PDF Export
- [ ] Real-time WebSocket for Collaborations (currently polling)

### P2 - Medium Priority
- [ ] Dark mode audit
- [ ] PWA Offline Mode
- [ ] Employee profile picture testing

---

## Test Credentials
- **Admin**: admin@hrplatform.com / admin123
- **Employee**: sarah.johnson@lojyn.com / sarah123

---

## Files Created This Session
- `/app/backend/routers/collaborations.py` - Full collaboration backend
- `/app/frontend/src/pages/Collaborations.js` - Collaboration UI
- `/app/frontend/src/pages/ScheduledReports.js`
- `/app/frontend/src/pages/Wiki.js`

## Notes
- Collaborations currently uses polling (5 second refresh) - WebSocket upgrade would improve real-time feel
- File uploads stored in `/app/backend/uploads/collaborations/`
- All collaboration data stored in MongoDB collections: `collab_channels`, `collab_messages`, `collab_files`, `collab_tasks`, `collab_saved`
