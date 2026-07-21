# FlowForge — Technical Review Questionnaire (SI)

This document answers the SI Technical Review Questionnaire against the actual FlowForge codebase (`e:\work\vietnam\tests\flowforge-react-workflow-manager`), not in the abstract. Every file/function reference below exists in the repo as committed.

---

## 1. Component Architecture

```
main.tsx
 └─ ThemeProvider + CssBaseline (MUI)
     └─ App.tsx
         └─ ApplicationWizardPage.tsx        [owns: useForm(), readDraft() once]
             └─ FormProvider (react-hook-form context)
                 └─ ApplicationWizardContent [owns: useApplicationWizard(), useDraftAutosave()]
                     ├─ WizardLayout             (components/wizard/WizardLayout.tsx)
                     │    ├─ header (step label)
                     │    ├─ .wizard-content (scrollable)
                     │    │    ├─ status banner (role="status")
                     │    │    ├─ WizardStepper       (components/wizard/WizardStepper.tsx)
                     │    │    └─ ONE OF:
                     │    │         UserInfoStep            (features/application-wizard/components/UserInfoStep.tsx)
                     │    │         RequestConfigurationStep (.../RequestConfigurationStep.tsx)
                     │    │           └─ ServiceItemCard[]   (.../ServiceItemCard.tsx)  — one per useFieldArray row
                     │    │         ReviewStep              (.../ReviewStep.tsx)
                     │    └─ actions slot (flex sibling, never scrolls)
                     │         └─ WizardActions       (components/wizard/WizardActions.tsx)
```

**Two-folder split, and why:**

- `src/components/wizard/*` — generic, presentational, take only props (`WizardLayout`, `WizardStepper`, `WizardActions`). None of them import `react-hook-form` or know this is an "application wizard" — they'd work for any multi-step flow.
- `src/features/application-wizard/*` — everything domain-specific: `types.ts`, `schemas/`, `defaults.ts`, `constants.ts`, `hooks/{useApplicationWizard,useDraftAutosave,useMobileViewport}.ts`, `components/{UserInfoStep,RequestConfigurationStep,ServiceItemCard,ReviewStep}.tsx`, `services/submitApplication.ts`, `getHighestReachableStep.ts`, and the page itself, `ApplicationWizardPage.tsx`.

**Why this architecture:** the split means a change to "how does the wizard's stepper look" (generic, presentational) never touches a file that also encodes "what does step 2 validate" (domain). The only two files that assemble the two halves are `ApplicationWizardPage.tsx` and `ApplicationWizardContent` inside it — everything else is either purely generic or purely domain, never both.

**Alternative 1 — one file per step, each with local `useState`, synced upward via props/callbacks to a parent that aggregates on submit.** This is the natural first draft: `Step1`, `Step2`, `Step3` each own their own slice of state, and a parent `Wizard` component holds setters it passes down and reads results back up. Rejected because the assignment's core requirement is "unified multi-step global state synchronization" — with three independently-owned local states, the Review step (which needs to display _all_ of it) would need direct knowledge of Step 1's and Step 2's internal state shapes, and any field added to Step 1 requires editing the setter-passing plumbing in the parent too. This is exactly the prop-drilling/synchronization-gap problem the assignment is testing for.

**Alternative 2 — a global store (Redux/Zustand) holding the form values instead of React Hook Form's context.** Rejected because form state churns on every keystroke, and a global store re-rendering subscribers on every keystroke would fight against the one optimization RHF already gives for free (uncontrolled, ref-based field registration — see Q6). A global store also solves a problem this app doesn't have: there is exactly one feature/page here, so "global" and "wizard-scoped" are the same thing; adding a separate state library would be complexity with no corresponding win.

---

## 2. Global State Management

There is no app-wide Redux/Zustand/Context store. The closest things to "global" state:

**A. The React Hook Form instance** — created once in `ApplicationWizardPage.tsx`:

```ts
const form = useForm<ApplicationFormValues>({ resolver: zodResolver(applicationSchema), ... })
```

wrapped in `<FormProvider {...form}>`. Every descendant (`UserInfoStep`, `ServiceItemCard`, `ReviewStep`, `useApplicationWizard`) reads/writes it via `useFormContext<ApplicationFormValues>()`.

_Why it belongs there:_ it needs to be visible to Step 1, Step 2, and Step 3 simultaneously (Review reads everything Step 1/2 wrote), so it must live above all three. Context is the mechanism because passing it as props would mean re-deriving/threading the whole values object through every intermediate component, defeating the point of having one form instance.

