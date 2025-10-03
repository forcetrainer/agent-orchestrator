# Agent Orchestrator

A Next.js-based AI agent orchestration platform that enables multi-agent workflows with file access and chat interfaces.

## Project Structure

```
agent-orchestrator/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   ├── globals.css         # Global styles
│   └── api/                # API routes
│       └── health/         # Health check endpoint
├── components/             # React components
│   ├── chat/               # Chat interface components
│   ├── file-viewer/        # File viewer components
│   ├── navigation/         # Navigation components
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── lib/                    # Business logic
│   └── utils/              # Utilities
│       ├── env.ts          # Environment validation
│       ├── errors.ts       # Error handling
│       └── index.ts        # Clean exports
├── types/                  # TypeScript types
│   ├── api.ts              # API types
│   └── index.ts            # Clean exports
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Example env file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── next.config.js          # Next.js config
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agent-orchestrator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your configuration:
   - `NODE_ENV`: Set to `development` or `production`
   - Additional variables as needed

### Running the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Running Tests

```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## Architecture

This project follows a modular monolith architecture with clear separation of concerns:

- **Frontend**: React components in `/components` organized by feature area
- **Backend**: API routes in `/app/api` and framework-agnostic business logic in `/lib`
- **Types**: Centralized TypeScript definitions in `/types`
- **Utilities**: Shared helpers and utilities in `/lib/utils`

For detailed architecture information, see [Solution Architecture](docs/solution-architecture.md).

## Development Guidelines

- All business logic in `/lib` should be framework-agnostic (no Next.js/React dependencies)
- Components are organized by feature area, not by component type
- Use index files for clean imports: `@/lib/utils` and `@/types`
- Tests are located in `__tests__` directories alongside source code
- Follow Next.js 14 App Router conventions

## License

[Add license information]
