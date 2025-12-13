# Premium Admin Panel Design System (iPad OS / Glassmorphism)

This document contains the complete design system, aesthetic values, and code patterns used to build the premium Admin Panel. You can use the **Master Prompt** below to instruct an AI to recreate this exact style in another project.

---

## 🚀 Master Prompt for AI

Copy and paste this prompt to generate this design style in any Next.js/Tailwind project:

```text
I need you to build a premium, "iPad OS" style Admin Panel for my Next.js & Tailwind CSS application. 
The design must be strictly based on the following Design System:

### 1. Core Aesthetic (Glassmorphism & Dark Mode)
- **Theme**: Deep Dark Mode (Background: `#09090b` or similar).
- **Glass Effect**: All containers/cards must use `bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl`.
- **Roundness**: Use `rounded-2xl` for containers and `rounded-xl` for inner elements. Heavy use of rounded corners is mandatory.
- **Micro-Interactions**: Hover effects should be subtle lifts (`hover:scale-[1.01]`) or brightness increases (`hover:bg-white/10`).

### 2. Layout Structure (Floating Sidebar)
- **Sidebar**:
  - Position: Fixed, floating (not attached to screen edges). e.g., `fixed left-4 top-4 bottom-4`.
  - Style: Glassmorphic (`bg-card/60 backdrop-blur-xl`), Rounded (`rounded-2xl`).
  - Behavior: Collapsible to icons-only, expanding to full width (260px).
- **Main Content**:
  - Must respect the floating sidebar. Use dynamic margins (e.g., `ml-[100px]` or `ml-[280px]`).
  - Max Width: `max-w-[1600px]`, centered.

### 3. Typography & Gradients
- **Headers**: Use gradient text for main page titles.
  - Class: `bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60`.
  - Font: Bold/Extrabold.
- **Subtext**: `text-muted-foreground` (approx `text-white/60`).

### 4. Components Guide
- **Cards**: NEVER use flat solid colors. Always use the Glass Effect defined above.
- **Tabs**: 
  - List Container: `bg-white/5 p-1 rounded-xl backdrop-blur-md`.
  - Triggers: Pill-shaped (`rounded-lg`), active state uses vibrant gradients (e.g., `from-indigo-500 to-purple-600`).
- **Tables**:
  - Header: Transparent, text-white/50.
  - Rows: Border-bottom `border-white/5`, `hover:bg-white/5`.
- **Dialogs/Modals**:
  - Background: `bg-[#0a0a0b]/95` with `backdrop-blur-2xl`.
  - Border: `border-white/10`.

Please implement the admin pages using these exact strict design rules.
```

---

## 🎨 Component Implementation Reference

### 1. The Glass Card (Standard Container)
Use this for almost every content block.
```tsx
<Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-xl rounded-2xl overflow-hidden">
  <CardHeader className="border-b border-white/5 pb-4">
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### 2. Gradient Header Text
```tsx
<h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60">
  Page Title
</h1>
```

### 3. Premium Tabs
```tsx
<TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-xl shadow-lg inline-flex">
  <TabsTrigger 
    value="tab1" 
    className="px-6 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium transition-all"
  >
    Tab 1
  </TabsTrigger>
</TabsList>
```

### 4. Floating Sidebar (Layout Idea)
The sidebar should separate itself from the layout flow.
```tsx
// Sidebar Container classes
className={cn(
  "fixed left-4 top-4 h-[calc(100vh-2rem)] z-40",
  "bg-card/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl",
  "transition-all duration-300",
  isCollapsed ? "w-[80px]" : "w-[260px]"
)}
```

### 5. Stats Card (Gradient Accent)
For dashboard statistics.
```tsx
<Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 backdrop-blur-xl shadow-lg rounded-2xl">
  <div className="text-3xl font-bold text-primary">1,234</div>
</Card>
```

---

## 🛠 Color Palette Notes
This system relies heavily on **opacity** rather than fixed hex codes.
- **Base Background**: `#09090b` (Default Shadcn/Tailwind 'background')
- **Glass Layer**: `bg-white` with `opacity-5` (5%) or `opacity-10`.
- **Borders**: `border-white/10` (10% opacity white) is the golden rule for subtle separation.
