# Peer Learning Matchmaker

Study partner matching app built with **Next.js (App Router)**, **TypeScript**, **Prisma + Postgres**, and **Auth.js (NextAuth)**.  
Designed for hackathons and MVP demos — Google login → choose subjects → get matched → "It's a match!".

---

## Tech Stack
- [Next.js](https://nextjs.org/) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Sonner](https://sonner.emilkowal.ski/) for UI
- [Auth.js (NextAuth)](https://authjs.dev/) with Google OAuth
- [Prisma](https://www.prisma.io/) + [Postgres](https://neon.tech/) (Neon/Supabase)
- Deployed on [Vercel](https://vercel.com/)

---

## Project Structure

src/
app/ # App Router pages & API routes
components/ # Reusable UI components
lib/ # Prisma, auth, utils
styles/ # Global styles (Tailwind)
prisma/ # Prisma schema + seed

---

## Setup

### 1. Clone repo
```bash
git clone https://github.com/<username>/peer-learning-matchmaker.git
cd peer-learning-matchmaker
```
### 2. Install deps
```bash
npm install
```
### 3. Setup env
Create .env file:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTH_SECRET=your-secret   # generate with `npx auth secret`
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```
### 4. Init Prisma
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
### 5. Run dev
```bash
npm run dev
```

---


## MVP Flow
Login with Google

Select subjects you want to learn/teach

Get match suggestions

Accept → “It’s a match!” with contact details

---

## License
MIT