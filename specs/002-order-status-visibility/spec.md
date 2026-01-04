# Feature Specification: Order Status Visibility & Timing Indicators

**Feature Branch**: `002-order-status-visibility`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "We have a functional application, now we need to get deeper into the capabilities. First and foremost, the front of house needs to be able to see the status of each order submitted to the kitchen. Each order should display its own status. Their total cost must also be shown at all times. The total itself can be shown in the Open Tabs row, a more detailed breakdown view should be accessible. Next, both sides of the kitchen should know how long an order has been submitted for, to better prioritize. Let's say <6 minutes is normal, >6 <12 is getting long, and >12 is bad. The UI should indicate this."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - FOH Sees Order Status on Tab (Priority: P1)

Front of house staff need to see the current status of each order they've submitted to the kitchen. When viewing an open tab, each order should clearly display whether it's in progress, being edited, or complete. This allows staff to answer customer questions like "is my food almost ready?" and coordinate service.

**Why this priority**: This is the core visibility improvement - without seeing order status, staff are operating blind and must physically check with kitchen or wait for completion notifications.

**Independent Test**: Can be tested by submitting an order, viewing the tab, and confirming the order status is visible. Status should update in real-time when kitchen marks complete.

**Acceptance Scenarios**:

1. **Given** a tab with a submitted order, **When** FOH views the tab details, **Then** the order displays its current status (in progress, editing, or complete)
2. **Given** an order is marked complete by kitchen, **When** FOH is viewing the tab, **Then** the status updates to "complete" without page refresh
3. **Given** a tab with multiple orders, **When** FOH views the tab, **Then** each order shows its individual status

---

### User Story 2 - Tab Total Always Visible (Priority: P1)

Front of house staff need to see the running total for each open tab at a glance, displayed in the Open Tabs list. This enables quick cost checks when customers ask "what's my bill?" without navigating into tab details.

**Why this priority**: Equally critical to order status - staff need instant access to totals for customer service and closing tabs efficiently.

**Independent Test**: Can be tested by opening a tab, adding orders, and confirming the total appears in the Open Tabs sidebar without clicking into the tab.

**Acceptance Scenarios**:

1. **Given** an open tab with orders, **When** FOH views the Open Tabs list, **Then** the tab displays its current total cost
2. **Given** a new order is submitted to a tab, **When** the Open Tabs list refreshes, **Then** the total updates to include the new order
3. **Given** a tab with no orders, **When** FOH views the Open Tabs list, **Then** the tab displays $0.00 as the total

---

### User Story 3 - Detailed Tab Breakdown View (Priority: P2)

Front of house staff need access to a detailed breakdown view for each tab showing all orders, their individual items, prices, and subtotals. This supports end-of-service scenarios where customers want to review charges before closing their tab.

**Why this priority**: Important for customer service but less urgent than at-a-glance totals - used primarily at checkout rather than throughout service.

**Independent Test**: Can be tested by clicking into a tab and viewing a complete itemized breakdown with prices and order timestamps.

**Acceptance Scenarios**:

1. **Given** a tab with multiple orders, **When** FOH accesses the detailed breakdown, **Then** each order is listed with its items, quantities, individual prices, and order subtotal
2. **Given** a tab breakdown view, **When** viewing, **Then** the grand total matches the sum of all order subtotals
3. **Given** a tab with completed and in-progress orders, **When** viewing breakdown, **Then** order status is visible alongside each order's details

---

### User Story 4 - Order Age Timing Indicators (Priority: P1)

Both front of house and kitchen staff need visual indicators showing how long each order has been waiting. Orders under 6 minutes appear normal, 6-12 minutes indicate getting long (warning), and over 12 minutes indicate a problem (urgent). This helps prioritize which orders need attention.

**Why this priority**: Critical for service quality - prevents orders from being forgotten and helps staff prioritize their work effectively.

**Independent Test**: Can be tested by submitting an order and observing the visual indicator change as time passes (or by manipulating test data with older timestamps).

**Acceptance Scenarios**:

1. **Given** an order submitted less than 6 minutes ago, **When** viewed on either FOH or Kitchen, **Then** the timing indicator shows normal status (no warning color)
2. **Given** an order submitted between 6 and 12 minutes ago, **When** viewed on either FOH or Kitchen, **Then** the timing indicator shows warning status (distinct visual treatment)
3. **Given** an order submitted more than 12 minutes ago, **When** viewed on either FOH or Kitchen, **Then** the timing indicator shows urgent status (prominent warning visual)
4. **Given** a completed order, **When** viewed, **Then** no timing indicator is shown (timing only matters for active orders)

---

### Edge Cases

- What happens when viewing a tab with orders spanning all three timing states (normal, warning, urgent)? Each order displays its own timing state independently.
- How does the system handle orders that were edited - does timing reset or continue from original submission? Timing continues from original submission (does not reset).
- What happens to timing display when an order is marked complete? Timing indicator is removed; completed orders show completion timestamp instead.
- How are timing indicators displayed for orders submitted before the app was opened (e.g., after a page refresh)? Timing is calculated from the stored submission timestamp, so it displays accurately regardless of when the page was loaded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display individual order status (in progress, editing, complete) within each tab's view
- **FR-002**: System MUST display the running total cost for each tab in the Open Tabs list
- **FR-003**: System MUST provide a detailed breakdown view showing all orders, items, quantities, individual prices, and subtotals for each tab
- **FR-004**: System MUST display elapsed time since order submission on both FOH and Kitchen displays
- **FR-005**: System MUST visually distinguish orders by age: normal (<6 minutes), warning (6-12 minutes), urgent (>12 minutes)
- **FR-006**: System MUST use consistent timing indicator visuals across FOH and Kitchen views
- **FR-007**: System MUST update order status in real-time without requiring page refresh
- **FR-008**: System MUST update timing indicators periodically without requiring manual refresh
- **FR-009**: System MUST hide timing indicators for completed orders
- **FR-010**: System MUST preserve original submission time for edited orders (timing does not reset on edit)

### Key Entities

- **Order**: Extended to prominently display status and submission time for age calculation
- **Tab**: Extended to show calculated total across all orders
- **Timing Indicator**: Visual element showing order age state (normal/warning/urgent) based on elapsed time thresholds

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: FOH staff can determine any order's status within 2 seconds of viewing a tab
- **SC-002**: FOH staff can see tab total without navigating into tab details
- **SC-003**: 100% of active orders display accurate timing indicators on both FOH and Kitchen views
- **SC-004**: Timing indicators update at least every 30 seconds to reflect current age state
- **SC-005**: Staff can identify orders needing urgent attention (>12 minutes) at a glance from color/visual treatment alone

## Assumptions

- Timing thresholds (6 min, 12 min) are fixed and do not need to be configurable
- Tab totals are calculated from order items using price_at_order (already captured)
- The existing real-time subscription infrastructure can be extended for status updates
- Timing indicator colors will follow existing UI patterns (e.g., yellow for warning, red for urgent)
- Editing an order does not reset its submission time - the original created_at is used for timing
