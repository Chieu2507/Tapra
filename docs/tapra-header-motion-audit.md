# Tapra header motion audit — 2026-10-13

## Final whole-group child-menu motion — 2026-10-14

The user's final direction supersedes per-column/per-item reveal: the complete
child-menu group, including banners, fades and translates Y20→0 on opening
(700ms) and Y0→20 on closing (300ms). Basic animates its layout wrapper; Compact
animates its submenu wrapper. Both share duration/easing tokens. Removed child
keyframes, stagger variables and index markup/controller setup. Compact closing
keeps the group rendered through the 300ms exit; opening establishes the Y20
state before the shared overlay reveals it. Mobile retains horizontal drill-down.

Single Compact banner fills the content width (observed608px); two banners keep
two columns (298px each). Local Compact open/close inspection confirmed a 500ms
group entrance, 300ms exit approaching Y20/opacity0, and no child animations.
55 related tests pass; syntax/whitespace pass; Theme Check 0 errors/45 warnings.
Basic group motion was source-reviewed; live Basic mode not retested in this
pass. Evidence: `output/header-motion-audit/menu-whole-group-motion.png`.

## Compact category hover intent — 2026-10-14

Compact category hover now waits 160ms before selecting a new panel. Pointer
leave cancels the pending selection, so rapid crossings keep the current panel
instead of repeatedly restarting its reveal. Keyboard focus and clicks remain
immediate. Opening, closing and section unload clear pending hover work.

Regression tests cover a quick crossing, deliberate dwell, close/unload
cancellation and immediate keyboard selection. Native Chrome pointer movement
confirmed Collections activates without navigating. Evidence:
`output/header-motion-audit/compact-hover-intent.png`.

## Menu → Search shell handoff — 2026-10-14

Reproduced a separate drift in the exact menu-to-search sequence: desktop menu
closing selectors overrode the active Search geometry, shrinking the header row
from 64px toward 48px before it returned. The shell/row/container closing rules
now apply only when Compact Search is not opening or open. The outgoing menu
still fades while the existing expanded bar remains in place.

After correction, 35 consecutive local DOM observations during the handoff
reported row 64px, logo top37, panel top81 and shell width900 without variation.
Before correction the same sequence showed row64→approximately50 and logo37→30.
34 related tests pass; Theme Check 0 errors/45 warnings; diff whitespace passes.
Evidence: `output/header-motion-audit/menu-to-search-no-collapse.png`.

## Shared Basic/Compact child-menu reveal — 2026-10-14

Desktop Compact child menus now use Basic's shared reveal tokens and keyframe:
620ms duration, cubic-bezier(.25,.8,.25,1), 90ms initial delay, 75ms per column,
45ms per row and 8px upward translation. Titles and row wrappers animate;
columns and the panel stay stationary, with a 260ms surface fade. Mobile
drill-down retains its horizontal slide. Liquid emits Compact indices before
the deferred controller loads. Cart snapshots now also freeze computed
`translate` so a mid-reveal handoff retains the current visual position.

Local computed-style QA confirmed matching duration/easing/delays on all four
Shop columns. 21 related Compact/cart tests pass; JS syntax and whitespace
checks pass. Theme Check: 0 errors, 45 warnings. Evidence:
`output/header-motion-audit/compact-menu-reveal-synced.png`.

## Stable Compact Search anchor — 2026-10-14

Search previously measured the animated header row's bottom, so its panel moved
from about y67 to y81 as the row grew from 48px to 64px. The panel now anchors
to the expanded row's 64px height plus the current shell top, border and padding.
Header expansion and input fade remain intact; Classic Search is unaffected.
Local desktop and Auto390 mobile inspection confirmed panel top y81 both during
opening (row approximately 50px) and after completion (row 64px), with transform
none. 34 related tests pass, including anchor regressions for intermediate row
heights and safe-area padding; syntax and whitespace checks pass. Theme Check:
0 errors, 45 warnings. Evidence: `output/header-motion-audit/search-position-stable-desktop.png`.

## Menu dismissal synchronization — 2026-10-14

The shared overlay now emits `closing` immediately after entering its closing
state. The header synchronizes its shell and toggle at that event, rather than
waiting for `close` after the fade finishes. Button, outside dismissal and Escape
within the menu now start the same icon/shell transition. Outside pointer
dismissal does not restore opener focus.

