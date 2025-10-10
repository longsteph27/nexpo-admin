# 🔍 Alignment Button Debug Guide

**Issue:** Không thể click alignment buttons (Left/Center/Right)

---

## 🔧 Changes Applied

### 1. Changed from `<button>` to `<div>`:
```tsx
// Try div instead of button to avoid form issues
<div
  onClick={() => updateField('alignment', option.value)}
  role="button"
  tabIndex={0}
  className="cursor-pointer"
>
```

### 2. Added Debug Logging:
```tsx
onClick={() => {
  console.log('[Alignment] Div Clicked:', option.value);
  updateField('alignment', option.value);
}}
```

### 3. Added Debug Display:
```tsx
<p className="text-xs text-gray-500 mt-2">
  Current alignment: {formData.alignment || 'left'}
</p>
```

---

## 🔍 Debug Steps

### Check in Browser Console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click on alignment button
4. Look for: `[Alignment] Div Clicked: left/center/right`

### If you see the log:
✅ Click is working
❌ `updateField()` might not be updating state
→ Check BlockEditorModal's `updateField` function

### If you DON'T see the log:
❌ Click is being blocked
→ Check for overlays or pointer-events issues
→ Inspect element to see what's on top

---

## 🐛 Possible Issues

### Issue 1: Modal Overlay Blocking
```tsx
// Modal has pointer-events-none on container
<div className="pointer-events-none">
  <div className="pointer-events-auto"> {/* Content */}
    {/* Buttons should work here */}
  </div>
</div>
```

### Issue 2: Form Wrapper
```tsx
// If wrapped in <form>, button might submit
<form> {/* Might be blocking */}
  <button type="button"> {/* Need type="button" */}
```

### Issue 3: Z-index Stacking
```tsx
// Something on top with higher z-index
<div className="z-50"> {/* Overlay */}
<div className="z-40"> {/* Buttons - blocked! */}
```

---

## ✅ Testing Checklist

- [ ] Open block editor modal
- [ ] See alignment buttons
- [ ] Hover over button - cursor changes to pointer?
- [ ] Click button - see console log?
- [ ] Check debug text - shows "left" by default?
- [ ] Click "center" - debug text changes to "center"?
- [ ] Button highlights blue when selected?

---

## 🔧 Next Steps if Still Not Working

### Check updateField function:
```tsx
// In BlockEditorModal.tsx
const updateField = (field: string, value: any) => {
  console.log('[updateField] Called:', field, '=', value);
  setFormData((prev: any) => ({ ...prev, [field]: value }));
};
```

### Add more debug:
```tsx
// In RichtextBlockEditor
useEffect(() => {
  console.log('[RichtextBlockEditor] formData changed:', formData);
}, [formData]);
```

### Check if formData is readonly:
```tsx
console.log('[formData]', formData);
console.log('[formData.alignment]', formData.alignment);
console.log('[typeof updateField]', typeof updateField);
```

---

_Debug guide created to help diagnose alignment button issues_
