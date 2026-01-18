# Material 3 UI Overhaul Plan

## Goal

Convert the entire ProSpine Mobile App to use Material Design 3 (M3) principles, including:

- **Dynamic Color System** (Teal-based theme)
- **Typography** (Inter with M3 scales)
- **Expressive Animations** (Emphasized easings, staggered entrances)
- **M3 Components** (Cards, Lists, Navigation, Inputs)

## Progress Tracker

### Phase 1: Foundation & Setup

- [x] **Tailwind Config**: Add M3 semantic colors (`primary`, `surface`, `tertiary`) and easing curves (`emphasized`).
- [x] **Splash Screen**: Update to M3 layout with expressive animations and dynamic background blobs.

### Phase 2: Authentication & Core

- [x] **Login Screen**:
  - Use M3 `OutlinedTextField` styles.
  - Implement `FilledButton`.
  - Add expressive page transition.
- [ ] **Data Stores**: Ensure state persists correctly (already done in previous fix, but double-check UI binding).

### Phase 3: Main Navigation & Dashboard

- [ ] **App Layout**:
  - Implement M3 `NavigationBar` (Bottom Tab Bar) with pill indicators.
  - Handle Safe Area insets globally.
- [ ] **Dashboard**:
  - Convert Summary Cards to M3 `ElevatedCard`.
  - Use M3 `ActionChip` or `FilterChip` for quick actions.
  - animate entry of dashboard widgets.

### Phase 4: Feature Screens (Patient, Billing, Etc.)

- [ ] **Patient List**: Use M3 `ListItem` with leading avatars and trailing icon buttons.
- [ ] **Forms**: Standardize all input forms (`Registration`, `AddTest`, etc.) to use M3 Input styles.
- [ ] **Modals/Dialogs**: Convert generic modals to M3 `AlertDialog` or `FullScreenDialog` with proper rounded corners (28px) and scrim.

### Phase 5: Polish

- [ ] **Ripple Effects**: Add ripple feedback to all interactive elements.
- [ ] **Transitions**: Ensure smooth page transitions using `Framer Motion` or pure CSS transitions with M3 curves.
- [ ] **Dark Mode**: Verify M3 Dark Theme colors (automatically handled if semantic colors are defined for `.dark`).

## Design Tokens (Reference)

### Colors (Teal Theme)

- **Primary**: `#006A60` (Teal 700)
- **Secondary**: `#4A635F`
- **Tertiary**: `#456179`
- **Surface**: `#F7FAF9`
- **Error**: `#BA1A1A`

### Animation Easings

- **Standard**: `cubic-bezier(0.2, 0.0, 0, 1.0)`
- **Emphasized**: `cubic-bezier(0.2, 0.0, 0, 1.0)` (for entrances)
- **Emphasized Decelerate**: `cubic-bezier(0.05, 0.7, 0.1, 1.0)` (for complex moves)
