# Hospital-Lite v2 — Flask API + React SPA

Same backend logic as v1. HTMX templates replaced with a React SPA.
Real-time updates now use Socket.io (WebSockets) instead of polling.

---

## What changed from v1

| v1 (HTMX)                        | v2 (React)                              |
|-----------------------------------|-----------------------------------------|
| Jinja2 renders full HTML pages    | Flask serves JSON only (`/api/*`)       |
| HTMX polls for live updates       | Socket.io pushes updates via WebSocket  |
| Sessions in signed cookies        | JWT in `Authorization: Bearer` header   |
| No JS required                    | React + React Router + Axios            |

**What did NOT change:**
- SQLite with parameterized queries (zero SQL injection surface)
- Partial unique index for double-booking prevention
- `patients` vs `users` separation
- `@login_required` / `@role_required` decorators
- `slots.py` — on-the-fly slot generation
- `booking.py` — DB-layer race condition guard

---

## Stack

| Layer     | Choice                                      |
|-----------|---------------------------------------------|
| Backend   | Python + Flask + Flask-SocketIO             |
| Database  | SQLite (parameterized SQL, no ORM)          |
| Auth      | JWT (PyJWT) + Werkzeug password hashing     |
| Frontend  | React 18 + React Router v6 + Axios          |
| Real-time | Socket.io (replaces HTMX polling)           |

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py        # create tables + demo data
python app.py         # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start             # http://localhost:3000
```

The React dev server proxies `/api` to `localhost:5000` automatically.

---

## Demo logins

| Role       | Email                      | Password     |
|------------|----------------------------|--------------|
| Admin      | admin@hospital.com         | admin123     |
| Reception  | reception@hospital.com     | reception123 |
| Doctor     | asha.mehta@hospital.com    | doctor123    |
| Patient    | patient@hospital.com       | patient123   |

---

## Project structure

```
hospital-lite-v2/
├── backend/
│   ├── app.py              # Flask app factory + SocketIO init
│   ├── db.py               # Only file that talks to SQLite
│   ├── auth.py             # JWT decode + @login_required / @role_required
│   ├── slots.py            # On-the-fly slot generation
│   ├── booking.py          # Shared booking logic (DB-enforced race guard)
│   ├── schema.sql          # 4 tables + partial unique index
│   ├── seed.py             # Demo data
│   ├── api_auth.py         # POST /api/auth/login|register, GET /api/auth/me
│   ├── api_patient.py      # /api/patient/* (book, slots, appointments)
│   ├── api_doctor.py       # /api/doctor/* (queue, advance, cancel)
│   ├── api_reception.py    # /api/reception/* (schedule, book, checkin)
│   └── api_admin.py        # /api/admin/* (stats, doctors, staff)
│
└── frontend/
    └── src/
        ├── api.js              # Axios instance + Socket.io client
        ├── context/AuthContext.js
        ├── components/Layout.js
        └── pages/
            ├── Login.js
            ├── BookAppointment.js
            ├── MyAppointments.js   ← live via Socket.io
            ├── DoctorQueue.js      ← live via Socket.io
            ├── Reception.js        ← live via Socket.io
            ├── AdminDashboard.js
            ├── AdminDoctors.js
            └── AdminStaff.js
```

---

## Key interview talking points

**"How do you prevent double booking?"**
Two layers — the booking page shows only free slots, and the final guard is a
partial unique index: `UNIQUE(doctor_id, appt_date, appt_time) WHERE status != 'cancelled'`.
If two requests race, the DB rejects the second with an IntegrityError and we
return a 409 with a friendly message.

**"How does real-time work?"**
Flask-SocketIO emits an `appointment_update` event whenever a booking is
created, a status changes, or an appointment is cancelled. Every React page
that needs live data listens for this event and re-fetches. No polling.

**"Why React instead of HTMX?"**
v1 used HTMX because Flask was doing server-side rendering — there was no
reason to add a second rendering layer. v2 converts Flask to a JSON API so
React owns the UI, which gives us proper client-side routing, a cleaner
separation of concerns, and easier future expansion.

**"Why SQLite and not PostgreSQL?"**
SQLite is zero-setup for a portfolio project. The schema is standard SQL and
the migration path is straightforward — change the connection string and swap
`sqlite3.IntegrityError` for `psycopg2.errors.UniqueViolation`.

**"How does auth work?"**
Login returns a JWT. React stores it in localStorage and attaches it as
`Authorization: Bearer <token>` on every request. Flask decodes it with PyJWT
in the `@login_required` decorator. Role gates are handled by `@role_required`.
