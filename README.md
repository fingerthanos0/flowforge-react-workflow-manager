# FlowForge

A mobile-optimized, three-step "Application & Contract Request Wizard" built with React, TypeScript, and Vite.

## Live Demo

https://flowforge-react-workflow-manager.vercel.app/

## Repository

https://github.com/fingerthanos0/flowforge-react-workflow-manager

## Overview

FlowForge walks a user through three steps — User Information, a dynamic list of Request/Service items, and a read-only Review & Confirm screen — before a mock submission. It focuses on four things: unified multi-step form state, real-time RegEx-backed validation, crash-resilient LocalStorage autosave/recovery, and mobile keyboard/viewport handling.

## Getting Started

```bash
npm install
npm run dev          # start the dev server
npm run build        # type-check and produce a production build
npm run preview      # preview the production build locally
npm run test         # run the test suite once
npm run test:watch   # run the test suite in watch mode
npm run lint         # ESLint
npm run format       # Prettier — write
npm run format:check # Prettier — check only
```

## Available Scripts

See `package.json`. The scripts above cover everything used during development; there is no additional build tooling (no Husky/lint-staged, no CI config) — scoped out deliberately, see **Assumptions and Trade-offs** below.

## Architecture and Form State Strategy

**How form schemas stay clean without component bloat:**

- **One form instance.** A single `useForm()` is created in `ApplicationWizardPage.tsx` and wrapped in `FormProvider`. Every step component reads and writes through `useFormContext` — there's exactly one source of truth, no per-step local state to keep in sync, and the Review step can trivially read live values via `useWatch`.
- **Schemas are separated by domain, then composed.** `schemas/userInfoSchema.ts` and `schemas/serviceItemSchema.ts` are independent, reusable, and independently testable; `schemas/applicationSchema.ts` composes them into the root schema. RegEx constants (`utils/regex.ts`) are their own module rather than being buried inline — reusable and unit-testable in isolation.
- **Step components only render.** `UserInfoStep`, `RequestConfigurationStep`, `ReviewStep`, and `ServiceItemCard` register fields and display errors; they contain zero validation rules and zero navigation logic.
- **Navigation and submission logic lives in one hook.** `useApplicationWizard` owns which step is active, whether Next is allowed (validates only the current step's fields via RHF's `trigger()`), whether a step is revisitable, and the submit flow. Nothing else in the tree needs to know how step-gating works.
- **Persistence is isolated in two layers.** `storage/draftStorage.ts` is a pure I/O module — it doesn't know React or React Hook Form exist, just `StoredDraft` in and out of `localStorage`, validated with its own permissive Zod schema (shape only, not business rules — a draft saved mid-typing needs to survive a refresh even if the email regex doesn't match yet). `useDraftAutosave` is the only thing that bridges it to the live form values.
- **Dynamic arrays use RHF's `useFieldArray`** with a custom `keyName: 'formFieldKey'` instead of the array index as the React key — removing a middle item doesn't cause a later item's uncontrolled input state to be misattributed to the wrong row.

The net effect: no component needs to import another component's internals. Types (`types.ts`) and schemas are the only shared contract.

## Validation Strategy

- Email and phone each have a dedicated RegEx (`utils/regex.ts`), applied inside the Zod schemas rather than duplicated across components.
- `mode: 'onBlur'` + `reValidateMode: 'onChange'` on the form: errors appear after a field is blurred, then live-update as the user keeps typing.
- **Next** validates only the active step's fields (`STEP_FIELDS[currentStep]` via `trigger()`) — it does not force-validate the whole form.
- **Submit** validates the complete `applicationSchema` via RHF's own `handleSubmit`, so nothing reaches the mock API half-valid.

## Draft Autosave and Recovery

- Debounced writes (400ms) to `localStorage` under `flowforge.application-draft.v1`, versioned and timestamped.
- Reads are defensive: malformed JSON or an unrecognized schema version is discarded and the corrupt key is removed, rather than crashing the app.
- **A restored step is never trusted blindly.** `getHighestReachableStep` re-validates the restored values against the real schemas before deciding how far the user is allowed to land — a stale or hand-edited draft claiming `currentStep: 2` with an empty name gets safely downgraded back to Step 1.
- Cleared only after a successful mock submission; preserved on failure or on refresh, so a genuine crash never loses work.

## Mobile Keyboard and Viewport Handling

- The layout is a three-part flex column (`.wizard-page` → `.wizard-content` → the action bar) rather than `position: sticky` inside a scrolling container. The action bar is a flex sibling that never scrolls in the first place, which avoids known inconsistencies with sticky-inside-overflow in mobile WebViews.
- `100dvh` is the baseline height unit (not `100vh`), so mobile browser chrome showing/hiding doesn't cause a layout jump.
- `useMobileViewport` listens to the `VisualViewport` API's `resize`/`scroll` events and writes the live height to a `--visual-viewport-height` CSS custom property, which `.wizard-page`'s `min-height` consumes. When a virtual keyboard opens and shrinks the visual viewport, the layout shrinks smoothly with it instead of leaving dead space or letting content spill under the keyboard. Falls back to `window.innerHeight` where `VisualViewport` is unavailable.
- `env(safe-area-inset-bottom)` is reserved in both the scrollable content's bottom padding and the action bar's own padding, for notched devices.
- Focused text inputs call `scrollFocusedFieldIntoView`, which waits ~250ms for the keyboard animation, then smooth-scrolls the field to the vertical center of the viewport. Applied selectively to actual text fields (not the Priority dropdown), so desktop users see no unexpected scrolling.

## Testing

Vitest + React Testing Library + jsdom. The committed suite covers what's cheap to assert and unlikely to regress silently: RegEx edge cases, all three Zod schemas, default values, `draftStorage`'s defensive parsing (malformed JSON, unsupported version, valid round-trip), and `getHighestReachableStep`'s step-downgrade logic.

Behavior that's more about wiring than pure logic — dynamic add/remove/edit correctness, step-blocking navigation, the full submit success/failure flow, the mobile sticky-footer layout — was verified interactively against a real running instance (including Playwright screenshots for the layout work) during development rather than committed as a large integration/E2E suite, given the one-day scope. See **Assumptions and Trade-offs**.

## Assumptions and Trade-offs

- **Services start empty**, not pre-filled with one blank item. The assignment states service items are optional, so an empty array is a first-class valid state, not an edge case to work around.
- **No Husky/lint-staged, no CI workflow, no Playwright E2E suite.** Explicitly scoped out to fit a one-day budget — `npm run lint`/`test`/`build` are run manually and were green before every commit in this repo's history.
- **Node 25 (this environment's default) ships its own native `localStorage` global**, which collides with jsdom's inside Vitest and lacks basic methods like `clear()`. Worked around with a small in-memory `Storage` polyfill in `src/test/setup.ts` — worth knowing if this project is ever run on an older Node version, where the workaround becomes unnecessary but harmless.
- **Vitest 3.x doesn't type-check against Vite 8** (the rolldown-based version this environment resolved by default) — pinned to Vitest 4.1+ instead.
- MUI v9's `Stack` doesn't accept `justifyContent` as a direct prop in this version's types; used `sx={{ justifyContent: ... }}` instead.

## Future Improvements

Optional, not required for this assessment: a draft-saved indicator, a discard-draft button, service item reordering, an unsaved-changes browser warning, international phone validation, Playwright E2E coverage, and a CI workflow.
