# AcademyPro — Academy Management System

A full-stack academy management system with offline-first capabilities, multi-branch support, RBAC, and comprehensive features.

## Requirements

- **Node.js** 18+ 
- **npm** or yarn
- Modern browser (Chrome, Firefox, Edge, Safari)

## Installation

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your settings (defaults work for development)

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `JWT_SECRET` | `academypro-dev-secret-change-me` | **Change in production!** |
| `JWT_EXPIRY` | `8h` | Token expiry duration |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `DB_FILE` | `./data/academypro.sqlite` | SQLite database path |
| `UPLOAD_DIR` | `./uploads` | File upload directory |

### 4. Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Backend API URL |

## Database Setup

```bash
# Seed the database with demo data
cd backend
npm run seed
```

This creates:
- 2 branches (Main Campus, Downtown Branch)
- 1 super admin + 3 staff users
- 5 teachers
- 13 classes with batches
- 30 students with parent records
- Fee invoices and payments for 3 months
- 7 days of attendance
- Timetable slots
- Exams with results
- Expense records
- Inventory items

## Start Commands

### Development

```bash
# Backend (starts on port 5000)
cd backend
npm run dev

# Frontend (starts on port 5173)
cd frontend
npm run dev
```

### Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves API)
cd backend
npm start
```

## Demo / Admin Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@academypro.local` | `Admin@123` |

## Architecture

### Backend
- **Express.js** REST API
- **SQLite** via sql.js (file-based, no external DB needed)
- SQLite is the only configured database; MongoDB is not required or used by this project.
- **JWT** authentication with RBAC
- **Rate limiting** and security headers
- **Audit logging** for all CRUD operations

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for dashboard charts
- **Lucide** icons
- **Axios** for API calls

## Features

### Core Modules
- Student Management (30 students, profiles, batch assignments)
- Teacher Management (assignments, attendance, payroll)
- Parent Management (linked to students, portal access)
- Class & Batch Management (13 classes, sections, shifts)
- Subject Management (per-class subjects with marks config)
- Admission Workflow (application → approval → student creation)
- Timetable (conflict detection for teacher/batch/room)

### Attendance
- Daily student attendance (bulk marking by batch)
- Teacher attendance
- Status: Present, Absent, Late, Leave
- Attendance reports and statistics

### Finance
- Fee structure configuration
- Monthly invoice generation (auto-calculates previous dues)
- Payment recording with receipt numbers
- Scholarship/discount integration
- Fine/late fee management
- Expense tracking with categories
- Financial reports (income vs expenses, by category)
- Payroll management (basic salary, allowances, deductions)

### Academics
- Exam management (midterm, final, unit test, quiz)
- Marks entry (bulk and individual)
- Configurable grade system (A+ to F)
- Report cards with print support
- Student performance reports
- Academic rankings

### Reports
- Finance reports (income, expenses, net, pending fees)
- Student attendance reports
- Teacher attendance reports  
- Academic performance reports
- Teacher workload reports
- All reports support date range filtering

### Administration
- User management with roles (super_admin, academy_admin, accountant, teacher, receptionist, parent)
- Permission-based access control
- Multi-branch support
- Branch switching
- Audit logs for all operations
- Settings management (academy info, system rules, grade rules)
- Expense category management

### Backup & Restore
- Full JSON backup export
- Backup validation before restore
- Safety backup creation before destructive restore
- Restore with confirmation

### Offline Support
- Sync queue for offline operations
- Connection status monitoring
- Sync center UI
- Retry mechanism for failed syncs

## Production Deployment

1. Set `JWT_SECRET` to a strong random string
2. Set `CLIENT_URL` to your frontend domain
3. Build frontend: `cd frontend && npm run build`
4. Start backend: `cd backend && npm start`
5. Configure reverse proxy (nginx) to serve:
   - `/api` → backend (port 5000)
   - `/` → frontend build files

## Backup/Restore Instructions

### Export
1. Navigate to **Backup & Restore** in the sidebar
2. Click **Export Full Backup**
3. Save the JSON file

### Restore
1. Navigate to **Backup & Restore**
2. Click **Choose File** and select a backup JSON
3. Review the validation summary
4. Click **Restore Database** and confirm
5. Refresh the page

## External Integrations

### SMS/WhatsApp/Email (Not Configured)
The system has a provider-based architecture for:
- SMS notifications
- WhatsApp messages
- Email via SMTP

Currently these show "Provider not configured" status. To enable:
1. Set environment variables for your chosen provider
2. The system will detect configuration and enable sending

### File Uploads
Document uploads are stored locally in the `uploads/` directory.

## Testing

### API Tests
All 35 API endpoints have been verified:
- Authentication (login, profile, password change)
- CRUD for all 20+ resources
- Dashboard with aggregated data
- All 5 report types
- Backup export/import
- Settings management
- Portal endpoints

### Manual Testing Flows
1. Login → Dashboard → verify stats from DB
2. Students → Add → Edit → Assign batch → Mark attendance
3. Fees → Generate → Record payment → Verify receipt
4. Exams → Add marks → Report card → Print
5. Backup → Export → Restore → Verify data
6. Go offline → Create record → Reconnect → Sync

## License

Proprietary - AcademyPro Management System
