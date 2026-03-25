# PRD: Theme Toggle — Light, Dark, and Auto Mode

## Problem Statement

The app currently applies dark mode exclusively via `@media (prefers-color-scheme: dark)` in `tokens.css`, meaning it always follows the OS setting with no way for the user to override it. Users who prefer a light theme on a dark-OS device (or vice versa) have no recourse. A manual theme toggle in Settings gives users direct control over their visual experience without requiring an OS-level change.

## Solution

Add a `theme` preference (`'light' | 'dark' | 'auto'`) to the settings store and persist it in the existing IndexedDB `settings` table. Apply the preference reactively in `App.vue` by writing a `data-theme` attribute to `<html>`. Update `tokens.css` to honour both `[data-theme='dark']` and `@media (prefers-color-scheme: dark)` (the latter as the fallback when `auto` is selected). Expose a 3-option segmented control (Light / Auto / Dark) in `SettingsView` — no Save button needed since the change applies instantly.

## User Stories

1. As a student, I want to manually set the app to light mode, so that I can use it comfortably even when my OS is in dark mode.
2. As a student, I want to manually set the app to dark mode, so that I can use it comfortably even when my OS is in light mode.
3. As a student, I want an "Auto" option that follows my OS setting, so that I don't have to think about it if I'm happy with the default behaviour.
4. As a student, I want the theme to apply instantly when I tap a mode, so that I get immediate visual feedback without needing to save and reload.
5. As a student, I want my theme preference to persist across sessions, so that I don't have to re-set it every time I open the app.

## Acceptance Criteria

- `SettingsView` shows a 3-option segmented control: **Light | Auto | Dark**
- Selecting a mode applies the theme immediately (no Save button)
- `'light'` — forces light tokens regardless of OS
- `'dark'` — forces dark tokens regardless of OS
- `'auto'` — defers to `prefers-color-scheme` (existing behaviour)
- Selected preference is persisted to IndexedDB (`key: 'theme'`) and survives app reload
- `settingsStore` exposes `theme` ref and `saveTheme(value)` action
- `tokens.css` dark-mode block responds to both `[data-theme='dark']` and `@media (prefers-color-scheme: dark)` without duplication (use a SCSS mixin or selector list)
- `[data-theme='light']` explicitly overrides any OS dark preference
- `App.vue` watches `settingsStore.theme` and writes `document.documentElement.dataset.theme` accordingly (`'light'` or `'dark'`); removes the attribute when `'auto'`
- `npm run build` and `npm run test` pass

## Technical Approach

### 1. `tokens.css` — dark token block
Apply dark tokens under both selectors:
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* dark token overrides */ }
}

[data-theme='dark'] { /* same dark token overrides */ }
```
This means:
- OS dark + no attribute → `:root:not([data-theme='light'])` matches → dark
- OS dark + `data-theme='light'` → `:not` excludes it → light
- `data-theme='dark'` → always dark regardless of OS

### 2. `settingsStore`
Add `theme` ref (default `'auto'`) and `saveTheme(value: ThemePreference)` that persists to `db.settings`.

### 3. `App.vue`
Use a `watchEffect` (or `computed` side-effect in `onMounted` + watch) to sync `settingsStore.theme` → `document.documentElement.dataset.theme`:
```ts
watchEffect(() => {
  const t = settingsStore.theme
  if (t === 'auto') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = t
})
```

### 4. `SettingsView`
Add an "Appearance" section above API Key using PrimeVue `ButtonGroup` + `Button :outlined` (same pattern as the Mode group in StudyView):
```html
<ButtonGroup>
  <Button label="Light" :outlined="theme !== 'light'" @click="setTheme('light')" />
  <Button label="Auto"  :outlined="theme !== 'auto'"  @click="setTheme('auto')"  />
  <Button label="Dark"  :outlined="theme !== 'dark'"  @click="setTheme('dark')"  />
</ButtonGroup>
```

## Out of Scope

- Per-view or per-component theme overrides
- Custom colour palette picker
- Scheduled theme switching (e.g. auto-dark after sunset)
