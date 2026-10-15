# Collection list: Editorial — reference audit

Reference: Shopify theme `192341344555`, **Norda / Helix 1.2.1 (Trial)**, section `template--28546238710059__collection_list_editorial_UXtALG`.

Audit date: 2026-10-14. Implementation repository: Tapra, `main`.

## Evidence and fidelity boundary

Inspected the live Theme Editor and the storefront opened through its official Preview action. Temporary edits were used only to expose conditional controls, then discarded or undone. No reference theme changes were saved or published.

The Shopify CLI rejected a read of this theme: “No themes on the store … match the ID or name 192341344555.” The Editor identifies it as Trial. Therefore the original Liquid/schema files are unavailable through this access path. The observations below establish the visible controls and current values, **not** the original schema IDs, defaults, preset definitions, all `visible_if` expressions, or block limits. Current saved values must not be represented as schema defaults.

Implemented from the observed Editor UI and storefront behavior, as explicitly requested for the Trial reference. This is a reconstruction of the merchant-facing contract; original private schema IDs and source files are not claimed to be identical.

## Structure verified in the Editor

Three fixed slots, each hideable and not reorderable:

1. Header — repeatable child blocks.
2. View all button — currently hidden.
3. Collection list — repeatable Collection children; eight are currently configured.

Header Add block offers exactly: Editorial text, Heading, Image, Subheading, Text. Collection entries expose Collection resource, Custom title, Custom image. The original maximum/minimum item counts are not established.

## Section controls

| Group | Controls / current values | Observed limits/options |
| --- | --- | --- |
| Intro | Select collections in the 'Collection list' block | Informational paragraph |
| Width | Full | Page; Full; Full (no padding). Full uses value `page-full-width` |
| Alignment | Desktop; Mobile | Desktop Left/Center; Mobile Left/Center/Right |
| Divider | Show top divider; Show bottom divider | Toggles |
| Gap | Desktop 30px; Mobile 30px | 0–100, step 1 |
| Background | Media: None | None / Image / Video; conditional image/video controls not yet exhaustively audited |
| Color | Color scheme | Theme scheme selector |
| Padding | Top 50px; Bottom 50px | 0–200, step 2 |
| Mobile padding | Custom for mobile enabled; Top 40px; Bottom 40px | 0–100, step 2 |

No Section anchor control was observed.

## Collection list controls

| Group | Controls / current values | Options / limits |
| --- | --- | --- |
| Columns | Desktop 2; Mobile 2 | Desktop 1–4; Mobile 1–2 |
| Gap | Desktop 2px; Mobile 2px | 0–100, step 1 |
| Collection appearance | Border thickness 0px | 0–10, step 1 |
| Collection appearance | Show background enabled | Toggle |
| Collection appearance | Corner radius Inherit | Inherit=`inherit`; Square=`none`; Rounded=`xl`; Custom=`custom` |
| Collection appearance | Custom corner radius 0px | Visible for Custom; 0–40, step 1 |
| Collection appearance | Shadow None | None / Extra small / Small / Medium / Large; values none/xs/sm/md/lg |
| Collection title | Size Heading 2; Mobile size Heading 5 | Heading 1–6; values h1–h6 |
| Collection title | HTML tag Paragraph | Paragraph value `div`; H1–H6 |
| Collection title | Show product count enabled | Toggle |
| Collection title | Show navigation icon enabled | Toggle |
| Padding | Top and bottom 40px; Left and right 50px | 0–100, step 1 |
| Mobile padding | Top and bottom 20px; Left and right 16px | 0–100, step 1 |

## Header controls

- Limit width, currently on; Max width 750px, range 400–1100, step 10; conditional on Limit width.
- Gap: Desktop/Mobile, currently 6px; range 0–30, step 1.
- Padding: Top/Bottom 0–100, Left/Right 0–50, step 1; current values zero.
- Custom for mobile toggle; conditional padding fields require further verification.

### Child controls inspected

Subheading:

