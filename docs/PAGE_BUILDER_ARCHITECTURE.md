# Page Builder Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PAGE BUILDER UI                         │
│  ┌────────────┬──────────────────────────────────────────┐ │
│  │  Sections  │           Live Preview                   │ │
│  │   Panel    │                                          │ │
│  └────────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   REACT QUERY LAYER                         │
│  • Caching                                                  │
│  • Optimistic Updates                                       │
│  • Auto Refetch                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API CLIENT                             │
│  • siteApi.getPage()                                        │
│  • siteApi.upsertPageBlock()                                │
│  • navigationApi.getNavigations()                           │
│  • navigationApi.updateNavigation()                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DIRECTUS HELPERS                          │
│  • Authentication                                           │
│  • Request Formatting                                       │
│  • Error Handling                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DIRECTUS CMS                              │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │    Pages     │    Blocks    │  Navigation  │           │
│  │  Collection  │  Collections │  Collection  │           │
│  └──────────────┴──────────────┴──────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
PageBuilderPage (Main)
├── BlockSelectorModal
│   ├── Search Input
│   ├── Category Filters
│   └── Block Type Grid
│       └── Block Type Card (x14)
│
├── BlockEditorModal
│   ├── Language Tabs
│   ├── Block-specific Forms
│   │   ├── HeroBlockEditor
│   │   ├── RichTextBlockEditor
│   │   ├── ColumnsBlockEditor
│   │   ├── QuoteBlockEditor
│   │   ├── FaqsBlockEditor
│   │   ├── VideoBlockEditor
│   │   ├── GalleryBlockEditor
│   │   ├── StepsBlockEditor
│   │   ├── CtaBlockEditor
│   │   ├── HtmlBlockEditor
│   │   └── DividerBlockEditor
│   └── Action Buttons
│
├── NavigationEditor
│   ├── Header Navigation
│   │   └── Navigation Items List
│   └── Footer Navigation
│       └── Navigation Items List
│
└── PagePreview
    └── Block Previews
        ├── HeroPreview
        ├── RichTextPreview
        ├── ColumnsPreview
        ├── QuotePreview
        ├── FaqsPreview
        ├── VideoPreview
        ├── GalleryPreview
        ├── StepsPreview
        ├── CtaPreview
        ├── HtmlPreview
        └── DividerPreview
```

## Data Flow

### Page Load Flow

```
User accesses /events/[id]/sites/[siteId]/pages/[pageId]
                    ↓
        useQuery: getPage(pageId)
                    ↓
        useQuery: getNavigations(siteId)
                    ↓
        Load blocks into state
                    ↓
        Load navigation items into state
                    ↓
        Render UI with preview
```

### Block Creation Flow

```
User clicks "Add Section"
          ↓
  BlockSelectorModal opens
          ↓
User selects block type
          ↓
  BlockEditorModal opens
          ↓
User fills form data
          ↓
User clicks "Apply" or "Save & Close"
          ↓
Block added to local state
          ↓
Preview updates instantly
          ↓
User clicks "Save" in top bar
          ↓
API: upsertPageBlock()
          ↓
Block saved to Directus
          ↓
React Query cache invalidated
          ↓
UI refreshes with saved data
```

### Block Update Flow

```
User clicks "Edit" on section
          ↓
  BlockEditorModal opens with existing data
          ↓
User modifies form fields
          ↓
User clicks "Save & Close"
          ↓
Local state updated
          ↓
Preview updates instantly
          ↓
User clicks "Save" in top bar
          ↓
API: upsertPageBlock()
          ↓
Changes persisted to Directus
```

## State Management

### Local State (useState)

```typescript
// Page content
blocks: Block[]                    // All sections/blocks
selectedBlockIndex: number | null  // Index for insertion
editingBlock: Block | null         // Current block being edited

// Navigation
headerItems: NavigationItem[]      // Header menu
footerItems: NavigationItem[]      // Footer menu
showNavEditor: boolean             // Toggle nav panel

// UI State
showBlockSelector: boolean         // Block selector modal
showBlockEditor: boolean           // Block editor modal
previewLang: 'en-US' | 'vi-VN'    // Preview language
isSaving: boolean                  // Save in progress
```

### Server State (React Query)

```typescript
// Page data with blocks
useQuery(['page-detail', pageId])

