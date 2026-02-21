# PlacementHub — Campus Recruitment Portal

## Complete Project Structure

```
placement_portal/
│
├── backend/                        ← Flask API
│   ├── app.py                      ← Main entry point, creates app + seeds admin
│   ├── config.py                   ← All configs (DB, JWT, Mail, Redis)
│   ├── extensions.py               ← Flask extensions (db, jwt, mail, celery)
│   ├── models.py                   ← Database models (User, Student, Company, Drive, Application)
│   ├── celery_worker.py            ← Celery + scheduled tasks setup
│   ├── placement.db                ← SQLite DB (auto-created on first run)
│   ├── uploads/                    ← Student resume uploads (auto-created)
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                 ← /api/auth/* (login, register, me)
│   │   ├── admin.py                ← /api/admin/* (dashboard, companies, students, drives)
│   │   ├── company.py              ← /api/company/* (dashboard, drives, applications)
│   │   └── student.py              ← /api/student/* (dashboard, drives, apply, profile, resume)
│   │
│   └── tasks/
│       ├── __init__.py
│       ├── reminders.py            ← Daily email reminders (Celery Beat)
│       ├── monthly_report.py       ← Monthly HTML report to admin (Celery Beat)
│       └── export_csv.py           ← Async CSV export + email (User triggered)
│
└── frontend/                       ← Vue 3 CDN App
    ├── index.html                  ← Entry point (loads all scripts via CDN + local JS)
    │
    └── src/
        ├── store.js                ← Global reactive state + API helper functions
        ├── router.js               ← Vue Router (hash mode, route guards)
        ├── main.js                 ← App root component + mount
        │
        └── components/
            ├── Auth/
            │   ├── Login.js        ← Login page (works for all roles)
            │   └── Register.js     ← Register page (student or company)
            │
            ├── Shared/
            │   ├── Sidebar.js      ← Role-aware sidebar navigation
            │   └── Toast.js        ← Toast notification container
            │
            ├── Admin/
            │   ├── AdminDashboard.js     ← Stats + pending approvals + chart
            │   ├── AdminCompanies.js     ← List, search, approve/reject, blacklist
            │   ├── AdminStudents.js      ← List, search, blacklist
            │   ├── AdminDrives.js        ← List, approve/reject/close drives
            │   └── AdminApplications.js  ← View all applications
            │
            ├── Company/
            │   ├── CompanyDashboard.js   ← Overview + drives summary
            │   ├── CompanyDrives.js      ← Create + list own drives
            │   ├── CompanyApplications.js ← View + update applicant status
            │   └── CompanyProfile.js     ← View + edit company profile
            │
            └── Student/
                ├── StudentDashboard.js   ← Eligible drives + recent apps summary
                ├── StudentDrives.js      ← Browse + filter + apply to drives
                ├── StudentApplications.js ← History + CSV export trigger
                └── StudentProfile.js     ← View/edit + resume upload
```

---

## Setup Instructions

### Prerequisites

* Python 3.10+
* Redis (running on localhost:6379)
* A Gmail account (for emails)

### Step 1 — Create Gmail App Password

1. Go to your Google Account → Security → 2-Step Verification → App passwords
2. Generate a password for "Mail"
3. Copy it — you'll use this in config.py

### Step 2 — Configure the Backend

Edit `backend/config.py`:

```python
MAIL_USERNAME = 'your-email@gmail.com'
MAIL_PASSWORD = 'your-16-char-app-password'
ADMIN_EMAIL   = 'admin@institute.com'   # admin login email
ADMIN_PASSWORD = 'admin123'              # admin login password
```

### Step 3 — Install Python Dependencies

```bash
cd backend
pip install flask flask-sqlalchemy flask-jwt-extended flask-mail flask-cors celery redis werkzeug
```

### Step 4 — Run the Application

Open **3 terminals** inside the `backend/` folder:

**Terminal 1 — Flask API Server:**

```bash
python app.py
```

