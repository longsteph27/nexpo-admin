# NEXPO Color System

This document outlines the comprehensive color system defined in `tailwind.config.ts` for consistent usage across all screens and components.

## 🎨 Color Categories

### 1. NEXPO Brand Colors

#### Primary Brand Colors (`nexpo-primary-*`)
```css
/* Light to Dark */
nexpo-primary-50   /* #EEF4FF - Very light blue */
nexpo-primary-100  /* #E0ECFF - Light blue */
nexpo-primary-200  /* #C7DBFF - Lighter blue */
nexpo-primary-300  /* #A5C4FF - Light blue */
nexpo-primary-400  /* #82A3FF - Medium light blue */
nexpo-primary-500  /* #4F80FF - Main brand color ⭐ */
nexpo-primary-600  /* #3B6BF6 - Medium blue */
nexpo-primary-700  /* #2C5CE2 - Medium dark blue */
nexpo-primary-800  /* #1E40AF - Dark blue */
nexpo-primary-900  /* #1E3A8A - Very dark blue */
nexpo-primary-950  /* #0F1B3C - Darkest blue */
```

#### Secondary Brand Colors (`nexpo-secondary-*`)
```css
/* Light to Dark grays */
nexpo-secondary-50   /* #F8FAFC - Very light gray */
nexpo-secondary-100  /* #F1F5F9 - Light gray */
nexpo-secondary-200  /* #E2E8F0 - Lighter gray */
nexpo-secondary-300  /* #CBD5E1 - Light gray */
nexpo-secondary-400  /* #94A3B8 - Medium light gray */
nexpo-secondary-500  /* #64748B - Medium gray */
nexpo-secondary-600  /* #475569 - Medium dark gray */
nexpo-secondary-700  /* #334155 - Dark gray */
nexpo-secondary-800  /* #1E293B - Very dark gray */
nexpo-secondary-900  /* #0F172A - Darkest gray */
nexpo-secondary-950  /* #020617 - Almost black */
```

### 2. Sidebar Colors (`sidebar-*`)

```css
sidebar-from           /* #312E81 - Gradient start (indigo-900) */
sidebar-via            /* #1E40AF - Gradient middle (blue-900) */
sidebar-to             /* #1E3A8A - Gradient end (blue-800) */
sidebar-border         /* #3B82F6 - Border color (blue-500) */
sidebar-text-primary   /* #FFFFFF - Main text */
sidebar-text-secondary /* #DBEAFE - Secondary text (blue-100) */
sidebar-text-muted     /* #BFDBFE - Muted text (blue-200) */
```

### 3. Status Colors (`status-*`)

```css
/* Draft Status */
status-draft-bg        /* #F3F4F6 - Gray background */
status-draft-text      /* #1F2937 - Dark gray text */
status-draft-border    /* #D1D5DB - Gray border */

/* Published Status */
status-published-bg    /* #DCFCE7 - Green background */
status-published-text  /* #166534 - Dark green text */
status-published-border /* #BBF7D0 - Green border */

/* Archived Status */
status-archived-bg     /* #FEE2E2 - Red background */
status-archived-text   /* #991B1B - Dark red text */
status-archived-border /* #FECACA - Red border */

/* Live Status */
status-live-bg         /* #DCFCE7 - Green background */
status-live-text       /* #166534 - Dark green text */
status-live-border     /* #BBF7D0 - Green border */

/* Warning Status */
status-warning-bg      /* #FEF3C7 - Yellow background */
status-warning-text    /* #92400E - Dark yellow text */
status-warning-border  /* #FDE68A - Yellow border */
```

### 4. UI Element Colors (`ui-*`)

#### Backgrounds (`ui-bg-*`)
```css
ui-bg-primary    /* #FFFFFF - White */
ui-bg-secondary  /* #F9FAFB - Light gray */
ui-bg-tertiary   /* #F3F4F6 - Medium light gray */
ui-bg-dark       /* #1F2937 - Dark gray */
ui-bg-overlay    /* rgba(0, 0, 0, 0.5) - Semi-transparent overlay */
```

#### Text Colors (`ui-text-*`)
```css
ui-text-primary    /* #111827 - Dark gray (main text) */
ui-text-secondary  /* #6B7280 - Medium gray (secondary text) */
ui-text-muted      /* #9CA3AF - Light gray (muted text) */
ui-text-inverse    /* #FFFFFF - White (on dark backgrounds) */
ui-text-link       /* #3B82F6 - Blue (links) */
ui-text-linkHover  /* #2563EB - Darker blue (link hover) */
```

#### Borders (`ui-border-*`)
```css
ui-border-light  /* #E5E7EB - Light gray */
ui-border-medium /* #D1D5DB - Medium gray */
ui-border-dark   /* #6B7280 - Dark gray */
ui-border-focus  /* #3B82F6 - Blue (focus states) */
```

#### Interactive States (`ui-interactive-*`)
```css
ui-interactive-hover    /* #F3F4F6 - Light gray (hover) */
ui-interactive-active   /* #E5E7EB - Medium gray (active) */
ui-interactive-focus    /* #DBEAFE - Light blue (focus) */
ui-interactive-disabled /* #F9FAFB - Very light gray (disabled) */
```