_Why global-to-the-feature, not global-to-the-app:_ nothing outside the wizard subtree ever needs this data. Scoping the `FormProvider` to exactly the wizard's own subtree (not wrapping it around, say, a future unrelated page) keeps the blast radius of any form-state bug contained to this one feature.

**B. `currentStep` / `highestCompletedStep` / `submissionStatus`** — owned inside `useApplicationWizard` (`src/features/application-wizard/hooks/useApplicationWizard.ts`), called once in `ApplicationWizardContent`, and passed down as **plain props** (not Context) to `WizardStepper`, `WizardActions`, and the conditional step renderer.

_Why props here, Context there:_ `ApplicationWizardContent` is the direct parent of every consumer of this state — there's no deep nesting to punch through, so Context would be an unnecessary layer of indirection. Form _values_ need Context because they're read by components several levels deep (`ServiceItemCard` is nested inside `RequestConfigurationStep`); step/submission state doesn't have that depth problem.

**How components communicate:**

- Form data: exclusively through the RHF context (`useFormContext`) — no component ever imports another component's state directly.
- Step/submission state: props from `ApplicationWizardContent` downward.
- Cross-step navigation from Review: `ReviewStep` receives `onEditUserInfo`/`onEditRequestConfiguration` callback props (wired in `ApplicationWizardPage.tsx` to `goToCompletedStep(0)`/`goToCompletedStep(1)`). `ReviewStep` itself has zero knowledge of `useApplicationWizard` — it just calls a function it was handed, which keeps it decoupled from _how_ navigation is implemented.

---

## 3. Form Management

**Chose React Hook Form.** Concretely used in `ApplicationWizardPage.tsx` (`useForm`, `zodResolver(applicationSchema)`), `useApplicationWizard.ts` (`trigger()`, `handleSubmit()`, `reset()`), `RequestConfigurationStep.tsx` (`useFieldArray`), and every step component (`register()`).

**vs. Formik:** Formik's validation model is a single whole-object `validate`/`validationSchema` function; there's no first-class "validate just these fields" primitive, which this app needs constantly — `useApplicationWizard.goNext` calls `trigger(STEP_FIELDS[currentStep])` to validate _only_ the active step before advancing (`src/features/application-wizard/hooks/useApplicationWizard.ts`). Retrofitting per-step validation onto Formik would mean either running the whole schema and manually filtering which error keys count, or maintaining N separate Formik instances (defeating unified state). Formik is also controlled-by-default (state-driven), so it re-renders more of the tree per keystroke than RHF's ref-based `register()` unless every field is wrapped in `useField`/`FastField` — extra boilerplate per field, for a form that's already going to have a dynamic, growing array of fields.

**vs. plain `useState`:** rejected for three concrete reasons that map to actual code:

1. Per-keystroke updates would need spreading a nested object (`userInfo.name` inside `ApplicationFormValues`) on every change, forcing a re-render of everything reading that state unless hand-memoized field by field.
2. The dynamic array (Step 2) would need hand-built add/remove/reindex logic — exactly the class of bug `useFieldArray`'s `keyName: 'formFieldKey'` exists to prevent (see Q6). Rebuilding that safely by hand is real, easy-to-get-wrong work.
3. Blur-vs-change validation timing, step-gated validation, and full-schema validation-on-submit would all need to be hand-written instead of using RHF's `mode: 'onBlur'` + `reValidateMode: 'onChange'` + `trigger()` + `handleSubmit()` primitives (`ApplicationWizardPage.tsx`, `useApplicationWizard.ts`).

**Trade-off accepted:** because RHF fields are uncontrolled by default, nothing outside a component that calls `watch()`/`useWatch()`/`getValues()` can "just read" the current value the way a `useState` value is always immediately available. `ReviewStep.tsx` has to explicitly opt in with `useWatch({ control })` to get live reactivity. This is a real cost (one more concept to know), accepted because it means the _rest_ of the form doesn't re-render on every keystroke just because Review exists.

---

## 4. Mobile Keyboard Handling

**The problem:** on iOS Safari and many Android WebViews, an opening virtual keyboard shrinks the _visual_ viewport but not `window.innerHeight`/`100vh`. A page sized with `100vh` doesn't shrink when the keyboard appears, so a focused input near the bottom of the form — or a naively `position: fixed` action bar — can end up rendered underneath the keyboard, invisible to the user who's actively typing into it.

**How this implementation avoids it, file by file:**

