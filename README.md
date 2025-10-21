# Project Tracker AI

A production-ready Next.js 15 task manager with AI-powered features, built with TypeScript, tRPC, Drizzle ORM, and Supabase.

## Features

- **Projects Management**: Create and manage projects with different types (general, website)
- **Task Management**: Organize tasks with statuses, priorities, due dates, and subtasks
- **Kanban Board**: Visual task management with drag-and-drop functionality
- **Daily Planner**: Plan your day with today's tasks and upcoming deadlines
- **Role-based Organization**: Organize tasks and projects by roles with custom colors
- **Semantic Search**: AI-powered search through tasks and projects
- **Authentication**: Secure email/password authentication with NextAuth
- **Responsive Design**: Modern UI with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **API**: tRPC for type-safe server procedures
- **Database**: Supabase Postgres with Drizzle ORM
- **Authentication**: NextAuth with credentials provider
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query (server state) + Zustand (UI state)
- **Forms**: react-hook-form with Zod validation
- **AI**: OpenAI for semantic search embeddings

## Quick Start

### Copy-Paste Commands

```bash
# 1) Install deps
pnpm install

# 2) Create envs
cp .env.example .env

# 3) Supabase: create a new project (in the dashboard)
#    then paste your Postgres connection into DATABASE_URL in .env

# 4) Enable pgvector in your Supabase DB
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 5) Drizzle: generate & push schema
pnpm db:generate
pnpm db:migrate

# 6) (Optional) seed a role/project/task
pnpm db:seed

# 7) Dev
pnpm dev
```

### Environment Variables

Set these in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/db?sslmode=require"
NEXTAUTH_SECRET="run `openssl rand -base64 32`"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://xxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="public anon key"
SUPABASE_SERVICE_ROLE_KEY="service role key (server-only)"
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:seed` - Seed database with sample data

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and user management
- **Roles**: Organizational categories with custom colors
- **Projects**: Main containers for tasks (general or website types)
- **Tasks**: Individual work items with status, priority, and due dates
- **Subtasks**: Sub-items within tasks
- **Embeddings**: Vector embeddings for semantic search

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Setup

1. Create a new Supabase project
2. Enable the pgvector extension in your database
3. Update your `DATABASE_URL` to point to your Supabase instance
4. Run migrations: `npm run db:migrate`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (routes)/          # Protected app pages
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
├── server/               # Server-side code
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database schema and config
│   └── trpc/             # tRPC routers and procedures
└── store/                # Zustand state stores
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
