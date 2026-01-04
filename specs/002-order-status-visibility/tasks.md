# Tasks: Order Status Visibility & Timing Indicators

**Input**: Design documents from `/specs/002-order-status-visibility/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Tests omitted per constitution principle VII (Ship Then Polish).

**Organization**: Tasks grouped by user story. US1, US2, US4 are P1 (core MVP). US3 is P2.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md structure:
```
src/
├── lib/utils.ts           # Shared timing utilities
├── pages/FrontOfHouse.tsx # FOH enhancements
└── pages/Kitchen.tsx      # Kitchen timing updates
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared timing utilities used by both FOH and Kitchen

- [x] T001 Add timing threshold constants and types in `src/lib/utils.ts`: TIMING_THRESHOLDS, TimingState type
- [x] T002 Add `getTimingState()` function in `src/lib/utils.ts`: returns 'normal'|'warning'|'urgent' based on created_at
- [x] T003 Add `getTimingClass()` function in `src/lib/utils.ts`: returns Tailwind classes for each timing state

**Checkpoint**: Shared timing utilities ready for use in both views

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No blocking infrastructure needed - this feature extends existing pages

**⚠️ NOTE**: This feature has no foundational phase - it builds directly on existing infrastructure from 001-bar-kitchen-orders.

**Checkpoint**: Foundation already in place from previous feature

---

## Phase 3: User Story 1 - FOH Sees Order Status on Tab (Priority: P1) 🎯 MVP

**Goal**: FOH staff see order status (in progress, editing, complete) for each order in their tab view

**Independent Test**: Submit order → view tab → see status "In Progress" → kitchen marks complete → status updates to "Complete" without refresh

### Implementation

- [x] T004 [US1] Add order status display to tab detail view in `src/pages/FrontOfHouse.tsx`: show status badge for each order
- [x] T005 [US1] Style status badges in `src/pages/FrontOfHouse.tsx`: in_progress (default), editing (yellow), complete (green)
- [x] T006 [US1] Verify real-time status updates work in `src/pages/FrontOfHouse.tsx`: existing subscription should handle this

**Checkpoint**: FOH can see order status on each order, updates in real-time

---

## Phase 4: User Story 2 - Tab Total Always Visible (Priority: P1) 🎯 MVP

**Goal**: Tab total displayed in Open Tabs sidebar without clicking into tab details

**Independent Test**: Create tab → add orders → see total in sidebar → submit new order → total updates

### Implementation

- [x] T007 [US2] Add `calculateTabTotal()` helper function in `src/pages/FrontOfHouse.tsx`: sum of order_items (quantity × price_at_order)
- [x] T008 [US2] Display tab total in Open Tabs list in `src/pages/FrontOfHouse.tsx`: show below tab name in sidebar card
- [x] T009 [US2] Format total as currency in `src/pages/FrontOfHouse.tsx`: $XX.XX format

**Checkpoint**: Tab totals visible in sidebar, update when orders change

---

## Phase 5: User Story 4 - Order Age Timing Indicators (Priority: P1) 🎯 MVP

**Goal**: Visual timing indicators (<6 min normal, 6-12 min warning, >12 min urgent) on both FOH and Kitchen

**Independent Test**: Submit order → see normal color → wait 6+ min → see warning color → wait 12+ min → see urgent color

### Implementation

- [x] T010 [US4] Add 30-second timer interval in `src/pages/FrontOfHouse.tsx`: useState for `now`, setInterval to update
- [x] T011 [US4] Add timing indicators to FOH order display in `src/pages/FrontOfHouse.tsx`: use getTimingState() and getTimingClass() from utils
- [x] T012 [US4] Update Kitchen.tsx timing thresholds in `src/pages/Kitchen.tsx`: change from 5/10/15 to 6/12 min thresholds
- [x] T013 [US4] Refactor Kitchen.tsx to use shared timing utilities in `src/pages/Kitchen.tsx`: import from utils.ts for consistency
- [x] T014 [US4] Hide timing indicators for completed orders in both `src/pages/FrontOfHouse.tsx` and `src/pages/Kitchen.tsx`

**Checkpoint**: Consistent timing indicators on both FOH and Kitchen, updating every 30 seconds

---

## Phase 6: User Story 3 - Detailed Tab Breakdown View (Priority: P2)

**Goal**: FOH can view itemized breakdown with order subtotals and grand total

**Independent Test**: Select tab → see all orders listed → each order shows items, quantities, prices, subtotal → grand total at bottom

### Implementation

- [x] T015 [US3] Add `calculateOrderSubtotal()` helper in `src/pages/FrontOfHouse.tsx`: sum for single order
- [x] T016 [US3] Build detailed breakdown section in `src/pages/FrontOfHouse.tsx`: show when tab selected, list all orders with items
- [x] T017 [US3] Display order items with quantities and prices in `src/pages/FrontOfHouse.tsx`: item name, qty, price, line total
- [x] T018 [US3] Show order subtotals in `src/pages/FrontOfHouse.tsx`: subtotal per order
- [x] T019 [US3] Show grand total in breakdown view in `src/pages/FrontOfHouse.tsx`: sum of all order subtotals
- [x] T020 [US3] Include order status and timing in breakdown in `src/pages/FrontOfHouse.tsx`: reuse status badge and timing indicator

**Checkpoint**: Full itemized breakdown available for customer bill review

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and refinements

- [x] T021 [P] Ensure timing indicators don't show for completed orders in `src/pages/FrontOfHouse.tsx`
- [x] T022 [P] Show completion timestamp for completed orders instead of timing in `src/pages/FrontOfHouse.tsx`
- [x] T023 Run build verification: `npm run build` to ensure no TypeScript errors
- [ ] T024 Manual testing: verify all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A - no foundational tasks for this feature
- **US1 (Phase 3)**: Depends on Setup (needs no shared utils, can start after T001-T003)
- **US2 (Phase 4)**: Depends on Setup - independent of US1
- **US4 (Phase 5)**: Depends on Setup (T001-T003) - can parallel with US1/US2
- **US3 (Phase 6)**: Depends on US1, US2, US4 (builds on their components)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent - can start after Setup
- **US2 (P1)**: Independent - can start after Setup
- **US4 (P1)**: Independent - can start after Setup
- **US3 (P2)**: Benefits from US1 (status badges) and US4 (timing indicators) being complete

### Parallel Opportunities

Setup phase:
```
T001, T002, T003 - sequential (same file, building on each other)
```

After Setup, user stories can run in parallel:
```
US1 (T004-T006) | US2 (T007-T009) | US4 (T010-T014)
```

Polish phase:
```
T021, T022 - parallel (different concerns)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US4)

1. Complete Phase 1: Setup (~10 min)
2. Complete Phase 3: User Story 1 - Order Status (~20 min)
3. Complete Phase 4: User Story 2 - Tab Totals (~15 min)
4. Complete Phase 5: User Story 4 - Timing Indicators (~30 min)
5. **STOP and VALIDATE**: Core visibility features working
6. Deploy for real-world testing

### Incremental Delivery

1. Setup → Shared utils ready
2. US1 + US2 + US4 → **MVP deployed** (all P1 stories)
3. US3 → Detailed breakdown (P2 - checkout workflow)
4. Polish → Edge cases handled

---

## Notes

- All changes are UI-only - no database or API changes needed
- Existing real-time subscriptions already handle status updates
- Kitchen.tsx already has timing logic - refactor to share with FOH
- Tab totals calculated client-side from already-loaded order_items data
- Constitution principle IV (Colocate Logic): Keep calculation functions in page files unless truly shared
