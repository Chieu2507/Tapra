# Tapra story demo

- Role/placement: two independent content sections in the home JSON template.
- Rich text: reuse existing static Eyebrow/Heading/Text slots; hide the latter two in the Brand story preset. Dynamic Editorial text owns word reveal, size and width. Existing character reveal remains the default. Section owns alignment, gap, background and responsive padding.
- Interactive media: home-only, explicit Media item allow-list, maximum six stories. Stories stack independently; carousel/expand behavior is outside this first demo.
- Media item: repeatable wrapper with Marquee, Video, Image, Heading, Text, Button/Buttons children. No app slot. Nested Theme Block cardinality cannot be capped by schema; this is an intentional platform WARN. Demo has one Marquee and one Video; item duplication remains coherent.
- Marquee: reuse current renderer/controller, four editable heading items with rich bold numbers. Existing aria-hidden/inert clones, direction, speed, masks and reduced motion remain owned there.
- Video: shared kernel extended through default-off poster glow/vignette/magnetic flags and default-inline playback mode. Popup uses component-overlay for focus, backdrop, Escape, scroll lock and mobile lifecycle; media mounts on click and stops on closing. No parallel dialog.
- Output/lifecycle: stable selectable block wrappers; custom element aborts listeners/observers and cancels rAF on disconnect. Magnetic runs only for fine mouse input and respects reduced motion. Native media and shared typography render in Liquid.
- Empty: use shared image placeholder without a fake play action when source is blank. Demo poster must be a real available store image; a video source must be selected to test playback.
- QA: schema/preset validity, Theme Check, JS syntax, existing compatibility tests, desktop/mobile/breakpoint overflow, word reveal, marquee clones, pointer effect, popup keyboard/close, editor nested settings/re-render and upload.
- Labels: established controls reuse locale keys; new feature-specific labels/preset names remain literal English for this demo, matching existing Editorial text controls (localization follow-up).

## Demo QA — 2026-10-14

- PASS: local Theme Check 0 errors; JS syntax; git diff --check; existing Elara/legacy compatibility suite 11/11.
- PASS: Shopify accepted blocks before sections/template upload; Theme Editor selected nested Video and displayed the new controls. Chose existing elara-inspiration-1.mp4 for temporary playback, saved, then synchronized only its resource value into local index.
- PASS: Media item duplicate/undo in Editor; Save returned disabled. No duplicate item retained.
- PASS: desktop poster 480×320 at 1280 viewport; mobile 295×196.65 at 375; 767/768/1149/1150 all retain 1.5 ratio with no page overflow. Mobile padding 64, tablet/desktop 100 as configured.
- PASS: mouse movement changes magnetic offsets/scale; initial and keyboard position centered. Scroll reveal observed at opacity .28, mixed progression, and 1 after scrolling. Original marquee items accessible, all four loop copies aria-hidden and inert.
- PASS: native video reached readyState 4 and played; Escape paused on closing, removed media after close, and restored focus. Mobile bottom sheet used the shared overlay; backdrop closed and removed media.
- NOT TESTED: external YouTube/Vimeo playback, live OS reduced-motion toggle, all remove/reorder/empty-editor permutations. These remain follow-ups before treating this demo as a finalized catalogue component.
- External source-export validator was rejected by automatic approval review; no retry/export workaround. Used local Theme Check and the authorized store's development upload instead.
- Screenshot: /private/tmp/tapra-story-demo.png. No commit or publication.

## Combined composition — 2026-10-14

Per user approval, the demo now lives in one Interactive media section. A static shared Header (`id: header`) contains dynamic Eyebrow and Editorial text children; no copy of either kernel. Header already allowed Editorial text; its alignment selectors now include that child. Section owns desktop/mobile header-to-media gap independently from item gap. Removed only the demo Rich text instance, retaining the reusable Rich text section/preset. No Section anchor setting. Media behavior and saved video source are retained.

## Media item owns all composition effects — 2026-10-14

User constraint: do not add demo settings to base Video/Marquee/Image blocks. Restored blocks/video.liquid byte-for-byte from HEAD; Marquee and Image were never modified. Migrated playback_mode, poster_glow, blend_edges and magnetic_play to Media item, including presets and the active demo. Parent-scoped CSS applies shared blend to marquee masks plus image/video edge shading and glow to media plus marquee. Parent custom element owns magnetic and intercepts inline play only within popup-mode items; the shared overlay retains dialog lifecycle. Native player clones use controls and stop on closing; the original base player remains paused. No base schema or renderer extension remains.