// Site navigations
useQuery(['navigations', siteId])
```

## Block Data Structure

### In Memory (Local State)

```typescript
interface Block {
  id: string;              // temp-xxx or UUID
  collection: string;      // block_hero, block_richtext, etc.
  sort: number;            // Display order
  item: {
    // Block-specific fields
    translations: [
      {
        languages_code: 'en-US',
        title?: string,
        headline?: string,
        content?: string,
        // ... other translated fields
      },
      {
        languages_code: 'vi-VN',
        // ... Vietnamese translations
      }
    ],
    // Non-translated fields
    alignment?: string,
    image?: string,
    // ... other fields
  }
}
```

### In Database (Directus)

Three tables involved:

1. **Block Collection** (e.g., `block_hero`)
   ```sql
   id: UUID
   tenant_id: INT
   event_id: INT
   image: UUID (FK to directus_files)
   image_position: VARCHAR
   created_at: TIMESTAMP
   updated_at: TIMESTAMP
   ```

2. **Block Translations** (e.g., `block_hero_translations`)
   ```sql
   id: INT
   block_hero_id: UUID (FK)
   languages_code: VARCHAR
   title: TEXT
   headline: TEXT
   content: TEXT
   ```

3. **Junction Table** (`page_blocks`)
   ```sql
   id: UUID
   pages_id: UUID (FK)
   collection: VARCHAR
   item: UUID (polymorphic FK)
   sort: INT
   hide_block: BOOLEAN
   ```

## API Endpoints

### Pages

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/items/pages/:id` | Get page with blocks |
| PATCH | `/items/pages/:id` | Update page metadata |
| POST | `/items/pages` | Create new page |

### Blocks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/items/block_*` | Create block item |
| PATCH | `/items/block_*/:id` | Update block item |
| DELETE | `/items/block_*/:id` | Delete block item |

### Junction

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/items/page_blocks` | List page blocks |
| POST | `/items/page_blocks` | Link block to page |
| PATCH | `/items/page_blocks/:id` | Update link |
| DELETE | `/items/page_blocks/:id` | Unlink block |

### Navigation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/items/navigation` | List navigations |
| POST | `/items/navigation` | Create navigation |
| PATCH | `/items/navigation/:id` | Update navigation |
| POST | `/items/navigation_items` | Create nav item |

## Translation System

### How Translations Work

1. **Storage**: Each block has a `translations` array
2. **Structure**: 
   ```typescript
   translations: [
     { languages_code: 'en-US', ...fields },
     { languages_code: 'vi-VN', ...fields }
   ]
   ```
3. **Editing**: Language tabs in modal switch between translations
4. **Preview**: Preview language selector determines which translation to show
5. **Saving**: All translations saved together in one API call

### Supported Languages

- **en-US**: English (United States)
- **vi-VN**: Vietnamese (Vietnam)

More languages can be added by:
1. Adding to language tabs in `BlockEditorModal`
2. Initializing translations array with new language code
3. Updating preview language selector

## Performance Optimizations

### React Query Caching

```typescript
// Pages cached for 5 minutes
staleTime: 5 * 60 * 1000

// Automatic background refetch
refetchOnWindowFocus: true

// Cache invalidation on save
queryClient.invalidateQueries()
```

### Optimistic Updates

Block changes update local state immediately before API call, providing instant feedback.

### Lazy Loading

Modals and preview components load only when needed.

### Image Optimization

- Images lazy loaded in preview
- Thumbnails for gallery blocks
- Directus asset transforms

## Security

### Input Sanitization

- HTML content sanitized before rendering
- XSS protection in preview
- SQL injection protection via Directus SDK

### Permissions

Page Builder requires:
- ✅ Read access to pages collection
- ✅ Create/Update/Delete access to block collections
- ✅ Update access to navigation collection
- ✅ File upload permissions

### Validation

- Required fields enforced in forms
- URL validation for video blocks
- File type validation for uploads

## Extensibility

### Adding New Block Types

1. **Add block definition** in `BlockSelectorModal.tsx`:
   ```typescript
   {
     id: 'block_newtype',
     name: 'New Block',
     description: 'Description',
     icon: 'lucide:icon-name',
     category: 'Content'
   }
   ```

2. **Create editor** in `BlockEditorModal.tsx`:
   ```typescript
   function NewBlockEditor({ formData, updateTranslation }) {
     // Form fields
   }
   ```

3. **Create preview** in `PagePreview.tsx`:
   ```typescript
   function NewBlockPreview({ data, translation }) {
     // Preview render
   }
   ```

4. **Add to switch statements** in both files

5. **Create Directus collection** with schema

Done!

## Future Architecture Plans

- [ ] WebSocket for real-time collaboration
- [ ] Redux/Zustand for complex state
- [ ] Service Worker for offline editing
- [ ] IndexedDB for local drafts
- [ ] GraphQL for optimized queries
- [ ] CDN integration for assets

