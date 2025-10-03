# Tech Spec: Epic 1 - Backend Foundation & Infrastructure

**Epic:** Backend Foundation & Infrastructure
**Stories:** 1.1 - 1.6 (6 stories)
**Dependencies:** None (foundational epic)
**Estimated Effort:** 1-2 days

---

## Epic Overview

Establish the Next.js backend infrastructure that all other epics depend on. This epic creates the foundational server architecture, API routes, environment configuration, and error handling that enables OpenAI integration and frontend development.

**Success Criteria:**
- Next.js project initialized with TypeScript and API routes
- Backend can receive and respond to HTTP requests
- Environment configuration working
- Basic error handling in place
- Project structure supports future epics

---

## Architecture Extract

### Technology Stack (for this Epic)

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js | 14.2.0 | Full-stack React framework with API routes |
| Language | TypeScript | 5.3.0 | Type-safe development |
| Runtime | Node.js | 20 LTS | JavaScript runtime |
| Package Manager | npm | 10.x | Dependency management |

### Relevant Components

**API Route Structure:**
```
/app/api/
  ├── agents/route.ts      # GET /api/agents
  ├── chat/route.ts        # POST /api/chat
  ├── files/route.ts       # GET /api/files
  ├── files/[path]/route.ts # GET /api/files/[path]
  └── health/route.ts      # GET /api/health
```

**Project Structure:**
```
agent-orchestrator/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   ├── globals.css         # Global styles
│   └── api/                # API routes (defined above)
├── lib/                    # Business logic
│   └── utils/              # Utilities
│       └── errors.ts       # Error handling
├── types/                  # TypeScript types
│   └── api.ts              # API types
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Example env file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── next.config.js          # Next.js config
```

---

## Story-by-Story Implementation Guide

### Story 1.1: Initialize Next.js Project with TypeScript

**Acceptance Criteria:**
1. ✅ Next.js 14+ project initialized with App Router
2. ✅ TypeScript configured and working
3. ✅ Project runs locally with `npm run dev`
4. ✅ Default Next.js page displays at localhost:3000
5. ✅ ESLint configured for code quality
6. ✅ .gitignore properly configured
7. ✅ package.json has correct dependencies

**Implementation Steps:**

1. **Initialize Project:**
```bash
npx create-next-app@latest agent-orchestrator
# When prompted:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: No
# - App Router: Yes
# - Import alias: Yes (@/*)

cd agent-orchestrator
```

2. **Verify Installation:**
```bash
npm run dev
# Visit http://localhost:3000
# Should see default Next.js welcome page
```

3. **Initialize Git:**
```bash
git init
git add .
git commit -m "Initial Next.js setup with TypeScript"
```

4. **Verify package.json:**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "next": "14.2.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.0",
    "tailwindcss": "^3.4.0"
  }
}
```

**Testing:**
- Run `npm run dev` - server starts on port 3000
- Visit localhost:3000 - page loads
- Make a TypeScript error intentionally - ESLint catches it
- Run `npm run build` - builds successfully

---

### Story 1.2: Create API Route Structure

**Acceptance Criteria:**
1. ✅ `/api/chat` route created and responds to POST
2. ✅ `/api/agents` route created and responds to GET
3. ✅ `/api/files` route created and responds to GET
4. ✅ Each route returns proper JSON responses
5. ✅ Routes use TypeScript types for request/response
6. ✅ Basic request validation in place
7. ✅ 404 handling for unknown routes

**Implementation Steps:**

1. **Create API Types (`types/api.ts`):**
```typescript
// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

// Request/Response types for each endpoint
export interface ChatRequest {
  agentId: string
  message: string
  conversationId?: string
}

export interface ChatResponse {
  conversationId: string
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }
}

export interface Agent {
  id: string
  name: string
  description: string
  path: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}
```

2. **Create `/api/chat/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, ChatRequest, ChatResponse } from '@/types/api'

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()

    // Basic validation
    if (!body.agentId || !body.message) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields: agentId, message'
      }, { status: 400 })
    }

    // Placeholder response (Epic 2 will implement actual logic)
    const response: ChatResponse = {
      conversationId: 'temp-id',
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Echo: ' + body.message,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data: response
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process chat request'
    }, { status: 500 })
  }
}
```

3. **Create `/api/agents/route.ts`:**
```typescript
import { NextResponse } from 'next/server'
import type { ApiResponse, Agent } from '@/types/api'

