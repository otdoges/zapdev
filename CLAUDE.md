# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run dev` - Start development server with hot reloading on port 8080
- `pnpm run build` - Build for production 
- `pnpm run build:dev` - Build in development mode
- `pnpm run lint` - Run ESLint to check code quality
- `pnpm run preview` - Preview production build locally

## Project Architecture

This is a React + TypeScript + Vite project built with shadcn/ui components and Tailwind CSS. The project appears to be a website builder/landing page platform.

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM
- **State Management**: TanStack Query for server state
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation

### Project Structure
- `src/pages/` - Page components (Index.tsx, IpadReseller.tsx)
- `src/components/` - Reusable components organized by feature
  - `ui/` - shadcn/ui components
  - `features/` - Feature-specific components
  - `pricing/` - Pricing section components
- `src/lib/` - Utility functions
- `src/hooks/` - Custom React hooks
- `src/config/` - Configuration files
- `public/lovable-uploads/` - Static image assets

### Routing
Simple React Router setup with two main routes:
- `/` - Main landing page (Index component)
- `/ipad-reseller` - Secondary page

### Styling System
- Uses Tailwind CSS with custom configuration
- CSS variables for theme colors defined in `src/index.css`
- Custom fonts: Geist and Inter
- Primary brand color: `#3E6FF3`
- Dark theme with black backgrounds

### Component Architecture
- Components follow shadcn/ui patterns
- Consistent use of Tailwind classes
- Motion animations using Framer Motion
- Path alias `@/` points to `src/`

### Configuration Notes
- Vite runs on port 8080
- TypeScript configuration is lenient (allows JS, no strict null checks)
- ESLint configured for React + TypeScript
- Tailwind configured with dark mode support
- Uses lovable-tagger in development mode

### Development Notes
- This appears to be a Lovable.dev project (web-based AI development platform)
- Images are stored in `public/lovable-uploads/`
- Component tagging is enabled in development for the Lovable platform
