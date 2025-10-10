# ✅ Paragraph Dropdown Feature - Primary Button Option

**Feature:** Thêm tooltip paragraph với option "Primary Button" để convert link thành button HTML

---

## 🎯 Feature Overview

### Purpose:
- **Convert links to buttons** với styling `btn btn-primary btn-md`
- **Only available for links** - option chỉ hiện khi có link được select
- **Generate specific HTML** format như yêu cầu

### HTML Output:
```html
<p><a class="btn btn-primary btn-md" href="/contact-us" target="_self">Test Button</a></p>
```

---

## 🔧 Implementation Details

### 1. State Management:
```tsx
const [paragraphDropdownOpen, setParagraphDropdownOpen] = useState(false);
```

### 2. Paragraph Dropdown UI:
```tsx
{/* Paragraph Dropdown */}
<div className="relative">
  <button
    type="button"
    onClick={() => setParagraphDropdownOpen(!paragraphDropdownOpen)}
    className="p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 text-gray-600 flex items-center gap-1"
    title="Paragraph Options"
  >
    <span className="text-sm font-medium">Paragraph</span>
    <Icon icon="lucide:chevron-down" className="w-3 h-3" />
  </button>
  
  {paragraphDropdownOpen && (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
      <button
        type="button"
        onClick={convertToPrimaryButton}
        disabled={!editor?.isActive('link')}
        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
          editor?.isActive('link') 
            ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
      >
        Primary Button
      </button>
    </div>
  )}
</div>
```

### 3. Convert Function:
```tsx
const convertToPrimaryButton = () => {
  if (!editor) return;
  
  // Check if current selection is a link
  if (editor.isActive('link')) {
    const { href } = editor.getAttributes('link');
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '');
    
    // Replace link with button HTML
    const buttonHtml = `<p><a class="btn btn-primary btn-md" href="${href}" target="_self">${text}</a></p>`;
    
    editor.chain().focus().insertContent(buttonHtml).run();
  }
  setParagraphDropdownOpen(false);
};
```

### 4. Click Outside Handler:
```tsx
React.useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (paragraphDropdownOpen && editorRef.current && !editorRef.current.contains(event.target as Node)) {
      setParagraphDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [paragraphDropdownOpen]);
```

---

## 🎨 UI/UX Features

### Visual Design:
- ✅ **Dropdown button** với "Paragraph" text và chevron icon
- ✅ **Hover effects** với scale và color transitions
- ✅ **Conditional styling** - disabled khi không có link
- ✅ **Professional dropdown** với shadow và border

### Interaction:
- ✅ **Click to open/close** dropdown
- ✅ **Click outside to close** dropdown
- ✅ **Disabled state** khi không có link selected
- ✅ **Auto-close** sau khi convert

### Accessibility:
- ✅ **Proper button roles** và keyboard navigation
- ✅ **Disabled state** cho invalid selections
- ✅ **Clear visual feedback** cho enabled/disabled states

---

## 🔄 Workflow

### User Flow:
1. **Select a link** trong editor
2. **Click "Paragraph" dropdown** trong toolbar
3. **Click "Primary Button"** option
4. **Link converts** to button HTML format
5. **Dropdown closes** automatically

### Validation:
- ✅ **Only works with links** - checks `editor.isActive('link')`
- ✅ **Preserves link URL** và text content
- ✅ **Generates exact HTML** format requested

---

## 📝 Files Modified

**`src/components/ui/RichTextEditor.tsx`:**
- Added `paragraphDropdownOpen` state
- Added `convertToPrimaryButton` function
- Added paragraph dropdown UI to toolbar
- Added click outside handler useEffect

---

## ✅ Benefits

1. **Easy Link-to-Button Conversion:** One-click conversion
2. **Consistent HTML Output:** Exact format as requested
3. **Smart Validation:** Only available for links
4. **Professional UI:** Clean dropdown interface
5. **User-Friendly:** Clear visual feedback and interactions

---

**Paragraph dropdown with Primary Button option now available!** 🎉