Validation: local Theme Check 0 errors; existing compatibility tests 11/11; JS syntax and diff checks pass. Browser confirmed parent data flags, marquee mask and video inset shadow, playing popup video (readyState 4), original player paused, Escape pause/cleanup/focus return. External playback and Image-specific visual QA remain not tested.

## Expand to section replaces popup — 2026-10-14

Video playback now offers Inline / Expand to section on Media item. Migrated the active demo and presets from popup to full_section. Removed the item dialog and all ThemeOverlay calls. The parent owns a full-area media layer appended inside its section, animating from the original media rectangle to the section rectangle while leaving document geometry unchanged. Header/marquee fade and become inert while expanded. A section-local collapse button or Escape pauses playback, animates back, removes the clone and returns focus. No modal, backdrop or body scroll lock. Close placement follows the visible portion of the section; reduced motion skips size animation. Base Video/Marquee/Image remain identical to HEAD.

Browser QA PASS: desktop expanded rectangle exactly matched section bounds 1280×789.78; original document height retained, body overflow visible, zero dialogs. Video played; Escape paused and cleanup restored focus/aria-expanded. Mobile 375×648.04 matched the section with no overflow; close remained visible at viewport top 16px. Source remains the temporary store demo film. External video, rapid switching between multiple items and live reduced-motion changes remain follow-ups.

## Section Layout controls — 2026-10-14

Layout follows Section width → Alignment → Customize for mobile → conditional Mobile alignment → Desktop gap → Mobile gap. Existing gap_desktop/gap_mobile IDs now control the Header/media and item-stack gap (16px default); removed the redundant item_gap option. Shared Header and Media item inherit section alignment; no base schema changes. Active demo retains centered alignment with 16px gaps. Browser QA tested desktop left/0px and independent mobile right/4px with no overflow, then restored the demo. Theme Check 0 errors.

### Sticky media zoom (section-owned, 2026-10-14)

- Added optional `sticky_scroll` and conditional `scroll_distance` (50–300% viewport height, default 150). Existing presets remain opt-in; the current demo enables it.
- The section pins a 100svh stage within a taller scroll track. The first Video/Image stays the original block, with a lightweight empty layout slot reserving its initial footprint. Scroll interpolates the actual media rectangle to the stage bounds, removes radius/blend progressively, and fades the Header. Reverse scrolling restores the scene.
- Original media markup, playback listeners, Media item effects and base block settings remain in place. No cloned scroll player, scroll hijacking, new base settings or global animation library.
- Initial media fits the viewport after existing Header, gap and padding; long content with less than 96px available media height falls back to normal flow. Reduced motion also uses normal flow. Missing media leaves the section in normal flow.
- Listeners use AbortController; resize/header changes remeasure; out-of-range unchanged progress skips writes. Editor block selection returns the scene to its initial state until deselection.
- Theme Editor: new section controls render, Scroll distance hides when disabled, undo restores enabled state. Dedicated preview runtime: desktop stage 720px, track 1800px, media reaches 1280×720 with no horizontal overflow; reverse scrolling and Play/Escape work. Mobile 375px stage is 812px, track 2030px, no horizontal overflow.
- Live OS reduced-motion switching, multiple-media sequencing, and external video playback were not runtime-tested. Only the first image/video is the scroll target, explicitly described in the setting.

- Additional QA: temporarily replaced demo Video with the existing keyboard Image, verified normal flow with sticky disabled, then sticky Image zoom to near viewport bounds. Restored the exact Video demo JSON afterward.

### Typed Media items and full-state content (2026-10-14)