→ Runs on http://localhost:5000
→ Auto-creates `placement.db` and admin user on first run

**Terminal 2 — Celery Worker (for async jobs):**

```bash
celery -A celery_worker.celery worker --loglevel=info
```

**Terminal 3 — Celery Beat (for scheduled jobs):**

```bash
celery -A celery_worker.celery beat --loglevel=info
```

### Step 5 — Open the Frontend

Open `frontend/index.html` directly in your browser.

> Tip: Use VS Code Live Server extension for best results.

---

## Login Credentials (Default)

| Role    | Email               | Password    | Note                        |
| ------- | ------------------- | ----------- | --------------------------- |
| Admin   | admin@institute.com | admin123    | Pre-seeded, cannot register |
| Company | Register via UI     | your choice | Needs admin approval first  |
| Student | Register via UI     | your choice | Can login immediately       |

---

## API Endpoints

| Method | Endpoint                             | Auth    | Description                |
| ------ | ------------------------------------ | ------- | -------------------------- |
| POST   | /api/auth/register                   | Public  | Register student/company   |
| POST   | /api/auth/login                      | Public  | Login, get JWT token       |
| GET    | /api/auth/me                         | JWT     | Get current user info      |
| GET    | /api/admin/dashboard                 | Admin   | Stats                      |
| GET    | /api/admin/companies                 | Admin   | List all companies         |
| PUT    | /api/admin/companies/:id/status      | Admin   | Approve/reject company     |
| PUT    | /api/admin/companies/:id/blacklist   | Admin   | Blacklist company          |
| GET    | /api/admin/students                  | Admin   | List all students          |
| PUT    | /api/admin/students/:id/blacklist    | Admin   | Blacklist student          |
| PUT    | /api/admin/users/:id/deactivate      | Admin   | Deactivate any user        |
| GET    | /api/admin/drives                    | Admin   | List all drives            |
| PUT    | /api/admin/drives/:id/status         | Admin   | Approve/reject/close drive |
| GET    | /api/admin/applications              | Admin   | All applications           |
| GET    | /api/company/dashboard               | Company | Company overview           |
| POST   | /api/company/drives                  | Company | Create a placement drive   |
| GET    | /api/company/drives                  | Company | List own drives            |
| GET    | /api/company/drives/:id/applications | Company | Get applicants for a drive |
| PUT    | /api/company/applications/:id/status | Company | Shortlist/Select/Reject    |
| PUT    | /api/company/profile                 | Company | Update company profile     |
| GET    | /api/student/dashboard               | Student | Dashboard data             |
| GET    | /api/student/drives                  | Student | Browse approved drives     |
| POST   | /api/student/drives/:id/apply        | Student | Apply to a drive           |
| GET    | /api/student/applications            | Student | My application history     |
| PUT    | /api/student/profile                 | Student | Update profile             |
| POST   | /api/student/profile/resume          | Student | Upload resume file         |
| POST   | /api/student/export-applications     | Student | Trigger async CSV export   |

---

## Features Implemented

### Core

* [X] JWT-based authentication (all 3 roles)
* [X] Admin pre-seeded, no registration
* [X] Role-based route guards (frontend + backend)
* [X] Company approval workflow
* [X] Drive creation and approval workflow
* [X] Eligibility validation (CGPA, branch, year)
* [X] Duplicate application prevention (DB constraint)
* [X] Application status lifecycle (applied → shortlisted → selected/rejected)
* [X] Resume upload
* [X] Search and filter (companies, students, drives)
* [X] Blacklist/deactivate companies and students

### Backend Jobs

* [X] Daily deadline reminder emails (Celery Beat, 9 AM)
* [X] Monthly HTML report email to admin (1st of month)
* [X] Async CSV export with email delivery

### Optional

* [X] Chart.js doughnut chart on admin dashboard
* [X] Responsive dark UI with Bootstrap
* [X] Toast notifications
* [X] Eligibility-based filtering on student dashboard
