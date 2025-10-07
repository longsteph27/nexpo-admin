# Page Builder Guide

## Accessing the Page Builder

### From Site Detail Page
1. Navigate to Event → Select Event → Sites → Select Site
2. Under "Pages" section, click on any page card
3. You'll be redirected to the Page Builder

### From Pages List
1. Navigate to Event → Select Event → Pages (sidebar menu)
2. Click on any page card in the list
3. Opens the Page Builder for that page

## Using the Page Builder

### Interface Overview

The Page Builder has a **split-view layout**:

```
┌────────────────────────────────────────────────────────┐
│  [←] Page Title          [Header & Footer] [EN|VI] [Save] │
├──────────────┬─────────────────────────────────────────┤
│              │                                         │
│  Sections    │         Live Preview                    │
│  List        │                                         │
│              │                                         │
│  [+ Add]     │         [Your Page Content]             │
│              │                                         │
│  Section 1   │                                         │
│  Section 2   │                                         │
│  Section 3   │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

## Adding Content

### 1. Add a New Section

Click the **"Add Section"** button in the left panel.

A modal will appear showing all available block types:

- **Layout**: Hero, Columns
- **Content**: Rich Text, Quote, HTML, Divider
- **Media**: Gallery, Video, Logo Cloud
- **Interactive**: FAQs, Steps, Form
- **People**: Team, Testimonials
- **Action**: Call to Action

### 2. Select Block Type

Choose a block type from the grid. Each block has:
- **Icon**: Visual identifier
- **Name**: Block type name
- **Description**: What the block does

You can:
- **Search** for blocks using the search bar
- **Filter** by category (Layout, Content, Media, etc.)

### 3. Fill Block Data

After selecting a block, the editor modal opens with:

#### Language Tabs
Switch between **English** and **Vietnamese** to edit translations.

#### Form Fields
Different blocks have different fields:

**Hero Block:**
- Headline (rich text)
- Content (textarea)
- Image position (left/right)
- Image upload
- Button group

**Rich Text Block:**
- Title
- Headline
- Content (rich editor)
- Alignment (left/center)

**Columns Block:**
- Block title
- Multiple rows with:
  - Title, headline, content
  - Image position
  - Add/remove rows

**Quote Block:**
- Quote text
- Author name
- Author title

**FAQs Block:**
- Section title
- Multiple Q&A pairs
- Add/remove FAQs

**Video Block:**
- Title
- Type (URL or File)
- Video URL or file upload

**Gallery Block:**
- Gallery title
- Multiple image uploads

**Steps Block:**
- Section title
- Show step numbers (checkbox)
- Alternate image position (checkbox)
- Multiple steps with title & content

**CTA Block:**
- Title
- Description
- Button label
- Button URL

**HTML Block:**
- Custom HTML code editor

**Divider Block:**
- Optional title
- Style (solid/dashed/dotted)

### 4. Save or Apply

Two options:
- **Apply**: Saves the block and keeps modal open for further editing
- **Save & Close**: Saves and closes the modal

The preview updates in real-time!

## Managing Sections

### Edit Section
Click the **"Edit"** button on any section card in the left panel.

### Delete Section
Click the **trash icon** to remove a section.

### Reorder Sections
Use the **up/down arrows** to move sections.

### Insert Section
Hover over a section and click **"Insert below"** to add a new section at that position.

## Navigation Editing

### Access Navigation Editor
Click **"Header & Footer"** button in the top bar.

The left panel switches to navigation mode showing:
- **Header Navigation**: Top menu items
- **Footer Navigation**: Bottom menu items

### Add Navigation Item
1. Click "Add Item" under Header or Footer
2. The item appears in the list
3. Click the chevron to expand and edit

### Edit Navigation Item
For each item, you can configure:
- **Title**: Display text (multi-language)
- **Link Type**: External Link or Internal Page
- **URL**: Destination path

### Reorder Navigation Items
Use up/down arrows to change menu order.

### Delete Navigation Item
Click the trash icon to remove an item.

## Language Management

### Switch Preview Language
Use the language switcher in the top bar:
- **EN**: Preview in English
- **VI**: Preview in Vietnamese

All translations are edited separately but saved together.

### Required Translations
Make sure to fill content for both languages to ensure a complete user experience.

## Saving Your Work

### Manual Save
Click the **"Save"** button in the top bar.

This saves:
- All page blocks
- Block content and translations
- Header navigation items
- Footer navigation items

### Save Confirmation
- Success: "Page saved successfully!"
- Error: "Failed to save page. Please try again."

## Preview Modes

### Device Preview (Coming Soon)
Toggle between:
- 📱 Mobile view
- 📱 Tablet view
- 🖥️ Desktop view (default)

### Live Preview
Click **"Preview"** to open the page in a new tab showing how it looks on the actual site.

## Tips & Best Practices

### Content Guidelines
- **Headlines**: Keep under 60 characters for readability
- **Descriptions**: 2-3 sentences maximum
- **Images**: Use high-quality images (2MB max)
- **Videos**: Prefer YouTube/Vimeo embeds over file uploads

### Structure
- Start with a Hero block to grab attention
- Use Rich Text for main content
- Break up content with Dividers
- End with a CTA to drive action

### Performance
- Limit to 10-15 sections per page
- Optimize images before uploading
- Use HTML blocks sparingly

### SEO
- Fill page title and description (in page settings)
- Use meaningful headlines
- Add alt text to images

## Keyboard Shortcuts (Coming Soon)

- `Cmd/Ctrl + S`: Save page
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Esc`: Close modal
- `Cmd/Ctrl + K`: Search blocks

## Troubleshooting

### Preview Not Updating?
- Ensure you clicked "Apply" or "Save & Close"
- Try refreshing the page

### Can't Save?
- Check network connection
- Ensure all required fields are filled
- Check browser console for errors

### Missing Translations?
- Switch language tabs and fill both EN and VI
- Some fields may be shared across languages

### Block Not Rendering?
- Ensure required fields are filled
- Check that translations exist for current language
- Try re-saving the block

## Advanced Features

### Custom HTML
Use the HTML block for:
- Third-party embeds (Typeform, Calendly)
- Custom CSS styling
- JavaScript widgets

⚠️ **Warning**: Only add trusted HTML code.

### Navigation Types
- **link**: External URL (e.g., https://example.com)
- **page**: Internal page reference

### Block Nesting
Some blocks support nested content:
- **Columns**: Multiple rows per block
- **Steps**: Multiple steps per block
- **FAQs**: Multiple Q&A pairs

## API Integration

The Page Builder automatically handles:
- ✅ Block creation in respective collections
- ✅ Junction table entries (`page_blocks`)
- ✅ Translation management
- ✅ Navigation updates
- ✅ Cache invalidation

No manual API calls needed!

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Directus connection
3. Ensure proper permissions
4. Contact development team

