# WebTarget

A minimalist English spelling application for mastering 1900 essential words.

## Features

- **1900 Words** - Comprehensive vocabulary coverage
- **Smart Review** - Focus on incorrect words
- **Progress Tracking** - Real-time statistics
- **Keyboard-Only** - Efficient workflow (Enter to submit/continue)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Select Range** - Choose word range (1-1900)
2. **Type & Submit** - Enter spelling, press Enter
3. **Review Results** - View statistics and retry incorrect words
4. **Repeat** - Practice until perfect

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS v4
- Redux Toolkit
- React Router v7

## Architecture

```
src/
├── features/      # Feature modules (home, spelling, result)
├── lib/          # Utilities (API, validation, storage)
├── config/       # Single source of truth for constants
└── routes/       # Lazy-loaded routing
```

## Design Principles

- **Single Source of Truth** - Centralized configuration
- **UI/Logic Separation** - Custom hooks for business logic
- **Simplicity First** - Clean, minimal interface
- **Keyboard Focused** - Efficient interaction

---
