# GitYap

Compare your GitHub commits with Telegram messages. Are you a **Coder** or a **Yapper**?

## Features

- 📊 **Comparison Chart** - Visual bar chart comparing GitHub commits vs Telegram messages
- 🎯 **Matchmaking** - Find users with similar activity ratios
- 🏆 **Leaderboard** - See who's the biggest yapper or coder
- 🤖 **Telegram Bot** - Automatically tracks all messages in channels where added as admin
- 🎨 **Beautiful UI** - Dark mode by default with premium micro-interactions

## Tech Stack

- **Framework**: SvelteKit + TypeScript
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS (Robi's Design Best Practices)
- **Charts**: Chart.js
- **Bot**: GrammY (Telegram Bot API)

## Quick Start

### 1. Setup Environment

Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
TELEGRAM_BOT_TOKEN="your_bot_token_here"
GITHUB_TOKEN="your_github_token_here"  # Optional
```

### 2. Database Setup

```bash
npm run db:push
```

### 3. Telegram Bot

1. Message @BotFather, create a bot, get token
2. Set webhook:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d '{"url": "https://yourdomain.com/api/webhook"}'
```

### 4. Run Dev Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## User Flow

1. **Start Bot** → User messages bot on Telegram
2. **Add Admin** → User adds bot to their channel as admin (read-only)
3. **Register** → Enter GitHub username + Telegram channel on website
4. **Track** → Bot counts all channel messages automatically
5. **View Stats** → See comparison chart and similar users

## API Routes

- `POST /api/webhook` - Telegram bot webhook
- `GET /api/stats/[username]` - Get user stats
- `GET /api/similars?username=[name]` - Get similar users
- `POST /api/register` - Register new user

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
```

## Design

Following [Robi's Design Best Practices](https://ethiopian-cursor-community.github.io/robis-design-best-practice/):
- Low saturation colors (HSL 30-50%)
- No pure black/white
- 4px spacing multiples
- Smooth animations (cubic-bezier(0.4, 0.0, 0.2, 1))
- Micro-interactions (hover scale 1.02, active scale 0.98)

---

**GitYap** - *Measure what matters: Code vs Chat* 💻💬
# GitYap
