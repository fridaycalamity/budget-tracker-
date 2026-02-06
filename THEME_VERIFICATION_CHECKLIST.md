# Theme Verification Checklist

Use this checklist to manually verify the theme implementation works correctly.

## Initial Load Tests

### Test 1: First Visit (No localStorage)
1. Clear browser localStorage
2. Open app in browser
3. **Expected:** App should use system theme preference (or light if no preference)
4. **Verify:** No flash of wrong theme on load

### Test 2: Saved Theme Preference
1. Toggle to dark mode
2. Reload page
3. **Expected:** App loads in dark mode immediately
4. **Verify:** No flash of light theme before dark mode applies

### Test 3: System Preference Override
1. Clear localStorage
2. Set OS to dark mode
3. Open app
4. **Expected:** App loads in dark mode
5. Toggle to light mode
6. Reload page
7. **Expected:** App loads in light mode (user preference overrides system)

## Component Verification

### Light Mode Checklist
Navigate through each page and verify:

#### Dashboard Page
- [ ] White background, dark text
- [ ] Summary cards have light colored backgrounds
- [ ] Transaction rows have white backgrounds with gray borders
- [ ] Spending chart has white background
- [ ] Chart legend text is dark and readable
- [ ] Empty state text is visible

#### Transactions Page
- [ ] Filter bar dropdowns have white backgrounds
- [ ] Sort controls have white backgrounds
- [ ] Transaction list has proper contrast
- [ ] Delete buttons are visible on hover

#### Budget Goals Page
- [ ] Form inputs have white backgrounds with visible borders
- [ ] Budget progress bar is visible
- [ ] Warning/error messages have appropriate light backgrounds

#### Settings Page
- [ ] Clear data button is visible
- [ ] Confirmation dialog has white background
- [ ] All text is readable

#### Global Elements
- [ ] Header has light background
- [ ] Navigation links are visible
- [ ] Theme toggle button shows correct icon
- [ ] FAB (+ button) is visible
- [ ] Toast notifications have light backgrounds

### Dark Mode Checklist
Toggle to dark mode and verify:

#### Dashboard Page
- [ ] Dark gray background (not pure black)
- [ ] Light text on dark backgrounds
- [ ] Summary cards have dark colored backgrounds
- [ ] Transaction rows have dark backgrounds with subtle borders
- [ ] Spending chart has dark background
- [ ] Chart legend text is light and readable
- [ ] Empty state text is visible

#### Transactions Page
- [ ] Filter bar dropdowns have dark backgrounds
- [ ] Sort controls have dark backgrounds
- [ ] Transaction list has proper contrast
- [ ] Delete buttons are visible on hover

#### Budget Goals Page
- [ ] Form inputs have dark backgrounds with visible borders
- [ ] Budget progress bar is visible
- [ ] Warning/error messages have appropriate dark backgrounds

#### Settings Page
- [ ] Clear data button is visible
- [ ] Confirmation dialog has dark background
- [ ] All text is readable

#### Global Elements
- [ ] Header has dark background
- [ ] Navigation links are visible
- [ ] Theme toggle button shows correct icon
- [ ] FAB (+ button) is visible
- [ ] Toast notifications have dark backgrounds

## Interaction Tests

### Theme Toggle
1. Click theme toggle button
2. **Verify:** Theme changes smoothly (no jarring jumps)
3. **Verify:** All components update immediately
4. **Verify:** Chart colors update
5. **Verify:** No white flashes or unstyled elements
6. Toggle back
7. **Verify:** Smooth transition back to original theme

### Add Transaction Flow
1. Click FAB button
2. **Verify:** Modal has correct theme colors
3. Fill out form
4. **Verify:** Input fields have correct backgrounds
5. Submit transaction
6. **Verify:** Toast notification has correct theme
7. **Verify:** New transaction row has correct theme

### Filter & Sort
1. Change filters
2. **Verify:** Dropdowns have correct theme
3. Change sort order
4. **Verify:** Controls have correct theme
5. **Verify:** Results update with correct theme

### Delete Transaction
1. Click delete on a transaction
2. **Verify:** Confirmation buttons have correct theme
3. Confirm delete
4. **Verify:** Toast has correct theme

## Mobile Verification

### Responsive Design (320px - 768px)
- [ ] Theme toggle accessible in mobile menu
- [ ] All components stack properly
- [ ] Text remains readable in both themes
- [ ] Touch targets are adequate (44x44px minimum)
- [ ] No horizontal scrolling
- [ ] Charts are responsive

### Landscape Orientation
- [ ] Layout adapts properly
- [ ] Theme colors remain correct
- [ ] No layout breaks

## Performance Tests

### Theme Toggle Speed
1. Toggle theme multiple times rapidly
2. **Verify:** No lag or stuttering
3. **Verify:** Transitions remain smooth
4. **Verify:** No memory leaks (check DevTools)

### Page Load Performance
1. Open DevTools Network tab
2. Reload page
3. **Verify:** Theme applies before first paint
4. **Verify:** No layout shift from theme application

## Browser Compatibility

Test in each browser:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

For each browser, verify:
- [ ] Theme toggle works
- [ ] Theme persists on reload
- [ ] System preference is respected
- [ ] No console errors
- [ ] Smooth transitions

## Accessibility Tests

### Keyboard Navigation
1. Use Tab key to navigate
2. **Verify:** Focus indicators visible in both themes
3. **Verify:** Theme toggle accessible via keyboard
4. Press Enter on theme toggle
5. **Verify:** Theme changes

### Screen Reader
1. Enable screen reader (VoiceOver, NVDA, JAWS)
2. Navigate through app
3. **Verify:** Theme toggle announces current state
4. **Verify:** All content is readable in both themes

### Color Contrast
1. Use browser DevTools or online tool
2. Check contrast ratios for:
   - [ ] Body text (minimum 4.5:1)
   - [ ] Headings (minimum 4.5:1)
   - [ ] Interactive elements (minimum 3:1)
3. **Verify:** All ratios meet WCAG AA standards in both themes

## Edge Cases

### localStorage Disabled
1. Disable localStorage in browser
2. Open app
3. **Verify:** App still works (uses system preference)
4. Toggle theme
5. **Verify:** Theme changes but doesn't persist (expected behavior)

### Corrupted localStorage
1. Set invalid theme value in localStorage: `localStorage.setItem('budget_tracker_theme', 'invalid')`
2. Reload page
3. **Verify:** App falls back to system preference or light mode
4. **Verify:** No errors in console

### System Preference Change
1. Open app
2. Change OS theme preference while app is open
3. **Verify:** App doesn't automatically change (user preference takes priority)
4. Clear localStorage and reload
5. **Verify:** App now uses new system preference

## Sign-Off

After completing all checks:

- [ ] All light mode components verified
- [ ] All dark mode components verified
- [ ] Theme toggle works smoothly
- [ ] Theme persists correctly
- [ ] No flash of wrong theme
- [ ] Mobile responsive in both themes
- [ ] Accessibility requirements met
- [ ] Browser compatibility confirmed
- [ ] Edge cases handled gracefully

**Verified by:** _______________  
**Date:** _______________  
**Notes:** _______________