### 5. Semantic Colors (`semantic-*`)

#### Success (`semantic-success-*`)
```css
semantic-success-50   /* #F0FDF4 */
semantic-success-100  /* #DCFCE7 */
semantic-success-500  /* #22C55E */
semantic-success-600  /* #16A34A */
semantic-success-700  /* #15803D */
semantic-success-800  /* #166534 */
semantic-success-900  /* #14532D */
```

#### Warning (`semantic-warning-*`)
```css
semantic-warning-50   /* #FFFBEB */
semantic-warning-100  /* #FEF3C7 */
semantic-warning-500  /* #F59E0B */
semantic-warning-600  /* #D97706 */
semantic-warning-700  /* #B45309 */
semantic-warning-800  /* #92400E */
semantic-warning-900  /* #78350F */
```

#### Error (`semantic-error-*`)
```css
semantic-error-50   /* #FEF2F2 */
semantic-error-100  /* #FEE2E2 */
semantic-error-500  /* #EF4444 */
semantic-error-600  /* #DC2626 */
semantic-error-700  /* #B91C1C */
semantic-error-800  /* #991B1B */
semantic-error-900  /* #7F1D1D */
```

#### Info (`semantic-info-*`)
```css
semantic-info-50   /* #EFF6FF */
semantic-info-100  /* #DBEAFE */
semantic-info-500  /* #3B82F6 */
semantic-info-600  /* #2563EB */
semantic-info-700  /* #1D4ED8 */
semantic-info-800  /* #1E40AF */
semantic-info-900  /* #1E3A8A */
```

## 🎨 Custom Gradients

```css
bg-nexpo-gradient       /* NEXPO brand gradient */
bg-nexpo-gradient-hover /* NEXPO brand gradient (hover state) */
bg-sidebar-gradient     /* Sidebar gradient */
```

## 🎨 Custom Shadows

```css
shadow-nexpo    /* Brand-colored shadow */
shadow-nexpo-lg /* Large brand-colored shadow */
shadow-sidebar  /* Sidebar shadow */
```

## 📋 Usage Guidelines

### 1. Component-Specific Usage

#### Sidebar
```jsx
// Background
<div className="bg-sidebar-gradient">
  
// Text colors
<span className="text-sidebar-text-primary">Main text</span>
<span className="text-sidebar-text-secondary">Secondary text</span>
<span className="text-sidebar-text-muted">Muted text</span>

// Borders
<div className="border-sidebar-border/50">
```

#### Status Badges
```jsx
// Draft
<span className="bg-status-draft-bg text-status-draft-text border-status-draft-border">
  Draft
</span>

// Published
<span className="bg-status-published-bg text-status-published-text border-status-published-border">
  Published
</span>

// Archived
<span className="bg-status-archived-bg text-status-archived-text border-status-archived-border">
  Archived
</span>
```

#### UI Elements
```jsx
// Cards
<div className="bg-ui-bg-primary border-ui-border-light">

// Text hierarchy
<h1 className="text-ui-text-primary">Main heading</h1>
<p className="text-ui-text-secondary">Secondary text</p>
<small className="text-ui-text-muted">Muted text</small>

// Interactive elements
<button className="hover:bg-ui-interactive-hover active:bg-ui-interactive-active">
```

#### Buttons
```jsx
// Primary button
<button className="bg-nexpo-primary-500 hover:bg-nexpo-primary-600 text-white">

// Secondary button
<button className="bg-nexpo-secondary-100 hover:bg-nexpo-secondary-200 text-nexpo-secondary-700">

// Success button
<button className="bg-semantic-success-500 hover:bg-semantic-success-600 text-white">

// Error button
<button className="bg-semantic-error-500 hover:bg-semantic-error-600 text-white">
```

### 2. Best Practices

1. **Consistency**: Always use the defined color tokens instead of arbitrary colors
2. **Accessibility**: Ensure sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text)
3. **Hierarchy**: Use the text color hierarchy (primary → secondary → muted)
4. **Status Colors**: Use semantic status colors for consistent user experience
5. **Brand Colors**: Use NEXPO primary colors for brand elements and call-to-actions

### 3. Migration Guide

Replace existing hardcoded colors with the new system:

```jsx
// ❌ Old way
<div className="bg-gray-100 text-gray-800">
<div className="bg-blue-500 text-white">
<div className="border-gray-200">

// ✅ New way
<div className="bg-ui-bg-tertiary text-ui-text-primary">
<div className="bg-nexpo-primary-500 text-white">
<div className="border-ui-border-light">
```

## 🔧 Development

To add new colors to the system:

1. Add the color to the appropriate section in `tailwind.config.ts`
2. Update this documentation
3. Use semantic naming that describes the purpose, not the appearance
4. Ensure the color works well with the existing palette

## 📚 Examples

See the following components for implementation examples:
- `src/components/layout/Sidebar.tsx` - Sidebar colors
- `src/app/dashboard/page.tsx` - Status colors and UI elements
- `src/components/ui/Button.tsx` - Button color variants
- `src/components/ui/TenantSelector.tsx` - Interactive elements
