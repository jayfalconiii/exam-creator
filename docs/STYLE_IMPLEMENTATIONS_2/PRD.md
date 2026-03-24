# PRD: Design Overhaul — Bold & Energetic UX Upgrade

## Problem Statement

The exam-creator app currently uses hardcoded colors with no design token system, generic system fonts, plain HTML buttons/inputs, and no loading/transition feedback. The UI is functional but lacks visual energy and polish, resulting in a flat user experience that doesn't motivate users to study. There are no skeleton loaders during AI question generation (leaving blank flashes), no empty states when topics have no questions, and answer feedback animations are minimal. The overall aesthetic does not match the engaging, gamification-adjacent feel that study tools benefit from.

## Solution

Adopt PrimeVue (v4, Aura preset) as a UI foundation, introduce an orange/amber design token system, upgrade typography to Inter, and implement targeted UX polish: skeleton loaders, micro-animations, empty states, and satisfying answer feedback. The existing component structure and BEM naming conventions are preserved; changes are additive and styling-focused rather than architectural.

## User Stories

1. As a student, I want the app to feel visually energetic and motivating, so that I am encouraged to keep studying.
2. As a student, I want to see a warm orange/amber color scheme, so that the app feels distinct and engaging rather than generic.
3. As a student, I want buttons to have clear visual hierarchy and press feedback, so that I always know what action to take.
4. As a student, I want Inter font to be used throughout the app, so that text is highly legible on my mobile screen.
5. As a student, I want smooth transitions when navigating between views, so that the app feels fluid and native-like.
6. As a student, I want to see a skeleton loader when AI is generating questions, so that I know the app is working and I'm not left staring at a blank screen.
7. As a student, I want a friendly empty state when a topic has no questions yet, so that I understand what to do next instead of seeing nothing.
8. As a student, I want a satisfying animation when I answer a question correctly, so that I feel rewarded for getting it right.
9. As a student, I want a clear, visible shake or highlight animation when I answer incorrectly, so that the feedback registers emotionally and not just visually.
10. As a student, I want card hover/tap effects on topic tiles, so that the UI feels interactive and responsive to my touch.
11. As a student, I want progress bars to be styled with the orange/amber palette, so that visual progress indicators feel consistent with the overall theme.
12. As a student, I want the bottom navigation to feel bold and clearly indicate the active route, so that I always know where I am in the app.
13. As a student, I want the home dashboard to have a visually prominent "Start Studying" call to action, so that the primary action is immediately obvious.
14. As a student, I want toast notifications for key events (question generation complete, errors), so that I receive clear, non-blocking feedback.
15. As a student, I want input fields (e.g., API key in settings) to be styled with the new palette and clear focus states, so that forms feel polished and accessible.
16. As a student, I want the heatmap grid to use the orange/amber gradient for intensity, so that it is consistent with the rest of the visual language.
17. As a student, I want the stats view to feel data-rich and visually clear, so that I can easily interpret my performance at a glance.
18. As a student on mobile, I want all touch targets to be large enough and well-spaced, so that I don't accidentally tap the wrong element.
19. As a student, I want a consistent border-radius and shadow language across all cards and buttons, so that the UI feels cohesive.
20. As a student, I want the session review screen to celebrate correct answers with visual emphasis, so that completing a session feels rewarding.
21. As a student, I want the topic detail view to show an empty state with a helpful prompt when no questions exist, so that I know to generate questions first.
22. As a student, I want CSS custom properties (design tokens) to drive all colors, so that the theme is consistent and maintainable.
23. As a student, I want the PWA install banner to match the new visual style, so that the installation prompt feels part of the app rather than an afterthought.
24. As a developer, I want all design tokens defined as CSS custom properties in one place, so that future theme changes require minimal edits.
25. As a developer, I want PrimeVue's Aura preset to be customized with our orange/amber tokens, so that PrimeVue components match the app's visual identity automatically.

## Implementation Decisions

### Modules to Build / Modify

**1. Design Token System**
- A single global CSS file defines all custom properties: primary, accent, success, warning, danger, neutral shades, background, surface, text, border-radius scale, shadow scale, and spacing scale.
- All existing components are updated to consume these tokens instead of hardcoded values.

**2. PrimeVue Integration**
- Install PrimeVue v4 and `@primevue/themes`.
- Configure in `main.ts` using the Aura preset with a custom palette override (orange/amber as primary, amber as secondary/accent).
- Selective component adoption: `Button`, `InputText`, `Skeleton`, `Toast`, `ProgressBar`. Existing card/layout HTML structures are kept but restyled.
- PrimeVue `useToast` composable used for notification feedback.

