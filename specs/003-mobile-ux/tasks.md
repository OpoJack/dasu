# Tasks: Mobile UX & Tab Management

**Input**: Design documents from `/specs/003-mobile-ux/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Tests omitted per constitution principle VII (Ship Then Polish).

**Organization**: Tasks grouped by user story. US1 is P1 (core MVP). US2, US3 are P2/P3.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md structure:
```
src/
├── pages/FrontOfHouse.tsx  # PRIMARY: All changes for this feature
└── components/ui/          # Existing shadcn/ui components
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new infrastructure needed - this feature extends existing FrontOfHouse.tsx

**⚠️ NOTE**: This feature has no setup phase - all changes are within existing files.

**Checkpoint**: Existing infrastructure is sufficient

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add mobile view state that all user stories depend on

- [X] T001 Add `mobileView` state variable in `src/pages/FrontOfHouse.tsx`: type `'tabs' | 'menu' | 'order'`, default `'tabs'`
- [X] T002 Add mobile detection logic in `src/pages/FrontOfHouse.tsx`: use Tailwind `md:` breakpoint (768px) for conditional rendering

**Checkpoint**: Mobile view state ready for use in user story implementations

---

## Phase 3: User Story 1 - Mobile-Friendly Navigation (Priority: P1) 🎯 MVP

**Goal**: FOH interface adapts to single-column layout on mobile with bottom navigation

**Independent Test**: Open app in mobile viewport (<768px). Navigate between Tabs, Menu, and Order views using bottom nav. All functionality works without content overflow.

### Implementation

- [X] T003 [US1] Add bottom navigation bar component in `src/pages/FrontOfHouse.tsx`: visible only on mobile (`md:hidden`), three buttons (Tabs, Menu, Order)
- [X] T004 [US1] Style bottom nav buttons in `src/pages/FrontOfHouse.tsx`: highlight active view, show order count badge on Order button
- [X] T005 [US1] Wrap Tabs panel with mobile visibility in `src/pages/FrontOfHouse.tsx`: show when `mobileView === 'tabs'`, always show on desktop (`md:flex`)
- [X] T006 [US1] Wrap Menu panel with mobile visibility in `src/pages/FrontOfHouse.tsx`: show when `mobileView === 'menu'`, always show on desktop (`md:flex`)
- [X] T007 [US1] Wrap Order panel with mobile visibility in `src/pages/FrontOfHouse.tsx`: show when `mobileView === 'order'`, always show on desktop (`md:flex`)
- [X] T008 [US1] Update `selectTab()` to auto-switch to menu view on mobile in `src/pages/FrontOfHouse.tsx`: set `mobileView('menu')` after selection
- [X] T009 [US1] Adjust panel widths for mobile in `src/pages/FrontOfHouse.tsx`: `w-full` on mobile, original widths on desktop
- [X] T010 [US1] Add padding-bottom to main content for bottom nav height in `src/pages/FrontOfHouse.tsx`: prevent content being hidden behind nav

**Checkpoint**: Mobile navigation fully functional, desktop unchanged

---

## Phase 4: User Story 2 - Sticky Tab Total (Priority: P2)

**Goal**: Tab Orders grand total remains visible while scrolling through orders

**Independent Test**: Select tab with 5+ orders. Scroll through orders. Total stays pinned at bottom.

### Implementation

- [X] T011 [US2] Restructure Tab Orders section layout in `src/pages/FrontOfHouse.tsx`: change to `flex flex-col` with defined height
- [X] T012 [US2] Make orders list scrollable in `src/pages/FrontOfHouse.tsx`: add `flex-1 overflow-y-auto` to orders container
- [X] T013 [US2] Create sticky footer for total in `src/pages/FrontOfHouse.tsx`: move grand total to fixed footer with `border-t bg-background`

**Checkpoint**: Total always visible while scrolling orders

---

## Phase 5: User Story 3 - Close Tab Functionality (Priority: P3)

**Goal**: FOH staff can close tabs with confirmation dialog

**Independent Test**: Select tab, click "Close Tab", confirm, tab removed from list.

### Implementation

- [X] T014 [US3] Import AlertDialog components in `src/pages/FrontOfHouse.tsx`: from `@/components/ui/alert-dialog`
- [X] T015 [US3] Add `showCloseConfirm` state in `src/pages/FrontOfHouse.tsx`: boolean to control dialog visibility
- [X] T016 [US3] Add "Close Tab" button in `src/pages/FrontOfHouse.tsx`: place in sticky footer next to total, destructive variant
- [X] T017 [US3] Create confirmation AlertDialog in `src/pages/FrontOfHouse.tsx`: title, description, Cancel and Confirm buttons
- [X] T018 [US3] Add incomplete orders warning in `src/pages/FrontOfHouse.tsx`: check for orders with `status !== 'complete'`, show warning in dialog
- [X] T019 [US3] Implement `closeTab()` function in `src/pages/FrontOfHouse.tsx`: call `supabase.rpc('close_tab', { p_tab_id })`, clear selection, reload tabs
- [X] T020 [US3] Add error handling for close operation in `src/pages/FrontOfHouse.tsx`: show toast on failure
- [X] T021 [US3] Add success feedback in `src/pages/FrontOfHouse.tsx`: toast notification on successful close

**Checkpoint**: Tab closing with confirmation fully functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and verification

- [X] T022 [P] Handle device rotation in `src/pages/FrontOfHouse.tsx`: ensure layout adapts smoothly (Tailwind handles automatically)
- [X] T023 [P] Verify desktop layout unchanged in `src/pages/FrontOfHouse.tsx`: test at 768px+ viewport
- [X] T024 Run build verification: `npm run build` to ensure no TypeScript errors
- [X] T025 Manual testing: verify all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - no setup needed for this feature
- **Foundational (Phase 2)**: No dependencies - can start immediately
- **US1 (Phase 3)**: Depends on Foundational (T001-T002)
- **US2 (Phase 4)**: Depends on Foundational - independent of US1
- **US3 (Phase 5)**: Depends on Foundational - can parallel with US1/US2, but benefits from US2's sticky footer
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational - core MVP
- **US2 (P2)**: Independent after Foundational - can start any time
- **US3 (P3)**: Benefits from US2 (adds close button to sticky footer) but can be done independently

### Parallel Opportunities

Foundational phase:
```
T001, T002 - sequential (same file, state before detection)
```

After Foundational, within US1:
```
T003, T004 - parallel (bottom nav components)
T005, T006, T007 - parallel (panel visibility wrappers)
```

User stories can run in parallel if desired:
```
US1 (T003-T010) | US2 (T011-T013) | US3 (T014-T021)
```

Polish phase:
```
T022, T023 - parallel (different concerns)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T010)
3. **STOP and VALIDATE**: Test mobile navigation independently
4. Deploy for real-world mobile testing

### Incremental Delivery

1. Foundational → Mobile state ready
2. US1 → **Mobile navigation deployed** (MVP)
3. US2 → Sticky total added
4. US3 → Tab closing added
5. Polish → Edge cases verified

---

## Notes

- All changes confined to single file: `src/pages/FrontOfHouse.tsx`
- No new dependencies - uses existing Tailwind and shadcn/ui
- Existing `close_tab` RPC handles database operations
- Constitution principle IV (Colocate Logic): Keep all changes in page file
- Test on actual mobile device for final verification
