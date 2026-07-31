# ProjXchange 🚀

### Where Student Innovation Meets Real Investment

A professional **Student-Investor Collaboration Platform** that bridges 
the gap between talented developers and investors ready to back them.

Built as a Final Year Project at **SZABIST University Karachi - 2026**

---

## 🌟 About ProjXchange

During my CS journey I noticed one pattern students build 
incredible solutions every semester, but the moment results are announced,
those projects disappear. No platform. No audience. No second chance.

**ProjXchange was built to fix that.**

Open to every developer, every investor, anywhere.

Because talent is everywhere. Opportunity should be too.

---

## ✨ Key Features

### For Students / Developers
- 📤 Upload and showcase projects professionally
- 🔍 Get discovered by real investors worldwide
- ✅ Accept or reject investment bids
- 💬 Post technical problems and get community support
- 💳 View payment details and funding status

### For Investors
- 🌐 Browse projects from any university
- 💰 Place live bids on innovations you believe in
- 📊 Track and manage your investments
- 🤝 Connect directly with developers
- 💵 Fund projects through secure Stripe payments

### Admin Panel
- 👮 Complete user management and role assignment
- 📁 Project moderation and oversight
- 💳 Monitor payments and platform earnings
- ⚖️ Resolve complaints and disputes
- 🔐 Approve or reject funding requests
- 📈 View platform analytics and earnings

---

## 🛠️ Tech Stack - PERN Stack

### Frontend
- ⚛️ React.js - dynamic component based UI
- ⚡ Vite - fast build tool
- 🎨 CSS - modern responsive styling
- 🔗 Axios - API communication

### Backend
- 🟢 Node.js - server side runtime
- 🚂 Express.js - RESTful API framework
- 🔐 JWT - secure role based authentication
- 🔒 Bcrypt - password hashing and security

### Database
- 🐘 PostgreSQL - scalable relational database

### Payments
- 💳 Stripe API - secure payment processing and transactions

### Architecture
- 🏗️ Three Tier Architecture
- 🔑 Role Based Access Control - RBAC
- 📱 Fully Responsive Design
- 🔄 RESTful API Design

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Student** | Upload projects, receive bids, accept or reject funding |
| **Investor** | Browse projects, place bids, fund ideas securely |
| **Admin** | Full platform management, monitoring and oversight |

---

## 🚀 How To Run Locally

### Prerequisites
- Node.js installed
- PostgreSQL installed
- Stripe account for payment keys

### Backend Setup
```bash
cd backend
npm install
# Create .env file with your credentials
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables Needed

**Backend .env:**
DB_HOST=localhost
DB_USER=db_user
DB_PASSWORD=db_password
DB_NAME=projxchange
JWT_SECRET=jwt_secret
STRIPE_SECRET_KEY=stripe_key
PORT=5000

**Frontend .env:**
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=stripe_public_key

---

## 🎓 Academic Info

- **University:** SZABIST University Karachi
- **Degree:** Bachelor of Science in Computer Science  
- **Year:** 2026
- **Event:** Presented at ZAB E-FEST '26

## 📄 License

This project was developed for academic purposes as a Final Year Project
at SZABIST University Karachi 2026.

