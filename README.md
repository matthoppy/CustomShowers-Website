# BFS Website

Official website for Bespoke Frameless Showers - Premium shower enclosures and mirror installations in London.

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Supabase** - Backend services

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at http://localhost:8080/

### Build for Production

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/          # Images and static files
├── components/      # React components
│   ├── ui/         # shadcn/ui components
│   └── ...         # Feature components
├── integrations/    # Supabase integration
├── pages/          # Route pages
└── App.tsx         # Main app component
```

## Available Routes

- `/` - Home page
- `/design-shower` - Design consultation page

## License

Copyright © 2024 Bespoke Frameless Showers. All rights reserved.
