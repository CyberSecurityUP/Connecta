<p align="center">
  <h1 align="center">Connecta</h1>
  <p align="center">Open-source real-time team messaging platform</p>
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="#project-structure">Project Structure</a> &middot;
  <a href="#api-reference">API Reference</a> &middot;
  <a href="#contributing">Contributing</a> &middot;
  <a href="#license">License</a>
</p>

---

Connecta is a self-hosted, open-source alternative to Slack built with modern web technologies. It provides real-time messaging, workspaces, channels, direct messages, threads, file sharing, webhooks, and a full admin panel — all in a single deployable monorepo.

## Features

### Messaging
- **Channels** — Public, private, and announcement channels with topics and descriptions
- **Direct Messages** — 1:1 and group conversations
- **Threads** — Reply to any message in a threaded side panel
- **Reactions** — Emoji reactions on messages with real-time updates
- **File Uploads** — Drag-and-drop file sharing with image previews
- **Message Editing & Deletion** — Edit or soft-delete sent messages
- **Pinned Messages** — Pin important messages to channels
- **Full-Text Search** — Search messages, channels, and members (Cmd+K)

### Real-Time
- **Instant Delivery** — Messages appear in real-time via WebSockets
- **Presence** — See who's online, away, or in DND mode
- **Typing Indicators** — See when someone is typing
- **Live Updates** — Reactions, edits, and deletions sync instantly

### Workspaces
- **Multi-Workspace** — Create and switch between multiple workspaces
- **Role-Based Access** — Owner, Admin, Member, and Guest roles
- **Invitations** — Invite members via email with token-based acceptance
- **Workspace Settings** — Manage members, roles, and workspace details

### Platform Administration
- **Admin Dashboard** — System-wide stats (users, workspaces, messages, files)
- **User Management** — Search, promote/demote admins, deactivate accounts
- **Workspace Oversight** — Monitor and manage all workspaces

### Integrations
- **Webhooks** — Configure outgoing webhooks per workspace
- **9 Event Types** — message.created, message.updated, message.deleted, member.joined, member.left, channel.created, channel.archived, reaction.added, file.uploaded
- **HMAC-SHA256 Signing** — Verify webhook payloads with shared secrets
- **Delivery Logs** — Track webhook delivery status, response times, and errors
- **Auto-Disable** — Webhooks auto-disable after 10 consecutive failures

### Other
- **Notifications** — In-app notification system with unread counts
- **User Profiles** — Display name, avatar, bio, title, timezone, custom status
- **Dark/Light Mode** — Theme support via next-themes
- **Responsive Design** — Works on desktop and mobile
- **Error Boundaries** — Graceful error handling with retry

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **State** | React Query (server), Zustand (client) |
| **Backend** | Node.js, Express, TypeScript |
| **Real-Time** | Socket.io (with Redis adapter) |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Cache** | Redis 7 |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Validation** | Zod (shared between frontend & backend) |
| **File Storage** | Local disk (S3-ready) |

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.2.0
- **Docker** and **Docker Compose**

### Quick Setup

```bash
git clone https://github.com/CyberSecurityUP/Connecta.git
cd Connecta
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Verify prerequisites (Node.js, npm, Docker)
2. Start PostgreSQL and Redis containers
3. Generate environment files with secure defaults
4. Install all dependencies
5. Set up the database schema
6. Seed initial data

### Start Development

```bash
# Start all services (frontend + backend)
npm run dev

# Or start individually
npm run dev --filter=server   # Backend on http://localhost:4000
npm run dev --filter=web      # Frontend on http://localhost:3000
```

### Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password123` |
| Workspace | Acme Inc (`/acme`) |

### Manual Setup

If you prefer to set things up manually:

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy and configure environment files
cp .env.example apps/server/.env
# Edit apps/server/.env with your values

# Create apps/web/.env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# 4. Set up database
cd apps/server
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ../..