- Inline rich text; current “Shop by category”.
- Color: Heading / Text; Show background; Show icon.
- Icon: Circle, Square, Diamond, Sparkle, Line. Current Square.
- Animation: None, Fade, Scale, Slide from left/right/bottom. Current Slide from bottom, Delay 200ms.
- Top/Bottom padding; Custom for mobile.

Heading (temporarily added, then undone):

- Inline rich text; Size Heading 1–6 / Custom; HTML tag Paragraph / H1–H6.
- Custom typography exposes Text style Heading/Body/Accent; Font size; Line height; Letter spacing; Text case; Custom for mobile.
- Size group: Device Desktop/Mobile and Width Fit/Fill/Custom.
- Text highlight applies to italic text. Highlight font Default/Heading/Body/Accent; styles None, Text color, Underline soft/double/wavy, Circle outline, Highlight bar/solid.
- Animation includes None, Fade, Scale, Slide from left/right/bottom, Rotate words.
- Top/Bottom padding; Custom for mobile.

Editorial text, Image and Text were also inspected through temporary Header children:

- Text: Body/Accent/Custom font, six body sizes, custom typography, responsive width/limit width, Heading/Text color, animation and responsive top/bottom padding.
- Image: desktop/mobile image, mobile-first order, link/new tab; original, square, four portrait and three landscape ratios plus Fill height; responsive width/limit width, radius, animation and padding. Custom width 10–100% (default 50%); maximum width 50–1000px, step 10 (default 500px).
- Editorial text: textarea with [img1]–[img5], limit/max width, Heading 1–3/Custom typography, progressive scroll reveal with Slow/Medium/Fast and start opacity 0–100%; five separately configurable images with desktop/mobile widths and links; radius, animation and padding.
- Heading highlights: Gradient for text color/filled highlights, Rotation -5–5 degrees, and Highlight text color for solid fill. Animation delay supports 0–2000ms in 50ms steps (new block saved value 250ms).

## View all button controls

- Label; Link; Open link in new tab.
- Desktop Style: Primary, Secondary, Outline, Subtle, Text (current Text).
- Show icon; icon options: Arrow right, Long arrow right, Chevron, Arrow up, Circle arrow, Circle chevron, Long arrow up, Double chevron, Arrow outline, Square chevron, Plus.
- Icon position Left/Right; Icon size Inherit/Custom; Custom icon size 12–30px, step 1, current 16px.
- Mobile Style: same five styles (current Outline).
- Mobile Height: Inherit, Extra small, Small, Medium, Large, Extra large.
- Mobile Full width enabled; Mobile Show icon disabled.

## Storefront behavior verified

- Collection rows show title and navigation arrow. Empty entries show “Collection title”. Real collection count/link behavior still needs resource-selected QA.
- Desktop hover reveals a square preview beside the title, overhanging the row vertically. At the inspected desktop width its width is 33% of the row, left offset 66%, vertically centered; opacity changes from 0 to 1. It is an inline overlay, not a modal.
- At mobile width the preview is hidden; collection rows remain in the configured mobile column layout.
- Custom title/image are item-owned; appearance, title sizing, count/icon visibility, columns, gaps and row padding are list-owned.
- Header and View all button are independent fixed slots.

## Existing implementation candidates and gaps

- `sections/collection-list.liquid` already has the three-slot section architecture, responsive alignment, color scheme and background rendering.
- `blocks/header.liquid`, `blocks/eyebrow.liquid`, `blocks/view-all-button.liquid`, and existing typography/image kernels are reusable render foundations, but their schemas do not exactly match all reference controls.
- `blocks/collection-list-items.liquid` uses resource-list/card and carousel behavior. The reference uses repeatable Collection children with text rows and floating hover images, so it needs a distinct list/item composition.
- Reuse global button, typography, icon, spacing, background and reveal foundations. Do not alter base block settings merely to approximate a source-specific control surface.
- The user explicitly confirmed an Editor-driven implementation. Reference labels and control groups are retained in composition-specific adapters; original schema IDs/defaults remain unverified.


## Implementation and validation