Local desktop QA confirmed `drawer: closing`, shell open false and toggle
expanded false immediately after either the toggle or an outside click. Mobile
Escape within the menu produced the same state. 49 related tests pass, including
the new notification-timing regression; JS syntax and diff whitespace pass.
Theme Check: 0 errors, 45 warnings. Screen evidence:
`output/header-motion-audit/menu-backdrop-close-synced.png`.

## Final pre-commit verification — 2026-10-14

- Final selection: Compact header, Cart Drawer presentation, Auto mobile width.
- Classic Search retains the original full-width surface below the header and content-driven height; input colors resolve in the selected scheme.
- 50 related account, Compact motion, cart geometry/add, shared overlay and collection mobile tests pass. Changed JavaScript syntax and diff whitespace pass. Theme Check: 0 errors, 45 warning offenses.
- `theme-settings.test.cjs`: 3 pass, 2 fail. The same two failures reproduce from clean HEAD files in a temporary directory: legacy color-scheme output assertion and outdated Footer block lookup. No new failures were introduced.
- Prior local screen QA is recorded below and in `drawer-mobile-width-audit.md`. Theme Editor save/reload for the new controls remains NOT TESTED. Generated screenshots and earlier unrelated reference audits are left outside this implementation commit.

## Basic desktop mega-menu reveal — 2026-10-14

- Removed opposing motion between the surface and entire columns. The surface uses a reversible 260ms entrance fade and 200ms exit fade.
- After the user's pacing feedback, titles and individual row wrappers reveal over 620ms with an 8px upward translation and a gentler ease-out curve. Column starts are separated by 75ms; rows by 45ms, starting after 90ms. Liquid supplies indices, with capped delays for long lists.
- Individual `translate` preserves link hover transforms. Reveal stays attached during closing, preventing rows from resetting mid-exit. These selectors affect desktop Basic only.
- Local Chrome screen inspection and computed-style QA confirmed stationary columns/surface, increasing row delays, and retained row animation during Escape close. Theme Check: 0 errors, 45 existing warnings. Diff whitespace: PASS. Theme Editor lifecycle: NOT TESTED (no schema changes).
- Evidence: `output/header-motion-audit/menu-basic-stagger-slower.png`.

Reference: `/Users/chieutrinh/Downloads/Tapra_demo1_shatter-hero.html`, CSS lines 333–442 and menu/cart controller lines 1147–1224. The file can be read from disk; browser automation blocks its `file://` URL. Runtime QA uses the existing localhost Shopify preview.

## Follow-up: direct screen comparison

The first audit did not establish full visual fidelity. After the user supplied https://jsfiddle.net/c0xuztb3/, the running result was clicked and observed through successive screenshots for cart open, cart close, and expanded menu → cart.

Observed differences addressed:

- The demo maintains a continuous pill: its logo/actions fade out on opening and return on the moving shell during closing. The previous implementation hid the header immediately and revealed it at the center before the cart arrived. An inert visual copy of the current bar now travels in the cart shell; the real header stays hidden through closing and resumes after the shell returns. The copy has no IDs, interaction data attributes, editor ownership or mounted account custom elements, and is excluded from accessibility/focus traversal.
- Expanded menu → cart starts at the current menu dimensions. Previously the cart reset to 288×50 first. Geometry now samples the current width/height before closing the menu, including a partially expanded shell. A visual copy of menu content fades for 250ms during the handoff.
- Cart title/close control reveal uses 400ms after 700ms; body/footer use 450ms after 750ms. The moving surface inherits the header's computed background, border, blur and shadow.
- Screen QA on localhost confirmed a 900×473 menu handed off to the cart, a moving return pill containing the logo/actions, no duplicate IDs in the inert copy, and menu opening normally after cart closes. Native interaction and content differences remain intentional; this is not a claim of pixel-identical merchant content or complete mobile QA.

Updated screen evidence: `output/header-motion-audit/cart-return-pill.jpg` shows the pill with its logo/actions while it is still moving back to center.

### Follow-up: early title/close reveal

The user caught title/close appearing while the shell was still a moving pill. The legacy `.cart-drawer--animated.is-open` keyframe animation was still assigned to the header/footer; animation opacity took precedence over Compact's delayed transition. The legacy reveal selectors now exclude `.cart-drawer--compact`. Local runtime inspection during opening confirmed a 288×50 moving shell with header opacity `0`, animation name `none`, and a 400ms opacity transition after 700ms. Screen evidence: `output/header-motion-audit/cart-opening-title-hidden.jpg`.

### Mobile viewport QA