# 5. Start dev servers
npm run dev
```

## Project Structure

```
connecta/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   └── src/
│   │       ├── app/                  # Pages (App Router)
│   │       │   ├── (auth)/           # Login, register, forgot-password
│   │       │   ├── (main)/           # Authenticated app shell
│   │       │   │   ├── [workspaceSlug]/
│   │       │   │   │   ├── channel/  # Channel view + threads
│   │       │   │   │   ├── dm/       # Direct messages
│   │       │   │   │   ├── settings/ # Workspace settings + webhooks
│   │       │   │   │   └── search/   # Search results
│   │       │   │   ├── admin/        # Admin dashboard
│   │       │   │   └── workspace/    # Create/select workspace
│   │       │   └── invite/           # Invitation acceptance
│   │       ├── components/           # React components
│   │       │   ├── features/         # Feature-specific components
│   │       │   ├── layout/           # Shell, sidebar, headers
│   │       │   ├── shared/           # Error boundary, skeletons
│   │       │   └── providers/        # Context providers
│   │       ├── stores/               # Zustand stores
│   │       └── lib/                  # API client, socket, utils
│   │
│   └── server/                       # Express backend
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema (18 models)
│       │   └── seed.ts               # Seed data
│       └── src/
│           ├── controllers/          # Request handlers
│           ├── services/             # Business logic
│           ├── routes/               # API route definitions
│           ├── middleware/            # Auth, validation, rate limiting
│           ├── socket/               # WebSocket handlers
│           ├── config/               # App configuration
│           └── utils/                # Errors, crypto, logger
│
├── packages/
│   └── shared/                       # Shared code
│       └── src/
│           ├── types/                # TypeScript interfaces
│           ├── validators/           # Zod schemas
│           ├── constants/            # Roles, limits
│           └── socket-events.ts      # Event definitions
│
├── docker-compose.yml                # PostgreSQL + Redis
├── setup.sh                          # Automated setup script
├── turbo.json                        # Turborepo config
└── .env.example                      # Environment template
```

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces` | List user's workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace details |
| PATCH | `/workspaces/:id` | Update workspace |
| DELETE | `/workspaces/:id` | Delete workspace |
| GET | `/workspaces/:id/members` | List members |
| POST | `/workspaces/:id/invitations` | Send invitation |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/channels` | List channels |
| POST | `/workspaces/:id/channels` | Create channel |
| GET | `/workspaces/:id/channels/:channelId` | Get channel |
| PATCH | `/workspaces/:id/channels/:channelId` | Update channel |
| POST | `/workspaces/:id/channels/:channelId/join` | Join channel |
| POST | `/workspaces/:id/channels/:channelId/leave` | Leave channel |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/channels/:channelId/messages` | List messages (paginated) |
| POST | `/workspaces/:id/channels/:channelId/messages` | Send message |
| PATCH | `/workspaces/:id/channels/:channelId/messages/:msgId` | Edit message |
| DELETE | `/workspaces/:id/channels/:channelId/messages/:msgId` | Delete message |
| POST | `/workspaces/:id/channels/:channelId/messages/:msgId/reactions` | Add reaction |
| GET | `/workspaces/:id/channels/:channelId/messages/:msgId/replies` | Get thread replies |

### Direct Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/conversations` | List conversations |
| POST | `/workspaces/:id/conversations` | Create conversation |
| GET | `/workspaces/:id/conversations/:convId/messages` | List DM messages |
| POST | `/workspaces/:id/conversations/:convId/messages` | Send DM |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/webhooks` | List webhooks |
| POST | `/workspaces/:id/webhooks` | Create webhook |
| PATCH | `/workspaces/:id/webhooks/:whId` | Update webhook |
| DELETE | `/workspaces/:id/webhooks/:whId` | Delete webhook |
| POST | `/workspaces/:id/webhooks/:whId/regenerate-secret` | Regenerate secret |
| GET | `/workspaces/:id/webhooks/:whId/logs` | View delivery logs |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/search/messages?q=` | Search messages |
| GET | `/workspaces/:id/search/channels?q=` | Search channels |
| GET | `/workspaces/:id/search/members?q=` | Search members |

### Admin (requires platform admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id/toggle-admin` | Toggle admin status |
| POST | `/admin/users/:id/deactivate` | Deactivate user |
| POST | `/admin/users/:id/reactivate` | Reactivate user |
| GET | `/admin/workspaces` | List all workspaces |
| GET | `/admin/workspaces/:id` | Workspace details |
| DELETE | `/admin/workspaces/:id` | Delete workspace |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `NEXTAUTH_SECRET` | — | JWT signing secret |
| `PORT` | `4000` | Backend server port |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL (for CORS) |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | `26214400` (25MB) | Max upload size in bytes |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | API URL for frontend |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | WebSocket URL for frontend |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (optional) |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth (optional) |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth (optional) |

## Real-Time Events

Connecta uses Socket.io for real-time communication. Key events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send a message |
| `message:new` | Server → Client | New message received |
| `message:updated` | Server → Client | Message edited |
| `message:deleted` | Server → Client | Message deleted |
| `reaction:added` | Server → Client | Reaction added |
| `reaction:removed` | Server → Client | Reaction removed |
| `typing:start` | Client → Server | User started typing |
| `typing:indicator` | Server → Client | Typing indicator update |
| `presence:update` | Bidirectional | Presence status change |

## Database Schema

18 Prisma models organized around:

- **Auth** — User, Account, Session, VerificationToken
- **Workspaces** — Workspace, WorkspaceMember, Invitation
- **Channels** — Channel, ChannelMember, PinnedMessage
- **Messaging** — Message, Reaction
- **DMs** — Conversation, ConversationParticipant
- **Files** — File (with upload status tracking)
- **Notifications** — Notification
- **Webhooks** — Webhook, WebhookLog

Roles: `OWNER` > `ADMIN` > `MEMBER` > `GUEST`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
