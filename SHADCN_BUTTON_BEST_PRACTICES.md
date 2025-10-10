# 🎯 Shadcn Button Best Practices - Hover & Cursor

## Vấn đề đã giải quyết

Trước đây, khi dùng `<button>` HTML thủ công, phải CSS nhiều thứ nhỏ nhặt:
```tsx
// ❌ BAD: Phải CSS thủ công cursor-pointer, hover effects
<button
  onClick={handleClick}
  className="px-4 py-2 text-gray-700 bg-white border hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition"
>
  Click Me
</button>
```

**Vấn đề:**
- ❌ Phải nhớ thêm `cursor-pointer`
- ❌ Phải tự viết hover effects
- ❌ Phải tự viết disabled states
- ❌ Phải tự viết focus states
- ❌ Code dài và lặp lại nhiều nơi

---

## ✅ Giải pháp: Dùng Shadcn Button

Shadcn Button đã có sẵn **TẤT CẢ** những thứ này:

```tsx
// ✅ GOOD: Shadcn tự động có cursor-pointer, hover, disabled, focus
import { Button } from '@/components/ui/button-base'

<Button onClick={handleClick} variant="outline">
  Click Me
</Button>
```

**Benefits:**
- ✅ Cursor pointer tự động
- ✅ Hover effects built-in
- ✅ Disabled state built-in
- ✅ Focus ring built-in
- ✅ Accessible by default
- ✅ Code ngắn gọn và clean

---

## 🎨 Shadcn Button Variants

### 1. Default (Primary)
```tsx
<Button variant="default">Primary Action</Button>
```
- Hover: Darker shade automatically
- Cursor: Pointer automatically
- Focus: Ring visible automatically

### 2. Outline
```tsx
<Button variant="outline">Secondary Action</Button>
```
- Hover: Background fill automatically
- Best for: Secondary actions, Cancel buttons

### 3. Ghost
```tsx
<Button variant="ghost">Subtle Action</Button>
```
- Hover: Light background automatically
- Best for: Icon buttons, Close buttons, Tabs

### 4. Destructive (Danger)
```tsx
<Button variant="destructive">Delete</Button>
```
- Hover: Darker red automatically
- Best for: Delete, Remove actions

### 5. Link
```tsx
<Button variant="link">Text Link</Button>
```
- Hover: Underline automatically
- Best for: Text-style buttons

---

## 📏 Sizes

```tsx
<Button size="sm">Small</Button>      // h-8 px-3 text-xs
<Button size="default">Medium</Button> // h-9 px-4 py-2
<Button size="lg">Large</Button>      // h-10 px-8
<Button size="icon">Icon</Button>     // h-9 w-9 (square)
```

---

## 🔄 Before & After Examples

### Example 1: Dialog Buttons

**Before (Manual):**
```tsx
<div className="flex gap-3">
  <button
    onClick={onClose}
    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
  >
    Cancel
  </button>
  <button
    onClick={handleSubmit}
    disabled={!isValid}
    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
  >
    Submit
  </button>
</div>
```

**After (Shadcn):**
```tsx
import { Button } from '@/components/ui/button-base'

<div className="flex gap-3">
  <Button onClick={onClose} variant="outline">
    Cancel
  </Button>
  <Button onClick={handleSubmit} disabled={!isValid}>
    Submit
  </Button>
</div>
```

**Savings:** ~70% less code, better UX, more maintainable!

---

### Example 2: Close Icon Button

**Before (Manual):**
```tsx
<button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
>
  <Icon icon="lucide:x" className="w-5 h-5" />
</button>
```

**After (Shadcn):**
```tsx
import { Button } from '@/components/ui/button-base'

<Button onClick={onClose} variant="ghost" size="icon">
  <Icon icon="lucide:x" className="w-5 h-5" />
</Button>
```

**Benefits:**
- ✅ `size="icon"` creates perfect square (h-9 w-9)
- ✅ `variant="ghost"` for subtle hover effect
- ✅ Automatic hover, focus, cursor

---

### Example 3: Tab Buttons

