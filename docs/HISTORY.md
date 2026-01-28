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