- New section `sections/collection-list-editorial.liquid`; fixed Header, View all button, Collection list slots. Eight empty Collection children in the home demo after Slideshow.
- Header allows exactly five roles. Their adapters reuse the theme typography tokens, image/background renderer, button foundation, icons, progressive editorial text and block animation controller. Base block schemas were not changed.
- List owns all row appearance, title semantics/scale, visibility, columns and spacing. Item owns only collection/custom title/custom image. Parent-rendered tag substitution is server-side, so heading semantics do not depend on JavaScript.
- Empty rows do not expose a dead link or invented product count. Hover previews are decorative; real collection links also reveal previews on keyboard focus. Mobile preview is hidden. Editor selection highlights the actual row and exposes its preview.
- Theme Editor section name is `Collection list:Editorial` (one space omitted to fit the 25-character schema-name validation limit). Labels are intentionally literal English to match the specifically requested reference control surface; only storefront fallback copy uses locale keys.
- Shared button renderer accepts an opt-in sanitized inline-richtext label; ordinary callers still escape labels. Shared animation delay ceiling extended to 2000ms to cover the observed range; motion duration/easing remain theme-owned.
- Component CSS included in the shared deferred home bundle, so moving the section below the first two sections retains its styling.
- PASS: section/child settings accepted by Shopify development theme and visible in Editor; real collection picker, title, product count 3, image preview and row selection verified, then resource QA undone.
- PASS: desktop hover reveals a square image at 33% row width; mobile Editor preview keeps configured two-column rows.
- PASS: storefront widths 390/767/768/1149/1150px, no section overflow; mobile preview hidden, tablet one column, desktop configured two columns.
- PASS: Liquid tests cover resource/empty states, server-side semantic title tags, mobile zero padding, editorial markers and links, opt-in rich labels, schema preset values and deferred stylesheet availability. Shared animation/gallery regression tests included.
- PASS: Theme Check 0 errors; one additional advisory for the intentionally long Editorial text schema, consistent with the existing base Editorial text block. JavaScript syntax and diff whitespace checked.
- NOT TESTED exhaustively: every background media/parallax combination with actual assets, every highlight/font combination, and all source breakpoints/defaults that are not observable from the Editor. No byte-identical original-schema claim.
- Development theme only. No publish, commit or push performed for this section.

Naming adjustment: the local Header role is displayed as **Eyebrow**, following Tapra terminology. The private type remains unchanged to preserve existing saved blocks.


## Section standards normalization — 2026-10-15

Scope: section shell and section-owned Layout / Appearance / Padding only. Reference-specific block adapters were not refactored in this pass.

Found and fixed:
- Layout controls lacked their group and used reference labels. Group is now Layout, with Section width, Alignment, Customize for mobile / conditional Mobile alignment, Desktop gap / Mobile gap. Existing alignment IDs and width values are preserved; both alignments now use the shared text_alignment control. Mobile inherits desktop by default. Explicit saved mobile choices in local templates are preserved by enabling the new toggle.
- Appearance was fragmented into Background / Color / Divider groups. It now starts with Color scheme and optional blank Background color, followed by existing media/overlay/parallax controls and dividers. Background override covers the Shopify wrapper and leaves other scheme tokens intact. Overlay color supports alpha.
- Padding is the final group, using canonical locale labels and setting IDs. Existing 50px desktop / 40px mobile defaults and valid ranges are preserved. Padding now belongs to the section-spacing surface, with shared CSS variables; the inner width container has no section padding.
- Removed redundant semantic section nesting. Width uses the shared container classes, including full-width for the preserved no-padding option. Header consumes the shared alignment variables; the grid remains intentional to support the action beside the Header.

Validation:
- PASS: Editor shows Layout → Appearance → Padding, shared labels, and conditional mobile alignment.
- PASS: measured 767px padding 40/40px; 768/1149/1150px padding 50/50px; inner-container vertical padding 0; no horizontal overflow.
- PASS: Liquid tests cover mobile inheritance/toggle, explicit mobile zero, scheme fallback/background override, semantic shell and preserved full-bleed rendering.
- PASS: 27 scoped tests; Theme Check 0 errors (46 advisory warnings across the theme); diff whitespace check.
- Retained features: media, parallax, dividers, existing static slots and child settings. No commit or push.

