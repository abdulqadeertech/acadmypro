# API Overview

Base URL: `/api`

## Auth
POST `/auth/login`

## Dashboard
GET `/dashboard`

## Core CRUD
GET/POST `/students`
GET/PUT/DELETE `/students/:id`
GET/POST `/parents`
GET/POST `/classes`
GET/POST `/batches`
GET/POST `/subjects`
GET/POST `/expenses`
GET/POST `/exams`
GET/POST `/notifications`

## Operations
GET `/timetable`
POST `/timetable`
GET `/attendance?date=YYYY-MM-DD`
POST `/attendance/bulk`

## Finance
GET `/fees`
POST `/fees/generate`
GET `/payments`
POST `/payments`

## Academics
GET `/results/:studentId`
POST `/results`

## Reports
GET `/reports/attendance`
GET `/reports/finance`

## Admin
GET `/admin/users`
POST `/admin/users`
GET `/admin/settings`
PUT `/admin/settings`
GET `/admin/backup`
POST `/admin/restore`
GET `/audit-logs`
