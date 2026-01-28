# Project Audit & Improvement Plan

## 1. Structural Improvements

### Frontend Architecture
-   **State Management**: Currently, `App.tsx` holds too much state (`user`, `transactions`, `prices`, `loading`, etc.). This causes unnecessary re-renders.
    -   *Proposal*: Use **React Context** for global state (UserSession, Theme) and **TanStack Query (React Query)** for server state (Transactions, Prices). This handles caching, loading, and error states automatically.
-   **Component Split**:
    -   `LoginPage.tsx` is huge (~400 lines). It handles login, registration, and reset password.
    -   *Proposal*: Split into `LoginForm`, `RegisterForm`, and `ResetPasswordForm`.
-   **Routing**: The app uses conditional rendering (`tab === ...`) for navigation.
    -   *Proposal*: Use **React Router** (`react-router-dom`). This enables deep linking (e.g., refreshing keeps you on the same tab) and better code splitting.

### Backend Architecture
-   **Monolithic `server.js`**: All logic (auth, transactions, prices) is in one file (~1000 lines).
    -   *Proposal*: Refactor into:
        -   `routes/auth.js`
        -   `routes/transactions.js`
        -   `routes/prices.js`
        -   `middleware/auth.js`
-   **Validation**: Zod schemas are defined in `server.js`. Move them to a shared `validation.js` or `types` file (if possible to share with frontend).

### Code Quality
-   **Types**: Some `any` types exist. `types.ts` has good definitions but they aren't used everywhere (e.g., in API calls).
-   **Hardcoded Strings**: All text is hardcoded in Persian.
    -   *Proposal*: Create a simple `i18n` dictionary or use `react-i18next` to make text management easier.

## 2. Visual Improvements (Liquid Glass / iOS 26)

### Design System (Detailed)
-   **Background**: Replace the solid/simple gradient background with a **Mesh Gradient** that breathes (animates slowly properties).
-   **Glass Effect**:
    -   Current: `backdrop-filter: blur(20px)`
    -   Liquid: Needs layered depth.
        -   Layer 1 (Background): Animated Mesh.
        -   Layer 2 (Content): `backdrop-filter: blur(40px) saturate(200%)`.
        -   Borders: `1px solid rgba(255,255,255, 0.2)` (Top/Left) and `0.05` (Bottom/Right) to simulate light source.
-   **Typography**: Switch to a variable font that allows thinner weights for large display text (iOS style).

### Micro-interactions
-   **Spring Animations**: Use `framer-motion` for:
    -   List items appearing (staggered).
    -   Modals springing up from the bottom.
    -   Numbers rolling like a slot machine when updating.

## 3. Recommended Roadmap

1.  **Phase 1 (Refactor)**: Split `server.js` and implement React Query. This stabilizes the foundation.
2.  **Phase 2 (Design)**: Implement the "Liquid Glass" CSS variables and backgrounds.
3.  **Phase 3 (Animation)**: Add `framer-motion` and refactor page transitions.
