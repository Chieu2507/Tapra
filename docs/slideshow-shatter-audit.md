# Slideshow Shatter audit and build plan

Audit date: 2026-10-16. Working branch: `main`.
Reference: [JSFiddle revision 2](https://jsfiddle.net/1shw25og/2/).

The reference hero needs a dedicated Canvas renderer and interaction controller. Build it as a separate editable section, **Slideshow: Shatter**, sharing Tapra foundations with the existing slideshow. The current Swiper section supports slide/fade transitions and a conventional content stack; its renderer cannot reproduce this assembly simulation through a transition option alone.

## Evidence

- Read the exact revision's HTML from its `editor-bootstrap` JSON. CSS and JavaScript panels are empty; the HTML panel contains the full page, styles, scripts and embedded images.
- The JSFiddle editor browser navigation stalled and its configured direct result URL returned 404. Rendered the unchanged HTML panel on an isolated localhost server instead. Browser observations below describe that local rendering of the reference source.
- Verified desktop at 1280 × 720: two canvases, backing resolution 2560 × 1440 each, split heading, scattered picture pieces, assembly card, progress bar and numbered pagination.
- Verified pagination activation updates the visible heading to the second slide. Observed automatic cycling through all three headings.
- Verified mobile at 390 × 844 with scroll position zero: hero fills 844px, heading computes to 44px, assembly card is hidden, pagination is centered at the bottom, no document horizontal overflow.
- Hold thresholds, physics and transition timings below are source findings. The automated long-click attempt did not establish a reliable held state; actual desktop hold/release and touch gestures remain build QA requirements.
- Reference source snapshots and browser capture are temporary audit evidence under `/private/tmp/`; runtime theme assets were not changed during this audit.

## Visual composition

| Element | Reference behavior |
| --- | --- |
| Surface | Full viewport width; `100svh` with `100vh` fallback; minimum height 600px; navy radial background brightening toward the bottom |
| Artwork | Centered square picture divided into a 9 × 9 grid of rounded keycap pieces; roughly 70% begin assembled in the center, remaining pieces scatter radially |
| Layers | Back canvas at z-index 1; front canvas and controls at 3; HTML heading at 4; page header and cursor above these |
| Heading | One semantic heading with two separately positioned text spans; upper left and lower right; line breaks preserved |
| Final typography | Later CSS overrides the initial hero rule: weight 600, letter spacing 0, line height 1.15; size `clamp(44px, 8.4vw, 168px)` unless the hero size variable is supplied |
| Heading placement | Desktop: left/right 2.4vw, upper top 19%, lower bottom 17%. Mobile: upper top 16%, lower bottom 24% |
| Assembly card | Lower left; 198px declared width with border-box sizing; live percentage, status label, small bar and instruction; hidden on mobile |
| Glass surfaces | Final shared overrides use navy at 60% opacity, 10px blur, saturation 1.3 and a translucent white border for card/pagination |
| Progress | Center bottom; maximum width 340px; height 4px; idle countdown for automatic slide advance |
| Pagination | Numbered buttons 1–3 in a glass pill; lower right on desktop; centered on mobile; active button uses `aria-current` |
| Cursor | Circular pointer ornament with a hold instruction; scales during assembly; hidden for touch and reduced motion |

The pill header belongs to the existing global header. It is outside this section's build scope.

## Content and images

The reference has three slides. Each has an image and two title fragments. Images are embedded directly in the source, while slide text and count are hard-coded in JavaScript. The active image is cropped to a square; horizontal focal positions are individually specified as approximately 57.1%, 56.25% and 52%.

The function named `voronoi` actually generates rounded rectangular grid pieces. There is no triangulation, WebGL engine or third-party animation dependency. For the active square aspect ratio, the picture width and height are the lesser of 64% of hero height and 52% of hero width. This explains the relatively small artwork on narrow mobile screens.

In Shopify, images and text must come from editable Slide blocks. Use Shopify-hosted image selections, optional mobile image and image focal data. Keep images independent of collections elsewhere on the page. Avoid copying base64 pictures into theme assets or template settings.

## Interaction and timing

| Trigger | Reference implementation |
| --- | --- |
| Idle | Scattered pieces drift with spring/damping motion; idle timer runs for 8000ms before starting the next transition |
| Slide transition | Artwork fades/scatters for about 1000ms, swaps image and text, fades in over about 600ms, completes after about 1700ms; idle countdown then restarts |
| Heading exit | Upper fragment moves up 30px; lower moves down 30px; 650ms fade/move |
| Heading entrance | Fragments enter from opposite 30px offsets; 1000ms with easing `.22,1,.36,1`; explicit final state is restored after 1150ms |
| Pagination | Select a target slide; ignored while transitioning, while holding, or when selecting the current slide |
| Arrow keys | Left/right cycle slides while the hero is intersecting the viewport; source listener is global |
| Pointer proximity | A scattered piece within 85px of the pointer temporarily returns home for 2800ms |
| Click | A short click on the hero gives pieces a soft radial burst; UI controls are excluded |
| Hold | Starts after 200ms for mouse, 260ms for touch; pauses idle countdown and draws all pieces home; nearly assembled pieces morph toward seamless square tiles |
| Release | Removes the hold state, returns outer pieces to their scattered state, suppresses the synthesized click for 400ms |
| Gesture cancellation | Moving more than 12px before hold activation cancels the pending hold so scrolling can continue |
| Light | Pointer-following glow beneath the picture and per-piece edge light; separate from the DOM SurfaceLight renderer |
| Visibility | IntersectionObserver starts/stops the animation loop as the hero enters/leaves view; DPR capped at 2 |

The effective automatic cycle includes the transition: approximately 8 seconds idle plus 1.7 seconds changing slides. The reference does not provide swipe navigation or previous/next arrow buttons.

## Responsive mapping

The reference changes layout at 760px. Tapra's mobile boundary is 767.98px; use the theme boundary in the implementation and explicitly compare 760/761/767/768px for the narrow band where behavior changes from the prototype.

- Mobile hides the assembly card and keeps hold interaction available through touch.
- Mobile progress is 78px above the bottom; pagination is 26px above the bottom. Desktop progress is 48px above the bottom, pagination/card 34px.
- The 600px minimum height can exceed a short landscape viewport. Expose height/minimum height through the owning section and test landscape deliberately.
- Tablet inherits desktop composition unless a supported setting changes it; do not invent separate tablet offsets to match one frame.
- Long or translated headings need wrapping/size constraints. The reference only establishes its short demo text.

## Gaps to correct for Shopify

1. **Lifecycle and multiple instances.** The prototype uses global IDs, global pointer/keyboard handlers, observers, resize timeouts and a repeating headline recovery interval without teardown. Scope each controller to its section and destroy every listener, observer, timer and animation frame on unload.
2. **Reduced motion.** The initial flag only disables drift amplitude, a non-forced click burst and the cursor. Autoplay, forced slide bursts, assembly physics and JavaScript inline heading transitions still run. Provide an actual static-image mode with immediate manual changes, no continuous simulation and no automatic cycling when reduced motion is requested.
3. **Autoplay controls.** Add a visible, accessible pause/resume control. Pause on keyboard focus, hold, hidden document and Editor selection; prevent unexpected resume while another pause reason remains active.
4. **Keyboard ownership.** Handle arrow keys only inside the focused section; do not capture arrows used in unrelated page controls or Theme Editor inputs. Provide a keyboard-accessible assemble action instead of making hold the sole route to that effect.
5. **Fallback rendering.** Server-render a real image/placeholder and accessible heading before enhancement. Retain a useful result when JavaScript, Canvas context creation, image loading or decoding fails. Canvas is decorative, not the only content representation.
6. **Images and performance.** Load the initial image first and prepare subsequent slides without blocking the first frame on every image. Use responsive sources and decode readiness; avoid changing to a missing or not-yet-ready image. Canvas color sampling must tolerate CORS restrictions without breaking drawing.
7. **Visibility and clock recovery.** Use document visibility as well as intersection state. Clamp elapsed time after tab sleep and settle an interrupted transition to a valid slide. The prototype's timers can finish a transition while the RAF is stopped.
8. **Touch and links.** Keep vertical scroll available; cancel hold on pointer cancellation, blur, unload and gesture movement. Exclude links, buttons and editor controls from burst/hold activation. A whole-image destination would conflict with click-to-burst and is not part of the reference.
9. **Controls and announcements.** Increase the 30px pagination button hit areas to the theme target size, retain visible focus, and avoid announcing the assembly percentage on every frame. Headline semantics and image alternative text must remain meaningful across slide changes.
10. **Theme tokens.** Use theme typography, color schemes, radius and motion foundations. Respect the existing pointer-light setting for Canvas light; the DOM SurfaceLight controller cannot paint edges inside a canvas. Do not duplicate the global header or a second theme-wide light controller.

## Proposed section contract

| Concern | Owner and proposed implementation |
| --- | --- |
| Identity | New `slideshow-shatter` dynamic content section, initially enabled on the homepage; display name `Slideshow: Shatter` |
| Placement | Addable/reorderable/removable in the homepage JSON template; meaningful three-slide preset; no resource context |
| Foundation | Section spacing/background surface and existing width/container conventions; background may bleed while headings and controls use the chosen content container |
| Section settings | Layout/height, color scheme and ambient background, autoplay/interval, pagination/progress/status visibility, assembly interaction toggle, final canonical Padding group with mobile inheritance |
| Slide blocks | Repeatable dedicated slide type; merchant add/remove/reorder/duplicate; image/mobile image and editable two-part headline; no copied collection/product data |
| Typography | Reuse existing Heading typography and semantic contracts through a compatible composition; do not invent a second font system. Heading tag remains independent of display scale |
| Runtime state | Assembly percentage, active index, decoded images, physics, pause reasons and transition state are runtime values rather than saved settings |
| Motion | Named implementation defaults reproduce the source timings; use central motion tokens where applicable. Avoid exposing individual spring constants as merchant settings |
| Empty state | No slides: safe editor placeholder. One slide: no autoplay or unnecessary pagination. Missing image: useful static placeholder and intact headline |
| App policy | No app blocks inside the simulation slide; no nested slide type; global header remains independently editable |
| Output | Stable section root and slide attributes; Shopify editor attributes on real slide roots; canvases and decorative fragments hidden from accessibility APIs |
| Editor | Selecting a Slide activates it immediately and pauses autoplay; add/remove/reorder/settings changes rebuild idempotently; duplicate sections do not share state |

Suggested implementation files: `sections/slideshow-shatter.liquid`, a dedicated slide block, `assets/slideshow-shatter.js` and `assets/component-slideshow-shatter.css`, plus locale strings and focused lifecycle/interaction tests. Reuse existing render helpers when their contract fits; leave the conventional slideshow's behavior intact.

## Build order and acceptance

1. Establish section/slide schema and server-rendered image/headline fallback. Verify add/remove/reorder and independent instances before physics.
2. Match the square crop, 9 × 9 keycap geometry, 70% assembly and two Canvas layers. Compare actual Shopify CDN images with the reference.
3. Implement spring simulation, pointer proximity, burst, hold/release and Canvas light under an instance controller.
4. Add the transition state machine, split-heading motion, pagination/progress and pause controls. Preserve valid end states during rapid input and hidden tabs.
5. Verify Editor selection, settings reload, section duplication/unload and image-source changes, then responsive/accessibility/performance QA.

Acceptance matrix: 390/760/761/767/768/1149/1150px and a wide desktop; short landscape; empty/one/many slides; missing/slow images; long titles; two instances; reduced motion; global pointer light off; keyboard; mouse hold/release; touch hold versus scroll; quick pagination; background tab resume; Editor add/remove/duplicate/reorder/select/save/reload.

Required release checks: valid schemas and settings consumers, JavaScript syntax, Theme Check with no errors, focused state/lifecycle tests, desktop/mobile storefront comparison and Theme Editor verification. This audit records a build proposal, not an implemented or validated Shopify section.

## Implementation completed on 2026-10-16

Built on `main` as `sections/slideshow-shatter.liquid`, with `_slideshow-shatter-slide` theme blocks and dedicated CSS/JavaScript assets. Added the homepage demo as its first section; the conventional slideshow is retained and disabled in saved template data. No Custom CSS is used.

Three original reference photographs were uploaded to Shopify Files on `layouthub-template-v2` after explicit user approval. Saved image selections use `shopify://shop_images/tapra-shatter-slide-1.webp` through `-3.webp`; images and two-part headlines remain editable per slide. Demo uses Scheme 3 for white headings on navy. Merchant focal points drive both Canvas source crops and the shared image renderer; original source-specific focal percentages are not forced onto newly selected artwork.

The renderer uses two DPR-capped canvases, 81 rounded keycaps and exactly 57 initial home pieces, with pointer proximity, click burst, held/toggled assembly and numbered slide controls. Added accessible Assemble and Pause/Play controls. A native `slideshow-shatter` custom element creates one controller per instance and destroys it when disconnected, covering Editor insertion, duplication, replacement and removal without per-load global bootstrap listeners. Slide selection activates its owning block and pauses autoplay. Image preparation has intent guards for startup, navigation and desktop/mobile source races.

Reduced motion uses the server-rendered image with manual slide selection, hides assembly/autoplay controls and stops the simulation. Canvas/context/image failure retains the static fallback. Visibility and intersection stop clocks; focus, manual pause, held assembly and Editor selection prevent automatic advance. Control height determines mobile progress placement so wrapped controls do not overlap it.

Validation:

- PASS: 12 dedicated render/state/lifecycle tests, including delayed image selection races and mobile source refresh; 34 existing Editorial and slideshow Editor regression tests. Total: 46 passing tests.
- PASS: JavaScript syntax and `git diff --check`.
- PASS: Theme Check, 0 errors; 47 existing warnings across the theme, none in the new Shatter section/block.
- PASS: actual Shopify CDN artwork draws into the canvases; displayed assembly reaches 100% through the Assemble control and returns to scattered mode.
- PASS: pagination, pause and keyboard arrow navigation in storefront preview.
- PASS: full-bleed width and no horizontal document overflow at 390, 767, 768, 1149, 1150 and 1440px; mobile status card hidden and responsive heading scale visible.
- PASS: Theme Editor displays section/slide settings and image pickers; selecting the second Slide displays its picture and headline. A temporary heading edit rendered immediately, then was undone. Section duplication rendered successfully and was undone. Save returned disabled after QA.
- LIMIT: physical touch scrolling/long-press was not tested on a real device. Reduced motion is covered by state tests and CSS but was not toggled at OS level during browser QA. Keyboard Assemble was verified to 100%; a sustained native mouse press was not independently established by the available browser automation.

Shopify preview remains on port 9292 against unpublished theme `192330793259`. No commit, push or publish was performed. Existing unrelated slideshow pagination CSS and audit artifacts were preserved.

## Native settings normalization

Section width now follows Page width / Full width / Full width (no padding). Height presets, optional tablet height, custom pixel heights, autoplay/hover pause, pagination types (progress bar, bullets, numbers), bullet styles and responsive pagination alignment follow the existing Slideshow contracts. Canonical Appearance and Padding groups remain in place.

Each Slide now renders two independently editable/hideable static instances of the shared Heading block. Heading owns text, typography, semantic tag and color; Slide owns each Heading's nine-position desktop placement, optional mobile placement and content padding. Static slots offer no unused dynamic Add block action. Existing three images and texts were migrated to this structure; homepage keeps full-screen heights, numbered pagination and its existing autoplay behavior.

Validation: 68 targeted Shatter, Slideshow and Editorial regression tests passed; the final static-slot adjustment passed all 17 Shatter tests. Theme Check reports zero errors and no Shatter offenses. Browser QA verified custom desktop/tablet/mobile heights at 1280/900/390px, independent mobile Heading placement, circular bullets, image-adapt height and no horizontal overflow. Temporary QA template values were restored.

Editor autoplay follow-up: selecting the section no longer pauses the clock. Selecting a Slide/Heading still freezes its content for editing, but the control now displays Play and explicitly resumes from that editor pause. Deselecting a block preserves any deliberate manual pause. All 18 Shatter tests, JavaScript syntax and diff whitespace checks pass.

Progress-bar pagination now highlights only the active slide segment at full brightness. Inactive segments remain dim, including previously visited slides; this indicator no longer accumulates completed segments or partially fills the active segment. The independent autoplay progress and circular-bullet timer retain their behavior. All 18 Shatter tests pass.

Final pagination scope: removed Progress bar from the Type picker at the user's request. Type now offers only Bullets and Numbers. Removed segmented-bar rendering and styling; the separate Show autoplay progress bar control depends only on autoplay. All 18 Shatter tests pass after this change.

Desktop pagination alignment follow-up: Center positions the separate autoplay progress bar against the right content edge. Its width is capped by the measured control group width and available right-side space, keeping a gap from centered controls. Mobile positioning remains independent.

## Content groups and icon alignment

Slides now provide two static, hideable Content slots, enforcing a maximum of two groups without an unsupported nested max_blocks setting. Content accepts exactly the shared Heading, Text, Eyebrow and Button theme blocks; children can be added, removed and reordered. Each group owns its nine-position desktop placement, optional mobile placement and responsive gap. Slide owns media and shared content padding. Existing headings and all three images were migrated into the groups, preserving saved positions and padding. Text transition effects now animate whole groups, including their buttons.

Pause/Play renders the shared bare SVG inside a fixed 44px button with an 18px flex-centered icon slot, avoiding inherited icon wrapper sizing. Play has a 1px optical offset; the measured vertical center difference is zero.

Validation: 18 state/render/schema tests pass, JavaScript syntax and diff checks pass; Theme Check reports zero errors and no Shatter offenses. Editor shows Slide → Content → Heading, offers only the four intended child types, and successfully added/rendered a Button beneath the Heading. Group position changes work. Temporary Button and position changes were undone (Save disabled). At 390px both Content groups inherit the intended positions without horizontal overflow.

## Content sizing and spacing controls

Added native Header-compatible Size, Gap and Padding controls to Content: Fit/Fill/Custom width, desktop/mobile max width, independent mobile size, inherited or explicit child alignment, desktop/mobile gap, four-sided padding and optional mobile overrides. Width uses shared size-style/size-style--contain utilities, so custom widths stay inside the Slide's content area. Default settings preserve the existing layout. Slide padding remains the shared outer inset; Content padding applies inside its own group.

Validation: 19 Shatter tests pass, including native schema option/range parity, custom/mobile width mappings, inherited alignment, explicit responsive alignment, inherited padding and explicit mobile zero. Theme Check reports zero errors and no Shatter offenses; diff check passes. Editor displays the controls and accepts Custom width at 820px; temporary settings were undone (Save disabled). The optional toolkit validator remains unavailable due to its missing theme-check-common dependency; Shopify CLI supplies the successful theme validation.
