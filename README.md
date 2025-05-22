# 💧 Water Purifier System

A full-stack water purifier management system with:

- **Website** (ReactVite) — for users to manage their purifier, usage, and payments.
- **Admin Panel** (ReactVite) — for admin to manage users, devices, and analytics.
- **Mobile App** (Flutter) — for users to manage purifiers on the go.
- **Backend** (Node.js + Express) — single server to handle all requests and logic.

---

## 📁 Project Structure

water_purifier/
├── frontend/
│ ├── website/ # React web frontend for users
│ ├── admin/ # React web frontend for admin
│ └── app/ # Flutter mobile app
│
├── backend/
│ ├── app.js
│ ├── config/ # DB, environment configs
│ ├── middlewares/ # Shared middlewares (auth, logger, error handler)
│ ├── services/ # Shared business logic
│ ├── routes/ # Mounts all module routes
│ └── modules/
│       ├── website/
│       ├── admin/
│       └── app/
│
└── README.md