- Replaced the section Add block catalogue with Media item image and Media item video. Each block renders one literal static Marquee slot and one matching static media slot; neither is in the dynamic Add block catalogue, so a second marquee or mismatched media cannot be added. Static slots remain editable/hideable. Legacy Media item remains renderable without an Add block preset.
- Shared markup lives in `snippets/interactive-media-item.liquid`; effects/player lifecycle continue to use one controller. Heading/Text/Button/Buttons are the only dynamic content children. No settings were added to Image, Video or Marquee kernels.
- Full content starts invisible/inert. Video reveals it only after expansion completes and a real playing event fires; closing hides it and restores the original blocks. Image reveals it when scroll expansion reaches full size, and hides it on reverse scrolling. Existing blocks are moved, never cloned.
- Media item owns full-content color scheme and overlay opacity. Shared Heading/Text/Button typography and interaction remain intact.
- Retired Marquee Heading from Add block by removing its preset; existing saved references still render. New Marquee/media presets and this demo use Text instead. Existing unrelated saved marquee content is preserved.
- Runtime QA: native Video hidden→full playback content→Close/Escape hidden, desktop and 375px mobile. Temporary typed Image verifies hidden below full progress→visible at full→hidden on reverse. Exact Video demo restored after QA. Theme Editor verifies static Marquee/Image slots (reorder disabled, hide available) and dynamic Add block only Button/Buttons/Heading/Text.
- Regression tests cover slot cardinality/allow-lists, playback-vs-expansion gating, canceled/late playing events and migrated richtext/static IDs. External embedded playback and full editor add/remove/duplicate/save cycles remain untested.

### Marquee control ownership audit (2026-10-14)

- Git history confirms Use Elara layout, top/bottom dividers, blurred edges and parallax were introduced by the Elara rebuild, not the original Marquee kernel.
- Media items now render a fixed `_media-item-marquee` slot exposing shared basic controls only. The slot and general Marquee reuse `snippets/marquee-content.liquid`, `assets/component-marquee.css` and `assets/marquee.js`; no parallel animation implementation.
- Media item owns `marquee_top_divider`, `marquee_bottom_divider`, `marquee_parallax`. The existing `blend_edges` owns the slot fade. Use Elara layout is internal to the slot, not a merchant setting. Attributes are injected server-side before animation initializes.
- Migrated Media item JSON/presets to the new static slot, carrying divider/parallax state to the parent and removing stale Elara-only child settings. General saved Marquee blocks retain their original controls and exact legacy CSS/JS contract.
- Added checks for parent/child setting ownership and server-rendered divider/parallax attributes. Legacy rendering fixtures and all Media item behavior tests pass.

### Scroll-controlled full media content (2026-10-14)

- Follow-up reference audit of Athora's scrolling media: content opacity moves from 0 to partial to 1 while its translateY moves from below toward zero. Observed partial state: opacity 0.312 / translateY 175px, followed by full visibility at the center.
- Updated the sequence: media reaches viewport bounds in the first 60% of the track; content fades/rises during 60–85%, with the remaining track holding the readable state. Reverse scrolling reverses the same progress, without a time-triggered reveal.
- Video preview groups the existing Heading/Text/Button blocks above one preview Play control in the same centered flex stack. The original poster control becomes inert/hidden while this group is present. Preview Play uses the existing player expansion handler; full playback hides that preview control. Close restores the scroll scene and focus.
- Image uses the same content fade/rise without a Play control. Base Image, Video, typography and Button schemas remain unchanged.
- Desktop runtime: partial opacity 0.211 / translateY 198.74px; completed opacity 1 / translateY 0px, group center 359.996px vs frame center 360px. Native Play/Close works and mobile 375×812 keeps the group centered after reveal. Added regression coverage for monotonic/reversible progress and a single preview Play instance.

### Restore Marquee Heading (2026-10-14)
- Re-enabled the existing Heading preset and allowed it in the Media item Marquee slot.
- Restored the four demo statistic items and image/video/section presets to Heading: 92px desktop, 48px mobile, uppercase, strong numbers with muted labels.
- Preserved child IDs, static slot cardinality, parent-owned effects and shared base runtime.
- Validation: 18 scoped tests pass; Theme Check has 0 errors; local browser confirms 92px/48px and the poster/Marquee composition. Screenshot: `/private/tmp/tapra-marquee-heading-restored.png`.

### Clicking video completes sticky zoom (2026-10-14)
- Full-section Play advances the tracked video section to the end of its scroll track; expansion retains its existing animation. Closing leaves the media full, and scrolling backwards can still reverse the zoom.
- Non-sticky sections and untracked Media items retain their behavior.
- 20 scoped tests pass. Browser verified click from partial zoom reaches 1280×720 with zero remaining track; native X click preserves that position. Locator-driven Close introduced its own automatic scroll during QA; native click confirmed the user interaction.

