# 👀 Visual Testing Guide - Layout Verification

## Mục đích
Hướng dẫn kiểm tra visual để đảm bảo layout không bị thay đổi sau khi migrate sang shadcn/ui.

---

## 🧪 Testing Checklist

### 1. Login Page (`/login`)
**Location:** `/login`

**Kiểm tra:**
- [ ] Email input có đủ height (không bị nhỏ hơn)
- [ ] Password input có icon eye/eye-off bên phải
- [ ] Input có border blue khi focus
- [ ] Input có border red khi có error
- [ ] Button "Log in" có full width
- [ ] Button "Log in with Google" có outline style
- [ ] Loading spinner hiển thị khi đang submit
- [ ] Error message hiển thị đúng vị trí

**Expected Visual:**
```
┌────────────────────────────────┐
│      Email                     │
│  [📧 email@example.com       ] │  ← Height ~48px, icon left
│                                │
│      Password                  │
│  [🔒 ••••••••••••         👁️ ] │  ← Icon left & right
│                                │
│  [    Log in (full width)    ] │  ← Blue button, full width
└────────────────────────────────┘
```

---

### 2. Events List Page (`/events`)
**Location:** `/events`

**Kiểm tra:**
- [ ] Button "Create Event" có gradient background
- [ ] Event cards có proper spacing
- [ ] Status badges (Published/Draft/Archived) hiển thị đúng colors
- [ ] Hover effects hoạt động trên cards
- [ ] Skeleton loading khi đang fetch data
- [ ] Filter tabs có underline khi active

**Expected Visual:**
```
[Events Management]                    [+ Create Event]  ← Button with gradient

[All Events] [Published] [Draft] [Archived]  ← Tabs với underline

┌──────────────────────────────────────────────────┐
│ [Image] │ Event Name          [Published]       │  ← Card with badge
│         │ 📅 Oct 9 - Oct 10                      │
│         │ 📍 Location                            │
└──────────────────────────────────────────────────┘
```

---

### 3. Event Details Page (`/events/[id]`)
**Location:** `/events/1` (or any event ID)

**Kiểm tra:**
- [ ] Tab navigation buttons có proper styling
- [ ] Active tab có blue underline
- [ ] Action buttons (Edit, Delete) có proper colors
- [ ] Status indicator có correct badge color
- [ ] All sections có proper padding

---

### 4. Form Builder (`/events/[id]/forms/[formId]`)
**Location:** `/events/1/forms/1`

**Kiểm tra:**
- [ ] Form field inputs có proper height
- [ ] Drag handles visible và functional
- [ ] Add field buttons có proper styling
- [ ] Field type dropdown menus align correctly
- [ ] Save button có proper styling

---

### 5. Hero Blocks (trong docs pages)
**Kiểm tra:**
- [ ] VButton sử dụng `--color-primary` CSS variable
- [ ] Button colors match theme color
- [ ] Font families đúng (Poppins cho display, Inter cho body)
- [ ] Button hover effects smooth
- [ ] Outline variant có transparent background

**Expected Visual:**
```
Hero Block
━━━━━━━━━━━━━━━━━━━━━━━━

[Primary Button]  [Outline Button]
  ↑ Uses --color-primary    ↑ Transparent bg
```

---

## 🎨 Component-Specific Checks

### Button (ui/Button.tsx)
```tsx
<Button variant="primary" size="lg" loading={true}>
  Click Me
</Button>
```

**Check:**
- [ ] Loading spinner visible
- [ ] Button disabled during loading
- [ ] Size lg has proper padding (px-6 py-3 equivalent)
- [ ] Primary variant has blue background
- [ ] Hover effect works (slightly darker)

---

### VButton (base/VButton.tsx)
```tsx
<VButton variant="solid" color="primary" size="lg">
  Custom Button
</VButton>
```

