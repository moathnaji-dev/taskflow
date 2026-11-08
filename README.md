# TaskFlow

Full-stack task & team management app: **React + Vite** (frontend), **Node.js + Express** (backend), **SQLite via sql.js** (database), **JWT** auth.

## Run locally

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm install
npm run dev
```

Demo accounts: `admin@taskflow.com / admin123` (admin) · `alice@taskflow.com / member123` (member)

## Tests

```bash
cd backend
npm test        # 11 API tests (Node's built-in test runner, in-memory DB)
```

## Features

- Dark / light theme toggle for every user (saved in the browser)
- Role-based access: **Admin** (full control) vs **Member** (own team/tasks only)
- Sidebar taskbar (Dashboard, Tasks, Team, Admin) + team taskbar (tab per team)
- Validation: no past due dates, a team is required for every new user, email/password checks, duplicate email detection
- Security: no public registration (only admins create users), members can't edit tasks outside their team, admin-only deletes

## Structure

```
backend/   app.js, server.js, db.js, routes/, middleware/, utils/, tests/
frontend/  src/{api,context,components,pages}
```

## Deploy

- Backend → Render (Root Directory `backend`, Start `node server.js`)
- Frontend → Vercel (Root Directory `frontend`, env `VITE_API_URL=https://<your-backend>.onrender.com/api`)