### Multiple Media items in one sticky stage (2026-10-14)
- User correction: independent sticky scenes changed the intended layout. Removed that approach and restored the original shared Header/container/Media item structure.
- One sticky stage stays one viewport high. Scroll distance is multiplied by the Media item count (two items: viewport + 2 × configured distance).
- Segment 1 preserves the original first-poster zoom and content reveal. Following media start at full viewport size below the stage and slide upwards over the previous full media; they do not zoom again. Content appears after the incoming layer arrives.
- Play completes only the clicked video's segment, leaving later segments available. Covered videos pause/collapse, inactive content is inert/hidden from accessibility, and reverse scrolling reverses the stack.
- All layer classes, inline tokens and inert states clean up on disconnect/re-measure; reduced motion and disabled sticky retain normal block flow. No scene wrapper, reparenting, base block setting, or duplicate player was added for stacking.
- QA: 22 scoped tests pass; Theme Check 0 errors. Desktop: one 720px stage, 2880px track for two items; first full stays at top 0 while full-size second layer travels from 720px through 360px to 0. Reverse scrolling restores it. Mobile: both media 375×812, stage stays at top 0 while incoming layer slides. Reversed image/video order and both first/second video Play completion verified. Temporary QA image removed, original demo restored. OS reduced-motion toggle and unsaved Editor add/remove lifecycle not runtime-tested.
- Screenshot: `/private/tmp/tapra-sticky-stacked-media-transition.png` (temporary placeholder image is the incoming layer).

### Continuous outgoing content/overlay (2026-10-14)
- Keep each item's continuous segment progress instead of resetting outgoing items to zero as the next layer begins. Interactivity remains disabled for covered items.
- Content/overlay enter as before, then fade to zero and translate upwards during the next layer's 0–60% entrance. Reverse scrolling restores opacity and translates the copy down from above. Last item remains visible until the sticky section exits naturally.
- Keep the scroll Play group mounted during its zero-opacity exit, preventing the original standalone Play from flashing back.
- Validation: 22 scoped tests pass, including outgoing opacity/travel and reverse progress. Browser measured opacity .498 → .073 while travelling upwards, then .925 on reverse with no console errors. Temporary second image removed after QA. Screenshot `/private/tmp/tapra-sticky-content-exit-fade.png`.

### Image placeholder surface (2026-10-14)
- Shared image markup already includes `placeholder-image` for empty images; Image block's transparent background declaration overrode that shared surface. Restrict the custom background to real images with `:not(.placeholder-image)`.
- Browser confirms the empty Image block has the shared class and a non-transparent token-derived background, both in the poster and full sticky state. Temporary QA image removed. Screenshot: `/private/tmp/tapra-image-placeholder-surface-fixed.png`.

### Scroll-owned video autoplay (2026-10-14)
- User offered autoplay at full zoom as the alternative to a cursor-following Play. Implemented muted autoplay at 60% of an item's segment (full geometry); removed the cloned Play from the content group.
- Native video keeps playing while reverse scrolling shrinks it, then pauses at the original poster position. Covered/offscreen players pause; re-entering full media starts them again. Original mute/control values restore when scroll playback ends, without overriding the configured loop setting.
- Native controls remain available for pause/resume. Manual full-section expansion remains available from the original poster Play; it still completes only that item's segment.
- Async playback epochs prevent late promises from hiding/reviving stopped players. Reduced motion never starts scroll autoplay. Base Image/Video/Marquee settings unchanged.
- Native HTML5 QA: desktop autoplay muted with no content Play; while shrinking, width ~780px and playback still running; at initial position paused and mute restored. Mobile 375×812 autoplay verified. 23 scoped tests pass; JS syntax and whitespace checks pass; no browser console errors. External embeds have muted URL handling but were not runtime-tested. Screenshot `/private/tmp/tapra-sticky-video-autoplay.png`.

