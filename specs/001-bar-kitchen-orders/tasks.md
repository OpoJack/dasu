# Tasks: Bar Kitchen Order System

**Input**: Design documents from `/specs/001-bar-kitchen-orders/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/schema.sql

**Tests**: Not explicitly requested. Tests omitted per constitution principle VII (Ship Then Polish).

**Organization**: Tasks grouped by user story. US1 and US2 are both P1 (core MVP loop).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md structure:
```
src/
├── components/ui/     # shadcn/ui components
├── pages/             # Route-level pages (own their data)
├── types/database.ts  # Supabase generated types
└── lib/supabase.ts    # Supabase client
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Vite + React + TypeScript + Tailwind + shadcn/ui

- [x] T001 Create Vite project with React-TS template: `npm create vite@latest . -- --template react-ts`
- [x] T002 Install core dependencies: `npm install @supabase/supabase-js`
- [x] T003 [P] Install and configure Tailwind CSS per Vite guide in `tailwind.config.js` and `src/index.css`
- [x] T004 [P] Initialize shadcn/ui with `npx shadcn-ui@latest init` and configure `components.json`
- [x] T005 [P] Create environment file `.env.local` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY placeholders

**Checkpoint**: Empty React app runs with Tailwind styling working

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Supabase client, types, and shared UI components

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Run database migration in Supabase SQL Editor using `specs/001-bar-kitchen-orders/contracts/schema.sql` ⚠️ REQUIRES USER ACTION
- [ ] T007 Update RLS policy for menu_items to allow INSERT for authenticated users (FR-019) ⚠️ REQUIRES USER ACTION
- [ ] T008 Seed initial menu items in Supabase: Burger ($12), Fries ($5), Wings ($10), Draft Beer ($6), etc. ⚠️ REQUIRES USER ACTION
- [x] T009 Create Supabase client singleton in `src/lib/supabase.ts`
- [x] T010 Generate TypeScript types from Supabase schema into `src/types/database.ts`
- [x] T011 [P] Add shadcn/ui Button component: `npx shadcn-ui@latest add button`
- [x] T012 [P] Add shadcn/ui Input component: `npx shadcn-ui@latest add input`
- [x] T013 [P] Add shadcn/ui Card component: `npx shadcn-ui@latest add card`
- [x] T014 [P] Add shadcn/ui Dialog component: `npx shadcn-ui@latest add dialog`
- [x] T015 [P] Add shadcn/ui Toast component for error notifications: `npx shadcn-ui@latest add toast`
- [x] T016 Create basic App routing in `src/App.tsx` with two routes: `/` (FrontOfHouse) and `/kitchen` (Kitchen)
- [x] T017 Create empty page shells: `src/pages/FrontOfHouse.tsx` and `src/pages/Kitchen.tsx`

**Checkpoint**: Foundation ready - app loads both routes, Supabase connected, types available

---

## Phase 3: User Story 1 - Open Tab and Submit Order (Priority: P1) 🎯 MVP

**Goal**: Staff can create a tab, select menu items, add notes, and submit order to kitchen

**Independent Test**: Create tab "Table 5", add 2x Burger with note "well done", submit → verify in Supabase orders table

### Implementation

- [x] T018 [US1] Build tab creation UI in `src/pages/FrontOfHouse.tsx`: input for tab name, create button, error toast on failure
- [x] T019 [US1] Add tab creation Supabase insert in `src/pages/FrontOfHouse.tsx`: insert into tabs table, show error toast on failure
- [x] T020 [US1] Build open tabs list in `src/pages/FrontOfHouse.tsx`: query tabs where status='open', display as clickable cards
- [x] T021 [US1] Build menu item selection UI in `src/pages/FrontOfHouse.tsx`: fetch menu_items, display by category, quantity +/- buttons
- [x] T022 [US1] Build order draft state in `src/pages/FrontOfHouse.tsx`: local state for selected items with quantities and notes
- [x] T023 [US1] Add item notes input in `src/pages/FrontOfHouse.tsx`: text input per selected item for special requests
- [x] T024 [US1] Add order-level notes input in `src/pages/FrontOfHouse.tsx`: text input for overall order notes
- [x] T025 [US1] Implement order submission in `src/pages/FrontOfHouse.tsx`: insert order + order_items with price_at_order snapshot, error toast on failure
- [x] T026 [US1] Add "Add Menu Item" dialog in `src/pages/FrontOfHouse.tsx`: name, price, category inputs, insert into menu_items (FR-019)

