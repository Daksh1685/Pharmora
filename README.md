# Pharmora

> A cloud-based pharmacy inventory management system built for modern healthcare operations. Designed to help pharmacies track stock, manage sales, monitor expiries, and make data-driven decisions — all from a single dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, Zustand, Framer Motion |
| Backend | Node.js, Express.js, MongoDB Atlas |
| Auth | JWT + Google OAuth 2.0 |
| AI | Groq API (Llama 3.3) |
| Charts | Recharts |

---

## Features

- **Inventory Management** — Add, update, search and filter medicines with category support
- **Purchase & Sales Tracking** — Record purchases and sales with automatic FIFO-based costing
- **Batch & Expiry Management** — Track medicine batches and get alerts before they expire
- **AI Assistant** — Chat with an AI trained on your inventory data for instant insights
- **Reports & Analytics** — Revenue trends, top-selling products, category breakdowns
- **Notifications** — Real-time low stock and expiry alerts with a notification center
- **User Management** — Role-based access (Admin / Staff) with device session tracking
- **Theme Support** — Full dark and light mode with persistent preference

---

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env      # add your credentials
npm install
npm start                 # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local   # add your credentials
npm install
npm run dev               # runs on http://localhost:3000
```

---

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRY` | Token expiry duration (e.g. `7d`) |
| `GROQ_API_KEY` | Groq API key for AI features |
| `CORS_ORIGIN` | Allowed frontend origin |

### Frontend `.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## Project Structure

```
Pharmora/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── middleware/       # Auth, error handling, CORS
│   └── utils/           # FIFO logic, logger, notifications
└── frontend/
    ├── src/app/          # Next.js App Router pages
    ├── src/components/  # UI components
    ├── src/store/        # Zustand state stores
    ├── src/services/    # API service layer
    └── src/hooks/        # Custom React hooks
```

---

## License

MIT © [Daksh1685](https://github.com/Daksh1685)