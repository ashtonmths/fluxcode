<div align="center">
  <img src="public/favicon.svg" alt="FluxCode" width="100" />
  
  # FluxCode
  
  **Master DSA through long-term competitive contests**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
  [![tRPC](https://img.shields.io/badge/tRPC-11.0-2596be?logo=trpc)](https://trpc.io)
  [![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748?logo=prisma)](https://prisma.io)
</div>

---

## ✨ Features

- 🏆 **Long-term Contests** — Join month-long coding challenges with structured curricula
- ⚡ **LeetCode Integration** — Automatic verification of problem submissions
- 📊 **Live Leaderboards** — Real-time rankings with streak tracking
- 🎯 **Weekend Tests** — Performance checkpoints with penalty system
- 🔥 **Streak System** — Daily coding habit tracking with midnight delimiter
- 💳 **Payment Integration** — Razorpay-powered contest entry and penalties
- 🎨 **Modern UI** — Beautiful interface with Framer Motion animations

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start database
./start-database.sh

# Run migrations
npm run db:generate

# Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework** — Next.js 15 with App Router
- **Language** — TypeScript
- **API** — tRPC for type-safe endpoints
- **Database** — PostgreSQL with Prisma ORM
- **Auth** — Supabase Authentication
- **Payments** — Razorpay
- **UI** — Tailwind CSS, Framer Motion, Lucide Icons
- **Real-time** — Pusher

## 📝 Environment Variables

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
OPENAI_API_KEY=
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">
  Built with 💜 by the FluxCode team
</div>
