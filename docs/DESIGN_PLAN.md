# Liquid Glass (iOS 26 Concept) Design Plan

## Overview
To transition the current "Personal Portfolio" design to a "Liquid Glass" aesthetic (inspired by futuristic iOS concepts), we need to focus on translucency, blur, deep depth (3D layers), and vivid, fluid gradients.

## Tech Stack Requirements
The current stack (React, TailwindCSS, Vite) is perfect. No changes in core technology are needed, but we will need:
-   **TailwindCSS**: Already installed. We might need plugins for advanced glassmorphism if not writing custom CSS.
-   **Framer Motion** (Recommended): For fluid, physics-based animations (springs) that characterize "Liquid" interfaces.
-   **CSS Modules / Global CSS**: For complex glass effects (`backdrop-filter`, `mix-blend-mode`, `mesh-gradients`).

## Implementation Steps

### 1. Design System Tokens (The "Liquid" Theme)
We need to define new CSS variables for:
-   **Glass Surfaces**: High transparency (e.g., `rgba(255, 255, 255, 0.1)`), heavy blur (`backdrop-filter: blur(20px)`), and thin, bright borders for edges (simulation of light refraction).
-   **Depth**: Multiple layers of depth using `z-index` and shadow stacking.
-   **Colors**: Move away from solid muted backgrounds to **Mesh Gradients** and **Aurora Backgrounds** that move slowly.

### 2. Global CSS Changes
Update `index.css`:
-   **Background**: Add a global animated mesh gradient background that is visible through the glass components.
-   **Glass Utility Class**:
    ```css
    .glass-panel {
        background: rgba(255, 255, 255, 0.05); /* or black for dark mode */
        backdrop-filter: blur(16px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }
    ```

### 3. Component Redesign
-   **App Container**: Remove solid background.
-   **Cards (AssetRow, SummaryCard)**: Convert to "Glass Cards". Floating elements with soft shadows.
-   **Bottom Navigation**: Detached "Floating Island" design instead of a fixed bar at the bottom.
-   **Typography**: Use thinner, wider weights (like SF Pro Display Light/Regular) to let the background breathe.

### 4. Interactive Elements ("Liquid" Feel)
-   **Buttons**: Glossy, pill-shaped, with inner shadows to simulate 3D volume (Use `box-shadow: inset ...`).
-   **Feedback**: "Water ripple" click effects (already in Material Design, but need to be more fluid).
-   **Scroll**: Smooth scrolling with momentum (optional, browser default is usually fine on iOS).

## Action Plan
1.  **Phase 1 (Foundation)**: Create the animated background and basic Glass utility classes in `index.css`.
2.  **Phase 2 (Components)**: Update `SummaryCard` and `AssetRow` to use the new `.glass-panel` class.
3.  **Phase 3 (Navigation)**: Redesign `BottomNav` to be a floating glass capsule.
4.  **Phase 4 (Polish)**: Add `framer-motion` for page transitions and list entry animations.
