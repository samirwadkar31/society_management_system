# Kutumb

Society management web app for **one** residential complex. Four roles share one login: **admin, resident, staff, security**. College MERN project (MongoDB + Express + React + Node). JavaScript only — no TypeScript, no Redux.

**Revise from the picture guide (open in Chrome):** [`docs/index.html`](docs/index.html)  
Two buttons: **Frontend** and **Backend**. Every page, every API, diagrams, demo logins.

**Live demo:** [kutumb-nu.vercel.app](https://kutumb-nu.vercel.app) · API [kutumb-api.onrender.com](https://kutumb-api.onrender.com)

---

## The problem (say this first in an interview)

A secretary today chases complaints on WhatsApp, bills in Excel, and the gate in a notebook. Kutumb puts **flats, jobs, money, the clubhouse, notices, visitors, and SOS** on one courtyard so each role only sees what they should.

It is **not** a multi-society SaaS. One building. Four roles.

---

## How the system is split

```
Phone / laptop
    → React UI on Vercel   (client/)     static files
    → Express API on Render (server/)    Node + JWT
    → MongoDB Atlas                      documents
```

The React app **never** talks to Mongo. The API **never** serves the React pages. `client/src/api.js` does `fetch(VITE_API_URL + '/api' + path)` and attaches `Authorization: Bearer <token>`.

| Piece | What we used | Host |
|---|---|---|
| UI | Vite, React 18, React Router, `fetch` + `useState`, AuthContext (no Redux), plain CSS, `qrcode.react` | Vercel, folder `client` |
| API | Express, Mongoose, bcryptjs, jsonwebtoken, CORS, dotenv, Multer | Render, folder `server` |
| DB | MongoDB Atlas | Same URI local + prod |

Env vars that this project actually uses: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT` (server) and `VITE_API_URL` (client).

Uploads are **base64 data URLs** (Multer in memory). Bills use **demo Pay** (`{ demo: true }` then mark paid). Forgot password shows a **`resetLink` on screen** — no email is sent.

---

## Four roles

Landing doors: **Resident** (ivory), **Admin** (brass), **Staff sign in** (teal) for trades **and** the gate.

| Role | After login | Can do | Blocked from |
|---|---|---|---|
| `admin` | Courtyard stats | Approve flats, generate bills, assign jobs, pin notices, approve bookings, add staff | — |
| `resident` | Home | My flat, complaints, demo-pay, book facility, visitors + QR pass, SOS, profile | Residents list, Gate, generate bills, Add member |
| `staff` | Assigned jobs | Update complaint status, add proof, see SOS | Bills, bookings, residents |
| `security` | Expected visitors | Pass lookup, gate in/out, SOS | Resident tools, generate bills |

`App.jsx` `Guard` checks login, then `roles={[...]}`. Hiding a nav link is not security — the API uses `allowRoles`.

Sidebar menus live in `client/src/components/Layout.jsx` (`NAV` object).

---

## Auth (frontend + backend)

1. `POST /api/auth/register` — only residents. `status: pending`. Password **bcrypt** hashed.
2. `POST /api/auth/login` — bcrypt compare. Pending resident → 403. Inactive → 403. Else JWT `{ id, role }`, 7 days, secret `JWT_SECRET`.
3. Browser stores `kutumb_token` in **localStorage** (`AuthContext.jsx`).
4. `GET /api/users/me` on refresh. Bad token → logout.
5. `server/middleware/auth.js` — `jwt.verify`, load user, `req.user`.

Forgot password: random token hashed (SHA-256) + 1 hour. This demo does **not** email. API returns `resetLink`; `Forgot.jsx` prints it. Open `/reset-password/:token` and set a new password.

---

## Screens (what to click in a demo)

**Public:** `/` landing, `/login`, `/register`, `/forgot`, `/reset-password/:token`.

**After login (`/app`):**

| Path | Screen | Who |
|---|---|---|
| `/app` | Dashboard (different stats per role) | All |
| `/app/flat` | My flat — family, vehicles, pets, contacts | Resident |
| `/app/residents` + `/app/residents/:id` | Approve / edit a person (save bar at bottom) | Admin |
| `/app/members` | Add staff or security (created `approved`) | Admin |
| `/app/complaints` + `/:id` | Raise, assign, status, proof, rate | Admin / resident / staff |
| `/app/bills` + `/:id` | Generate, demo-pay, printable receipt | Admin / resident |
| `/app/bookings` | Calendar + clash check | Resident / admin |
| `/app/notices` | Pin / read | Admin writes; others read |
| `/app/visitors` + `/:id/pass` | Pre-approve guest, 6-digit + QR | Resident / admin |
| `/app/gate` | Lookup pass, mark in / out | Security + admin |
| `/app/emergencies` | SOS list, mark handled | All who can see SOS |
| `/app/profile` | Name, phone, change password | All |

---

## Main workflows

### 1. Approve a new flat

Register → pending. Login is blocked. Admin: Residents → open person → Status **Approved** → **Approve resident** (save bar at the bottom of the card). Then they can log in and fill **My flat**. Seed also has `pending@kutumb.local` so you can demo this without registering.

### 2. Complaints

Resident/admin `POST /api/complaints`. Photo is optional (`POST /api/upload` → data URL on `media`). Category maps to a trade in `server/utils/staffJobs.js`:

- plumbing → plumber  
- electrical → electrician  
- housekeeping → housekeeping  
- lift → lift  
- other / security → general  

First **approved** staff of that type is auto-assigned (`status: assigned`). Admin can reassign. Staff update status + proof. Resident rates only when `resolved`. Escalate sets `escalated` + high priority.

Lists: default **Open**; **Resolved** is a month archive (`StackFilter.jsx`).

### 3. Bills

Admin generates one bill per **approved** resident (maintenance, vargani, sinking fund, other). GET applies late fee: unpaid past dueDate → `overdue`; maintenance gets `lateFee` 100. Resident Pay → API `{ demo: true }` → verify marks `paid` + `paidAt`.

Lists: **Unpaid** vs **Paid**. Admin sees **name + flat**. Receipt page is printable.

### 4. Bookings

Facilities (gym, hall, pool, lawn, guest room) come from **seed**, not from an admin “create facility” API. Calendar, future dates only. Overlap check on same facility + date + time. Resident → `pending`. Admin → auto `approved`. Admin approves/rejects. Cancel: owner or admin.

### 5. Visitors / gate

Resident pre-approves → 6-digit `passCode`, status `pre-approved`. Pass page draws a QR with `qrcode.react`. Security looks up code, **Mark entered** (`entryAt`), later exit (`exitAt`). Someone still inside stays on **live** even if they entered days ago.

### 6. Notices & SOS

Admin pins notices. Live board = pinned or last 30 days. Resident SOS (topbar + sidebar) → `Emergency` `active` until admin/security/staff **Mark handled**.

### 7. Profile & add member

Everyone can edit name/phone and change password (`PUT /users/me`, `PUT /users/me/password`). Admin **Add member** creates staff/security already `approved` (`POST /api/users`).

### 8. Dashboard

`GET /api/dashboard` returns **different counts per role** (admin courtyard vs resident home vs staff jobs vs security expected + SOS).

---

## Live vs past (all list pages)

Default = unfinished. Past = dropdown + month (last 18 months). Visitors still inside are not archived. Same idea on emergencies (Active / Handled).

---

## Project structure

```
client/                      Vite React
  src/main.jsx               AuthProvider wrap
  src/App.jsx                routes + Guard
  src/api.js                 fetch + JWT + uploadFile
  src/context/AuthContext    kutumb_token, GET /users/me
  src/pages/                 every screen above
  src/components/            Layout, StackFilter, LiveDeck, AuthShell
  src/index.css              courtyard look; mobile at 980px
server/
  index.js                   Express + CORS + listen + ensureDemoStaff
  middleware/auth.js         jwt.verify + allowRoles
  models/                    User, Complaint, Bill, Booking, Facility,
                             Visitor, Notice, Emergency
  routes/                    /api/auth, users, complaints, bills, bookings,
                             notices, visitors, emergencies, dashboard, upload
  utils/staffJobs.js         category → trade
  utils/upload.js            Multer → data URL
  seed.js                    demo users + facilities + sample rows
docs/index.html              interview picture guide
```

---

## Demo logins (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@kutumb.local | Admin@123 |
| Resident | resident@kutumb.local | Resident@123 |
| Resident (2nd) | priya@kutumb.local | Resident@123 |
| Resident (pending — cannot log in until approved) | pending@kutumb.local | Resident@123 |
| Staff (plumber) | staff@kutumb.local | Staff@123 |
| Staff (electrician) | electric@kutumb.local | Staff@123 |
| Staff (housekeeping) | housekeeping@kutumb.local | Staff@123 |
| Staff (lift) | lift@kutumb.local | Staff@123 |
| Staff (general) | general@kutumb.local | Staff@123 |
| Security | security@kutumb.local | Security@123 |

On every API start, `ensureDemoStaff()` adds housekeeping / lift / general if those emails are missing.

---

## Run locally

1. Atlas cluster. Network Access `0.0.0.0/0`. Copy URI.

2. Server env

```
cd server
copy .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET`. Keep `CLIENT_URL=http://localhost:5173`.

3. Seed + API

```
cd server
npm install
npm run seed
npm start
```

API: http://localhost:5000 (`GET /` returns `{ ok: true, name: 'Kutumb API' }`).

4. Client

```
cd client
npm install
npm run dev
```

App: http://localhost:5173

---

## Deploy

- **Frontend:** Vercel, root `client`, env `VITE_API_URL` = Render URL (no `/api`, no trailing slash).
- **Backend:** Render Web Service, root `server`, start `npm start`. Env: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the Vercel URL). CORS allows that origin + localhost.
- Seed **once** against Atlas (`npm run seed` on your PC if Render Shell is locked on free). Same database the live API uses.
- Free Render sleeps; first request can take ~50s.

---

## Interview cheat sheet

- **Why MERN?** Course stack; one language (JS) client and server.
- **Why not Redux?** Auth context + local list state is enough.
- **Why JWT in localStorage?** Simple for a college demo. (Be honest: XSS can steal it; httpOnly cookies are stricter in industry.)
- **How is a plumber picked?** Category → `staffType` map → `User.findOne`.
- **How are clashes stopped?** Query bookings that day, compare start/end strings (`HH:mm`).
- **Frontend vs backend security?** UI Guard + API `allowRoles`. Always mention both.
- **How does Pay work?** Demo: order returns `{ demo: true }`, verify sets `paid`. No live gateway on this host.
- **Where do photos go?** Multer memory → data URL stored on the Mongo document.
- **How does forgot password work without email?** API returns `resetLink`; the page shows it.
- **Why 50s first load?** Free Render sleeps.
- **If they open package.json:** a few leftover libraries are not part of this demo. Do not claim them.

Open **`docs/index.html`** and walk Frontend then Backend before the interview.
