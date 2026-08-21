# Kutumb

Society management web app for a residential complex. Residents, admin, maintenance staff and security use one login.

**Stack:** MongoDB + Express + React + Node (MERN)

## Features

- JWT login, 4 roles, profile, forgot / reset password
- Resident flats — family, vehicles, pets, emergency contacts, admin approval
- Complaints — category, priority, photo/video, assign, comments, escalate, rating, staff proof
- Bills — maintenance, vargani, sinking fund; generate for all flats, late fee on maintenance, Razorpay (or demo pay), printable receipt
- Facility booking — calendar, clash check, approve / cancel
- Notice board — types, pin, attachments
- SOS emergencies
- Visitors — pre-approve, QR pass, gate in/out, deliveries
- Admin courtyard dashboard with basic analytics

## Demo logins (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@kutumb.local | Admin@123 |
| Resident | resident@kutumb.local | Resident@123 |
| Staff (plumber) | staff@kutumb.local | Staff@123 |
| Staff (electrician) | electric@kutumb.local | Staff@123 |
| Staff (housekeeping) | housekeeping@kutumb.local | Staff@123 |
| Staff (lift) | lift@kutumb.local | Staff@123 |
| Staff (general) | general@kutumb.local | Staff@123 |
| Security | security@kutumb.local | Security@123 |

## Run locally

1. Create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster. Allow IP `0.0.0.0/0`. Copy the connection string.

2. Server env

```
cd server
copy .env.example .env
```

Put `MONGO_URI` and a `JWT_SECRET` in `.env`. Other keys are optional:

- Cloudinary — complaint / notice uploads go to cloud. Without keys, small files are stored as data URLs (ok for demo).
- Razorpay test keys — online pay. Without keys, **Pay** marks the bill paid (demo mode).
- Gmail app password — real reset emails. Without it, forgot-password shows a demo link on screen.

3. Seed and start API

```
cd server
npm install
npm run seed
npm start
```

API: http://localhost:5000

4. Client

```
cd client
npm install
npm run dev
```

App: http://localhost:5173

## Deploy

- Frontend: Vercel, root directory `client`, env `VITE_API_URL` = your Render URL
- Backend: Render Web Service, root directory `server`, start `npm start`
  - env: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (Vercel URL)
  - optional: Cloudinary, Razorpay, EMAIL_USER / EMAIL_PASS
- After first deploy, run seed once from Render shell: `npm run seed`

If the first Render request is slow, the free service was sleeping.

## Project structure

```
client/   React (Vite)
server/   Express API + Mongoose models
```