- `src/index.css` — `.wizard-page { min-height: var(--visual-viewport-height, 100dvh); }`. `100dvh` (dynamic viewport height) is the static-CSS baseline, already better than `100vh` because it accounts for mobile browser chrome show/hide; the CSS variable is the live enhancement on top of that baseline.
- `src/features/application-wizard/hooks/useMobileViewport.ts` — listens to `window.visualViewport`'s `resize`/`scroll` events (plus a `window.resize` fallback), and on every event writes `document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`)`. Falls back to `window.innerHeight` if `VisualViewport` doesn't exist in that browser.
- `src/components/wizard/WizardLayout.tsx` — the action bar (`actions` prop) is rendered as a **flex sibling** of `.wizard-content`, not nested inside the scrollable region. This was a deliberate correction I made during development: my first draft had `WizardActions` nested _inside_ the scrollable children, which technically also "sticks" via `position: sticky`, but relies on sticky-inside-a-scroll-container behavior, which is known to be inconsistent across mobile WebViews. Moving it to a true flex sibling means it simply never enters the scrolling region in the first place — nothing WebView-specific to go wrong.
- `src/utils/scrollFocusedFieldIntoView.ts`, wired via `onFocus` in `UserInfoStep.tsx` and `ServiceItemCard.tsx` (not on the Priority `<select>` — see below) — waits 250ms (`window.setTimeout`) before calling `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`, so the repositioning happens _after_ the keyboard's own show animation rather than fighting it mid-animation.

**Alternative considered:** plain `window.addEventListener('resize', ...)` reading `window.innerHeight` instead of `window.visualViewport`. Rejected because on the mobile browsers this actually targets, a keyboard opening frequently does **not** fire a `window.resize` at all (or reports the un-shrunk layout-viewport height) — `VisualViewport` is the API purpose-built to report the keyboard-shrunk visible area; `window.innerHeight` is kept only as the fallback for browsers where `VisualViewport` is unavailable, not as the primary mechanism.

**Why the Priority field is excluded from focus-scrolling:** selecting from a dropdown doesn't summon the same on-screen text keyboard that risks covering the field, so scrolling on its focus would be unnecessary movement with no corresponding problem to solve — matches the "use this selectively" principle rather than attaching the behavior to every focusable element indiscriminately.

---

## 5. LocalStorage

**Where updated:** `src/features/application-wizard/hooks/useDraftAutosave.ts` — a `useEffect` that watches `useWatch({ control })` (all form values) and `currentStep`, and calls `writeDraft()` (`src/storage/draftStorage.ts`) inside a `window.setTimeout(..., 400)`. The effect's cleanup function clears the previous timeout on every re-run, which is what makes it a debounce rather than a plain delayed write.

**Why 400ms, not every keystroke:**

