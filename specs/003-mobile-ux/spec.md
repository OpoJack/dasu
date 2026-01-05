# Feature Specification: Mobile UX & Tab Management

**Feature Branch**: `003-mobile-ux`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "This app is meant to run on either a phone, tablet or desktop screen. It seems the desktop and tablet view are fine, but the mobile view is unusable. You're going to make it feel good to use on the phone. After that, I noticed there's no way to close tabs in the UI. We need this functionality, probably just after the tab's grand total. Additionally, in the Tab Orders view, I want the Total to always be viewable so the user can scroll through the items in the order, but always be able to see the total."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile-Friendly Navigation (Priority: P1)

FOH staff using a phone need to navigate between tabs, menu, and current order without the cramped three-column layout. On mobile, the interface should adapt to show one primary view at a time with easy navigation between sections.

**Why this priority**: The app is currently unusable on mobile. Staff using phones cannot effectively take orders, making this the most critical fix.

**Independent Test**: Open the app on a mobile device (or browser in mobile viewport). User can navigate between Open Tabs, Menu, and Current Order views without content being cramped or cut off.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (under 768px), **When** the FOH page loads, **Then** only one primary section is visible at a time with navigation to switch between sections
2. **Given** a mobile viewport, **When** user taps on a tab from the tab list, **Then** the view transitions to show the menu for that tab
3. **Given** a mobile viewport with items in the current order, **When** user navigates to the order view, **Then** they see all order items with the ability to modify quantities and submit
4. **Given** a tablet or desktop viewport (768px and above), **When** the FOH page loads, **Then** the existing multi-column layout remains unchanged

---

### User Story 2 - Sticky Tab Total in Tab Orders View (Priority: P2)

When viewing the Tab Orders section (list of orders for a tab), the grand total should always be visible at the bottom of the view, even when scrolling through a long list of orders.

**Why this priority**: Ensures FOH staff can always see the running total when reviewing a customer's bill, improving checkout efficiency.

**Independent Test**: Select a tab with multiple orders that exceed the visible area. Scroll through the orders and verify the total remains pinned at the bottom.

**Acceptance Scenarios**:

1. **Given** a selected tab with orders that exceed the viewable area, **When** user scrolls through the Tab Orders list, **Then** the grand total remains fixed/sticky at the bottom of the section
2. **Given** a selected tab with few orders, **When** viewing Tab Orders, **Then** the total displays normally at the bottom (no unnecessary sticky behavior)

---

### User Story 3 - Close Tab Functionality (Priority: P3)

FOH staff need the ability to close out a tab when a customer has paid and is leaving. The close action should be accessible from the Tab Orders view, near the grand total.

**Why this priority**: Essential for completing the customer lifecycle, but staff can work around this temporarily. Placed after mobile fixes since mobile usability blocks all workflows.

**Independent Test**: Select a tab, view Tab Orders section, and close the tab using the close button near the grand total.

**Acceptance Scenarios**:

1. **Given** a selected tab with orders, **When** user views the Tab Orders section, **Then** a "Close Tab" button is visible near the grand total
2. **Given** user clicks "Close Tab", **When** prompted, **Then** user must confirm the action before the tab is closed
3. **Given** user confirms closing a tab, **When** the action completes, **Then** the tab is removed from Open Tabs list and the view resets to show no tab selected
4. **Given** a tab with in-progress orders (not yet completed by kitchen), **When** user attempts to close the tab, **Then** a warning is shown indicating active orders exist

---

### Edge Cases

- What happens when user rotates device from portrait to landscape on mobile? Layout should adapt smoothly without losing current view state
- How does the mobile navigation handle page refresh? Should restore to the tabs list view as a sensible default
- What if a tab is closed while another user is viewing it? Real-time update should remove it from their view and clear selection
- What happens when closing a tab with orders in "editing" status? Should warn about active editing along with incomplete orders

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a single-column layout on viewports under 768px wide
- **FR-002**: System MUST provide navigation controls (bottom tabs or similar) to switch between Open Tabs, Menu, and Current Order views on mobile
- **FR-003**: System MUST preserve all existing functionality (tab selection, menu browsing, order building, order submission) in mobile view
- **FR-004**: System MUST maintain the existing multi-column layout on viewports 768px and wider
- **FR-005**: System MUST display the Tab Orders grand total in a sticky/fixed position at the bottom of the Tab Orders section when content is scrollable
- **FR-006**: System MUST provide a "Close Tab" action in the Tab Orders view near the grand total
- **FR-007**: System MUST require confirmation before closing a tab
- **FR-008**: System MUST warn users when attempting to close a tab that has orders with status other than "complete"
- **FR-009**: System MUST remove closed tabs from the Open Tabs list immediately after closure
- **FR-010**: System MUST update the UI to reflect no selected tab after closing the currently selected tab

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: FOH staff can complete a full order workflow (select tab, add items, submit order) on a mobile phone without horizontal scrolling or content overflow
- **SC-002**: Users can view the tab total at all times while scrolling through orders, without needing to scroll to the bottom
- **SC-003**: Users can close tabs in under 5 seconds (2 taps: Close Tab button + Confirm)
- **SC-004**: Mobile navigation between sections takes no more than 1 tap per transition
- **SC-005**: All existing desktop/tablet functionality remains unchanged and accessible

## Assumptions

- Mobile breakpoint of 768px is appropriate for distinguishing phone from tablet/desktop
- Tab closure updates the tab status to "closed" (data remains in database for historical purposes) rather than deleting records
- Confirmation dialog for tab closure is a simple modal, not requiring additional authentication
- Mobile navigation will use a bottom navigation bar pattern common to mobile apps
