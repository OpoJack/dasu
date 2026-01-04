# Quickstart: Bar Kitchen Order System

**Branch**: `001-bar-kitchen-orders` | **Date**: 2026-01-03

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (free tier works)
- Vercel account (for deployment)

## 1. Project Setup

```bash
# Create React app with Vite
npm create vite@latest bar-kitchen -- --template react-ts
cd bar-kitchen

# Install dependencies
npm install @supabase/supabase-js react-router-dom

# Install dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

## 2. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the **Project URL** and **anon key** from Settings → API

### Run Schema Migration

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `contracts/schema.sql`
3. Run the SQL to create tables, policies, and functions

### Enable Realtime

Realtime is enabled in the schema, but verify:
1. Go to Database → Replication
2. Ensure `orders` and `order_items` tables are listed

## 3. Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Initialize Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 5. Generate Types (Optional but Recommended)

```bash
# Install Supabase CLI
npm install -D supabase

# Login and link project
npx supabase login
npx supabase link --project-ref your-project-ref

# Generate types
npx supabase gen types typescript --linked > src/types/database.ts
```

## 6. Seed Menu Data

Run in Supabase SQL Editor:

```sql
INSERT INTO menu_items (name, price, category) VALUES
  ('Burger', 12.00, 'Food'),
  ('Fries', 5.00, 'Food'),
  ('Wings', 10.00, 'Food'),
  ('Caesar Salad', 9.00, 'Food'),
  ('Draft Beer', 6.00, 'Drinks'),
  ('House Wine', 8.00, 'Drinks'),
  ('Soda', 3.00, 'Drinks'),
  ('Water', 2.00, 'Drinks');
```

## 7. Basic App Structure

```bash
mkdir -p src/{components,pages,hooks,services,types,lib}
mkdir -p src/components/{common,tabs,orders,kitchen}
mkdir -p src/pages/{FrontOfHouse,Kitchen}
```

## 8. Run Development Server

```bash
npm run dev
```

Open:
- Front of House: `http://localhost:5173/`
- Kitchen Display: `http://localhost:5173/kitchen`

## 9. Testing Setup

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Run tests:

```bash
npm run test
```

## 10. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Key Integration Points

### Real-time Kitchen Updates

```typescript
// In kitchen display component
useEffect(() => {
  const channel = supabase
    .channel('kitchen-orders')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: "status=in.in_progress,editing" },
      (payload) => {
        // Update orders state
        handleOrderChange(payload);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

### Audio Alert on New Order

```typescript
// Initialize on user interaction (e.g., "Start Shift" button)
const audioContext = new AudioContext();
const alertBuffer = await fetch('/alert.mp3')
  .then(r => r.arrayBuffer())
  .then(b => audioContext.decodeAudioData(b));

// Play on new order
const playAlert = () => {
  const source = audioContext.createBufferSource();
  source.buffer = alertBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

### Create Order with Price Snapshot

```typescript
const createOrder = async (tabId: string, items: CreateOrderItemInput[]) => {
  // Get current prices
  const menuItems = await supabase
    .from('menu_items')
    .select('id, price')
    .in('id', items.map(i => i.menu_item_id));

  const priceMap = new Map(menuItems.data?.map(m => [m.id, m.price]));

  // Create order
  const { data: order } = await supabase
    .from('orders')
    .insert({ tab_id: tabId })
    .select()
    .single();

  // Create order items with price snapshot
  await supabase.from('order_items').insert(
    items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: priceMap.get(item.menu_item_id),
      notes: item.notes,
    }))
  );
};
```

## Next Steps

1. Run `/speckit.tasks` to generate implementation task list
2. Implement P1 user stories first (tab creation, order submission, kitchen display)
3. Add authentication (Supabase Auth) for staff login
4. Configure audio files for kitchen alerts