Collection title normalization: Heading size / Mobile size now share the Heading kernel scale (Display, Extra large, Large, Medium, Small, Extra small, Custom). Desktop/mobile custom pixel ranges reuse Heading bounds. HTML Tag uses the shared labels/options/SEO help independently of visual scale. Existing IDs and XL/Small/Paragraph defaults preserved. Verified by 14 scoped tests and Theme Check.

Collection list Corner radius now shares the Image kernel option list and locale labels: Inherit, Square, fixed radius tokens, Rounded, Full, Custom. All options resolve to shared radius tokens; custom pixels retain the 0–40 range. Existing legacy none/xl render aliases retained. Verified by 15 scoped tests and Theme Check.

Navigation extension: Show navigation icon now reveals Icon and Display as controls. Five unique requested shapes (Chevron right and chevron-right treated as the same icon) use shared icons; Button/ Icon only defaults preserve the existing arrow-up-right icon. Button presentation reuses theme-button with an aria-hidden noninteractive span inside the existing row link. No nested buttons/links or extra keyboard stops. All icon/treatment combinations and hidden navigation covered by 16 scoped tests.

Editor hover precedence: on a fine pointer, hovering a collection suppresses every other row preview immediately, including selected/focused rows. Leaving the list restores the selected preview. Verified in a browser CSS fixture using the actual component stylesheet: selected-only → hovered-only → selected-only after transition. CSS-only change, no new listeners; deferred bundle rebuilt.

### News composition (2026-10-15)

Audited `#news` from the supplied JSFiddle's local prototype, `Tapra_demo_new-shatter-hero.html`: dark scheme, split heading/intro, six numbered rows, top/bottom rules, description slide reveal, plus icon and a right-aligned 4:5 preview moving between active rows. Touch/mobile shows descriptions persistently and omits hover previews.

The homepage `news` instance reuses `collection-list-editorial`; no new section implementation or anchor setting. List options own numbering (font role, token/custom size, weight, scheme-accent/custom color, desktop/mobile padding right), dividers, descriptions and preview treatment. Item options add description and optional custom destination. Number values are rendered server-side in child order, with no dependency on JavaScript. Empty destinations remain non-links; demo images remain placeholders until assigned in the Editor. Header's split layout uses its existing heading/text roles.

Verified actual Shopify rendering exposed whitespace in captured size tokens; normalize captures before comparing `custom` so numeric custom sizes work on Shopify as well as in LiquidJS. Numbering is decorative (`aria-hidden`) and titles retain independently chosen heading semantics.

### News motion correction

Following reveal now owns a single absolute preview stage containing the original decorative images. On row changes the previous layer stays fully revealed underneath the incoming higher layer; only after the incoming clip transition completes are obsolete layers cleared. Leaving wipes the stack upward, and the stage position interpolates between row centers. Editor unload cancels pending frames, disconnects ResizeObserver, restores preview markup and removes the stage. Standard card previews are unchanged. Added a lifecycle test covering overlap, cleanup, leave and unload.

Ambient background is an opt-in section Appearance control, enabled for News: scheme-derived radial blooms, vertical gradient and blurred diagonal bands. Collection rows opt into the existing SurfaceLight controller/global switch; divided rows constrain the edge light to their horizontal rules. The preview has outer white bloom and inner white edge, separate from the cursor spotlight. Desktop browser verification confirmed two overlapping visible layers with increasing z-index during the wipe and live SurfaceLight intensity; reduced motion skips transitions, touch/mobile hides the stage.

### Description layout and preview light adjustment

Removed the preview's outer bloom and inset white edge at merchant request. SurfaceLight on collection rows remains unchanged. Description-enabled rows explicitly place the navigation icon in the final grid track, including when a child has no description. At desktop widths, lists with two or more columns place descriptions below the title and show them persistently; one-column lists retain the side description reveal. Tablet follows its actual single-column layout, while mobile/touch retains the stacked description treatment. The owning list exposes its configured column count as data attributes for responsive CSS, without new settings.