### Editor hit targets in expanded media content (2026-10-14)
- Visible overlay intentionally passes pointer events through non-interactive copy on the storefront. That also prevented Heading/Text Theme Block wrappers from being hit by the Theme Editor inspector.
- Restore `pointer-events: auto` for descendants carrying Shopify's actual `data-shopify-editor-block` metadata, including Button wrappers. This is scoped to the visible Media item overlay and leaves storefront hit testing unchanged.
- The original rendered block nodes and their Shopify attributes remain intact when moved into the expanded player; no duplicate metadata or synthetic selection messages added.
- Validation: whitespace check passes. Opened the actual editor and confirmed inspector controls, but this browser connection exposes its storefront iframe as inaccessible about:blank and did not deliver native click/scroll into that preview; direct inspector selection could not be verified through this connection.

### Playback/scroll interaction audit (2026-10-14, current behavior)
- Supersedes the earlier close-at-full behavior: explicit Close restores the exact pre-open scroll fraction and editor preview override. Automatic dismissal when covered/offscreen does not rewind scrolling.
- Partial-zoom clicks expand Full section playback, including after reverse scrolling from autoplay. Inline clicks play at the current geometry and retain their audio state; scrolling continues to control geometry.
- Delay focus on Close until opening finishes to avoid the opening click activating Close. Release editor selection overrides on explicit playback and real scroll interaction.
- Preserve the original overlay/content node throughout opening/closing; do not hide it at either boundary. Fade/travel target follows the restored zoom state. Keep content in the shrinking expansion through intervening scroll events, then return ownership to the poster after animation finishes. Delay scroll autoplay restart until that handoff.
- Collapsing blend opacity follows the current scroll blend instead of always restoring white poster edges. The underlying layout changes visibility without an extra opacity animation.
- Editor UI QA: toggled Sticky media zoom and observed Scroll distance hide/show; changed Inline/Expand to section; added a Media item image alongside video; confirmed fixed Image/Marquee slots and parent-owned effect controls; toggled Blend edges. Removed the test image and restored all tested values without saving/publishing. Direct pointer/scroll interactions inside this connection's nested storefront iframe remain inaccessible; runtime animation QA used the local storefront.
- Local native-pointer QA: partial zoom opens, content becomes visible, closing fades continuously (intermediate overlay opacity .294 with visibility still visible), and returns to the saved zoom. Repeated native clicks restore track top -563px exactly. Non-sticky open/close stays at track top 1px. Locator-driven clicks can introduce their own scroll-into-view movement; native pointer results are authoritative for these cases.
- Existing runtime coverage also includes both item orders, two-item stacking/reverse, outgoing overlay fade, desktop/mobile autoplay and Inline playback without forced completion. External video embeds and OS reduced-motion preference remain unverified in a real browser.
- Validation: 28 scoped behavior/compatibility tests pass, including overlay continuity during close and scroll snapshot restoration. All temporary local template settings restored.

### Persistent media shade (2026-10-14)
- User correction: the configured overlay must stay on the media after closing, independently of content visibility. Moved its shade from the fading content wrapper to the poster/media surface and expanded player surface, both using the same parent-owned opacity value. Base block overlay settings still compose underneath.
- Scroll blend edges now vary only the inset shadow color; they no longer fade the whole media pseudo-element and accidentally remove its shade. Content retains its own scroll reveal.
- Browser verified configured 20% shade before/open/during close/after close; poster layer opacity stays 1 while content opacity changes independently. Screenshot: `/private/tmp/tapra-overlay-kept-after-close.png`. 28 scoped tests pass; Theme Check 0 errors; whitespace check passes.

### Reverse scroll after manual expansion (2026-10-14)
- Reverse scrolling below the manually completed segment hands Full section playback back to its scroll-controlled media without restoring the pre-click scroll snapshot. Explicit Close retains its existing snapshot restoration.
- Native HTML5 handoff preserves currentTime, mute, volume and paused/playing state. The media continues the normal reverse content/zoom sequence and stops at the poster as before. Covered/offscreen dismissal remains separate.
- Browser: partial zoom → Play → full at track -1080px; reverse to -684px releases expansion while preserving playback (9.70s → 9.91s, unmuted), then width decreases 1280 → 1023.70 → 716.14px as track reverses. Persistent 20% shade retained. Screenshot `/private/tmp/tapra-video-reverse-scroll-zoom.png`.
- 29 scoped/compatibility tests pass; JS syntax and whitespace checks pass. No schema or base block change. Embedded video continuity is not runtime-verified.

