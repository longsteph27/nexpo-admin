# ✅ Schema-Based Alignment Fix

**Issue:** RichText block có 3 alignment options (Left/Center/Right) nhưng schema chỉ support 2 options

---

## 🔍 Schema Analysis

### From `docs/schema-blocks.json`:

```json
{
  "collection": "block_richtext",
  "field": "alignment",
  "schema": {
    "default_value": "center"
  },
  "meta": {
    "interface": "select-radio",
    "options": {
      "choices": [
        {
          "text": "Left",
          "value": "left"
        },
        {
          "text": "Center", 
          "value": "center"
        }
      ]
    }
  }
}
```

**Key Findings:**
- ✅ **Only 2 options:** `left` và `center`
- ❌ **No "right" option** in schema
- ✅ **Default value:** `center`

---

## 🔧 Fix Applied

### Before (3 options):
```tsx
{[
  { value: 'left', label: 'Left', icon: 'lucide:align-left' },
  { value: 'center', label: 'Center', icon: 'lucide:align-center' },
  { value: 'right', label: 'Right', icon: 'lucide:align-right' } // ❌ Not in schema
]}
```

### After (2 options matching schema):
```tsx
{[
  { value: 'left', label: 'Left', icon: 'lucide:align-left' },
  { value: 'center', label: 'Center', icon: 'lucide:align-center' }
]}
```

### Default Value Fix:
```tsx
// Before
const isSelected = (formData.alignment || 'left') === option.value;

// After (matching schema default)
const isSelected = (formData.alignment || 'center') === option.value;
```

---

## 🎯 Result

**Now alignment options match the database schema exactly:**

- ✅ **Left** - `value: "left"`
- ✅ **Center** - `value: "center"` (default)
- ❌ **Right** - Removed (not in schema)

**Default selection:** Center (matching schema `default_value: "center"`)

---

## 📝 Files Modified

**`src/components/pagebuilder/RichtextBlockEditor.tsx`:**
- Removed "Right" alignment option
- Updated default value from `'left'` to `'center'`
- Updated debug display to show correct default

---

## ✅ Benefits

1. **Schema Compliance:** UI now matches database schema exactly
2. **No Invalid Data:** Prevents saving "right" alignment that doesn't exist in DB
3. **Correct Default:** Center alignment selected by default as per schema
4. **Consistent UX:** Only shows valid options to users

---

**Alignment options now perfectly match the database schema!** 🎉
