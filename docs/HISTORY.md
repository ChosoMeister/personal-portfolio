# Project History

## [2026-01-28] Fixes and Features Implementation

### Bug Fixes
- **Asset Editing**: Fixed `TransactionModal` not opening during edit. Updated `App.tsx` `onEditTransaction` to set `isTxModalOpen(true)`.
- **Asset Adding**: Added a Floating Action Button (FAB) in `HoldingsTab` to allow adding new assets even when the portfolio is not empty.

### Features
- **Dual Currency Display**: Updated `AssetRow` to display USD price alongside Toman price for Crypto, Gold, and Fiat assets. Added `currentPriceUsd` to `AssetSummary` and updated `App.tsx` to calculate it.
- **Lot-based P&L**: Implemented "Profit/Loss per Purchase" view.
    - Passed raw `transactions` down to `HoldingsTab` and `AssetRow`.
    - Added expansion logic to `AssetRow` to show the list of transactions (lots) associated with that asset.
    - Calculated P&L for each individual transaction based on current price and estimated historical cost.

### Refactoring
- **Prop Drilling**: Passed `transactions` prop from `App.tsx` through `HoldingsTab` to `AssetRow`.
- **Types**: Updated `types.ts` to include `currentPriceUsd`.

### Documentation
- Created `docs` folder.
- Established this history log.

## [2026-01-28] UI/UX Regressions Fix & Theme Polish

### Bug Fixes
- **Layout Alignment**: Fixed desktop layout shifting to the right by removing hardcoded `max-w-[480px]` from `index.html` and implementing `max-w-[520px] mx-auto` in `Layout.tsx`.
- **Theme Rendering**: Fixed broken themes (`ocean`, `sunset`, `forest`) by defining missing CSS variables in `index.css` and updating `DashboardPage.tsx` to handle `data-theme` and `dark` class correctly.
- **Card Heights**: Equalized heights of "Best Performance" and "Worst Performance" cards in `OverviewTab.tsx`.
- **Padding**: Removed extra `px-2` padding in `OverviewTab` header to align with other tabs.

### UI Polish
- **Bottom Nav Glow**: Restored the blue "aura" glow effect in `BottomNav.tsx`.
- **Summary Card**: Darkened `SummaryCard` background (`bg-black/5 dark:bg-black/20`) for better visual distinction.
- **FAB Positioning**: Lifted the "Add Transaction" FAB in `HoldingsTab.tsx` to avoid overlapping the bottom navigation.

### Refactoring
- **Layout**: Centralized layout width constraints in `Layout.tsx` component instead of `index.html`.

### Visual Consistency Updates (Latest)
- **App Container**: Added `bg-white/30` (light) and `bg-black/30` (dark) with `backdrop-blur-xl` to the main `Layout.tsx` container. This ensures the "App Window" has a consistent background across all tabs, distinguishing it from the body wallpaper.
- **Empty State**: Increased content width in `EmptyState.tsx` (from `280px` to `80%`) to match the visual weight of other tab contents.

## [2026-01-28] Critical Bug Fixes

### Bug Fixes
- **Transaction Replacement Bug**: Fixed a critical bug where adding a new asset would replace the previous one instead of adding to the list. Root cause: `TransactionModal.tsx` was not generating a unique ID for new transactions (the `id` field was omitted). Added unique ID generation using `Date.now()` and `Math.random()` to ensure each new transaction is distinct.
- **Page Size Consistency**: Standardized padding across all tabs (`OverviewTab`, `HoldingsTab`, `TransactionsTab`). Changed wrapper padding from mixed `p-4` to consistent `px-4 pt-4` pattern, ensuring all tabs have identical content width.
- **Responsive Layout**: Implemented truly responsive design. On mobile/tablet (screens < 1024px), the app is full-width and edge-to-edge with solid background color (`--app-bg`). On desktop (lg+ screens >= 1024px), the app uses a fixed 520px width, centered, with glassmorphism effects, borders, and shadows.
- **Docker Build Fixes**: Fixed broken Dockerfile that referenced non-existent files. Updated to use `server/index.js` as entry point. Removed unused `adminInit.js` import from `server/index.js`. Created `.env` file with test credentials (`admin`/`admin123`).
- **Registration Auto-Login**: Fixed issue where users had to manually login after registration. Register endpoint now returns JWT tokens for automatic authentication.
- **Rate Limit for Development**: Increased auth rate limit from 5 to 50 attempts per 15 minutes to enable easier testing.
- **Consistent Layout Sizing**: Created dedicated `.app-container` CSS class with fixed max-width (480px), min-width (320px), and proper glass styling. Also created `.tab-content` class for consistent tab sizing. This ensures layout never changes when content is added or modals are opened.
- **Login State Fix**: Fixed critical bug where users had to refresh page after login. Root cause: `LoginPage` was calling empty `onLoginSuccess={() => {}}` instead of using AuthContext. Updated `LoginPage.tsx` to use `useAuth()` hook for `login()` and `register()` functions, which properly updates React state.
- **Unified Tab Padding**: Standardized all tabs (Overview, Holdings, Transactions) to use identical `p-4 pb-20` wrapper structure, preventing size inconsistencies when switching between tabs or adding new assets.
- **Pixel-Perfect Layout Fix**: Eliminated 100+ pixel layout shift between Overview and Transactions tabs. Root cause was `.app-container` shrinking to fit content (`min-width: 320px`) on tabs with less content. Fixed by enforcing `width: 100%` on `html`, `body`, `#root` and `.app-container` in `index.css` to ensure consistent 480px width (or full viewport width) regardless of content.
- **UI Polish**:
    - **Darker Theme**: Deepened background colors to `bg-[#020c1b]` for valid OLED dark mode.
    - **Modern Bottom Nav**: Centered "Overview", added subtle blue glow for active state. Swapped "Holdings" and "Transactions" positions as requested. Reverted "Overview" icon size to standard (same as others) to prevent clipping.
    - **FAB Position**: Raised floating action button in Holdings tab to prevent overlap with bottom nav.
- **Price Update Logic**: Fixed "Update" button to explicitly trigger `API.refreshLivePrices()` (bypassing cache) and implemented transient "Sources" text that appears only during/after update and clears on refresh.
- **PWA Fixes (Phase 2)**: Added `apple-touch-icon.png` and injected critical CSS (Background Color) into `index.html` to eliminate iOS white screen flash.
- **ETC Price Fallback**: Implemented automatic fallback to CoinGecko for Ethereum Classic (ETC) if the primary source returns 0 or fails.