**3. Typography**
- Inter font loaded via Google Fonts CDN in `index.html`.
- Applied globally via CSS to replace `system-ui` in `App.vue`.
- Font weights used: 400 (body), 500 (labels/nav), 600 (headings), 700 (display/CTAs).

**4. Component Restyling**
- All views and components updated to use new design tokens.
- BEM class naming conventions preserved; no class renames.
- Semantic HTML structure preserved.
- BottomNav: bolder active indicator, orange accent on active icon/label.
- TopicTile: elevated card shadow, press animation, orange accent for mastery score.
- ProgressBar: orange fill, rounded track.
- HeatmapGrid: orange-scale gradient for intensity levels.

**5. Skeleton Loader Module**
- PrimeVue `Skeleton` component used inside `StudyView` / `SessionView` to replace blank loading states during AI question generation.
- Skeleton layout mirrors the actual `QuestionCard` shape (title block, 4 option blocks).

**6. Empty State Module**
- A reusable `EmptyState` component (icon/illustration + heading + description + CTA button).
- Used in `TopicsView` (no topics seeded) and `TopicDetailView` (no questions for topic).
- Styled with orange CTA button (PrimeVue `Button` severity="warn" or custom).

**7. Answer Feedback Animations**
- `QuestionCard` correct answer: green pulse/scale animation on the selected option, brief confetti-style CSS keyframe.
- `QuestionCard` incorrect answer: red shake keyframe on the selected option, correct answer highlighted in green.
- Animations implemented as CSS keyframes, triggered by existing class bindings (`--correct`, `--incorrect`).

**8. View Transitions**
- Vue `<Transition>` wrapper in `App.vue` router view with a slide-fade animation between route changes.
- Page transition direction (forward/back) derived from route meta or navigation direction.

**9. Micro-interactions**
- Button press: `transform: scale(0.97)` on `:active` state via CSS.
- Card hover/tap: subtle `translateY(-2px)` + shadow increase.
- Nav icon: spring-like scale on active state.

### Architecture Decisions
- No changes to composables, stores, router, or database schema.
- PrimeVue is registered globally in `main.ts`; no per-component imports required.
- CSS design tokens live in a dedicated `src/assets/tokens.css` imported in `main.ts` (or `App.vue`).
- Existing scoped `<style>` blocks in components continue to use BEM naming; they reference global CSS custom properties.
- PrimeVue theme tokens map: `--p-primary-*` → orange scale, `--p-surface-*` → neutral warm whites/grays.

## Testing Decisions

### What makes a good test
- Test external, observable behavior — not implementation details or CSS class names.
- For components: test that loading states render skeleton elements when data is absent, that empty states render when collections are empty, and that answer feedback classes are applied after selection.
- For composables/stores: existing unit test patterns in `__tests__/` are the prior art; new tests follow the same Vitest + Vue Test Utils conventions.

### Modules to test
- `EmptyState` component: renders heading, description, and CTA when passed props; CTA emits expected event.
- `QuestionCard` component: correct/incorrect CSS classes applied to options after selection; no feedback shown before answering.
- `StudyView` / `SessionView`: skeleton elements present in DOM while `isGenerating` is true; skeleton absent and question card present after generation resolves.
- Design tokens: smoke test that `--color-primary` resolves to the expected value (optional, low priority).

### Prior art
- `src/components/__tests__/` — existing component tests use `@vue/test-utils` `mount` with Vitest `describe/it/expect`.
- `src/composables/__tests__/` — composable tests mock Dexie and Anthropic SDK; same mocking pattern applies.

## Out of Scope

- Dark mode / theme toggle.
- Changes to routing structure or navigation patterns.
- New features (question types, new study modes, analytics).
- Full replacement of all HTML with PrimeVue components (only selective migration).
- Custom illustration assets (empty states use icon + text, no SVG illustration library).
- Backend / API changes.
- Internationalization or RTL support.
- Accessibility audit beyond what PrimeVue provides by default.
- Desktop-first layout changes (mobile-first remains the priority).

## Further Notes

- PrimeVue v4 uses `definePreset` from `@primevue/themes` to customize the Aura preset. The orange/amber mapping should override `--p-primary-*` tokens in the preset config rather than via raw CSS to keep PrimeVue components automatically themed.
- The orange palette should use Tailwind's `orange` scale as a reference: 50→950, with `500` (#f97316) as the primary action color and `400` (#fb923c) as hover.
- Inter font should be loaded with `display=swap` to avoid FOIT on slow connections.
- All CSS keyframe animations should respect `prefers-reduced-motion` media query — fall back to instant state changes for users who have reduced motion enabled.
- The existing `#6366f1` indigo accent may be fully replaced by orange/amber; any remaining indigo values should be surfaced during the component audit phase.
