# Protocol for AI Agents

## Objective
This file serves as a guide for any AI agent working on this project. The goal is to maintain continuity and context.

## Documentation Rules
1.  **Read Context**: Before starting any task, read `docs/HISTORY.md` and `docs/CONTEXT.md` (if it exists) to understand the latest changes.
2.  **Log Changes**: After completing a task, append a new entry to `docs/HISTORY.md` following the [Date] Format.
    -   List Bug Fixes, Features, Refactoring, and Docs updates.
3.  **Update Plans**: If you change the design or architecture, update `docs/DESIGN_PLAN.md` or create a new plan file.

## Project Structure
-   **Frontend**: React (Vite) + TailwindCSS.
-   **Backend**: Node.js (Express) + SQLite (`database.js`).
-   **State Management**: React State + Prop Drilling (currently).
-   **Key Components**:
    -   `App.tsx`: Main logic and state.
    -   `HoldingsTab.tsx`: Assets list.
    -   `AssetRow.tsx`: Single asset display (with expansion for transactions).
    -   `TransactionModal.tsx`: Add/Edit form.

## Common Tasks & "Gotchas"
-   **Adding Assets**: There is a FAB in `HoldingsTab`.
-   **Editing**: `App.tsx` handles the `isTxModalOpen` state. Ensure you trigger it correctly.
-   **Prices**: Fetched from `server.js` (AlanChand/Telegram) and passed via `App.tsx`.
-   **USD Prices**: Calculated in `App.tsx` and passed to `AssetRow` via `transactions` or `AssetSummary`.

## User Communication
-   Always inform the user that you have updated the documentation.
-   If you are unsure about a request, ask for clarification before editing code.
