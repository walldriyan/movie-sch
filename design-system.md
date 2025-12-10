# Suno-Inspired Premium Dark Design System Specification

## 1. Overview & Philosophy
This design system mimics a premium, cinematic, "Suno.com-like" experience. It relies heavily on dark backgrounds, subtle glassmorphism (transparency + blur), high-quality gradients, and smooth micro-interactions.

**Keywords:** Premium, Dark Mode, Glassmorphism, Cinematic, Smooth, Minimalist Borders.

---

## 2. Technology Stack
To replicate this exact look, use the following stack:
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React
- **Animation:** tailwindcss-animate (standard with shadcn) & standard CSS transitions.

---

## 3. Core Design Tokens (The "DNA")

### Colors
- **Background:** Pure Black (`#000000`) or Very Dark Zinc (`#09090b`).
- **Foreground (Text):** White (`#ffffff`) for headings, Muted (`#a1a1aa`) for secondary text.
- **Accents:** 
    - *Primary:* White/Grey Glow (`bg-white/10`).
    - *Premium/Gold:* Amber Gradients (`from-amber-500 to-amber-700`).
- **Borders:** Extremely subtle. Do not use solid gray borders. Use opacity.
  - Value: `border-white/5` or `border-white/10`.

### Radius & Spacing
- **Container Radius:** `rounded-3xl` (32px) for main panels/cards.
- **Inner Radius:** `rounded-2xl` (24px) or `rounded-xl` (16px).
- **Padding:** Generous padding (`p-6`, `p-8`) to let content breathe.

### Effects (Glassmorphism)
- Use standard backdrop blur utilities.
- Class: `bg-black/40 backdrop-blur-md border border-white/10`.

---

## 4. UI Components Specification

### A. The Sidebar (Left Navigation)
- **Position:** Sticky (`sticky top-0 h-screen`).
- **Style:** Minimalist, no heavy background color. 
- **Active State:** No big background blocks. Use text color change or subtle pill shape `bg-primary/10`.
- **Icons:** `w-5 h-5` or `w-6 h-6`, slightly muted, turning white on hover.

### B. Cards (Post/Movie Cards)
- **Image:** Rounded corners, `aspect-video` or `aspect-[2/3]`.
- **Hover Effect:** 
  - Scale Image: `group-hover:scale-105`
  - Duration: `duration-500` (slow, smooth).
  - Glow: `group-hover:ring-2 ring-primary/20`.
- **Content:** Title below image, subtle details.

### C. Details Page (Watch Page)
- **Hero Section:** Full width or massive rounded container `rounded-3xl`.
- **Background:** `bg-muted/10` or a very subtle gradient.
- **Tabs:** `bg-muted/50 rounded-xl p-1`. Transitions: `animate-in fade-in slide-in-from-left-4`.

### D. Animations
- **Page Load:** `animate-in fade-in duration-700`.
- **Hover:** `transition-all duration-300 ease-in-out`.
- **Tab Switching:** `animate-in zoom-in-95 duration-300`.

---

## 5. Master Prompt (Copy & Paste this to AI)

Use the following prompt when asking an AI (like ChatGPT, Claude, or Gemini) to build a new project with this exact style:

```markdown
**Role:** Expert UI/UX Engineer specialized in Next.js, Tailwind CSS, and shadcn/ui.

**Objective:** Build a web application with a "Premium Dark Glassmorphism" aesthetic (similar to Suno.com or modern streaming platforms).

**Design Rules (Strictly Follow):**

1.  **Base Theme:**
    - Force Dark Mode by default. Background should be `bg-black` or `bg-zinc-950`.
    - Text should be `text-zinc-100` (primary) and `text-zinc-400` (secondary).

2.  **Container Styling (The "Glass" Look):**
    - Do NOT use solid gray backgrounds for cards.
    - Use transparency with borders: `bg-white/[0.02] border border-white/10`.
    - For higher contrast areas (sidebars/modals): `bg-black/40 backdrop-blur-md`.
    - Radius: Use `rounded-3xl` for main layout areas, `rounded-2xl` for cards.

3.  **Interactions & Animations:**
    - Buttons: Rounded full (`rounded-full`). Hover should glow (`shadow-[0_0_20px_rgba(255,255,255,0.1)]`).
    - Images: Wrap in `overflow-hidden`. On hover -> `scale-105 duration-500 ease-out`.
    - Page Transitions: Use `animate-in fade-in duration-500`.

4.  **Layout Structure:**
    - **Left Sidebar:** Sticky, clean typography, `gap-4`, icons `w-5 h-5`.
    - **Main Feed:** Grid layout (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4`).
    - **Gradients:** Use subtle ambient glows (e.g., `bg-gradient-to-t from-black via-black/50 to-transparent`) over images.

5.  **Specific Components:**
    - **Filter Bar:** Floating glass pill `rounded-full border border-white/10 bg-black/20 backdrop-blur`.
    - **Premium Elements:** Use `amber-500` gradient text or borders (`border-amber-500/20`) for "Gold/Premium" features.

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React, shadcn/ui.
```

---

## 6. CSS Snippets (For Global CSS)

If you need the exact smooth scrolling and font smoothing:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%; /* Zinc 950 */
    --foreground: 0 0% 98%;
    /* ... shadcn defaults ... */
    --radius: 1rem; /* Base radius for consistency */
  }
 
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Hide scrollbars but allow scrolling for clean UI */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```
