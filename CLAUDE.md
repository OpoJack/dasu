# dasu Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-03

## Active Technologies
- TypeScript 5.x + React 18+, Tailwind CSS, shadcn/ui, Supabase (existing stack) (002-order-status-visibility)
- Supabase PostgreSQL (existing schema - no changes needed) (002-order-status-visibility)
- TypeScript 5.x + React 18+, Tailwind CSS v4, shadcn/ui (003-mobile-ux)
- Supabase (existing `close_tab` RPC already available) (003-mobile-ux)
- TypeScript 5.x + React 18+ + Vite, Tailwind CSS, shadcn/ui, Supabase JS Client (004-edit-order)
- Supabase PostgreSQL (existing schema with `orders.status = 'editing'` and `start_order_edit`/`finish_order_edit` RPCs) (004-edit-order)

- TypeScript 5.x (React frontend) + React 18+, Supabase JS Client, React Router (001-bar-kitchen-orders)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (React frontend): Follow standard conventions

## Recent Changes
- 004-edit-order: Added TypeScript 5.x + React 18+ + Vite, Tailwind CSS, shadcn/ui, Supabase JS Client
- 003-mobile-ux: Added TypeScript 5.x + React 18+, Tailwind CSS v4, shadcn/ui
- 002-order-status-visibility: Added TypeScript 5.x + React 18+, Tailwind CSS, shadcn/ui, Supabase (existing stack)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
