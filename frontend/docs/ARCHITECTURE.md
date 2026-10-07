# Architecture

Frontend:
- React + Vite
- React Router
- Tailwind CSS
- Lucide icons
- Axios
- Recharts-ready reporting layer
- LocalStorage offline mutation queue foundation

Backend:
- Node.js
- Express
- JWT
- bcrypt
- Zod-ready validation layer
- rate limiting
- REST API
- service/data-access separation can be expanded without changing frontend contracts

Persistence:
- SQL.js SQLite-compatible local database for zero-config development
- schema includes relationships, indexes, timestamps and audit trail
- production can move to PostgreSQL/MySQL using the same domain model

Security:
- protected routes
- RBAC middleware
- password hashing
- rate limiting
- server-side validation hook
- no frontend secrets
- audit logs for sensitive operations

Scalability:
- branch_id on core organizational entities
- API versioning can be introduced as /api/v1
- parent/teacher portals can consume the same APIs
- cloud sync can sit above local persistence