**Checkpoint**: Can create tab, add items with notes, submit order. Orders appear in Supabase.

---

## Phase 4: User Story 2 - Kitchen Marks Order Complete (Priority: P1) 🎯 MVP

**Goal**: Kitchen sees real-time orders, marks them complete, front of house gets notified

**Independent Test**: Submit order from FOH → appears on Kitchen display with audio → mark complete → FOH sees ready notification

### Implementation

- [x] T027 [US2] Build kitchen order list in `src/pages/Kitchen.tsx`: query orders where status IN ('in_progress', 'editing') with tab name join
- [x] T028 [US2] Add Supabase real-time subscription in `src/pages/Kitchen.tsx`: subscribe to orders table changes, update list on INSERT/UPDATE
- [x] T029 [US2] Display order details in `src/pages/Kitchen.tsx`: tab identifier, items with quantities/notes, elapsed time since created_at
- [x] T030 [US2] Implement elapsed time display in `src/pages/Kitchen.tsx`: calculate from created_at, update every 30 seconds
- [x] T031 [US2] Add audio alert on new order in `src/pages/Kitchen.tsx`: Web Audio API, initialize on "Start Shift" button click
- [x] T032 [US2] Add "Mark Complete" button in `src/pages/Kitchen.tsx`: call complete_order RPC function, error toast on failure
- [x] T033 [US2] Add real-time subscription for completed orders in `src/pages/FrontOfHouse.tsx`: listen for status='complete', show toast notification with tab name
- [x] T034 [US2] Build grid layout for kitchen display in `src/pages/Kitchen.tsx`: CSS grid, 3-4 columns, fits 15+ orders without scroll

**Checkpoint**: Full order loop works: create tab → submit order → kitchen sees + audio → mark complete → FOH notified

---

## Phase 5: User Story 3 - Edit Order After Submission (Priority: P2)

**Goal**: FOH can edit submitted orders, kitchen sees "editing" flag to pause work

**Independent Test**: Submit order → edit it (add item) → kitchen sees "editing" flag → confirm edit → kitchen sees updated items

### Implementation

- [ ] T035 [US3] Add "Edit" button to submitted orders in `src/pages/FrontOfHouse.tsx`: only show for status='in_progress'
- [ ] T036 [US3] Implement edit lock acquisition in `src/pages/FrontOfHouse.tsx`: call start_order_edit RPC, show error if already being edited
- [ ] T037 [US3] Build order edit UI in `src/pages/FrontOfHouse.tsx`: reuse menu selection, pre-populate with existing items
- [ ] T038 [US3] Allow modifying quantities and adding items in `src/pages/FrontOfHouse.tsx`: update order_items on confirm
- [ ] T039 [US3] Implement edit confirmation in `src/pages/FrontOfHouse.tsx`: update order_items, call finish_order_edit RPC
- [x] T040 [US3] Display "being edited" flag in `src/pages/Kitchen.tsx`: visual indicator (yellow border, "EDITING" badge) for status='editing'
- [ ] T041 [US3] Handle edit rejection for complete orders in `src/pages/FrontOfHouse.tsx`: check status before allowing edit, show error toast

**Checkpoint**: Can edit orders, kitchen sees flag, edits apply correctly

---

## Phase 6: User Story 4 - View Tab History and Close Tab (Priority: P2)

**Goal**: FOH views complete order history for a tab, sees total, closes tab

**Independent Test**: Open tab with 2 orders → view history (all items, timestamps) → verify total → close tab → tab disappears from active list

### Implementation

- [ ] T042 [US4] Build tab detail view in `src/pages/FrontOfHouse.tsx`: show all orders for selected tab with items and timestamps
- [ ] T043 [US4] Implement tab total calculation in `src/pages/FrontOfHouse.tsx`: call get_tab_total RPC or calculate from order_items
- [ ] T044 [US4] Display total prominently in `src/pages/FrontOfHouse.tsx`: large text showing sum owed
- [ ] T045 [US4] Add "Close Tab" button in `src/pages/FrontOfHouse.tsx`: call close_tab RPC, error toast on failure
- [ ] T046 [US4] Remove closed tab from active list in `src/pages/FrontOfHouse.tsx`: filter out or real-time update
- [ ] T047 [US4] Build "Recently Closed" section in `src/pages/FrontOfHouse.tsx`: query tabs where status='closed' AND closed_at > 24h ago
- [ ] T048 [US4] Add "Reopen Tab" button in `src/pages/FrontOfHouse.tsx`: call reopen_tab RPC for recently closed tabs

