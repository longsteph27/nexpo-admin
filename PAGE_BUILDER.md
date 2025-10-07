# Page Builder - SquareSpace Style

## Overview
A modern, real-time page builder for creating and editing event website pages with a split-view interface similar to SquareSpace.

## Features

### ✨ Core Functionality
- **Split View Layout**: Left panel for section management, right panel for live preview
- **Real-time Preview**: Instant visual feedback as you edit content
- **Drag & Drop Sorting**: Reorder sections with up/down buttons
- **Multi-language Support**: Edit content in English (en-US) and Vietnamese (vi-VN)
- **Block-based Architecture**: 14+ pre-built block types

### 🎨 Design System
- **SquareSpace-inspired UI**: Clean, professional interface
- **Neutral Color Palette**: Based on Tailwind neutral colors
- **Smooth Animations**: Framer Motion for polished interactions
- **Responsive Preview**: Desktop, tablet, and mobile views

## Page Builder Flow

```
1. Add Section
   ↓
2. Select Block Type (Modal)
   ↓
3. Fill Data & Translations (Popup)
   ↓
4. Apply to Preview
   ↓
5. Save to Database
```

## Block Types

### Layout Blocks
- **Hero**: Large banner with headline, content, image, and CTAs
- **Columns**: Multi-column layout with alternating image positions

### Content Blocks
- **Rich Text**: Formatted text with title, headline, and content
- **Quote**: Highlighted quotes with author attribution
- **HTML**: Custom HTML for advanced users
- **Divider**: Visual section separators

### Media Blocks
- **Gallery**: Image galleries with lightbox
- **Video**: Embedded videos (URL or file upload)
- **Logo Cloud**: Partner/sponsor logo display

### Interactive Blocks
- **FAQs**: Accordion-style Q&A sections
- **Steps**: Step-by-step process guides
- **Form**: Contact and registration forms

### Social Blocks
- **Team**: Team member profiles
- **Testimonials**: Customer testimonial sliders
- **CTA**: Prominent call-to-action sections

## Navigation Editing

Header and Footer navigation can be edited directly in the page builder:
- Click "Header & Footer" button in top bar
- Add/edit/remove navigation items
- Set URLs and link types
- Multi-language titles
- Auto-saves with page

## File Structure

```
src/
├── app/events/[id]/sites/[siteId]/pages/[pageId]/
│   └── page.tsx                    # Main page builder
├── components/pagebuilder/
│   ├── BlockSelectorModal.tsx      # Block type selector
│   ├── BlockEditorModal.tsx        # Block content editor
│   ├── PagePreview.tsx             # Live preview renderer
│   └── NavigationEditor.tsx        # Header/footer editor
└── lib/
    ├── directus.ts                 # API helpers
    └── api.ts                      # API client
```

## API Integration

### Queries
- `getPage(pageId)`: Fetch page with blocks and translations
- `getBlocksByPage(pageId)`: Get all blocks for a page

### Mutations
- `upsertPageBlock()`: Create/update block and junction entry
- `updatePage()`: Save page metadata
- `updateNavigation()`: Save header/footer navigation

### Data Flow
1. Load page data with deep queries (blocks + translations)
2. User edits in modal
3. Update local state for instant preview
4. Save to Directus on "Save" button
5. Invalidate React Query cache

## UI/UX Features

### Top Bar
- Back navigation to site detail
- Page title display
- Language switcher (EN/VI)
- Navigation editor toggle
- Preview mode button
- Save button with loading state

### Left Panel
- Collapsible section list
- Add section button
- Section cards with:
  - Block type icon
  - Edit/delete actions
  - Reorder controls
  - Insert below option

### Right Panel
- Device preview toggles (mobile/tablet/desktop)
- Scrollable canvas
- Bordered preview container
- Section hover labels

### Modals
- **Block Selector**:
  - Search functionality
  - Category filters
  - Grid layout with descriptions
  - Hover animations

- **Block Editor**:
  - Language tabs
  - Type-specific form fields
  - Rich text editing
  - Image upload zones
  - Validation feedback

## Styling

### Color System (SquareSpace-inspired)
```css
--sqs-neutral-50 to --sqs-neutral-900
--sqs-accent: #0F7CFF (Blue)
--sqs-success: #00C851 (Green)
```

### Typography
```css
--sqs-font-primary: "Helvetica Neue", Helvetica, Arial
--sqs-font-secondary: "Georgia", serif
--sqs-font-monospace: "SF Mono", Monaco
```

## Block Data Structure

Each block follows this pattern:
```typescript
{
  id: string,
  collection: 'block_*',
  sort: number,
  item: {
    // Block-specific fields
    translations: [
      { languages_code: 'en-US', title: '...', content: '...' },
      { languages_code: 'vi-VN', title: '...', content: '...' }
    ]
  }
}
```

## Future Enhancements
- [ ] Undo/Redo functionality
- [ ] Duplicate section feature
- [ ] Block templates library
- [ ] Keyboard shortcuts
- [ ] Auto-save draft
- [ ] Version history
- [ ] A/B testing support
- [ ] Analytics integration

