# Quick Start Guide - Nexpo Admin Panel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Access to Directus CMS instance
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Directus URL and credentials

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📝 Using the Page Builder

### Quick Tutorial (5 minutes)

1. **Login**
   - Navigate to `/login`
   - Enter credentials
   - Select tenant

2. **Navigate to Events**
   - Click "Events" in sidebar
   - Select an event

3. **Access Site**
   - Click "Sites" in event sidebar
   - Select a site from list

4. **Open Page Builder**
   - Click on any page card
   - Page Builder opens

5. **Add Your First Section**
   - Click "+ Add Section"
   - Choose "Hero" block
   - Fill in:
     - Headline: "Welcome to Our Event"
     - Content: "Join us for an amazing experience"
     - Image position: Right
   - Click "Save & Close"

6. **Add More Sections**
   - Click "+ Add Section" again
   - Choose "Rich Text"
   - Fill content
   - Click "Save & Close"

7. **Edit Navigation**
   - Click "Header & Footer" in top bar
   - Add menu items:
     - Title: "Home"
     - URL: "/"
   - Click back to sections

8. **Save Page**
   - Click "Save" button in top bar
   - Wait for success message

9. **Preview**
   - Click "Preview" button
   - See your live page!

## 🎨 Common Workflows

### Creating a Landing Page

```
1. Hero Block
   - Eye-catching headline
   - Compelling CTA buttons

2. Rich Text Block
   - Introduction paragraph
   - Key benefits

3. Steps Block
   - How it works
   - 3-5 steps

4. Testimonials Block
   - Social proof
   - Customer quotes

5. CTA Block
   - Final call to action
   - Sign-up prompt
```

### Creating an About Page

```
1. Hero Block
   - Company mission

2. Rich Text Block
   - Our story

3. Team Block
   - Team members

4. Quote Block
   - Founder's message

5. CTA Block
   - Join us
```

### Creating a Features Page

```
1. Hero Block
   - Main feature headline

2. Columns Block
   - Multiple feature rows
   - Alternating images

3. FAQs Block
   - Common questions

4. CTA Block
   - Try it free
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save page |
| `Esc` | Close modal |
| `Cmd/Ctrl + K` | Search blocks (coming soon) |
| `Cmd/Ctrl + Z` | Undo (coming soon) |

## 🎯 Pro Tips

### Content Tips
- ✍️ Write headlines in active voice
- 📸 Use high-quality images (min 1200px wide)
- 📝 Keep paragraphs short (3-4 lines max)
- 🎨 Use consistent color schemes
- 📱 Preview on mobile before publishing

### Performance Tips
- 🚀 Limit to 10-12 sections per page
- 📦 Compress images before upload
- 🎥 Use video embeds instead of files
- 🧹 Remove unused sections
- ⚡ Minimize custom HTML blocks

### SEO Tips
- 🔍 Fill page title and meta description
- 🏷️ Use descriptive headlines
- 🔗 Add internal links
- 📊 Track with analytics
- 🌐 Create multilingual content

## 🔧 Troubleshooting

### Page Not Saving?
- Check internet connection
- Verify Directus credentials
- Look for errors in browser console
- Ensure required fields are filled

### Preview Not Loading?
- Hard refresh browser (Cmd/Ctrl + Shift + R)
- Clear React Query cache
- Check Directus API status

### Blocks Not Rendering?
- Verify translations exist for current language
- Check block data in console
- Ensure block collection exists in Directus

### Navigation Not Working?
- Check navigation items have URLs
- Verify navigation is assigned to site
- Ensure navigation type is correct (header/footer)

## 📞 Support

- **Documentation**: `/docs` folder
- **API Reference**: `docs/DIRECTUS_API_STRUCTURE.md`
- **Architecture**: `docs/PAGE_BUILDER_ARCHITECTURE.md`
- **Console Logs**: Check browser DevTools

## 🎓 Learning Resources

### Recommended Reading
1. Start with `PAGE_BUILDER_GUIDE.md`
2. Review `PAGE_BUILDER_ARCHITECTURE.md`
3. Check `schema-blocks.json` for field reference
4. Explore `docs/src` for frontend examples

### Video Tutorials (Coming Soon)
- Creating your first page
- Advanced block configurations
- Navigation setup
- Publishing workflow

---

**Happy Building! 🎉**

Built with ❤️ using Next.js, Directus, and modern web technologies.

