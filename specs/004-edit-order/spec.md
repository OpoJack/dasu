# Feature Specification: Edit Order After Submission

**Feature Branch**: `004-edit-order`
**Created**: 2026-01-05
**Status**: Draft
**Input**: User description: "The front of house needs to be able to edit an order after it has been sent. I want a little 'Edit' button on the order in the 'Tab Orders' section, which brings up the order into the 'Current Order' section for editing. While an order is being edited, the kitchen screen should indicate so, and when saved, the kitchen display should update with any changes. For the mobile view, we can revert 'Close Out' to 'Orders', so the edit functionality can go there too. It should be noted, only orders in progress can be edited."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit an In-Progress Order (Priority: P1)

The front of house staff needs to modify an order that has already been sent to the kitchen. This commonly occurs when a customer changes their mind, realizes they forgot an item, or wants to remove something they accidentally ordered.

**Why this priority**: This is the core functionality of the feature. Without the ability to initiate an edit, no other functionality matters. It delivers immediate value by allowing corrections to orders without having to void and re-enter them.

**Independent Test**: Can be fully tested by sending an order, clicking Edit, modifying items, and saving. Delivers the core value of order correction capability.

**Acceptance Scenarios**:

1. **Given** an order with status "in_progress" in the Tab Orders section, **When** the staff taps the Edit button, **Then** the order loads into the Current Order section with all items, quantities, and notes preserved.

2. **Given** an order is loaded for editing, **When** the staff modifies items (add, remove, change quantity, update notes), **Then** the changes are reflected in the Current Order section immediately.

3. **Given** an order is loaded for editing, **When** the staff submits the changes, **Then** the order is saved with the updated items and the Current Order section clears.

4. **Given** an order with status "complete", **When** the staff views the Tab Orders section, **Then** no Edit button is displayed for that order.

---

### User Story 2 - Kitchen Editing Indicator (Priority: P1)

The kitchen staff needs to know when an order is being edited so they can hold off on preparing items that might change.

**Why this priority**: Equally critical as editing itself - without this indicator, the kitchen might prepare items that are about to be removed, causing food waste and confusion.

**Independent Test**: Can be tested by starting an edit on Front of House and verifying the Kitchen Display shows the editing indicator for that specific order.

**Acceptance Scenarios**:

1. **Given** an order is being edited on Front of House, **When** the kitchen views their display, **Then** the order shows a visual "BEING EDITED" indicator with distinct styling.

2. **Given** an order is being edited, **When** the staff saves or cancels the edit, **Then** the kitchen display updates to remove the editing indicator.

3. **Given** an order is being edited, **When** the kitchen staff attempts to mark it complete, **Then** the action is disabled/prevented with clear feedback.

---

### User Story 3 - Mobile Order Editing (Priority: P2)

Mobile users need access to the edit functionality through a renamed navigation section.

**Why this priority**: Extends the core editing feature to mobile users. The feature is functional without this on desktop, but mobile access is important for staff using tablets or phones.

**Independent Test**: Can be tested by using a mobile device/viewport to navigate to Orders, viewing the order list, and performing an edit operation.

**Acceptance Scenarios**:

1. **Given** a mobile viewport, **When** the user views the bottom navigation, **Then** they see "Orders" instead of "Close Out" as the third navigation item.

2. **Given** a mobile viewport with "Orders" selected, **When** viewing an in-progress order, **Then** an Edit button is displayed.

3. **Given** a mobile viewport with an order being edited, **When** the user saves changes, **Then** they are returned to the Orders view with updated order details.

---

### User Story 4 - Cancel Edit Operation (Priority: P2)

Staff need the ability to cancel an edit in progress without saving changes.

**Why this priority**: Provides a safety net for accidental edits. Important for usability but the feature can function without it by simply navigating away.

**Independent Test**: Can be tested by starting an edit, making changes, canceling, and verifying the order returns to its original state.

**Acceptance Scenarios**:

1. **Given** an order is loaded for editing, **When** the staff taps a Cancel button, **Then** the order reverts to its original state and the editing lock is released.

2. **Given** an order is loaded for editing, **When** the staff cancels, **Then** the kitchen display stops showing the editing indicator.

---

### Edge Cases

- What happens when a user tries to edit an order that another user is already editing?
  - The Edit button should be disabled with indication that it's already being edited.

- What happens if the user closes the browser/app while editing?
  - The editing lock should timeout after a reasonable period (assumed to be handled by existing database mechanisms or a future enhancement).

- What happens when all items are removed from an order during editing?
  - The save operation should be prevented; at minimum one item must remain. Alternatively, the user should be prompted to delete the entire order instead.

- What happens if the kitchen marks an order complete while it's loading for edit?
  - The edit should fail gracefully with a notification that the order is no longer editable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an "Edit" button on each order card in the Tab Orders section (desktop) when the order status is "in_progress".
- **FR-002**: System MUST NOT display the Edit button for orders with status "complete" or "editing".
- **FR-003**: System MUST load the selected order's items into the Current Order section when Edit is tapped, preserving item quantities and notes.
- **FR-004**: System MUST change the order status to "editing" when an edit begins, making it visible to the kitchen.
- **FR-005**: System MUST change the submit button text from "Send to Kitchen" to "Save Changes" when editing an existing order.
- **FR-006**: System MUST update the existing order (not create a new one) when saving changes during an edit.
- **FR-007**: System MUST return the order status to "in_progress" when the edit is saved or canceled.
- **FR-008**: Kitchen display MUST show a distinct visual indicator (yellow border and "BEING EDITED - HOLD" message) for orders with status "editing".
- **FR-009**: Kitchen display MUST disable the "Mark Complete" button for orders being edited.
- **FR-010**: System MUST provide a Cancel button to abort the edit and restore the original order state.
- **FR-011**: Mobile navigation MUST display "Orders" instead of "Close Out" for the third tab.
- **FR-012**: Mobile Orders view MUST display the same Edit button functionality as desktop Tab Orders.
- **FR-013**: System MUST prevent saving an edit if all items have been removed from the order.
- **FR-014**: Kitchen display MUST update in real-time when order items change during an edit.

### Key Entities

- **Order**: Represents a submitted order with status (in_progress, editing, complete), associated tab, notes, and timestamps. The `edited_by` field may track who is editing.
- **Order Item**: Individual line items within an order, containing menu item reference, quantity, price at time of order, and optional notes.
- **Order Draft**: Client-side temporary state representing the items being added/modified before submission or during editing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can initiate an edit on an in-progress order within 1 tap/click from the Tab Orders section.
- **SC-002**: Kitchen staff can identify orders being edited at a glance without reading detailed status text (distinct visual treatment).
- **SC-003**: Order edits are reflected on the kitchen display within 2 seconds of saving.
- **SC-004**: 100% of edit operations on in-progress orders complete successfully without data loss.
- **SC-005**: Mobile users have full edit functionality parity with desktop users.
- **SC-006**: Zero food waste incidents occur due to kitchen preparing items from orders being edited (editing indicator prevents premature preparation).