export async function GET() {
  try {
    // Placeholder - Epic 2 will implement file scanning
    const agents: Agent[] = [
      {
        id: 'sample-agent',
        name: 'Sample Agent',
        description: 'A sample agent for testing',
        path: '/agents/sample-agent'
      }
    ]

    return NextResponse.json<ApiResponse<Agent[]>>({
      success: true,
      data: agents
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to load agents'
    }, { status: 500 })
  }
}
```

4. **Create `/api/files/route.ts`:**
```typescript
import { NextResponse } from 'next/server'
import type { ApiResponse, FileNode } from '@/types/api'

export async function GET() {
  try {
    // Placeholder - Epic 4 will implement file tree
    const files: FileNode[] = []

    return NextResponse.json<ApiResponse<FileNode[]>>({
      success: true,
      data: files
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to load files'
    }, { status: 500 })
  }
}
```

**Testing:**
```bash
# Test with curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","message":"Hello"}'

curl http://localhost:3000/api/agents

curl http://localhost:3000/api/files
```

---

### Story 1.3: Environment Configuration

**Acceptance Criteria:**
1. ✅ .env.local file created for local development
2. ✅ .env.example file created as template
3. ✅ OPENAI_API_KEY variable defined
4. ✅ AGENTS_FOLDER_PATH variable with default value
5. ✅ OUTPUT_FOLDER_PATH variable with default value
6. ✅ Environment variables accessible in API routes
7. ✅ Validation on startup for required variables

**Implementation Steps:**

1. **Create `.env.example`:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here

# File Paths
AGENTS_PATH=./agents
OUTPUT_PATH=./output

# Server Configuration
PORT=3000
NODE_ENV=development
```

2. **Create `.env.local`:**
```bash
# Copy from .env.example and fill in actual values
cp .env.example .env.local
# Edit .env.local with your actual OpenAI API key
```

3. **Create Environment Validation (`lib/utils/env.ts`):**
```typescript
export function validateEnv() {
  const required = ['OPENAI_API_KEY']
  const missing: string[] = []

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check .env.local file`
    )
  }
}

// Environment variable getters with defaults
export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  AGENTS_PATH: process.env.AGENTS_PATH || './agents',
  OUTPUT_PATH: process.env.OUTPUT_PATH || './output',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const
```

4. **Add Validation to App Startup:**

Update `app/layout.tsx`:
```typescript
import { validateEnv } from '@/lib/utils/env'

// Validate environment on server startup
if (typeof window === 'undefined') {
  validateEnv()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ... rest of layout
}
```

**Testing:**
- Remove OPENAI_API_KEY from .env.local
- Run `npm run dev` - should error with clear message
- Add back OPENAI_API_KEY - should start successfully
- Verify defaults work by removing optional vars

---

### Story 1.4: Error Handling Middleware

**Acceptance Criteria:**
1. ✅ Error handler utility function created
2. ✅ All API routes use error handler
3. ✅ Errors logged to console with stack traces
4. ✅ Errors returned as JSON with standard format
5. ✅ Different error types handled (validation, not found, server error)
6. ✅ HTTP status codes set correctly (400, 404, 500)
7. ✅ Error messages are user-friendly (no stack traces in response)

**Implementation Steps:**

1. **Create Error Handler (`lib/utils/errors.ts`):**
```typescript
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message)
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Log full error server-side
  console.error('[API Error]', {
    error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  })

  // Determine status code and user message
  let statusCode = 500
  let message = 'An unexpected error occurred'

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error instanceof Error) {
    message = error.message
  }

  // Return user-friendly error response
  return NextResponse.json<ApiResponse>({
    success: false,
    error: message,
    code: statusCode
  }, { status: statusCode })
}
```

2. **Update API Routes to Use Error Handler:**

Example for `/api/chat/route.ts`:
```typescript
import { handleApiError, ValidationError } from '@/lib/utils/errors'

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()

    if (!body.agentId || !body.message) {
      throw new ValidationError('Missing required fields: agentId, message')
    }

    // ... rest of logic
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Testing:**
- Trigger validation error (missing field) - should return 400
- Trigger not found error - should return 404
- Trigger unexpected error - should return 500
- Verify stack traces appear in console but not in response

---

### Story 1.5: Basic Health Check Endpoint