**Checkpoint**: Can view history, see total, close tab, reopen if needed

---

## Phase 7: User Story 5 - Add Orders to Existing Tab (Priority: P2)

**Goal**: Add multiple orders to same tab throughout customer visit

**Independent Test**: Create tab → submit order 1 → submit order 2 on same tab → both appear in kitchen → both in tab history

### Implementation

- [x] T049 [US5] Persist selected tab across order submissions in `src/pages/FrontOfHouse.tsx`: don't clear tab selection after submit
- [ ] T050 [US5] Add "New Order" button for open tab in `src/pages/FrontOfHouse.tsx`: reset order draft, keep tab selected
- [x] T051 [US5] Display order count badge on tab cards in `src/pages/FrontOfHouse.tsx`: show number of orders on each tab
- [x] T052 [US5] Ensure kitchen shows tab identifier on all orders in `src/pages/Kitchen.tsx`: consistent display for multi-order tabs

**Checkpoint**: Can add multiple orders to same tab, all tracked correctly

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, UX improvements, error handling hardening

- [x] T053 [P] Add loading states to all async operations in `src/pages/FrontOfHouse.tsx` and `src/pages/Kitchen.tsx`
- [ ] T054 [P] Add connection status indicator in `src/pages/FrontOfHouse.tsx`: show warning when Supabase connection drops
- [ ] T055 [P] Add connection status indicator in `src/pages/Kitchen.tsx`: show warning when real-time subscription disconnects
- [ ] T056 Implement offline order queue in `src/pages/FrontOfHouse.tsx`: localStorage queue, sync on reconnect (edge case from spec)
- [ ] T057 Add keyboard shortcuts for common actions in `src/pages/FrontOfHouse.tsx`: Enter to submit, Escape to cancel
- [ ] T058 Optimize kitchen grid for tablet view in `src/pages/Kitchen.tsx`: responsive breakpoints, touch-friendly buttons
- [x] T059 Add empty states in `src/pages/FrontOfHouse.tsx` and `src/pages/Kitchen.tsx`: "No open tabs" / "No active orders" messages
- [ ] T060 Run quickstart.md validation: verify all setup steps work on fresh clone

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational (can parallel with US1 if desired)
- **US3-5 (Phases 5-7)**: Depend on Foundational, benefit from US1+US2 complete
- **Polish (Phase 8)**: Depends on core stories complete

### User Story Dependencies

- **US1 + US2**: Core MVP loop - implement together or US1 first
- **US3**: Independent - extends US1/US2 with edit capability
- **US4**: Independent - extends tab management
- **US5**: Independent - extends order flow (partially overlaps US1)

### Parallel Opportunities

Within Phase 2:
```
T011, T012, T013, T014, T015 (shadcn components) - all parallel
```

Within Phase 3 (after T018-T019):
```
T021, T022, T023, T024 - can work in parallel on different parts of order UI
```

Within Phase 8:
```
T053, T054, T055 - loading/connection states are independent
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (~15 min)
2. Complete Phase 2: Foundational (~30 min)
3. Complete Phase 3: User Story 1 (~2 hours)
4. Complete Phase 4: User Story 2 (~1.5 hours)
5. **STOP and VALIDATE**: Full order loop works
6. Deploy to Vercel for real testing

### Incremental Delivery

1. Setup + Foundational → App skeleton
2. US1 + US2 → **MVP deployed** (can run a bar night!)
3. US3 → Edit capability added
4. US4 → Tab closing workflow
5. US5 → Multi-order tabs
6. Polish → Production-ready

---

## Notes

- Constitution principle IV (Colocate Logic): All data fetching lives in page components
- Constitution principle VIII (Fail Visibly): Every Supabase call needs error toast
- No separate hooks/ or services/ directories - keep it simple
- shadcn/ui provides consistent styling without custom CSS
- Real-time subscriptions in Kitchen.tsx are critical for core loop