### Editor selection preserves visible media zoom (2026-10-14)
- The Shopify block-selection handler unconditionally forced the first item's editing progress to 0, collapsing partial zoom when the inspector selected its Video block.
- Visible/active item selection now preserves the current scroll state. Selecting a covered item from the sidebar still reveals that item; Header selection retains its existing preview behavior. Full-content block selection remains untouched.
- Regression covers visible Video selection at .43 progress and selecting/revealing a covered second item. 30 scoped/compatibility tests pass; JS syntax and whitespace checks pass. Direct inspector click in the nested editor preview remains NOT TESTED due the previously recorded browser iframe limitation. No schema, settings or base block changes.

### Base media owns overlay (2026-10-14, supersedes parent shade)
- Removed Media item `content_overlay_opacity` from both typed schemas and saved demo data at the user's request. No automatic migration to base overlay: the current Video did not enable one.
- Poster Image/Video use only their existing shared overlay renderer. Expanded Video copies the resolved `--video-block-overlay` from its source media, preserving disabled, solid and gradient settings through open/close. Removed the extra 20% shade and all `--media-content-overlay` tokens. Content reveal remains independent.
- Browser confirms the current base Video overlay and expanded player are both transparent. 31 scoped/compatibility tests pass, including transparent/solid/gradient inheritance; Theme Check 0 errors; JS syntax/whitespace checks pass. New schema editor sidebar refresh not directly re-tested in this pass.

### Smooth manual open/close (2026-10-14)
- Fixed a reentrant close: restoring the pre-open scroll position synchronously invoked reverse-scroll handoff while activePlayer was still set, hiding the player before the explicit closing animation. Mark closing before restoring scroll.
- Both directions use 600ms with balanced acceleration/deceleration. Closing captures current visual bounds before canceling the opening animation, so an interrupted opening closes from the visible size.
- Reverse-scroll handoff tolerates one pixel of browser scroll rounding at the completed segment, preventing automatic dismissal immediately after opening.
- Browser observed an intermediate opening size, and explicit native Close leaves the player visible with is-collapsing before it becomes hidden after completion. Direct locator actions in this browser sometimes report deadline errors after delivering input; native click was used to verify closing. No debug logging remains.
- 32 scoped/compatibility tests pass, including close reentrancy, visual bounds, hide-after-animation and scroll rounding. Syntax and whitespace checks pass. No schema changes.

### Root surface motion and scroll-only media controls (2026-10-14)
- Added shared root `--motion-duration-surface: 600ms`, `--motion-ease-surface`, and backdrop duration in css-variables. Existing header names are compatibility aliases defined there; removed their second root definition from header CSS.
- Menu shell geometry (including its old fast-height state), cart geometry, shared overlay panels, search and media expansion consume the surface token. Media WAAPI and Compact JS guard/cleanup timers read the inherited CSS value and support ms/s. Media content fade/cleanup uses the matching shared tokens; hover durations and choreography delays remain separate roles.
- Native Shopify Account close retains its component-owned removal timer to prevent truncation; its fallback/easing use shared tokens. This is an intentional external lifecycle constraint, not a promise that all third-party timing is controlled by the theme root.
- Browser computed values: root 600ms; Compact menu three 0.6s geometry transitions; cart/search/video 600ms. No settings changed. 88 scoped Media/Header/Overlay/Cart/Search/compatibility tests pass; Theme Check 0 errors; syntax and whitespace pass. Root timing overrides are exercised by .85s media and .9s Compact JS tests. Full interactive header/cart choreography after this change has not been re-audited across every viewport.
- User requested removing manual Close only for scroll-zoom + Expand to section. Hide the control only inside an actually-ready scroll scene (so non-sticky/reduced-motion fallback retains it). Scroll-owned expansion skips manual Close positioning/Escape restoration and focuses native playback controls; reversing scroll remains the exit path. Image has no manual Close control.
- Browser verified an expanded sticky video has Close display:none and no accessible Close button. Screenshot `/private/tmp/tapra-scroll-video-no-close.png`. Tests cover focus ownership in sticky/non-sticky cases.

