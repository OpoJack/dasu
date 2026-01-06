# Tasks: Edit Order After Submission

**Input**: Design documents from `/specs/004-edit-order/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests - manual testing per plan.md (no test framework configured)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Summary

| Story | Priority | Description | Status |
|-------|----------|-------------|--------|
| US1 | P1 | Edit an In-Progress Order | To implement |
| US2 | P1 | Kitchen Editing Indicator | Already complete (Kitchen.tsx handles `editing` status) |
| US3 | P2 | Mobile Order Editing | To implement |
| US4 | P2 | Cancel Edit Operation | To implement |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - this feature uses existing infrastructure

**⚠️ NOTE**: This feature requires no new dependencies, database changes, or project setup. All infrastructure already exists:
- `orders.status = 'editing'` exists in schema
- `start_order_edit` and `finish_order_edit` RPCs exist
- Kitchen.tsx already handles editing indicator (US2 complete)
- Types defined in `src/types/database.ts`

**Checkpoint**: Infrastructure verified - proceed directly to User Story 1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add edit state tracking to FrontOfHouse component

- [x] T001 Add `editingOrderId` state variable (`string | null`) in src/pages/FrontOfHouse.tsx
- [x] T002 ~~Add `originalOrderItems` state variable~~ (Not needed - cancel simply clears state)
- [x] T003 Add `Pencil` icon import from lucide-react in src/pages/FrontOfHouse.tsx

**Checkpoint**: Foundation ready - edit state variables available for user story implementation

---

## Phase 3: User Story 1 - Edit an In-Progress Order (Priority: P1) 🎯 MVP

**Goal**: Staff can click Edit on an in-progress order, modify items in Current Order section, and save changes

**Independent Test**: Create a tab, submit an order, click Edit, add/remove items, click Save Changes, verify order updates

### Implementation for User Story 1

- [x] T004 [US1] Implement `startEdit(order: OrderWithDetails)` function that calls `start_order_edit` RPC and loads order items into `orderDraft` state in src/pages/FrontOfHouse.tsx
- [x] T005 [US1] Implement `saveEditedOrder()` function that deletes existing order_items, inserts new ones, updates notes, and calls `finish_order_edit` RPC in src/pages/FrontOfHouse.tsx
- [x] T006 [US1] Modify `submitOrder()` to detect if editing (check `editingOrderId`) and route to `saveEditedOrder()` instead in src/pages/FrontOfHouse.tsx
- [x] T007 [US1] Add Edit button (Pencil icon) to desktop Tab Orders section, visible only when `order.status === 'in_progress'` in src/pages/FrontOfHouse.tsx (around line 742)
- [x] T008 [US1] Change submit button text from "Send to Kitchen" to "Save Changes" when `editingOrderId` is set in src/pages/FrontOfHouse.tsx (around line 714)
- [x] T009 [US1] Add validation in `saveEditedOrder()` to prevent saving if `orderDraft.length === 0` with toast error in src/pages/FrontOfHouse.tsx
- [x] T010 [US1] Add error handling with toast notifications for failed RPC calls in `startEdit()` and `saveEditedOrder()` in src/pages/FrontOfHouse.tsx

**Checkpoint**: Desktop order editing fully functional - staff can edit in-progress orders from Tab Orders section

---

## Phase 4: User Story 3 - Mobile Order Editing (Priority: P2)

**Goal**: Mobile users can access edit functionality through renamed "Orders" navigation

**Independent Test**: Use mobile viewport, navigate to Orders tab, see Edit button on in-progress orders, complete an edit

### Implementation for User Story 3

- [x] T011 [US3] Rename mobile navigation state value from `closeout` to `orders` in `mobileView` useState in src/pages/FrontOfHouse.tsx (around line 96)
- [x] T012 [US3] Update mobile navigation button label from "Close out" to "Orders" in src/pages/FrontOfHouse.tsx (around line 1071)
- [x] T013 [US3] Update all `mobileView === 'closeout'` conditionals to `mobileView === 'orders'` in src/pages/FrontOfHouse.tsx (around lines 905, 1065)
- [x] T014 [US3] Add Edit button (Pencil icon) to mobile Tab Orders section, matching desktop behavior in src/pages/FrontOfHouse.tsx (around line 929)
- [x] T015 [US3] After save in mobile, switch `mobileView` to `'orders'` to return to Orders view in src/pages/FrontOfHouse.tsx

**Checkpoint**: Mobile parity achieved - edit functionality works identically on mobile and desktop

---

## Phase 5: User Story 4 - Cancel Edit Operation (Priority: P2)

**Goal**: Staff can cancel an edit in progress, restoring original state and releasing the edit lock

**Independent Test**: Start editing an order, make changes, click Cancel, verify order unchanged and kitchen no longer shows editing indicator

### Implementation for User Story 4

- [x] T016 [US4] Implement `cancelEdit()` function that calls `finish_order_edit` RPC, clears `editingOrderId`, restores `orderDraft` from `originalOrderItems`, and shows toast in src/pages/FrontOfHouse.tsx
- [x] T017 [US4] Add Cancel button (X icon) next to "Save Changes" button, visible only when `editingOrderId` is set, in desktop Current Order section in src/pages/FrontOfHouse.tsx (around line 715)
- [x] T018 [US4] Add Cancel button to mobile Current Order section, matching desktop behavior in src/pages/FrontOfHouse.tsx (around line 895)

**Checkpoint**: Cancel functionality complete - staff can safely abort edits without saving

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and edge case handling

- [x] T019 Add visual indicator (e.g., border or header text) to Current Order section when editing to show which order is being modified in src/pages/FrontOfHouse.tsx
- [x] T020 Disable Edit button on orders already being edited (status === 'editing') with tooltip "Already being edited" in src/pages/FrontOfHouse.tsx
- [ ] T021 Run quickstart.md manual validation: test all acceptance scenarios from spec.md
- [ ] T022 Verify Kitchen display shows/hides editing indicator correctly during edit workflow (FR-008, FR-014)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No tasks - infrastructure exists
- **Phase 2 (Foundational)**: T001-T003 must complete before user stories
- **Phase 3 (US1)**: Depends on Phase 2 - core editing functionality
- **Phase 4 (US3)**: Depends on Phase 2 - can run in parallel with US1
- **Phase 5 (US4)**: Depends on Phase 2 - can run in parallel with US1/US3
- **Phase 6 (Polish)**: Depends on US1 minimum, preferably all stories complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P1) | Phase 2 Foundational | US3, US4 |
| US3 (P2) | Phase 2 Foundational | US1, US4 |
| US4 (P2) | Phase 2 Foundational | US1, US3 |

### Within Each Phase

- T001-T003: All sequential (same file, related state)
- T004-T010 (US1): T004-T005 first (core functions), then T006-T010 (UI integration)
- T011-T015 (US3): T011-T013 first (nav rename), then T014-T015 (edit button)
- T016-T018 (US4): T016 first (function), then T017-T018 (buttons)

---

## Parallel Example: After Phase 2

```bash
# Three developers can work in parallel after Phase 2:

Developer A (US1 - Core Editing):
Task T004: Implement startEdit() function
Task T005: Implement saveEditedOrder() function
...

Developer B (US3 - Mobile):
Task T011: Rename mobileView state
Task T012: Update nav label
...

Developer C (US4 - Cancel):
Task T016: Implement cancelEdit() function
Task T017: Add Cancel button (desktop)
...
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003)
2. Complete Phase 3: User Story 1 (T004-T010)
3. **STOP and VALIDATE**: Test desktop editing end-to-end
4. Deploy if ready - core value delivered

### Full Feature Delivery

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Edit Order) → Validate
3. Complete Phase 4: US3 (Mobile) → Validate
4. Complete Phase 5: US4 (Cancel) → Validate
5. Complete Phase 6: Polish → Final validation

### Estimated Task Breakdown

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Phase 2 (Foundation) | 3 | State setup |
| Phase 3 (US1) | 7 | Core editing |
| Phase 4 (US3) | 5 | Mobile support |
| Phase 5 (US4) | 3 | Cancel functionality |
| Phase 6 (Polish) | 4 | Refinements |
| **Total** | **22** | |

---

## Notes

- All changes in single file: `src/pages/FrontOfHouse.tsx`
- US2 (Kitchen Indicator) already complete - no tasks needed
- No automated tests - validate manually per quickstart.md
- Kitchen.tsx requires no changes - already handles `editing` status
- Database and RPCs already exist - no backend work needed
