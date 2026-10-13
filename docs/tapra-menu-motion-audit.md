# Compact menu motion audit

Reference: `/Users/chieutrinh/Downloads/Tapra_demo3_shatter-hero.html`, header CSS near line 333 and controller near line 985. Preview target: `layouthub-template-v2.myshopify.com`, unpublished theme `192263225643` (Tapra/main). This audit follows commit `3cf07399`.

The demo uses a fixed-width menu body, a 600ms shell transition and a 350ms height transition for subsequent panel changes. Its menu content is already in the document. The theme also renders navigation in Liquid; opening the menu does not fetch a menu document.

Source findings and fixes:

- `component-overlay.css` was loaded with `media="print"` and an onload swap. Its motion rules could arrive after the menu controller on a cold, slow connection. It now loads synchronously with preload because the header uses this primary interaction.
- Compact's root ResizeObserver called the complete geometry measurement during every animated width/height frame. Header's general observer also triggered global header/submenu measurements. Compact now coalesces intrinsic-content changes into one animation frame, observes the shell separately for footer positioning, skips redundant CSS-variable writes and avoids the classic header's geometry path.
- Choosing the initial category immediately enabled the 350ms fast-height curve, then removed it after 420ms while the shell's opening transition was still underway. Opening keeps the 600ms curve; subsequent category changes retain fast height adjustment.
- Desktop closing switched to a separate 550ms timeline. It now uses the same 600ms shell/container/row duration as opening. Overlay focus, close lifecycle, keyboard handling, interruption and mobile full-screen behavior remain with their existing controllers.
- Image load and font readiness schedule a content measurement so late assets can update geometry without depending on shell resize callbacks.

Verification: JS syntax and diff checks pass. 31 focused tests pass (Compact scheduling/cleanup, shared overlay lifecycle/gestures, account loading). Theme Check reports zero errors. The scheduling fixture verifies 20 content resize callbacks are coalesced into one measurement, and 20 shell-animation callbacks cause no additional content measurements.

Limits: these are source/runtime-fixture results, not measured browser FPS or network timings. The browser tool refused localhost with `ERR_BLOCKED_BY_CLIENT`; no alternative browser/URL was used to bypass that restriction. Actual cold-load Slow 4G, late-image/font delivery and repeated open/close visual QA remain unverified. Changes are prepared for the unpublished preview; no new Git commit or live publication is part of this audit.

## First-open initialization follow-up

The user subsequently requested direct Chrome inspection. The existing Chrome preview tab was reachable: its drawer was `open`, but Shop, Collections and Support details were all closed. Reopening after controllers had loaded selected Shop, consistent with the deferred Compact controller missing an earlier `open` event.

The primary header controller now selects the first available Compact submenu before opening the overlay on desktop/tablet. Compact initialization also reconciles an already-open drawer, preserving an existing selection. Mobile keeps its drill-down behavior. Runtime fixtures cover both the missing event and independent primary-controller selection; 33 focused tests pass and Theme Check reports zero errors.

The local dev server had stopped and returned `ERR_CONNECTION_REFUSED` after reload; it was restarted on port 9292 against the same unpublished theme. Direct Chrome verification after reload and the first open confirmed Shop active with submenu content visible. No console errors were captured. Screenshot: `/tmp/tapra-first-menu-active.png`. Network throttle settings were left as configured by the user; no numerical FPS/network benchmark is claimed. Earlier browser-access limitations apply to the preceding audit session, not this direct Chrome follow-up.