### Slower content entrance (2026-10-14)
- Shared root reveal role is now 900ms with a gradual ease (.4,0,.2,1); header content and manually expanded Media item content consume it. Surface geometry remains 600ms. JS reveal cleanup reads the same root duration.
- Scroll-driven content reveals from segment .60 through .95 (previously .85), spreading opacity/travel across 40% more scroll distance. Reverse behavior and outgoing fade remain tied to scroll without time-lag smoothing. Manual collapse content stays within its 600ms geometry transition.
- Browser confirms root surface/reveal values 600/900ms. 58 scoped Media/Header/Overlay tests pass, including partial content at .85 and complete at .95; Theme Check 0 errors; whitespace passes. No settings changed.

### Media item video padding and Content scheme label (2026-10-14)
- Added the existing Group-style four-side padding schema (0–200px, 2px steps, zero defaults) to Media item video, including Customize for mobile and gated mobile values. Shared Media item renderer emits sanitized local padding tokens; responsive CSS inherits desktop when customization is off and preserves explicit mobile zero.
- Padding owns the item composition in normal/poster layout; sticky media still expands to the viewport. No base Video settings or saved item defaults changed.
- Renamed the color-scheme group from Full media content to Content scheme in both typed Media items; content_color_scheme ID/data unchanged.
- Media/compatibility suites passed (34 tests); extended the existing render check for desktop32/mobile0 and disabled-mobile inheritance. Theme Check 0 errors, whitespace passes. Theme Editor padding control interaction and nonzero padding sticky geometry not directly browser-verified in this pass.

### Adaptive content exit for fast scrolling (2026-10-14)
- User rejected a fixed exit duration because it lagged during slow scrolling. Scroll copy now tracks progress directly at low velocity and enables the shared surface-duration opacity/travel transition only on fast fade-out.
- Keep content mounted until a fast zero-opacity exit completes; cancel pending hide on new progress/playback/disconnect. Slow movement removes smoothing immediately. Reduced motion stays immediate. Media geometry is unchanged.
- Velocity samples cap idle time at 80ms so a large single jump after resting is still treated as fast. No new merchant settings or duration values.
- 34 scoped/compatibility tests passed; regression covers slow reverse with no smoothing and fast reverse retaining content until the configured exit duration. JS syntax/whitespace pass. Adaptive timing has not yet been visually re-audited across input devices.

### Main delivery validation (2026-10-14)
- Full repository run: 271 tests, 264 passed and 7 failed under sandbox. Six failures reproduce unchanged on HEAD f6731d1e (collection-color Liquid fixture, removed eyebrow typography expectations, two thumbnail content_for fixtures, normalized scheme source expectation and old Footer fixture). The seventh is sandbox listen EPERM; rerunning preview-supervisor outside sandbox passes all 9 tests. No newly introduced test failure identified.
- Theme Check: 0 errors, 45 warnings. git diff --check passes.
- Delivery includes FAQ, rich text/editorial composition, typed Interactive media, shared Marquee extraction, media placeholders and shared root motion. Existing unrelated Slideshow pagination edit and older untracked audit docs/output remain outside this commit.
- Demo Video selection is intentionally blank at user request. Placeholder retains shared tint layers with a narrower Blend edges shadow; no video-specific parent overlay is restored.


## Sticky clip reveal and Instagram CTA — 2026-10-14

- Replaced first-media resizing with a stable section-sized canvas and a scroll-driven rounded inset clip. Reverse scrolling follows the same clip bounds. Later media retain their full-size slide-over behavior.
- Play positioning, magnetic bounds, placeholder illustration, and blended edges follow the visible clip window. Manual video expansion animates the current clip to the full section using the shared surface motion tokens. Base Image/Video/Marquee settings remain unchanged.
- Added the existing Rich text section before Instagram using static Heading and a standard Button. Restricted Rich text link color inheritance to non-button links so CTA foreground tokens remain effective.
- QA: 36 relevant tests pass; Theme Check has 0 errors / 45 existing warnings; JS syntax and diff whitespace checks pass. Browser tested real uploaded video at partial clip → manual expansion → reverse scroll; mobile viewport 390×844; two-item video/image slide-over; restored the original empty Video demo after QA. Rich text reviewed on desktop and mobile. No direct Theme Editor iframe inspection in this pass.