**Acceptance Criteria:**
1. ✅ `/api/health` endpoint created
2. ✅ Returns 200 OK when server is healthy
3. ✅ Response includes { status: "ok", timestamp: ISO8601 }
4. ✅ Endpoint responds quickly (< 100ms)
5. ✅ Can be called without authentication
6. ✅ Used for Docker health checks later

**Implementation Steps:**

1. **Create `/api/health/route.ts`:**
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
}

// Disable caching for health check
export const dynamic = 'force-dynamic'
```

**Testing:**
```bash
curl http://localhost:3000/api/health
# Should return:
# {"status":"ok","timestamp":"2025-10-02T...","uptime":123.45,"environment":"development"}
```

---

### Story 1.6: Project Structure and Organization

**Acceptance Criteria:**
1. ✅ `/app` folder for Next.js pages and API routes
2. ✅ `/lib` folder for utilities and helpers
3. ✅ `/types` folder for TypeScript types
4. ✅ `/components` folder for React components (for later)
5. ✅ README.md with project overview and setup instructions
6. ✅ Clear separation between frontend and backend code
7. ✅ Folder structure documented in README

**Implementation Steps:**

1. **Create Folder Structure:**
```bash
mkdir -p lib/utils
mkdir -p types
mkdir -p components/ui
mkdir -p components/chat
mkdir -p components/file-viewer
mkdir -p components/navigation
mkdir -p components/providers
```

2. **Create README.md:**
```markdown
# Agent Orchestrator

A lightweight web platform for deploying BMAD agents with OpenAI API compatibility.

## Project Structure

```
agent-orchestrator/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── api/                # API routes
├── components/             # React components
│   ├── chat/               # Chat interface
│   ├── file-viewer/        # File viewer
│   ├── navigation/         # Navigation
│   └── ui/                 # Reusable UI
├── lib/                    # Business logic
│   └── utils/              # Utilities
├── types/                  # TypeScript types
└── ...
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Visit http://localhost:3000

## Architecture

See `docs/solution-architecture.md` for complete technical architecture.
```

3. **Create Index Files for Clean Imports:**

Create `lib/utils/index.ts`:
```typescript
export * from './env'
export * from './errors'
```

Create `types/index.ts`:
```typescript
export * from './api'
```

**Testing:**
- Verify imports work: `import { env } from '@/lib/utils'`
- Verify folder structure matches docs
- Verify README instructions work for new developer

---

## Testing Strategy

### Unit Tests (Optional for Epic 1)

**Test Coverage:**
- Environment validation logic
- Error handling utility functions
- API type validation

**Example Test (`lib/utils/__tests__/env.test.ts`):**
```typescript
import { validateEnv } from '../env'

describe('validateEnv', () => {
  beforeEach(() => {
    // Reset env vars
    delete process.env.OPENAI_API_KEY
  })

  it('should throw error if OPENAI_API_KEY is missing', () => {
    expect(() => validateEnv()).toThrow('Missing required environment variables: OPENAI_API_KEY')
  })

  it('should not throw if all required vars present', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    expect(() => validateEnv()).not.toThrow()
  })
})
```

### Integration Tests

**Manual Testing Checklist:**
- [ ] All API routes respond correctly
- [ ] Environment variables load properly
- [ ] Error handling returns proper JSON
- [ ] Health check endpoint works
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes without errors

---

## Completion Checklist

Before marking Epic 1 complete:

- [ ] Next.js project runs successfully with `npm run dev`
- [ ] All 5 API routes created and responding
- [ ] Environment configuration working (API key loads)
- [ ] Error handling implemented and tested
- [ ] Health check endpoint functional
- [ ] Project structure matches architecture doc
- [ ] README.md provides clear setup instructions
- [ ] All files compile without TypeScript errors
- [ ] Git repository initialized with initial commit

---

## Next Steps

**After Epic 1 Completion:**
→ Proceed to Epic 2: OpenAI Integration with File Operations

Epic 2 will build on this foundation by:
- Integrating OpenAI SDK
- Implementing file operation functions (read_file, write_file, list_files)
- Building function calling loop
- Loading and initializing BMAD agents

**Dependencies Satisfied:**
- ✅ API route structure ready for OpenAI integration
- ✅ Environment config ready for OPENAI_API_KEY
- ✅ Error handling ready for file operation errors
- ✅ Project structure ready for business logic modules