- `localStorage.setItem` is synchronous and blocks the main thread. On every keystroke — including in the multiline "Description" field, or during a burst of typing — that's real, avoidable jank, and this app specifically targets lower-end mobile devices where that cost is higher.
- 400ms is short enough that a genuine crash loses at most ~400ms of the most recent typing (acceptable against "crash-resilient" — the requirement is not "zero data loss ever," it's "don't lose meaningful progress"), and long enough that a normal typing burst or a sequence of add/remove-service-item actions collapses into one write instead of one write per action.
- Writing on blur only was considered and rejected: a user who refreshes mid-field (never tabs away) would lose that field's content entirely, which fails the "track progress in real-time" requirement directly.

**Data consistency:** because the debounced write reads `values`/`currentStep` from the closure captured at the moment the effect last ran (not from some earlier stale render), and both are read together in the same render's effect invocation, the object passed to `writeDraft` is always an internally consistent pairing — there's no code path where a write can combine an old `currentStep` with new `values` or vice versa. On read, `readDraft()` re-validates the shape with a Zod schema (`storedDraftSchema` in `draftStorage.ts`) and additionally, restoration itself doesn't trust the stored `currentStep` outright — `getHighestReachableStep()` (`src/features/application-wizard/getHighestReachableStep.ts`) re-validates the actual restored _values_ against the real business schemas before `ApplicationWizardPage.tsx` decides which step to land on, so a stale or hand-edited draft can't desync "what step you're on" from "whether the data actually supports being there."

---

## 6. Performance Optimization

**Before (the naive version I recognized and avoided writing):**

```tsx
{
  fields.map((field, index) => (
    <ServiceItemCard key={index} index={index} onRemove={() => remove(index)} />
  ))
}
```

**After (actual code, `src/features/application-wizard/components/RequestConfigurationStep.tsx`):**

```tsx
const { fields, append, remove } = useFieldArray({
  control,
  name: 'requestConfiguration.services',
  keyName: 'formFieldKey',
})
// ...
{
  fields.map((field, index) => (
    <ServiceItemCard key={field.formFieldKey} index={index} onRemove={() => remove(index)} />
  ))
}
```

**Why this matters, precisely:** React Hook Form's registered inputs are _uncontrolled_ — the DOM node itself, not React state, holds the current keystrokes between renders. If the array is keyed by index and item 0 is removed, React sees "the element at position 0 still has key `0`" and reuses the _existing_ DOM subtree for what is now a _different_ data row, patching only the props it thinks changed. Because the input's live value lives in the DOM node (uncontrolled), not in a React-diffed prop, this reuse means the remaining row's on-screen input can end up showing an inherited value that doesn't match its new data-row — this is the classic bug this exact pattern is prone to, and it presents as "I removed the wrong item's data" rather than an obvious crash. Using `field.formFieldKey` (a stable id RHF generates per array entry, independent of position) means React always maps the correct DOM subtree to the correct row regardless of how the array shifts — only the row that was _actually_ removed unmounts; every other row's real DOM node (and its focus, scroll position, and in-progress keystroke state) is left untouched, which is strictly less reconciliation work in addition to being correct.

**Honesty about measurement:** I did not profile this with React DevTools or capture render-count/timing numbers — jsdom (this project's test environment) doesn't do real layout/paint, so a screenshot-based before/after profiler comparison isn't something I can honestly produce from this repo. What I _did_ verify is correctness, via a throwaway RTL test during development: added 3 service items, filled distinct names, removed the middle one, and asserted the two remaining cards kept their correct values (`First`, `Third`) rather than shifting. That test was deleted before committing (per this repo's convention of verify-then-clean-up, not commit-everything) — the fix itself is what's in the code; the verification step confirmed it actually works, and its absence from the committed suite is a conscious, stated trade-off (see Q7).

---

## 7. Testing Strategy

**Yes — 48 tests across 6 files, all committed:**

- `src/utils/regex.test.ts` — `EMAIL_REGEX`/`PHONE_REGEX` valid/invalid table cases
- `src/features/application-wizard/schemas/applicationSchema.test.ts` — `userInfoSchema`, `serviceItemSchema`, `applicationSchema`
- `src/features/application-wizard/defaults.test.ts` — `defaultValues`, `createEmptyServiceItem()`
- `src/storage/draftStorage.test.ts` — round-trip, malformed JSON, unsupported version, structurally-valid-but-business-invalid values, `clearDraft`
- `src/features/application-wizard/getHighestReachableStep.test.ts` — the four reachability cases (invalid user info / valid-user-invalid-service / all valid / all valid with zero services)
- `src/App.test.tsx` — smoke test

**Why these specifically:** they're pure functions and schemas — no DOM rendering, fastest to run, zero flake risk, and they encode the exact business rules that are easiest to silently break during a future refactor (loosen a regex by one character, forget to re-validate a restored step, etc.) without anything else in the app visibly failing until a user hits the edge case in production.

**What is _not_ in the committed suite, and why:** the wizard's interactive wiring — dynamic array add/remove/edit at the UI level, step-navigation blocking, the full submit success/failure flow, and the mobile sticky-footer layout. I verified all of these manually during development (throwaway React Testing Library tests for the interactive flows, an actual Playwright pass with real browser screenshots for the mobile layout — none of this is hypothetical, it's what I actually ran), but didn't commit them as permanent tests. This was a conscious one-day-scope trade-off, not an oversight.

**If prioritizing what to test next, in order:**

1. `useApplicationWizard`'s navigation/blocking logic — currently the _least_-covered actual logic in the app, and it's the literal mechanism behind "linear step enforcement." A silent regression here would let users bypass validation, which is one of the assignment's named core requirements.
2. The dynamic array's add/remove/edit integration path — this is exactly the correctness bug class discussed in Q6; a regression here is a data-integrity bug, not just a UI glitch.
3. The submission success/failure flow — lower priority than the above two because it's comparatively simple branching logic (`try`/`catch` around one `await`), with less surface area for a subtle bug to hide in.

---

## 8. Scalability

**10× more features, multiple developers, long-term maintenance — what I'd redesign first:**

