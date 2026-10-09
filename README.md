# 🚀 Workshop Registration Service

Hey there! Welcome to the **Workshop Registration Service**! 🎉 

This is a blazing fast, highly dynamic, and beautifully animated full-stack Next.js application designed for a community training centre to handle their workshop registrations. It's built not just to look good, but to be completely bulletproof under the hood.

## ✨ What's Inside?

We packed this project with modern tools and awesome features:

- **Next.js 16 (App Router):** Taking full advantage of Server Components and the new API Route Promise rules.
- **Tailwind CSS v4 & Dark Mode:** Completely custom aesthetic design system with smooth gradients, micro-interactions, and a built-in Dark Mode toggle (synced with your system preferences via `next-themes`).
- **Framer Motion & SWR:** Data fetching is cached, deduplicated, and buttery smooth. Workshop lists and registration histories lazily load with beautiful skeleton placeholders and staggering fade-in animations!
- **Concurrency-Safe Registrations:** No overbooking! It uses strict MongoDB multi-document transactions to make sure active registrations *never* exceed capacity.
- **Role-Based Access Control (RBAC):** NextAuth handles the sessions, and the backend rigorously enforces what Admins, Managers, and Staff can and can't do.

## 🛠️ Prerequisites

Before you dive in, make sure you have:
- **Node.js** (v18+)
- A **MongoDB Atlas** cluster. *(Pro tip: Grab the free M0 tier and make sure it's a Replica Set so transactions work properly!)*

## 🚦 Let's Get Started

### 1. Database Setup

1. Head over to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and spin up a free cluster.
2. Create a database user, grab the password, and whitelist your IP (or `0.0.0.0/0` for anywhere) under Network Access.
3. Grab your connection string!

### 2. Environment Variables

We need to hook up the credentials. Create a `.env` (or `.env.local`) file in the root folder. You can use the `.env.example` as a template:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/
MONGODB_DB=workshop_registration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a-secure-random-base64-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securepassword123
```
*(Just replace the placeholders with your actual Atlas credentials!)*

### 3. Install & Seed

Let's grab our dependencies and fill up the database with some test data:

```bash
# Install everything (we use --legacy-peer-deps to keep Vitest happy)
npm install --legacy-peer-deps

# Create the master Admin account
npm run seed:admin

# Add some dummy Workshops, Staff, and Registration History
npm run seed:data
```

### 4. Fire it up! 🔥

Start the Next.js development server:

```bash
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) in your browser. 

**Test Accounts:**
- **Admin:** (Use whatever you set in your `.env`)
- **Manager:** `manager@example.com` (Pass: `password123`)
- **Staff:** `staff@example.com` (Pass: `password123`)

## 🧪 Testing

Want to see the concurrency protection in action? Run the automated integration tests! 
It bombards a workshop (that only has 1 seat left) with multiple instantaneous registration attempts. The database will safely reject the duplicates and only let exactly 1 person in!

```bash
npm run test
```

Enjoy exploring the code, and have fun building! 🚀
