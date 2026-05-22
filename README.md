# Pharmora

A cloud-based pharmacy inventory management system built for modern healthcare operations. Designed to help pharmacies track stock, manage sales, monitor expiries, and make data-driven decisions all from a single dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, Zustand, Framer Motion |
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

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/your-username/pharmora.git
cd pharmora
```

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

## Project Structure

```
Pharmora/
├── backend/
│   ├── controllers/     
│   ├── models/          
│   ├── routes/          
│   ├── middleware/       
│   └── utils/           
└── frontend/
    ├── src/app/          
    ├── src/components/  
    ├── src/store/        
    ├── src/services/   
    └── src/hooks/        
```

---

