# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI (via Anthropic API) to generate React components through an agentic workflow that uses tool calling to create and modify files in a virtual file system. Components are previewed in real-time using an iframe-based sandbox.

## Development Commands

```bash
# Initial setup (install deps + Prisma generate + migrations)
npm run setup

# Development server with Turbopack
npm run dev

# Development server in background (logs to logs.txt)
npm run dev:daemon

# Build production bundle
npm run build

# Run tests (Vitest)
npm run test

# Lint
npm run lint

# Database commands
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create and apply migrations
npm run db:reset             # Reset database (force)
npx prisma studio            # Open database GUI
```

## Architecture

### Virtual File System (VFS)

The core architecture uses an in-memory virtual file system (`VirtualFileSystem` class in `src/lib/file-system.ts`) rather than writing files to disk. This VFS:

- Stores files and directories as a tree structure with Map-based children
- Provides CRUD operations (create, read, update, delete, rename)
- Serializes/deserializes to/from JSON for database persistence
- Normalizes all paths to start with `/` and removes trailing slashes
- Auto-creates parent directories when creating nested files

### AI Agent Tool Calling

The AI agent (Claude) generates components using two tools defined in `src/lib/tools/`:

1. **str_replace_editor** (`str-replace.ts`) - Text editor operations:
   - `view` - View file contents with optional line ranges
   - `create` - Create new files with content
   - `str_replace` - Find/replace text in files
   - `insert` - Insert text at specific line number

2. **file_manager** (`file-manager.ts`) - File system operations:
   - `rename` - Move/rename files (creates dirs recursively)
   - `delete` - Delete files or directories

These tools operate on the VFS and are bound to a specific instance passed during API route initialization.

### Component Preview System

The preview system (`src/lib/transform/jsx-transformer.ts` and `src/components/preview/PreviewFrame.tsx`) works by:

1. Transforming JSX/TSX files to ES modules using Babel standalone
2. Creating blob URLs for each transformed module
3. Generating an import map that:
   - Maps local files (starting with `/` or `@/`) to blob URLs
   - Maps third-party packages to `https://esm.sh/` CDN
   - Handles the `@/` alias (points to root `/`)
4. Injecting an HTML document into an iframe with:
   - The import map as `<script type="importmap">`
   - Tailwind CSS from CDN
   - Collected CSS from any `.css` files
   - Error boundary for runtime errors
   - Sandbox attributes: `allow-scripts allow-same-origin allow-forms`
5. Displaying syntax errors in a styled error UI if transformation fails

Entry point detection looks for files in this order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`.

### State Management

Two React contexts manage application state:

1. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
   - Wraps a VFS instance
   - Manages selected file state
   - Handles tool calls from AI responses
   - Triggers re-renders via `refreshTrigger` counter
   - Auto-selects `/App.jsx` or first root file on mount

2. **ChatContext** (`src/lib/contexts/chat-context.tsx`):
   - Manages chat messages and streaming
   - Calls `/api/chat` route with messages, files, and projectId
   - Processes tool calls from streamed responses
   - Updates VFS through FileSystemContext

### Database Schema

Prisma with SQLite (`prisma/schema.prisma`):

- **User**: email/password auth with bcrypt hashing
- **Project**: stores serialized VFS (`data` field) and messages for logged-in users
  - Anonymous users can use the app without persistence
  - Projects have optional `userId` (nullable for anonymous)

Prisma client is generated to `src/generated/prisma/` (see generator output config).

### Authentication

JWT-based session auth (`src/lib/auth.ts`):

- Cookie-based with 7-day expiration
- Uses `jose` library for JWT signing/verification
- Secret from `JWT_SECRET` env var (defaults to dev key)
- Session middleware in `src/middleware.ts` protects routes
- Anonymous users can continue without sign-up

### AI Provider System

The `src/lib/provider.ts` file exports `getLanguageModel()` which:

- Returns real Anthropic Claude (claude-haiku-4-5) if `ANTHROPIC_API_KEY` is set
- Falls back to `MockLanguageModel` for development without API key
  - Mock provider generates static counter/form/card components
  - Limits to 4 steps to prevent repetition
- Model is configured with 10k max tokens and 40 max steps (4 for mock)

### System Prompt

The generation prompt (`src/lib/prompts/generation.tsx`) instructs the AI to:

- Keep responses brief
- Create React components with Tailwind CSS
- Always create `/App.jsx` as the root entry point
- Use `@/` import alias for local files (e.g., `import Component from '@/components/Component'`)
- Never create HTML files (only JSX/TSX)
- Work on root route `/` of the virtual filesystem

## Key Implementation Details

### Path Imports

- TypeScript path alias: `@/*` maps to `./src/*` (see `tsconfig.json`)
- Virtual filesystem: `@/` maps to root `/` in preview import map
- All user-generated component imports must use `@/` prefix

### Testing

Tests use Vitest + Testing Library:
- Test files: `**/__tests__/**/*.test.tsx` or `**/__tests__/**/*.test.ts`
- jsdom environment for React component testing
- Run with `npm run test`

### Project Persistence

For authenticated users:
- Projects auto-save on AI response completion (see `onFinish` in `src/app/api/chat/route.ts`)
- Saves serialized VFS and message history to database
- Projects load via `[projectId]/page.tsx` dynamic route

For anonymous users:
- VFS state persists only in browser memory during session
- No database persistence
- Can optionally sign up to save work