**Check:**
- [ ] Uses CSS variable `var(--color-primary)`
- [ ] Background color matches theme
- [ ] DaisyUI classes apply correctly
- [ ] Size lg matches expected size
- [ ] Link variant works with href prop

---

### Input (ui/Input.tsx)
```tsx
<Input
  label="Email"
  leftIcon="lucide:mail"
  error="Invalid email"
/>
```

**Check:**
- [ ] Label displayed above input
- [ ] Icon positioned on left with proper spacing
- [ ] Error message displayed below in red
- [ ] Error icon visible
- [ ] Input border turns red when error
- [ ] Height matches old input (~48px)
- [ ] Padding px-4 maintained

---

### Alert (base/VAlert.tsx)
```tsx
<VAlert type="success">
  Operation successful!
</VAlert>
```

**Check:**
- [ ] Success: Green border, green icon
- [ ] Warning: Amber border, amber icon
- [ ] Error: Red border, red icon
- [ ] Info: Blue border, blue icon
- [ ] Border-radius has custom rounded-tr-xl rounded-bl-xl
- [ ] Font is monospace

---

### Badge (base/VBadge.tsx)
```tsx
<VBadge color="blue" size="sm">
  New
</VBadge>
```

**Check:**
- [ ] Small size: px-2 py-0.5 text-xs
- [ ] Large size: px-2.5 py-0.5
- [ ] Blue: bg-blue-100 text-blue-800
- [ ] Green: bg-green-100 text-green-800
- [ ] Custom hex color works with contrast

---

### Accordion (base/VAccordion.tsx)
```tsx
<VAccordion title="Section Title">
  Content here
</VAccordion>
```

**Check:**
- [ ] Title uses display font (Poppins)
- [ ] Title color matches --color-primary
- [ ] Content uses body font (Inter)
- [ ] Border radius: rounded-2xl
- [ ] Shadow visible
- [ ] Icon changes on expand/collapse
- [ ] Animation smooth

---

### Dropdown (base/VDropdown.tsx)
```tsx
<VDropdown
  buttonLabel="Actions"
  menuItems={[...]}
/>
```

**Check:**
- [ ] Button has proper styling
- [ ] Chevron icon on right
- [ ] Menu opens on click
- [ ] Menu items have hover effect
- [ ] Menu aligns properly (no overflow)
- [ ] Portal positioning works

---

## 📏 Measurement Guide

### How to Measure:
1. Open Chrome DevTools (F12)
2. Click "Select Element" (Ctrl+Shift+C)
3. Click on component
4. Check "Computed" tab for:
   - Height
   - Padding
   - Margin
   - Border radius
   - Font size

### Critical Measurements:

| Component | Property | Expected Value | Verify |
|-----------|----------|----------------|--------|
| Input | height | ~48px | [ ] |
| Input | padding-x | 16px (px-4) | [ ] |
| Input | padding-y | 12px (py-3) | [ ] |
| Input (with icon) | padding-left | 40px (pl-10) | [ ] |
| Button sm | padding | 12px 12px (px-3 py-1.5) | [ ] |
| Button md | padding | 16px 8px (px-4 py-2) | [ ] |
| Button lg | padding | 24px 12px (px-6 py-3) | [ ] |
| Badge sm | padding | 8px 2px (px-2 py-0.5) | [ ] |
| Alert | border-width | 2px | [ ] |
| Accordion | border-radius | 16px (rounded-2xl) | [ ] |

---

## 🎨 Color Verification

### CSS Variables Test:
```javascript
// Run in browser console:
const style = getComputedStyle(document.documentElement);
console.log('Primary:', style.getPropertyValue('--color-primary')); // Should be #1E40AF
console.log('Gray:', style.getPropertyValue('--color-gray')); // Should be #374151
console.log('Display Font:', style.getPropertyValue('--font-display')); // Should be Poppins
```