- **The step model itself.** `src/features/application-wizard/constants.ts` currently hardcodes `WIZARD_STEPS` (an array of 3 labels) and `STEP_FIELDS` (a manually-indexed object of field-path arrays) as two separate literals, and `ApplicationWizardPage.tsx` has a hardcoded `{currentStep === 0 && <UserInfoStep />}` / `=== 1` / `=== 2` conditional chain. Adding a 4th step today means editing four different places (the steps array, the fields map, the render conditional, and the schema) with nothing enforcing they stay in sync. At 10× scale I'd collapse this into a single step-registry array — `{ id, label, fields, schema, Component }[]` — and derive everything else (`WIZARD_STEPS`, `STEP_FIELDS`, the render switch, even `getHighestReachableStep`'s per-step validation) from that one source. Adding a step becomes one array entry, not a four-file edit.
- **`useApplicationWizard`'s scope.** It currently owns three genuinely separate concerns in one file: step navigation, completed-step tracking, and submission handling. Fine solo; for a multi-developer team, I'd split submission out into its own `useApplicationSubmit` hook so two people can work on "how submission behaves" and "how step-gating behaves" without touching the same file or reviewing overlapping diffs.
- **`getHighestReachableStep`'s hardcoded two-step check.** It currently reads as an explicit "check userInfo, then check services" — fine for exactly 2 prior steps, but it doesn't generalize. With the step-registry redesign above, this becomes a loop that validates step _N_'s schema only if steps `0..N-1` already passed, which scales to however many steps exist without further edits.

---

## 9. Technical Challenge

**The hardest problem:** Node 25 (this environment's default, since this is a fresh dependency install at the time of building) ships its own native `localStorage` global, active by default without a `--localstorage-file` flag — and it collides with jsdom's implementation inside Vitest. `window.localStorage` and `globalThis.localStorage` turned out to be the _literal same broken object reference_, missing `clear()`, `getItem()`, and every other `Storage` method entirely.

**Why it was hard:** it first presented as a `TypeError: localStorage.clear is not a function` thrown from _my own test file_, which looks exactly like a bug in `draftStorage.ts`. It took writing a dedicated diagnostic test (`typeof window.localStorage`, comparing `window.localStorage === globalThis.localStorage` by reference, checking `typeof window.localStorage.clear`) to prove it wasn't my code at all — it was two different `localStorage` implementations, one of them broken, and jsdom's own copy wasn't the one actually installed on `window` in this Node version.

**Alternatives considered and rejected:**

1. `Object.defineProperty(globalThis, 'localStorage', { value: window.localStorage })` — tried first; proved useless once the diagnostic confirmed `window.localStorage` and `globalThis.localStorage` were already the same broken reference, so reassigning one from the other was a no-op.
2. Passing Node a `--localstorage-file` flag to give its native implementation a real backing file — rejected because it's an environment/launch-flag fix, not something naturally scoped to a single Vitest worker's setup file, and it still wouldn't guarantee jsdom's `window.localStorage` picks up that same backing implementation rather than its own.
3. **Final solution:** a small hand-written class implementing the `Storage` interface (`clear`, `getItem`, `setItem`, `removeItem`, `key`, `length`) backed by a `Map`, force-assigned via `Object.defineProperty` onto both `globalThis` and `window` in `src/test/setup.ts`.

**Why this is the best solution given the constraints:** it fixes the test environment without touching any production code path at all — `draftStorage.ts` still calls whatever `localStorage` a real browser provides, completely untouched. It's fully within my own control (no dependency on Node flags, jsdom internals, or environment variables that could silently differ across machines/CI), and it's a two-minute read for the next developer who opens `src/test/setup.ts`, versus a Node-version-pinning workaround, which would be a much blunter fix — locking an entire team to an older Node release just to route around one test-environment quirk.

---

## 10. Future Improvements

With one more week, in order:

1. **Split `useApplicationWizard`** into navigation and submission hooks (per Q8) — this unlocks the rest cleanly, since several of the following items touch one or the other but shouldn't need to touch both.
2. **The step-registry refactor** (per Q8) — turns the current "4 files to touch per new step" model into "1 array entry," which is the single highest-leverage change for anything beyond the current 3 fixed steps.
3. **Promote the deferred manual verification into permanent tests** — the navigation-blocking logic, dynamic-array UI interactions, and submission flow were all genuinely verified during development (not skipped), just not committed as lasting regression protection. This is the most direct way to convert "I checked this once" into "this stays checked."
4. The smaller, already-identified optional enhancements (draft-saved indicator, discard-draft button) — genuinely low-cost, nice-to-have UX polish once the above structural work is done, not before.