### Rapid preview changes

A rapid return to an image that was still serving as the backing layer reset its clip and could expose an empty patch. Preview changes now finish the current wipe and retain only the latest hover intent; the stage position still follows the newest row immediately. No additional duration or timeout is introduced. Leave clears queued targets, stale transition completions cannot clear a new backing layer, and reduced motion flushes immediately. Added tests for rapid reversal and leave/re-entry; 22 scoped tests pass. Browser sequence 1 → 2 → 3 → 1 retained an opaque backing layer during the final wipe and settled on only image 1.

### Direct JSFiddle comparison supersedes queued preview behavior

Reopened the user's actual JSFiddle result iframe and inspected its rendered CSS. The previous serialization was intentionally removed: the reference immediately raises and restarts the hovered image, retaining old layers until 600ms after the latest hover. Implemented that behavior, including an instantaneous reset, next-frame reveal, immediate stage tracking, cleanup cancellation on leave, and upward exit. Central root motion tokens now own the reference values: reveal/follow 450ms, exit 300ms, clip easing `.65,0,.35,1`, follow easing `.22,.8,.24,1`. Cleanup derives 600ms from the computed 450ms reveal duration. Existing merchant requests to remove picture glow remain in force.

Browser comparison confirmed matching computed transitions, immediate active row 3 with rows 1 and 2 underneath during rapid 1→2→3, and only row 3 after cleanup. Scoped regression tests were updated to verify immediate switching rather than the rejected queue; 22 pass.

### Direction and editor selection override

Directional reveal preserves immediate switching and the reference timing: moving to a later row reveals upward from the bottom, moving to an earlier row reveals downward from the top. Browser computed clips confirmed both directions during transition.

Hovering a different row revokes the previous row's custom editor-active state. A suppressed flag prevents retained focus from restoring its picture or description on pointer leave; another explicit block selection clears suppression. This applies to both standard and following-reveal lists, without modifying Shopify's sidebar selection itself. Added direction and select→hover-other→leave→reselect regression coverage; 24 scoped tests pass.

### Flicker fix beyond reference behavior

Recycling an already-visible image now first clones its decorative visual at the computed clip-path and existing stack order. This freezes the painted backing while the original starts its next directional wipe immediately. Temporary backing copies are removed after the current reveal settles and on Editor unload. Cleanup starts from the actual reveal frame, avoiding premature cleanup if a frame is delayed. Leaving clips the entire composite stage so frozen fragments cannot linger; re-entry reverses that stage clip without teleporting a visible stack. Added painted-backing and fast-re-entry tests; 26 scoped tests pass. Browser 1→2→1 showed one frozen backing during the wipe, returning to six original previews and zero frozen copies afterward.

### Real-photo verification and stable opaque backing

Assigned three different existing Shopify library photographs (portrait, bracelet, orange phone) to the first three rows in an isolated, unsaved Theme Editor session. Confirmed the actual pictures rendered and exercised fast downward/upward pointer drags across the rows. All three test assignments were undone and Save returned disabled; other Editor tabs were untouched.

Previews now eagerly decode their actual images before starting a reveal, with an intent counter preventing late decode from displaying an obsolete row. A single full-image backing remains beneath directional wipes and is refreshed only after settling, preventing opposite interrupted clips from exposing the section background. Original painted-clip preservation remains for quick returns. The stage itself clips initial entrance and composite exit. Added decode-race and opaque-base regression cases: 28 scoped tests pass. Screenshot: `/private/tmp/tapra-real-photos-fast-hover-fixed.png`.

### Stationary pointer during scroll

Remember mouse viewport coordinates and perform one elementFromPoint hit test per animation frame on captured document scroll, including nested scroll containers. The row beneath a stationary pointer now updates preview, description and Editor suppression consistently. Explicit pointer-active classes also override stale native :hover for standard previews. Leaving the document or unloading the section cancels pending work and clears tracking. Added scroll-hit and lifecycle tests; 30 scoped tests pass. Browser verification used only Down key scrolling after hovering row 1: row 2 became pointer-active and preview-active without moving the mouse.