### Expected Values:
- `--color-primary`: #1E40AF ✅
- `--color-gray`: #374151 ✅
- `--font-display`: Poppins, serif ✅
- `--font-body`: Inter, sans-serif ✅
- `--font-code`: Fira Code, monospace ✅

---

## 🖼️ Screenshots Comparison

### Recommended Tool:
Use Percy, Chromatic, or manual screenshots for comparison.

### Key Pages to Screenshot:
1. `/login` - Input và Button components
2. `/events` - Button variants và badges
3. `/events/[id]` - Tab navigation
4. `/events/[id]/forms/[formId]` - Form inputs
5. Hero blocks - VButton với CSS variables

### Screenshot Checklist:
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] With hover states
- [ ] With focus states
- [ ] With error states
- [ ] With loading states

---

## ⚡ Interactive Testing

### Focus States:
1. Tab through all inputs and buttons
2. Verify blue outline appears
3. Check outline is visible and not hidden

### Hover States:
1. Hover over all buttons
2. Verify color change
3. Check cursor changes to pointer

### Click States:
1. Click buttons
2. Verify ripple/scale effect (if any)
3. Check disabled state prevents clicks

### Loading States:
1. Trigger loading on buttons
2. Verify spinner appears
3. Check button is disabled during loading

### Error States:
1. Submit form with invalid data
2. Verify error messages appear
3. Check error styling on inputs

---

## 🔍 Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## ✅ Sign-off Checklist

Before marking as complete:
- [ ] All pages visually match old layout
- [ ] No measurement discrepancies
- [ ] All interactive features work
- [ ] CSS variables working correctly
- [ ] No console errors
- [ ] No layout shifts
- [ ] Responsive behavior intact
- [ ] Accessibility maintained
- [ ] Performance acceptable

---

## 🚨 Common Issues to Watch For

### Issue 1: Input Height Mismatch
**Symptom:** Input looks shorter than before  
**Fix:** Check `input-base.tsx` has `py-3` not `py-1`  
**Verify:** Height should be ~48px

### Issue 2: Button Color Not Using CSS Variable
**Symptom:** Button has default blue instead of theme color  
**Fix:** Check `VButton.tsx` has `bg-[var(--color-primary)]`  
**Verify:** Inspect element shows CSS variable value

### Issue 3: Icon Spacing Off
**Symptom:** Icon overlaps text or too far from edge  
**Fix:** Check padding classes `pl-10` for left icon, `pr-10` for right  
**Verify:** Icon should have ~40px from edge

### Issue 4: Border Radius Changed
**Symptom:** Corners look different (more or less rounded)  
**Fix:** Verify Alert has `rounded-tr-xl rounded-bl-xl`, Accordion has `rounded-2xl`  
**Verify:** Use DevTools to check computed border-radius

### Issue 5: Font Family Not Applied
**Symptom:** Text looks different  
**Fix:** Check `font-[var(--font-display)]` and `font-[var(--font-body)]` classes  
**Verify:** Inspect element shows Poppins or Inter

---

## 📝 Testing Report Template

```markdown
## Visual Testing Report

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Browser version]
**Status:** ✅ Pass / ❌ Fail

### Pages Tested:
- [ ] Login Page
- [ ] Events List
- [ ] Event Details
- [ ] Form Builder
- [ ] Hero Blocks

### Components Tested:
- [ ] Button
- [ ] Input
- [ ] VButton
- [ ] Alert
- [ ] Badge
- [ ] Accordion
- [ ] Dropdown

### Issues Found:
1. [Issue description]
   - **Severity:** High/Medium/Low
   - **Component:** [Component name]
   - **Screenshot:** [Link]
   - **Fix:** [Proposed fix]

### Summary:
[Overall assessment]

### Recommendation:
✅ Ready for deployment
❌ Needs fixes before deployment
```

---

**🎯 Goal: Zero visual regressions!**

---

_Guide created: October 9, 2025_  
_For: Shadcn/UI Migration Testing_