Local preview was tested in an isolated in-app browser at 320×568, 390×844 and 414×896; its viewport override was reset afterward.

- Fixed the mobile drawer's zero-radius override applying to Compact's initial pill. Closed-origin motion now starts at radius 24px; fullscreen-menu origin starts at its actual radius 0px and transitions to 26px.
- Kept the cart action available in the open mobile menu so menu → cart can be operated directly.
- Fullscreen menu handoff preserves its 390×844/top-0 origin without early width/height clipping, then reaches the floating cart at top 16px. Closing returns to the floating header at top 16px without a vertical jump.
- PASS at 390×844: fullscreen menu → cart; title opacity 0 at start; final cart 366×680, left/right 12px, top 16px, radius 26px; close returns to 288×50 header. No horizontal overflow.
- PASS at 320×568: initial moving pill radius 24px with title opacity 0; final cart 296×540, top 16px, bottom 556px; open/close and search open/close. No horizontal overflow.
- PASS at 414×896: menu open/close, three-level drill-down and two Back actions; final header 288×50 at top 16px; menu/cart/search all closed afterward.
- This is responsive viewport QA, not a physical iOS/Android device test. The isolated browser had an empty cart; desktop QA covered a populated cart.
- Updated validation: 45 related tests pass; JavaScript syntax and diff checks pass; Theme Check has zero errors.

Evidence: `output/header-motion-audit/cart-mobile-390.jpg`.

## Reference and implementation

| Surface | Opening | Closing |
|---|---|---|
| Menu shell | Width/radius 600ms; height 350ms because demo `set(true)` calls `pick()` and enables `.fast` | Width/height/radius 600ms |
| Menu content | Opacity 400ms after 250ms; category stagger begins at 300ms, 50ms per category | Opacity 250ms immediately |
| Cart shell | Translate 550ms immediately; width/height/radius/expansion offset 600ms after 300ms | Contract 600ms immediately; return translation 550ms after 300ms |
| Cart content | Opacity 450ms after 750ms | Opacity 200ms immediately |
| Cart backdrop | Opacity 450ms | Opacity 450ms immediately |
| Search shell/content | Same geometry and content timing as menu | Same geometry and content timing as menu |
| Login | Existing Shopify native dialog verified at 600ms with header easing | Native Shopify lifecycle retained; observed native close timing is 240ms |

Geometry easing: `cubic-bezier(.76, 0, .24, 1)`; content fades use CSS `ease`, as in the demo.

## Findings addressed

- Cart previously slid in from outside the viewport. Compact now starts at the resting pill's center/top, moves right, and expands left with a fixed 12px right gutter. The cart uses real Shopify content, shared overlay focus/scroll locking and close lifecycle. Basic continues using its existing drawer.
- Search previously revealed after 400ms and delayed shell collapse by 125ms. It now uses the menu's 250ms reveal delay and starts collapse immediately.
- Menu content exit was 200ms and translated vertically. It now fades for 250ms without moving the whole body; individual navigation items retain their own animation.
- Opening height was 600ms. It now follows the demo's actual 350ms fast-height path, while closing stays 600ms.

Existing intentional differences from the demo: merchant-configured theme content/schemes; 44px controls; mobile menu's full-screen/drill-down architecture; cart uses its existing content renderer and an inert visual handoff rather than physically moving the interactive header DOM.

## Validation

- PASS: JavaScript syntax and `git diff --check`.
- PASS: 44 tests covering cart readiness, overlay lifecycle/focus, menu measurement, deferred account initialization, and cart origin geometry at viewport widths 320/390/768/1920.
- PASS: Shopify Theme Check reports zero errors (repository warnings remain).
- PASS: Desktop localhost preview at 1920×1032: cart opens to 410×680 at top 16px/right 12px; content appears; close returns the header; menu opens/closes; search opens/closes with matching computed content timings; login opens with computed 600ms animation and closes.
- PASS: Final computed menu shell opening transition is width 600ms / height 350ms / radius 600ms.
- NOT TESTED: Reduced-motion browser interaction, physical mobile devices and Theme Editor section reload. Mobile viewport interaction is covered by the follow-up above; the earlier Chrome viewport restriction was avoided by testing localhost in a separate in-app browser containing no file tabs.
- Architecture: existing components reused; no schema, settings, saved merchant data, or translation changes. No preview watcher was started by this audit.

Evidence: `output/header-motion-audit/cart-desktop.jpg`.

Overall: PASS WITH FOLLOW-UPS for mobile/reduced-motion/editor visual QA.