**Before (Manual):**
```tsx
<button
  onClick={() => setTab('library')}
  className={`px-4 py-3 border-b-2 transition cursor-pointer ${
    activeTab === 'library'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`}
>
  Library
</button>
```

**After (Shadcn):**
```tsx
<Button
  onClick={() => setTab('library')}
  variant="ghost"
  className={`px-4 py-3 border-b-2 rounded-none ${
    activeTab === 'library'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500'
  }`}
>
  Library
</Button>
```

**Note:** 
- Use `variant="ghost"` for tab-style buttons
- Use `rounded-none` to remove border-radius for tabs
- Hover effects are automatic!

---

## 🚫 When NOT to Use Shadcn Button

### Case 1: Native Form Buttons
```tsx
// Keep using <button type="submit"> when in forms
<form onSubmit={handleSubmit}>
  <Button type="submit">Submit</Button> {/* ✅ This is fine */}
</form>
```

### Case 2: Very Custom Complex Buttons
```tsx
// If button needs VERY complex custom styling that fights shadcn
// Use <button> but consider if design can be simplified
```

### Case 3: Link Buttons (Use Link Component)
```tsx
// ❌ Don't use Button for navigation
<Button onClick={() => router.push('/page')}>Go</Button>

// ✅ Use Next.js Link with Button styling
<Link href="/page" className={buttonVariants({ variant: "default" })}>
  Go
</Link>

// ✅ Or use asChild prop
<Button asChild>
  <Link href="/page">Go</Link>
</Button>
```

---

## 📝 Migration Checklist

When converting manual buttons to Shadcn:

### Step 1: Import Button
```tsx
import { Button } from '@/components/ui/button-base'
```

### Step 2: Choose Variant
- Primary action → `variant="default"`
- Secondary/Cancel → `variant="outline"`
- Close/Icon → `variant="ghost"` + `size="icon"`
- Delete/Remove → `variant="destructive"`
- Text link → `variant="link"`

### Step 3: Remove Manual Styling
- ❌ Remove `cursor-pointer`
- ❌ Remove `hover:*` classes (unless overriding)
- ❌ Remove `transition` (already included)
- ❌ Remove disabled styling (already included)

### Step 4: Keep Custom Classes (if needed)
```tsx
<Button 
  variant="ghost" 
  className="your-custom-classes" // ✅ Can still add custom classes
>
  Button
</Button>
```

---

## 🎯 Real Migration Examples from Our Codebase

### 1. ImagePickerDialog Footer

**Before:**
```tsx
<button
  onClick={onClose}
  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
>
  Cancel
</button>
```

**After:**
```tsx
<Button onClick={onClose} variant="outline">
  Cancel
</Button>
```

**Lines of code:** 6 → 1 (83% reduction!)

---

### 2. ImagePickerDialog Close Button

**Before:**
```tsx
<button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600 transition"
>
  <Icon icon="lucide:x" className="w-5 h-5" />
</button>
```

**After:**
```tsx
<Button onClick={onClose} variant="ghost" size="icon">
  <Icon icon="lucide:x" className="w-5 h-5" />
</Button>
```

**Benefits:** Perfect square icon button with proper hover!

---

### 3. ImagePickerDialog Tabs

**Before:**
```tsx
<button
  onClick={() => setActiveTab('library')}
  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
    activeTab === 'library'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`}
>
  <Icon icon="lucide:images" className="w-4 h-4 inline mr-2" />
  Library
</button>
```

**After:**
```tsx
<Button
  onClick={() => setActiveTab('library')}
  variant="ghost"
  className={`px-4 py-3 text-sm font-medium border-b-2 rounded-none ${
    activeTab === 'library'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500'
  }`}
>
  <Icon icon="lucide:images" className="w-4 h-4 inline mr-2" />
  Library
</Button>
```

**Benefits:** Automatic hover + cursor without manual classes!

---

## 🔍 What Shadcn Button Provides Automatically

### From `button-base.tsx`:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 " +
  "whitespace-nowrap rounded-md text-sm font-medium " +
  "transition-colors " +                    // ✅ Smooth transitions
  "focus-visible:outline-none " +           // ✅ Focus management
  "focus-visible:ring-1 focus-visible:ring-ring " + // ✅ Focus ring
  "disabled:pointer-events-none " +         // ✅ Disabled cursor
  "disabled:opacity-50 " +                  // ✅ Disabled opacity
  "[&_svg]:pointer-events-none " +          // ✅ Icon handling
  "[&_svg]:size-4 [&_svg]:shrink-0",       // ✅ Icon sizing
```

**Default Variant:**
```tsx
default: "bg-primary text-primary-foreground shadow hover:bg-primary/90"
//        ✅ Color      ✅ Text color      ✅ Shadow  ✅ Hover darker
```

**Note:** HTML `<button>` element already has `cursor: pointer` by default in browsers!

---

## 💡 Pro Tips

### Tip 1: Use `asChild` for Links
```tsx
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```
This applies Button styling to Link element!

### Tip 2: Combine with Icons
```tsx
<Button>
  <Icon icon="lucide:plus" className="w-4 h-4" />
  Add Item
</Button>
```
Shadcn automatically handles icon spacing with `gap-2`!

### Tip 3: Override Classes When Needed
```tsx
<Button 
  variant="ghost" 
  className="hover:bg-red-50 hover:text-red-600" // Custom hover
>
  Custom Hover
</Button>
```
Your classes will override shadcn defaults!

### Tip 4: Loading State
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin" />}
  Submit
</Button>
```
Use our enhanced Button wrapper for automatic loading state!

---

## 📊 Comparison Summary

| Feature | Manual `<button>` | Shadcn `<Button>` |
|---------|------------------|-------------------|
| Cursor pointer | ❌ Must add | ✅ Automatic |
| Hover effects | ❌ Must write | ✅ Built-in |
| Focus ring | ❌ Must write | ✅ Built-in |
| Disabled state | ❌ Must write | ✅ Built-in |
| Variants | ❌ Write each time | ✅ Pre-defined |
| Accessibility | ❌ Manual | ✅ Automatic |
| Code length | ❌ Long | ✅ Short |
| Consistency | ❌ Varies | ✅ Uniform |

---

## ✅ Conclusion

**Quy tắc vàng:**
> "Luôn dùng Shadcn Button thay vì `<button>` HTML để tránh CSS thủ công các thứ nhỏ nhặt như cursor-pointer, hover effects!"

**Benefits:**
- 🎯 Less code to write
- 🎯 Consistent UX across app
- 🎯 Better accessibility
- 🎯 Easier maintenance
- 🎯 Automatic cursor & hover!

---

**Updated:** October 9, 2025  
**Status:** ✅ Best Practice Established  
**Migration:** Ongoing - Use for all new buttons!

